"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const walletController_1 = require("../controllers/walletController");
const router = (0, express_1.Router)();
// All wallet routes require authentication
router.use(auth_1.authenticate);
// GET /api/wallet - Get user wallet
router.get('/', walletController_1.getWallet);
// POST /api/wallet/topup - Top up wallet
router.post('/topup', walletController_1.topUpWallet);
// GET /api/wallet/transactions - Get wallet transactions
router.get('/transactions', walletController_1.getWalletTransactions);
exports.default = router;
//# sourceMappingURL=walletRoutes.js.map