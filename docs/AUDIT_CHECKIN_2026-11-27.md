# Audit Check-in Generasi Sunnah 2026 — 27 Nov 2026

**Status: STAGING / DRAFT PR. Belum merge, GAS belum di-deploy.**

## Diagnosis

| # | Penemuan | Status |
| --- | --- | --- |
| D1 | `main` `js/checkin.js`: butang Sahkan disabled tanpa `?session=&code=`; QR poster buka homepage sahaja | Disahkan (kod + halaman live) |
| D2 | `gsSelfCheckin` wajibkan kod lokasi 12 hex | Disahkan |
| D3 | Tiada date guard; urusetia boleh buka di luar tarikh (`ackOutsideDate`). Live 27 Nov: `b1d1 open:true` | Disahkan |
| D4 | RPC status gagal dipaparkan sebagai "Check-in belum dibuka" (punca paparan bercanggah) | Disahkan |
| D5 | `fetch(no-cors)` menyembunyikan status HTTP; ralat GAS jadi "Tiada jawapan" selepas ~16 polling | Disahkan |
| D6 | POST mungkin sudah tulis walaupun skrin tunjuk "Tiada jawapan" | Disahkan secara logik |
| D10 | `doPost`: kegagalan `CacheService.put` selepas tulis berjaya bertukar jadi `{ok:false}` (salah lapor GAGAL) | Disahkan (kod), dibaiki |
| D11 | Ralat selepas `appendRow` (cth `flush`) dilaporkan sebagai gagal biasa | Disahkan (kod), dibaiki |
| D12 | `refreshPublic()` setiap 60 s memadam mesej keputusan | Disahkan (kod), dibaiki |
| D7 | Satu baris roster rosak menghentikan semua check-in (`gsRoster_` throw) | Disahkan (kod), belum dibaiki |
| D8 | Lockout login urusetia global (15 cubaan salah oleh sesiapa) | Disahkan (kod), belum dibaiki |
| D9 | Rate limit ikut resit; orang lain boleh kunci resit seseorang | Disahkan (kod), belum dibaiki |
| H1 | JSONP script tag menghantar cookie Google (POST tidak) → redirect akaun → polling gagal di telefon | Hipotesis; perlu log peranti |
| H2 | Had serentak GAS: 1 POST + sehingga 16 GET setiap tindakan | Hipotesis |

**Bukti transport:** dari origin `https://shafielegacy.github.io`, `fetch` POST `text/plain` (`mode:'cors'`, `credentials:'omit'`) ke `/exec` live memulangkan JSON boleh dibaca, 5/5, ~1.2–1.4 s (Chrome desktop). GET `?view=quota` juga boleh dibaca. Cloudflare Worker tidak diperlukan.

## Pembaikan

- Satu `fetch` CORS terus ke URL `/exec` yang sama. Tiada JSONP, tiada cookie, tiada retry automatik bagi POST yang menulis.
- Sesi dipilih oleh server ikut tarikh `Asia/Kuala_Lumpur`; tarikh disemak semula di dalam `LockService` sebelum `appendRow`. Semua tindakan urusetia (buka sesi, tanda hadir) juga ditolak di luar tarikh sesi.
- Tiga keputusan UI:
  - **SUCCESS**: backend `ok:true` (rekod baharu atau sudah wujud).
  - **FAILED**: backend `ok:false` tanpa `uncertain`, ATAU semakan read-only mengesahkan tiada rekod.
  - **UNKNOWN**: tiada jawapan yang boleh dipercayai, termasuk selepas semakan. Butang dikunci 30 s dan pengguna dirujuk ke urusetia.
- Selepas hasil tidak pasti, frontend memanggil `gsSelfCheckinStatus`: **read-only**, perlu resit + 4 digit yang sepadan, rate limit sendiri, maksimum 2 kali. POST yang menulis tidak pernah diulang secara automatik.
- Double-submit: butang disabled sepanjang request dan semakan; flag `submitting` menolak submit kedua.

### Risiko baki (respons hilang selepas tulis)

- Semakan read-only boleh berlaku sebelum POST asal yang lambat selesai, dan melaporkan "belum direkod". Jika pengguna tekan semula, dedupe (sesi + resit) di bawah lock memulangkan `already:true`, jadi tiada baris berganda. Risiko yang tinggal ialah mesej sahaja. Mitigasi: tunggu 6 s sebelum semakan pertama.
- Dedupe bergantung pada semua penulisan melalui `gsWriteCheckin_`. Edit manual pada `KEHADIRAN_GS` (cth menukar No_Resit atau Sesi) boleh mematahkan dedupe.
- Setiap tekanan semula menggunakan kuota rate limit (8 / 15 min / resit).

## Ujian offline

- `node tests/checkin-date-gate.test.js`: 26 ujian (4 tarikh program, 27/30 Nov, batch/telefon salah, urusetia di luar tarikh, satu baris + dedupe, tulis tidak pasti, cache gagal, status read-only).
- `node tests/checkin-frontend-outcomes.test.js`: 9 ujian (SUCCESS / FAILED / UNKNOWN, tiada retry POST, double tap, status gagal tidak menyekat).

Semua ujian dimock. **Belum ada ujian telefon-ke-spreadsheet.**

## Deployment (selepas review bebas dan OWNER GO)

1. Urusetia tutup `b1d1` sekarang.
2. Catat versi GAS semasa. Tampal `gas/Code.gs`. **Deploy → Manage deployments → edit deployment sedia ada → New version.** Jangan buat deployment baharu (URL akan berubah). Kekalkan *Execute as: Me*, *Anyone*.
3. Sahkan `gsPublicStatus` memulangkan `simpleCheckin:true`.
4. 27 Nov: Pixel 10 + ROG, `R0144`/`6789` mesti DITOLAK (tiada tulis).
5. Merge PR. `checkin.js?v=` memaksa JS baharu; `index.html` mungkin di-cache sehingga ~10 min.
6. 28 Nov (dengan kelulusan): satu check-in dummy → tepat satu baris dalam `KEHADIRAN_GS`; ulang dari telefon kedua → "SUDAH direkod".

## Rollback

- GAS: Manage deployments → edit → versi lama → Deploy (URL kekal).
- GitHub: revert merge commit.
- Tiada migrasi data.
