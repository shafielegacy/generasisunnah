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


---

## 27 November 2026 — POST-RELEASE CHECKPOINT (mengatasi status STAGING di bahagian atas)

> **Status terkini:** PR #3 dan #4 **SUDAH MERGED ke `main`**; GAS **V7 LIVE**. Bahagian audit asal di atas dikekalkan sebagai **rekod pra-release**; arahan “belum merge / belum deploy” di atas **tidak lagi terpakai**.

### Release trail yang disahkan

| Perkara | Bukti/status |
| --- | --- |
| GAS backend | Operator menunjukkan **Version 7**, 27 Nov 2026, **17:07 MYT**, deployment ID sedia ada dikekalkan; tidak membuat deployment baharu |
| Backend read-only | Chrome console dari portal mendapat `{ok:true,data:{…}}` dan `V7 VERIFIED: true` berdasarkan `gsPublicStatus().simpleCheckin === true` |
| PR #3 | **Merged** ke `main`, merge commit `1a741ee2b2ac13a607619c95c86e3bf18adacb14`. Direct CORS, server-side date lock, fixed poster QR, tri-state outcome |
| PR #4 | **Merged** ke `main`, merge commit `36cdf251554faec5448bdda93ab68686a8bf2d58`. Urusetia session selector sah secara automatik; ralat “Sesi tidak sah” lama dipadam selepas snapshot berjaya; `checkin.js` cache-busted |
| QA mock | Asal 27 backend + 9 frontend **PASS**; hotfix PR #4 dilaporkan 38/38 **PASS**. Semua ujian ini offline/mock, **bukan** bukti penulisan LIVE |
| Mobile quota | Pengguna menunjukkan status pendaftaran dan timestamp LIVE pada telefon, serta Mini Check-in dapat diakses; isu paparan mobile sebelumnya kelihatan pulih |
| Penolakan tarikh (telefon) | Pengguna scan QR poster, masuk `R0146` / `6789` pada 27 Nov; backend membalas **“Check-in belum bermula ... Tiada rekod dibuat.”** — bukti POST/respons backend dan sekatan tarikh |
| Urusetia | Login, sesi auto-pilih, senarai peserta dan pembetulan mesej ralat **PASS menurut operator** |
| E2E telefon → Sheet | **BELUM LULUS/DIUJI** pada 27 Nov. Diperlukan pada 28 Nov sebelum status penuh PASS |

### Data QA dan ketepatan resit

- Semakan **read-only** terhadap workbook rasmi pada 27 Nov mendapati `Daftar GS` mempunyai dummy **`PESERTA DUMMY CHECK-IN GS26`** pada baris 147 dengan resit formula **`GS26_R0146`**. Resit **`GS26_R0144` kini milik peserta sebenar** (bukan dummy) dan tidak boleh digunakan untuk QA.
- Pada bacaan yang sama, `KEHADIRAN_GS!A1:G4` hanya memulangkan header, **tiada data kehadiran** ketika itu. Ini hanya snapshot, bukan jaminan keadaan esok.
- Terdapat ujian kehadiran dummy pada rekod/masa terdahulu; jangan andaikan rekod terdahulu masih ada atau selamat dipadam. Semak Sheet LIVE semula sebelum cleanup.
- `No_Resit` dijana melalui formula bergantung susunan/baris; **jangan hard-code `R0146` sebagai ID kekal**, semak resit dummy terkini pada hari program. Jangan edit atau delete pendaftaran untuk “memulihkan” penomboran.

### SOP operasi 28 November (ustaz urus sendiri; owner tiada di lokasi)

1. Buka portal GitHub Pages pada tarikh **28 Nov MYT** → **Urusetia**, login, pastikan **`b1d1`** dan status **DITUTUP** sebelum mula.
2. Bila kaunter bersedia, klik **Buka check-in**. Pastikan sesi yang betul terpapar, jangan buka sesi lain.
3. Buat satu QA menggunakan dummy **hanya selepas mengesahkan resit dummy masih sah**; contoh snapshot 27 Nov: `R0146` + `6789`. Scan QR poster yang sama pada telefon, masukkan maklumat dan tekan **Sahkan kehadiran**.
4. Semak **`KEHADIRAN_GS`**: tepat satu baris untuk **`b1d1` + `GS26_R0146`** (atau resit dummy terkini). Jika tidak dijumpai, **JANGAN** umum PASS.
5. Ulang check-in dummy pada telefon kedua: frontend mesti menunjukkan **SUDAH DIREKOD**, dan jumlah baris untuk sesi+resit **kekal satu**.
6. Buka operasi kepada peserta sebenar. Jika respons **UNKNOWN / STATUS TIDAK DIKETAHUI**, jangan ulang tanpa semakan. Urusetia boleh cari nama dan tanda hadir secara manual **pada tarikh sesi**; jika tiada sambungan, gunakan daftar kertas dan lakukan rekonsiliasi.
7. Selepas program, **Tutup check-in**, semak statistik dan padankan daftar manual jika digunakan.

**Peraturan penting:** tiada Cloudflare bridge, tiada QR baharu, tiada migrasi data, tiada perubahan pendaftaran/AutoCrat. Tiada nilai rahsia/token urusetia dalam repo. Tarikh sesi **mandatori pada backend**, walaupun butang UI “Tanda hadir” kelihatan.

### Baki risiko / follow-up selepas program

- **P0 operasi:** mobile-to-`KEHADIRAN_GS` benar-benar menulis satu baris pada 28 Nov; deduplikasi telefon kedua. Hanya ini membolehkan tanda **FULL PRODUCTION PASS**.
- **P1:** D7 roster malformed row boleh menghalang semua check-in; D8 global lockout urusetia; D9 rate limit berasaskan resit yang boleh digunakan untuk mengganggu peserta lain. Tidak dibaiki dalam release kecemasan; rancang security hardening selepas acara.
- **P2:** Kesan gagal pada GitHub Actions workflow **staging** lama bukan bukti frontend LIVE gagal. Sahkan run/context sebelum padam workflow; tiada perubahan CI diperlukan untuk acara.
- **P2:** Paparan Batch 1 68/70 tetapi berstatus “PENUH” berkemungkinan dipacu logik/formula kuota, **belum diaudit sebagai bug**; jangan tukar formula semasa acara.

### Rollback kecemasan

- **GAS:** *Deploy → Manage deployments → Edit deployment sedia ada → pilih versi sebelumnya → Deploy*; URL `/exec` kekal. **Amaran:** versi lama mungkin tidak menguatkuasakan date lock / perlukan QR dinamik; **jangan rollback tanpa kawalan operasi dan kelulusan owner**.
- **Frontend:** revert PR #4 (jika hanya isu dashboard) atau PR #3 (jika perlu rollback penuh) secara terkawal dengan versi GAS yang serasi. Jangan force push atau memadam rekod.

**Checkpoint akhir 27 Nov:** Mobile UI + date rejection **PASS**; backend V7 **LIVE**; GitHub `main` hotfix **LIVE source**; **E2E persistence PENDING**.
