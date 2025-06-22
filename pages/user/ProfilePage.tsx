import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { apiClient } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';

const ProfilePage: React.FC = () => {
  const { user, updateUserContext } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setPhone(user.phone || '');
    }
  }, [user]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setMessage(null);

    try {
      const updatedUser = await apiClient.updateProfile(name, phone);
      if (updatedUser) {
        updateUserContext(updatedUser); // Update context
        setMessage({ type: 'success', text: 'Profil berhasil diperbarui!' });
      } else {
        setMessage({ type: 'error', text: 'Gagal memperbarui profil.' });
      }
    } catch (error) {
      console.error("Profile update error:", error);
      setMessage({ type: 'error', text: `Terjadi kesalahan: ${error instanceof Error ? error.message : 'Unknown error'}` });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setMessage(null);

    if (newPassword !== confirmNewPassword) {
      setMessage({ type: 'error', text: 'Password baru dan konfirmasi tidak cocok.' });
      return;
    }
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password baru minimal 6 karakter.' });
      return;
    }

    setLoading(true);
    try {
      await apiClient.changePassword(currentPassword, newPassword);
      setMessage({ type: 'success', text: 'Password berhasil diubah!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error) {
      console.error("Change password error:", error);
      setMessage({ type: 'error', text: `Terjadi kesalahan: ${error instanceof Error ? error.message : 'Unknown error'}` });
    } finally {
      setLoading(false);
    }
  };


  if (!user) {
    return <LoadingSpinner text="Memuat profil..." />;
  }

  return (
    <div className="bg-white shadow-xl rounded-lg p-6 md:p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">Profil Saya</h1>

      {message && (
        <div className={`p-3 rounded-md mb-6 text-sm ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message.text}
        </div>
      )}

      {/* Profile Information Form */}
      <form onSubmit={handleProfileUpdate} className="space-y-6 mb-10 pb-10 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-700">Informasi Pribadi</h2>
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nama Lengkap</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            disabled // Email usually not editable or requires verification
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-100 sm:text-sm cursor-not-allowed"
          />
          <p className="text-xs text-gray-500 mt-1">Email tidak dapat diubah.</p>
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Nomor Telepon</label>
          <input
            type="tel"
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            placeholder="Contoh: 081234567890"
          />
        </div>
        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg shadow-md transition-colors duration-300 disabled:bg-gray-400"
          >
            {loading ? <LoadingSpinner size="sm" color="border-white" /> : 'Simpan Perubahan Profil'}
          </button>
        </div>
      </form>

      {/* Change Password Form */}
      <form onSubmit={handleChangePassword} className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-700">Ubah Password</h2>
        <div>
          <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">Password Saat Ini</label>
          <input
            type="password"
            id="currentPassword"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">Password Baru</label>
          <input
            type="password"
            id="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
        </div>
        <div>
          <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700">Konfirmasi Password Baru</label>
          <input
            type="password"
            id="confirmNewPassword"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
        </div>
        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-secondary-500 hover:bg-secondary-600 text-white font-semibold rounded-lg shadow-md transition-colors duration-300 disabled:bg-gray-400"
          >
            {loading ? <LoadingSpinner size="sm" color="border-white" /> : 'Ubah Password'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfilePage;
