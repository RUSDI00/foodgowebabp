
import React, { useState, useEffect, useCallback } from 'react';
import { Promo, DiscountType } from '../../types';
import * as promoService from '../../services/promoService';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';

const ManagePromosPage: React.FC = () => {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPromo, setCurrentPromo] = useState<Partial<Promo> | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const fetchPromos = useCallback(() => {
    setLoading(true);
    try {
      const allPromos = promoService.getAllPromos();
      setPromos(allPromos);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch promos:", err);
      setError('Gagal memuat data promo.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPromos();
  }, [fetchPromos]);

  const openAddModal = () => {
    setCurrentPromo({ 
      code: '', 
      description: '', 
      discountType: DiscountType.PERCENTAGE, 
      discountValue: 0, 
      minPurchase: 0,
      startDate: new Date().toISOString().split('T')[0], // Default to today
      endDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0], // Default to 7 days from today
      isActive: true 
    });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const openEditModal = (promo: Promo) => {
    setCurrentPromo({ 
      ...promo,
      startDate: promo.startDate.split('T')[0], // Format for date input
      endDate: promo.endDate.split('T')[0]      // Format for date input
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setCurrentPromo(null);
    setIsModalOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!currentPromo) return;
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
        setCurrentPromo({ ...currentPromo, [name]: (e.target as HTMLInputElement).checked });
    } else {
        setCurrentPromo({ ...currentPromo, [name]: (name === 'discountValue' || name === 'minPurchase') ? parseFloat(value) : value });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPromo || !currentPromo.code || !currentPromo.description || currentPromo.discountValue == null || !currentPromo.startDate || !currentPromo.endDate) {
      alert('Mohon lengkapi semua field yang wajib diisi.');
      return;
    }
    
    const promoToSave = {
        ...currentPromo,
        startDate: new Date(currentPromo.startDate as string).toISOString(), // Ensure ISO string
        endDate: new Date(currentPromo.endDate as string).toISOString()    // Ensure ISO string
    };

    setLoading(true);
    try {
      if (isEditing && currentPromo.id) {
        promoService.updatePromo(promoToSave as Promo);
        alert('Promo berhasil diperbarui.');
      } else {
        promoService.addPromo(promoToSave as Omit<Promo, 'id' | 'createdAt'>);
        alert('Promo berhasil ditambahkan.');
      }
      fetchPromos();
      closeModal();
    } catch (err) {
      console.error("Failed to save promo:", err);
      alert('Gagal menyimpan promo.');
    } finally {
      setLoading(false);
    }
  };

  const [promoToDelete, setPromoToDelete] = useState<Promo | null>(null);

  const openDeleteConfirmModal = (promo: Promo) => {
    setPromoToDelete(promo);
  };

  const closeDeleteConfirmModal = () => {
    setPromoToDelete(null);
  };

  const handleDeletePromo = () => {
    if (promoToDelete) {
      setLoading(true);
      try {
        promoService.deletePromo(promoToDelete.id);
        alert(`Promo ${promoToDelete.code} berhasil dihapus.`);
        fetchPromos();
      } catch (err) {
        console.error("Failed to delete promo:", err);
        alert('Gagal menghapus promo.');
      } finally {
        setLoading(false);
        closeDeleteConfirmModal();
      }
    }
  };

  if (loading && promos.length === 0) {
    return <LoadingSpinner text="Memuat promo..." />;
  }

  if (error) {
    return <div className="text-red-500 bg-red-100 p-4 rounded-md">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-semibold text-gray-800">Kelola Promo & Diskon</h1>
        <button 
          onClick={openAddModal}
          className="bg-primary-500 hover:bg-primary-600 text-white font-medium py-2 px-4 rounded-md shadow-sm transition-colors"
        >
          <i className="fas fa-plus mr-2"></i> Tambah Promo
        </button>
      </div>

      <div className="bg-white shadow-xl rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kode Promo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deskripsi</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipe</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nilai</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Min. Pembelian</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Berlaku</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {promos.length === 0 && !loading && (
                <tr><td colSpan={8} className="text-center py-10 text-gray-500">Belum ada promo.</td></tr>
            )}
            {promos.map((promo) => (
              <tr key={promo.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{promo.code}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 max-w-xs truncate">{promo.description}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{promo.discountType === DiscountType.PERCENTAGE ? 'Persentase' : 'Nominal Tetap'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {promo.discountType === DiscountType.PERCENTAGE ? `${promo.discountValue}%` : `Rp ${promo.discountValue.toLocaleString()}`}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">Rp {promo.minPurchase?.toLocaleString() || '0'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {new Date(promo.startDate).toLocaleDateString('id-ID')} - {new Date(promo.endDate).toLocaleDateString('id-ID')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    promo.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {promo.isActive ? 'Aktif' : 'Nonaktif'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button onClick={() => openEditModal(promo)} className="text-primary-600 hover:text-primary-800 transition-colors" title="Edit Promo">
                    <i className="fas fa-edit"></i>
                  </button>
                  <button onClick={() => openDeleteConfirmModal(promo)} className="text-red-600 hover:text-red-800 transition-colors" title="Hapus Promo">
                    <i className="fas fa-trash-alt"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && currentPromo && (
        <Modal 
            isOpen={isModalOpen} 
            onClose={closeModal} 
            title={isEditing ? 'Edit Promo' : 'Tambah Promo Baru'}
            footer={
                <>
                  <button type="button" onClick={closeModal} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors">Batal</button>
                  <button type="submit" form="promoForm" disabled={loading} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:bg-primary-300">
                    {loading ? 'Menyimpan...' : (isEditing ? 'Simpan Perubahan' : 'Tambah Promo')}
                  </button>
                </>
            }
        >
          <form id="promoForm" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700">Kode Promo</label>
              <input type="text" name="code" id="code" value={currentPromo.code || ''} onChange={handleInputChange} required className="mt-1 block w-full uppercase px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">Deskripsi</label>
              <textarea name="description" id="description" value={currentPromo.description || ''} onChange={handleInputChange} rows={2} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"></textarea>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="discountType" className="block text-sm font-medium text-gray-700">Tipe Diskon</label>
                    <select name="discountType" id="discountType" value={currentPromo.discountType} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm">
                        <option value={DiscountType.PERCENTAGE}>Persentase (%)</option>
                        <option value={DiscountType.FIXED}>Nominal Tetap (Rp)</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="discountValue" className="block text-sm font-medium text-gray-700">Nilai Diskon</label>
                    <input type="number" name="discountValue" id="discountValue" value={currentPromo.discountValue || 0} onChange={handleInputChange} required min="0" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
                </div>
            </div>
            <div>
              <label htmlFor="minPurchase" className="block text-sm font-medium text-gray-700">Minimal Pembelian (Rp, opsional)</label>
              <input type="number" name="minPurchase" id="minPurchase" value={currentPromo.minPurchase || 0} onChange={handleInputChange} min="0" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Tanggal Mulai</label>
                    <input type="date" name="startDate" id="startDate" value={currentPromo.startDate?.toString().split('T')[0] || ''} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
                </div>
                <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">Tanggal Selesai</label>
                    <input type="date" name="endDate" id="endDate" value={currentPromo.endDate?.toString().split('T')[0] || ''} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
                </div>
            </div>
            <div className="flex items-center">
              <input type="checkbox" name="isActive" id="isActive" checked={currentPromo.isActive || false} onChange={handleInputChange} className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500" />
              <label htmlFor="isActive" className="ml-2 block text-sm font-medium text-gray-700">Aktifkan Promo</label>
            </div>
             {/* Submit buttons are now in the Modal's footer prop */}
          </form>
        </Modal>
      )}

      {promoToDelete && (
        <Modal
          isOpen={!!promoToDelete}
          onClose={closeDeleteConfirmModal}
          title={`Hapus Promo: ${promoToDelete.code}`}
          footer={
            <>
              <button
                onClick={closeDeleteConfirmModal}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleDeletePromo}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:bg-red-300"
              >
                {loading ? 'Menghapus...' : 'Ya, Hapus Promo'}
              </button>
            </>
          }
        >
          <p className="text-gray-700">
            Apakah Anda yakin ingin menghapus promo <span className="font-semibold">{promoToDelete.code}</span>? Tindakan ini tidak dapat diurungkan.
          </p>
        </Modal>
      )}
    </div>
  );
};

export default ManagePromosPage;