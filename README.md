# Generasi Sunnah 2026

**Mini Check-in Kehadiran Peserta**  
Program Generasi Sunnah 2026 · Surau Jabal Nur

🌐 **[Buka Portal Generasi Sunnah](https://shafielegacy.github.io/generasisunnah/)**

Portal ringkas untuk pendaftaran kehadiran semasa program:

- **Peserta** — imbas QR rasmi di lokasi dan sahkan kehadiran.
- **Urusetia** — semak senarai peserta dan rekod kehadiran.

**Tarikh program**
- Batch 1: 28–29 November 2026
- Batch 2: 5–6 Disember 2026

Dibangunkan untuk kegunaan **Generasi Sunnah 2026**.

## Status terkini — Manual Check-in Control V2

**26 November 2026 | GAS deployment V5 | UI verification: PASS (read-only)**

- Urusetia boleh **buka/tutup check-in pada bila-bila masa**, termasuk sebelum dan selepas tarikh program.
- Pembukaan di luar tarikh sesi memerlukan **pengesahan tambahan**.
- Semua sesi bermula **DITUTUP** selepas migrasi ke kawalan manual.
- QR lama dibatalkan selepas ditutup; QR baharu dijana apabila sesi dibuka semula.
- Kawalan akses urusetia, semakan QR, deduplikasi dan cap masa sebenar kekal di backend.
- **Ujian LIVE buka/tutup, QR dan penulisan kehadiran belum dibuat**; jangan anggap end-to-end telah lulus.

📘 **[Dokumentasi release, bukti UI dan checklist operasi](docs/GS_MANUAL_CHECKIN_V5_2026-11-26.md)**

Kod GitHub Pages: `index.html`, `js/checkin.js` · Source GAS: `gas/Code.gs`, `gas/Checkin.html`.

> Nota: GitHub menyimpan source GAS. Deployment LIVE GAS perlu dibuat melalui Google Apps Script; source commit GitHub sahaja tidak deploy GAS.
