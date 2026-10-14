# Mobile-First Design & UI/UX Specification

---

### 1. Design System & Constraints

* **Platform:** Android Mobile App (Portrait only).
* **Breakpoints:** Single mobile canvas (`max-w-md mx-auto` di web preview, full-screen $100\text{vw} \times 100\text{vh}$ di APK).
* **Color Palette (Modern Clean Retail):**
  * `Primary`: Indigo/Emerald Green `#059669` (Konotasi finansial, uang, laba positif).
  * `Primary Dark`: `#047857` (Active state, navbar highlight).
  * `Surface / Background`: `#F9FAFB` (Gray-50) untuk body background; `#FFFFFF` untuk cards.
  * `Danger / Minus`: `#DC2626` (Red-600) untuk hapus, stok kritis, atau margin minus.
  * `Text Primary`: `#111827` (Gray-900).
  * `Text Muted`: `#6B7280` (Gray-500).
* **Typography:**
  * Sans-serif system font (Inter/Roboto fallback).
  * Ukuran angka finansial menggunakan `font-mono tracking-tight` untuk mempermudah perbandingan digit nominal uang.

---

### 2. Information Architecture & Navigation

Aplikasi menggunakan **Bottom Navigation Bar** yang selalu terlihat (*fixed bottom*), dengan 4 tab utama:

```
+------------------------------------------+
|  Top Header (Status / Toko / Search)     |
+------------------------------------------+
|                                          |
|                                          |
|           Scrollable Content             |
|                                          |
|                                          |
+------------------------------------------+
| [Kasir]  [Barang]  [Laporan]  [Pengaturan]|
+------------------------------------------+
```

1. **Tab 1: Kasir (POS):** Layar penjualan cepat, grid/list item, keranjang belanja mengambang (*floating cart sheet*).
2. **Tab 2: Barang (Inventori):** Daftar produk, status stok, tombol modal tambah produk baru.
3. **Tab 3: Laporan (Profit & Rekap):** Kartu ringkasan omzet & laba, filter waktu (Hari/Bulan/Tahun), riwayat nota.
4. **Tab 4: Pengaturan (Backup & Reset):** Profil toko sederhana, tombol Backup (.json), tombol Restore file, info versi APK.

---

### 3. Screen Specifications & User Flows

#### Screen 1: POS / Kasir (Utama)
* **Top Bar:** Form pencarian instan (auto-focus opsional) + Filter chip kategori.
* **Product Catalog Area:** 
  * Grid 2-kolom atau list padat.
  * Tiap item menampilkan: Nama Barang, Harga Jual, Sisa Stok.
  * Badge visual: Jika stok $\le 3$, tampilkan badge merah *"Sisa [x]"*.
  * Tap item = Otomatis masuk ke keranjang (+1).
* **Sticky Bottom Bar (Cart Trigger):**
  * Menampilkan: Total Item | Total Belanja (Rp) | Tombol Hijau "Bayar".
* **Checkout Modal (Bottom Sheet):**
  * Rincian barang belanjaan.
  * Input field "Uang Diterima" (dilengkapi tombol quick cash: Uang Pas, 10.000, 20.000, 50.000, 100.000).
  * Kalkulasi otomatis "Kembalian".
  * Tombol konfirmasi "Simpan Transaksi" (Disabled jika uang kurang).

#### Screen 2: Kelola Barang
* **Header:** Jumlah total jenis barang + Tombol floating aksi "+ Tambah Barang".
* **List Item:**
  * Menampilkan: Nama barang, Harga Beli (Modal), Harga Jual, Margin/Laba per unit, dan Jumlah Stok.
  * Aksi swipe/tap untuk "Edit" atau "Nonaktifkan".
* **Form Modal (Tambah / Edit):**
  * Input Nama Barang.
  * Input Harga Beli (Rp) & Harga Jual (Rp).
  * Auto-calculator di bawah form: *"Keuntungan per unit: Rp X (Y%)"*.
  * Input Stok Awal.

#### Screen 3: Laporan & Keuntungan
* **Filter Switcher (Segmented Control):**
  `[ Hari Ini ]` | `[ Bulan Ini ]` | `[ Tahun Ini ]`
* **Summary Cards (3 Kartu Utama):**
  1. **Total Penjualan (Omzet):** Background abu-abu netral, teks besar.
  2. **Total Modal (HPP):** Teks sekunder.
  3. **Laba Bersih:** Background hijau lembut (`bg-emerald-50 text-emerald-700`), teks tebal.
* **List Riwayat Transaksi:**
  * Kartu nota per transaksi: Jam transaksi, jumlah item, total belanja, dan total laba dari transaksi tersebut.
  * Tap nota untuk melihat detail barang apa saja yang dibeli pada transaksi bersangkutan.

#### Screen 4: Pengaturan & Manajemen Data
* Card informasi: *"Penyimpanan: Offline di Perangkat Ini"*.
* **Section Backup & Migrasi:**
  * **Tombol "Export / Cadangkan Data":** Mengunduh file `backup_kasir.json`. Dilengkapi panduan singkat: *"Kirim file ini via WhatsApp ke HP baru jika ingin ganti HP."*
  * **Tombol "Import / Pulihkan Data":** Mengunggah file `.json` cadangan. Menampilkan modal peringatan: *"Data saat ini akan digantikan oleh data dari file cadangan. Lanjutkan?"*

---

### 4. Micro-interactions & Error States
* **Angka Uang:** Wajib diformat dengan pemisah ribuan standar Indonesia (`Intl.NumberFormat('id-ID')`, contoh: `Rp 25.000`).
* **Input Kosong / Validasi Gagal:** Highlight border merah + pesan error di bawah input.
* **Feedback Transaksi Berhasil:** Tampilan pop-up centang hijau sederhana + info kembalian selama 2 detik sebelum otomatis reset ke layar kasir baru.