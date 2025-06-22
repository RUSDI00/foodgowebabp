"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteReview = exports.getProductAverageRating = exports.addProductReview = exports.getProductReviews = void 0;
const database_1 = __importDefault(require("../db/database"));
// Generate a simple ID
const generateId = () => Math.random().toString(36).substr(2, 9);
const getProductReviews = (req, res) => {
    try {
        const { productId } = req.params;
        const reviews = database_1.default.prepare(`
      SELECT * FROM reviews 
      WHERE product_id = ? 
      ORDER BY created_at DESC
    `).all(productId);
        // Convert SQLite format to expected format
        const formattedReviews = reviews.map((review) => ({
            id: review.id,
            userId: review.user_id,
            userName: review.user_name,
            productId: review.product_id,
            rating: review.rating,
            text: review.text,
            createdAt: review.created_at
        }));
        res.json({ data: { reviews: formattedReviews } });
    }
    catch (error) {
        console.error('Error fetching product reviews:', error);
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
};
exports.getProductReviews = getProductReviews;
const addProductReview = (req, res) => {
    try {
        const { productId } = req.params;
        const { rating, text } = req.body;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        if (!rating || !text || rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Valid rating (1-5) and review text are required' });
        }
        // Check if user already reviewed this product
        const existingReview = database_1.default.prepare(`
      SELECT id FROM reviews 
      WHERE user_id = ? AND product_id = ?
    `).get(userId, productId);
        if (existingReview) {
            return res.status(400).json({ error: 'You have already reviewed this product' });
        }
        // Get user name
        const user = database_1.default.prepare('SELECT name FROM users WHERE id = ?').get(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Insert new review
        const reviewId = generateId();
        const now = new Date().toISOString();
        database_1.default.prepare(`
      INSERT INTO reviews (id, user_id, user_name, product_id, rating, text, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(reviewId, userId, user.name, productId, rating, text, now);
        // Return the created review
        const newReview = {
            id: reviewId,
            userId,
            userName: user.name,
            productId,
            rating,
            text,
            createdAt: now
        };
        return res.status(201).json({ data: { review: newReview } });
    }
    catch (error) {
        console.error('Error adding product review:', error);
        return res.status(500).json({ error: 'Failed to add review' });
    }
};
exports.addProductReview = addProductReview;
const getProductAverageRating = (req, res) => {
    try {
        const { productId } = req.params;
        const result = database_1.default.prepare(`
      SELECT AVG(rating) as average_rating, COUNT(*) as total_reviews
      FROM reviews 
      WHERE product_id = ?
    `).get(productId);
        const averageRating = result?.average_rating ? parseFloat(result.average_rating.toFixed(1)) : 0;
        const totalReviews = result?.total_reviews || 0;
        res.json({
            data: {
                averageRating,
                totalReviews
            }
        });
    }
    catch (error) {
        console.error('Error calculating average rating:', error);
        res.status(500).json({ error: 'Failed to calculate average rating' });
    }
};
exports.getProductAverageRating = getProductAverageRating;
const deleteReview = (req, res) => {
    try {
        const { reviewId } = req.params;
        const userId = req.user?.id;
        const userRole = req.user?.role;
        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        // Check if review exists and belongs to user (or user is admin)
        const review = database_1.default.prepare('SELECT user_id FROM reviews WHERE id = ?').get(reviewId);
        if (!review) {
            return res.status(404).json({ error: 'Review not found' });
        }
        if (review.user_id !== userId && userRole !== 'admin') {
            return res.status(403).json({ error: 'You can only delete your own reviews' });
        }
        // Delete the review
        database_1.default.prepare('DELETE FROM reviews WHERE id = ?').run(reviewId);
        return res.json({ message: 'Review deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting review:', error);
        return res.status(500).json({ error: 'Failed to delete review' });
    }
};
exports.deleteReview = deleteReview;
//# sourceMappingURL=reviewController.js.map