# Generasi Sunnah 2026 — Mini Check-in

Portal: https://shafielegacy.github.io/generasisunnah/

Satu GitHub Pages landing + satu Web App Google Apps Script untuk **dua cara kehadiran**: QR peserta dan carian nama urusetia. Tiada data peserta atau rahsia disimpan dalam repo awam ini.

## Status 20 November 2026

- UI GitHub Pages tersedia; pautan Web App masih perlu diisi selepas deployment.
- Kod Web App sebenar tersedia dalam `gas/Code.gs` dan `gas/Checkin.html`.
- Tab baharu `KEHADIRAN_GS` telah disediakan dalam spreadsheet asal, kosong (header sahaja).
- Source `Daftar GS`, `DASHBOARD KUOTA`, data pembayaran, resit, dan AutoCrat **tidak diubah**.
- 19/19 unit mock tests lulus dengan **data rekaan sahaja**. **Tiada ujian check-in sebenar** dijalankan.
- GAS source belum dipasang atau Web App belum dideploy oleh pembantu; check-in **belum LIVE**.

## Sesi

| Key | Hari | Tarikh |
|---|---|---|
| `b1d1` | Batch 1, Hari 1 | 28 November 2026 |
| `b1d2` | Batch 1, Hari 2 | 29 November 2026 |
| `b2d1` | Batch 2, Hari 1 | 5 Disember 2026 |
| `b2d2` | Batch 2, Hari 2 | 6 Disember 2026 |

Check-in ditutup secara lalai. Urusetia hanya boleh membuka sesi **pada tarikh hari program yang berkenaan**; QR lokasi baru dijana apabila sesi dibuka dan terbatal apabila ditutup. Masa ikut `Asia/Kuala_Lumpur`.

## Pemasangan Google Apps Script (hanya oleh pemilik)

1. Buka projek Apps Script **GenerasiSunnah** yang berasingan. Jangan sentuh Apps Script pendaftaran/AutoCrat asal. **Semak dahulu tiada `doGet()` lain** atau fungsi bernama sama. Jika ada, hentikan dan audit konflik sebelum tampal.
2. Tambah/isi satu fail **`Code.gs`** dengan kandungan [`gas/Code.gs`](gas/Code.gs). Jika ada kod lain dalam `Code.gs` asal, jangan overwrite tanpa backup & audit.
3. Tambah fail HTML bernama tepat **`Checkin`**, isi dengan [`gas/Checkin.html`](gas/Checkin.html). (Editor Apps Script akan paparkan `Checkin.html`.)
4. **Project Settings → Script Properties → Add script property**. Nama: `GS_STAFF_KEY`. Nilai: satu passphrase rawak panjang sekurang-kurangnya **20 aksara** (cadangan 32+). **Jangan commit, screenshot, log, atau kongsi nilai ini**. Beri secara peribadi kepada urusetia sahaja.
5. Dalam editor Apps Script, run `gsSetupOnce_` **sekali** menggunakan akaun pemilik, approve kebenaran Google. Fungsi ini hanya sahkan header `Daftar GS` & `KEHADIRAN_GS`, dan cipta tab kehadiran jika belum ada. Ia **tidak mengubah** data/AutoCrat.
6. **Deploy → New deployment → Web app**. `Execute as: Me`, `Who has access: Anyone`. (Pengesahan urusetia berlaku dalam Web App, bukan melalui hak akses Google.) Copy URL `/exec`. Jangan tampal Script ID sebagai pengganti URL deployment.
7. Dalam root [`index.html`](index.html), set `GS_WEBAPP_URL` ke URL `/exec` **sahaja**. Jangan masukkan `GS_STAFF_KEY` atau sebarang data peserta. Commit frontend. GitHub Pages kemudian menyediakan butang masuk ke Web App sebenar.
8. Semak akses UI dan log masuk menggunakan akaun penganjur; buat **semakan READ-ONLY sahaja** sebelum hari program. Jangan tanda HADIR untuk peserta sebenar ketika ujian.

> Jika mengemas kini kod selepas deployment, gunakan **Manage deployments → Edit → New version** pada deployment Web App yang sama, bukan membuat URL baharu berulang kali.

## Operasi hari program

- Urusetia log masuk ke Web App dengan kunci akses, pilih `Batch/Hari`, tekan **Buka check-in**.
- Paparkan/print QR lokasi yang dijana di dashboard. Peserta scan QR, masukkan **No_Resit** dan **empat digit terakhir telefon WhatsApp penjaga yang berdaftar**.
- Alternatif: urusetia cari nama/resit, sahkan peserta dan tekan **Tanda hadir**.
- Web App menyimpan kehadiran tepat **satu rekod bagi satu No_Resit+sesi** (kawalan `LockService`). Jika sudah hadir, sistem melaporkan rekod sedia ada.
- Keputusan disimpan hanya dalam `KEHADIRAN_GS`: `Checkin_ID`, `Sesi`, `No_Resit`, `Waktu_Checkin`, `Kaedah`, `Direkod_Oleh`, `Nota`.
- Pada akhir sesi, tekan **Tutup check-in**. QR lokasi yang lama tidak lagi diterima.

## Seni bina & keselamatan

- GitHub Pages ialah **public landing sahaja**. Ia tidak menyimpan senarai peserta, nombor telefon, rahsia, atau endpoint pentadbiran tanpa kawalan.
- Semua borang sebenar, carian urusetia dan panggilan ke Sheets menggunakan **`google.script.run` dalam HtmlService**, mengelakkan masalah CORS yang biasa berlaku apabila GitHub Pages cuba `fetch` Apps Script secara terus.
- `GS_STAFF_KEY` disimpan sebagai Script Property; sesi urusetia 30 minit disimpan dalam Script Cache dan token hanya berada dalam memori tab browser. Kekunci login tidak disimpan dalam localStorage.
- Cubaan login urusetia dihadkan; kod lokasi ditukar apabila sesi ditutup dan dibuka semula; percubaan pengesahan peserta dihadkan mengikut No_Resit. Akses dan tarikh disemak di server.
- **Nota:** QR lokasi boleh diforward. Ia bukan pengesahan GPS/kehadiran fizikal. Pemeriksaan urusetia masih perlu jika ada aktiviti mencurigakan. Empat digit terakhir telefon juga bukan faktor keselamatan tinggi; gabungan kod venue berputar, nombor resit dan pengawasan lapangan dipilih untuk skala program.
- Akaun yang digunakan untuk deployment Web App perlu mempunyai akses owner/editor yang sah ke spreadsheet. Hanya project Apps Script yang berasingan patut digunakan. Jika kod dalam projek sedia ada berlainan, audit dahulu, jangan overwrite.
- Dependensi visual QR menggunakan `qrcodejs` CDN pada dashboard urusetia. Sekiranya CDN gagal, pautan check-in masih ada dan kaedah urusetia manual boleh digunakan.

## Had semasa

- **Belum LIVE** sehingga dua fail GAS dipasang, property diset, Web App dideploy dan URL `/exec` disambungkan pada frontend.
- Tiada integrasi auto eCertificate, pembetulan/void kehadiran, atau penjejakan akaun petugas individu; sistem menyimpan label petugas yang diisi sendiri.
- Tiada sample pendaftaran, bayaran atau check-in sebenar diwujudkan dalam ujian.