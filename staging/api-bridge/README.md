# Generasi Sunnah — Pembaikan “Tiada jawapan daripada GAS” (27 Nov 2026)

**STATUS: STAGING / NOT DEPLOYED.** Repo: shafielegacy/generasisunnah. Branch: staging/checkin-reliable-api-bridge-20261127. Jangan merge ke main, deploy GAS, hidupkan sesi atau tulis kehadiran untuk QA tanpa persetujuan operator.

## Diagnosis terbukti melalui source LIVE

- GitHub Pages `js/checkin.js` menghantar `POST` terus ke `script.google.com` dengan `mode:'no-cors'`.
- GAS `doPost` menyimpan jawapan dalam `CacheService`, keyed oleh `rpcId`.
- Browser perlu membaca semula jawapan melalui `<script src="?view=rpc&rid=...">` sehingga 16 pusingan.
- `no-cors` memberikan opaque response; browser tidak dapat membaca pengesahan asal. Kegagalan POST, cache, atau JSONP boleh menghasilkan mesej generik “Tiada jawapan daripada GAS”.
- Pemerhatian operator: kedua-dua telefon pernah gagal; halaman `?view=quota-page` dapat dibuka terus. Ini menunjukkan API/GAS berfungsi *sekurang-kurangnya untuk GET tersebut*, bukan bukti bahawa POST/RPC check-in berfungsi.
- Punca tepat di peranti **belum dibuktikan** tanpa log rangkaian; diagnosis ini menyatakan risiko mekanisme asal, bukan membuktikan sama ada POST, cache atau JSONP yang gagal.

## Reka bentuk staging

`staging/api-bridge/worker.mjs` ialah Cloudflare Worker server-side. Browser GitHub Pages melakukan **satu** `fetch` CORS POST kepada Worker, Worker POST kepada GAS dan membaca JSON respons GAS, termasuk redirect ContentService. Tiada polling JSONP dan tiada reroute parent dari GitHub.

- `js/checkin.js` staging menggunakan `window.GS_API_BRIDGE_URL`, gagal tertutup jika belum dikonfigurasi.
- `index.html` staging mempunyai placeholder kosong untuk endpoint Worker. **Tidak boleh publish sebelum URL QA siap.**
- `gas/Code.gs` staging mempunyai tarikh wajib tepat pada backend: 28–29 Nov dan 5–6 Dis sahaja. Jam dan tarikh `gsDay_()` menggunakan `Asia/Kuala_Lumpur`; urusetia tidak boleh membuka sesi sebelum tarikh; semakan masa diulangi di write guard.
- QR Monkey poster kekal menunjuk ke GitHub homepage, tanpa QR lokasi baharu. Nombor resit ringkas + 4 digit akhir telefon diperlukan.
- Tindakan tulis dan log masuk masih diperiksa di GAS (operator login, validation, rate limit, anti-duplicate and LockService).

## Kawalan keselamatan Worker

- Hanya `Origin: https://shafielegacy.github.io` dibenarkan untuk browser dan preflight. Header Origin **bukan pengesahan identiti**, bukan pengganti pemeriksaan backend.
- Laluan tunggal `/api/checkin`, senarai tindakan backend terhad, format/saiz body dihadkan.
- Tiada token pengguna atau data peserta dalam URL, tiada cookie dihantar ke GAS, tiada body logging.
- Backend URL daripada konfigurasi Worker `GS_BACKEND_URL` (jangan commit URL/test data sensitif atau staff key).
- Tiada retry automatik untuk POST. Jika pemprosesan GAS mungkin berlaku tetapi respons hilang, tunjuk status **tidak pasti**, kemudian operator semak `KEHADIRAN_GS` terlebih dahulu; jangan suruh parent submit berulang kali.
- Response Worker `Cache-Control: no-store`, origin CORS khusus, data dan error mengikut kontrak JSON asal.
- Had API Worker dan rate limit tambahan pada platform perlu dipertimbangkan untuk produksi.

## Cara menguji selepas akaun Cloudflare tersedia

1. Sediakan Worker QA yang berasingan dan gunakan konfigurasi URL GAS **QA** berasingan; jangan halakan Worker QA kepada spreadsheet LIVE ketika ujian tulis.
2. Pastikan `GS_BACKEND_URL` ialah URL GAS QA `/exec` tanpa parameter; deploy Worker di subdomain QA `*.workers.dev`.
3. Gunakan checkout staging di GitHub atau clone lokal bagi UI QA; isi `window.GS_API_BRIDGE_URL` dengan `https://<worker-qa-host>/api/checkin` pada **staging sahaja**.
4. Jalankan `gsPublicStatus`: periksa `HTTP 200` dan `ok:true` pada telefon Pixel 10 dan ROG; browser tidak patut melakukan `?view=rpc` atau `?view=quota` untuk check-in.
5. Dengan jam QA 27 Nov, cubaan submit dummy `R0144` + 4-digit mesti ditolak oleh **backend**. Jangan gunakan dummy rasmi dalam ujian tulis sehingga pemisahan QA disahkan.
6. Dengan sumber QA dan hari 28 Nov tersimulasi, buka sesi QA dan lakukan satu check-in dummy; sahkan satu row sahaja, tarikh sebenar dan mesej berjaya.
7. Uji double submit, wrong phone, wrong batch, tarikh salah, timeout/unknown, CORS blocked, quota/data status. Uji respons pada dua telefon sebenar melalui HTTPS.
8. Hanya selepas bukti ini lengkap, sediakan release plan untuk `main` + GAS production, dengan rollback dan OWNER GO baharu.

## Ujian automatik yang tersedia

- `node tests/checkin-date-gate.test.js` (13 kes; data mock).
- `node staging/api-bridge/test-worker.cjs` (12 kes; network fetch dimock, tiada panggilan Google).
- GitHub Actions `GS26 bridge isolated QA` memeriksa sintaks dan kedua-dua suite.

**Gate:** PASS mock tidak bermaksud check-in LIVE berjaya. Untuk 28 November 2026, sediakan **manual urusetia check-in** sebagai contingency jika bridge belum siap UAT. Jangan anggap portal telah pulih semata-mata kerana perubahan staging ini.
