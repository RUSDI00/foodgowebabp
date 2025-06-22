"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWalletTransactions = exports.topUpWallet = exports.getWallet = void 0;
const database_1 = __importDefault(require("../db/database"));
const utils_1 = require("../utils/utils");
// Get user wallet
exports.getWallet = (0, utils_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new utils_1.AppError('User not authenticated', 401);
    }
    const wallet = database_1.default.prepare('SELECT user_id as userId, balance FROM wallets WHERE user_id = ?').get(userId);
    if (!wallet) {
        // Create wallet if doesn't exist
        database_1.default.prepare('INSERT INTO wallets (user_id, balance) VALUES (?, ?)').run(userId, 0);
        res.json({
            status: 'success',
            data: {
                wallet: { userId, balance: 0 }
            }
        });
    }
    else {
        res.json({
            status: 'success',
            data: {
                wallet
            }
        });
    }
});
// Top up wallet
exports.topUpWallet = (0, utils_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    const { amount, method } = req.body;
    if (!userId) {
        throw new utils_1.AppError('User not authenticated', 401);
    }
    if (!amount || amount <= 0) {
        throw new utils_1.AppError('Invalid top-up amount', 400);
    }
    if (!method) {
        throw new utils_1.AppError('Payment method is required', 400);
    }
    // Update wallet balance
    const updateResult = database_1.default.prepare('UPDATE wallets SET balance = balance + ? WHERE user_id = ?').run(amount, userId);
    if (updateResult.changes === 0) {
        // Create wallet if doesn't exist
        database_1.default.prepare('INSERT INTO wallets (user_id, balance) VALUES (?, ?)').run(userId, amount);
    }
    // Add transaction record
    const transactionId = (0, utils_1.generateId)();
    database_1.default.prepare(`
    INSERT INTO wallet_transactions (id, user_id, type, amount, description)
    VALUES (?, ?, ?, ?, ?)
  `).run(transactionId, userId, 'TOPUP', amount, `Top-up saldo via ${method}`);
    // Get updated wallet
    const wallet = database_1.default.prepare('SELECT user_id as userId, balance FROM wallets WHERE user_id = ?').get(userId);
    res.json({
        status: 'success',
        data: {
            wallet,
            message: `Successfully topped up Rp ${amount.toLocaleString()}`
        }
    });
});
// Get wallet transactions
exports.getWalletTransactions = (0, utils_1.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new utils_1.AppError('User not authenticated', 401);
    }
    const transactions = database_1.default.prepare(`
    SELECT id, user_id as userId, type, amount, description, related_order_id as relatedOrderId, created_at as createdAt
    FROM wallet_transactions 
    WHERE user_id = ?
    ORDER BY created_at DESC
  `).all(userId);
    res.json({
        status: 'success',
        data: {
            transactions
        }
    });
});
//# sourceMappingURL=walletController.js.map