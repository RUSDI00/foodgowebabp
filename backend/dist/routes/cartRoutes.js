"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cartController_1 = require("../controllers/cartController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// All cart routes require authentication
router.use(auth_1.authenticate);
router.get('/', cartController_1.getCart);
router.post('/add', cartController_1.addToCart);
router.put('/item/:productId', cartController_1.updateCartItem);
router.delete('/item/:productId', cartController_1.removeFromCart);
router.delete('/clear', cartController_1.clearCart);
exports.default = router;
//# sourceMappingURL=cartRoutes.js.map