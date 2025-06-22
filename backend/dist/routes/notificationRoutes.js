"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const notificationController_1 = require("../controllers/notificationController");
const router = express_1.default.Router();
// Get user notifications (authenticated users only)
router.get('/', auth_1.authenticate, notificationController_1.getUserNotifications);
// Mark a notification as read (authenticated users only)
router.put('/:notificationId/read', auth_1.authenticate, notificationController_1.markNotificationAsRead);
// Mark all notifications as read (authenticated users only)
router.put('/read-all', auth_1.authenticate, notificationController_1.markAllNotificationsAsRead);
// Delete a notification (authenticated users only)
router.delete('/:notificationId', auth_1.authenticate, notificationController_1.deleteNotification);
exports.default = router;
//# sourceMappingURL=notificationRoutes.js.map