# Generasi Sunnah 2026 — Audit Sijil dan Native eCERT Email UAT

**Tarikh checkpoint:** 27 November 2026  
**Tahap:** Kejayaan **satu** penghantaran QA melalui Google disahkan; **production issuance HOLD**.

> **JANGAN** menekan Run pada job AutoCrat `eCERT GS26`, menghidupkan trigger, menghantar sijil kepada peserta sebenar atau mengulang e-mel QA tanpa OWNER GO baharu.

## 1. Asal usul dan audit pre-UAT

Pada 15–16 Okt 2026, template sijil A4 melintang dan sistem nombor bersiri `GS26_S####` direka untuk projek Generasi Sunnah. Template rasmi Google Slides telah dipetakan kepada tag:

| Tag template | Sumber |
| --- | --- |
| `<<Nama_Peserta>>` | `Daftar GS` → `Nama penuh` |
| `<<Batch>>` | `Daftar GS` → `Pilihan batch program` |
| `<<No_Sijil>>` | `Daftar GS` → `No_Sijil` |

**Sumber:** [Template eCERT Google Slides](https://docs.google.com/presentation/d/1tFY8IqyXKdUloW8bSnp1Z1TNmvN6ojHFyqMmgvY_6gU/edit), [workbook rasmi](https://docs.google.com/spreadsheets/d/1YOlKCIfBd6FNJji6p4SjQtuBQOqr3zVFbtC2Nj1mwvc/edit).

Audit read-only pada 27 Nov sebelum UAT merumuskan:
- `Daftar GS`: **141** pendaftaran (Batch 1 **67**, Batch 2 **74**); nombor resit dan sijil unik, semua e-mel menepati format asas. Ini ialah **snapshot**, jumlah bukan lagi nilai tetap.
- `KEHADIRAN_GS`: **0** baris kehadiran ketika audit tersebut; peserta belum disahkan melengkapkan dua hari.
- Medan eCERT AutoCrat `AC:AF`: **0** hasil pada masa audit; folder eCERT rasmi kelihatan kosong ketika semakan.
- Job AutoCrat **`eCERT GS26`** membaca seluruh pendaftaran, mempunyai **merge conditions kosong** dan **e-mel diaktifkan**. Kedua-dua trigger (form/time) **OFF**; menekan Run berisiko menghasilkan banyak sijil sebelum peserta layak.
- Akses akaun Google kepada wizard/template AutoCrat pernah menghadapi masalah akaun pelbagai; keupayaan menjalankan job rasmi secara selamat **belum** terbukti. Jangan tafsir config tersimpan sebagai runtime PASS.
- Job `Slip Daftar GS26` dan `Resit GS26` berlainan; jangan ubah aliran sedia ada.

**Keputusan audit:** **HOLD pengeluaran eCERT production**; disyorkan kelayakan berdasarkan **kedua-dua hari** batch sebenar dan persetujuan urusetia/OWNER.

## 2. Hasil simulator staging (asing daripada Google sebenar)

Branch GitHub [`staging/ecert-gs26-review`](https://github.com/shafielegacy/generasisunnah/tree/staging/ecert-gs26-review) mempunyai:
- `staging/ecert/`: servis/konsol **Python + SQLite** serta ujian `test_ecert.py`. Audit terdahulu menyatakan **37/37 ujian PASS** dan satu simulasi hujung-ke-hujung: **1 PDF QA + 1 mesej peti keluar tiruan**.
- `staging/native-ecert/`: `Eligibility.gs`, `Engine.gs`, `QA_Runner.gs`, `test-eligibility.js`, README, sebagai **QA-only GAS source**. Fail benar-benar berada dalam branch staging dan tidak bermaksud dipasang pada production.
- README staging menyebut pengujian offline/CI. Keputusan CI semasa dan ujian integrasi GAS QA untuk modul `Engine.gs` **belum disahkan semula dalam checkpoint ini**.

**Pemisahan keputusan:** 37 ujian simulator bukan ujian MailApp sebenar, manakala e-mel sebenar dalam seksyen berikut **tidak membuktikan simulator atau modul baharu telah di-deploy**.

## 3. OWNER GO terhad — satu Native Google eCERT email UAT

**Kelulusan pengguna pada 27 Nov:** tepat **1** ujian penghantaran PDF eCERT kepada **mailbox peribadi QA yang diluluskan** (alamat penuh tidak disiarkan dalam repo awam), menggunakan:
- Google Apps Script;
- **salinan QA** template Google Slides asal;
- Google Drive PDF export;
- `MailApp.sendEmail()`;
- **tanpa AutoCrat**, tanpa peserta sebenar dan tanpa menyentuh deployment/Sheet/folder output rasmi.

**Identiti peserta rekaan:**
- `Nama`: **PESERTA UJIAN GENERASI SUNNAH**
- `Batch`: **Batch 1 — QA**
- `No_Sijil`: **QA-GS26-001**
- Watermark PDF: **UJIAN SAHAJA — TIDAK SAH**

### Keputusan dilaporkan dan disahkan semasa sesi

| Semakan | Bukti daripada sesi UAT | Keputusan |
| --- | --- | --- |
| Templat Slides QA | Tiga tag diisi dengan data rekaan | **PASS** |
| Export PDF Google Drive | PDF **1 halaman**, saiz dilaporkan **363,644 bait**, watermark merah jelas | **PASS** |
| Panggilan MailApp | Log menunjukkan `SENT` dan `Execution completed` | **PASS** |
| Masa ujian | **27 November 2026, 14:28 MYT** | Direkod |
| Quota MailApp | **95 → 94** selepas satu penghantaran | Direkod |
| Inbox QA | Owner mengesahkan e-mel diterima beserta PDF | **PASS menurut pengesahan owner** |
| Ulangan | Tiada kebenaran untuk kirim kali kedua; resend dikunci | **HOLD** |
| AutoCrat / production | Tidak digunakan untuk UAT Native ini | **TIDAK BERUBAH** |

**Tafsiran tepat:** kejayaan `MailApp.sendEmail` bersama pengesahan inbox QA membuktikan satu PDF sijil boleh dijana dan dihantar melalui **aliran Native QA**, bukan bahawa pengeluaran sijil rasmi telah diaktifkan atau semua penerima akan menerima e-mel.

## 4. Polisi kelayakan yang dirangka, belum final release

Kelayakan dicadangkan berdasarkan **2 hari sah dalam batch peserta**:

| Batch | Sesi wajib |
| --- | --- |
| Batch 1 | `b1d1` (28 Nov) **dan** `b1d2` (29 Nov) |
| Batch 2 | `b2d1` (5 Dis) **dan** `b2d2` (6 Dis) |

- Identiti `No_Resit` + batch; `No_Sijil` unik bagi pengeluaran. Nama/e-mel sama (contohnya adik-beradik) tidak bermaksud identiti peserta sama.
- Hanya satu hari → **NOT_ELIGIBLE / belum cukup hari**, bukan sijil automatik.
- Sesi salah, resit/ID bertindih, kehadiran meragukan, e-mel tidak sah, PDF sedia ada atau output bercanggah → **REVIEW** dan rekonsiliasi.
- Selepas kedua-dua hari selesai, urusetia semak pengecualian, OWNER meluluskan pelepasan batch/individu. Cadangan state **PENDING_APPROVAL → APPROVED → GENERATING → GENERATED → SENT**, dengan **SEND_UNKNOWN** tidak boleh diulang automatik.
- Semua pembetulan/audit menggunakan sumber berasingan; jangan sunting tab kehadiran rasmi untuk memaksa sijil.

**Penting:** Ini kontrak yang digunakan dalam audit dan staging; deployment ke production memerlukan **keputusan akhir OWNER**.

## 5. Tindakan seterusnya untuk Claude Pro atau ChatGPT Work

**Claude (Sonnet untuk audit/development, Opus untuk review kritikal):**
1. Baca dokumen ini, [timeline](GS_PROJECT_HISTORY_AND_RELEASE_2026-11-27.md), serta kod dalam `staging/ecert/` dan `staging/native-ecert/` pada branch staging.
2. Audit implementasi sebenar, *security boundary*, eligibility, kuasa urusetia, status bukan pasti, PDF dedupe, output/ledger dan quota. Kembangkan **offline tests**.
3. Kod baharu hanya pada branch berasingan dan **Draft PR**. Tiada merge, trigger atau API awam tanpa GO.

**ChatGPT Work selepas reset, dengan GO ujian QA baharu:**
1. Semak semula projek GAS UAT sedia ada dan salinan Slides/Drive QA — **jangan guna semula sumber production**.
2. Siapkan QA workbook/ledger/folder terasing bagi `Engine.gs` jika belum tersedia; gunakan identiti rekaan sahaja.
3. Test baca → eligibility → kelulusan → jana satu PDF → ledger/audit → dedupe/rollback, **tanpa menghantar e-mel tambahan**.
4. Laporkan bukti, senarai fail, Google project/deployment dan batasan yang diperiksa. Dapatkan OWNER GO sebelum sebarang production cutover.

## 6. Release gate dan risiko

**HOLD sehingga**: kehadiran Hari 1+2 disahkan, pengecualian dikosongkan, mekanisme operator identity dan approval diperiksa, duplicate/snapshot/ledger diuji dalam Google QA sebenar, retention & privacy disemak, pemulihan SEND_UNKNOWN disediakan, dan OWNER memberi kebenaran eksplisit bagi pilot production.

**Jangan**: tekan Run job `eCERT GS26` pada roster penuh; hidupkan AutoCrat trigger; hantar kepada ibu bapa; menyimpan data/kunci sensitif di GitHub; melakukan bulk send, merge staging atau deploy ke GAS check-in V7.

**Checkpoint 27 Nov:** eCERT **Native email QA PASS (satu)** · simulator offline **37/37 PASS** · production issuance **HOLD**.
