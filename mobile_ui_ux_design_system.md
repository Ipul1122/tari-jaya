# Mobile-First Design & UX Specifications

## 1. Filosofi Desain
* **Target Ergonomi:** Pengoperasian satu tangan (*thumb-friendly zone*). Semua tombol aksi utama ditempatkan pada rentang 40% area bawah layar.
* **Kepadatan Informasi:** Ramping, minim dekorasi visual berlebihan, kontras tinggi agar tetap jelas di bawah sinar matahari toko.

---

## 2. Palet Warna & Tipografi

### Sistem Warna (Tailwind CSS Mapping)
* **Primary / Base Dark:** `#0F172A` (`slate-900`) - Header, teks utama, background navigasi.
* **Surface Background:** `#F8FAFC` (`slate-50`) - Background canvas utama aplikasi.
* **Card & Modal Surface:** `#FFFFFF` (`white`) - Kartu produk dan lembar interaksi.
* **Accent Stock In (Masuk):** `#16A34A` (`emerald-600`) - Tombol, badge, dan indikator barang masuk.
* **Accent Stock Out (Keluar):** `#2563EB` (`blue-600`) - Tombol, badge, dan indikator barang keluar/penjualan.
* **Alert / Low Stock:** `#DC2626` (`red-600`) & `#EA580C` (`orange-600`) - Peringatan stok $< 10$.
* **Border & Separator:** `#E2E8F0` (`slate-200`).

### Tipografi
* **Font Family:** System default sans-serif (`font-sans` - Roboto/Inter bawaan OS Android).
* **Skala Teks:**
  * Judul Halaman: `text-lg font-bold text-slate-900`
  * Nama Produk / Header Kartu: `text-base font-semibold text-slate-800`
  * Angka Moneter & Stok: `text-sm font-mono font-medium`
  * Label / Timestamp: `text-xs text-slate-500`

---

## 3. Komponen Utama & Pola Interaksi (UX Patterns)

### A. Bottom Navigation Bar (Fixed 4 Tab)
Diletakkan paten di bagian bawah layar:
1. **Beranda / Dasbor:** Rangkuman cepat mutasi hari ini & widget peringatan stok menipis.
2. **Katalog Produk:** Daftar pencarian stok, filter kategori, tambah produk.
3. **Riwayat Mutasi:** Log detail barang masuk/keluar.
4. **Laporan & Backup:** Filter agregasi untung/rugi harian-tahunan dan fungsi export/import.

### B. Floating Quick Action Bar (Tombol Pintasan Kasir/Gudang)
Tombol melayang (*Floating Action Button*) atau split button ganda di bagian bawah layar katalog:
* **Tombol Hijau (+ Masuk):** Membuka bottom sheet cepat untuk stok masuk.
* **Tombol Biru (- Keluar):** Membuka bottom sheet cepat untuk stok keluar.
* *Keuntungan UX:* Pengguna tidak perlu membuka menu edit produk hanya untuk mencatat barang datang atau barang laku.

### C. Bottom Sheet Transaksi Kilat (Quick Drawer)
* Menggantikan modal pop-up standar di tengah layar.
* Mengisi 60% layar bawah saat ditekan.
* Berisi: Pilih Nama Produk (Auto-complete / Dropdown cepat), Jumlah Qty (dengan tombol step `- 1` `+ 1` dan keypad numerik), Input Harga Konfirmasi, serta Tombol Simpan besar.

### D. Kartu Produk (Product List Item)
Setiap item pada daftar katalog disusun padat:
```
+--------------------------------------------------------------+
| [Nama Produk]                         [Badge Kategori]      |
| Stok: 8 Pcs (LOW STOCK!) [Merah]       Harga Jual: Rp15.000  |
| Modal: Rp10.000                        Margin: +Rp5.000      |
| ------------------------------------------------------------ |
| [ + Masuk ]   [ - Keluar ]            [ ... Opsi Edit/Hapus ]|
+--------------------------------------------------------------+
```

---

## 4. Penanganan State & Umpan Balik Visual
* **Empty State:** Ilustrasi teks sederhana jika data kosong (misal: "Belum ada mutasi hari ini").
* **Low Stock Highlight:** Kartu produk otomatis memiliki garis tepi samping (*left border*) warna merah `border-l-4 border-l-red-500` jika stok $< 10$.
* **Haptic / Toast Feedback:** Pemberitahuan melayang (*toast*) ringan di bagian atas layar selama 2 detik saat transaksi IN/OUT berhasil disimpan.