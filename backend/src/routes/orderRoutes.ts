import { Router } from 'express';
import { createOrder, getUserOrders, getAllOrders, updateOrderStatus, cancelUserOrder } from '../controllers/orderController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All order routes require authentication
router.use(authenticate);

// User routes
router.post('/', createOrder);
router.get('/my-orders', getUserOrders);
router.put('/:orderId/cancel', cancelUserOrder);

// Admin routes
router.get('/', authorize('admin'), getAllOrders);
router.put('/:orderId/status', authorize('admin'), updateOrderStatus);

export default router; 