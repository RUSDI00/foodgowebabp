"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateOrderStatus = exports.cancelUserOrder = exports.getAllOrders = exports.getUserOrders = exports.createOrder = void 0;
const database_1 = __importDefault(require("../db/database"));
const utils_1 = require("../utils/utils");
exports.createOrder = (0, utils_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    const { shippingAddress, paymentMethod } = req.body;
    if (!userId) {
        throw new utils_1.AppError('User not authenticated', 401);
    }
    if (!shippingAddress || !paymentMethod) {
        throw new utils_1.AppError('Shipping address and payment method are required', 400);
    }
    // Get cart items
    const cartItems = database_1.default.prepare(`
    SELECT c.product_id as productId, c.quantity, p.name, p.price, p.image_url as imageUrl, p.stock
    FROM carts c
    JOIN products p ON c.product_id = p.id
    WHERE c.user_id = ?
  `).all(userId);
    if (cartItems.length === 0) {
        throw new utils_1.AppError('Cart is empty', 400);
    }
    // Validate stock for all items
    for (const item of cartItems) {
        if (item.quantity > item.stock) {
            throw new utils_1.AppError(`Insufficient stock for ${item.name}. Available: ${item.stock}, Requested: ${item.quantity}`, 400);
        }
    }
    // Calculate total amount
    const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    // If wallet payment, check balance
    if (paymentMethod === 'Wallet') {
        const wallet = database_1.default.prepare('SELECT balance FROM wallets WHERE user_id = ?').get(userId);
        if (!wallet || wallet.balance < totalAmount) {
            throw new utils_1.AppError('Insufficient wallet balance', 400);
        }
    }
    // Start transaction
    const transaction = database_1.default.transaction(() => {
        // Create order
        const orderId = (0, utils_1.generateId)();
        const orderStatus = paymentMethod === 'Wallet' ? 'PROCESSING' : 'PENDING_PAYMENT';
        database_1.default.prepare(`
      INSERT INTO orders (id, user_id, total_amount, status, shipping_address, payment_method)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(orderId, userId, totalAmount, orderStatus, shippingAddress, paymentMethod);
        // Create order items and update stock
        for (const item of cartItems) {
            // Insert order item
            database_1.default.prepare(`
        INSERT INTO order_items (order_id, product_id, quantity, price, name, image_url)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(orderId, item.productId, item.quantity, item.price, item.name, item.imageUrl);
            // Update product stock
            database_1.default.prepare('UPDATE products SET stock = stock - ? WHERE id = ?').run(item.quantity, item.productId);
        }
        // If wallet payment, deduct balance
        if (paymentMethod === 'Wallet') {
            database_1.default.prepare('UPDATE wallets SET balance = balance - ? WHERE user_id = ?').run(totalAmount, userId);
            // Add wallet transaction
            database_1.default.prepare(`
        INSERT INTO wallet_transactions (id, user_id, type, amount, description, related_order_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run((0, utils_1.generateId)(), userId, 'PAYMENT', -totalAmount, `Payment for order #${orderId}`, orderId);
        }
        // Clear cart
        database_1.default.prepare('DELETE FROM carts WHERE user_id = ?').run(userId);
        return orderId;
    });
    const orderId = transaction();
    // Get created order
    const order = database_1.default.prepare(`
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
exports.getUserOrders = (0, utils_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new utils_1.AppError('User not authenticated', 401);
    }
    const orders = database_1.default.prepare(`
    SELECT id, user_id as userId, total_amount as totalAmount, status, shipping_address as shippingAddress,
           payment_method as paymentMethod, created_at as createdAt, updated_at as updatedAt
    FROM orders 
    WHERE user_id = ?
    ORDER BY created_at DESC
  `).all(userId);
    // Convert backend status to frontend format and get order items
    const backendToFrontendStatus = {
        'PENDING_PAYMENT': 'Menunggu Pembayaran',
        'PROCESSING': 'Diproses',
        'SHIPPED': 'Dikirim',
        'DELIVERED': 'Selesai',
        'CANCELLED': 'Dibatalkan'
    };
    for (const order of orders) {
        // Convert status
        order.status = backendToFrontendStatus[order.status] || order.status;
        // Get order items
        const items = database_1.default.prepare(`
      SELECT product_id as productId, quantity, price, name, image_url as imageUrl
      FROM order_items 
      WHERE order_id = ?
    `).all(order.id);
        order.items = items;
    }
    res.json({
        status: 'success',
        data: {
            orders,
        },
    });
});
exports.getAllOrders = (0, utils_1.asyncHandler)(async (req, res) => {
    // Admin only
    if (req.user?.role !== 'admin') {
        throw new utils_1.AppError('Access denied. Admin only.', 403);
    }
    const orders = database_1.default.prepare(`
    SELECT o.id, o.user_id as userId, o.total_amount as totalAmount, o.status, 
           o.shipping_address as shippingAddress, o.payment_method as paymentMethod,
           o.created_at as createdAt, o.updated_at as updatedAt,
           u.name as userName, u.email as userEmail
    FROM orders o
    JOIN users u ON o.user_id = u.id
    ORDER BY o.created_at DESC
  `).all();
    // Convert backend status to frontend format and get order items
    const backendToFrontendStatus = {
        'PENDING_PAYMENT': 'Menunggu Pembayaran',
        'PROCESSING': 'Diproses',
        'SHIPPED': 'Dikirim',
        'DELIVERED': 'Selesai',
        'CANCELLED': 'Dibatalkan'
    };
    for (const order of orders) {
        // Convert status
        order.status = backendToFrontendStatus[order.status] || order.status;
        // Get order items
        const items = database_1.default.prepare(`
      SELECT product_id as productId, quantity, price, name, image_url as imageUrl
      FROM order_items 
      WHERE order_id = ?
    `).all(order.id);
        order.items = items;
    }
    res.json({
        status: 'success',
        data: {
            orders,
        },
    });
});
exports.cancelUserOrder = (0, utils_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    const { orderId } = req.params;
    if (!userId) {
        throw new utils_1.AppError('User not authenticated', 401);
    }
    // Get full order details including payment method and total amount
    const order = database_1.default.prepare(`
    SELECT id, user_id as userId, status, payment_method as paymentMethod, total_amount as totalAmount
    FROM orders 
    WHERE id = ? AND user_id = ?
  `).get(orderId, userId);
    if (!order) {
        throw new utils_1.AppError('Order not found or not authorized', 404);
    }
    // Only allow cancellation for PENDING_PAYMENT and PROCESSING orders
    if (order.status !== 'PENDING_PAYMENT' && order.status !== 'PROCESSING') {
        throw new utils_1.AppError('Order cannot be cancelled at this status', 400);
    }
    // Start transaction for refund process
    const transaction = database_1.default.transaction(() => {
        // Update order status to CANCELLED
        const result = database_1.default.prepare(`
      UPDATE orders 
      SET status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP 
      WHERE id = ? AND user_id = ?
    `).run(orderId, userId);
        if (result.changes === 0) {
            throw new utils_1.AppError('Failed to cancel order', 400);
        }
        // If payment was made with Wallet, refund the money
        if (order.paymentMethod === 'Wallet') {
            // Add money back to wallet
            database_1.default.prepare('UPDATE wallets SET balance = balance + ? WHERE user_id = ?').run(order.totalAmount, userId);
            // Add refund transaction record
            database_1.default.prepare(`
        INSERT INTO wallet_transactions (id, user_id, type, amount, description, related_order_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run((0, utils_1.generateId)(), userId, 'REFUND', order.totalAmount, `Refund for cancelled order #${orderId}`, orderId);
        }
        // Restore product stock for cancelled order
        const orderItems = database_1.default.prepare(`
      SELECT product_id, quantity FROM order_items WHERE order_id = ?
    `).all(orderId);
        for (const item of orderItems) {
            database_1.default.prepare('UPDATE products SET stock = stock + ? WHERE id = ?').run(item.quantity, item.product_id);
        }
    });
    transaction();
    // Get updated order with items
    const updatedOrder = database_1.default.prepare(`
    SELECT id, user_id as userId, total_amount as totalAmount, status, 
           shipping_address as shippingAddress, payment_method as paymentMethod,
           created_at as createdAt, updated_at as updatedAt
    FROM orders 
    WHERE id = ?
  `).get(orderId);
    // Convert status to frontend format
    const backendToFrontendStatus = {
        'PENDING_PAYMENT': 'Menunggu Pembayaran',
        'PROCESSING': 'Diproses',
        'SHIPPED': 'Dikirim',
        'DELIVERED': 'Selesai',
        'CANCELLED': 'Dibatalkan'
    };
    if (updatedOrder) {
        updatedOrder.status = backendToFrontendStatus[updatedOrder.status] || updatedOrder.status;
        // Get order items
        const items = database_1.default.prepare(`
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
exports.updateOrderStatus = (0, utils_1.asyncHandler)(async (req, res) => {
    // Admin only
    if (req.user?.role !== 'admin') {
        throw new utils_1.AppError('Access denied. Admin only.', 403);
    }
    const { orderId } = req.params;
    const { status } = req.body;
    if (!status) {
        throw new utils_1.AppError('Status is required', 400);
    }
    // Map frontend status values to backend keys
    const statusMapping = {
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
        throw new utils_1.AppError(`Invalid status: ${status}`, 400);
    }
    const result = database_1.default.prepare(`
    UPDATE orders 
    SET status = ?, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).run(backendStatus, orderId);
    if (result.changes === 0) {
        throw new utils_1.AppError('Order not found', 404);
    }
    // Get updated order
    const order = database_1.default.prepare(`
    SELECT id, user_id as userId, total_amount as totalAmount, status, 
           shipping_address as shippingAddress, payment_method as paymentMethod,
           created_at as createdAt, updated_at as updatedAt
    FROM orders 
    WHERE id = ?
  `).get(orderId);
    // Convert backend status to frontend format
    const backendToFrontendStatus = {
        'PENDING_PAYMENT': 'Menunggu Pembayaran',
        'PROCESSING': 'Diproses',
        'SHIPPED': 'Dikirim',
        'DELIVERED': 'Selesai',
        'CANCELLED': 'Dibatalkan'
    };
    if (order) {
        order.status = backendToFrontendStatus[order.status] || order.status;
        // Get order items
        const items = database_1.default.prepare(`
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
//# sourceMappingURL=orderController.js.map