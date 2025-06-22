"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const reviewController_1 = require("../controllers/reviewController");
const router = express_1.default.Router();
// Get all reviews for a product (public)
router.get('/product/:productId', reviewController_1.getProductReviews);
// Get average rating for a product (public)
router.get('/product/:productId/rating', reviewController_1.getProductAverageRating);
// Add a review for a product (authenticated users only)
router.post('/product/:productId', auth_1.authenticate, reviewController_1.addProductReview);
// Delete a review (authenticated users - own reviews or admin)
router.delete('/:reviewId', auth_1.authenticate, reviewController_1.deleteReview);
exports.default = router;
//# sourceMappingURL=reviewRoutes.js.map