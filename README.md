[README.md](https://github.com/user-attachments/files/31956181/README.md)
# DataFlow Analytics

> **Upload the mess. See the pattern.**

DataFlow Analytics adalah aplikasi web untuk membaca, membersihkan, menganalisis, dan mengekspor data Excel langsung melalui browser. Aplikasi ini dirancang untuk membantu staf administrasi, pekerja kantoran, pelajar, serta pemilik usaha mengolah spreadsheet tanpa harus menulis banyak rumus secara manual.

## Tentang Proyek

Data Excel sering berisi baris kosong, data duplikat, spasi tambahan, format angka yang tidak konsisten, dan informasi yang sulit dipahami jika hanya dilihat sebagai tabel mentah. DataFlow Analytics mengubah file tersebut menjadi ruang kerja yang lebih praktis: pengguna dapat memeriksa kualitas data, melihat ringkasan, menjalankan pembersihan, membuat perhitungan, lalu mengunduh kembali hasilnya.

Versi awal aplikasi tidak menggunakan login, server, maupun database. File diproses secara lokal di perangkat pengguna sehingga data tidak perlu dikirim ke server.

## Fitur Utama

### Upload dan pembacaan spreadsheet

- Mendukung file `.xlsx`, `.xls`, dan `.csv`.
- Upload melalui tombol pemilih file atau drag and drop.
- Membaca banyak sheet dalam satu workbook.
- Menampilkan status proses dan pesan kesalahan yang mudah dipahami.
- Batas ukuran file versi awal: 10 MB.

### Overview

- Jumlah baris dan kolom.
- Persentase kelengkapan data.
- Jumlah sel kosong.
- Deteksi baris duplikat.
- Rata-rata kolom angka.
- Kategori yang paling sering muncul.
- Diagram distribusi data dari sheet aktif.

### Data Explorer

- Pratinjau isi spreadsheet dalam bentuk tabel.
- Pencarian data dari seluruh kolom.
- Perpindahan antar-sheet.
- Menampilkan maksimal 100 baris untuk menjaga performa antarmuka.

### Clean & Transform

- Menghapus baris kosong.
- Menghapus spasi tambahan pada teks.
- Menyamakan format nama kolom.
- Mengubah teks angka menjadi nilai numerik.
- Mendeteksi dan menghapus data duplikat.
- Membatalkan perubahan terakhir dengan fitur undo.

### Formula Builder

Pengguna cukup memilih jenis perhitungan dan kolom sumber. DataFlow akan membuat kolom hasil tanpa pengguna menulis rumus Excel secara manual.

Perhitungan yang tersedia:

- Total penjualan.
- Modal atau HPP.
- Laba.
- Margin laba.
- Markup harga.
- Harga setelah diskon.
- Stok akhir.
- Nilai persediaan.
- Status restock.
- `SUM`, `AVERAGE`, `MIN`, `MAX`, dan `COUNT`.

### Export

- Mengunduh data yang telah diproses sebagai Excel.
- Mengunduh hasil dalam format CSV.
- Mempertahankan kolom hasil dari pembersihan dan Formula Builder.
- Menghasilkan nama file yang jelas dan siap digunakan kembali.

## Alur Penggunaan

1. Buka DataFlow Analytics melalui browser.
2. Upload file Excel atau CSV.
3. Pilih sheet yang ingin diproses.
4. Periksa ringkasan dan kondisi data pada halaman **Overview**.
5. Cari dan tinjau data melalui **Data Explorer**.
6. Rapikan data pada menu **Clean & Transform**.
7. Tambahkan perhitungan melalui **Formula Builder**.
8. Unduh hasil akhir melalui menu **Export**.

## Teknologi

| Teknologi | Kegunaan |
|---|---|
| Next.js | Framework utama aplikasi web |
| React | Komponen antarmuka dan pengelolaan state |
| SheetJS (`xlsx`) | Membaca dan menghasilkan file spreadsheet |
| Recharts | Menampilkan diagram dan visualisasi data |
| CSS | Layout, tema, animasi, dan tampilan responsif |
| Browser File API | Membaca file secara lokal di perangkat pengguna |

## Instalasi dan Menjalankan Proyek

Pastikan [Node.js](https://nodejs.org/) versi LTS dan npm sudah terpasang.

```bash
# Masuk ke folder proyek
cd dataflow-analytics

# Instal seluruh dependency
npm install

# Jalankan development server
npm run dev
```

Buka `http://localhost:3000` pada browser.

Untuk membuat versi produksi:

```bash
npm run build
npm start
```

## Struktur Folder

```text
dataflow-analytics/
├── public/                     # Aset publik
├── src/
│   ├── app/
│   │   ├── dashboard.css       # Tampilan dashboard
│   │   ├── formula-builder.css # Tampilan Formula Builder
│   │   ├── globals.css         # Style global
│   │   ├── layout.js           # Root layout
│   │   ├── page.js             # Halaman dan state utama
│   │   └── workspace-features.css
│   ├── components/
│   │   ├── CleanPanel.js       # Pembersihan dan transformasi
│   │   ├── DataScene.js        # Visual pada halaman awal
│   │   ├── ExportPanel.js      # Pengaturan ekspor
│   │   └── FormulaBuilder.js   # Perhitungan tanpa rumus manual
│   └── lib/
│       └── excel.js            # Parsing dan analisis spreadsheet
├── package.json
└── README.md
```

## Format Data yang Disarankan

Agar hasil analisis lebih akurat:

- Gunakan baris pertama sebagai nama kolom.
- Hindari header bertingkat atau sel yang digabungkan.
- Gunakan satu jenis data pada setiap kolom.
- Pastikan nama kolom tidak kosong.
- Gunakan format tanggal dan angka yang konsisten.

Contoh data penjualan:

| Tanggal | Produk | Jumlah | Harga Beli | Harga Jual | Stok Awal |
|---|---|---:|---:|---:|---:|
| 08/09/2026 | Produk A | 5 | 10.000 | 15.000 | 30 |
| 08/09/2026 | Produk B | 3 | 20.000 | 28.000 | 18 |

## Privasi Data

DataFlow Analytics menggunakan pemrosesan lokal pada browser. File yang dipilih hanya digunakan selama sesi berlangsung dan tidak dikirim ke server. Karena versi ini belum memakai database, pekerjaan akan hilang ketika halaman ditutup atau dimuat ulang jika hasilnya belum diekspor.

## Batasan Versi Saat Ini

- Belum memiliki akun dan penyimpanan cloud.
- Belum menyimpan riwayat pekerjaan setelah browser ditutup.
- Pratinjau tabel dibatasi hingga 100 baris.
- File berukuran sangat besar dapat membutuhkan waktu proses lebih lama.
- Saran kolom bergantung pada konsistensi isi spreadsheet.

## Rencana Pengembangan

- [x] Upload dan parsing Excel/CSV.
- [x] Pemilihan sheet.
- [x] Overview dan pemeriksaan kualitas data.
- [x] Data Explorer dan pencarian.
- [x] Pembersihan data dasar.
- [x] Formula Builder dasar.
- [x] Export Excel dan CSV.
- [ ] Analisis otomatis untung, rugi, dan balik modal.
- [ ] Ringkasan keuntungan harian.
- [ ] Kalkulator modal untuk usaha baru.
- [ ] Penggabungan beberapa file laporan.
- [ ] Perbandingan dua file atau dua sheet.
- [ ] Penyimpanan resep pembersihan data.
- [ ] Penyimpanan sesi secara lokal.
- [ ] Mode data besar dengan pagination atau virtual table.

## Pengembang

**Muhamad Arkazedy Nugra Faebyanza**  
Siswa Rekayasa Perangkat Lunak — SMK Negeri 4 Tanjungpinang

Proyek ini dikembangkan sebagai media pembelajaran dan portofolio pengembangan aplikasi web.

