# CLAUDE.md - Standalone Offline Inventory & Stock Ledger

## 1. Project Overview & Boundaries

* **Tujuan:** Aplikasi Android mandiri (APK) untuk pencatatan barang masuk/keluar, pengelolaan kategori, pelacakan stok menipis, perhitungan laba kotor, dan cadangan data mandiri.

* **Strict Constraint:** **Bukan E-Commerce.** Tidak ada checkout cart, pembayaran tunai/kembalian POS, akun pelanggan, atau koneksi API/server cloud. Aplikasi 100% berjalan offline secara lokal di perangkat klien.

## 2. Tech Stack Mandate

* **Runtime / Packager:** Android APK via **Capacitor 6+** (`@capacitor/filesystem` & `@capacitor/share` untuk backup JSON native)

* **Frontend Core:** **React 18+ (TypeScript)** didukung oleh **Vite**

* **Styling Framework:** **Tailwind CSS** (Mobile-first, orientasi potret, no desktop wrappers)

* **Local Persistence:** **IndexedDB** menggunakan wrapper **Dexie.js**

* **Icon Pack:** **Lucide React** (ikon ringkas, tanpa library UI berat)

## 3. File Map & Architecture Reference

Implementasi kode wajib mengacu pada 4 dokumen referensi utama:

* **Kebutuhan Sistem & Logika Bisnis:** Baca `PRD.md`

* **Layout, Tampilan & Interaksi Mobile:** Baca `DESIGN.md`

* **Skema Data, Kueri & Transaksi Atomik:** Baca `ERD.md`

* **Standar Kode & Batas Baris (Max 300 LOC):** Baca `Coding_standard.md`

### Struktur Direktori yang Diterapkan

```
src/
├── components/
│   ├── ui/              # Komponen dasar reusable (Button, BottomSheet, Badge, Toast)
│   ├── layout/          # BottomNav, Header
│   ├── products/        # ProductCard, ProductFormSheet, CategoryManagerSheet, LowStockBanner
│   ├── mutations/       # QuickInOutDrawer, MutationListItem
│   └── reports/         # MetricCard, PeriodFilter, BackupRestoreSection
├── db/
│   ├── schema.ts        # Dexie Database instance & Types
│   ├── operations.ts    # Transaksi Atomik (Stock IN, Stock OUT, Void)
│   ├── reports.ts       # Agregasi kalkulasi laporan harian/mingguan/bulanan/tahunan
│   └── backup.ts        # Export JSON & Import Validation (Capacitor Filesystem/Share)
├── hooks/               # useProducts, useMutations, useReports
├── utils/               # formatters.ts (Format Rupiah, Tanggal)
├── views/
│   ├── DashboardView.tsx
│   ├── CatalogView.tsx
│   ├── HistoryView.tsx
│   └── ReportsView.tsx
├── App.tsx
└── main.tsx

```

## 4. Key Engineering Directives (Untuk AI Agent & Antigravity)

1. **Aturan Ketat Modularitas (Hard Limit 300 Baris):**

   * **Tidak boleh ada file yang melebihi 300 baris kode.** Jika sebuah file mendekati 300 baris, wajib segera dipecah menjadi sub-komponen atau fungsi helper terpisah sesuai `Coding_standard.md`.

2. **Jaga Konsistensi Transaksi (Atomic Operations):**

   * Setiap penambahan mutasi `IN` atau `OUT` **wajib** dieksekusi di dalam `db.transaction('rw', ...)` bersamaan dengan pembaruan `current_stock` pada tabel produk. Tidak boleh memperbarui tabel produk terpisah dari mutasinya.

3. **Alert Kritis Stok Rendah:**

   * Filter stok rendah dipatok statis pada angka $\le 9$ **unit (kurang dari 10 barang)**.

4. **Penyimpanan Nilai Uang:**

   * Seluruh nilai moneter (`cost_price`, `selling_price`, `gross_profit`) disimpan sebagai bilangan bulat murni (`Integer IDR`), bukan float/desimal. Format tampilan rupiah dilakukan di UI via helper `src/utils/formatters.ts`.

5. **Pencegahan Data Corrupt saat Restore:**

   * Proses import backup JSON harus memvalidasi keberadaan *key* wajib (`categories`, `products`, `stock_mutations`) sebelum membersihkan atau menimpa data IndexedDB saat ini.

6. **Mobile-Only Ergonomics:**

   * Jangan gunakan dropdown browser default yang kecil. Gunakan komponen Bottom Sheet / Drawer dengan area tap minimal `44px x 44px` dan `inputMode="numeric"` pada setiap input angka agar nyaman ditekan oleh jari pengguna toko.