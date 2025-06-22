
import React, { useState, useEffect, useCallback } from 'react';
import { Product } from '../../types';
import * as productService from '../../services/productService';
import Modal from '../../components/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';

const ManageProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Partial<Product> | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');


  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const allProducts = await productService.getAllProducts();
      setProducts(allProducts);
      const uniqueCategories = await productService.getCategories();
      setCategories(uniqueCategories.filter(cat => cat !== 'Semua')); // Exclude 'All' for management
      setError(null);
    } catch (err) {
      console.error("Failed to fetch products:", err);
      setError('Gagal memuat data produk.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const openAddModal = () => {
    setCurrentProduct({ name: '', description: '', category: categories[0] || '', price: 0, stock: 0, imageUrl: '' });
    setIsEditing(false);
    setNewCategory('');
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setCurrentProduct({ ...product });
    setIsEditing(true);
    setNewCategory('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setCurrentProduct(null);
    setIsModalOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (!currentProduct) return;
    const { name, value } = e.target;
    if (name === "category" && value === "NEW_CATEGORY") {
        setCurrentProduct({ ...currentProduct, category: "" }); // Clear category for new input
    } else {
        setCurrentProduct({ ...currentProduct, [name]: name === 'price' || name === 'stock' ? parseFloat(value) : value });
    }
  };
  
  const handleNewCategoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setNewCategory(e.target.value);
      if (currentProduct) {
          setCurrentProduct({ ...currentProduct, category: e.target.value });
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProduct || !currentProduct.name || !currentProduct.category || currentProduct.price == null || currentProduct.stock == null) {
      alert('Mohon lengkapi semua field yang wajib diisi.');
      return;
    }
    setLoading(true);
    try {
      if (isEditing && currentProduct.id) {
        await productService.updateProduct(currentProduct as Product);
        alert('Produk berhasil diperbarui.');
      } else {
        await productService.addProduct(currentProduct as Omit<Product, 'id' | 'createdAt'>);
        alert('Produk berhasil ditambahkan.');
      }
      await fetchProducts(); // Refresh list
      closeModal();
    } catch (err) {
      console.error("Failed to save product:", err);
      alert('Gagal menyimpan produk.');
    } finally {
      setLoading(false);
    }
  };
  
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const openDeleteConfirmModal = (product: Product) => {
    setProductToDelete(product);
  };

  const closeDeleteConfirmModal = () => {
    setProductToDelete(null);
  };

  const handleDeleteProduct = async () => {
    if (productToDelete) {
      setLoading(true);
      try {
        await productService.deleteProduct(productToDelete.id);
        alert(`Produk ${productToDelete.name} berhasil dihapus.`);
        await fetchProducts(); // Refresh list
      } catch (err) {
        console.error("Failed to delete product:", err);
        alert('Gagal menghapus produk.');
      } finally {
        setLoading(false);
        closeDeleteConfirmModal();
      }
    }
  };


  if (loading && products.length === 0) {
    return <LoadingSpinner text="Memuat produk..." />;
  }

  if (error) {
    return <div className="text-red-500 bg-red-100 p-4 rounded-md">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-semibold text-gray-800">Kelola Produk</h1>
        <button 
          onClick={openAddModal}
          className="bg-primary-500 hover:bg-primary-600 text-white font-medium py-2 px-4 rounded-md shadow-sm transition-colors"
        >
          <i className="fas fa-plus mr-2"></i> Tambah Produk
        </button>
      </div>

      <div className="bg-white shadow-xl rounded-lg overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gambar</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Produk</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kategori</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Harga</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stok</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.length === 0 && !loading && (
                <tr><td colSpan={6} className="text-center py-10 text-gray-500">Belum ada produk.</td></tr>
            )}
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <img src={product.imageUrl || `https://picsum.photos/seed/${product.id}/50/50`} alt={product.name} className="h-10 w-10 rounded-md object-cover" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{product.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{product.category}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">Rp {product.price.toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{product.stock}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  <button onClick={() => openEditModal(product)} className="text-primary-600 hover:text-primary-800 transition-colors" title="Edit Produk">
                    <i className="fas fa-edit"></i>
                  </button>
                  <button onClick={() => openDeleteConfirmModal(product)} className="text-red-600 hover:text-red-800 transition-colors" title="Hapus Produk">
                    <i className="fas fa-trash-alt"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && currentProduct && (
        <Modal 
            isOpen={isModalOpen} 
            onClose={closeModal} 
            title={isEditing ? 'Edit Produk' : 'Tambah Produk Baru'}
            footer={
                <>
                  <button type="button" onClick={closeModal} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors">Batal</button>
                  <button type="submit" form="productForm" disabled={loading} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:bg-primary-300">
                    {loading ? 'Menyimpan...' : (isEditing ? 'Simpan Perubahan' : 'Tambah Produk')}
                  </button>
                </>
            }
        >
          <form id="productForm" onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nama Produk</label>
              <input type="text" name="name" id="name" value={currentProduct.name || ''} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">Deskripsi</label>
              <textarea name="description" id="description" value={currentProduct.description || ''} onChange={handleInputChange} rows={3} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"></textarea>
            </div>
             <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">Kategori</label>
                <select name="category" id="category" value={currentProduct.category === newCategory && newCategory !== '' ? "NEW_CATEGORY" : currentProduct.category || ''} onChange={handleInputChange} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm">
                    <option value="" disabled>Pilih Kategori</option>
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    <option value="NEW_CATEGORY">-- Tambah Kategori Baru --</option>
                </select>
            </div>
            {(currentProduct.category === '' || (currentProduct.category !== newCategory && newCategory !== '')) && ( // Show if "Tambah Kategori Baru" is selected OR if newCategory input has content
                 <input
                    type="text"
                    name="newCategory"
                    placeholder="Nama Kategori Baru"
                    value={newCategory}
                    onChange={handleNewCategoryChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
            )}
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700">Harga (Rp)</label>
              <input type="number" name="price" id="price" value={currentProduct.price || 0} onChange={handleInputChange} required min="0" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="stock" className="block text-sm font-medium text-gray-700">Stok</label>
              <input type="number" name="stock" id="stock" value={currentProduct.stock || 0} onChange={handleInputChange} required min="0" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700">URL Gambar</label>
              <input type="url" name="imageUrl" id="imageUrl" value={currentProduct.imageUrl || ''} onChange={handleInputChange} placeholder="https://example.com/image.jpg" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
              {currentProduct.imageUrl && <img src={currentProduct.imageUrl} alt="Preview" className="mt-2 h-20 w-20 object-cover rounded" />}
            </div>
            {/* Submit buttons are now in the Modal's footer prop */}
          </form>
        </Modal>
      )}
      
      {productToDelete && (
        <Modal
          isOpen={!!productToDelete}
          onClose={closeDeleteConfirmModal}
          title={`Hapus Produk: ${productToDelete.name}`}
          footer={
            <>
              <button
                onClick={closeDeleteConfirmModal}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteProduct}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:bg-red-300"
              >
                {loading ? 'Menghapus...' : 'Ya, Hapus Produk'}
              </button>
            </>
          }
        >
          <p className="text-gray-700">
            Apakah Anda yakin ingin menghapus produk <span className="font-semibold">{productToDelete.name}</span>? Tindakan ini tidak dapat diurungkan.
          </p>
        </Modal>
      )}

    </div>
  );
};

export default ManageProductsPage;