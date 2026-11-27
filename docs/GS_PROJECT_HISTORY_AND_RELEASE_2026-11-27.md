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


## 8. Checkpoint tambahan — Premium UI V2 LIVE (27 November, malam)

**Sejarah di atas dikekalkan mengikut waktu asal.** Ini ialah kemas kini status selepas pelepasan yang tidak wujud pada checkpoint awal.

- **OWNER DESIGN APPROVED:** 5 skrin, emerald/emas, popup modal 3D, mod gelap, navigasi mobile, dan pilihan sesi progresif telah diluluskan sebagai milestone reka bentuk.
- **OWNER LIVE GO:** pemindahan reka bentuk ke frontend production diberi kebenaran secara berasingan, bersyarat QA dan tanpa perubahan backend.
- **PR #6:** prototaip interaktif terasing menggunakan data rekaan; kekal Draft, tidak di-merge.
- **PR #7:** frontend V2 LIVE merged `2148443`, GitHub Pages release dilaporkan SUCCESS 20:31 MYT, 27 Nov 2026.
- **PR #9:** dokumentasi release merged `e37d354`.
- **Ujian:** 21/21 Playwright dengan GAS mock; 11/11 static; 29/29 date guard; 9/9 legacy regression. Production read-only: UI, status awam, kuota (Batch 1 70/70; Batch 2 76/70), paparan luar tarikh, mod gelap dan telefon PASS menurut laporan release. Tidak semua tindakan urusetia atau penulisan sebenar telah disahkan.
- **Production scope:** `index.html`, `assets/gs-v2.js`, `assets/gs-v2.css` sahaja bagi fungsi frontend; GAS V7, Sheets, AutoCrat, eCERT dan URL QR poster tidak berubah.
- **Rollback:** cawangan `rollback/pre-ui-v2-20261127` menunjuk keadaan sebelum V2 (`114eb7b`); merge UI `2148443` boleh di-revert jika diperlukan.
- **28 Nov UAT:** log masuk urusetia, buka `b1d1`, uji dummy resit/telefon selepas semak identiti terkini dalam Sheets, sahkan tepat satu baris `KEHADIRAN_GS` dan hasil `SUDAH DIREKOD` pada cubaan kedua. **Belum diuji pada waktu checkpoint**, jadi status E2E masih **PENDING**.
- **eCERT:** Phase 2 Google QA 32 assertion PASS dan CI PASS pada Draft PR #5 (staging sahaja); Phase 3 reliability sedang diusahakan secara terasing. eCERT production **HOLD**, tiada email tambahan dibenarkan.

Lihat [rekod LIVE UI V2](GS_UI_V2_LIVE_RELEASE_2026-11-27.md) untuk bukti ujian terperinci, batasan dan arahan rollback.


## 9. Checkpoint tambahan — Native eCERT Phase 3 Reliability QA selesai (27 November, sekitar 20:51 MYT)

**Status milestone:** QA terasing **PASS WITH LIMITATIONS**, **production eCERT HOLD**. Baca bukti penuh dalam [Phase 3 report pada branch staging](https://github.com/shafielegacy/generasisunnah/blob/staging/ecert-phase3-reliability/staging/native-ecert/PHASE3_RELIABILITY_QA_2026-11-27.md).

- [Draft PR #8](https://github.com/shafielegacy/generasisunnah/pull/8), `staging/ecert-phase3-reliability` → `staging/ecert-phase2-google-qa`, commit `13a0120791507cf499be6e39d25cf5b2fee47bc3`: **open/Draft, tidak merge**.
- [GitHub Actions akhir](https://github.com/shafielegacy/generasisunnah/actions/runs/46002351278): **completed/success** pada commit Phase 3 tersebut; regresi offline **57/57 PASS** (25 eligibility, 10 Phase 2, 22 reliability).
- **Google concurrency sebenar PASS**: `phase3ConcurrentA` dan `phase3ConcurrentB` bertindih; permintaan B ditolak ketika A memegang ScriptLock; hanya satu sijil/PDF identiti concurrent terhasil.
- **Controlled post-PDF crash PASS**: PDF kekal, ledger `REVIEW_REQUIRED`, percubaan jana semula disekat. Read-only reconciliation menyemak Attempt_ID, output PDF ID/hash, ledger dan audit.
- **Explicit QA recovery PASS**: selepas semakan operator/QA, PDF asal yang sama dipautkan (ID/hash/bilangan fail tidak berubah), bukan dijana gantian. Konflik evidence menyebabkan `REVIEW_REQUIRED` dan recovery ditolak.
- **Batch 2 Google QA PASS**: tutup batch menggunakan sempadan waktu Malaysia selepas Hari 2, satu-hari tidak layak, sijil QA bertanda `UJIAN SAHAJA — TIDAK SAH`.
- **Final Google read-only verification PASS**: 3 PDF, 3 salinan Slides, 4 Attempt_ID, 3 ledger `GENERATED`, satu `GENERATING` abandoned yang masih direkod sebagai `REVIEW_REQUIRED` semasa rekonsiliasi. Tiada penghapusan PDF atau reset reservation.
- **NOT VERIFIED**: timeout semula jadi Apps Script, gangguan provider, cross-project competing writers, peranan operator production serta audit kalis gangguan. Deliberate cancellation dalam ujian bukan bukti natural timeout.
- **STRICT HOLD**: e-mel OFF, tiada trigger, tiada sijil peserta sebenar, tiada merge/deploy GAS, Sheets atau AutoCrat production.

**Keutamaan operasi seterusnya:** 28 November `b1d1` — semak UI V2 login urusetia, buka check-in, telefon dummy `R0146`/`6789` selepas sahkan formula resit dan **tepat satu** baris `KEHADIRAN_GS`; cubaan kedua mesti menghasilkan `SUDAH DIREKOD` tanpa duplikasi. Jangan alihkan perhatian atau ubah production sebelum ujian lapangan.


## 10. Checkpoint operasi akhir — Live Dummy UAT dibatalkan dan rollback GAS berjaya (27 Nov 2026, 22:46–22:55 MYT)

**Keputusan:** temporary QA deployment **DIBATALKAN/ROLLBACK PASS**; GAS production **Version 7 RESTORED**; Premium UI V2 LIVE tidak diubah; UAT sebenar check-in → `KEHADIRAN_GS` kekal **PENDING**.

### Kronologi dan bukti
1. OWNER meluluskan ujian pengecualian tarikh **khusus dummy**, bukan pembukaan akses umum. Claude menyediakan branch `qa/r0146-one-dummy-uat-20261127` commit `0562f48` (tidak merge), dengan `Code.gs` QA dan ujian 15/15 offline PASS serta regresi 29/29 PASS. Pengecualian bertarikh MYT 27 Nov sahaja, terhad kepada self-check-in `GS26_R0146` / `6789`, `b1d1`, memerlukan flag sesi OPEN. Ini bukti offline; bukan UAT Google sebenar.
2. OWNER membandingkan editor Apps Script dengan `main`: baseline `Code.gs` **389 baris / SHA-256 `34c3b9edec64`**, `Checkin.html` **91 baris / `206c4cba4e5b`**, kedua-duanya **SAMA**. Version 7 deployment asal 27 Nov 17:07 MYT disahkan boleh dipilih.
3. OWNER menyalin Version A ke HEAD editor dan memeriksa hash sementara **400 baris / `f2494c6bd59b`**. GAS **Version 8** dideploy sekitar **22:46 MYT** pada *deployment yang sama*, URL `/exec` kekal. `Checkin.html` tidak diubah.
4. **Ujian baca sahaja** `gsSelfCheckinStatus` pada Version 8 dengan `GS26_R0146` / `6789` mendapat `{ok:false,error:'Maklumat tidak dapat disahkan...'}`. Tidak terdapat bukti sebarang `gsSelfCheckin` write dilakukan atau berjaya.
5. Diagnosis melalui **Google Sheets rasmi**: pendaftaran baharu telah mengubah formula `No_Resit` berasaskan baris. Pada snapshot akhir 27 Nov, **resit `GS26_R0146` milik peserta sebenar Batch 2**, sementara `PESERTA DUMMY CHECK-IN GS26` menggunakan **`GS26_R0147`** dengan digit akhir telefon `6789`. `KEHADIRAN_GS` diperiksa: **0 rekod kehadiran**. **Jangan gunakan `R0146` dalam QA lagi.**
6. OWNER menghentikan ujian dan **memilih Version 7** pada deployment aktif yang sama. Screenshot mengesahkan `Deployment successfully updated — Version 7 on 27 Nov 2026, 17:07` dan deployment ID asal tidak berubah. Editor `Code.gs` kemudian dipulihkan kepada `main` dengan padanan **`SAMA / 389 baris / 34c3b9edec64`**; `Checkin.html` kekal padanan asal. **Version 8 tidak lagi digunakan oleh deployment LIVE** mengikut bukti owner.
7. **Tiada pengubahsuaian pendaftaran, kehadiran, formula, AutoCrat atau eCERT** dibuat dalam proses pemulihan ini. Temporary QA branch kekal berasingan dan tidak perlu di-merge.

### Operational GO/NO-GO — 28 November
- **Status:** sistem sedia untuk ujian lapangan; **bukan** E2E write PASS lagi. GAS production V7 dan Premium UI V2 LIVE dipelihara.
- Sebelum kaunter bermula, urusetia **semak sesi `b1d1` dan flag OPEN/CLOSED**. Flag sebelum ujian dilaporkan OPEN; selepas tengah malam akses mungkin tersedia walaupun kaunter belum sedia. Operator boleh tutup sesi pada 28 Nov jika mahu mengawal kemasukan.
- **Ujian dummy:** cari nama `PESERTA DUMMY CHECK-IN GS26` dalam `Daftar GS`; sahkan `No_Resit` semasa dan 4 digit telefon **6789**. Snapshot terakhir ialah **`GS26_R0147`**, tetapi **jangan hard-code** kerana boleh berubah jika pendaftaran bertambah.
- Menggunakan portal rasmi/QR sebenar pada tarikh program, hantar **satu** check-in; verify `KEHADIRAN_GS` mengandungi tepat satu `b1d1` / resit dummy semasa. Cuba kedua sekali untuk **SUDAH DIREKOD** tanpa baris pendua. Had percubaan **8 bagi setiap resit / 15 minit**; elakkan percubaan berulang.
- Jika terdapat ralat atau UNKNOWN, **jangan spam write**: semak dahulu status serta tab kehadiran; ambil screenshot. Semasa kaunter sibuk, gunakan **backup kehadiran kertas** dengan nama, resit, sesi, masa, dan buat rekonsiliasi selepas sistem stabil.
- **Jika gagal kritikal:** selidik sama ada frontend, login staf, state OPEN/CLOSED, roster receipt drift, server error atau jaringan. Jangan ubah formula/resit atau deploy hotfix tidak diuji ketika peserta menunggu. Frontend rollback tersedia pada `rollback/pre-ui-v2-20261127`; backend baseline ialah GAS Version 7 pada deployment `/exec` yang sama.

### Item pasca-program
- Reka pengenal resit/sijil **immutable** yang tidak berubah apabila baris baharu ditambah atau susunan roster berubah. Audit hubungan resit yang sudah dihantar, dedup attendance dan pemetaan sijil sebelum migrasi; **jangan tukar formula LIVE semasa program**.
- Sahkan ujian production E2E sebenar bagi setiap sesi program dan catat bukti status.
- Native eCERT Phase 3 QA kekal pada [Draft PR #8](https://github.com/shafielegacy/generasisunnah/pull/8); production eCERT **HOLD**.

**Release gate akhir 27 Nov:** UI V2 LIVE = PASS; GAS V7 rollback = PASS; dummy pre-date QA write = **NOT COMPLETED**; check-in E2E pada hari program = **PENDING**; eCERT production = **HOLD**.


## 11. Milestone UAT LIVE 28 November 2026 — Batch 1 Hari 1

**Status: PASS WITH LIMITATIONS**, disahkan owner melalui screenshot portal dan rekod kehadiran Google Sheets production.

- Pada 28 November selepas tengah malam, UI memaparkan check-in dibuka untuk `b1d1`; backend kekal Google Apps Script Version 7, portal Premium UI V2.
- Self-check-in peserta dummy menggunakan resit `GS26_R0147` berjaya dan rekod sesi `b1d1` masuk ke `KEHADIRAN_GS` melalui kaedah `QR PESERTA` pada 00:00:50 MYT.
- Owner memadam baris dummy ujian pertama sebelum ujian kedua melalui Urusetia. Modal pengesahan `Tandakan HADIR?` berfungsi dan rekod baharu masuk melalui kaedah `URUS SETIA` pada 00:02:35 MYT. **Ini ujian berurutan, bukan dua penulisan serentak.**
- Carian nama peserta di dashboard Urusetia berjaya, dan selepas muat semula owner mengesahkan 68 berdaftar, 1 hadir, 67 belum hadir; peserta dummy berstatus `HADIR`.
- Percubaan menggunakan resit salah `R0157` ditolak dengan betul. Percubaan dengan resit tepat selepas hadir menghasilkan paparan `SUDAH DIREKOD`. Semakan Sheets menunjukkan satu rekod bagi resit dummy dan sesi yang diuji. Tiada ujian concurrency sebenar.
- **UX backlog:** notifikasi berjaya untuk Urusetia berupa toast di bahagian bawah skrin, kurang jelas. Cadangkan modal kejayaan berpusat selepas program, tanpa mengubah API atau auto-retry.
- **Risk backlog:** formula resit bergantung kedudukan baris; reka identifier stabil selepas program dengan audit rekod sedia ada.
- **Operational close:** owner telah menutup suis check-in `b1d1` selepas UAT tengah malam. Pada pagi 28 Nov, urusetia perlu membuka semula apabila kaunter bersedia; refresh dashboard dan semak rekod. Jangan padam rekod QA lagi.
- **Production freeze:** tiada perubahan kod, GAS deployment, Sheets formula/schema, QR atau AutoCrat. Native eCERT masih HOLD.
- **Belum disahkan:** UAT hari kedua, Batch 2, simultaneous write/concurrency serta semua kes network failure.

**Keputusan akhir:** fungsi asas QR dan Urusetia LIVE telah melepasi UAT sesi `b1d1` dengan batasan di atas. Rekod sejarah pra-UAT dalam seksyen sebelumnya kekal sebagai snapshot pada waktunya.
