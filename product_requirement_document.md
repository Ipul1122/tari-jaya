# Product Requirement Document (PRD)

## 1. Ringkasan Eksekutif & Karakter Produk
Aplikasi ini adalah **sistem pencatatan inventaris/stok toko mandiri (Standalone Offline Inventory & Stock Ledger)** yang dibungkus menjadi APK Android. 

**Bukan E-Commerce, Bukan POS Kasir Multi-Metode:**
Aplikasi tidak memiliki fitur checkout keranjang kompleks, gateway pembayaran digital, cetak struk thermal, maupun manajemen akun pelanggan. Fokus utama sistem adalah mencatat **Barang Masuk (Stock In / Pembelian)** dan **Barang Keluar (Stock Out / Terjual)** secara cepat dengan kalkulasi margin keuntungan bruto serta pelacakan stok otomatis.

---

## 2. Target Pengguna & Karakteristik Lingkungan
* **Pengguna Utama:** Pemilik toko kelontong/ritel fisik skala mikro (single user/toko tunggal).
* **Lingkungan Kerja:** Smartphone Android, operasi 100% offline (tanpa koneksi internet, tanpa server cloud).
* **Perangkat Target:** Android 8.0+ dengan resolusi layar smartphone vertikal (360px - 430px viewport width).

---

## 3. Fitur Utama & Kebutuhan Fungsional

### F-01: Manajemen Kategori Barang
* **CRUD Kategori:** Tambah, edit nama, dan hapus kategori.
* **Validasi Relasi:** Kategori tidak dapat dihapus jika masih terasosiasi dengan produk aktif (harus dialihkan atau tolak hapus).
* **Kategori Default:** Sistem menyediakan minimal 1 kategori default (misal: "Umum").

### F-02: Manajemen Master Produk (Katalog Barang)
* **Atribut Produk:** ID, Nama Barang, Kategori ID, Stok Saat Ini (integer), Harga Beli/Modal (integer IDR), Harga Jual (integer IDR), Timestamp Update.
* **Pencarian Real-Time:** Filter pencarian berdasarkan nama produk dengan *debounce* 150ms.
* **Aksi Cepat (Quick Actions):** Aksi Edit dan Hapus langsung dapat diakses lewat modal/bottom sheet tanpa navigasi berpindah halaman yang dalam.
* **Validasi:** Harga jual tidak boleh negatif; harga modal tidak boleh negatif.

### F-03: Pencatatan Barang Masuk & Keluar (Stock In / Out Ledger)
* **Pencatatan Masuk (IN):**
  * Input: Pilih produk, jumlah masuk (qty > 0), penyesuaian harga beli (opsional, default ke harga modal produk saat ini), catatan/keterangan opsional.
  * Efek Sistem: Stok produk bertambah secara otomatis secara atomik (`stok_baru = stok_lama + qty`).
* **Pencatatan Keluar (OUT):**
  * Input: Pilih produk, jumlah keluar (qty > 0), penyesuaian harga jual (opsional, default ke harga jual produk saat ini), catatan/keterangan opsional.
  * Validasi: Sistem menolak transaksi keluar jika kuantitas melebihi stok yang tersedia (cegah stok minus), kecuali pengguna secara sadar mengonfirmasi *allow negative stock*.
  * Efek Sistem: Stok produk berkurang otomatis (`stok_baru = stok_lama - qty`), menghitung laba kotor per entri:
    $$\text{Laba Kotor} = (\text{Harga Jual Entri} - \text{Harga Beli Entri}) \times \text{Qty}$$

### F-04: Alert & Notifikasi Stok Rendah (< 10 Unit)
* **Kriteria Peringatan:** Setiap produk dengan kuantitas stok $\le 9$ otomatis berstatus *Low Stock*.
* **Display Visual:** Badge oranye/merah tebal pada daftar produk dan banner rangkuman stok menipis di halaman utama/dashboard.

### F-05: Riwayat Transaksi & Pembatalan (Audit Trail)
* Daftar kronologis seluruh mutasi stok (IN/OUT) dengan filter tanggal.
* Opsi pembatalan/penghapusan mutasi (Void): Jika mutasi salah diinput dan dihapus, stok master produk harus otomatis di-*rollback* ke nilai sebelum transaksi tersebut terjadi.

### F-06: Laporan Kinerja Inventaris & Laba
Laporan agregasi data tanpa internet yang menyajikan:
1. Total Nilai Barang Masuk (Modal yang dikeluarkan).
2. Total Nilai Barang Keluar (Omzet kotor).
3. Estimasi Keuntungan/Laba Kotor ($\text{Omzet} - \text{Modal Terjual}$).
4. Total Volume Barang Masuk & Keluar (Pcs/Unit).
* **Rentang Filter:**
  * Harian (Tanggal spesifik).
  * Mingguan (7 hari ke belakang).
  * Bulanan (Pilihan Bulan & Tahun).
  * Tahunan (Pilihan Tahun).

### F-07: Backup & Restore Mandiri (Offline Data Portability)
* **Backup (Export):** Mengompilasi seluruh tabel (Produk, Kategori, Mutasi, Pengaturan) ke dalam format file `.json` terstruktur dengan timestamp pembuatan, lalu memicu unduhan lokal di HP (`backup_inventaris_YYYY-MM-DD.json`).
* **Restore (Import):** Membaca file `.json`, memvalidasi integritas struktur skema, dan menimpa/memulihkan data lokal secara utuh dengan konfirmasi ganda kepada pengguna.

---

## 4. Kebutuhan Non-Fungsional
* **Offline-First:** Tidak boleh ada *network call* eksternal yang memblokir fungsionalitas UI.
* **Performa Eksekusi:** Response mutasi stok dan pembaruan IndexedDB lokal $\le 50\text{ ms}$.
* **Data Persistence:** Data harus tetap utuh saat aplikasi ditutup paksa (*kill task*) atau perangkat dimatikan.
* **Ukuran Bundle:** Ukuran file instalasi APK final $\le 15\text{ MB}$.