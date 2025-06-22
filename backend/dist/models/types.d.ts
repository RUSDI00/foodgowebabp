export interface User {
    id: string;
    email: string;
    passwordHash: string;
    role: 'user' | 'admin';
    name: string;
    phone?: string;
    createdAt: string;
    updatedAt?: string;
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
    updatedAt?: string;
}
export interface Rating {
    userId: string;
    productId: string;
    stars: number;
}
export interface Review {
    id: string;
    userId: string;
    userName: string;
    productId: string;
    rating: number;
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
export declare enum OrderStatus {
    PENDING_PAYMENT = "Menunggu Pembayaran",
    PROCESSING = "Diproses",
    SHIPPED = "Dikirim",
    DELIVERED = "Selesai",
    CANCELLED = "Dibatalkan"
}
export interface Order {
    id: string;
    userId: string;
    items: CartItem[];
    totalAmount: number;
    status: OrderStatus;
    shippingAddress: string;
    paymentMethod: string;
    createdAt: string;
    updatedAt: string;
}
export interface Wallet {
    userId: string;
    balance: number;
}
export declare enum WalletTransactionType {
    TOPUP = "Top-up Saldo",
    PAYMENT = "Pembayaran Pesanan",
    REFUND = "Pengembalian Dana"
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
export declare enum NotificationType {
    ORDER_STATUS = "Status Pesanan",
    PROMO = "Promo Baru",
    WALLET = "Aktivitas Dompet",
    GENERAL = "Umum"
}
export interface Notification {
    id: string;
    userId: string;
    message: string;
    type: NotificationType;
    isRead: boolean;
    link?: string;
    createdAt: string;
}
export declare enum DiscountType {
    PERCENTAGE = "percentage",
    FIXED = "fixed"
}
export interface Promo {
    id: string;
    code: string;
    description: string;
    discountType: DiscountType;
    discountValue: number;
    minPurchase?: number;
    startDate: string;
    endDate: string;
    isActive: boolean;
    createdAt: string;
    updatedAt?: string;
}
export interface LoginRequest {
    email: string;
    password: string;
}
export interface RegisterRequest {
    email: string;
    password: string;
    name: string;
    phone?: string;
}
export interface JWTPayload {
    id: string;
    email: string;
    role: 'user' | 'admin';
}
export interface AuthenticatedRequest extends Express.Request {
    user?: JWTPayload;
}
//# sourceMappingURL=types.d.ts.map