import { Request, Response } from 'express';
import db from '../db/database';
import { generateId } from '../utils/utils';
import { AppError, asyncHandler } from '../utils/utils';
import { Product } from '../models/types';

export const getAllProducts = asyncHandler(async (_req: Request, res: Response) => {
  const products = db.prepare(`
    SELECT id, name, description, category, price, image_url as imageUrl, stock, created_at as createdAt, updated_at as updatedAt
    FROM products
    ORDER BY created_at DESC
  `).all() as Product[];

  res.json({
    status: 'success',
    data: { products },
  });
});

export const getProductById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const product = db.prepare(`
    SELECT id, name, description, category, price, image_url as imageUrl, stock, created_at as createdAt, updated_at as updatedAt
    FROM products
    WHERE id = ?
  `).get(id) as Product | undefined;

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  res.json({
    status: 'success',
    data: { product },
  });
});

export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const { name, description, category, price, imageUrl, stock } = req.body;

  if (!name || !description || !category || price === undefined || !imageUrl || stock === undefined) {
    throw new AppError('All fields are required', 400);
  }

  const productId = generateId();
  const insertProduct = db.prepare(`
    INSERT INTO products (id, name, description, category, price, image_url, stock)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertProduct.run(productId, name, description, category, price, imageUrl, stock);

  const product = db.prepare(`
    SELECT id, name, description, category, price, image_url as imageUrl, stock, created_at as createdAt, updated_at as updatedAt
    FROM products
    WHERE id = ?
  `).get(productId) as Product;

  res.status(201).json({
    status: 'success',
    data: { product },
  });
});

export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description, category, price, imageUrl, stock } = req.body;

  // Check if product exists
  const existingProduct = db.prepare('SELECT id FROM products WHERE id = ?').get(id);
  if (!existingProduct) {
    throw new AppError('Product not found', 404);
  }

  // Build update query dynamically
  const updates: string[] = [];
  const values: any[] = [];

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
    throw new AppError('No fields to update', 400);
  }

  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  const updateQuery = `UPDATE products SET ${updates.join(', ')} WHERE id = ?`;
  db.prepare(updateQuery).run(...values);

  const product = db.prepare(`
    SELECT id, name, description, category, price, image_url as imageUrl, stock, created_at as createdAt, updated_at as updatedAt
    FROM products
    WHERE id = ?
  `).get(id) as Product;

  res.json({
    status: 'success',
    data: { product },
  });
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = db.prepare('DELETE FROM products WHERE id = ?').run(id);

  if (result.changes === 0) {
    throw new AppError('Product not found', 404);
  }

  res.status(204).send();
});

export const getProductsByCategory = asyncHandler(async (req: Request, res: Response) => {
  const { category } = req.params;

  const products = db.prepare(`
    SELECT id, name, description, category, price, image_url as imageUrl, stock, created_at as createdAt, updated_at as updatedAt
    FROM products
    WHERE category = ?
    ORDER BY created_at DESC
  `).all(category) as Product[];

  res.json({
    status: 'success',
    data: { products },
  });
});

export const searchProducts = asyncHandler(async (req: Request, res: Response) => {
  const { q } = req.query;

  if (!q) {
    throw new AppError('Search query is required', 400);
  }

  const searchTerm = `%${q}%`;
  const products = db.prepare(`
    SELECT id, name, description, category, price, image_url as imageUrl, stock, created_at as createdAt, updated_at as updatedAt
    FROM products
    WHERE name LIKE ? OR description LIKE ? OR category LIKE ?
    ORDER BY created_at DESC
  `).all(searchTerm, searchTerm, searchTerm) as Product[];

  res.json({
    status: 'success',
    data: { products },
  });
}); 