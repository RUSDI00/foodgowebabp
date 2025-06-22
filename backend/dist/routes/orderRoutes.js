"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const orderController_1 = require("../controllers/orderController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// All order routes require authentication
router.use(auth_1.authenticate);
// User routes
router.post('/', orderController_1.createOrder);
router.get('/my-orders', orderController_1.getUserOrders);
router.put('/:orderId/cancel', orderController_1.cancelUserOrder);
// Admin routes
router.get('/', (0, auth_1.authorize)('admin'), orderController_1.getAllOrders);
router.put('/:orderId/status', (0, auth_1.authorize)('admin'), orderController_1.updateOrderStatus);
exports.default = router;
//# sourceMappingURL=orderRoutes.js.map