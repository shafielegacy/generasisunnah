"""Private, local staging console. Run python console.py --help."""
import argparse
import getpass
import json
import os
from datetime import datetime

from ecert import MYT, Staging, fixture

def main():
    parser=argparse.ArgumentParser(description="Konsol sijil GS26 · QA setempat")
    parser.add_argument("--db", default="ecert.qa.sqlite")
    parser.add_argument("--date", type=datetime.fromisoformat, help="Jam simulasi QA, contoh 2026-12-07")
    sub=parser.add_subparsers(dest="action", required=True)
    for name in ("seed","senarai","log"): sub.add_parser(name)
    sub.add_parser("sahkan-batch").add_argument("batch",type=int,choices=[1,2])
    for name in ("lulus","jana","hantar-mock","rekonsiliasi","betulkan"):
        cmd=sub.add_parser(name)
        cmd.add_argument("receipt")
        if name=="hantar-mock":
            cmd.add_argument("--outcome",choices=["accepted","failure_before_send","unknown"],default="accepted")
        if name=="betulkan":
            cmd.add_argument("session")
            cmd.add_argument("keputusan",choices=["hadir","tidak-hadir"])
        if name in ("betulkan","rekonsiliasi"): cmd.add_argument("alasan")
    args=parser.parse_args()
    grants=[]
    for role in ("owner","reviewer","staff"):
        digest=os.environ.get("GS_QA_"+role.upper()+"_SHA256","")
        if digest:
            if len(digest)!=64 or digest in [grant[2] for grant in grants]:
                parser.error("Digest QA mesti unik untuk setiap operator")
            grants.append(("operator-qa-"+role,role,digest))
    if not grants: parser.error("Tetapkan digest operator QA mengikut README")
    token=getpass.getpass("Kunci operator QA: ")
    os.umask(0o077)
    sim_time=args.date.replace(tzinfo=MYT) if args.date and args.date.tzinfo is None else args.date
    svc=Staging(args.db,grants,(lambda:sim_time) if sim_time else None)
    try:
        if args.action=="seed": svc.seed(token,*fixture())
        elif args.action=="senarai": print(json.dumps(svc.dashboard(token),indent=2))
        elif args.action=="sahkan-batch": svc.close_batch(token,args.batch)
        elif args.action=="lulus": svc.approve(token,args.receipt)
        elif args.action=="jana": svc.generate(token,args.receipt)
        elif args.action=="hantar-mock": svc.deliver_mock(token,args.receipt,args.outcome)
        elif args.action=="betulkan":
            svc.correct(token,args.receipt,args.session,args.keputusan=="hadir",args.alasan)
        elif args.action=="rekonsiliasi": svc.reconcile(token,args.receipt,args.alasan)
        elif args.action=="log":
            with svc.transaction(token,{"owner","staff","reviewer"}):
                for r in svc.db.execute("SELECT * FROM audit ORDER BY id"): print(dict(r))
    finally:
        svc.db.close()

if __name__=="__main__": main()
