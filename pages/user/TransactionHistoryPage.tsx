import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Order, WalletTransaction, WalletTransactionType } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import * as orderService from '../../services/orderService';
import * as walletService from '../../services/walletService';
import LoadingSpinner from '../../components/LoadingSpinner';

interface CombinedTransaction {
  id: string;
  type: 'Order' | 'Wallet';
  date: string;
  description: string;
  amount: number; // Positive for income (e.g. topup, refund), negative for expense (e.g. order payment)
  status?: string; // For orders
  originalData: Order | WalletTransaction;
}

const TransactionHistoryPage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [transactions, setTransactions] = useState<CombinedTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactionData = useCallback(async () => {
    if (user) {
      setLoading(true);
      try {
        const userOrders = orderService.getOrdersByUserId(user.id);
        const userWalletTxs = await walletService.getWalletTransactions();

        const combined: CombinedTransaction[] = [];

        userOrders.forEach(order => {
          combined.push({
            id: `order-${order.id}`,
            type: 'Order',
            date: order.createdAt,
            description: `Pembelian Pesanan #${order.id.substring(0, 8)}`,
            amount: -order.totalAmount, // Order is an expense
            status: order.status,
            originalData: order,
          });
        });

        userWalletTxs.forEach(tx => {
          let amount = tx.amount;
          // Wallet payments are already captured by orders if order paid by wallet.
          // Only show top-ups and refunds directly. Payments made from wallet are expenses, so tx.amount is negative.
          // If a payment is listed here, it means it's a direct wallet debit NOT tied to an order on THIS page's logic,
          // or it's a refund (positive) or topup (positive).
          // For simplicity, we just show all wallet tx. If tx.type is PAYMENT, amount is negative.
          if (tx.type === WalletTransactionType.PAYMENT && tx.amount > 0) amount = -tx.amount; // Ensure payments are negative
          if ((tx.type === WalletTransactionType.TOPUP || tx.type === WalletTransactionType.REFUND) && tx.amount < 0) amount = Math.abs(tx.amount); // Ensure topups/refunds are positive

          combined.push({
            id: `wallet-${tx.id}`,
            type: 'Wallet',
            date: tx.createdAt,
            description: tx.description,
            amount: amount,
            status: tx.type, // Use WalletTransactionType as status for wallet items
            originalData: tx,
          });
        });

        // Filter out wallet payments that are associated with an order shown on this page already
        // This is tricky and might lead to double counting or missing items if not careful.
        // For now, keep it simple and show all, user can correlate.
        // A more robust system would link wallet payment transactions to order IDs.
        // Our wallet tx has relatedOrderId, so we can use that.
        const orderIds = new Set(userOrders.map(o => o.id));
        const filteredCombined = combined.filter(t => {
          if (t.type === 'Wallet') {
            const wt = t.originalData as WalletTransaction;
            if (wt.type === WalletTransactionType.PAYMENT && wt.relatedOrderId && orderIds.has(wt.relatedOrderId)) {
              return false; // Don't show wallet payment if its order is already listed
            }
          }
          return true;
        });


        filteredCombined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setTransactions(filteredCombined);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch transaction data:", err);
        setError('Gagal memuat riwayat transaksi.');
      } finally {
        setLoading(false);
      }
    } else {
      setTransactions([]);
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTransactionData();
  }, [fetchTransactionData]);

  if (loading) {
    return <LoadingSpinner text="Memuat riwayat transaksi..." />;
  }
  if (error) {
    return <div className="text-center text-red-500 bg-red-100 p-4 rounded-md">{error}</div>;
  }
  if (!user) {
    return <div className="text-center py-10"><p>Silakan <Link to="/signin" state={{ from: location }} className="text-primary-600 hover:underline">masuk</Link> untuk melihat riwayat transaksi Anda.</p></div>;
  }
  if (transactions.length === 0) {
    return (
      <div className="text-center py-20 bg-white shadow-lg rounded-lg p-8">
        <i className="fas fa-history text-6xl text-gray-300 mb-6"></i>
        <h2 className="text-2xl font-semibold text-gray-700 mb-3">Tidak Ada Riwayat Transaksi</h2>
        <p className="text-gray-500 mb-6">Semua aktivitas pesanan dan dompet Anda akan tercatat di sini.</p>
        <Link to="/" className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors">
          Mulai Belanja
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-xl rounded-lg p-6 md:p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Riwayat Transaksi</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipe</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deskripsi</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status/Ket</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Jumlah</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.map(tx => (
              <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{new Date(tx.date).toLocaleDateString('id-ID')}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${tx.type === 'Order' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                    }`}>
                    {tx.type}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-normal text-sm text-gray-800 max-w-xs">{tx.description}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{tx.status}</td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {tx.amount >= 0 ? `+Rp ${tx.amount.toLocaleString()}` : `-Rp ${Math.abs(tx.amount).toLocaleString()}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionHistoryPage;
