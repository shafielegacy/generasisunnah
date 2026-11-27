# Generasi Sunnah 2026 — Native eCERT (staging sahaja)

**Checkpoint Phase 2, 27 November 2026 19:40 MYT — integrasi Google QA terasing PASS untuk senario yang diuji. Production HOLD.**

Baca [matriks Phase 2](PHASE2_GOOGLE_QA_2026-11-27.md) untuk bukti dan batasan terkini. Bahagian asal di bawah dikekalkan sebagai sejarah pembangunan.

Dalam branch Phase 2 ini, `ecSendQa()` sentiasa menolak panggilan. Enjin tidak mempunyai panggilan MailApp. Konfigurasi `EC_QA_SEND_ENABLED=true` ditolak. Kelayakan hanya menerima identiti resit/sijil berawalan QA dan e-mel domain `.invalid`. Penutupan batch dibenarkan mulai 00:00 MYT pada hari selepas Hari 2, kerana masa tamat program belum dikonfigurasi.

`Integration_QA.gs` menyediakan fungsi editor `phase2Prepare`, `phase2Inspect`, `phase2Verify` dan `phase2SecurityChecks`. Gunakan projek standalone baharu. `phase2Prepare` membina sumber rekaan, ledger, salinan template dan folder khusus. `phase2Verify` mempunyai penanda sekali jalan. Semak audit sebelum sebarang pemulihan jika execution terhenti.

Kod sebenar Google QA dipasang sebagai gabungan empat fail mengikut urutan Integration_QA, Eligibility, Engine, QA_Runner dalam Code.gs. Simpan ID konfigurasi dan identiti operator di Script Properties. Log projek Google menyimpan rujukan sebenar kepada sumber QA.

Ujian tambahan offline boleh dijalankan dengan `node staging/native-ecert/test-phase2.js`. Ujian Google menguji Sheets/Slides/Drive sebenar. UNKNOWN diuji sebagai keadaan ledger rekaan dengan penghantaran dimatikan.

Modul ini disediakan supaya kerja pembangunan boleh diteruskan tanpa menggunakan ChatGPT Work. Ia **bukan** backend GAS V6 production, tidak di-deploy dan tidak disambungkan kepada spreadsheet rasmi.

## Milestone yang sudah dibuktikan

- Staging Python + SQLite sedia ada: **37/37 PASS**, menurut laporan Work. Itu simulator, bukan integrasi Google.
- UAT Native Slides → PDF → MailApp: **PASS pada 27 November 2026, 2:28 petang MYT**. Satu e-mel QA diterima oleh owner, dengan PDF satu halaman, tiga tag terisi dan watermark merah. Baki MailApp yang dilaporkan 95 → 94. **Jangan ulang e-mel ujian ini.**
- Native eCERT source dalam folder ini: diuji secara **offline menggunakan GitHub Actions**; keputusan semasa boleh dilihat di workflow GS26 Native eCERT QA (offline). Lulusnya ujian offline **bukan** bukti integrasi Google end-to-end.

## Fail

- Eligibility.gs: logik kelayakan tanpa Google APIs; resit dan batch mesti padan, dua sesi berasingan diperlukan.
- Engine.gs: QA-only adapter kepada Google Sheets, Google Slides, Drive dan MailApp. Mempunyai audit, ledger, penutupan batch, kelulusan individu dan penjanaan satu PDF.
- QA_Runner.gs: fungsi tanpa argumen untuk editor Apps Script; tiada wrapper penghantaran e-mel.
- test-eligibility.js: ujian offline Node.js tanpa Google access atau penghantaran e-mel.
- .github/workflows/ecert-qa.yml: menjalankan syntax check dan ujian offline pada branch staging.

## Kontrak data

**Sumber QA** mesti mempunyai tab dan header yang sama dengan spreadsheet rasmi:

- Daftar GS: Email address, Nama penuh, Pilihan batch program, No_Resit, No_Sijil, Merged Doc ID - eCERT GS26, Document Merge Status - eCERT GS26.
- KEHADIRAN_GS: Checkin_ID, Sesi, No_Resit, Waktu_Checkin, Kaedah, Direkod_Oleh.

Kehadiran sah: b1d1 + b1d2 untuk Batch 1; b2d1 + b2d2 untuk Batch 2. Kaedah QR PESERTA atau URUS SETIA sahaja. Semakan masa dibuat dalam zon Malaysia. Check-in di luar tarikh sesi, ID berganda, resit tidak padan, e-mel tidak sah, sijil sudah pernah dijana atau output AutoCrat sedia ada menghasilkan status REVIEW. Nama yang sama tidak dianggap identiti sama; padanan berdasarkan No_Resit.

Pembetulan disimpan dalam tab QA SIJIL_CORRECTIONS, append-only, memerlukan sebab dan operator. Sumber check-in tidak diubah. Penutupan batch hanya selepas Hari 2 dan semua kes REVIEW serta check-in tanpa padanan telah diselesaikan. Hash snapshot mengunci keadaan data ketika penutupan; jika sumber berubah selepas itu, operasi seterusnya disekat untuk semakan.

## Setup oleh Work kemudian — **QA SAHAJA**

1. Buat **workbook sumber QA** berasingan, hanya peserta rekaan dan rekod kehadiran rekaan. Jangan salin data peribadi peserta.
2. Buat **workbook ledger QA** berasingan, kosong.
3. Buat **salinan template Google Slides** dan **folder output QA** yang berasingan.
4. Buat **standalone Apps Script QA** baharu. Masukkan Eligibility.gs, Engine.gs, QA_Runner.gs. Jangan guna projek GAS V6.
5. Tetapkan Script Properties berikut (semua ID sebenar kekal dalam Properties, **jangan commit ke GitHub**):

| Key | Nilai |
| --- | --- |
| EC_MODE | QA |
| EC_QA_SOURCE_ID | ID workbook sumber QA, **bukan** spreadsheet rasmi |
| EC_QA_LEDGER_ID | ID workbook ledger QA, **bukan** spreadsheet rasmi |
| EC_QA_TEMPLATE_ID | ID salinan Slides QA, **bukan** template rasmi |
| EC_QA_OUTPUT_FOLDER_ID | ID folder output QA |
| EC_QA_ALLOWED_OPERATORS | E-mel Google operator QA yang dibenarkan, dipisahkan koma |
| EC_QA_SEND_ENABLED | **false — kekalkan OFF** |
| EC_QA_TEST_BATCH | 1 atau 2, untuk wrapper editor |
| EC_QA_TEST_RECEIPT | Contoh QA-R1, hanya resit rekaan |
| EC_QA_NOW | Opsyenal, contoh 2026-12-07T09:00:00+08:00 untuk simulasi selepas Hari 2 |

6. Jalankan ecSetupQa() sekali, kemudian ecPreviewQa() dan semak keputusan. Dengan data QA yang mencukupi, jalankan ecQaCloseConfiguredBatch(), ecQaApproveConfiguredReceipt() dan ecQaGenerateConfiguredReceipt() secara manual, satu demi satu.
7. Sahkan PDF QA, hash snapshot, audit log, status ledger dan cubaan ulang yang mesti ditolak.
8. **Jangan jalankan ecSendQa()**. Satu e-mel UAT sebenar sudah berjaya dan tiada kelulusan penghantaran tambahan.

## State dan safety

Ledger QA menggunakan status APPROVED, GENERATING, GENERATED, SEND_UNKNOWN, SENT, REVIEW_REQUIRED. Status GENERATING direkod **sebelum** Drive operations. Jika penjanaan gagal selepas Drive menulis sebahagian fail, sistem menandakan REVIEW_REQUIRED; tiada retry automatik.

Fungsi penghantaran hanya wujud untuk pengembangan QA masa hadapan. Ia OFF secara lalai, memerlukan operator Google yang dibenarkan, recipient QA eksplisit, kuota MailApp mencukupi dan satu global send reservation per Apps Script project. Jika penghantaran tidak pasti, sistem **tidak menghantar semula secara automatik**. Kejayaan MailApp.sendEmail() bermaksud panggilan diterima oleh MailApp, bukan bukti inbox.

Semua fungsi perlu dijalankan melalui editor Apps Script yang dibenarkan. **Tiada doGet, doPost, trigger, web app, endpoint awam atau fungsi bulk send.** Jangan guna kod ini untuk production tanpa reka bentuk authorisation, UAT dan OWNER GO berasingan.

## Ujian offline

Jalankan dari root repository:

    node staging/native-ecert/test-eligibility.js

GitHub Actions menjalankan ujian automatik apabila folder staging ini dikemas kini. Ujian ini tidak menggunakan data sebenar, tidak mengakses Google dan tidak menghantar e-mel.

## Perkara belum siap

- Integration UAT dengan Google Sheets/Slides/Drive menggunakan data rekaan untuk modul **baharu** ini.
- Dashboard urusetia yang mempunyai backend authorisation sebenar.
- Penyambungan ledger issuance production dengan sumber rasmi selepas event.
- Strategi kuota dan penghantaran batch production, pemulihan manual dan backup.
- Semakan production security dan release approval.

**Release gate:** Semuanya HOLD sehingga owner memberi GO baharu selepas keputusan integrasi dan review. Jangan merge staging ke main atau deploy GAS V6.
