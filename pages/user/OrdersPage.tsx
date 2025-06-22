import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Order, OrderStatus } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { apiClient } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useSnackbar } from '../../hooks/useSnackbar';
import Snackbar from '../../components/Snackbar';

const OrdersPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { snackbar, showSuccess, showError, hideSnackbar } = useSnackbar();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/signin');
      return;
    }
    fetchOrders();
  }, [user, navigate]);

  const fetchOrders = async () => {
    try {
      const userOrders = await apiClient.getUserOrders();
      setOrders(userOrders);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      const order = orders.find(o => o.id === orderId);
      if (order && (order.status === OrderStatus.PENDING_PAYMENT || order.status === OrderStatus.PROCESSING)) {
        await apiClient.cancelOrder(orderId);
        setOrders(prevOrders =>
          prevOrders.map(order =>
            order.id === orderId
              ? { ...order, status: OrderStatus.CANCELLED }
              : order
          )
        );
        showSuccess("Pesanan berhasil dibatalkan.");
      } else {
        showError("Gagal membatalkan pesanan atau pesanan tidak dapat dibatalkan pada status ini.");
      }
    } catch (err) {
      console.error('Error cancelling order:', err);
      showError(`Terjadi kesalahan saat membatalkan pesanan: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING_PAYMENT:
        return 'text-yellow-600 bg-yellow-100';
      case OrderStatus.PROCESSING:
        return 'text-blue-600 bg-blue-100';
      case OrderStatus.SHIPPED:
        return 'text-indigo-600 bg-indigo-100';
      case OrderStatus.DELIVERED:
        return 'text-green-600 bg-green-100';
      case OrderStatus.CANCELLED:
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return <LoadingSpinner text="Memuat pesanan..." />;
  }



  return (
    <>
      <div className="bg-white shadow-xl rounded-lg p-6 md:p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Riwayat Pesanan</h1>

        {orders.length === 0 ? (
          <div className="text-center py-12">
            <i className="fas fa-receipt text-6xl text-gray-300 mb-4"></i>
            <h2 className="text-2xl font-semibold text-gray-500 mb-2">Belum Ada Pesanan</h2>
            <p className="text-gray-400 mb-6">Anda belum memiliki riwayat pesanan.</p>
            <button
              onClick={() => navigate('/')}
              className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-300"
            >
              <i className="fas fa-shopping-bag mr-2"></i>Mulai Berbelanja
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map(order => (
              <div key={order.id} className="border border-gray-200 rounded-lg shadow-sm bg-gray-50 p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      Pesanan #{order.id.substring(0, 8).toUpperCase()}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>

                <div className="mb-4">
                  <h4 className="font-medium text-gray-700 mb-2">Item yang dipesan:</h4>
                  <div className="space-y-2">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">{item.name} (x{item.quantity})</span>
                        <span className="text-gray-700 font-medium">Rp {(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <div className="text-sm text-gray-600">
                      <p><strong>Alamat:</strong> {order.shippingAddress}</p>
                      <p><strong>Pembayaran:</strong> {order.paymentMethod}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-800">
                        Total: Rp {order.totalAmount.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    {(order.status === OrderStatus.PENDING_PAYMENT || order.status === OrderStatus.PROCESSING) && (
                      <button
                        onClick={() => handleCancelOrder(order.id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                      >
                        <i className="fas fa-times mr-1"></i>Batalkan Pesanan
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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

export default OrdersPage;
