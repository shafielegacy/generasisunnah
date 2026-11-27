# Generasi Sunnah 2026

**Portal Mini Check-in Kehadiran Peserta** · Program Generasi Sunnah 2026 · Surau Jabal Nur

🌐 **[Portal rasmi](https://shafielegacy.github.io/generasisunnah/)**

- **Peserta / penjaga:** imbas QR Monkey **tetap** pada poster, kekal di GitHub Pages, masukkan 5 aksara terakhir `No_Resit` (contoh `R0146`) dan 4 digit terakhir telefon penjaga, kemudian **Sahkan kehadiran**.
- **Urusetia:** login melalui tab **Urusetia**, pilih sesi, semak peserta dan buka/tutup check-in pada **tarikh sesi yang tepat**.
- **Sesi rasmi:** Batch 1 pada **28–29 November 2026**; Batch 2 pada **5–6 Disember 2026** (waktu `Asia/Kuala_Lumpur`).

## Status production — checkpoint 27 November 2026 (petang)

| Komponen | Status / bukti |
| --- | --- |
| Backend Google Apps Script | **V7**, deployment sedia ada dikemas kini pada **27 Nov 2026, 17:07 MYT**, ID/URL `/exec` kekal |
| Pengesahan backend | Operator menguji `gsPublicStatus`: `simpleCheckin:true` |
| GitHub Pages frontend | PR **#3** (direct CORS, date lock, QR tetap) merged, commit `1a741ee2` |
| Hotfix Urusetia | PR **#4** (default sesi + bersih mesej ralat + cache-bust) merged, commit `36cdf251` |
| Telefon | Pixel 10 dan ROG memaparkan kuota/Mini Check-in; login dan senarai urusetia disemak |
| Ujian QR → backend pada 27 Nov | **PASS (penolakan tarikh)**: dummy `R0146`/`6789` dihantar dari telefon; backend membalas check-in belum bermula |
| Telefon → tulis ke `KEHADIRAN_GS` | **PENDING**: belum diuji pada tarikh program; jangan isytihar end-to-end PASS |

**Kawalan keselamatan terkini:** server memilih sesi berdasarkan tarikh Malaysia; `LockService` menyemak tarikh sekali lagi sebelum append; hanya tab `KEHADIRAN_GS` boleh menerima rekod kehadiran. Keputusan jaringan tidak pasti **tidak** mencetuskan retry penulisan automatik. Respons status menggunakan direct CORS; tiada Cloudflare Worker atau QR dinamik diperlukan.

### Panduan ringkas untuk urusetia — 28 November

1. Pada 28 Nov, buka portal → **Urusetia** → login → pastikan **Batch 1 · Hari 1 (`b1d1`)** terpilih.
2. Bila kaunter bersedia, klik **Buka check-in**. Jangan cuba membuka/merekod di luar tarikh program.
3. Uji terkawal menggunakan **peserta dummy**: resit pendek `R0146`, 4 digit telefon `6789`. Pastikan mesej **BERJAYA**, kemudian **semak tepat satu rekod `GS26_R0146` / `b1d1`** pada tab `KEHADIRAN_GS`.
4. Ulang input yang sama menggunakan telefon kedua; sepatutnya **SUDAH DIREKOD** dan **tiada baris tambahan**.
5. Penjaga sebenar boleh scan QR poster tetap. Jika respons **STATUS TIDAK DIKETAHUI**, **semak kehadiran dahulu** sebelum cuba semula; jika terganggu, rekod kehadiran secara manual di kertas dan buat rekonsiliasi kemudian.
6. Tamat sesi: urusetia **Tutup check-in** dan semak jumlah rasmi.

**Nota data ujian:** `R0144` ialah resit **peserta sebenar**; **jangan gunakan** untuk QA. Dummy terkini berada pada `GS26_R0146` (semakan Sheet 27 Nov). `No_Resit` dikira melalui formula mengikut baris dan boleh berubah jika susunan data berubah. Semak semula sebelum ujian. **Jangan padam atau edit rekod pendaftaran/kehadiran secara spontan.**

📘 **[Audit, bukti, had dan rollback terkini](docs/AUDIT_CHECKIN_2026-11-27.md)**  
📚 **[Sejarah Manual Check-in V5 (superseded)](docs/GS_MANUAL_CHECKIN_V5_2026-11-26.md)**

**Deployment note:** GitHub menyimpan source `gas/Code.gs`; push GitHub **tidak** men-deploy Google Apps Script. Untuk rollback, pilih versi GAS lama pada *Manage deployments* bagi deployment **yang sama**, dan revert commit frontend jika perlu. Jangan bina deployment baharu atau ubah URL QR tanpa arahan owner.
