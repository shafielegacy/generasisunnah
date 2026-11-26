# Generasi Sunnah 2026 — Manual Check-in Control V2

**Release / checkpoint:** 26 November 2026
**GAS LIVE:** Version 5, deployment successfully updated pada 26 November 2026, 15:49 (MYT) — disahkan melalui tangkap layar operator
**GitHub Pages:** https://shafielegacy.github.io/generasisunnah/
**Repository:** https://github.com/shafielegacy/generasisunnah
**Status:** UI verification **PASS** (read-only); live write / full end-to-end **BELUM DIUJI**

## 1. Objektif dan keputusan

Urusetia boleh membuka dan menutup check-in untuk sesi yang dipilih **sebelum, semasa atau selepas tarikh program**. Tarikh sesi kekal sebagai metadata dan rujukan pengesahan, bukan sekatan mutlak.

| Sesi | Tarikh program |
| --- | --- |
| Batch 1 · Hari 1 | 28 November 2026 |
| Batch 1 · Hari 2 | 29 November 2026 |
| Batch 2 · Hari 1 | 5 Disember 2026 |
| Batch 2 · Hari 2 | 6 Disember 2026 |

## 2. Cara fungsi bekerja

1. Urusetia login menggunakan kunci yang dikonfigurasi pada backend dan pilih sesi program.
2. Sesi dalam keadaan **DITUTUP** secara lalai. Hanya urusetia yang telah login boleh mengubah status.
3. Butang **Buka check-in** boleh digunakan tanpa menunggu tarikh program apabila backend mengesahkan `manualControl: true`.
4. Jika dibuka di luar tarikh sesi, UI memaparkan dialog pengesahan dan backend mewajibkan `ackOutsideDate === true`.
5. Pembukaan sesi menjana kod QR lokasi bagi sesi tersebut. Peserta masih perlu mengimbas QR dan mengesahkan resit serta empat digit terakhir telefon penjaga.
6. **Tutup check-in** memadam kod lokasi aktif; pautan QR lama tidak boleh digunakan untuk menulis kehadiran. Pembukaan seterusnya menjana kod baharu.
7. Urusetia boleh menandakan peserta hadir secara manual hanya apabila sesi dibuka. Rekod disimpan mengikut sesi dan waktu sebenar.

## 3. Perubahan kod

| Fail | Perubahan |
| --- | --- |
| `gas/Code.gs` | Buang date-lock daripada semakan check-in, tambah pengesahan buka di luar tarikh, `manualControl` flag, dan namespace status/QR manual baharu |
| `gas/Checkin.html` | Selaraskan butang dan dialog pengesahan untuk paparan GAS HTML |
| `js/checkin.js` | Aktifkan butang mengikut capability backend, makluman urusetia, pengesahan di luar tarikh, serta fallback jika GAS masih versi lama |
| `index.html` | Cache-bust versi JavaScript portal supaya kod UI terkini dimuatkan |

### Status awal yang selamat

- Status baharu menggunakan `GS_OPEN_MANUAL_<session>` dan kod `GS_CODE_MANUAL_<session>` dalam Script Properties.
- Flag lama `GS_OPEN_<session>` tidak lagi mengaktifkan sesi dalam kod baharu. Ini memastikan migrasi bermula **DITUTUP** walaupun ada status lama.
- **Jangan** isi, paparkan atau commit nilai `GS_STAFF_KEY`, token sesi atau kod QR aktif ke repository.

### Kawalan backend yang dikekalkan

- Pengesahan sesi urusetia dengan cache dan tempoh 30 minit (renew semasa aktiviti).
- Rate limit percubaan login dan self check-in.
- `LockService` semasa tukar status serta semasa menulis rekod kehadiran.
- Semakan peserta, batch, nombor resit, empat digit terakhir telefon penjaga dan kod lokasi untuk self check-in.
- Deduplikasi per **sesi + nombor resit** sebelum append.
- Waktu sebenar menggunakan `new Date()` dalam kolum `Waktu_Checkin`.
- Data sumber pendaftaran dibaca sahaja; penulisan kehadiran terhad kepada tab `KEHADIRAN_GS`.

## 4. Bukti pengesahan 26 November 2026

Operator mengesahkan **GAS deployment V5 berjaya** dan berkongsi screenshot dashboard Urusetia selepas refresh/login.

| Semakan | Bukti yang kelihatan | Status |
| --- | --- | --- |
| GAS deployment | “Deployment successfully updated”, Version 5, 26 Nov 2026 15:49 | **PASS** (operator screenshot) |
| Dashboard Urusetia | Sesi Batch 1 · Hari 1 · 28 Nov | **PASS** |
| Bilangan peserta | 62 berdaftar, 0 hadir, 62 belum hadir | **Dipaparkan** (snapshot pada masa semakan) |
| Status sesi | “Check-in ditutup” | **PASS** |
| Butang buka sebelum tarikh | **Buka check-in** aktif pada 26 Nov, walaupun sesi bertarikh 28 Nov | **PASS** |
| Makluman kawalan manual | “Urusetia boleh buka atau tutup check-in pada bila-bila masa...” | **PASS** |
| Klik buka/tutup LIVE | Tidak dilakukan | **PENDING** |
| QR sebenar / rekod kehadiran LIVE | Tidak diuji | **PENDING** |

**Interpretasi:** Bukti ini menyokong pengaktifan UI dan pembacaan capability manual daripada backend. Ia **bukan** bukti bahawa proses tulis kehadiran LIVE sudah lulus.

## 5. QA sebelum program — urutan selamat

### Read-only (telah dilakukan)

- [x] Semak deployment GAS V5 berjaya.
- [x] Login Urusetia dan pilih Batch 1 Hari 1.
- [x] Pastikan status sesi **DITUTUP**.
- [x] Pastikan butang **Buka check-in** tidak lagi disabled sebelum tarikh program.
- [x] Semak makluman manual control dan statistik peserta.

### Perlu pengesahan operasi (belum dilakukan)

- [ ] Dengan kelulusan urusetia, pilih masa ujian terkawal dan pastikan tiada peserta sedang menggunakan QR.
- [ ] Buka sesi di luar tarikh; sahkan dialog pengesahan muncul dan status berubah kepada **DIBUKA**.
- [ ] Semak QR baharu dijana, tanpa mendedahkan kod QR secara awam semasa ujian.
- [ ] Tutup sesi; pastikan status **DITUTUP** dan QR lama tidak diterima.
- [ ] Uji buka semula dan pastikan QR berbeza daripada sebelumnya.
- [ ] Jika perlu menguji penulisan, gunakan **peserta ujian yang diluluskan** dan rancangan pembersihan data; jangan cipta kehadiran palsu pada rekod rasmi.
- [ ] Sahkan tiada pendua bagi peserta+sesi yang sama dan masa rekod adalah masa sebenar.
- [ ] Akhiri ujian dengan **semua sesi DITUTUP** dan semak kiraan kehadiran rasmi.

**Penting:** Jangan menguji butang **Buka** secara spontan pada sistem produksi kerana sesi yang dibuka boleh menerima check-in peserta sebenar.

## 6. Deploy dan rollback

**Deployment source:** `gas/Code.gs` dan `gas/Checkin.html` dalam projek Apps Script GenerasiSunnah. Kemaskini melalui **Deploy → Manage deployments → Edit → New version → Deploy** supaya deployment ID/URL sedia ada kekal. Jangan jalankan setup semula hanya untuk perubahan ini.

**Jika perlu rollback:** pastikan sesi ditutup dahulu, kemudian pilih versi GAS terdahulu dalam Manage deployments. Pulihkan juga versi UI GitHub Pages yang sepadan jika perlu. Ambil perhatian: versi lama mempunyai date-lock dan membaca namespace status lama, jadi **semak status sesi dengan teliti** selepas rollback sebelum membenarkan akses peserta. Jangan padam rekod kehadiran atau Script Properties tanpa audit.

## 7. Scope dan baki kerja

- Tidak mengubah borang pendaftaran, data pendaftaran, pembayaran atau AutoCrat.
- Tiada bukti data breach atau masalah LIVE daripada checkpoint ini.
- **Release coding selesai; UI verification PASS; UAT check-in LIVE masih PENDING.**
- Selepas program, semak kehadiran per sesi, ketepatan masa dan sebarang percubaan QR tidak sah sebelum final sign-off.

---

**Checkpoint:** 2026-11-26 · Manual Check-in Control V2 · GAS V5 · UI PASS / LIVE UAT PENDING


## 8. 27 November 2026 — Kuota mudah alih memaparkan angka lama

**Aduan operator:** Desktop memaparkan Batch 1 = 64/70 (baki 6), Batch 2 = 71/70 (baki 0), manakala Chrome telefon masih memaparkan 29 dan 33 walaupun browsing data telah dibersihkan.

**Penemuan source:** `index.html` masih mengandungi nilai statik fallback lama (29/50 dan 33/50). Angka baharu hanya muncul apabila callback `GSQuotaReceive` daripada GAS berjaya. Maka apabila panggilan GAS tidak selesai pada telefon, HTML memaparkan angka lama seolah-olah terkini. **Punca sebenar kegagalan panggilan pada Chrome telefon belum disahkan.**

**Patch GitHub Pages** (`index.html`, commit `ce5ac4d`):
- Gantikan angka dan status fallback lama dengan `—` / **MENUNGGU DATA**.
- Mulakan request kuota sejurus HTML siap diparse, tanpa menunggu event `window.load` (imej/CDN).
- Kekalkan cache-busting pada URL GET kuota.
- Tambah retry automatik terhad, timeout 12 saat, butang **Muat semula**, dan mesej sambungan gagal.
- Refresh semula apabila tab telefon kembali aktif (dengan had sela masa).
- **Tiada perubahan GAS, spreadsheet, pendaftaran, AutoCrat atau check-in.**

**QA:** Syntax JavaScript PASS; 9 ujian mock UI PASS (permintaan awal, callback data 64/71, status, timestamp, refresh, ralat). **Ujian pada Chrome telefon sebenar masih PENDING.** Jika sambungan GAS masih gagal, telefon kini sepatutnya memaparkan status tidak tersedia, bukannya angka 29/33 yang mengelirukan.

**Langkah operator:** Selepas GitHub Pages publish, buka portal dengan query string baharu (contoh `?v=20261127`) pada Chrome telefon, tekan **Muat semula** jika perlu, dan semak timestamp. Jika masih gagal, semak sama ada URL GAS `?view=quota` boleh dicapai pada telefon serta ralat rangkaian/browser. Jangan ubah GAS LIVE tanpa diagnosis lanjut.


## 9. 27 November 2026 — Mobile quota fallback sebelum acara

**Isu masih terbuka:** Chrome telefon melaporkan status **MENUNGGU DATA** berpanjangan. Akses LIVE dari peranti telefon dan respons GAS tidak dapat diperiksa terus oleh pembangun; punca khusus sekatan cross-origin / rangkaian / deployment **belum dibuktikan**. Jangan menganggap masalah telah selesai hanya kerana mock test lulus.

**Pembetulan source yang telah dipush ke GitHub `main`:**

- `gas/Code.gs`: tambah laluan **READ-ONLY** `?view=quota-page`, memaparkan jumlah pendaftaran server-rendered daripada `gsPublicQuota_()` dan menghantar `postMessage` dengan nonce yang disahkan. Tiada akses kepada senarai peserta, kunci urusetia, resit atau operasi tulis. Laluan lama `?view=quota` dikekalkan.
- `index.html`: jika JSONP gagal, cuba iframe tersembunyi ke `?view=quota-page` dan terima mesej hanya daripada origin Google yang dibenarkan dengan nonce sepadan. Jika kedua-dua saluran gagal, paparkan mesej jelas serta pautan check-in alternatif. Nilai lama 29/33 tidak dipaparkan.
- `js/checkin.js`: pautan **versi alternatif Google Apps Script** untuk Peserta dan Urusetia, menggunakan deployment GAS sedia ada. Untuk imbasan QR, parameter sesi/kod yang sah dibawa bersama ke paparan alternatif.
- `index.html`: naikkan versi cache JavaScript check-in kepada `20261127-mobile-fallback`.

**QA source/mock:** Syntax JavaScript PASS; mock GAS HTML aggregate 64/71, mesej nonce, HTML escaping dan mod iframe PASS; mock frontend callback fallback, origin palsu ditolak, pemulihan data serta pautan QR PASS. **Ujian peranti sebenar PENDING.**

**Deployment yang masih aktif:** GAS **V5** menurut pengesahan operator terdahulu. Source `gas/Code.gs` baharu **BELUM** dideploy LIVE. Tanpa deployment baharu, iframe fallback tidak akan berfungsi kerana laluan `quota-page` belum tersedia pada V5. GitHub Pages boleh menampilkan pautan check-in alternatif terus kerana GAS V5 sudah mempunyai paparan `Checkin` melalui `google.script.run`.

### Langkah selepas operator kembali

1. Buka projek Apps Script GenerasiSunnah, gantikan **hanya** kandungan `Code.gs` dengan versi terkini di GitHub. Fail `Checkin.html` tidak perlu diubah untuk patch ini.
2. **Deploy → Manage deployments → Edit → New version → Deploy**, kekalkan deployment ID/URL `/exec` yang sama. Catat nombor versi baharu.
3. Buka `/exec?view=quota-page` pada Chrome telefon: semak halaman HTML menunjukkan Batch 1/2 dan timestamp, bukan kod JavaScript mentah.
4. Buka portal GitHub Pages pada telefon dengan query cache-busting baharu; tunggu 15–30 saat, semak angka dan timestamp. Jangan percaya angka tanpa timestamp.
5. Jika data masih gagal, guna **pautan Check-in alternatif** untuk ujian operasi (tanpa menulis rekod rasmi sehingga diberi kelulusan). Semak `gsPublicStatus` / login urusetia / QR sebenar secara terkawal sebelum acara.

**Jangan:** Ubah rekod pendaftaran/kehadiran, jalankan setup semula, atau buka sesi check-in LIVE hanya untuk ujian. Jika backend V6 belum dideploy, jangan tandakan mobile quota sebagai PASS.
