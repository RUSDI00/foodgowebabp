
import { Order, OrderStatus, CartItem, User, NotificationType, WalletTransactionType } from '../types';
import { getData, saveData, addItem, updateItem as updateDbItem, getItemById as getDbItemById } from './db';
import { addNotification } from './notificationService';
import { addWalletTransaction } from './walletService';
import { getData as getWalletData, saveData as saveWalletData } from './db';

export const getAllOrders = (): Order[] => {
  return getData('orders').sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const getOrdersByUserId = (userId: string): Order[] => {
  const orders = getData('orders');
  return orders.filter(order => order.userId === userId).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const getOrderById = (orderId: string): Order | undefined => {
  return getDbItemById('orders', orderId);
};

export const createOrder = (userId: string, items: CartItem[], totalAmount: number, shippingAddress: string, paymentMethod: string): Order => {
  const newOrderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'> = { // Corrected type: status is part of this payload
    userId,
    items,
    totalAmount,
    shippingAddress,
    paymentMethod,
    status: paymentMethod === 'Wallet' ? OrderStatus.PROCESSING : OrderStatus.PENDING_PAYMENT, // If wallet, assume payment is instant
  };
  const newOrder = addItem('orders', newOrderData) as Order; // addItem now returns the full item with id and createdAt

  if (paymentMethod === 'Wallet') {
    // Deduct from wallet
    const wallets = getWalletData('wallets');
    const wallet = wallets.find(w => w.userId === userId);
    if (wallet && wallet.balance >= totalAmount) {
      wallet.balance -= totalAmount;
      saveWalletData('wallets', wallets);
      addWalletTransaction(userId, WalletTransactionType.PAYMENT, -totalAmount, `Pembayaran untuk pesanan #${newOrder.id}`, newOrder.id);
      newOrder.status = OrderStatus.PROCESSING;
      updateDbItem('orders', newOrder); // Update order status
       addNotification(userId, `Pesanan #${newOrder.id} telah berhasil dibuat dan sedang diproses.`, NotificationType.ORDER_STATUS, `/orders`);
    } else {
      // Wallet payment failed (insufficient balance), revert to pending or handle error
      newOrder.status = OrderStatus.PENDING_PAYMENT;
      newOrder.paymentMethod = 'Pending - Saldo Kurang'; // Indicate issue
      updateDbItem('orders', newOrder);
      addNotification(userId, `Gagal memproses pembayaran pesanan #${newOrder.id} dengan dompet. Saldo tidak mencukupi.`, NotificationType.WALLET, `/wallet`);
    }
  } else {
     addNotification(userId, `Pesanan #${newOrder.id} telah dibuat. Silakan selesaikan pembayaran.`, NotificationType.ORDER_STATUS, `/orders`);
  }
  
  // Update product stock
  const products = getData('products');
  items.forEach(item => {
    const productIndex = products.findIndex(p => p.id === item.productId);
    if (productIndex !== -1 && products[productIndex].stock >= item.quantity) {
      products[productIndex].stock -= item.quantity;
    } else {
      // Handle stock issue - maybe cancel order or part of it. For now, log and proceed.
      console.warn(`Stock tidak mencukupi untuk produk ${item.name} (ID: ${item.productId})`);
      // Could also set order to a problematic status.
    }
  });
  saveData('products', products);


  // Admin notification (simplified)
  const admins = getData('users').filter(u => u.role === 'admin');
  admins.forEach(admin => {
    addNotification(admin.id, `Pesanan baru #${newOrder.id} telah dibuat oleh pengguna.`, NotificationType.GENERAL, `/admin/orders`);
  });

  return newOrder;
};

export const updateOrderStatus = (orderId: string, status: OrderStatus, adminUser?: User): Order | null => {
  const order = getOrderById(orderId);
  if (order) {
    const oldStatus = order.status;
    order.status = status;
    order.updatedAt = new Date().toISOString();
    const updatedOrder = updateDbItem('orders', order);

    if (updatedOrder) {
      let message = `Status pesanan #${orderId} Anda telah diperbarui menjadi: ${status}.`;
      if (adminUser) {
        message = `Pesanan #${orderId} telah dikonfirmasi/diperbarui oleh admin ${adminUser.name} menjadi: ${status}.`;
      }
      addNotification(order.userId, message, NotificationType.ORDER_STATUS, `/orders`);

      // Handle refunds for cancellations if paid
      if (status === OrderStatus.CANCELLED && 
          (oldStatus === OrderStatus.PROCESSING || oldStatus === OrderStatus.SHIPPED || oldStatus === OrderStatus.DELIVERED) &&
          order.paymentMethod === 'Wallet') { // Or other paid methods
            const wallets = getWalletData('wallets');
            const wallet = wallets.find(w => w.userId === order.userId);
            if (wallet) {
                wallet.balance += order.totalAmount;
                saveWalletData('wallets', wallets);
                addWalletTransaction(order.userId, WalletTransactionType.REFUND, order.totalAmount, `Pengembalian dana untuk pesanan #${order.id} yang dibatalkan.`);
                addNotification(order.userId, `Dana sebesar Rp ${order.totalAmount.toLocaleString()} telah dikembalikan ke dompet Anda untuk pesanan #${order.id} yang dibatalkan.`, NotificationType.WALLET, `/wallet`);
            }
      }
    }
    return updatedOrder;
  }
  return null;
};

// User cancels order
export const cancelOrder = (orderId: string, userId: string): Order | null => {
  const order = getOrderById(orderId);
  if (order && order.userId === userId && (order.status === OrderStatus.PENDING_PAYMENT || order.status === OrderStatus.PROCESSING)) {
    // Restore stock
    const products = getData('products');
    order.items.forEach(item => {
      const productIndex = products.findIndex(p => p.id === item.productId);
      if (productIndex !== -1) {
        products[productIndex].stock += item.quantity;
      }
    });
    saveData('products', products);

    return updateOrderStatus(orderId, OrderStatus.CANCELLED);
  }
  // Optionally, add notification if cancellation is not allowed
  if (order && order.userId === userId) {
      addNotification(userId, `Pesanan #${orderId} tidak dapat dibatalkan karena sudah dalam proses pengiriman atau selesai.`, NotificationType.ORDER_STATUS, `/orders`);
  }
  return null;
};
