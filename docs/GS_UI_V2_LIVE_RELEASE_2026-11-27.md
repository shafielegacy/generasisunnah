# Premium UI V2 — Pelepasan LIVE (27 November 2026)

**Skop:** frontend GitHub Pages sahaja (OWNER GO 27 Nov 2026). Tiada perubahan pada GAS V7, Google Sheets, AutoCrat atau eCERT. Tiada e-mel dihantar. Tiada redeploy GAS.

| Perkara | Nilai |
| --- | --- |
| PR | [#7](https://github.com/shafielegacy/generasisunnah/pull/7) (merge commit) |
| Commit pelepasan | `c896501` |
| Merge commit di `main` | `2148443` |
| GitHub Pages | `pages build and deployment` untuk `2148443`: **success** (27 Nov 2026, 20:31 MYT) |
| Rollback ref | cawangan `rollback/pre-ui-v2-20261127` = `114eb7b` (main sebelum V2) |
| URL production | https://shafielegacy.github.io/generasisunnah/ (tidak berubah; QR poster kekal) |
| Endpoint GAS | `/exec` V7 yang sama (`AKfycby5gw…xvBF4hQ`) |

## Apa yang berubah

- `index.html`: reka bentuk V2 (Utama, Kuota, Check-in, Urusetia, Panduan status), modal 3D, mod gelap (auto → cerah → gelap), navigasi bawah mudah alih.
- `assets/gs-v2.js`: aplikasi live, guna 8 tindakan GAS V7 sedia ada sahaja: `gsPublicStatus`, `gsSelfCheckin`, `gsSelfCheckinStatus`, `gsStaffLogin`, `gsStaffLogout`, `gsStaffSnapshot`, `gsStaffSetOpen`, `gsStaffCheckin`. Kuota guna `?view=quota` (dibaca sebagai data, tidak dilaksanakan) dengan fallback iframe `?view=quota-page`.
- `assets/gs-v2.css`: gaya V2.
- `js/checkin.js` / `js/checkin.css` legasi kekal dalam repo tetapi **tidak lagi dimuatkan**.
- Dibuang kerana GAS V7 tidak menyokong: suapan "Aktiviti terkini", masa/kaedah check-in pada senarai, nama peserta pada skrin BERJAYA. Halaman "Panduan" hanya memaparkan contoh berlabel.

## Keselamatan dikekalkan

- Tarikh dan sesi tetap disahkan di server (`gsRequireEvent_`, LockService, dedupe). Frontend hanya menambah halangan awal: di luar tarikh program, modal dipaparkan dan **tiada request dihantar**.
- Satu tulisan bagi setiap tekan; butang dikunci semasa menghantar; **tiada auto-retry**. Respons tidak pasti → semakan baca-sahaja `gsSelfCheckinStatus` (6 s + 5 s) → BERJAYA / SUDAH DIREKOD / GAGAL / TIDAK DIKETAHUI (cooldown 30 s).
- Urusetia: sesi akan datang dikunci (kelabu + ikon kunci), sesi hari ini dipilih automatik (Asia/Kuala_Lumpur), sesi lampau baca-sahaja (hanya boleh **ditutup**). Buka/tutup dan rekod manual memerlukan pengesahan modal.
- Tiada kunci, token, ID Sheet atau data peserta disimpan dalam kod atau pelayar (localStorage hanya `gs26-theme`). Token urusetia hanya dalam memori.

## Ujian sebelum merge (semua PASS, GAS dimock / offline)

| Ujian | Keputusan |
| --- | --- |
| `node tests/v2-frontend-integration.test.js` (Playwright, GAS dimock) | 21/21 |
| `node tests/v2-release-static.test.js` | 11/11 |
| `node tests/checkin-date-gate.test.js` (regresi GAS V7) | 29/29 |
| `node tests/checkin-frontend-outcomes.test.js` (legasi) | 9/9 |

Integrasi meliputi: format request, semua hasil (BERJAYA, SUDAH, GAGAL, TIDAK DIKETAHUI, sambungan), tiada retry, tekan dua kali, buka kunci progresif (27 & 29 Nov), tulisan urusetia, sesi tamat, logout, carian, kegagalan kuota, tema, dan tiada limpahan mudah alih pada lima skrin.

## Pengesahan production (27 Nov 2026, baca-sahaja, pelayar sebenar)

| Fungsi | Keputusan |
| --- | --- |
| Reka bentuk V2 dimuatkan dari URL production, aset `v=20261127-v2live-1` | PASS |
| `gsPublicStatus` live (1 POST semasa muat) | PASS |
| Kuota live (`?view=quota`): Batch 1 70/70, Batch 2 76/70 | PASS |
| Check-in 27 Nov: banner "Di luar tarikh program", tekan Sahkan → modal `outOfDate`, **0 POST dihantar** | PASS |
| Mudah alih 375 px: 5 skrin tanpa limpahan, tabbar bawah | PASS |
| Mod gelap (dipulihkan ke auto selepas ujian) | PASS |
| Skrin Urusetia memaparkan borang log masuk | PASS |
| URL QR / homepage tidak berubah | PASS |
| Log masuk urusetia, buka/tutup, rekod manual, check-in sebenar | **NOT VERIFIED** (tiada kunci; tiada tulisan dibenarkan sebelum 28 Nov) |

## Had diketahui

- Tulisan sebenar (check-in peserta, buka/tutup, rekod manual) hanya disahkan dengan GAS dimock. Sahkan pada 28 Nov menggunakan dummy `R0146`/`6789` mengikut panduan urusetia di README. **Jangan guna `R0144`.**
- Carian urusetia dihadkan 100 hasil oleh GAS V7.
- Jam di pelayar hanya untuk paparan; GAS kekal sumber kebenaran tarikh.

## Rollback

1. Cepat: `git revert -m 1 2148443` pada `main`, push → GitHub Pages kembali ke UI lama (`114eb7b`).
2. Alternatif: set semula kandungan `index.html` daripada cawangan `rollback/pre-ui-v2-20261127`.
3. GAS tidak perlu disentuh; endpoint dan kontrak tidak berubah.


## Checkpoint OWNER — Milestone Premium UI V2 LIVE disahkan (27 Nov 2026)

**Keputusan OWNER:** reka bentuk Premium UI V2 telah **LULUS MILESTONE**, kemudian OWNER secara berasingan meluluskan **integrasi dan penerbitan frontend LIVE**. Ini bukan kelulusan pengeluaran eCERT atau ubah suai GAS. Sumber milestone ialah hasil Claude Code dan verifikasi GitHub PR #7 / #9; keputusan ujian yang dilaporkan mesti dibezakan daripada UAT penulisan production.

### Bukti release dan integriti skop
- **PR #6** ialah prototaip berdata rekaan: kekal Draft, **jangan merge** ke production.
- **PR #7** ([frontend LIVE](https://github.com/shafielegacy/generasisunnah/pull/7)): merged ke `main`, SHA `214844346f15a4e01876cc834ca55d73029655c9`.
- **PR #9** ([dokumen release](https://github.com/shafielegacy/generasisunnah/pull/9)): merged ke `main`, SHA `e37d354cb695d4936234167f789a665956928f7a`.
- GitHub Pages dilaporkan **SUCCESS 27 Nov, 20:31 MYT**; URL asal, QR poster dan GAS V7 `/exec` kekal.
- Fail produksi UI baharu: `index.html`, `assets/gs-v2.js`, `assets/gs-v2.css`; skrip legacy `js/checkin.js` tidak dimuatkan oleh V2.
- Rollback: `rollback/pre-ui-v2-20261127` pada `114eb7b`; gunakan revert merge `2148443` jika perlu. Pastikan prosedur diuji/diteliti oleh operator sebelum rollback.

### Pintu penerimaan operasi 28 November (BELUM PASS pada checkpoint ini)
1. Log masuk urusetia dan pilih **Batch 1 Hari 1 / `b1d1`** pada tarikh sebenar.
2. Buka check-in oleh urusetia; jangan cuba melakukan penulisan luar tarikh program.
3. Semak kembali identiti dummy di `Daftar GS` sebelum ujian (formula resit boleh berubah). Pada snapshot 27 Nov: `GS26_R0146`, 4 digit `6789`.
4. Dari telefon: input `R0146` + `6789` → **BERJAYA**; semak `KEHADIRAN_GS` mempunyai **tepat satu** rekod `GS26_R0146` untuk `b1d1`.
5. Uji sekali lagi dari telefon lain → **SUDAH DIREKOD**, masih satu rekod.
6. Jika `TIDAK DIKETAHUI`, jangan berulang kali tekan; semak snapshot/status baca-sahaja dan catat kehadiran kertas jika perlu.

**Had bukti:** 21/21 ujian Playwright menggunakan GAS dimock; 11/11 statik, 29/29 date guard, 9/9 regresi legacy ialah QA, **bukan** bukti penulisan sebenar. Login staf, buka/tutup sesi, check-in manual dan self check-in production masih **NOT VERIFIED** sehingga sesi 28 Nov. Tiada perubahan eCERT atau AutoCrat dibenarkan oleh milestone ini.

**Release gate:** UI LIVE = **PASS**; operasi tulis check-in ke Sheets = **PENDING**; eCERT production = **HOLD**.


## Addendum 27 Nov 2026, ~22:55 MYT — GAS rollback dan pembetulan SOP dummy

**Checkpoint ini menggantikan nombor resit dummy dalam seksyen UAT terdahulu, bukan mengubah bukti release frontend pada 20:31 MYT.**

- Temporary GAS Version 8 yang mengandungi pengecualian tarikh khusus `GS26_R0146` pernah dideploy sekitar 22:46 MYT bagi cubaan QA satu dummy. `gsSelfCheckinStatus` mengembalikan error padanan resit/telefon, **tidak membuktikan penulisan check-in**.
- Google Sheets rasmi mengesahkan **resit `GS26_R0146` kini milik peserta sebenar Batch 2** selepas pendaftaran baharu, manakala **dummy berada pada `GS26_R0147` / `6789`** pada snapshot akhir malam 27 Nov. Formula resit bergantung pada baris. **JANGAN gunakan `R0146` untuk QA esok.**
- OWNER **memulihkan deployment yang sama kepada GAS Version 7 (27 Nov, 17:07)** dan editor `Code.gs` sepadan semula dengan GitHub `main` (`34c3b9edec64`, 389 baris). `Checkin.html` sepadan (`206c4cba4e5b`, 91 baris); URL `/exec` asal tidak ditukar. Tiada LIVE write berjaya. Kehadiran rasmi yang diperiksa masih **0 rekod**.
- **UAT esok:** cari **PESERTA DUMMY CHECK-IN GS26** mengikut nama dalam `Daftar GS`, salin resit terkini (snapshot `R0147`) dan sahkan 4 digit telefon `6789`. Gunakan portal LIVE pada tarikh 28 Nov, verify satu baris `b1d1`, kemudian satu cubaan pendua tanpa baris tambahan.
- **Backup:** catat nama/resit/sesi/masa atas kertas sekiranya network, frontend atau GAS bermasalah. UNKNOWN → semak status Sheets terlebih dahulu, jangan terus cuba menulis lagi.
- Frontend Premium UI V2 kekal LIVE. **Production freeze** sehingga UAT; eCERT production HOLD. Rujuk [Project History checkpoint 10](GS_PROJECT_HISTORY_AND_RELEASE_2026-11-27.md).


## Addendum UAT LIVE — 28 November 2026 selepas tengah malam

**PASS WITH LIMITATIONS untuk `b1d1`:** Premium UI V2 dan GAS Version 7 telah berjaya digunakan pada tarikh sebenar untuk self-check-in, check-in Urusetia, carian nama dan bacaan semula dashboard daripada `KEHADIRAN_GS`. Dummy menggunakan resit `R0147`; rekod QR pertama telah dipadam secara manual oleh operator sebelum menguji penulisan Urusetia, maka kedua-dua penulisan ialah ujian berurutan. Cubaan resit salah `R0157` ditolak; resit betul selepas hadir memaparkan `SUDAH DIREKOD`. Rekod akhir yang dilihat ialah satu baris kehadiran dan dashboard selepas refresh menunjukkan 68 berdaftar / 1 hadir / 67 belum hadir.

**Penemuan UX:** selepas Urusetia menanda `HADIR`, sistem memang memberikan toast berjaya, tetapi ia muncul di bawah halaman panjang dan kurang ketara. Cadangan selepas program: modal kejayaan berpusat dengan nama, resit, sesi dan status; kekalkan dedupe, no auto-retry dan respon backend sebagai sumber kebenaran. **Belum dilaksanakan.**

**Operation:** owner telah menutup kaunter selepas UAT malam. Buka semula `b1d1` hanya apabila kaunter pagi sudah bersedia. **Production freeze** (tiada ubah GAS, frontend, Sheets atau AutoCrat). UAT sesi lain dan concurrency sebenar masih pending; eCERT production HOLD. Rujuk [sejarah checkpoint 11](GS_PROJECT_HISTORY_AND_RELEASE_2026-11-27.md).
