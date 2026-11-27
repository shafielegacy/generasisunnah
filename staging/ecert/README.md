# Sijil Generasi Sunnah 2026 · staging setempat

Konsol ini membolehkan urusetia mencuba aliran daripada kehadiran sehingga penghantaran simulasi pada komputer sendiri. Semua rekod demo rekaan. PDF bertera **QA SAHAJA** disimpan dalam SQLite. Penghantaran masuk ke peti keluar simulasi setempat.

## Jalankan

Gunakan Python 3.10+ dan jalankan arahan dari direktori ini. Cipta persekitaran maya sendiri, kemudian pasang kebergantungan dengan `python -m pip install -r requirements.txt`. Untuk ujian automatik, jalankan `python -m unittest -v`.

Untuk konsol, jana satu kunci rawak QA bagi setiap operator demo. Contoh di bawah memaparkan kunci sekali pada terminal peribadi. Simpan kunci secara peribadi, dan tetapkan **digest** yang dipaparkan sebagai pemboleh ubah persekitaran `GS_QA_OWNER_SHA256`. Ulang dengan kunci berlainan untuk `GS_QA_REVIEWER_SHA256` atau `GS_QA_STAFF_SHA256` jika hendak menguji pengasingan peranan. Masukkan kunci asal apabila konsol memintanya. Jangan guna kunci operasi.

```sh
python -c "import secrets,hashlib; k=secrets.token_urlsafe(32); print(k,hashlib.sha256(k.encode()).hexdigest(),sep=chr(10))"
```

Setelah digest ditetapkan, cuba arahan berikut. Jam simulasi pada langkah pengesahan membolehkan ujian selepas Hari 2. Gunakan fail pangkalan data baharu untuk mengulang demonstrasi dari awal.

```sh
python console.py seed
python console.py senarai
python console.py --date 2026-12-07 sahkan-batch 1
python console.py lulus QA-R1
python console.py jana QA-R1
python console.py hantar-mock QA-R1
python console.py senarai
python console.py log
```

Sebelum mengesahkan batch, cuba pembetulan seperti `python console.py betulkan QA-R2 b1d2 hadir "Semakan daftar manual rekaan"`. Untuk melihat perlindungan penghantaran tidak pasti, gantikan arahan penghantaran pertama dengan `python console.py hantar-mock QA-R1 --outcome unknown`. Cubaan kedua akan ditolak. OWNER boleh merekodkan pengesahan positif dengan `rekonsiliasi QA-R1 "Bukti simulasi"`. Gunakan `failure_before_send` untuk simulasi kegagalan yang pasti sebelum penghantaran. Had tiga cubaan termasuk cubaan pertama.

## Kontrak staging

| Fungsi | Perlakuan |
| --- | --- |
| Semakan | Pendaftaran disatukan dengan sesi menggunakan resit penuh dan batch rasmi. Kaedah diterima ialah `QR PESERTA` dan `URUS SETIA`. Sesi berbeza diperlukan untuk kedua-dua hari. |
| Integriti | Identiti kosong/bertindih, output asal, sesi salah batch, kaedah asing dan waktu meragukan memerlukan semakan. Rekod tanpa padanan dipaparkan. Sesi lintas tengah malam dikira mengikut Malaysia. |
| Pembetulan | Reviewer, staff atau owner boleh merekod keputusan hadir/tidak sebelum penutupan. Sebab, operator, masa dan nilai terdahulu direkodkan. Data sumber demo kekal beku. |
| Pengesahan | Staff/owner mengesahkan batch pada/selepas tarikh Hari 2 setelah review selesai. Hanya peserta `ELIGIBLE` masuk `PENDING_APPROVAL`. Setiap resit diluluskan secara berasingan. |
| Penjanaan | Transaksi SQLite, satu output bagi setiap resit dan nombor sijil. PDF yang berjaya disimpan boleh digunakan semula. |
| Penghantaran | Simpan penerima daripada rekod demo secara dalaman. Tujuan penghantaran sentiasa `sink@example.invalid`. Tiada sambungan rangkaian dalam servis. |
| Konsol | Akses disemak di lapisan servis pada setiap operasi. OS melindungi fail SQLite. Pemilik OS boleh mengubah fail atau jam simulasi. Model ini khusus untuk QA pada komputer dipercayai. |

Untuk penggunaan Google sebenar, semak identiti staf yang disahkan oleh Google di backend, asingkan output dan rekod audit, dan uji job AutoCrat QA mengikut laporan OWNER. Sampel ini tidak menyediakan deployment, endpoint awam, trigger, adapter SMTP atau penulisan Google Sheets.
