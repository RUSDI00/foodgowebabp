"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscountType = exports.NotificationType = exports.WalletTransactionType = exports.OrderStatus = void 0;
var OrderStatus;
(function (OrderStatus) {
    OrderStatus["PENDING_PAYMENT"] = "Menunggu Pembayaran";
    OrderStatus["PROCESSING"] = "Diproses";
    OrderStatus["SHIPPED"] = "Dikirim";
    OrderStatus["DELIVERED"] = "Selesai";
    OrderStatus["CANCELLED"] = "Dibatalkan";
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
var WalletTransactionType;
(function (WalletTransactionType) {
    WalletTransactionType["TOPUP"] = "Top-up Saldo";
    WalletTransactionType["PAYMENT"] = "Pembayaran Pesanan";
    WalletTransactionType["REFUND"] = "Pengembalian Dana";
})(WalletTransactionType || (exports.WalletTransactionType = WalletTransactionType = {}));
var NotificationType;
(function (NotificationType) {
    NotificationType["ORDER_STATUS"] = "Status Pesanan";
    NotificationType["PROMO"] = "Promo Baru";
    NotificationType["WALLET"] = "Aktivitas Dompet";
    NotificationType["GENERAL"] = "Umum";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
var DiscountType;
(function (DiscountType) {
    DiscountType["PERCENTAGE"] = "percentage";
    DiscountType["FIXED"] = "fixed";
})(DiscountType || (exports.DiscountType = DiscountType = {}));
//# sourceMappingURL=types.js.map