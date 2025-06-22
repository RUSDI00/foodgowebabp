"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Profile endpoints for authenticated users
router.use(auth_1.authenticate);
// User profile management (for logged-in users)
router.put('/profile', userController_1.updateProfile);
router.put('/change-password', userController_1.changePassword);
// Admin-only endpoints
router.use((0, auth_1.authorize)('admin'));
// GET /api/users - Get all users
router.get('/', userController_1.getAllUsers);
// GET /api/users/:id - Get user by ID
router.get('/:id', userController_1.getUserById);
// PUT /api/users/:id - Update user
router.put('/:id', userController_1.updateUser);
// DELETE /api/users/:id - Delete user
router.delete('/:id', userController_1.deleteUser);
exports.default = router;
//# sourceMappingURL=userRoutes.js.map