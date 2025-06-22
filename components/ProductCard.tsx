import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Product } from '../types';
import StarRatingDisplay from './StarRatingDisplay';
import { getProductAverageRating } from '../services/productService';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../services/api';
import { useSnackbar } from '../hooks/useSnackbar';
import Snackbar from './Snackbar';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const averageRating = getProductAverageRating(product.id);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const { snackbar, showError, hideSnackbar } = useSnackbar();

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      showError('Silakan masuk untuk menambahkan produk ke keranjang.');
      setTimeout(() => navigate('/signin'), 1500);
      return;
    }

    if (product.stock === 0) {
      showError('Maaf, produk ini sedang habis.');
      return;
    }

    setIsAddingToCart(true);
    try {
      await apiClient.addToCart(product.id, 1);

      // Dispatch custom event to notify Navbar to update cart count
      window.dispatchEvent(new CustomEvent('cartUpdated'));
    } catch (error) {
      console.error('Failed to add to cart:', error);
      showError(error instanceof Error ? error.message : 'Gagal menambahkan ke keranjang. Silakan coba lagi.');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleBuyNow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      showError('Silakan masuk untuk melakukan pembelian.');
      setTimeout(() => navigate('/signin'), 1500);
      return;
    }

    if (product.stock === 0) {
      showError('Maaf, produk ini sedang habis.');
      return;
    }

    try {
      // Add to cart first
      await apiClient.addToCart(product.id, 1);

      // Dispatch custom event to notify Navbar to update cart count
      window.dispatchEvent(new CustomEvent('cartUpdated'));

      // Then navigate to checkout
      navigate('/checkout');
    } catch (error) {
      console.error('Failed to add to cart:', error);
      showError(error instanceof Error ? error.message : 'Gagal menambahkan ke keranjang. Silakan coba lagi.');
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-300 hover:shadow-2xl flex flex-col">
        {/* Clickable product area for details */}
        <Link
          to={`/product/${product.id}`}
          className="block cursor-pointer hover:bg-gray-50 transition-colors"
        >
          {/* Product Image */}
          <div className="relative">
            <img
              src={product.imageUrl || `https://picsum.photos/seed/${product.id}/400/300`}
              alt={product.name}
              className="w-full h-48 object-cover"
            />
            {product.stock === 0 && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <span className="text-white font-semibold text-lg">Stok Habis</span>
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-1 truncate hover:text-primary-600">
              {product.name}
            </h3>
            <p className="text-xs text-gray-500 mb-2">{product.category}</p>
            <div className="flex items-center mb-2">
              {averageRating > 0 && <StarRatingDisplay rating={averageRating} />}
              <span className="ml-2 text-sm text-gray-600">
                {averageRating > 0 ? `${averageRating}/5` : 'Belum ada rating'}
              </span>
            </div>
            <p className="text-primary-600 font-bold text-xl mb-2">
              Rp {product.price.toLocaleString()}
            </p>
            <p className={`text-sm mb-3 ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {product.stock > 0 ? `Stok: ${product.stock}` : 'Stok Habis'}
            </p>
          </div>
        </Link>

        {/* Action buttons - outside the Link to prevent event conflicts */}
        <div className="px-4 pb-4 mt-auto">
          <div className="flex gap-2">
            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0 || isAddingToCart}
              className={`flex-1 flex items-center justify-center px-3 py-2 rounded-md font-medium transition-colors duration-200 
                         ${product.stock > 0
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                } ${isAddingToCart ? 'opacity-70' : ''}`}
              title="Tambah ke Keranjang"
            >
              <i className="fas fa-shopping-cart text-lg"></i>
            </button>

            {/* Buy Now Button */}
            <button
              onClick={handleBuyNow}
              disabled={product.stock === 0}
              className={`flex-2 px-4 py-2 rounded-md font-medium transition-colors duration-200 text-center
                         ${product.stock > 0
                  ? 'bg-primary-500 text-white hover:bg-primary-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              style={{ flex: '2' }}
            >
              {product.stock > 0 ? 'Beli Sekarang' : 'Stok Habis'}
            </button>
          </div>
        </div>
      </div>

      {/* Snackbar */}
      <Snackbar
        message={snackbar.message}
        type={snackbar.type}
        isVisible={snackbar.isVisible}
        onClose={hideSnackbar}
      />
    </>
  );
};

export default ProductCard;
