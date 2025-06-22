import { Product, Review } from '../types';
import { apiClient } from './api';
import { getData, addItem } from './db';

export const getAllProducts = async (): Promise<Product[]> => {
  try {
    return await apiClient.getProducts();
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return [];
  }
};

export const getProductById = async (productId: string): Promise<Product | undefined> => {
  try {
    return await apiClient.getProductById(productId);
  } catch (error) {
    console.error('Failed to fetch product:', error);
    return undefined;
  }
};

export const addProduct = async (productData: Omit<Product, 'id' | 'createdAt'>): Promise<Product | null> => {
  try {
    return await apiClient.createProduct(productData);
  } catch (error) {
    console.error('Failed to add product:', error);
    alert(error instanceof Error ? error.message : 'Failed to add product');
    return null;
  }
};

export const updateProduct = async (updatedProductData: Product): Promise<Product | null> => {
  try {
    return await apiClient.updateProduct(updatedProductData.id, updatedProductData);
  } catch (error) {
    console.error('Failed to update product:', error);
    alert(error instanceof Error ? error.message : 'Failed to update product');
    return null;
  }
};

export const deleteProduct = async (productId: string): Promise<boolean> => {
  try {
    await apiClient.deleteProduct(productId);
    return true;
  } catch (error) {
    console.error('Failed to delete product:', error);
    alert(error instanceof Error ? error.message : 'Failed to delete product');
    return false;
  }
};

export const searchProducts = async (searchTerm: string, category?: string): Promise<Product[]> => {
  try {
    if (searchTerm) {
      return await apiClient.searchProducts(searchTerm);
    } else if (category && category !== 'Semua') {
      return await apiClient.getProductsByCategory(category);
    } else {
      return await apiClient.getProducts();
    }
  } catch (error) {
    console.error('Failed to search products:', error);
    return [];
  }
};

// Review functions using localStorage database
export const getProductReviews = (productId: string): Review[] => {
  try {
    const allReviews = getData('reviews');
    return allReviews.filter((review: Review) => review.productId === productId);
  } catch (error) {
    console.error('Failed to get reviews:', error);
    return [];
  }
};

export const addProductReview = async (productId: string, userId: string, userName: string, rating: number, text: string): Promise<Review | null> => {
  try {
    const newReview: Omit<Review, 'id' | 'createdAt'> = {
      userId,
      userName,
      productId,
      rating,
      text
    };
    
    const savedReview = addItem('reviews', newReview);
    return savedReview;
  } catch (error) {
    console.error('Failed to add review:', error);
    throw error; // Re-throw to trigger catch in component
  }
};

export const getProductAverageRating = (productId: string): number => {
  const reviews = getProductReviews(productId);
  if (reviews.length === 0) return 0;
  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  return parseFloat((totalRating / reviews.length).toFixed(1));
};

export const getCategories = async (): Promise<string[]> => {
  try {
    const products = await getAllProducts();
    const categories = new Set(products.map(p => p.category));
    return ['Semua', ...Array.from(categories)];
  } catch (error) {
    console.error('Failed to get categories:', error);
    return ['Semua'];
  }
}
