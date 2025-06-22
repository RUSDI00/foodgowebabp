"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUser = exports.changePassword = exports.updateProfile = exports.deleteUser = exports.getUserById = exports.getAllUsers = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const database_1 = __importDefault(require("../db/database"));
const utils_1 = require("../utils/utils");
exports.getAllUsers = (0, utils_1.asyncHandler)(async (_req, res) => {
    const users = database_1.default.prepare(`
    SELECT id, email, role, name, phone, created_at as createdAt, updated_at as updatedAt
    FROM users 
    ORDER BY created_at DESC
  `).all();
    res.json({
        status: 'success',
        data: {
            users,
        },
    });
});
exports.getUserById = (0, utils_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const user = database_1.default.prepare(`
    SELECT id, email, role, name, phone, created_at as createdAt, updated_at as updatedAt
    FROM users 
    WHERE id = ?
  `).get(id);
    if (!user) {
        throw new utils_1.AppError('User not found', 404);
    }
    res.json({
        status: 'success',
        data: {
            user,
        },
    });
});
exports.deleteUser = (0, utils_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    // Check if user exists
    const user = database_1.default.prepare('SELECT id, role FROM users WHERE id = ?').get(id);
    if (!user) {
        throw new utils_1.AppError('User not found', 404);
    }
    // Prevent deleting admin users
    if (user.role === 'admin') {
        throw new utils_1.AppError('Cannot delete admin user', 403);
    }
    // Delete related data first (due to foreign key constraints)
    const deleteNotifications = database_1.default.prepare('DELETE FROM notifications WHERE user_id = ?');
    const deleteReviews = database_1.default.prepare('DELETE FROM reviews WHERE user_id = ?');
    const deleteWalletTransactions = database_1.default.prepare('DELETE FROM wallet_transactions WHERE user_id = ?');
    const deleteWallets = database_1.default.prepare('DELETE FROM wallets WHERE user_id = ?');
    const deleteOrderItems = database_1.default.prepare(`
    DELETE FROM order_items 
    WHERE order_id IN (SELECT id FROM orders WHERE user_id = ?)
  `);
    const deleteOrders = database_1.default.prepare('DELETE FROM orders WHERE user_id = ?');
    const deleteCarts = database_1.default.prepare('DELETE FROM carts WHERE user_id = ?');
    const deleteUser = database_1.default.prepare('DELETE FROM users WHERE id = ?');
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
exports.updateProfile = (0, utils_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    const { name, phone } = req.body;
    if (!userId) {
        throw new utils_1.AppError('User not authenticated', 401);
    }
    if (!name || name.trim().length === 0) {
        throw new utils_1.AppError('Name is required', 400);
    }
    // Update user profile
    const updateQuery = database_1.default.prepare(`
    UPDATE users 
    SET name = ?, phone = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
    const result = updateQuery.run(name.trim(), phone || null, userId);
    if (result.changes === 0) {
        throw new utils_1.AppError('User not found', 404);
    }
    // Get updated user
    const updatedUser = database_1.default.prepare(`
    SELECT id, email, role, name, phone, created_at as createdAt, updated_at as updatedAt
    FROM users 
    WHERE id = ?
  `).get(userId);
    res.json({
        status: 'success',
        data: {
            user: updatedUser,
        },
    });
});
// Change password (for authenticated user changing their own password)
exports.changePassword = (0, utils_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    const { currentPassword, newPassword } = req.body;
    if (!userId) {
        throw new utils_1.AppError('User not authenticated', 401);
    }
    if (!currentPassword || !newPassword) {
        throw new utils_1.AppError('Current password and new password are required', 400);
    }
    if (newPassword.length < 6) {
        throw new utils_1.AppError('New password must be at least 6 characters long', 400);
    }
    // Get current user with password hash
    const user = database_1.default.prepare(`
    SELECT id, password_hash as passwordHash
    FROM users 
    WHERE id = ?
  `).get(userId);
    if (!user) {
        throw new utils_1.AppError('User not found', 404);
    }
    // Verify current password
    const isCurrentPasswordValid = await bcryptjs_1.default.compare(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
        throw new utils_1.AppError('Current password is incorrect', 400);
    }
    // Hash new password
    const hashedNewPassword = await bcryptjs_1.default.hash(newPassword, 10);
    // Update password
    const updateQuery = database_1.default.prepare(`
    UPDATE users 
    SET password_hash = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
    const result = updateQuery.run(hashedNewPassword, userId);
    if (result.changes === 0) {
        throw new utils_1.AppError('Failed to update password', 500);
    }
    res.json({
        status: 'success',
        message: 'Password updated successfully',
    });
});
// Admin user management
exports.updateUser = (0, utils_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { name, email, phone, role } = req.body;
    // Check if user exists
    const existingUser = database_1.default.prepare('SELECT id FROM users WHERE id = ?').get(id);
    if (!existingUser) {
        throw new utils_1.AppError('User not found', 404);
    }
    // Check if email is already taken by another user
    if (email) {
        const emailCheck = database_1.default.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email, id);
        if (emailCheck) {
            throw new utils_1.AppError('Email already taken by another user', 400);
        }
    }
    // Update user
    const updateQuery = database_1.default.prepare(`
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
    const updatedUser = database_1.default.prepare(`
    SELECT id, email, role, name, phone, created_at as createdAt, updated_at as updatedAt
    FROM users 
    WHERE id = ?
  `).get(id);
    res.json({
        status: 'success',
        data: {
            user: updatedUser,
        },
    });
});
//# sourceMappingURL=userController.js.map