"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentUser = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = __importDefault(require("../db/database"));
const config_1 = require("../config");
const utils_1 = require("../utils/utils");
const utils_2 = require("../utils/utils");
const generateToken = (user) => {
    const payload = {
        id: user.id,
        email: user.email,
        role: user.role,
    };
    return jsonwebtoken_1.default.sign(payload, config_1.config.jwtSecret);
};
exports.register = (0, utils_2.asyncHandler)(async (req, res) => {
    const { email, password, name, phone } = req.body;
    // Check if user already exists
    const existingUser = database_1.default.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
        throw new utils_2.AppError('User with this email already exists', 400);
    }
    // Hash password
    const passwordHash = await bcryptjs_1.default.hash(password, config_1.config.bcryptRounds);
    // Create user
    const userId = (0, utils_1.generateId)();
    const insertUser = database_1.default.prepare(`
    INSERT INTO users (id, email, password_hash, role, name, phone)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
    insertUser.run(userId, email, passwordHash, 'user', name, phone || null);
    // Create wallet for user
    const insertWallet = database_1.default.prepare(`
    INSERT INTO wallets (user_id, balance)
    VALUES (?, ?)
  `);
    insertWallet.run(userId, 0);
    // Get created user
    const user = database_1.default.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    // Generate token
    const token = generateToken(user);
    res.status(201).json({
        status: 'success',
        data: {
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                phone: user.phone,
            },
        },
    });
});
exports.login = (0, utils_2.asyncHandler)(async (req, res) => {
    const { email, password } = req.body;
    // Get user
    const user = database_1.default.prepare(`
    SELECT id, email, password_hash as passwordHash, role, name, phone 
    FROM users 
    WHERE email = ?
  `).get(email);
    if (!user) {
        throw new utils_2.AppError('Invalid credentials', 401);
    }
    // Check password
    const isPasswordValid = await bcryptjs_1.default.compare(password, user.passwordHash);
    if (!isPasswordValid) {
        throw new utils_2.AppError('Invalid credentials', 401);
    }
    // Generate token
    const token = generateToken(user);
    res.json({
        status: 'success',
        data: {
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                phone: user.phone,
            },
        },
    });
});
exports.getCurrentUser = (0, utils_2.asyncHandler)(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        throw new utils_2.AppError('User not authenticated', 401);
    }
    const user = database_1.default.prepare(`
    SELECT id, email, role, name, phone, created_at, updated_at
    FROM users 
    WHERE id = ?
  `).get(userId);
    if (!user) {
        throw new utils_2.AppError('User not found', 404);
    }
    res.json({
        status: 'success',
        data: {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                phone: user.phone,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            },
        },
    });
});
//# sourceMappingURL=authController.js.map