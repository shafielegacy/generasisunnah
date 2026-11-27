# Native eCERT Phase 3 · Reliability and crash recovery QA

**27 November 2026 · Google integration checkpoint · production HOLD**

## Baseline

Starting commit 0c4ace47918b81a1e538d93491ee764d0408f663, Draft PR #5, branch staging/ecert-phase2-google-qa. PR #5 remains open and Draft. Its completed 32 Google assertions, successful PDF and ledger are preserved in the Phase 2 resources. Phase 3 uses a fresh project, source, ledger, certificate identities and output folder.

Phase 2 GitHub Actions run [45992859807](https://github.com/shafielegacy/generasisunnah/actions/runs/45992859807), on the exact baseline commit, is successful. The earlier connector returned an empty result because its workflow-run wrapper filters pull-request events. The Actions page shows the push-triggered success.

## Implemented reliability controls

- An Attempt_ID is written to the APPROVED ledger row before generation. A permanent project-bound reservation is saved before any Drive write. Ledger generation transitions, audit details, Slides names and PDF names retain that identity.
- Generation holds the same project's ScriptLock across reservation, Drive operations and finalisation. Repeated requests reject permanent reservations. No expiry silently releases a reservation.
- Phase 3 adds explicit Attempt_ID, Slides_ID and PDF_SHA256 ledger columns. It requires a fresh ledger. Phase 2 ledger headers and historical evidence remain unchanged.
- Failure after PDF creation records REVIEW_REQUIRED where storage is available. PDF ID and hash remain in properties and ledger evidence. If an execution is terminated before catch, the permanent reservation still prevents replacement generation.
- ecReconcileQa is read-only. It checks the project/resource binding, current eligibility and frozen batch, ledger identity, attempt properties, output folder, filenames, hashes and audit records. It never creates, deletes, renames or overwrites output.
- Ambiguous output, a conflicting PDF reference or a hash mismatch returns REVIEW_REQUIRED in the reconciliation report. A conclusive report requires manual approval.
- ecRecoverExistingPdfQa is a separate write operation. It requires a recovery-authorised operator, exact Attempt_ID, unchanged evidence hash, a review reason and LINK_EXISTING_PDF_ONLY confirmation. It links an already-created PDF. It cannot issue a replacement.
- Active and effective Google identity must match. Configuration is bound to ScriptApp.getScriptId. Recovery operators have a separate allowlist. E-mail remains unconditionally disabled.

## Tests and current evidence

| Item | Status at this checkpoint |
| --- | --- |
| Existing eligibility Node tests | 25 PASS |
| Phase 2 regression Node tests | 10 PASS |
| Phase 3 reliability Node tests | 22 PASS, Google services mocked |
| Combined source syntax and git diff check | PASS locally |
| Phase 3 GitHub Actions | PASS, [run 45999575777](https://github.com/shafielegacy/generasisunnah/actions/runs/45999575777), code commit 523054d97755f119d895b6bf42223528dceb33ca |
| Actual overlapping Google executions | PASS, overlapping executions recorded below |
| Post-PDF failure with Google Drive | PASS, actual isolated Google resources |
| Read-only Google reconciliation and explicit recovery | PASS, actual isolated Google resources |
| Batch 2 Google generation | PASS, actual isolated Google resources |
| Actual Apps Script service timeout | NOT VERIFIED |

OWNER completed Google authorisation. All resources below were created in a fresh standalone QA project. Email transport remained disabled. The preparation run and Phase 2 evidence are preserved. Final code adds COMPLETE/NO_ACTION for a consistent finished issuance and retains REVIEW_REQUIRED for inconsistent evidence.

## Actual Google run procedure

1. OWNER completes Google authorisation for the new standalone QA project.
2. Run phase3Prepare. It creates fresh fictional source and ledger, copies the verified Phase 2 QA template, closes both batches using simulated Malaysia dates and approves individual QA identities. Batch 2 closure at 6 December 23:59:59 must reject; 7 December 00:00:00 must pass. One-day Batch 2 participant must reject approval.
3. Open two editor tabs for the same project. Select phase3ConcurrentA in one and phase3ConcurrentB in the other before starting. A holds ScriptLock for 30 seconds after permanent reservation. Start B while A is running. Compare request-entered and completed timestamps and Google execution records. Concurrency stays NOT VERIFIED unless real overlap is observed.
4. Run phase3PostPdfFailure once. It injects failure after one PDF is created and before GENERATED finalisation, then verifies repeated generation is refused. Inspect the read-only report and the PDF.
5. Run phase3ConflictEvidence to inject a conflicting QA ledger PDF reference and verify REVIEW_REQUIRED and rejection of recovery. The test restores only the original ledger reference and records both fixture mutations. It never changes PDF bytes or deletes files.
6. After explicit OWNER QA authorisation and review of the actual report and PDF, invoke the separate recovery operation with that exact Attempt_ID and evidence hash. Verify the PDF ID/hash/file count stays the same and the ledger becomes GENERATED.
7. Run phase3BatchTwo once and inspect its PDF, ledger and duplicate refusal.
8. Optionally stop phase3InterruptA from the Google execution UI after LOCK_HELD is logged and before any Drive write. Read the abandoned reservation and refuse a repeat. This is a deliberate cancellation test; it must not be described as a natural Apps Script timeout.

## Security findings and limits

The lock is scoped to one Apps Script project. Multiple independent projects writing the same ledger are outside the guarantee. The configured resource/project binding and exclusive ownership of the QA writer are important controls. Shared Sheets and Drive writes are not a multi-service transaction.

A project editor can alter code, operator lists or properties. This trusted editor-run QA does not establish production separation of duties or tamper-resistant audit. Script Properties have finite storage capacity and must be retained with the issuance ledger; deleting a reservation is not a retry procedure.

Known official IDs remain denial guards in Engine.gs. The new fixture bootstrap reads a verified Phase 2 QA template copy. It never opens the official registration or attendance workbook. There are no public write handlers, email transport, scheduled triggers, deployment commands or bulk issuance.

Production V7, Pages, AutoCrat and Claude UI V2 are outside this branch's changes. Recovery execution must remain separate from read-only reconciliation. Production release remains HOLD pending actual evidence and owner review.

## Executed Google evidence — 27 November 2026, MYT

### Real overlapping executions

| Execution | Actual start | Actual end | Result |
| --- | --- | --- | --- |
| phase3ConcurrentA | 20:39:05 | 20:39:54 | GENERATED, duration 49.521 seconds |
| phase3ConcurrentB | 20:39:06 | 20:39:23 | Lock refusal, duration 16.494 seconds |

Request A entered at 12:39:06.046Z, request B entered at 12:39:06.906Z. A logged LOCK_HELD at 12:39:10.848Z; B exited at 12:39:22.942Z while A remained running. The Apps Script Executions page independently displayed the overlapping completed runs. B did not reserve an identity or create output. One Slides copy and one PDF exist for the concurrent certificate. This is actual same-project Google concurrency evidence. Local mock lock assertions are recorded separately.

### Failure, reconciliation and recovery

- 20:40:22–20:40:40 — AFTER_PDF controlled fault. One existing PDF retained. Ledger became REVIEW_REQUIRED and a second generation request was blocked.
- 20:43:29–20:43:42 — conflicting ledger PDF reference caused REVIEW_REQUIRED and recovery rejection. The fixture restored only its original ledger reference, with both changes audited. PDF files were not changed.
- 20:45:16–20:45:31 — separately invoked recovery using manually reviewed Attempt ID, evidence hash and explicit confirmation. Ledger became GENERATED while PDF ID, SHA-256 and count remained unchanged. Re-generation was rejected.
- Recovery review evidence hash was 44d01f7bec5347adfcf2dd581e907bf35b712437de6f1fbed6154a508214a591. It is historical evidence, not a reusable recovery token.
- 20:40:55–20:41:05 — phase3InterruptA deliberately cancelled after reservation and before Drive writes. Ledger remains GENERATING, permanent reservation remains RESERVED and the read-only report requires REVIEW_REQUIRED. No output exists for this identity.
- The first interruption inspection at 20:41:21 failed because the ScriptLock was still busy after cancellation. No lock bypass or reservation reset occurred. The later read-only inspection at 20:43:04 succeeded and explicit generation remained blocked. Natural Apps Script timeout is NOT VERIFIED.

### Batch 2 and final state

Preparation completed at 20:38:24. Simulated Asia/Kuala_Lumpur closure at 6 December 2026 23:59:59 was rejected; 7 December 00:00 was accepted. A fictional one-day participant was NOT_ELIGIBLE and approval was refused. Four other fictional participants had both registered-batch days.

phase3BatchTwo ran 20:45:52–20:46:18. It generated one PDF and rejected the repeated generation attempt. The viewer showed one page, PESERTA QA BATCH DUA, Batch 2 — QA, QA-P3-SB2 and the visible red UJIAN SAHAJA — TIDAK SAH watermark. Concurrent and post-PDF certificates were also visually checked.

Final verified inventory is three PDFs, three Slides copies, four distinct attempt identities, three GENERATED ledger rows and one held GENERATING row. Source inspection reported sourceUnchanged=true. Triggers UI showed 0 triggers. No deployment or email operation was performed.

| Identity | Attempt ID | PDF ID | SHA-256 |
| --- | --- | --- | --- |
| QA-P3-CONCURRENT | 7f1f5cad-17a7-4cf7-bf0f-f291e1eaaa8b | 1gza6Lk9cLwgVaTTiCcWk7Fxnn5XwGfFT | 4144d304ee73807d84288fc9120e2f026eb0d17718ae2e02e582ee13f852e8e3 |
| QA-P3-CRASH | 963ffdd1-6c01-4d97-aa27-10ae4871e88d | 196X6zSBFnthpD6cmCnRgg-euKyPIZPrw | e07ff49a46349cb91ff71e6f490cedab51066023959ac574ee1acd69003b03bf |
| QA-P3-B2 | cfd46d94-102c-4936-abd9-e9f0c4869ac2 | 1s3j1anJ-xX5cZpho4DuB3_quHDMuFIds | e5ca2428e28a5dbfd5e6fb8f45222c68e74bacf7f34a6f2cbae49bbc848afc90 |
| QA-P3-INTERRUPT | 0b6c587a-28b1-4d4f-80e6-aeda8120287e | No output, reservation retained | Not applicable |

### Actual isolated resources

| Resource | Google ID |
| --- | --- |
| Standalone project | 1E1FQFD2aMFtROmsHpYLR_L2kzKSnhDEJlQapNhFvayfUtIvDiDBxFCX2 |
| Fictional source | 1Ho1GC_MKzFSErrYVIr5jXACbGzXZLWjm3fvcOisJrZI |
| Issuance ledger | 1Xic258nBWpjinE0QXcetlV6feTYTzsMI00ynpwHLYhg |
| QA Slides template | 1zKxA3MGDNWKTe2wzr6tAdsyeR-EzExDiKlJp46pdY4k |
| PDF output folder | 1NuaybfjladUdfkRuEooKr0GsWU1C9z5j |
| QA root folder | 1oef5Twe1Z6v-auBImRmv-xciDsvEJSQ0 |

### Execution caveats and remaining release gates

A draft final-verification helper initially requested an extra Apps Script trigger-inspection permission. That action was cancelled; the helper was changed to use existing permissions and trigger inspection was completed through the read-only UI. No scope expansion was accepted. An editor paste syntax issue was corrected before execution. The initial final snapshot assertion also exposed property enumeration order instability; property keys are now sorted before snapshot hashing. These diagnostic attempts did not generate additional PDFs.

Production remains HOLD. Reconcile real attendance after both programme days, confirm eligibility and owner issuance approval, complete production security review and plan a separately approved deployment. Natural service timeout, provider outage and cross-project competing writers remain outside the demonstrated evidence. Production operator separation and tamper-resistant audit require a separate design review. Preserve the abandoned attempt and all output evidence; do not clear reservations to retry.

Final read-only verification ran at 20:51:20–20:51:36 MYT. FINAL_READ_ONLY_VERIFIED confirmed three PDFs, three Slides copies and four attempts. All three finished records returned COMPLETE; the abandoned record returned REVIEW_REQUIRED. Before/after ledger, audit, sorted properties and Drive inventory hashes matched. Source remained unchanged.
