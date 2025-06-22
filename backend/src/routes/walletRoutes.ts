import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getWallet, topUpWallet, getWalletTransactions } from '../controllers/walletController';

const router = Router();

// All wallet routes require authentication
router.use(authenticate);

// GET /api/wallet - Get user wallet
router.get('/', getWallet);

// POST /api/wallet/topup - Top up wallet
router.post('/topup', topUpWallet);

// GET /api/wallet/transactions - Get wallet transactions
router.get('/transactions', getWalletTransactions);

export default router; 