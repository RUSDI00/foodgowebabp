import { Response } from 'express';
import db from '../db/database';
import { AppError, asyncHandler, generateId } from '../utils/utils';
import { AuthRequest } from '../middleware/auth';

interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
  name: string;
  imageUrl: string;
}

export const createOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { shippingAddress, paymentMethod } = req.body;

  if (!userId) {
    throw new AppError('User not authenticated', 401);
  }

  if (!shippingAddress || !paymentMethod) {
    throw new AppError('Shipping address and payment method are required', 400);
  }

  // Get cart items
  const cartItems = db.prepare(`
    SELECT c.product_id as productId, c.quantity, p.name, p.price, p.image_url as imageUrl, p.stock
    FROM carts c
    JOIN products p ON c.product_id = p.id
    WHERE c.user_id = ?
  `).all(userId) as (OrderItem & { stock: number })[];

  if (cartItems.length === 0) {
    throw new AppError('Cart is empty', 400);
  }

  // Validate stock for all items
  for (const item of cartItems) {
    if (item.quantity > item.stock) {
      throw new AppError(`Insufficient stock for ${item.name}. Available: ${item.stock}, Requested: ${item.quantity}`, 400);
    }
  }

  // Calculate total amount
  const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // If wallet payment, check balance
  if (paymentMethod === 'Wallet') {
    const wallet = db.prepare('SELECT balance FROM wallets WHERE user_id = ?').get(userId) as { balance: number } | undefined;
    if (!wallet || wallet.balance < totalAmount) {
      throw new AppError('Insufficient wallet balance', 400);
    }
  }

  // Start transaction
  const transaction = db.transaction(() => {
    // Create order
    const orderId = generateId();
    const orderStatus = paymentMethod === 'Wallet' ? 'PROCESSING' : 'PENDING_PAYMENT';
    
    db.prepare(`
      INSERT INTO orders (id, user_id, total_amount, status, shipping_address, payment_method)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(orderId, userId, totalAmount, orderStatus, shippingAddress, paymentMethod);

    // Create order items and update stock
    for (const item of cartItems) {
      // Insert order item
      db.prepare(`
        INSERT INTO order_items (order_id, product_id, quantity, price, name, image_url)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(orderId, item.productId, item.quantity, item.price, item.name, item.imageUrl);

      // Update product stock
      db.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(item.quantity, item.productId);
    }

    // If wallet payment, deduct balance
    if (paymentMethod === 'Wallet') {
      db.prepare('UPDATE wallets SET balance = balance - ? WHERE user_id = ?').run(totalAmount, userId);
      
      // Add wallet transaction
      db.prepare(`
        INSERT INTO wallet_transactions (id, user_id, type, amount, description, related_order_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(generateId(), userId, 'PAYMENT', -totalAmount, `Payment for order #${orderId}`, orderId);
    }

    // Clear cart
    db.prepare('DELETE FROM carts WHERE user_id = ?').run(userId);

    return orderId;
  });

  const orderId = transaction();

  // Get created order
  const order = db.prepare(`
    SELECT id, user_id as userId, total_amount as totalAmount, status, shipping_address as shippingAddress, 
           payment_method as paymentMethod, created_at as createdAt, updated_at as updatedAt
    FROM orders 
    WHERE id = ?
  `).get(orderId);

  res.status(201).json({
    status: 'success',
    data: {
      order,
    },
  });
});

export const getUserOrders = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    throw new AppError('User not authenticated', 401);
  }

  const orders = db.prepare(`
    SELECT id, user_id as userId, total_amount as totalAmount, status, shipping_address as shippingAddress,
           payment_method as paymentMethod, created_at as createdAt, updated_at as updatedAt
    FROM orders 
    WHERE user_id = ?
    ORDER BY created_at DESC
  `).all(userId);

  // Convert backend status to frontend format and get order items
  const backendToFrontendStatus: Record<string, string> = {
    'PENDING_PAYMENT': 'Menunggu Pembayaran',
    'PROCESSING': 'Diproses',
    'SHIPPED': 'Dikirim',
    'DELIVERED': 'Selesai',
    'CANCELLED': 'Dibatalkan'
  };

  for (const order of orders) {
    // Convert status
    (order as any).status = backendToFrontendStatus[(order as any).status] || (order as any).status;
    
    // Get order items
    const items = db.prepare(`
      SELECT product_id as productId, quantity, price, name, image_url as imageUrl
      FROM order_items 
      WHERE order_id = ?
    `).all((order as any).id);
    (order as any).items = items;
  }

  res.json({
    status: 'success',
    data: {
      orders,
    },
  });
});

export const getAllOrders = asyncHandler(async (req: AuthRequest, res: Response) => {
  // Admin only
  if (req.user?.role !== 'admin') {
    throw new AppError('Access denied. Admin only.', 403);
  }

  const orders = db.prepare(`
    SELECT o.id, o.user_id as userId, o.total_amount as totalAmount, o.status, 
           o.shipping_address as shippingAddress, o.payment_method as paymentMethod,
           o.created_at as createdAt, o.updated_at as updatedAt,
           u.name as userName, u.email as userEmail
    FROM orders o
    JOIN users u ON o.user_id = u.id
    ORDER BY o.created_at DESC
  `).all();

  // Convert backend status to frontend format and get order items
  const backendToFrontendStatus: Record<string, string> = {
    'PENDING_PAYMENT': 'Menunggu Pembayaran',
    'PROCESSING': 'Diproses',
    'SHIPPED': 'Dikirim',
    'DELIVERED': 'Selesai',
    'CANCELLED': 'Dibatalkan'
  };

  for (const order of orders) {
    // Convert status
    (order as any).status = backendToFrontendStatus[(order as any).status] || (order as any).status;
    
    // Get order items
    const items = db.prepare(`
      SELECT product_id as productId, quantity, price, name, image_url as imageUrl
      FROM order_items 
      WHERE order_id = ?
    `).all((order as any).id);
    (order as any).items = items;
  }

  res.json({
    status: 'success',
    data: {
      orders,
    },
  });
});

export const cancelUserOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { orderId } = req.params;

  if (!userId) {
    throw new AppError('User not authenticated', 401);
  }

  // Get full order details including payment method and total amount
  const order = db.prepare(`
    SELECT id, user_id as userId, status, payment_method as paymentMethod, total_amount as totalAmount
    FROM orders 
    WHERE id = ? AND user_id = ?
  `).get(orderId, userId) as any;

  if (!order) {
    throw new AppError('Order not found or not authorized', 404);
  }

  // Only allow cancellation for PENDING_PAYMENT and PROCESSING orders
  if (order.status !== 'PENDING_PAYMENT' && order.status !== 'PROCESSING') {
    throw new AppError('Order cannot be cancelled at this status', 400);
  }

  // Start transaction for refund process
  const transaction = db.transaction(() => {
    // Update order status to CANCELLED
    const result = db.prepare(`
      UPDATE orders 
      SET status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP 
      WHERE id = ? AND user_id = ?
    `).run(orderId, userId);

    if (result.changes === 0) {
      throw new AppError('Failed to cancel order', 400);
    }

    // If payment was made with Wallet, refund the money
    if (order.paymentMethod === 'Wallet') {
      // Add money back to wallet
      db.prepare('UPDATE wallets SET balance = balance + ? WHERE user_id = ?').run(order.totalAmount, userId);
      
      // Add refund transaction record
      db.prepare(`
        INSERT INTO wallet_transactions (id, user_id, type, amount, description, related_order_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(generateId(), userId, 'REFUND', order.totalAmount, `Refund for cancelled order #${orderId}`, orderId);
    }

    // Restore product stock for cancelled order
    const orderItems = db.prepare(`
      SELECT product_id, quantity FROM order_items WHERE order_id = ?
    `).all(orderId);

    for (const item of orderItems as any[]) {
      db.prepare('UPDATE products SET stock = stock + ? WHERE id = ?').run(item.quantity, item.product_id);
    }
  });

  transaction();

  // Get updated order with items
  const updatedOrder = db.prepare(`
    SELECT id, user_id as userId, total_amount as totalAmount, status, 
           shipping_address as shippingAddress, payment_method as paymentMethod,
           created_at as createdAt, updated_at as updatedAt
    FROM orders 
    WHERE id = ?
  `).get(orderId) as any;

  // Convert status to frontend format
  const backendToFrontendStatus: Record<string, string> = {
    'PENDING_PAYMENT': 'Menunggu Pembayaran',
    'PROCESSING': 'Diproses',
    'SHIPPED': 'Dikirim',
    'DELIVERED': 'Selesai',
    'CANCELLED': 'Dibatalkan'
  };

  if (updatedOrder) {
    updatedOrder.status = backendToFrontendStatus[updatedOrder.status] || updatedOrder.status;
    
    // Get order items
    const items = db.prepare(`
      SELECT product_id as productId, quantity, price, name, image_url as imageUrl
      FROM order_items 
      WHERE order_id = ?
    `).all(orderId);
    updatedOrder.items = items;
  }

  res.json({
    status: 'success',
    data: {
      order: updatedOrder,
    },
  });
});

export const updateOrderStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  // Admin only
  if (req.user?.role !== 'admin') {
    throw new AppError('Access denied. Admin only.', 403);
  }

  const { orderId } = req.params;
  const { status } = req.body;

  if (!status) {
    throw new AppError('Status is required', 400);
  }

  // Map frontend status values to backend keys
  const statusMapping: Record<string, string> = {
    'Menunggu Pembayaran': 'PENDING_PAYMENT',
    'Diproses': 'PROCESSING', 
    'Dikirim': 'SHIPPED',
    'Selesai': 'DELIVERED',
    'Dibatalkan': 'CANCELLED',
    // Also accept direct backend values
    'PENDING_PAYMENT': 'PENDING_PAYMENT',
    'PROCESSING': 'PROCESSING',
    'SHIPPED': 'SHIPPED', 
    'DELIVERED': 'DELIVERED',
    'CANCELLED': 'CANCELLED'
  };

  const backendStatus = statusMapping[status];
  if (!backendStatus) {
    throw new AppError(`Invalid status: ${status}`, 400);
  }

  const result = db.prepare(`
    UPDATE orders 
    SET status = ?, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).run(backendStatus, orderId);

  if (result.changes === 0) {
    throw new AppError('Order not found', 404);
  }

  // Get updated order
  const order = db.prepare(`
    SELECT id, user_id as userId, total_amount as totalAmount, status, 
           shipping_address as shippingAddress, payment_method as paymentMethod,
           created_at as createdAt, updated_at as updatedAt
    FROM orders 
    WHERE id = ?
  `).get(orderId) as any;

  // Convert backend status to frontend format
  const backendToFrontendStatus: Record<string, string> = {
    'PENDING_PAYMENT': 'Menunggu Pembayaran',
    'PROCESSING': 'Diproses',
    'SHIPPED': 'Dikirim',
    'DELIVERED': 'Selesai',
    'CANCELLED': 'Dibatalkan'
  };

  if (order) {
    order.status = backendToFrontendStatus[order.status] || order.status;
    
    // Get order items
    const items = db.prepare(`
      SELECT product_id as productId, quantity, price, name, image_url as imageUrl
      FROM order_items 
      WHERE order_id = ?
    `).all(orderId);
    order.items = items;
  }

  res.json({
    status: 'success',
    data: {
      order,
    },
  });
}); 