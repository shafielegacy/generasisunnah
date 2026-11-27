# Generasi Sunnah 2026 — Sejarah Projek, Milestone dan Handover

**Checkpoint:** 27 November 2026 (selepas release check-in GAS V7 / PR #4)  
**Tujuan:** Rujukan tunggal sejarah projek dan sambungan kerja ChatGPT Work / Claude.  
**Jenis:** Dokumentasi sahaja; tiada arahan automatik untuk mengubah production.

> **Status keseluruhan:** pendaftaran, resit dan check-in ialah sistem berasingan; check-in frontend/backend terkini boleh digunakan dan ujian penolakan di luar tarikh telah PASS, tetapi **ujian penulisan kehadiran dari telefon ke Google Sheets masih PENDING**. Native eCERT berjaya **satu UAT e-mel QA terasing**, namun **pengeluaran sijil peserta sebenar kekal HOLD**.

## 1. Sumber dan sempadan bukti

Dokumen ini disusun semula daripada sejarah perbualan projek yang dapat diakses, [audit sijil asal bertarikh 27 Nov](GS_NATIVE_ECERT_UAT_2026-11-27.md), [audit check-in](AUDIT_CHECKIN_2026-11-27.md), [checkpoint V5 sejarah](GS_MANUAL_CHECKIN_V5_2026-11-26.md), status cawangan/commit GitHub dan pengesahan screenshot serta ujian yang dilaporkan oleh owner. Bagi maklumat yang hanya datang daripada laporan ujian, status dinyatakan sebagai **dilaporkan/disahkan operator**, bukan pemerhatian production baharu.

Maklumat lama **tidak menggantikan** status production terkini. Angka pendaftaran boleh berubah selepas waktu audit; nilai yang dicatat ialah snapshot, bukan nilai muktamad atau dasar kuota.

## 2. Identiti projek dan seni bina

| Komponen | Sumber / penggunaan |
| --- | --- |
| Portal rasmi | https://shafielegacy.github.io/generasisunnah/ |
| GitHub | https://github.com/shafielegacy/generasisunnah |
| Google Forms | Pendaftaran peserta; kekal digunakan |
| Spreadsheet utama | [Borang Pendaftaran Generasi Sunnah 2026 (Responses)](https://docs.google.com/spreadsheets/d/1YOlKCIfBd6FNJji6p4SjQtuBQOqr3zVFbtC2Nj1mwvc/edit) |
| Tab pendaftaran | `Daftar GS` (read-only kepada check-in) |
| Tab kehadiran | `KEHADIRAN_GS` dengan `Checkin_ID, Sesi, No_Resit, Waktu_Checkin, Kaedah, Direkod_Oleh, Nota` |
| Tab statistik | `DASHBOARD KUOTA` |
| AutoCrat | `Slip Daftar GS26`, `Resit GS26`, `eCERT GS26` — **jangan samakan polisi ketiga-tiga job** |
| Template eCERT rasmi | [Google Slides template](https://docs.google.com/presentation/d/1tFY8IqyXKdUloW8bSnp1Z1TNmvN6ojHFyqMmgvY_6gU/edit) |
| Folder eCERT rasmi | [Google Drive](https://drive.google.com/drive/u/1/folders/17IuUvq4NkLAM7f78Lg6L6JaXh44KCNjj) |
| GAS check-in | Deployment `/exec` asal, **V7**, 27 Nov 2026 17:07 MYT; ID/URL tidak ditukar |
| QR poster | QR Monkey **tetap**, membuka homepage GitHub Pages; tidak memerlukan query `session`/`code` |

**Program:** Batch 1 — 28 dan 29 November 2026 (`b1d1`, `b1d2`); Batch 2 — 5 dan 6 Disember 2026 (`b2d1`, `b2d2`). Zon waktu `Asia/Kuala_Lumpur`.

## 3. Kronologi pembangunan yang boleh disahkan

| Tarikh | Milestone | Status / batasan |
| --- | --- | --- |
| **15–16 Okt 2026** | Reka resit RM50 (A6 melintang) dan template eCERT A4 melintang dengan tag AutoCrat; formula nombor siri `GS26_R####`, `GS26_S####`, `GS26_P####` berdasarkan susunan baris; poster dan QR diuji boleh dibaca. | Hasil reka bentuk / keputusan projek terdahulu; formula bersifat row-sensitive |
| **2 Nov 2026** | Aliran asal ialah Google Forms → Google Sheets → AutoCrat untuk pendaftaran/resit; owner tidak mahu semakan manual status bayaran baharu dalam dashboard. | Aliran resit/pendaftaran sedia ada perlu dipelihara |
| **20–21 Nov 2026** | Portal branding GitHub Pages, kuota dan konsep hybrid check-in (Peserta melalui QR, Urusetia melalui login berkunci). | Tidak menggantikan borang pendaftaran atau AutoCrat |
| **26 Nov 2026** | GAS V5 Manual Check-in Control V2; sesi buka/tutup manual, QR lokasi dinamik dan `ackOutsideDate` pernah diperkenalkan. | **SEJARAH SAHAJA — superseded**; jangan guna polisi buka luar tarikh |
| **27 Nov — awal** | Masalah kuota mobile, `no-cors`/JSONP polling dan keperluan `?session=&code=` menghalang check-in dari QR poster tetap; beberapa fallback sementara diuji/dibatalkan. | Diagnosis lama telah diganti |
| **27 Nov — audit sijil** | Audit AutoCrat `eCERT GS26` terhadap 141 pendaftaran (67 Batch 1, 74 Batch 2); kehadiran 0, output rasmi eCERT 0 pada waktu audit. Job eCERT mempunyai merge conditions kosong, e-mel aktif dan trigger off. | **Production sijil HOLD**; tidak selamat tekan Run pada roster penuh |
| **27 Nov — staging sijil** | Simulator Python/SQLite: 37/37 ujian offline lulus, satu PDF dan satu penghantaran **simulasi**. Branch `staging/ecert-gs26-review` mengandungi modul staging eCERT serta kod Native QA. | BUKAN bukti penghantaran sebenar atau production |
| **27 Nov, 14:28 MYT** | OWNER GO untuk **satu** eCERT Native UAT terasing: salinan Slides QA → PDF satu halaman + watermark `UJIAN SAHAJA — TIDAK SAH` → `MailApp.sendEmail` kepada satu mailbox ujian yang diluluskan. Owner mengesahkan diterima; MailApp 95 → 94. | **E-mel QA PASS**, tiada AutoCrat digunakan; tiada lesen penghantaran tambahan |
| **27 Nov — check-in audit** | Claude menguji direct CORS dari Chrome desktop (5/5 read-only); patch untuk tarikh backend + tri-state outcome + dedupe / reconcile. Bundle diverifikasi; ujian mock backend/frontend PASS. | Bukti browser desktop dan mock sahaja pada tahap ini |
| **27 Nov, 17:07 MYT** | GAS V7 deployed ke **deployment asal**; `gsPublicStatus` memberi `simpleCheckin:true`. | Backend baharu disahkan operator |
| **27 Nov — PR #3** | [PR #3](https://github.com/shafielegacy/generasisunnah/pull/3) merged sebagai `1a741ee2`. QR poster tetap, direct CORS, date lock dalam backend, outcome SUCCESS/FAILED/UNKNOWN. | Production frontend diselaraskan |
| **27 Nov — PR #4** | [PR #4](https://github.com/shafielegacy/generasisunnah/pull/4) merged sebagai `36cdf251`. Pilih sesi urusetia secara automatik, padam ralat sesi lama selepas snapshot berjaya, cache-bust JS. | Owner mengesahkan dashboard urusetia PASS |
| **27 Nov — telefon** | Pixel 10 / ROG memaparkan data kuota dan Mini Check-in. Scan QR + dummy pada 27 Nov mendapat respons backend **ditolak kerana luar tarikh**. | **QR → portal → GAS + date lock PASS; tulis ke Sheets PENDING** |
| **27 Nov — dokumentasi** | README, audit check-in dan V5 historical note dikemas kini pada `main`; commit akhir dokumentasi sebelum checkpoint ini `be37cf6157b9`. | Docs sahaja |

## 4. Keadaan operasi selepas 27 November

### A. Pendaftaran dan kuota
- Google Forms, slip/resit pendaftaran sedia ada dan AutoCrat **jangan diubah** dalam kemas kini check-in/eCERT.
- Audit eCERT awal 27 Nov: **141** pendaftaran (67/74), **141 resit dan sijil unik** pada snapshot tersebut, **0 kehadiran** dan **0 output rasmi sijil**.
- Semakan Sheets kemudian pada 27 Nov menunjukkan peserta dummy **`PESERTA DUMMY CHECK-IN GS26`** mempunyai resit **`GS26_R0146`** ketika itu. `GS26_R0144` sudah menjadi **peserta sebenar**; jangan gunakan `R0144` untuk QA.
- Nilai `No_Resit` bergantung pada formula baris; semak semula sebelum ujian, jangan anggap `R0146` kekal.

### B. Check-in
- Peserta kekal pada halaman GitHub Pages, gunakan 5 aksara terakhir resit + 4 digit akhir telefon penjaga.
- GAS menentukan sesi ikut tarikh Malaysia dan menguatkuasakan semakan tarikh di bawah `LockService` sebelum `appendRow`.
- Urusetia mempunyai login, sesi program, carian peserta, status dan butang `Tanda hadir`. **Jangan ubah tingkah laku butang kerana owner mahu ia kekal; backend tetap menolak tarikh salah.**
- Tiada retry automatik terhadap POST menulis. Jika hasil UNKNOWN, status read-only digunakan sebelum mencuba semula; jangan tekan berulang kali.
- **Keperluan utama belum selesai:** 28 Nov, rekod kehadiran dummy daripada telefon benar-benar masuk `KEHADIRAN_GS` sekali; pengulangan pada telefon kedua tidak menambah baris.
- Owner tidak berada di lokasi pada 28 Nov; **ustaz seorang mengendalikan operasi**. Sediakan kaedah catatan kertas jika sistem terganggu. Selepas tamat sesi, tutup check-in.

### C. eCERT
- **Sijil rasmi tidak boleh dikeluarkan hanya kerana pendaftaran atau satu kehadiran.**
- Polisi audit yang dicadangkan: **dua hari sah mengikut batch**, kunci padanan `No_Resit` + batch + `No_Sijil`, isu tidak sepadan ditanda REVIEW, pengesahan/kelulusan OWNER sebelum jana/hantar. Polisi final production masih memerlukan keputusan OWNER.
- AutoCrat `eCERT GS26`: merge condition kosong; e-mel aktif; trigger form dan masa OFF. Jangan tekan Run pada workbook penuh.
- Native eCERT Google **UAT satu e-mel** ialah success teknikal QA; **bukan** kelulusan pengeluaran sijil rasmi atau bukti engine batch siap.
- Terdapat **dua trek staging** dalam `staging/ecert-gs26-review`: `staging/ecert/` Python simulator dan `staging/native-ecert/` kod GAS QA. Kod ini **belum digabungkan sebagai production**, dan Live integration untuk modul baharu masih perlu diuji.
- Rujuk [laporan Native eCERT UAT](GS_NATIVE_ECERT_UAT_2026-11-27.md) sebelum mengarahkan Claude / Work.

## 5. Perkara yang mesti kekal HOLD

1. **Pengeluaran eCERT sebenar / bulk send / job AutoCrat eCERT:** tunggu kehadiran dua hari, resolusi REVIEW, authorisation operator dan OWNER GO.
2. **Triggers automatik sijil:** tiada kelulusan untuk hidupkan; jangan hantarkan e-mel QA berulang.
3. **Perubahan roster rasmi, formula resit/sijil, AutoCrat slip/resit atau e-mel penjaga:** tidak diluluskan sebagai sebahagian pembangunan eCERT.
4. **Data QA:** hanya peserta rekaan dan folder/salinan Slides QA; output tidak boleh kelihatan seperti sijil rasmi.
5. **Merge staging eCERT ke `main` atau deploy GAS production eCERT:** tidak diluluskan.

## 6. Pelan sambungan — selepas Work reset / Claude Pro

**Fasa A — Audit kod dan persediaan (Claude Sonnet / offline; tiada live write):**
- Baca dahulu `README.md`, dokumen ini, [laporan UAT](GS_NATIVE_ECERT_UAT_2026-11-27.md), dan fail `staging/native-ecert/` serta `staging/ecert/` dalam branch staging.
- Bezakan code yang benar-benar wujud, test yang hanya mock, dan operasi yang telah dibuktikan oleh Google.
- Kunci kontrak kelayakan dua sesi setiap batch; kaji masalah roster berubah, pengecualian, concurrent generation, resit/sijil berganda, ketidakpastian MailApp dan dedup.
- Tambah ujian pada branch baharu dan buka **Draft PR**; jangan ubah `main` tanpa GO.

**Fasa B — UAT integrasi terasing (ChatGPT Work apabila tersedia; perlu OWNER GO berasingan):**
- Gunakan workbook/ledger/folder/Slides **QA sahaja** dan operator yang dibenarkan.
- Uji aliran baca kehadiran rekaan → semak kelayakan → approve → jana 1 PDF, rekod ledger, zero duplicate dan failure recovery.
- **Mail sending OFF**. UAT satu e-mel sebenar telah selesai; tiada ulang tanpa izin eksplisit.

**Fasa C — Reka bentuk pengeluaran rasmi (selepas program):**
- Rekonsiliasi kehadiran Hari 1/Hari 2; semak semula live sheet pada waktu keputusan.
- Tetapkan cara semak/approve dan batch freeze; pilih antara adapter Native GAS dan QA AutoCrat terasing berdasarkan bukti, **bukan** andaian.
- Pilot seorang yang layak hanya selepas kebenaran jelas; barulah pertimbang rollout, status dan laporan.

## 7. Kriteria selesai

| Milestone | Status pada 27 Nov 2026 |
| --- | --- |
| QR tetap → GitHub Portal → GAS respons & date guard | **PASS** |
| Urusetia login/sesi auto pilih, ralat lama hilang | **PASS (owner confirmation)** |
| Kehadiran sebenar telefon → `KEHADIRAN_GS` sekali | **PENDING** |
| Simulator eCERT Python/SQLite 37/37 | **PASS offline** |
| Native eCERT Slides QA → PDF → MailApp satu e-mel | **PASS isolated QA** |
| Integrasi Native eCERT QA dengan ledger / eligibility sebenar | **PENDING** |
| eCERT production untuk peserta sebenar | **HOLD** |

**Peraturan dokumentasi:** nilai tarikh/jumlah daripada snapshot kekal sebagai sejarah. Kemaskini status melalui append checkpoint dan bukti, jangan tulis semula sejarah seolah-olah semua ujian pernah PASS.
