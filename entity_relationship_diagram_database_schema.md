# Entity Relationship Diagram (ERD) & Database Architecture

## 1. Storage Engine
* **Teknologi:** IndexedDB (diakses via abstraction layer **Dexie.js**).
* **Database Name:** `OfflineStoreInventoryDB`
* **Skema Versi:** `v1`

---

## 2. Skema Relasi Entitas

```
+-------------------+             +-----------------------+
|    categories     |             |       products        |
+-------------------+             +-----------------------+
| id (PK, auto)     | 1         * | id (PK, auto)         |
| name (string)     +-------------+ category_id (FK)      |
| created_at        |             | name (string)         |
+-------------------+             | current_stock (int)   |
                                  | cost_price (int)      |
                                  | selling_price (int)   |
                                  | created_at (string)   |
                                  | updated_at (string)   |
                                  +-----------+-----------+
                                              | 1
                                              |
                                              | *
                                  +-----------+-----------+
                                  |     stock_mutations   |
                                  +-----------------------+
                                  | id (PK, auto)         |
                                  | product_id (FK)       |
                                  | type ("IN" | "OUT")   |
                                  | quantity (int)        |
                                  | unit_cost (int)       |
                                  | unit_price (int)      |
                                  | gross_profit (int)    |
                                  | notes (string, opt)   |
                                  | timestamp (ISO8601)   |
                                  +-----------------------+
```

---

## 3. Definisi Entitas & Indeks Skema (Dexie.js)

```typescript
// db/schema.ts
import Dexie, { Table } from 'dexie';

export interface Category {
  id?: number;
  name: string;
  created_at: string;
}

export interface Product {
  id?: number;
  category_id: number;
  name: string;
  current_stock: number;
  cost_price: number;     // Harga modal/beli per unit (IDR)
  selling_price: number;  // Harga jual per unit (IDR)
  created_at: string;
  updated_at: string;
}

export interface StockMutation {
  id?: number;
  product_id: number;
  type: 'IN' | 'OUT';
  quantity: number;
  unit_cost: number;      // Harga modal saat transaksi terjadi
  unit_price: number;     // Harga jual saat transaksi terjadi
  gross_profit: number;   // Dihitung jika type === 'OUT': (unit_price - unit_cost) * quantity
  notes?: string;
  timestamp: string;      // ISO String YYYY-MM-DDTHH:mm:ss.sssZ
}

export interface AppSetting {
  key: string;
  value: string | number | boolean;
}

export class InventoryDatabase extends Dexie {
  categories!: Table<Category, number>;
  products!: Table<Product, number>;
  stock_mutations!: Table<StockMutation, number>;
  settings!: Table<AppSetting, string>;

  constructor() {
    super('OfflineStoreInventoryDB');
    this.version(1).stores({
      categories: '++id, name',
      products: '++id, category_id, name, current_stock',
      stock_mutations: '++id, product_id, type, timestamp, [type+timestamp]',
      settings: 'key'
    });
  }
}

export const db = new InventoryDatabase();
```

---

## 4. Aturan Integritas Transaksi & Rumus Bisnis

### A. Transaksi Masuk (Stock IN) - Atomik
```typescript
await db.transaction('rw', db.products, db.stock_mutations, async () => {
  const product = await db.products.get(productId);
  if (!product) throw new Error("Produk tidak ditemukan");

  const newStock = product.current_stock + qty;

  await db.products.update(productId, {
    current_stock: newStock,
    updated_at: new Date().toISOString()
  });

  await db.stock_mutations.add({
    product_id: productId,
    type: 'IN',
    quantity: qty,
    unit_cost: entryCostPrice || product.cost_price,
    unit_price: product.selling_price,
    gross_profit: 0,
    notes,
    timestamp: new Date().toISOString()
  });
});
```

### B. Transaksi Keluar (Stock OUT) - Atomik & Kalkulasi Laba
```typescript
await db.transaction('rw', db.products, db.stock_mutations, async () => {
  const product = await db.products.get(productId);
  if (!product) throw new Error("Produk tidak ditemukan");
  if (product.current_stock < qty) throw new Error("Stok tidak mencukupi!");

  const newStock = product.current_stock - qty;
  const activeCost = product.cost_price;
  const activePrice = entrySellingPrice || product.selling_price;
  const profit = (activePrice - activeCost) * qty;

  await db.products.update(productId, {
    current_stock: newStock,
    updated_at: new Date().toISOString()
  });

  await db.stock_mutations.add({
    product_id: productId,
    type: 'OUT',
    quantity: qty,
    unit_cost: activeCost,
    unit_price: activePrice,
    gross_profit: profit,
    notes,
    timestamp: new Date().toISOString()
  });
});
```

---

## 5. Struktur Format Skema Cadangan (JSON Backup File)
```json
{
  "version": 1,
  "app": "StandaloneStockLedger",
  "exported_at": "2026-10-14T00:00:00.000Z",
  "data": {
    "categories": [],
    "products": [],
    "stock_mutations": []
  }
}
```