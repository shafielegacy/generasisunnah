import sqlite3
import tempfile
import threading
import unittest
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from pathlib import Path

from ecert import MYT, Staging, fingerprint, fixture

class Certificates(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.path=Path(self.tmp.name)/"qa.sqlite"
        self.grants=[(r,r,fingerprint(r)) for r in ("owner","reviewer","staff")]
        self.clock=lambda: datetime(2026,12,7,tzinfo=MYT)
        self.s=Staging(self.path,self.grants,self.clock)
        self.addCleanup(self.s.db.close)
        self.people,self.events=fixture()
    def seed(self):
        self.s.seed("owner",self.people,self.events)
    def row(self,i=0):
        return self.s.dashboard("reviewer")["rows"][i]
    def ready(self):
        self.seed()
        self.s.close_batch("staff",1)
        self.s.approve("owner","QA-R1")
        self.s.generate("staff","QA-R1")
    def test_mixed_methods_two_days(self):
        self.seed();self.assertEqual(self.row()["eligibility"],"ELIGIBLE")
    def test_one_day(self):
        self.seed();self.assertEqual(self.row(1)["eligibility"],"NOT_ELIGIBLE")
    def test_none(self):
        self.seed();self.assertEqual(self.row(2)["days"],[])
    def test_batch_two_dates(self):
        self.events=[dict(e,id="b"+e["id"],session=e["session"].replace("b1","b2"),
                          time=e["time"].replace("11-28","12-05").replace("11-29","12-06"),
                          receipt="QA-R3") for e in self.events[:2]]
        self.seed();self.assertEqual(self.row(2)["eligibility"],"ELIGIBLE")
    def test_mixed_batch(self):
        self.events[1]["session"]="b2d2";self.seed();self.assertIn("SESI_BATCH",self.row()["reasons"])
    def test_repeat_scan_not_two_days(self):
        self.events[1]=dict(self.events[0],id="QA-another")
        self.seed();self.assertEqual(self.row()["days"],["b1d1"])
    def test_exact_repeat_event(self):
        self.events.append(self.events[0]);self.seed();self.assertEqual(self.row()["eligibility"],"ELIGIBLE")
    def test_conflicting_id(self):
        self.events[1]["id"]=self.events[0]["id"];self.seed();self.assertEqual(self.row()["eligibility"],"REVIEW")
    def test_duplicate_receipt(self):
        self.people[1]["receipt"]=" qa-r1 ";self.seed();self.assertIn("RESIT",self.row()["reasons"])
    def test_duplicate_certificate(self):
        self.people[1]["certificate"]="qa-s1";self.seed();self.assertIn("NO_SIJIL",self.row()["reasons"])
    def test_missing_fields(self):
        self.people[0].update(receipt="",certificate="",name="",email="",batch=9)
        self.seed();self.assertEqual(len(self.row()["reasons"]),5)
    def test_unknown_method(self):
        self.events[1]["method"]="OTHER";self.seed();self.assertEqual(self.row()["eligibility"],"REVIEW")
    def test_date_outside(self):
        self.events[1]["time"]="2026-11-30T01:00:00+08:00";self.seed()
        self.assertEqual(self.row()["eligibility"],"REVIEW")
    def test_timezone(self):
        self.events[1]["time"]="2026-11-28T17:00:00+00:00";self.seed()
        self.assertEqual(self.row()["eligibility"],"ELIGIBLE")
    def test_invalid_date(self):
        self.events[0]["time"]="invalid";self.seed();self.assertEqual(self.row()["eligibility"],"REVIEW")
    def test_shared_name_email(self):
        self.people[1]["name"]=self.people[0]["name"];self.seed()
        self.assertEqual(self.row(1)["eligibility"],"NOT_ELIGIBLE")
    def test_orphan(self):
        self.events[0]["receipt"]="QA-missing";self.seed()
        with self.assertRaises(ValueError):self.s.close_batch("owner",1)
    def test_bad_recipient(self):
        self.people[0]["email"]="a,b@example.invalid";self.seed()
        self.assertIn("EMEL",self.row()["reasons"])
    def test_no_production_input(self):
        self.people[0]["email"]="a@example.com"
        with self.assertRaises(ValueError):self.seed()
    def test_existing_output_held(self):
        self.people[0]["previous_output"]=True;self.seed()
        self.assertIn("OUTPUT_SEDIA_ADA",self.row()["reasons"])
    def test_no_secrets_or_email_in_dashboard(self):
        self.seed();self.assertNotIn("@",str(self.s.dashboard("staff")))
    def test_authorisation(self):
        self.seed()
        with self.assertRaises(PermissionError):self.s.dashboard("bad")
        with self.assertRaises(PermissionError):self.s.close_batch("reviewer",1)
    def test_correction_history(self):
        self.seed()
        with self.assertRaises(ValueError):self.s.correct("staff","QA-R2","b1d2",True," ")
        self.s.correct("reviewer","QA-R2","b1d2",True,"Semakan senarai QA")
        self.assertEqual(self.row(1)["eligibility"],"ELIGIBLE")
        self.s.correct("staff","QA-R2","b1d2",False,"Salah padanan QA")
        self.assertEqual(self.row(1)["eligibility"],"NOT_ELIGIBLE")
        self.assertEqual(self.s.db.execute("SELECT count(*) FROM audit WHERE action='CORRECTION'").fetchone()[0],2)
    def test_early_close(self):
        self.seed();self.s.now=lambda:datetime(2026,11,28,tzinfo=MYT)
        with self.assertRaises(ValueError):self.s.close_batch("owner",1)
    def test_before_confirmation(self):
        self.seed()
        with self.assertRaises(ValueError):self.s.approve("owner","QA-R1")
        self.s.close_batch("staff",1)
        with self.assertRaises(ValueError):self.s.generate("owner","QA-R1")
        with self.assertRaises(ValueError):self.s.approve("owner","QA-R2")
    def test_closed_freeze(self):
        self.seed();self.s.close_batch("staff",1);self.s.close_batch("staff",1)
        self.assertEqual(self.row()["issuance"],"PENDING_APPROVAL")
        with self.assertRaises(ValueError):self.s.correct("staff","QA-R2","b1d2",True,"QA")
    def test_pdf_synthetic(self):
        self.ready();blob=self.s.db.execute("SELECT pdf FROM issue").fetchone()[0]
        self.assertTrue(blob.startswith(b"%PDF"));self.assertIn(b"%%EOF",blob)
        with self.assertRaises(ValueError):self.s.generate("owner","QA-R1")
    def test_retry(self):
        self.ready();self.s.deliver_mock("staff","QA-R1","failure_before_send")
        self.s.deliver_mock("owner","QA-R1");self.assertEqual(self.row()["issuance"],"SENT")
        with self.assertRaises(ValueError):self.s.deliver_mock("owner","QA-R1")
    def test_retry_cap(self):
        self.ready()
        for _ in range(3):self.s.deliver_mock("owner","QA-R1","failure_before_send")
        with self.assertRaises(ValueError):self.s.deliver_mock("owner","QA-R1")
    def test_unknown(self):
        self.ready();self.s.deliver_mock("staff","QA-R1","unknown")
        with self.assertRaises(ValueError):self.s.deliver_mock("owner","QA-R1")
        with self.assertRaises(PermissionError):self.s.reconcile("reviewer","QA-R1","QA")
        with self.assertRaises(ValueError):self.s.reconcile("owner","QA-R1","")
        self.s.reconcile("owner","QA-R1","Bukti simulasi")
        self.assertEqual(self.row()["issuance"],"SENT")
        self.assertEqual(self.s.db.execute("SELECT count(*) FROM outbox").fetchone()[0],0)
    def test_concurrent_send(self):
        self.ready();gate=threading.Barrier(2)
        def send():
            s=Staging(self.path,self.grants,self.clock)
            try:
                gate.wait(timeout=10)
                s.deliver_mock("staff","QA-R1");return True
            except ValueError: return False
            finally:s.db.close()
        with ThreadPoolExecutor(max_workers=2) as pool:
            self.assertEqual(sorted(pool.map(lambda _:send(),range(2))),[False,True])
        self.assertEqual(self.s.db.execute("SELECT count(*) FROM outbox").fetchone()[0],1)
    def test_restart(self):
        self.ready();self.s.deliver_mock("owner","QA-R1","unknown")
        s=Staging(self.path,self.grants,self.clock)
        try:
            self.assertEqual(s.dashboard("staff")["rows"][0]["issuance"],"SEND_UNKNOWN")
            with self.assertRaises(ValueError):s.deliver_mock("owner","QA-R1")
        finally:s.db.close()
    def test_no_second_seed(self):
        self.seed()
        with self.assertRaises(sqlite3.IntegrityError):self.seed()
    def test_recipient_from_approved_registration(self):
        self.people[0]["email"]="specific@example.invalid";self.ready()
        self.s.deliver_mock("staff","QA-R1")
        self.assertEqual(tuple(self.s.db.execute("SELECT registered_recipient,destination FROM outbox").fetchone()),
                         ("specific@example.invalid","sink@example.invalid"))
    def test_skip_other_batch(self):
        self.seed();self.s.close_batch("staff",1);self.assertIsNone(self.row(2)["issuance"])
    def test_batch_change_needs_review(self):
        self.people[0]["batch"]=2;self.seed();self.assertEqual(self.row()["eligibility"],"REVIEW")
    def test_pdf_transaction_failure(self):
        from unittest.mock import patch
        self.seed();self.s.close_batch("staff",1);self.s.approve("owner","QA-R1")
        with patch("ecert.Canvas.save",side_effect=OSError("QA")):
            with self.assertRaises(OSError):self.s.generate("owner","QA-R1")
        self.assertEqual(self.row()["issuance"],"APPROVED")
        self.s.generate("owner","QA-R1");self.assertEqual(self.row()["issuance"],"GENERATED")
