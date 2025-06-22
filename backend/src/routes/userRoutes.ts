import { Router } from 'express';
import { getAllUsers, getUserById, updateUser, deleteUser, updateProfile, changePassword } from '../controllers/userController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Profile endpoints for authenticated users
router.use(authenticate);

// User profile management (for logged-in users)
router.put('/profile', updateProfile);
router.put('/change-password', changePassword);

// Admin-only endpoints
router.use(authorize('admin'));

// GET /api/users - Get all users
router.get('/', getAllUsers);

// GET /api/users/:id - Get user by ID
router.get('/:id', getUserById);

// PUT /api/users/:id - Update user
router.put('/:id', updateUser);

// DELETE /api/users/:id - Delete user
router.delete('/:id', deleteUser);

export default router; 