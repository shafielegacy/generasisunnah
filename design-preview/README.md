# Pratonton reka bentuk V2 (data rekaan)

Prototaip interaktif **Premium UI V2** untuk Generasi Sunnah 2026. Folder ini terasing sepenuhnya daripada portal production:

- Tiada panggilan ke GAS, Google Sheets, AutoCrat atau mana-mana pelayan (CSP `connect-src 'none'` + pengawal rangkaian dalam `assets/preview.js`).
- Tidak memuat `js/checkin.js` production dan tidak mengandungi URL `/exec`.
- Semua peserta, resit (`R9001–R9060`) dan angka kuota adalah rekaan.

```bash
cd design-preview && python3 -m http.server 8080   # buka http://localhost:8080
node tests/design-preview-isolation.test.js        # dari akar repo
```

Laporan penuh: [LAPORAN_UIUX_V2.md](LAPORAN_UIUX_V2.md) · Tangkap layar: [screenshots/](screenshots/)
