import { Response } from 'express';
import db from '../db/database';
import { AppError, asyncHandler } from '../utils/utils';
import { AuthRequest } from '../middleware/auth';

export const getCart = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new AppError('User not authenticated', 401);
  }

  // Verify user exists in database
  const userExists = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
  if (!userExists) {
    throw new AppError('User not found. Please log in again.', 401);
  }

  const cartItems = db.prepare(`
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

export const addToCart = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { productId, quantity } = req.body;

  if (!userId) {
    throw new AppError('User not authenticated', 401);
  }

  // Verify user exists in database
  const userExists = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
  if (!userExists) {
    throw new AppError('User not found. Please log in again.', 401);
  }

  if (!productId || !quantity || quantity <= 0) {
    throw new AppError('Product ID and valid quantity are required', 400);
  }

  // Check if product exists and has sufficient stock
  const product = db.prepare('SELECT id, stock FROM products WHERE id = ?').get(productId) as { id: string; stock: number } | undefined;
  
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  // Check existing cart item
  const existingCartItem = db.prepare('SELECT quantity FROM carts WHERE user_id = ? AND product_id = ?').get(userId, productId) as { quantity: number } | undefined;
  
  const newQuantity = (existingCartItem?.quantity || 0) + quantity;
  
  if (newQuantity > product.stock) {
    throw new AppError(`Insufficient stock. Available: ${product.stock}, Requested: ${newQuantity}`, 400);
  }

  // Insert or update cart item
  if (existingCartItem) {
    db.prepare('UPDATE carts SET quantity = ? WHERE user_id = ? AND product_id = ?').run(newQuantity, userId, productId);
  } else {
    db.prepare('INSERT INTO carts (user_id, product_id, quantity) VALUES (?, ?, ?)').run(userId, productId, quantity);
  }

  res.json({
    status: 'success',
    message: 'Item added to cart successfully',
  });
});

export const updateCartItem = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { productId } = req.params;
  const { quantity } = req.body;

  if (!userId) {
    throw new AppError('User not authenticated', 401);
  }

  // Verify user exists in database
  const userExists = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
  if (!userExists) {
    throw new AppError('User not found. Please log in again.', 401);
  }

  if (!quantity || quantity < 0) {
    throw new AppError('Valid quantity is required', 400);
  }

  // If quantity is 0, remove item
  if (quantity === 0) {
    db.prepare('DELETE FROM carts WHERE user_id = ? AND product_id = ?').run(userId, productId);
    res.json({
      status: 'success',
      message: 'Item removed from cart',
    });
    return;
  }

  // Check if product exists and has sufficient stock
  const product = db.prepare('SELECT id, stock FROM products WHERE id = ?').get(productId) as { id: string; stock: number } | undefined;
  
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  if (quantity > product.stock) {
    throw new AppError(`Insufficient stock. Available: ${product.stock}, Requested: ${quantity}`, 400);
  }

  // Update cart item
  const result = db.prepare('UPDATE carts SET quantity = ? WHERE user_id = ? AND product_id = ?').run(quantity, userId, productId);
  
  if (result.changes === 0) {
    throw new AppError('Cart item not found', 404);
  }

  res.json({
    status: 'success',
    message: 'Cart item updated successfully',
  });
});

export const removeFromCart = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { productId } = req.params;

  if (!userId) {
    throw new AppError('User not authenticated', 401);
  }

  // Verify user exists in database
  const userExists = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
  if (!userExists) {
    throw new AppError('User not found. Please log in again.', 401);
  }

  const result = db.prepare('DELETE FROM carts WHERE user_id = ? AND product_id = ?').run(userId, productId);
  
  if (result.changes === 0) {
    throw new AppError('Cart item not found', 404);
  }

  res.json({
    status: 'success',
    message: 'Item removed from cart successfully',
  });
});

export const clearCart = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    throw new AppError('User not authenticated', 401);
  }

  // Verify user exists in database
  const userExists = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
  if (!userExists) {
    throw new AppError('User not found. Please log in again.', 401);
  }

  db.prepare('DELETE FROM carts WHERE user_id = ?').run(userId);

  res.json({
    status: 'success',
    message: 'Cart cleared successfully',
  });
}); 