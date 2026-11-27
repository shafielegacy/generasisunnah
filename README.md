# Generasi Sunnah 2026

**Portal Mini Check-in Kehadiran Peserta** · Program Generasi Sunnah 2026 · Surau Jabal Nur

🌐 **[Portal rasmi](https://shafielegacy.github.io/generasisunnah/)**

- **Peserta / penjaga:** imbas QR Monkey **tetap** pada poster, kekal di GitHub Pages, masukkan 5 aksara terakhir `No_Resit` (contoh `R0146`) dan 4 digit terakhir telefon penjaga, kemudian **Sahkan kehadiran**.
- **Urusetia:** login melalui tab **Urusetia**, pilih sesi, semak peserta dan buka/tutup check-in pada **tarikh sesi yang tepat**.
- **Sesi rasmi:** Batch 1 pada **28–29 November 2026**; Batch 2 pada **5–6 Disember 2026** (waktu `Asia/Kuala_Lumpur`).

## Latest milestone — Premium UI V2 LIVE (27 November 2026, malam)

**OWNER design milestone LULUS dan OWNER GO frontend LIVE telah dilaksanakan.** [PR #7](https://github.com/shafielegacy/generasisunnah/pull/7) merged sebagai `2148443`, dan [PR #9](https://github.com/shafielegacy/generasisunnah/pull/9) merekod release. GitHub Pages dilaporkan berjaya terbit pada **20:31 MYT, 27 Nov**. Homepage/QR poster, GAS V7, Sheets dan AutoCrat tidak berubah.

**Ujian sebelum release:** 21/21 browser GAS-mock, 11/11 statik, 29/29 kawalan tarikh, 9/9 regresi legacy PASS. Semakan LIVE baca-sahaja UI, status awam, kuota, respons di luar tarikh, mobile dan mod gelap PASS; **penulisan check-in sebenar ke `KEHADIRAN_GS` masih PENDING ujian 28 Nov**. Login urusetia, buka/tutup sesi, tanda hadir manual dan self-check-in sebenar belum disahkan end-to-end pada UI V2.

- [Laporan release, rollback dan milestone OWNER](docs/GS_UI_V2_LIVE_RELEASE_2026-11-27.md)
- [Sejarah projek dengan checkpoint malam 27 Nov](docs/GS_PROJECT_HISTORY_AND_RELEASE_2026-11-27.md)
- **Rollback:** `rollback/pre-ui-v2-20261127` (`114eb7b`) atau revert merge `2148443` selepas semakan operator. PR #6 (demo) kekal Draft dan bukan production.
- **eCERT:** Phase 2 Google QA **32 assertions PASS** (Draft [PR #5](https://github.com/shafielegacy/generasisunnah/pull/5)); Phase 3 **Google concurrency, post-PDF recovery dan Batch 2 PASS**, regresi **57/57**, [GitHub Actions akhir SUCCESS](https://github.com/shafielegacy/generasisunnah/actions/runs/46002351278) pada [Draft PR #8](https://github.com/shafielegacy/generasisunnah/pull/8). **Timeout semula jadi Apps Script NOT VERIFIED; production eCERT HOLD; email OFF; tiada merge/deploy.** [Laporan Phase 3 di branch QA](https://github.com/shafielegacy/generasisunnah/blob/staging/ecert-phase3-reliability/staging/native-ecert/PHASE3_RELIABILITY_QA_2026-11-27.md).

## Checkpoint 27 Nov 2026, 22:46–22:55 MYT — Dummy LIVE QA dibatalkan, GAS V7 dipulihkan

**CURRENT STATUS: Premium UI V2 LIVE; GAS production Version 7 RESTORED; check-in E2E write PENDING.** Ujian satu dummy awal telah dihentikan apabila nombor resit dalam roster berubah semasa pendaftaran baharu masuk.

- **Temporary QA source:** `qa/r0146-one-dummy-uat-20261127`, commit `0562f48`, hanya pengecualian tarikh untuk `GS26_R0146` / `6789` / `b1d1` pada 27 Nov; ujian isolation **15/15 PASS offline**, regresi V7 **29/29 PASS offline**. **Branch tidak di-merge.**
- **GAS Version 8** dideploy sementara pada **22:46 MYT**, deployment ID dan `/exec` asal kekal. Panggilan `gsSelfCheckinStatus` baca-sahaja membalas **`ok:false`, tidak dapat mengesahkan resit/telefon**; **tiada check-in write LIVE berjaya**.
- Semakan rasmi `Daftar GS` kemudian mendapati **`GS26_R0146` kini milik peserta sebenar Batch 2**, manakala **dummy kini `GS26_R0147`** (telefon akhir `6789`). Punca berkait nombor resit berdasarkan formula/kedudukan baris; tidak bermaksud GAS terbukti rosak.
- **ROLLBACK PASS:** owner mengembalikan deployment yang sama ke **Version 7 (27 Nov, 17:07)** dan mengesahkan melalui screenshot `Deployment successfully updated`. Editor `Code.gs` turut dipulihkan daripada `main` dan padanan hash **`34c3b9edec64` (389 baris)** PASS; `Checkin.html` kekal **`206c4cba4e5b` (91 baris)**.
- Semakan `KEHADIRAN_GS` ketika diagnosis: **0 baris kehadiran**. Jangan menyatakan actual LIVE write PASS. Tiada lagi percubaan pengecualian tarikh diluluskan untuk malam ini.
- **PENTING UNTUK UAT 28 NOV:** Jangan gunakan resit contoh lama `R0146` kerana ia kini peserta sebenar. Cari peserta berdasarkan nama **PESERTA DUMMY CHECK-IN GS26** dalam `Daftar GS` dan salin `No_Resit` semasa tepat sebelum ujian; snapshot akhir 27 Nov ialah **`GS26_R0147` / `6789`**. Selepas ujian satu write, semak tepat satu baris `b1d1` lalu uji duplicate sekali sahaja.
- **Operasi backup:** jika portal/Apps Script gagal, catat kehadiran di kertas (nama, resit, sesi dan masa), jangan gandakan write ketika status UNKNOWN; semak dan rekonsiliasi kemudian. Jangan buat hotfix/deploy sewaktu kaunter sibuk kecuali isu kritikal disahkan dan rollback tersedia.
- **Risiko susulan:** audit formula resit/sijil yang bergantung baris dan kestabilan ID selepas program; jangan ubah formula/roster pada malam sebelum program. Production eCERT kekal **HOLD**.

Dokumen sejarah lama di bawah ialah snapshot waktu terdahulu; **jangan ikut contoh `R0146` untuk ujian esok**. Rujuk [checkpoint terbaru dan SOP](docs/GS_PROJECT_HISTORY_AND_RELEASE_2026-11-27.md).

## Status production — checkpoint 27 November 2026 (petang; rujukan sejarah)

| Komponen | Status / bukti |
| --- | --- |
| Backend Google Apps Script | **V7**, deployment sedia ada dikemas kini pada **27 Nov 2026, 17:07 MYT**, ID/URL `/exec` kekal |
| Pengesahan backend | Operator menguji `gsPublicStatus`: `simpleCheckin:true` |
| GitHub Pages frontend | PR **#3** (direct CORS, date lock, QR tetap) merged, commit `1a741ee2` |
| Hotfix Urusetia | PR **#4** (default sesi + bersih mesej ralat + cache-bust) merged, commit `36cdf251` |
| **Premium UI V2 LIVE** | PR **#7** merged, commit `2148443`; frontend sahaja, GAS V7 tidak berubah. [Laporan pelepasan & rollback](docs/GS_UI_V2_LIVE_RELEASE_2026-11-27.md) |
| Telefon | Pixel 10 dan ROG memaparkan kuota/Mini Check-in; login dan senarai urusetia disemak |
| Ujian QR → backend pada 27 Nov | **PASS (penolakan tarikh)**: dummy `R0146`/`6789` dihantar dari telefon; backend membalas check-in belum bermula |
| Telefon → tulis ke `KEHADIRAN_GS` | **PENDING**: belum diuji pada tarikh program; jangan isytihar end-to-end PASS |

**Kawalan keselamatan terkini:** server memilih sesi berdasarkan tarikh Malaysia; `LockService` menyemak tarikh sekali lagi sebelum append; hanya tab `KEHADIRAN_GS` boleh menerima rekod kehadiran. Keputusan jaringan tidak pasti **tidak** mencetuskan retry penulisan automatik. Respons status menggunakan direct CORS; tiada Cloudflare Worker atau QR dinamik diperlukan.

### Panduan ringkas untuk urusetia — 28 November

1. Pada 28 Nov, buka portal → **Urusetia** → login → pastikan **Batch 1 · Hari 1 (`b1d1`)** terpilih.
2. Bila kaunter bersedia, klik **Buka check-in**. Jangan cuba membuka/merekod di luar tarikh program.
3. Uji terkawal menggunakan **PESERTA DUMMY CHECK-IN GS26**: semak dahulu `No_Resit` terkini dalam `Daftar GS` (**snapshot terakhir `R0147`**, bukan resit lama `R0146`), 4 digit telefon `6789`. Pastikan mesej **BERJAYA**, kemudian **semak tepat satu rekod resit dummy terkini / `b1d1`** pada tab `KEHADIRAN_GS`.
4. Ulang input yang sama menggunakan telefon kedua; sepatutnya **SUDAH DIREKOD** dan **tiada baris tambahan**.
5. Penjaga sebenar boleh scan QR poster tetap. Jika respons **STATUS TIDAK DIKETAHUI**, **semak kehadiran dahulu** sebelum cuba semula; jika terganggu, rekod kehadiran secara manual di kertas dan buat rekonsiliasi kemudian.
6. Tamat sesi: urusetia **Tutup check-in** dan semak jumlah rasmi.

**Nota data ujian (checkpoint akhir malam 27 Nov):** `GS26_R0146` kini resit **peserta sebenar Batch 2** — **JANGAN gunakan untuk QA**. Dummy semasa ialah `GS26_R0147` / `6789` pada snapshot semakan, tetapi formula resit bergantung baris dan boleh berubah lagi. Semak **nama dummy dan No_Resit terkini** sebelum ujian. **Jangan padam atau edit rekod pendaftaran/kehadiran secara spontan.**

📘 **[Audit, bukti, had dan rollback terkini](docs/AUDIT_CHECKIN_2026-11-27.md)**  
📚 **[Sejarah Manual Check-in V5 (superseded)](docs/GS_MANUAL_CHECKIN_V5_2026-11-26.md)**

**Deployment note:** GitHub menyimpan source `gas/Code.gs`; push GitHub **tidak** men-deploy Google Apps Script. Untuk rollback, pilih versi GAS lama pada *Manage deployments* bagi deployment **yang sama**, dan revert commit frontend jika perlu. Jangan bina deployment baharu atau ubah URL QR tanpa arahan owner.

## Project handover & Native eCERT — 27 November 2026

**Sambungan projek: baca dahulu sebelum arahkan Claude Pro atau ChatGPT Work.**

- 📚 [Sejarah penuh projek, milestone, keputusan owner, status LIVE dan SOP ustaz](docs/GS_PROJECT_HISTORY_AND_RELEASE_2026-11-27.md)
- 🎓 [Audit sijil dan Native eCERT Email UAT 27 Nov](docs/GS_NATIVE_ECERT_UAT_2026-11-27.md)
- 🛡️ [Audit check-in dan release V7](docs/AUDIT_CHECKIN_2026-11-27.md)

**eCERT — bukti dan status:**
- Simulator staging Python/SQLite: **37/37 offline tests PASS**; penghantaran mock **bukan** e-mel sebenar.
- Pada **27 Nov 2026, 14:28 MYT**, satu **Native eCERT QA** berasaskan salinan Slides → PDF Drive → `MailApp.sendEmail` **berjaya**, dengan peserta rekaan `QA-GS26-001`, watermark `UJIAN SAHAJA — TIDAK SAH` dan pengesahan e-mel diterima oleh owner. AutoCrat tidak digunakan dalam ujian itu.
- Branch `staging/ecert-gs26-review` menyimpan `staging/ecert/` dan `staging/native-ecert/`. **Bukan code eCERT production**; belum merge atau deploy ke GAS check-in V7.
- **Production eCERT = HOLD.** Job AutoCrat `eCERT GS26` masih tidak mempunyai merge conditions; **jangan tekan Run** pada roster penuh, hidupkan trigger, hantar e-mel tambahan atau jana sijil rasmi sebelum kelayakan kehadiran dua hari, approval dan OWNER GO.
- **Check-in E2E Sheets = PENDING** untuk 28 Nov; penolakan tarikh pada 27 Nov adalah PASS tetapi bukan bukti penulisan sah ke tab kehadiran.

Bagi kerja sambungan, bezakan **QA berasaskan Google yang telah dibuat satu kali** daripada **simulator offline** dan **integrasi modul eCERT yang belum diuji**. Semua perubahan production memerlukan kelulusan baharu.
