# Coding Standards & Modularity Rules

Dokumen ini menetapkan batasan teknis wajib untuk menjaga keterbacaan, kemudahan pemeliharaan (*maintainability*), dan mencegah penumpukan kode (*spaghetti code*). Setiap penambahan atau pembaruan kode oleh developer maupun AI Agent **wajib** mematuhi aturan di bawah ini.

---

## 1. Batas Ukuran Berkas & Fungsi (File & Function Size Limits)

* **Batas Maksimal Baris per File:** **300 baris kode (LOC)** termasuk import dan tipe lokal.
  * **Tindakan Wajib:** Jika sebuah file mendekati atau melebihi **300 baris**, file tersebut **wajib dipecah (split/refactor)** menjadi sub-komponen, *custom hooks*, atau modul *helper* terpisah.
* **Batas Maksimal Baris per Komponen / Fungsi:** **80 baris**.
  * Jika fungsi/komponen terlalu panjang, ekstrak logika bisnis ke dalam `hooks/` atau `utils/`, dan ekstrak bagian UI berulang ke sub-komponen kecil.
* **Satu File Satu Tanggung Jawab (Single Responsibility Principle):**
  * Satu file `.tsx` hanya boleh mengekspor **1 komponen utama**. Sub-komponen pembantu yang ukurannya lebih dari 30 baris harus dipindahkan ke file tersendiri.

---

## 2. Aturan Pemisahan Lapisan (Separation of Concerns)

Jangan mencampur query database, logika bisnis, dan tampilan UI di dalam satu tempat:

1. **Views (`src/views/`):**
   * Hanya bertugas menyusun tata letak halaman (*page layout*) dan menghubungkan *state* dari *custom hooks* ke komponen anak.
   * **Dilarang** menulis query `db.<table_name>` (Dexie) secara langsung di dalam file View atau Component.
2. **Custom Hooks (`src/hooks/`):**
   * Menangani *state* reaktif UI, filter pencarian, dan memanggil fungsi dari lapisan `src/db/operations.ts`.
3. **Database Layer (`src/db/`):**
   * Semua operasi baca/tulis/transaksi ke IndexedDB (Dexie.js) wajib berada di dalam folder `src/db/`.
   * Pisahkan definisi skema (`schema.ts`), operasi transaksi (`operations.ts`), kueri laporan (`reports.ts`), dan utilitas pencadangan (`backup.ts`).
4. **Pure Utilities (`src/utils/`):**
   * Fungsi pemformatan mata uang Rupiah, pemformatan tanggal, dan kalkulasi matematika murni diletakkan di `src/utils/formatters.ts`.

---

## 3. Standar TypeScript (Strict Typing)

* **Zero `any` Policy:** Dilarang keras menggunakan tipe `any`. Gunakan `unknown` jika tipe belum pasti, lalu lakukan *type narrowing* atau definisikan `interface` / `type` secara eksplisit.
* **Shared Types:** Jika sebuah `interface` digunakan oleh lebih dari 2 file, pindahkan definisinya ke `src/types/index.ts` atau mengacu langsung ke model di `src/db/schema.ts`.
* **Props Interface:** Setiap komponen React wajib mendeklarasikan interface untuk *props*-nya (contoh: `interface ProductCardProps { ... }`).

---

## 4. Standar Penamaan (Naming Conventions)

* **Komponen React (`.tsx`):** `PascalCase` (contoh: `ProductCard.tsx`, `QuickInOutDrawer.tsx`).
* **Hooks (`.ts`):** `camelCase` dengan awalan `use` (contoh: `useInventory.ts`, `useLowStock.ts`).
* **Database, Utils & Helpers (`.ts`):** `camelCase` (contoh: `operations.ts`, `formatCurrency.ts`).
* **Konstanta Global:** `UPPER_SNAKE_CASE` (contoh: `LOW_STOCK_THRESHOLD = 9`).
* **Variabel Boolean:** Wajib diawali dengan `is`, `has`, `should`, atau `can` (contoh: `isLowStock`, `isDrawerOpen`).

---

## 5. Standar UI & Styling (Tailwind CSS & Mobile-First)

* **No Inline Styles:** Dilarang menggunakan atribut `style={{ ... }}` kecuali untuk nilai koordinat dinamis yang tidak bisa ditangani class Tailwind.
* **Keterbacaan Class Tailwind:** Jika untaian class Tailwind terlalu panjang dan berulang di banyak tempat, ekstrak menjadi komponen UI terpisah (misal: `<Button />`, `<Badge />`).
* **Mobile Ergonomics:**
  * Setiap elemen interaktif (`<button>`, `<input>`, item list yang bisa diklik) wajib memiliki tinggi/area sentuh minimal `min-h-[44px]`.
  * Gunakan `inputMode="numeric"` pada semua input angka (Stok, Harga Beli, Harga Jual) agar papan ketik angka HP otomatis muncul.

---

## 6. Penanganan Error & Transaksi Data

* **Atomic DB Transactions:** Setiap mutasi stok (`IN`, `OUT`, `VOID`) wajib dibungkus di dalam blok `db.transaction('rw', ...)` dan dilengkapi `try / catch`.
* **User-Friendly Error Message:** Jangan pernah menampilkan *raw stack trace* ke pengguna. Tampilkan pesan yang jelas dalam Bahasa Indonesia melalui komponen *Toast* atau teks validasi form (contoh: *"Stok barang tidak mencukupi untuk dikeluarkan"*).
* **No `console.log` di Production:** Hapus semua debugging `console.log` sebelum build APK; hanya izinkan `console.error` di dalam blok `catch`.

---

## 7. Checklist Wajib Sebelum Menyelesaikan Task (Definition of Done)

Sebelum menyatakan fitur atau perubahan kode selesai, pastikan:
1. [ ] Tidak ada satu pun file yang melebihi **300 baris**.
2. [ ] Tidak ada error pada pemeriksaan tipe (`tsc --noEmit`).
3. [ ] Tidak ada akses database Dexie langsung di dalam file `.tsx`.
4. [ ] Seluruh nilai harga dan laba disimpan sebagai `Integer` (bukan float/desimal).
5. [ ] Tampilan responsif dan nyaman dioperasikan pada lebar layar `360px - 430px`.