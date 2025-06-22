import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db/database';
import { config } from '../config';
import { generateId } from '../utils/utils';
import { AppError, asyncHandler } from '../utils/utils';
import { LoginRequest, RegisterRequest, User } from '../models/types';

const generateToken = (user: Partial<User>): string => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };
  
  return jwt.sign(payload, config.jwtSecret);
};

export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, name, phone } = req.body as RegisterRequest;

  // Check if user already exists
  const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existingUser) {
    throw new AppError('User with this email already exists', 400);
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, config.bcryptRounds);

  // Create user
  const userId = generateId();
  const insertUser = db.prepare(`
    INSERT INTO users (id, email, password_hash, role, name, phone)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertUser.run(userId, email, passwordHash, 'user', name, phone || null);

  // Create wallet for user
  const insertWallet = db.prepare(`
    INSERT INTO wallets (user_id, balance)
    VALUES (?, ?)
  `);
  insertWallet.run(userId, 0);

  // Get created user
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as User;

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

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as LoginRequest;

  // Get user
  const user = db.prepare(`
    SELECT id, email, password_hash as passwordHash, role, name, phone 
    FROM users 
    WHERE email = ?
  `).get(email) as User | undefined;

  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  // Check password
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new AppError('Invalid credentials', 401);
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

export const getCurrentUser = asyncHandler(async (req: Request & { user?: any }, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new AppError('User not authenticated', 401);
  }

  const user = db.prepare(`
    SELECT id, email, role, name, phone, created_at, updated_at
    FROM users 
    WHERE id = ?
  `).get(userId) as User | undefined;

  if (!user) {
    throw new AppError('User not found', 404);
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