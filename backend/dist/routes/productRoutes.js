"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const productController_1 = require("../controllers/productController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Public routes
router.get('/', productController_1.getAllProducts);
router.get('/search', productController_1.searchProducts);
router.get('/category/:category', productController_1.getProductsByCategory);
router.get('/:id', productController_1.getProductById);
// Protected routes (admin only)
router.post('/', auth_1.authenticate, (0, auth_1.authorize)('admin'), productController_1.createProduct);
router.put('/:id', auth_1.authenticate, (0, auth_1.authorize)('admin'), productController_1.updateProduct);
router.delete('/:id', auth_1.authenticate, (0, auth_1.authorize)('admin'), productController_1.deleteProduct);
exports.default = router;
//# sourceMappingURL=productRoutes.js.map