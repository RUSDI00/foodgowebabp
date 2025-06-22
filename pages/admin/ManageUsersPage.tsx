
import React, { useState, useEffect, useCallback } from 'react';
import { User } from '../../types';
import * as userService from '../../services/userService';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';

const ManageUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const allUsers = await userService.getAllUsers();
      setUsers(allUsers);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setError('Gagal memuat data pengguna.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const openDeleteModal = (user: User) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setSelectedUser(null);
    setIsDeleteModalOpen(false);
  };

  const handleDeleteUser = async () => {
    if (selectedUser) {
      if (selectedUser.role === 'admin') {
        alert("Tidak dapat menghapus akun admin utama.");
        closeDeleteModal();
        return;
      }
      setLoading(true);
      try {
        const success = await userService.deleteUser(selectedUser.id);
        if (success) {
          setUsers(prevUsers => prevUsers.filter(u => u.id !== selectedUser.id));
          alert(`Pengguna ${selectedUser.name} berhasil dihapus.`);
        } else {
          alert(`Gagal menghapus pengguna ${selectedUser.name}.`);
        }
      } catch (err) {
        console.error("Failed to delete user:", err);
        alert('Terjadi kesalahan saat menghapus pengguna.');
      } finally {
        setLoading(false);
        closeDeleteModal();
      }
    }
  };

  if (loading && users.length === 0) {
    return <LoadingSpinner text="Memuat pengguna..." />;
  }

  if (error) {
    return <div className="text-red-500 bg-red-100 p-4 rounded-md">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-semibold text-gray-800">Kelola Pengguna</h1>
        {/* <button className="bg-primary-500 hover:bg-primary-600 text-white font-medium py-2 px-4 rounded-md shadow-sm transition-colors">
          <i className="fas fa-plus mr-2"></i> Tambah Pengguna
        </button> */}
      </div>

      <div className="bg-white shadow-xl rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Terdaftar Sejak</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.length === 0 && !loading && (
              <tr><td colSpan={5} className="text-center py-10 text-gray-500">Tidak ada data pengguna.</td></tr>
            )}
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{user.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-700">{user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {new Date(user.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  {/* <button className="text-primary-600 hover:text-primary-800 transition-colors" title="Edit Pengguna">
                    <i className="fas fa-edit"></i>
                  </button> */}
                  <button
                    onClick={() => openDeleteModal(user)}
                    className="text-red-600 hover:text-red-800 transition-colors disabled:text-gray-400 disabled:cursor-not-allowed"
                    title="Hapus Pengguna"
                    disabled={user.role === 'admin'} // Disable deleting admin through this UI
                  >
                    <i className="fas fa-trash-alt"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedUser && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={closeDeleteModal}
          title={`Hapus Pengguna: ${selectedUser.name}`}
          footer={
            <>
              <button
                onClick={closeDeleteModal}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:bg-red-300"
              >
                {loading ? 'Menghapus...' : 'Ya, Hapus Pengguna'}
              </button>
            </>
          }
        >
          <p className="text-gray-700">
            Apakah Anda yakin ingin menghapus pengguna <span className="font-semibold">{selectedUser.name}</span> ({selectedUser.email})? Tindakan ini tidak dapat diurungkan dan akan menghapus semua data terkait pengguna ini (pesanan, dompet, dll).
          </p>
          <div className="mt-4 text-sm text-yellow-700 bg-yellow-100 p-3 rounded-md">
            <i className="fas fa-exclamation-triangle mr-2"></i>
            <strong>Perhatian:</strong> Menghapus pengguna akan menghapus riwayat pesanan, saldo dompet, dan data lainnya yang terkait dengan pengguna ini.
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ManageUsersPage;