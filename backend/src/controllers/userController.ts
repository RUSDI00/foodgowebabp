import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db/database';
import { AppError, asyncHandler } from '../utils/utils';
import { User } from '../models/types';
import { AuthRequest } from '../middleware/auth';

export const getAllUsers = asyncHandler(async (_req: Request, res: Response) => {
  const users = db.prepare(`
    SELECT id, email, role, name, phone, created_at as createdAt, updated_at as updatedAt
    FROM users 
    ORDER BY created_at DESC
  `).all() as User[];

  res.json({
    status: 'success',
    data: {
      users,
    },
  });
});

export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const user = db.prepare(`
    SELECT id, email, role, name, phone, created_at as createdAt, updated_at as updatedAt
    FROM users 
    WHERE id = ?
  `).get(id) as User | undefined;

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({
    status: 'success',
    data: {
      user,
    },
  });
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Check if user exists
  const user = db.prepare('SELECT id, role FROM users WHERE id = ?').get(id) as { id: string; role: string } | undefined;
  
  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Prevent deleting admin users
  if (user.role === 'admin') {
    throw new AppError('Cannot delete admin user', 403);
  }

  // Delete related data first (due to foreign key constraints)
  const deleteNotifications = db.prepare('DELETE FROM notifications WHERE user_id = ?');
  const deleteReviews = db.prepare('DELETE FROM reviews WHERE user_id = ?');
  const deleteWalletTransactions = db.prepare('DELETE FROM wallet_transactions WHERE user_id = ?');
  const deleteWallets = db.prepare('DELETE FROM wallets WHERE user_id = ?');
  const deleteOrderItems = db.prepare(`
    DELETE FROM order_items 
    WHERE order_id IN (SELECT id FROM orders WHERE user_id = ?)
  `);
  const deleteOrders = db.prepare('DELETE FROM orders WHERE user_id = ?');
  const deleteCarts = db.prepare('DELETE FROM carts WHERE user_id = ?');
  const deleteUser = db.prepare('DELETE FROM users WHERE id = ?');

  // Execute deletions in order
  deleteNotifications.run(id);
  deleteReviews.run(id);
  deleteWalletTransactions.run(id);
  deleteWallets.run(id);
  deleteOrderItems.run(id);
  deleteOrders.run(id);
  deleteCarts.run(id);
  deleteUser.run(id);

  res.json({
    status: 'success',
    message: 'User deleted successfully',
  });
});

// User profile update (for authenticated user updating their own profile)
export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { name, phone } = req.body;

  if (!userId) {
    throw new AppError('User not authenticated', 401);
  }

  if (!name || name.trim().length === 0) {
    throw new AppError('Name is required', 400);
  }

  // Update user profile
  const updateQuery = db.prepare(`
    UPDATE users 
    SET name = ?, phone = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  const result = updateQuery.run(name.trim(), phone || null, userId);

  if (result.changes === 0) {
    throw new AppError('User not found', 404);
  }

  // Get updated user
  const updatedUser = db.prepare(`
    SELECT id, email, role, name, phone, created_at as createdAt, updated_at as updatedAt
    FROM users 
    WHERE id = ?
  `).get(userId) as User;

  res.json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

// Change password (for authenticated user changing their own password)
export const changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { currentPassword, newPassword } = req.body;

  if (!userId) {
    throw new AppError('User not authenticated', 401);
  }

  if (!currentPassword || !newPassword) {
    throw new AppError('Current password and new password are required', 400);
  }

  if (newPassword.length < 6) {
    throw new AppError('New password must be at least 6 characters long', 400);
  }

  // Get current user with password hash
  const user = db.prepare(`
    SELECT id, password_hash as passwordHash
    FROM users 
    WHERE id = ?
  `).get(userId) as { id: string; passwordHash: string } | undefined;

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Verify current password
  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isCurrentPasswordValid) {
    throw new AppError('Current password is incorrect', 400);
  }

  // Hash new password
  const hashedNewPassword = await bcrypt.hash(newPassword, 10);

  // Update password
  const updateQuery = db.prepare(`
    UPDATE users 
    SET password_hash = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  const result = updateQuery.run(hashedNewPassword, userId);

  if (result.changes === 0) {
    throw new AppError('Failed to update password', 500);
  }

  res.json({
    status: 'success',
    message: 'Password updated successfully',
  });
});

// Admin user management
export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, email, phone, role } = req.body;

  // Check if user exists
  const existingUser = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
  if (!existingUser) {
    throw new AppError('User not found', 404);
  }

  // Check if email is already taken by another user
  if (email) {
    const emailCheck = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email, id);
    if (emailCheck) {
      throw new AppError('Email already taken by another user', 400);
    }
  }

  // Update user
  const updateQuery = db.prepare(`
    UPDATE users 
    SET name = COALESCE(?, name),
        email = COALESCE(?, email),
        phone = COALESCE(?, phone),
        role = COALESCE(?, role),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  updateQuery.run(name, email, phone, role, id);

  // Get updated user
  const updatedUser = db.prepare(`
    SELECT id, email, role, name, phone, created_at as createdAt, updated_at as updatedAt
    FROM users 
    WHERE id = ?
  `).get(id) as User;

  res.json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
}); 