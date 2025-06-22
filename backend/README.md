# FoodGo E-Commerce Backend

Backend API untuk aplikasi FoodGo E-Commerce menggunakan Node.js, Express, TypeScript, dan SQLite.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Buat file `.env` dari `.env.example`:
```bash
cp .env.example .env
```

3. Edit `.env` sesuai kebutuhan:
```
PORT=5000
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
DB_FILE=./foodgo.sqlite
CORS_ORIGIN=http://localhost:5173
```

4. Jalankan server development:
```bash
npm run dev
```

## Scripts

- `npm run dev` - Jalankan server dengan hot reload
- `npm run build` - Build TypeScript ke JavaScript
- `npm start` - Jalankan server production

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register user baru
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (perlu auth)

### Products
- `GET /api/products` - Get semua produk
- `GET /api/products/:id` - Get produk by ID
- `GET /api/products/category/:category` - Get produk by kategori
- `GET /api/products/search?q=query` - Search produk
- `POST /api/products` - Tambah produk (admin only)
- `PUT /api/products/:id` - Update produk (admin only)
- `DELETE /api/products/:id` - Delete produk (admin only)

### Cart
- `GET /api/cart` - Get cart user (perlu auth)
- `POST /api/cart/add` - Tambah item ke cart (perlu auth)
- `PUT /api/cart/item/:productId` - Update quantity item (perlu auth)
- `DELETE /api/cart/item/:productId` - Hapus item dari cart (perlu auth)
- `DELETE /api/cart/clear` - Clear cart (perlu auth)

## Database

Database menggunakan SQLite dengan tabel:
- users
- products
- orders & order_items
- carts
- wallets & wallet_transactions
- notifications
- promos
- reviews

## Default Users

Setelah server dijalankan pertama kali, database akan di-seed dengan:
- Admin: admin@foodgo.com / adminpassword
- User: user@example.com / password123