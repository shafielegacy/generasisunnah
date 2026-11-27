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
