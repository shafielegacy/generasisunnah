# Laporan UI/UX — Generasi Sunnah 2026 Premium UI V2

**Tarikh:** 27 November 2026 · **Cawangan:** `design/gs26-premium-ui-v2` · **Status:** pratonton reka bentuk untuk semakan owner. **Bukan** perubahan production.

## 1. Ringkasan

Prototaip interaktif V2 dibina dalam folder terasing `design-preview/` menggunakan data rekaan. Ia meliputi lima skrin yang diminta (Utama, Kuota, Mini Check-in, Urusetia, Keadaan) dan dua keperluan tambahan owner: **kunci sesi progresif** untuk urusetia dan **sistem modal premium 3D** yang menggantikan `confirm()` pelayar serta amaran di bawah halaman.

Fail production (`index.html`, `js/`, `gas/`) **tidak disentuh**. Pratonton tidak boleh menghubungi mana-mana pelayan: CSP `connect-src 'none'` + pengawal `fetch`/XHR/WebSocket/beacon, disahkan oleh `tests/design-preview-isolation.test.js` (9/9 PASS) dan ujian pelayar (0 ralat konsol, 0 permintaan luar).

## 2. Cara melihat

```bash
cd design-preview && python3 -m http.server 8080
# buka http://localhost:8080
```

Gunakan **Panel demo** (butang di jalur kuning atas) untuk menukar tarikh simulasi (27 Nov hingga 7 Dis, waktu Malaysia), memaksa keputusan check-in, mensimulasikan ralat kuota/sambungan/sesi tamat, dan tema cerah/gelap. Tangkap layar ada dalam `design-preview/screenshots/`.

## 3. Hala tuju reka bentuk

| Elemen | Keputusan |
| --- | --- |
| Warna | Emerald (`#073A2E` → `#13775C`) sebagai identiti, emas lembut (`#B8924A`/`#E3C98F`) untuk aksen dan tindakan utama, latar gading `#FBF8F1`. Semua warna sebagai token, dengan mod gelap penuh. |
| Tipografi | **Fraunces** (serif paparan, elegan dan moden), **Plus Jakarta Sans** (UI, sangat jelas pada telefon), **Amiri** untuk aksen Arab "جيل السنة". |
| Identiti Islamik | Corak bintang lapan (khatam) halus pada latar hero, bingkai gerbang mihrab untuk logo, garis emas nipis. Tiada hiasan berat yang mengganggu bacaan. |
| Gerak | Animasi masuk halaman, cincin kuota mengisi, nombor mengira naik, tanda ✓ dilukis, modal 3D (rotateX + skala). Semua dimatikan dengan `prefers-reduced-motion`. |
| Mudah alih dahulu | Bar tab bawah dengan butang Check-in di tengah, butang ≥ 44 px, input PIN 4 kotak dengan papan kekunci nombor, tindakan utama dalam skrin pertama. |

## 4. Skrin dan penambahbaikan

**Utama.** Hero dengan status sesi langsung (dibuka / belum dibuka / kiraan detik ke sesi seterusnya / tamat), CTA emas "Sahkan kehadiran", jadual 2 batch × 2 hari dengan penanda *Hari ini / Selesai / Akan datang*, 3 langkah check-in, ringkasan kuota, dan soalan lazim (tiada resit, maksud STATUS TIDAK DIKETAHUI, check-in awal).

**Kuota.** KPI agregat (berdaftar, kuota, baki, kadar isian), kad batch dengan cincin peratus, lencana DIBUKA/PENUH/DITUTUP, rangka (skeleton) semasa memuat, dan keadaan ralat yang **tidak** memaparkan angka lama (selaras dengan polisi production sekarang).

**Mini Check-in.** Kad fokus tunggal: sepanduk status sesi, medan resit dengan awalan `GS26_` tetap (peserta hanya taip `R####`, auto huruf besar, auto lompat ke telefon), 4 kotak PIN, ralat medan sebaris dengan goyangan halus. Keputusan dipaparkan sebagai modal berpusat **dan** kad tiket yang kekal di skrin untuk ditunjukkan kepada urusetia.

**Urusetia.** Log masuk dengan tunjuk/sembunyi kunci; dashboard dengan pemilih sesi progresif, suis buka/tutup, KPI kehadiran (termasuk kadar %), tapisan Semua/Belum hadir/Hadir dengan kiraan, carian, avatar inisial, lencana masa & kaedah (QR/Manual), suapan aktiviti terkini dan senarai semak kaunter (diambil daripada SOP README 28 Nov).

**Keadaan.** Halaman spesimen untuk semua keadaan dan butang untuk membuka setiap modal, supaya owner boleh menyemak semuanya tanpa perlu mencetuskan senario sebenar.

## 5. Keperluan tambahan owner

### 5.1 Kunci sesi progresif (urusetia)
- Keempat-empat sesi **sentiasa kelihatan**. Sesi masa depan dipaparkan kelabu berjalur dengan **ikon kunci** dan `disabled` (tidak boleh ditekan atau difokus).
- 28 Nov: b1d1 sahaja · 29 Nov: b1d1–b1d2 · 5 Dis: b1d1–b2d1 · 6 Dis: semua. Sebelum 28 Nov: semua dikunci dengan keadaan kosong yang menerangkan tarikh sesi pertama.
- Sesi hari ini dipilih automatik; jika tiada, sesi lampau terkini dipilih.
- Tarikh dikira dengan `Intl.DateTimeFormat(..., { timeZone: 'Asia/Kuala_Lumpur' })`, bukan zon waktu peranti.
- Sesi lampau = **baca sahaja**: suis dikunci, butang "Tanda hadir" diganti lencana "Tidak hadir", dan modal "Sesi lampau dikunci" menerangkan sebabnya. **Ini lapisan UI sahaja.** Validasi tarikh GAS V7 di pelayan kekal sebagai penentu muktamad; pelayan simulasi dalam pratonton juga menolak penulisan lampau.

### 5.2 Sistem modal premium 3D
Satu komponen `<dialog>` untuk semua: di luar tarikh, kaunter belum dibuka, sahkan kehadiran peserta, buka/tutup check-in, berjaya, sudah direkod, gagal, status tidak diketahui, ralat sambungan urusetia, sesi log masuk tamat, dan sesi lampau. Ciri: bayang berlapis, animasi masuk 3D (rotateX + skala), latar kabur, medal ikon bertona, perangkap fokus asli `showModal()`, Esc/klik latar untuk batal (kecuali modal kritikal), fokus kembali ke butang asal, dan butang bertindan penuh lebar pada telefon. Bagi modal tindakan berisiko, fokus awal pada **Batal**.

**Tiada cubaan semula automatik** untuk sebarang penulisan: satu permintaan sahaja, kemudian semakan baca sahaja jika tidak pasti, kemudian kunci 30 saat dan arahan merujuk urusetia (sama seperti logik production PR #3).

## 6. Kebolehcapaian

Pautan langkau, `:focus-visible` emas yang jelas, label pada semua input, `aria-live` untuk status dan keputusan, `role="switch"`/`tablist`/`radiogroup` yang betul, sasaran sentuh ≥ 44 px, warna teks dipilih untuk sasaran kontras WCAG AA pada kedua-dua tema (belum diaudit dengan alat automatik), dan sokongan gerak dikurangkan.

## 7. Cadangan untuk dibawa ke production (selepas OWNER GO)

1. **Fasa 1, frontend sahaja, risiko rendah:** port token warna, tipografi, kad check-in, input PIN dan sistem modal ke `index.html`/`js/checkin.js`. Gantikan `confirm()` urusetia dengan modal. Tiada perubahan GAS diperlukan.
2. **Fasa 2:** pemilih sesi progresif dalam dashboard urusetia (UI sahaja, GAS kekal penentu).
3. **Pilihan, perlu perubahan backend:** paparkan nama peserta pada skrin BERJAYA, dan suapan aktiviti langsung. Kedua-duanya memerlukan medan baharu daripada GAS, jadi ditangguhkan.

Elakkan memindahkan perubahan ini sebelum atau semasa hari program 28–29 Nov; laluan check-in production semasa (PR #3/#4) tidak harus diganggu.

## 8. Had pratonton

- Semua data rekaan (resit julat `R9001–R9060`, nama rekaan). Pelayan disimulasikan dalam memori; tempoh semakan semula dipendekkan.
- Fon dimuat daripada Google Fonts; jika disekat, sistem fon tempatan digunakan.
- Logo disalin ke `design-preview/assets/` supaya folder berdiri sendiri.
