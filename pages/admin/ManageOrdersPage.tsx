import React, { useState, useEffect, useCallback } from 'react';
import { Order, OrderStatus, User } from '../../types';
import { apiClient } from '../../services/api';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useAuth } from '../../hooks/useAuth';

const ManageOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null); // Track which order is being updated

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const { user: _adminUser } = useAuth(); // For logging who confirmed

  const fetchOrdersAndUsers = useCallback(async () => {
    setLoading(true);
    try {
      // Use API to get orders and users
      const allOrders = await apiClient.getAllOrders();
      const allUsers = await apiClient.getAllUsers();

      const usersMap = allUsers.reduce((acc, user) => {
        acc[user.id] = user;
        return acc;
      }, {} as Record<string, User>);

      setOrders(allOrders);
      setUsers(usersMap);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch orders or users:", err);
      setError('Gagal memuat data pesanan atau pengguna.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrdersAndUsers();
  }, [fetchOrdersAndUsers]);

  const openDetailModal = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailModalOpen(true);
  };

  const closeDetailModal = () => {
    setSelectedOrder(null);
    setIsDetailModalOpen(false);
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingStatus(orderId);
    try {
      console.log('Updating order:', { orderId, newStatus });
      console.log('Current token:', apiClient.getToken());

      // Use API to update order status
      const updatedOrder = await apiClient.updateOrderStatus(orderId, newStatus);
      console.log('Update response:', updatedOrder);

      if (updatedOrder) {
        setOrders(prevOrders => prevOrders.map(o => o.id === orderId ? updatedOrder : o));
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(updatedOrder); // Update selected order if it's the one being modified
        }
        alert(`Status pesanan #${orderId} berhasil diperbarui menjadi ${newStatus}.`);
      } else {
        console.error('No updated order returned');
        alert('Gagal memperbarui status pesanan.');
      }
    } catch (err) {
      console.error("Failed to update order status:", err);
      console.error("Error details:", {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined
      });
      alert(`Terjadi kesalahan saat memperbarui status pesanan: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING_PAYMENT: return 'bg-yellow-100 text-yellow-800';
      case OrderStatus.PROCESSING: return 'bg-blue-100 text-blue-800';
      case OrderStatus.SHIPPED: return 'bg-indigo-100 text-indigo-800';
      case OrderStatus.DELIVERED: return 'bg-green-100 text-green-800';
      case OrderStatus.CANCELLED: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && orders.length === 0) {
    return <LoadingSpinner text="Memuat pesanan..." />;
  }

  if (error) {
    return <div className="text-red-500 bg-red-100 p-4 rounded-md">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-semibold text-gray-800 mb-6">Kelola Pesanan</h1>

      <div className="bg-white shadow-xl rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pengguna</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.length === 0 && !loading && (
              <tr><td colSpan={6} className="text-center py-10 text-gray-500">Belum ada pesanan.</td></tr>
            )}
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-600 hover:underline cursor-pointer" onClick={() => openDetailModal(order)}>#{order.id.substring(0, 8)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{users[order.userId]?.name || 'Pengguna Dihapus'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{new Date(order.createdAt).toLocaleDateString('id-ID')}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">Rp {order.totalAmount.toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button onClick={() => openDetailModal(order)} className="text-primary-600 hover:text-primary-800 transition-colors" title="Lihat Detail">
                    <i className="fas fa-eye"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedOrder && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={closeDetailModal}
          title={`Detail Pesanan #${selectedOrder.id.substring(0, 8)}`}
          footer={
            <button
              onClick={closeDetailModal}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
            >
              Tutup
            </button>
          }
        >
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-800">Informasi Pemesan:</h3>
              <p>Nama: <span className="text-gray-600">{users[selectedOrder.userId]?.name || 'N/A'}</span></p>
              <p>Email: <span className="text-gray-600">{users[selectedOrder.userId]?.email || 'N/A'}</span></p>
              <p>Alamat Pengiriman: <span className="text-gray-600">{selectedOrder.shippingAddress || 'N/A'}</span></p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Detail Item:</h3>
              <ul className="list-disc list-inside space-y-1 mt-1">
                {selectedOrder.items.map(item => (
                  <li key={item.productId} className="text-gray-600">
                    {item.name} (x{item.quantity}) - Rp {(item.price * item.quantity).toLocaleString()}
                  </li>
                ))}
              </ul>
              <p className="font-semibold mt-2">Total Pesanan: Rp {selectedOrder.totalAmount.toLocaleString()}</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">Status Saat Ini:</h3>
              <p><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedOrder.status)}`}>{selectedOrder.status}</span></p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Ubah Status Pesanan:</h3>
              <div className="flex flex-wrap gap-2">
                {Object.values(OrderStatus).map(statusValue => (
                  <button
                    key={statusValue}
                    onClick={() => handleStatusChange(selectedOrder.id, statusValue)}
                    disabled={updatingStatus === selectedOrder.id || selectedOrder.status === statusValue}
                    className={`px-3 py-1.5 text-sm rounded-md transition-colors font-medium
                                ${selectedOrder.status === statusValue ? `${getStatusColor(statusValue)} cursor-not-allowed opacity-70` : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}
                                ${updatingStatus === selectedOrder.id ? 'opacity-50 cursor-wait' : ''}`}
                  >
                    {updatingStatus === selectedOrder.id ? 'Memperbarui...' : statusValue}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">Dibuat: {new Date(selectedOrder.createdAt).toLocaleString('id-ID')}</p>
            {selectedOrder.updatedAt !== selectedOrder.createdAt && <p className="text-xs text-gray-500">Diperbarui: {new Date(selectedOrder.updatedAt).toLocaleString('id-ID')}</p>}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ManageOrdersPage;