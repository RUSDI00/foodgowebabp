import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { CartItem, Product } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import * as productService from '../../services/productService';
import { apiClient } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useSnackbar } from '../../hooks/useSnackbar';
import Snackbar from '../../components/Snackbar';

const CartPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { snackbar, showError, hideSnackbar } = useSnackbar();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<{ [key: string]: Product }>({});
  const [loading, setLoading] = useState(true);

  const fetchCartItems = useCallback(async () => {
    if (user) {
      setLoading(true);
      try {
        const items = await apiClient.getCart();
        setCartItems(items);

        // Fetch product details for stock validation
        const productMap: { [key: string]: Product } = {};
        for (const item of items) {
          try {
            const product = await productService.getProductById(item.productId);
            if (product) {
              productMap[item.productId] = product;
            }
          } catch (error) {
            console.error(`Failed to fetch product ${item.productId}:`, error);
          }
        }
        setProducts(productMap);
      } catch (error) {
        console.error('Failed to fetch cart:', error);
        setCartItems([]);
      } finally {
        setLoading(false);
      }
    } else {
      setCartItems([]);
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      navigate('/signin');
      return;
    }
    fetchCartItems();
  }, [user, navigate, fetchCartItems]);

  const handleQuantityChange = async (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      await handleRemoveItem(productId);
      return;
    }

    const itemToUpdate = cartItems.find(item => item.productId === productId);
    if (!itemToUpdate) return;

    // Optimistic update
    setCartItems(prev => prev.map(item =>
      item.productId === productId
        ? { ...item, quantity: newQuantity }
        : item
    ));

    try {
      await apiClient.updateCartItem(productId, newQuantity);
    } catch (error) {
      console.error('Failed to update cart:', error);
      showError('Gagal mengupdate keranjang. Silakan coba lagi.');
      // Revert optimistic update
      fetchCartItems();
    }
  };

  const handleRemoveItem = async (productId: string) => {
    // Optimistic update
    setCartItems(prev => prev.filter(item => item.productId !== productId));

    try {
      await apiClient.removeFromCart(productId);
    } catch (error) {
      console.error('Failed to remove item:', error);
      showError('Gagal menghapus item. Silakan coba lagi.');
      // Revert optimistic update
      fetchCartItems();
    }
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (loading) {
    return <LoadingSpinner text="Memuat keranjang..." />;
  }

  if (!user) {
    return (
      <div className="text-center py-20 bg-white shadow-lg rounded-lg p-8">
        <i className="fas fa-shopping-cart text-6xl text-gray-300 mb-6"></i>
        <h2 className="text-2xl font-semibold text-gray-700 mb-3">Keranjang Belanja Anda Kosong</h2>
        <p className="text-gray-500 mb-6">Silakan masuk untuk melihat item di keranjang Anda.</p>
        <Link
          to="/signin"
          state={{ from: location }}
          className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          Masuk Sekarang
        </Link>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="text-center py-20 bg-white shadow-lg rounded-lg p-8">
        <i className="fas fa-cart-arrow-down text-6xl text-gray-300 mb-6"></i>
        <h2 className="text-2xl font-semibold text-gray-700 mb-3">Keranjang Belanja Anda Kosong</h2>
        <p className="text-gray-500 mb-6">Sepertinya Anda belum menambahkan produk apapun ke keranjang.</p>
        <Link to="/" className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
          Mulai Belanja
        </Link>
      </div>
    );
  }

  const hasStockIssues = cartItems.some(item => {
    const product = products[item.productId];
    return !product || item.quantity > product.stock || product.stock === 0;
  });

  return (
    <>
      <div className="bg-white shadow-xl rounded-lg p-6 md:p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Keranjang Belanja Anda</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items List */}
          <div className="lg:col-span-2 space-y-6">
            {cartItems.map(item => {
              const product = products[item.productId];
              const productStock = product?.stock ?? 0;
              return (
                <div key={item.productId} className="flex flex-col sm:flex-row items-center p-4 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                  <img src={item.imageUrl} alt={item.name} className="w-24 h-24 object-cover rounded-md mb-4 sm:mb-0 sm:mr-6" />
                  <div className="flex-grow text-center sm:text-left">
                    <Link to={`/product/${item.productId}`} className="text-lg font-semibold text-primary-600 hover:underline">{item.name}</Link>
                    <p className="text-gray-600">Rp {item.price.toLocaleString()}</p>
                    {item.quantity > productStock && productStock > 0 && <p className="text-xs text-red-500 mt-1">Stok hanya tersisa {productStock}, harap kurangi jumlah.</p>}
                    {productStock === 0 && <p className="text-xs text-red-500 mt-1">Stok produk ini habis.</p>}
                  </div>
                  <div className="flex items-center space-x-3 mt-4 sm:mt-0 sm:ml-auto">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleQuantityChange(item.productId, parseInt(e.target.value))}
                      min="0"
                      max={productStock}
                      className="w-16 px-2 py-1 border border-gray-300 rounded-md text-center focus:ring-primary-500 focus:border-primary-500"
                      disabled={productStock === 0}
                    />
                    <p className="w-28 text-right font-medium text-gray-800">Rp {(item.price * item.quantity).toLocaleString()}</p>
                    <button onClick={() => handleRemoveItem(item.productId)} className="text-red-500 hover:text-red-700 transition-colors" title="Hapus item">
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-gray-50 p-6 rounded-lg shadow-md sticky top-24">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Ringkasan Pesanan</h2>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium text-gray-800">Rp {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xl font-bold pt-3 border-t border-gray-200">
                  <span>Total</span>
                  <span>Rp {subtotal.toLocaleString()}</span>
                </div>
              </div>
              <button
                onClick={() => navigate('/checkout')}
                disabled={subtotal === 0 || hasStockIssues}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-lg transition-colors duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Lanjut ke Checkout
              </button>
              {hasStockIssues &&
                <p className="text-xs text-red-500 mt-2 text-center">Beberapa item di keranjang melebihi stok atau stoknya habis. Harap sesuaikan.</p>
              }
              <Link to="/" className="block mt-4 text-center text-primary-600 hover:underline">
                Lanjutkan Belanja
              </Link>
            </div>
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

export default CartPage;
