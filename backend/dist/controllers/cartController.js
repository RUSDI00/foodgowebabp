"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearCart = exports.removeFromCart = exports.updateCartItem = exports.addToCart = exports.getCart = void 0;
const database_1 = __importDefault(require("../db/database"));
const utils_1 = require("../utils/utils");
exports.getCart = (0, utils_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new utils_1.AppError('User not authenticated', 401);
    }
    // Verify user exists in database
    const userExists = database_1.default.prepare('SELECT id FROM users WHERE id = ?').get(userId);
    if (!userExists) {
        throw new utils_1.AppError('User not found. Please log in again.', 401);
    }
    const cartItems = database_1.default.prepare(`
    SELECT c.product_id as productId, c.quantity, p.name, p.price, p.image_url as imageUrl, p.stock
    FROM carts c
    JOIN products p ON c.product_id = p.id
    WHERE c.user_id = ?
  `).all(userId);
    res.json({
        status: 'success',
        data: {
            cartItems,
        },
    });
});
exports.addToCart = (0, utils_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    const { productId, quantity } = req.body;
    if (!userId) {
        throw new utils_1.AppError('User not authenticated', 401);
    }
    // Verify user exists in database
    const userExists = database_1.default.prepare('SELECT id FROM users WHERE id = ?').get(userId);
    if (!userExists) {
        throw new utils_1.AppError('User not found. Please log in again.', 401);
    }
    if (!productId || !quantity || quantity <= 0) {
        throw new utils_1.AppError('Product ID and valid quantity are required', 400);
    }
    // Check if product exists and has sufficient stock
    const product = database_1.default.prepare('SELECT id, stock FROM products WHERE id = ?').get(productId);
    if (!product) {
        throw new utils_1.AppError('Product not found', 404);
    }
    // Check existing cart item
    const existingCartItem = database_1.default.prepare('SELECT quantity FROM carts WHERE user_id = ? AND product_id = ?').get(userId, productId);
    const newQuantity = (existingCartItem?.quantity || 0) + quantity;
    if (newQuantity > product.stock) {
        throw new utils_1.AppError(`Insufficient stock. Available: ${product.stock}, Requested: ${newQuantity}`, 400);
    }
    // Insert or update cart item
    if (existingCartItem) {
        database_1.default.prepare('UPDATE carts SET quantity = ? WHERE user_id = ? AND product_id = ?').run(newQuantity, userId, productId);
    }
    else {
        database_1.default.prepare('INSERT INTO carts (user_id, product_id, quantity) VALUES (?, ?, ?)').run(userId, productId, quantity);
    }
    res.json({
        status: 'success',
        message: 'Item added to cart successfully',
    });
});
exports.updateCartItem = (0, utils_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    const { productId } = req.params;
    const { quantity } = req.body;
    if (!userId) {
        throw new utils_1.AppError('User not authenticated', 401);
    }
    // Verify user exists in database
    const userExists = database_1.default.prepare('SELECT id FROM users WHERE id = ?').get(userId);
    if (!userExists) {
        throw new utils_1.AppError('User not found. Please log in again.', 401);
    }
    if (!quantity || quantity < 0) {
        throw new utils_1.AppError('Valid quantity is required', 400);
    }
    // If quantity is 0, remove item
    if (quantity === 0) {
        database_1.default.prepare('DELETE FROM carts WHERE user_id = ? AND product_id = ?').run(userId, productId);
        res.json({
            status: 'success',
            message: 'Item removed from cart',
        });
        return;
    }
    // Check if product exists and has sufficient stock
    const product = database_1.default.prepare('SELECT id, stock FROM products WHERE id = ?').get(productId);
    if (!product) {
        throw new utils_1.AppError('Product not found', 404);
    }
    if (quantity > product.stock) {
        throw new utils_1.AppError(`Insufficient stock. Available: ${product.stock}, Requested: ${quantity}`, 400);
    }
    // Update cart item
    const result = database_1.default.prepare('UPDATE carts SET quantity = ? WHERE user_id = ? AND product_id = ?').run(quantity, userId, productId);
    if (result.changes === 0) {
        throw new utils_1.AppError('Cart item not found', 404);
    }
    res.json({
        status: 'success',
        message: 'Cart item updated successfully',
    });
});
exports.removeFromCart = (0, utils_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    const { productId } = req.params;
    if (!userId) {
        throw new utils_1.AppError('User not authenticated', 401);
    }
    // Verify user exists in database
    const userExists = database_1.default.prepare('SELECT id FROM users WHERE id = ?').get(userId);
    if (!userExists) {
        throw new utils_1.AppError('User not found. Please log in again.', 401);
    }
    const result = database_1.default.prepare('DELETE FROM carts WHERE user_id = ? AND product_id = ?').run(userId, productId);
    if (result.changes === 0) {
        throw new utils_1.AppError('Cart item not found', 404);
    }
    res.json({
        status: 'success',
        message: 'Item removed from cart successfully',
    });
});
exports.clearCart = (0, utils_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new utils_1.AppError('User not authenticated', 401);
    }
    // Verify user exists in database
    const userExists = database_1.default.prepare('SELECT id FROM users WHERE id = ?').get(userId);
    if (!userExists) {
        throw new utils_1.AppError('User not found. Please log in again.', 401);
    }
    database_1.default.prepare('DELETE FROM carts WHERE user_id = ?').run(userId);
    res.json({
        status: 'success',
        message: 'Cart cleared successfully',
    });
});
//# sourceMappingURL=cartController.js.map