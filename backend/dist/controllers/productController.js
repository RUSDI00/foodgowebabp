"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchProducts = exports.getProductsByCategory = exports.deleteProduct = exports.updateProduct = exports.createProduct = exports.getProductById = exports.getAllProducts = void 0;
const database_1 = __importDefault(require("../db/database"));
const utils_1 = require("../utils/utils");
const utils_2 = require("../utils/utils");
exports.getAllProducts = (0, utils_2.asyncHandler)(async (_req, res) => {
    const products = database_1.default.prepare(`
    SELECT id, name, description, category, price, image_url as imageUrl, stock, created_at as createdAt, updated_at as updatedAt
    FROM products
    ORDER BY created_at DESC
  `).all();
    res.json({
        status: 'success',
        data: { products },
    });
});
exports.getProductById = (0, utils_2.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const product = database_1.default.prepare(`
    SELECT id, name, description, category, price, image_url as imageUrl, stock, created_at as createdAt, updated_at as updatedAt
    FROM products
    WHERE id = ?
  `).get(id);
    if (!product) {
        throw new utils_2.AppError('Product not found', 404);
    }
    res.json({
        status: 'success',
        data: { product },
    });
});
exports.createProduct = (0, utils_2.asyncHandler)(async (req, res) => {
    const { name, description, category, price, imageUrl, stock } = req.body;
    if (!name || !description || !category || price === undefined || !imageUrl || stock === undefined) {
        throw new utils_2.AppError('All fields are required', 400);
    }
    const productId = (0, utils_1.generateId)();
    const insertProduct = database_1.default.prepare(`
    INSERT INTO products (id, name, description, category, price, image_url, stock)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
    insertProduct.run(productId, name, description, category, price, imageUrl, stock);
    const product = database_1.default.prepare(`
    SELECT id, name, description, category, price, image_url as imageUrl, stock, created_at as createdAt, updated_at as updatedAt
    FROM products
    WHERE id = ?
  `).get(productId);
    res.status(201).json({
        status: 'success',
        data: { product },
    });
});
exports.updateProduct = (0, utils_2.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const { name, description, category, price, imageUrl, stock } = req.body;
    // Check if product exists
    const existingProduct = database_1.default.prepare('SELECT id FROM products WHERE id = ?').get(id);
    if (!existingProduct) {
        throw new utils_2.AppError('Product not found', 404);
    }
    // Build update query dynamically
    const updates = [];
    const values = [];
    if (name !== undefined) {
        updates.push('name = ?');
        values.push(name);
    }
    if (description !== undefined) {
        updates.push('description = ?');
        values.push(description);
    }
    if (category !== undefined) {
        updates.push('category = ?');
        values.push(category);
    }
    if (price !== undefined) {
        updates.push('price = ?');
        values.push(price);
    }
    if (imageUrl !== undefined) {
        updates.push('image_url = ?');
        values.push(imageUrl);
    }
    if (stock !== undefined) {
        updates.push('stock = ?');
        values.push(stock);
    }
    if (updates.length === 0) {
        throw new utils_2.AppError('No fields to update', 400);
    }
    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    const updateQuery = `UPDATE products SET ${updates.join(', ')} WHERE id = ?`;
    database_1.default.prepare(updateQuery).run(...values);
    const product = database_1.default.prepare(`
    SELECT id, name, description, category, price, image_url as imageUrl, stock, created_at as createdAt, updated_at as updatedAt
    FROM products
    WHERE id = ?
  `).get(id);
    res.json({
        status: 'success',
        data: { product },
    });
});
exports.deleteProduct = (0, utils_2.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const result = database_1.default.prepare('DELETE FROM products WHERE id = ?').run(id);
    if (result.changes === 0) {
        throw new utils_2.AppError('Product not found', 404);
    }
    res.status(204).send();
});
exports.getProductsByCategory = (0, utils_2.asyncHandler)(async (req, res) => {
    const { category } = req.params;
    const products = database_1.default.prepare(`
    SELECT id, name, description, category, price, image_url as imageUrl, stock, created_at as createdAt, updated_at as updatedAt
    FROM products
    WHERE category = ?
    ORDER BY created_at DESC
  `).all(category);
    res.json({
        status: 'success',
        data: { products },
    });
});
exports.searchProducts = (0, utils_2.asyncHandler)(async (req, res) => {
    const { q } = req.query;
    if (!q) {
        throw new utils_2.AppError('Search query is required', 400);
    }
    const searchTerm = `%${q}%`;
    const products = database_1.default.prepare(`
    SELECT id, name, description, category, price, image_url as imageUrl, stock, created_at as createdAt, updated_at as updatedAt
    FROM products
    WHERE name LIKE ? OR description LIKE ? OR category LIKE ?
    ORDER BY created_at DESC
  `).all(searchTerm, searchTerm, searchTerm);
    res.json({
        status: 'success',
        data: { products },
    });
});
//# sourceMappingURL=productController.js.map