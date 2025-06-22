import React, { useState, useEffect, useCallback } from 'react';
import { Wallet, WalletTransaction, WalletTransactionType } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import * as walletService from '../../services/walletService';
import LoadingSpinner from '../../components/LoadingSpinner';
import Modal from '../../components/Modal';
import { useSnackbar } from '../../hooks/useSnackbar';
import Snackbar from '../../components/Snackbar';

const WalletPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { snackbar, showSuccess, showError, hideSnackbar } = useSnackbar();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState<number>(50000); // Default top-up amount
  const [selectedTopUpMethod, setSelectedTopUpMethod] = useState('Simulasi Transfer Bank');
  const [processingTopUp, setProcessingTopUp] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/signin');
      return;
    }
    fetchWalletData();
  }, [user, navigate]);

  const fetchWalletData = useCallback(async () => {
    setLoading(true);
    try {
      const [userWallet, userTransactions] = await Promise.all([
        walletService.getWallet(),
        walletService.getWalletTransactions()
      ]);
      setWallet(userWallet || { userId: user?.id || '', balance: 0 }); // Ensure wallet object exists if new user
      setTransactions(userTransactions);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch wallet data:", err);
      setError('Gagal memuat data dompet.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const handleTopUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || topUpAmount <= 0) {
      showError("Jumlah top-up tidak valid.");
      return;
    }
    setProcessingTopUp(true);
    try {
      const success = await walletService.topUpWallet(topUpAmount, selectedTopUpMethod);
      if (success) {
        showSuccess(`Top-up sebesar Rp ${topUpAmount.toLocaleString()} berhasil!`);
        fetchWalletData(); // Refresh wallet data
        setIsTopUpModalOpen(false);
        setTopUpAmount(50000); // Reset
      } else {
        showError('Gagal melakukan top-up.');
      }
    } catch (err) {
      console.error("Error during top-up:", err);
      showError('Terjadi kesalahan saat top-up.');
    } finally {
      setProcessingTopUp(false);
    }
  };

  const topUpAmounts = [50000, 100000, 200000, 500000, 1000000];
  const topUpMethods = ['Simulasi Transfer Bank', 'Simulasi E-Wallet', 'Simulasi Kartu Kredit'];

  if (loading) {
    return <LoadingSpinner text="Memuat data dompet..." />;
  }
  if (error) {
    return <div className="text-center text-red-500 bg-red-100 p-4 rounded-md">{error}</div>;
  }
  if (!user || !wallet) {
    // This case should be handled by AuthProvider or redirect, but as a fallback:
    return <div className="text-center py-10"><p>Data dompet tidak tersedia. Silakan coba lagi.</p></div>;
  }

  return (
    <>
      <div className="bg-white shadow-xl rounded-lg p-6 md:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Dompet Saya</h1>
          <button
            onClick={() => setIsTopUpModalOpen(true)}
            className="mt-4 sm:mt-0 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-5 rounded-lg shadow-md transition-colors duration-300"
          >
            <i className="fas fa-plus-circle mr-2"></i>Isi Saldo Dompet
          </button>
        </div>

        <div className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white p-8 rounded-xl shadow-lg mb-8 text-center">
          <p className="text-lg opacity-80">Saldo Anda Saat Ini:</p>
          <p className="text-5xl font-extrabold mt-1">Rp {wallet.balance.toLocaleString()}</p>
        </div>

        <h2 className="text-2xl font-semibold text-gray-700 mb-6">Riwayat Transaksi Dompet</h2>
        {transactions.length > 0 ? (
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {transactions.map(tx => (
              <div key={tx.id} className={`p-4 border rounded-lg shadow-sm flex justify-between items-center
                ${tx.type === WalletTransactionType.TOPUP || tx.type === WalletTransactionType.REFUND ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}`}>
                <div>
                  <p className={`font-medium ${tx.type === WalletTransactionType.TOPUP || tx.type === WalletTransactionType.REFUND ? 'text-green-700' : 'text-red-700'}`}>{tx.type}</p>
                  <p className="text-sm text-gray-600">{tx.description}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(tx.createdAt).toLocaleString('id-ID')}</p>
                </div>
                <p className={`text-lg font-semibold ${tx.type === WalletTransactionType.TOPUP || tx.type === WalletTransactionType.REFUND ? 'text-green-700' : 'text-red-700'}`}>
                  {tx.type === WalletTransactionType.TOPUP || tx.type === WalletTransactionType.REFUND ? '+' : '-'}Rp {Math.abs(tx.amount).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-6">Belum ada riwayat transaksi.</p>
        )}

        {isTopUpModalOpen && (
          <Modal
            isOpen={isTopUpModalOpen}
            onClose={() => setIsTopUpModalOpen(false)}
            title="Isi Saldo Dompet"
            footer={
              <>
                <button
                  type="button"
                  onClick={() => setIsTopUpModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  form="topUpForm"
                  disabled={processingTopUp || topUpAmount <= 0}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:bg-primary-300"
                >
                  {processingTopUp ? <LoadingSpinner size="sm" color="border-white" /> : 'Lanjutkan Top-up'}
                </button>
              </>
            }
          >
            <form id="topUpForm" onSubmit={handleTopUp} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Jumlah Top-up:</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                  {topUpAmounts.map(amount => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setTopUpAmount(amount)}
                      className={`p-3 border rounded-md text-center transition-colors
                                  ${topUpAmount === amount ? 'bg-primary-600 text-white border-primary-600' : 'bg-gray-100 hover:bg-gray-200 border-gray-300'}`}
                    >
                      Rp {amount.toLocaleString()}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(Math.max(0, parseInt(e.target.value)))}
                  min="10000" // Minimum top-up
                  step="10000"
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Atau masukkan jumlah lain"
                />
              </div>
              <div>
                <label htmlFor="topUpMethod" className="block text-sm font-medium text-gray-700 mb-1">Metode Pembayaran (Simulasi):</label>
                <select
                  id="topUpMethod"
                  value={selectedTopUpMethod}
                  onChange={(e) => setSelectedTopUpMethod(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                >
                  {topUpMethods.map(method => <option key={method} value={method}>{method}</option>)}
                </select>
              </div>
              <div className="text-sm text-gray-500">
                <p><i className="fas fa-info-circle mr-1 text-blue-500"></i>Ini adalah simulasi top-up. Saldo akan langsung ditambahkan ke dompet virtual Anda.</p>
              </div>
              {/* Submit buttons are now in the Modal's footer prop */}
            </form>
          </Modal>
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

export default WalletPage;