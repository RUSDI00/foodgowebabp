
export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: 'user' | 'admin';
  name: string;
  phone?: string;
  createdAt: string;
  updatedAt?: string; // Added updatedAt
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  imageUrl: string;
  stock: number;
  createdAt: string;
  updatedAt?: string; // Added for consistency, though not strictly used by product logic yet
}

export interface Rating {
  userId: string;
  productId: string;
  stars: number; // 1-5
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  productId: string;
  rating: number; // 1-5
  text: string;
  createdAt: string;
}

export interface CartItem {
  productId: string;
  quantity: number;
  name: string;
  price: number;
  imageUrl: string;
}

export enum OrderStatus {
  PENDING_PAYMENT = 'Menunggu Pembayaran',
  PROCESSING = 'Diproses',
  SHIPPED = 'Dikirim',
  DELIVERED = 'Selesai',
  CANCELLED = 'Dibatalkan'
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  totalAmount: number;
  status: OrderStatus;
  shippingAddress: string; // Simplified for now
  paymentMethod: string; // e.g., 'Wallet', 'FakePayment'
  createdAt: string;
  updatedAt: string;
}

export interface Wallet {
  userId: string;
  balance: number;
}

export enum WalletTransactionType { // Defined here
  TOPUP = 'Top-up Saldo',
  PAYMENT = 'Pembayaran Pesanan',
  REFUND = 'Pengembalian Dana'
}

export interface WalletTransaction {
  id: string;
  userId: string;
  type: WalletTransactionType;
  amount: number;
  description: string;
  relatedOrderId?: string;
  createdAt: string;
}

export enum NotificationType {
  ORDER_STATUS = 'Status Pesanan',
  PROMO = 'Promo Baru',
  WALLET = 'Aktivitas Dompet',
  GENERAL = 'Umum'
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  link?: string; // Optional link, e.g., to an order
  createdAt: string;
}

export enum DiscountType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed'
}

export interface Promo {
  id: string;
  code: string;
  description: string;
  discountType: DiscountType;
  discountValue: number; // Percentage (e.g., 10 for 10%) or fixed amount
  minPurchase?: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string; // Added for consistency
}

export interface AppData {
  users: User[];
  products: Product[];
  orders: Order[];
  wallets: Wallet[];
  walletTransactions: WalletTransaction[];
  notifications: Notification[];
  promos: Promo[];
  reviews: Review[];
  carts: Record<string, CartItem[]>; // userId -> CartItem[]
}