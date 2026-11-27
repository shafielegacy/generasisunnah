# Native eCERT Phase 3 · Reliability and crash recovery QA

**27 November 2026 · development checkpoint · Google execution pending authorisation · production HOLD**

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
| Phase 3 reliability Node tests | 20 PASS, Google services mocked |
| Combined source syntax and git diff check | PASS locally |
| Phase 3 GitHub Actions | PASS, [run 45999575777](https://github.com/shafielegacy/generasisunnah/actions/runs/45999575777), code commit 523054d97755f119d895b6bf42223528dceb33ca |
| Actual overlapping Google executions | NOT VERIFIED, pending authorisation and execution |
| Post-PDF failure with Google Drive | NOT VERIFIED, pending execution |
| Read-only Google reconciliation and explicit recovery | NOT VERIFIED, pending execution |
| Batch 2 Google generation | NOT VERIFIED, pending execution |
| Actual Apps Script service timeout | NOT VERIFIED |

The new standalone Google project is named GS26 Phase 3 Reliability QA — NO EMAIL. Setup currently waits at Google's authorisation dialog. Native code is prepared in Code.gs. No Phase 3 fixture resources or output have been confirmed yet.

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
