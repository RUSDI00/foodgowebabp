import db from './database';
import bcrypt from 'bcryptjs';
import { generateId } from '../utils/utils';
import { config } from '../config';
import { DiscountType, NotificationType } from '../models/types';

const ADMIN_EMAIL = 'admin@foodgo.com';
const ADMIN_PASSWORD = 'adminpassword';

const INITIAL_PRODUCTS = [
  { id: 'food1', name: 'Nasi Goreng FoodGo', description: 'Nasi goreng spesial dengan bumbu rahasia FoodGo, telur, ayam, dan sayuran segar.', category: 'Makanan Berat', price: 25000, imageUrl: 'https://picsum.photos/seed/nasigoreng/400/300', stock: 50 },
  { id: 'food2', name: 'Ayam Geprek Sambal Matah', description: 'Ayam goreng krispi digeprek dengan sambal matah pedas segar.', category: 'Makanan Berat', price: 28000, imageUrl: 'https://picsum.photos/seed/ayamgeprek/400/300', stock: 40 },
  { id: 'food3', name: 'Pizza Beef Supreme', description: 'Pizza dengan topping daging sapi cincang, paprika, bawang bombay, dan keju mozzarella melimpah.', category: 'Makanan Italia', price: 75000, imageUrl: 'https://picsum.photos/seed/pizza/400/300', stock: 20 },
  { id: 'food4', name: 'Burger Keju Lezat', description: 'Burger dengan patty daging sapi tebal, keju cheddar, selada, tomat, dan saus spesial.', category: 'Makanan Cepat Saji', price: 35000, imageUrl: 'https://picsum.photos/seed/burger/400/300', stock: 30 },
  { id: 'food5', name: 'Es Kopi Susu Gula Aren', description: 'Perpaduan kopi espresso, susu segar, dan manisnya gula aren alami.', category: 'Minuman Dingin', price: 18000, imageUrl: 'https://picsum.photos/seed/kopisusu/400/300', stock: 60 },
  { id: 'food6', name: 'Jus Alpukat Segar', description: 'Jus alpukat murni dengan sedikit gula dan susu kental manis (opsional).', category: 'Minuman Sehat', price: 22000, imageUrl: 'https://picsum.photos/seed/jusbuah/400/300', stock: 35 },
  { id: 'food7', name: 'Sate Ayam Madura', description: 'Sate ayam bumbu khas Madura dengan bumbu kacang pedas dan kecap manis.', category: 'Makanan Tradisional', price: 30000, imageUrl: 'https://picsum.photos/seed/sateayam/400/300', stock: 45 },
  { id: 'food8', name: 'Gado-Gado Jakarta', description: 'Gado-gado dengan sayuran segar, tahu, tempe, lontong, dan bumbu kacang otentik Jakarta.', category: 'Makanan Tradisional', price: 20000, imageUrl: 'https://picsum.photos/seed/gadogado/400/300', stock: 55 },
  { id: 'food9', name: 'Spaghetti Carbonara', description: 'Spaghetti dengan saus carbonara creamy, bacon crispy, dan keju parmesan.', category: 'Makanan Italia', price: 45000, imageUrl: 'https://picsum.photos/seed/carbonara/400/300', stock: 25 },
  { id: 'food10', name: 'Teh Tarik Malaysia', description: 'Teh tarik khas Malaysia dengan susu kental manis dan teknik tarik yang menghasilkan foam lembut.', category: 'Minuman Panas', price: 15000, imageUrl: 'https://picsum.photos/seed/tehtarik/400/300', stock: 70 },
  { id: 'food11', name: 'Bakso Malang Jumbo', description: 'Bakso berukuran jumbo dengan kuah kaldu sapi segar, mie, tahu, dan siomay.', category: 'Makanan Berkuah', price: 32000, imageUrl: 'https://picsum.photos/seed/bakso/400/300', stock: 38 },
  { id: 'food12', name: 'Smoothie Bowl Berry', description: 'Smoothie bowl dengan campuran mixed berry, granola, chia seed, dan topping buah segar.', category: 'Minuman Sehat', price: 28000, imageUrl: 'https://picsum.photos/seed/smoothiebowl/400/300', stock: 42 },
];

const INITIAL_PROMOS = [
  { id: 'promo1', code: 'HEMAT10', description: 'Diskon 10% untuk semua produk', discountType: DiscountType.PERCENTAGE, discountValue: 10, minPurchase: 50000, isActive: true },
  { id: 'promo2', code: 'ONGKIRGRATIS', description: 'Potongan ongkir Rp 20.000', discountType: DiscountType.FIXED, discountValue: 20000, minPurchase: 100000, isActive: true },
];

export const seedDatabase = async () => {
  try {
    // Check if database is already seeded
    const existingAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get(ADMIN_EMAIL);
    if (existingAdmin) {
      console.log('Database already seeded');
      return;
    }

    console.log('Starting database seed...');

    // Hash passwords
    const adminPassword = await bcrypt.hash(ADMIN_PASSWORD, config.bcryptRounds);
    const userPassword = await bcrypt.hash('password123', config.bcryptRounds);

    // Insert users
    const insertUser = db.prepare(`
      INSERT INTO users (id, email, password_hash, role, name, phone)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const adminId = 'admin001';
    const userId = 'user001';

    insertUser.run(adminId, ADMIN_EMAIL, adminPassword, 'admin', 'Admin FoodGo', null);
    insertUser.run(userId, 'user@example.com', userPassword, 'user', 'Pengguna FoodGo', '081234567890');

    // Insert wallets
    const insertWallet = db.prepare(`
      INSERT INTO wallets (user_id, balance)
      VALUES (?, ?)
    `);

    insertWallet.run(adminId, 0);
    insertWallet.run(userId, 500000);

    // Insert products
    const insertProduct = db.prepare(`
      INSERT INTO products (id, name, description, category, price, image_url, stock)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const product of INITIAL_PRODUCTS) {
      insertProduct.run(
        product.id,
        product.name,
        product.description,
        product.category,
        product.price,
        product.imageUrl,
        product.stock
      );
    }

    // Insert promos
    const insertPromo = db.prepare(`
      INSERT INTO promos (id, code, description, discount_type, discount_value, min_purchase, start_date, end_date, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    for (const promo of INITIAL_PROMOS) {
      insertPromo.run(
        promo.id,
        promo.code,
        promo.description,
        promo.discountType,
        promo.discountValue,
        promo.minPurchase || null,
        now.toISOString(),
        weekFromNow.toISOString(),
        promo.isActive ? 1 : 0
      );
    }

    // Insert sample notifications
    const insertNotification = db.prepare(`
      INSERT INTO notifications (id, user_id, message, type, is_read)
      VALUES (?, ?, ?, ?, ?)
    `);

    insertNotification.run(
      generateId(),
      userId,
      'Selamat datang di FoodGo! Pesan makanan favoritmu sekarang.',
      NotificationType.GENERAL,
      0
    );

    // Insert sample reviews
    const insertReview = db.prepare(`
      INSERT INTO reviews (id, user_id, user_name, product_id, rating, text)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    insertReview.run(
      generateId(),
      userId,
      'Pengguna FoodGo',
      'food1',
      5,
      'Nasi gorengnya enak banget, porsinya pas!'
    );

    insertReview.run(
      generateId(),
      userId,
      'Pengguna FoodGo',
      'food2',
      4,
      'Ayam gepreknya pedas mantap, sambal matahnya segar.'
    );

    // Insert sample cart item
    const insertCart = db.prepare(`
      INSERT INTO carts (user_id, product_id, quantity)
      VALUES (?, ?, ?)
    `);

    insertCart.run(userId, 'food1', 1);

    // Insert sample orders
    const insertOrder = db.prepare(`
      INSERT INTO orders (id, user_id, total_amount, status, shipping_address, payment_method, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const insertOrderItem = db.prepare(`
      INSERT INTO order_items (order_id, product_id, quantity, price, name, image_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    // Sample order 1 - Completed
    const order1Id = generateId();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    insertOrder.run(
      order1Id,
      userId,
      53000,
      'DELIVERED',
      'Jl. Sudirman No. 123, Jakarta Selatan',
      'Wallet',
      yesterday.toISOString()
    );

    insertOrderItem.run(order1Id, 'food1', 1, 25000, 'Nasi Goreng FoodGo', 'https://picsum.photos/seed/nasigoreng/400/300');
    insertOrderItem.run(order1Id, 'food2', 1, 28000, 'Ayam Geprek Sambal Matah', 'https://picsum.photos/seed/ayamgeprek/400/300');

    // Sample order 2 - Processing
    const order2Id = generateId();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    insertOrder.run(
      order2Id,
      userId,
      75000,
      'PROCESSING',
      'Jl. Thamrin No. 456, Jakarta Pusat',
      'Wallet',
      twoHoursAgo.toISOString()
    );

    insertOrderItem.run(order2Id, 'food3', 1, 75000, 'Pizza Beef Supreme', 'https://picsum.photos/seed/pizza/400/300');

    // Sample order 3 - Pending Payment
    const order3Id = generateId();
    const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000);
    insertOrder.run(
      order3Id,
      userId,
      57000,
      'PENDING_PAYMENT',
      'Jl. Gatot Subroto No. 789, Jakarta Selatan',
      'FakePayment',
      oneHourAgo.toISOString()
    );

    insertOrderItem.run(order3Id, 'food4', 1, 35000, 'Burger Keju Lezat', 'https://picsum.photos/seed/burger/400/300');
    insertOrderItem.run(order3Id, 'food6', 1, 22000, 'Jus Alpukat Segar', 'https://picsum.photos/seed/jusbuah/400/300');

    // Insert wallet transactions for wallet payments
    const insertWalletTx = db.prepare(`
      INSERT INTO wallet_transactions (id, user_id, type, amount, description, related_order_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    insertWalletTx.run(
      generateId(),
      userId,
      'PAYMENT',
      -53000,
      `Payment for order #${order1Id}`,
      order1Id
    );

    insertWalletTx.run(
      generateId(),
      userId,
      'PAYMENT',
      -75000,
      `Payment for order #${order2Id}`,
      order2Id
    );

    // Deduct from wallet balance for the orders
    db.prepare('UPDATE wallets SET balance = balance - ? WHERE user_id = ?').run(128000, userId); // 53000 + 75000

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
};

// Run seed if this file is executed directly
if (require.main === module) {
  seedDatabase();
} 