import { Router } from 'express';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsByCategory,
  searchProducts
} from '../controllers/productController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/', getAllProducts);
router.get('/search', searchProducts);
router.get('/category/:category', getProductsByCategory);
router.get('/:id', getProductById);

// Protected routes (admin only)
router.post('/', authenticate as any, authorize('admin') as any, createProduct);
router.put('/:id', authenticate as any, authorize('admin') as any, updateProduct);
router.delete('/:id', authenticate as any, authorize('admin') as any, deleteProduct);

export default router; 