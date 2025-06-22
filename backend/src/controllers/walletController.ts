import { Response } from 'express';
import db from '../db/database';
import { AuthRequest } from '../middleware/auth';
import { AppError, asyncHandler, generateId } from '../utils/utils';

// Get user wallet
export const getWallet = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    throw new AppError('User not authenticated', 401);
  }

  const wallet = db.prepare('SELECT user_id as userId, balance FROM wallets WHERE user_id = ?').get(userId) as {
    userId: string;
    balance: number;
  } | undefined;

  if (!wallet) {
    // Create wallet if doesn't exist
    db.prepare('INSERT INTO wallets (user_id, balance) VALUES (?, ?)').run(userId, 0);
    res.json({
      status: 'success',
      data: {
        wallet: { userId, balance: 0 }
      }
    });
  } else {
    res.json({
      status: 'success',
      data: {
        wallet
      }
    });
  }
});

// Top up wallet
export const topUpWallet = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;
  const { amount, method } = req.body;

  if (!userId) {
    throw new AppError('User not authenticated', 401);
  }

  if (!amount || amount <= 0) {
    throw new AppError('Invalid top-up amount', 400);
  }

  if (!method) {
    throw new AppError('Payment method is required', 400);
  }

  // Update wallet balance
  const updateResult = db.prepare('UPDATE wallets SET balance = balance + ? WHERE user_id = ?').run(amount, userId);
  
  if (updateResult.changes === 0) {
    // Create wallet if doesn't exist
    db.prepare('INSERT INTO wallets (user_id, balance) VALUES (?, ?)').run(userId, amount);
  }

  // Add transaction record
  const transactionId = generateId();
  db.prepare(`
    INSERT INTO wallet_transactions (id, user_id, type, amount, description)
    VALUES (?, ?, ?, ?, ?)
  `).run(transactionId, userId, 'TOPUP', amount, `Top-up saldo via ${method}`);

  // Get updated wallet
  const wallet = db.prepare('SELECT user_id as userId, balance FROM wallets WHERE user_id = ?').get(userId) as {
    userId: string;
    balance: number;
  };

  res.json({
    status: 'success',
    data: {
      wallet,
      message: `Successfully topped up Rp ${amount.toLocaleString()}`
    }
  });
});

// Get wallet transactions
export const getWalletTransactions = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    throw new AppError('User not authenticated', 401);
  }

  const transactions = db.prepare(`
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