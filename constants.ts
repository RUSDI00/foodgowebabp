import { DiscountType } from './types'; // Import DiscountType

export const ADMIN_EMAIL = 'admin@foodgo.com';
export const ADMIN_PASSWORD = 'adminpassword'; // In a real app, this would be hashed securely.
export const WHATSAPP_CUSTOMER_SERVICE = '6285213149846';
export const APP_DB_KEY = 'foodGoAppDB';

export const INITIAL_PRODUCTS = [
  { id: 'food1', name: 'Nasi Goreng FoodGo', description: 'Nasi goreng spesial dengan bumbu rahasia FoodGo, telur, ayam, dan sayuran segar.', category: 'Makanan Berat', price: 25000, imageUrl: 'https://picsum.photos/seed/nasigoreng/400/300', stock: 50, createdAt: new Date().toISOString() },
  { id: 'food2', name: 'Ayam Geprek Sambal Matah', description: 'Ayam goreng krispi digeprek dengan sambal matah pedas segar.', category: 'Makanan Berat', price: 28000, imageUrl: 'https://picsum.photos/seed/ayamgeprek/400/300', stock: 40, createdAt: new Date().toISOString() },
  { id: 'food3', name: 'Pizza Beef Supreme', description: 'Pizza dengan topping daging sapi cincang, paprika, bawang bombay, dan keju mozzarella melimpah.', category: 'Makanan Italia', price: 75000, imageUrl: 'https://picsum.photos/seed/pizza/400/300', stock: 20, createdAt: new Date().toISOString() },
  { id: 'food4', name: 'Burger Keju Lezat', description: 'Burger dengan patty daging sapi tebal, keju cheddar, selada, tomat, dan saus spesial.', category: 'Makanan Cepat Saji', price: 35000, imageUrl: 'https://picsum.photos/seed/burger/400/300', stock: 30, createdAt: new Date().toISOString() },
  { id: 'food5', name: 'Es Kopi Susu Gula Aren', description: 'Perpaduan kopi espresso, susu segar, dan manisnya gula aren alami.', category: 'Minuman Dingin', price: 18000, imageUrl: 'https://picsum.photos/seed/kopisusu/400/300', stock: 60, createdAt: new Date().toISOString() },
  { id: 'food6', name: 'Jus Alpukat Segar', description: 'Jus alpukat murni dengan sedikit gula dan susu kental manis (opsional).', category: 'Minuman Sehat', price: 22000, imageUrl: 'https://picsum.photos/seed/jusbuah/400/300', stock: 35, createdAt: new Date().toISOString() },
];

export const INITIAL_PROMOS = [
  { id: 'promo1', code: 'HEMAT10', description: 'Diskon 10% untuk semua produk', discountType: DiscountType.PERCENTAGE, discountValue: 10, minPurchase: 50000, startDate: new Date(Date.now() - 86400000).toISOString(), endDate: new Date(Date.now() + 7 * 86400000).toISOString(), isActive: true, createdAt: new Date().toISOString() },
  { id: 'promo2', code: 'ONGKIRGRATIS', description: 'Potongan ongkir Rp 20.000', discountType: DiscountType.FIXED, discountValue: 20000, minPurchase: 100000, startDate: new Date(Date.now() - 86400000).toISOString(), endDate: new Date(Date.now() + 7 * 86400000).toISOString(), isActive: true, createdAt: new Date().toISOString() },
];