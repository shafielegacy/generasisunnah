"""GS26 offline staging service. Every data row and delivery is synthetic."""
import hashlib
import hmac
import io
import json
import re
import sqlite3
from collections import Counter, defaultdict
from contextlib import contextmanager
from datetime import date, datetime, timedelta, timezone

from reportlab.pdfgen.canvas import Canvas

MYT = timezone(timedelta(hours=8))
DAYS = {
    1: {"b1d1": date(2026, 11, 28), "b1d2": date(2026, 11, 29)},
    2: {"b2d1": date(2026, 12, 5), "b2d2": date(2026, 12, 6)},
}
METHODS = {"QR PESERTA", "URUS SETIA"}
def norm(value):
    return str(value or "").strip().upper()

def fingerprint(token):
    return hashlib.sha256(token.encode()).hexdigest()

def fixture():
    def person(n, batch):
        return dict(receipt=f"QA-R{n}", certificate=f"QA-S{n}", name=f"Peserta Demo {n}",
                    email="penjaga@example.invalid", batch=batch)
    def event(n, day, method):
        session = f"b1d{day}"
        return dict(id=f"QA-E{n}-{day}", receipt=f"QA-R{n}", session=session, method=method,
                    time=f"{DAYS[1][session]}T09:00:00+08:00", actor="QA")
    return ([person(1,1), person(2,1), person(3,2)],
            [event(1,1,"QR PESERTA"), event(1,2,"URUS SETIA"), event(2,1,"QR PESERTA")])

class Staging:
    """SQLite serialises transitions. Grants are server-side token digests."""
    def __init__(self, path, grants, now=None):
        self.db = sqlite3.connect(path, timeout=8, isolation_level=None)
        self.db.row_factory = sqlite3.Row
        self.grants = grants
        self.now = now or (lambda: datetime.now(MYT))
        self.db.executescript("""
        CREATE TABLE IF NOT EXISTS source(id INTEGER PRIMARY KEY CHECK(id=1), data TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS correction(receipt TEXT, session TEXT, present INTEGER,
          PRIMARY KEY(receipt,session));
        CREATE TABLE IF NOT EXISTS closure(batch INTEGER PRIMARY KEY);
        CREATE TABLE IF NOT EXISTS issue(receipt TEXT PRIMARY KEY, cert TEXT NOT NULL UNIQUE,
          batch INTEGER NOT NULL, status TEXT NOT NULL, pdf BLOB, attempts INTEGER DEFAULT 0);
        CREATE TABLE IF NOT EXISTS outbox(receipt TEXT PRIMARY KEY, registered_recipient TEXT NOT NULL, destination TEXT NOT NULL);
        CREATE TABLE IF NOT EXISTS audit(id INTEGER PRIMARY KEY, time TEXT, actor TEXT,
          action TEXT, target TEXT, detail TEXT);
        """)

    @contextmanager
    def transaction(self, token, roles):
        identity = next(((actor, role) for actor, role, digest in self.grants
                         if hmac.compare_digest(digest, fingerprint(token))), None)
        if not identity or identity[1] not in roles:
            raise PermissionError("Akses ditolak")
        self.db.execute("BEGIN IMMEDIATE")
        try:
            yield identity[0]
            self.db.commit()
        except BaseException:
            self.db.rollback()
            raise

    def log(self, actor, action, target, detail=""):
        self.db.execute("INSERT INTO audit(time,actor,action,target,detail) VALUES(?,?,?,?,?)",
                        (self.now().isoformat(), actor, action, str(target), detail))

    def seed(self, token, people, events):
        # No connector/import for live data. Blank IDs and bad email syntax may be tested.
        if any((p["receipt"] and not norm(p["receipt"]).startswith("QA-")) or
               (p["certificate"] and not norm(p["certificate"]).startswith("QA-")) or
               ("@" in p["email"] and not p["email"].lower().endswith("@example.invalid"))
               for p in people):
            raise ValueError("Gunakan identiti QA dan domain example.invalid")
        with self.transaction(token, {"owner"}) as actor:
            self.db.execute("INSERT INTO source VALUES(1,?)", (json.dumps([people,events]),))
            self.log(actor, "SEED_MOCK", "QA")

    def _snapshot(self):
        people, events = json.loads(self.db.execute("SELECT data FROM source WHERE id=1").fetchone()[0])
        receipts = Counter(norm(p["receipt"]) for p in people)
        certs = Counter(norm(p["certificate"]) for p in people)
        ids = defaultdict(set)
        by_receipt = defaultdict(list)
        for event in events:
            ids[event["id"]].add(tuple(event.get(k,"") for k in ("receipt","session","method","time","actor")))
            by_receipt[norm(event["receipt"])].append(event)
        edits = {(r[0],r[1]): bool(r[2]) for r in self.db.execute("SELECT * FROM correction")}
        rows = []
        for p in people:
            receipt, cert, batch = norm(p["receipt"]), norm(p["certificate"]), p["batch"]
            errors, valid = set(), set()
            sessions = DAYS.get(batch,{})
            if not receipt or receipts[receipt] != 1: errors.add("RESIT")
            if not cert or certs[cert] != 1: errors.add("NO_SIJIL")
            if p.get("previous_output"): errors.add("OUTPUT_SEDIA_ADA")
            if not p["name"].strip(): errors.add("NAMA")
            if not sessions: errors.add("BATCH")
            if not re.fullmatch(r"[^\s,;@<>]+@example\.invalid",p["email"].strip(),re.I):
                errors.add("EMEL")
            for e in by_receipt[receipt]:
                session = e["session"]
                if session not in sessions:
                    errors.add("SESI_BATCH")
                    continue
                if (receipt,session) in edits:
                    continue
                try:
                    t = datetime.fromisoformat(e["time"])
                    correct_date = t.tzinfo is not None and t.astimezone(MYT).date() == sessions[session]
                except (TypeError, ValueError):
                    correct_date = False
                if (not e["id"] or len(ids[e["id"]]) != 1 or e["method"] not in METHODS
                        or not e["actor"] or not correct_date):
                    errors.add("SEMAK_"+session)
                else:
                    valid.add(session)
            for session in sessions:
                if (receipt,session) in edits and edits[receipt,session]:
                    valid.add(session)
            status = "REVIEW" if errors else ("ELIGIBLE" if len(valid)==2 else "NOT_ELIGIBLE")
            rows.append(dict(receipt=receipt, certificate=cert, batch=batch, days=sorted(valid),
                             eligibility=status, reasons=sorted(errors)))
        orphans = [e["session"] for e in events if norm(e["receipt"]) not in receipts or not norm(e["receipt"])]
        return rows, orphans

    def dashboard(self, token):
        with self.transaction(token, {"reviewer","owner","staff"}) as _:
            rows, orphans = self._snapshot()
            issued = dict(self.db.execute("SELECT receipt,status FROM issue").fetchall())
            for r in rows:
                r["issuance"] = issued.get(r["receipt"])
            return dict(rows=rows, orphan_sessions=orphans,
                        closed=[r[0] for r in self.db.execute("SELECT batch FROM closure")])

    def correct(self, token, receipt, session, present, reason):
        receipt = norm(receipt)
        with self.transaction(token, {"reviewer","staff","owner"}) as actor:
            matches = [r for r in self._snapshot()[0] if r["receipt"]==receipt]
            if len(matches)!=1 or not receipt or session not in DAYS.get(matches[0]["batch"],{}):
                raise ValueError("Padanan resit dan sesi tidak unik atau tidak sah")
            if self.db.execute("SELECT 1 FROM closure WHERE batch=?", (matches[0]["batch"],)).fetchone():
                raise ValueError("Batch telah disahkan")
            if type(present) is not bool or not reason.strip():
                raise ValueError("Nyatakan keputusan dan alasan")
            before = self.db.execute("SELECT present FROM correction WHERE receipt=? AND session=?",
                                     (receipt,session)).fetchone()
            self.db.execute("INSERT OR REPLACE INTO correction VALUES(?,?,?)",(receipt,session,present))
            self.log(actor,"CORRECTION",receipt,json.dumps(dict(session=session,previous_overlay=
                     bool(before[0]) if before else None,previous_effective=session in matches[0]["days"],
                     present=present, reason=reason.strip())))

    def close_batch(self, token, batch):
        with self.transaction(token, {"staff","owner"}) as actor:
            if batch not in DAYS or self.now().astimezone(MYT).date() < max(DAYS[batch].values()):
                raise ValueError("Hari kedua belum tiba")
            if self.db.execute("SELECT 1 FROM closure WHERE batch=?",(batch,)).fetchone(): return
            rows, orphans = self._snapshot()
            known = set(DAYS[1]) | set(DAYS[2])
            if any(s in DAYS[batch] or s not in known for s in orphans):
                raise ValueError("Semak check-in tanpa padanan")
            self.db.execute("INSERT INTO closure VALUES(?)",(batch,))
            for row in rows:
                if row["batch"]==batch and row["eligibility"]=="ELIGIBLE":
                    self.db.execute("INSERT INTO issue(receipt,cert,batch,status) VALUES(?,?,?,'PENDING_APPROVAL')",
                                    (row["receipt"],row["certificate"],batch))
            self.log(actor,"BATCH_CONFIRMED",batch)

    def approve(self, token, receipt):
        with self.transaction(token, {"staff","owner"}) as actor:
            n=self.db.execute("UPDATE issue SET status='APPROVED' WHERE receipt=? AND status='PENDING_APPROVAL'",
                              (norm(receipt),)).rowcount
            if n!=1: raise ValueError("Peserta tiada dalam senarai menunggu kelulusan")
            self.log(actor,"APPROVED",norm(receipt))

    def generate(self, token, receipt):
        receipt=norm(receipt)
        with self.transaction(token, {"staff","owner"}) as actor:
            row=self.db.execute("SELECT * FROM issue WHERE receipt=?",(receipt,)).fetchone()
            if not row or row["status"]!="APPROVED": raise ValueError("Kelulusan diperlukan")
            people=json.loads(self.db.execute("SELECT data FROM source").fetchone()[0])[0]
            p=next(p for p in people if norm(p["receipt"])==receipt)
            self.db.execute("UPDATE issue SET status='GENERATING' WHERE receipt=?",(receipt,))
            self.log(actor,"GENERATING",receipt)
            output=io.BytesIO()
            pdf=Canvas(output, pagesize=(842,595))
            pdf.setFont("Helvetica-Bold",24)
            pdf.drawCentredString(421,400,"QA SAHAJA - GENERASI SUNNAH 2026")
            pdf.setFont("Helvetica",18)
            pdf.drawCentredString(421,320,p["name"])
            pdf.drawCentredString(421,270,f"Batch {row['batch']}  |  {row['cert']}")
            pdf.save()
            self.db.execute("UPDATE issue SET pdf=?,status='GENERATED' WHERE receipt=?",
                            (output.getvalue(),receipt))
            self.log(actor,"GENERATED",receipt)

    def deliver_mock(self, token, receipt, outcome="accepted"):
        receipt=norm(receipt)
        with self.transaction(token, {"staff","owner"}) as actor:
            row=self.db.execute("SELECT status,attempts FROM issue WHERE receipt=?",(receipt,)).fetchone()
            if not row or row[0] not in {"GENERATED","ERROR"} or row[1]>=3:
                raise ValueError("Penghantaran disekat")
            if outcome not in {"accepted","failure_before_send","unknown"}: raise ValueError("Outcome QA")
            result={"accepted":"SENT","failure_before_send":"ERROR","unknown":"SEND_UNKNOWN"}[outcome]
            if result=="SENT":
                people=json.loads(self.db.execute("SELECT data FROM source").fetchone()[0])[0]
                parent=next(p["email"].strip() for p in people if norm(p["receipt"])==receipt)
                self.db.execute("INSERT INTO outbox VALUES(?,?,?)",(receipt,parent,"sink@example.invalid"))
            self.db.execute("UPDATE issue SET status=?, attempts=attempts+1 WHERE receipt=?",(result,receipt))
            self.log(actor,result,receipt,outcome)

    def reconcile(self,token,receipt,evidence):
        # Positive confirmation only. An uncertain send is never re-queued.
        with self.transaction(token,{"owner"}) as actor:
            if not evidence.strip(): raise ValueError("Perlu bukti penghantaran")
            receipt=norm(receipt)
            n=self.db.execute("UPDATE issue SET status='SENT' WHERE receipt=? AND status='SEND_UNKNOWN'",
                              (receipt,)).rowcount
            if not n: raise ValueError("Tiada penghantaran tidak pasti")
            self.log(actor,"SENT_CONFIRMED",receipt,evidence.strip())
