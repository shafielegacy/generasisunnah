# Native eCERT Phase 2 · Isolated Google Integration QA
**27 November 2026 · final Google verification 19:40:56 MYT · production HOLD**

## Result and evidence

The standalone project **GS26 Phase 2 Native eCERT — Isolated QA No Email** reads fictional Google Sheets registration and attendance, evaluates eligibility, freezes Batch 1, approves one receipt and generates one Google Drive PDF. Final verification found one issuance ledger row, one final PDF and status GENERATED. No email transport was invoked.

The previous 14:28 email UAT remains a separate milestone. This Phase 2 execution uses a new project. Source, ledger, Slides copy and output folder were created specifically for this test. Actual resource links and IDs are supplied to OWNER in the handover. Runtime IDs and operator identity remain in Script Properties and the private Google execution logs.

## Source audit and changes

Reviewed main README, project history, Native UAT report and check-in audit before reading all five requested Native staging files. Main documents describe check-in V7. The earlier source comment referring to V6 was historical.

| Finding | Change |
| --- | --- |
| Batch closure accepted any time on Day 2 | Compare Malaysia calendar dates strictly after the last programme date. Without a configured programme finish time, the QA gate opens at 00:00 on the next day. This is the conservative QA interpretation of “after Day 2 ends”. |
| Optional email execution remained reachable through a property | ecSendQa always rejects. Engine contains no MailApp invocation. EC_QA_SEND_ENABLED=true rejects configuration. |
| Resource denial checked only certain ID positions | Deny known official source, template and output-folder IDs in every configured resource position. Bootstrap reads the authorised official template solely to create a QA copy. |
| Source adapter accepted arbitrary identities | Require QA-prefixed receipt/certificate IDs and .invalid fictional email domains. Blank or malformed source input fails closed. |
| Issuance identity could conflict with ledger | Recheck receipt/certificate/batch agreement and unique certificate ledger identity before reserving generation. |
| Partial Slides output lacked a durable audit reference | Record SLIDES_CREATED and its file ID immediately after creation. Failure retains REVIEW_REQUIRED. |
| Generated template content was not checked collectively | Require one slide, exact replacement values and no remaining placeholder. Add a visible red watermark sized to the presentation. |

Eligibility.gs remains unchanged. It correctly returned the required fictional eligibility outcomes. No frontend files were changed.

## Google test matrix

| Scenario | Result | Observed evidence |
| --- | --- | --- |
| Source registration + attendance from real QA Sheets | PASS | 5 fictional participants, 4 check-in records, Malaysia spreadsheet timezone |
| A, two distinct valid days | PASS | QA-A ELIGIBLE |
| B, one day | PASS | QA-B NOT_ELIGIBLE; approval rejected |
| C, wrong batch session | PASS | QA-C REVIEW, CHECKIN_BATCH_LAIN |
| D/E, duplicate certificate | PASS | Both REVIEW, NO_SIJIL_TIDAK_UNIK. E is the extra fictional row needed to create the duplicate. |
| Close Batch 1 at 29 Nov 23:59:59 MYT | PASS | Rejected with Day 2 gate |
| Close Batch 1 at 30 Nov 00:00:00 MYT | PASS | CLOSED record and snapshot hash persisted |
| Approve exactly A | PASS | One approved issuance ledger row |
| Injected failure immediately after Slides copy | PASS | REVIEW_REQUIRED, zero PDFs, partial Slides ID recorded |
| Retry after partial failure | PASS | Rejected; explicit review required |
| Controlled QA recovery | PASS | One identified Slides file moved to QA quarantine, audit QA_RECOVERY_APPROVED, explicit return to APPROVED |
| Generate certificate A | PASS | One final PDF with matching ledger ID and GENERATED |
| Repeat generation | PASS | Rejected; final folder still contains exactly one PDF |
| Actual PDF content + layout | PASS | Viewer shows 1 page, PESERTA A, Batch 1 — QA, QA-SA, visible UJIAN SAHAJA — TIDAK SAH, filename QA-QA-SA.pdf |
| Operator denial | PASS | Temporarily configured fictional operator allowlist rejects actual operator, then original configuration restored |
| Email configuration interlock | PASS | true property rejected, restored false |
| Email execution interlock | PASS | ecSendQa throws unconditionally |
| SEND_UNKNOWN protection | PASS for simulated state | Fictional ledger state blocks generation and send; no email request was made |
| Frozen snapshot mutation | PASS | Mutated in-memory name causes frozen snapshot rejection; source unchanged |
| Official source ID in every config slot + official output folder | PASS | Rejected before those resources are opened by the engine |
| Final source integrity | PASS | Source data hash unchanged across engine test |
| Ledger | PASS | Exactly one issuance row, QA-A / QA-SA / Batch 1 / GENERATED / Attempts 0 |
| Audit | PASS | 12 events, including generation reservation, partial failure, explicit recovery, success and simulated UNKNOWN start/end |
| Triggers | PASS | Google UI shows 0 triggers |
| Concurrent Google executions | NOT VERIFIED | LockService exists and ordinary transitions exercised; no simultaneous Google runs were induced |
| Failure after PDF creation but before ledger update | NOT VERIFIED | Tested failure after Slides copy, before PDF export |
| Real email UNKNOWN or mailbox behaviour | NOT VERIFIED in Phase 2 | Execution transport disabled. Earlier one-email UAT remains separate. |
| Batch 2 closure and successful Batch 2 generation | NOT VERIFIED in Google | Fixture exceptions remain REVIEW and Batch 2 remains open |
| Real participant issuance | HOLD | Release gates still apply |

The main integration runner completed 24 assertions at 19:38:19 MYT. Read-only/configuration security checks completed 8 additional assertions at 19:40:56 MYT. Combined Google assertions total 32. The PDF viewer and triggers screen were inspected separately.

A simulated SEND_UNKNOWN was written solely for a negative test. The audit explicitly identifies it as QA_UNKNOWN_SIMULATION. After rejecting both operations, the test restored GENERATED and Attempts 0 because no transmission occurred. This test-only restoration is not an operational procedure for a real uncertain send.

## Execution trace and recoverable issues

- Initial setup at 19:35 created the resources but preview rejected fictional emails due to an over-escaped domain regular expression introduced during preparation. The expression was corrected. The existing setup marker reused the resources on reinspection. The successful preview completed at 19:36:58.
- Integration verification ran at 19:37:29–19:38:19. Final PDF generation completed around 19:38:05.
- A later invocation selected the previous integration function and was rejected at 19:39:49 by the one-run verification marker. It created no second PDF. The function selection was checked explicitly before running the security checks at 19:40:41–19:40:56.
- All historical logs remain visible. Final PASS refers to the successful runs and the stated scenarios.

## Offline regression results

The existing 25 tests and 10 additional day-end/email-interlock tests passed in a JavaScript compatibility harness. The execution environment was unavailable for local Node commands. The branch workflow is extended to run the same test files under actual Node on GitHub Actions. Consult the workflow conclusion separately before treating CI as verified.

The 37 Python/SQLite simulator results remain historical. They were not rerun and do not serve as Google integration evidence.

## Exact branch changes

Branch staging/ecert-phase2-google-qa was created from staging/ecert-gs26-review. The review target is the staging branch.

- staging/native-ecert/Engine.gs · hardening and PDF validation
- staging/native-ecert/Integration_QA.gs · fictional resource bootstrap, test runner, recovery and evidence collection
- staging/native-ecert/test-phase2.js · 10 offline regressions
- staging/native-ecert/README.md · current Phase 2 checkpoint above retained history
- staging/native-ecert/PHASE2_GOOGLE_QA_2026-11-27.md · this evidence and limitations
- .github/workflows/ecert-qa.yml · exact isolated branch and regression/syntax checks

Google Code.gs contains concatenated Integration_QA.gs, Eligibility.gs, Engine.gs and QA_Runner.gs. IDs are generated by setup and retained as Script Properties. PDF and ledger live in the new QA resources. The original email-UAT project and production check-in project are separate.

## Security scope and remaining release blockers

Operator identity is checked through Session.getActiveUser against the configured allowlist. Bootstrap also requires active and effective identity agreement. This is editor-only trusted-operator QA. Any project editor can alter code or properties, so this is not a complete multi-role production authorisation design.

Generation reserves GENERATING under LockService before Drive operations. Partial output requires manual reconciliation. Ledger and batch writes use separate Google services and are not one transaction. Timeout/concurrent-run and post-PDF-write failures still need explicit Google testing before production release.

Native source contains no doGet, doPost, trigger installation, scheduled issuance or MailApp call. Known production IDs occur as denial guards and the approved bootstrap template read. Source registration/attendance and output folder for the engine are newly created QA resources. Production V7, official spreadsheets, AutoCrat, Pages and Claude UI branches were outside the write path.

Production eCERT stays HOLD pending actual two-day attendance reconciliation, resolution of all relevant REVIEW cases, owner issuance approval, production operator/role security review, remaining recovery/concurrency tests, and a separate release decision. The recommended next development work is a reconciliation-only recovery operation with independent review and documented crash-state tests.
