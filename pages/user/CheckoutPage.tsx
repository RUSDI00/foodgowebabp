import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CartItem, Wallet, Promo } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { apiClient } from '../../services/api';
import * as walletService from '../../services/walletService';
import * as promoService from '../../services/promoService';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useSnackbar } from '../../hooks/useSnackbar';
import Snackbar from '../../components/Snackbar';

const CheckoutPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { snackbar, showSuccess, showError, hideSnackbar } = useSnackbar();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [shippingAddress, setShippingAddress] = useState(user?.name ? `Rumah ${user.name}` : 'Alamat Pengiriman Utama'); // Default address
  const [paymentMethod, setPaymentMethod] = useState('FakePayment'); // 'Wallet' or 'FakePayment'
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingOrder, setProcessingOrder] = useState(false);

  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<Promo | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [promoError, setPromoError] = useState('');

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalAmount = Math.max(0, subtotal - discountAmount);

  const fetchCartAndWallet = useCallback(async () => {
    if (user) {
      setLoading(true);
      try {
        const items = await apiClient.getCart();
        if (items.length === 0) {
          navigate('/cart'); // Redirect if cart is empty
          return;
        }
        setCartItems(items);
        const userWallet = await walletService.getWallet();
        setWallet(userWallet || { userId: user.id, balance: 0 }); // Ensure wallet object exists
      } catch (error) {
        console.error('Failed to fetch cart:', error);
        navigate('/cart');
      } finally {
        setLoading(false);
      }
    } else {
      navigate('/signin', { state: { from: location } }); // Redirect if not logged in
    }
  }, [user, navigate]);

  useEffect(() => {
    fetchCartAndWallet();
  }, [fetchCartAndWallet]);

  const handleApplyPromo = () => {
    setPromoError('');
    setAppliedPromo(null);
    setDiscountAmount(0);
    if (!promoCode.trim()) {
      setPromoError("Masukkan kode promo.");
      return;
    }
    const result = promoService.applyPromo(subtotal, promoCode.trim());
    if (result.error) {
      setPromoError(result.error);
    } else {
      const promoDetails = promoService.getPromoByCode(promoCode.trim());
      setAppliedPromo(promoDetails || null);
      setDiscountAmount(result.discountValue);
      showSuccess(`Promo "${promoDetails?.code}" berhasil diterapkan! Diskon Rp ${result.discountValue.toLocaleString()}.`);
    }
  };

  const handlePlaceOrder = async () => {
    if (!user || cartItems.length === 0) return;
    if (!shippingAddress.trim()) {
      showError("Mohon isi alamat pengiriman.");
      return;
    }

    if (paymentMethod === 'Wallet' && wallet && wallet.balance < totalAmount) {
      showError('Saldo dompet tidak mencukupi untuk pembayaran ini.');
      return;
    }

    setProcessingOrder(true);
    try {
      const newOrder = await apiClient.createOrder(shippingAddress, paymentMethod);
      // Cart will be cleared by backend
      showSuccess(`Pesanan #${newOrder.id.substring(0, 8)} berhasil dibuat!`);
      setTimeout(() => navigate('/orders'), 2000); // Navigate after showing success message
    } catch (error) {
      console.error('Failed to place order:', error);
      showError(error instanceof Error ? error.message : 'Gagal membuat pesanan. Silakan coba lagi.');
    } finally {
      setProcessingOrder(false);
    }
  };

  const handleCancelOrder = () => {
    navigate('/');
  };

  if (loading) {
    return <LoadingSpinner text="Memuat checkout..." />;
  }

  return (
    <>
      <div className="bg-white shadow-xl rounded-lg p-6 md:p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Checkout Pesanan</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Details & Forms */}
          <div className="lg:col-span-2 space-y-8">
            {/* Shipping Address */}
            <div className="p-6 border border-gray-200 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Alamat Pengiriman</h2>
              <textarea
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                rows={3}
                placeholder="Masukkan alamat lengkap Anda (Jalan, Nomor Rumah, Kota, Kode Pos)"
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>

            {/* Payment Method */}
            <div className="p-6 border border-gray-200 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Metode Pembayaran</h2>
              <div className="space-y-3">
                <label className="flex items-center p-3 border border-gray-300 rounded-md hover:border-primary-500 transition-colors cursor-pointer">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="Wallet"
                    checked={paymentMethod === 'Wallet'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="form-radio h-5 w-5 text-primary-600"
                    disabled={!wallet || wallet.balance < totalAmount}
                  />
                  <span className="ml-3 text-gray-700">
                    Bayar dengan Dompet (Saldo: Rp {wallet?.balance.toLocaleString() || '0'})
                    {wallet && wallet.balance < totalAmount && <span className="text-xs text-red-500 ml-2">(Saldo tidak cukup)</span>}
                  </span>
                </label>
                <label className="flex items-center p-3 border border-gray-300 rounded-md hover:border-primary-500 transition-colors cursor-pointer">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="FakePayment"
                    checked={paymentMethod === 'FakePayment'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="form-radio h-5 w-5 text-primary-600"
                  />
                  <span className="ml-3 text-gray-700">Pembayaran Fiktif (Simulasi Transfer Bank/COD)</span>
                </label>
              </div>
            </div>

            {/* Promo Code */}
            <div className="p-6 border border-gray-200 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Kode Promo</h2>
              <div className="flex items-start space-x-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  placeholder="Masukkan kode promo"
                  className="flex-grow p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
                <button
                  onClick={handleApplyPromo}
                  className="bg-secondary-500 hover:bg-secondary-600 text-white font-medium py-3 px-5 rounded-md transition-colors"
                >
                  Terapkan
                </button>
              </div>
              {promoError && <p className="text-red-500 text-sm mt-2">{promoError}</p>}
              {appliedPromo && !promoError && (
                <p className="text-green-600 text-sm mt-2">
                  Promo "{appliedPromo.code}" diterapkan! Diskon Rp {discountAmount.toLocaleString()}.
                </p>
              )}
            </div>

          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-gray-50 p-6 rounded-lg shadow-md sticky top-24">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Ringkasan Pesanan</h2>
              <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
                {cartItems.map(item => (
                  <div key={item.productId} className="flex justify-between items-start text-sm">
                    <span className="text-gray-600 flex-1 truncate pr-2">{item.name} (x{item.quantity})</span>
                    <span className="text-gray-700">Rp {(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-2 py-4 border-t border-b border-gray-200">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium text-gray-800">Rp {subtotal.toLocaleString()}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Diskon ({appliedPromo?.code})</span>
                    <span>- Rp {discountAmount.toLocaleString()}</span>
                  </div>
                )}
              </div>
              <div className="flex justify-between text-xl font-bold mt-4 mb-6">
                <span>Total Pembayaran</span>
                <span>Rp {totalAmount.toLocaleString()}</span>
              </div>

              {/* Pay Now Button */}
              <button
                onClick={handlePlaceOrder}
                disabled={processingOrder || (paymentMethod === 'Wallet' && (!wallet || wallet.balance < totalAmount))}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-lg transition-colors duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed mb-3"
              >
                {processingOrder ? (
                  <LoadingSpinner size="sm" color="border-white" />
                ) : (
                  <>
                    <i className="fas fa-shield-alt mr-2"></i>Bayar Sekarang
                  </>
                )}
              </button>

              {/* Cancel Order Button */}
              <button
                onClick={handleCancelOrder}
                disabled={processingOrder}
                className="w-full bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-3 rounded-lg transition-colors duration-300 disabled:opacity-50"
              >
                <i className="fas fa-times mr-2"></i>Batalkan Pesanan
              </button>

              {paymentMethod === 'Wallet' && wallet && wallet.balance < totalAmount && (
                <p className="text-xs text-red-500 mt-2 text-center">Saldo dompet tidak mencukupi.</p>
              )}
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

export default CheckoutPage;
