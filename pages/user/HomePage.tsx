import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Product } from '../../types';
import * as productService from '../../services/productService';
import ProductCard from '../../components/ProductCard';
import LoadingSpinner from '../../components/LoadingSpinner';

const HomePage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const searchTerm = searchParams.get('search') || '';

  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [sortBy, setSortBy] = useState<string>('relevance'); // relevance, price-asc, price-desc, name-asc, name-desc

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const allProducts = await productService.getAllProducts();
        setProducts(allProducts);
        const uniqueCategories = await productService.getCategories();
        setCategories(uniqueCategories);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch products:", err);
        setError('Gagal memuat produk. Silakan coba lagi nanti.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredAndSortedProducts = useMemo(() => {
    let prods = [...products];

    // Filter by category
    if (selectedCategory !== 'Semua') {
      prods = prods.filter(p => p.category === selectedCategory);
    }

    // Filter by search term
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      prods = prods.filter(p =>
        p.name.toLowerCase().includes(lowerSearchTerm) ||
        p.description.toLowerCase().includes(lowerSearchTerm) ||
        p.category.toLowerCase().includes(lowerSearchTerm)
      );
    }

    // Sort products
    switch (sortBy) {
      case 'price-asc':
        prods.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        prods.sort((a, b) => b.price - a.price);
        break;
      case 'name-asc':
        prods.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        prods.sort((a, b) => b.name.localeCompare(a.name));
        break;
      // 'relevance' (default) doesn't need explicit sort here as search logic already filters.
      // More advanced relevance would require scoring.
    }
    return prods;
  }, [products, searchTerm, selectedCategory, sortBy]);

  if (loading) {
    return <LoadingSpinner text="Memuat produk..." />;
  }

  if (error) {
    return <div className="text-center text-red-500 bg-red-100 p-4 rounded-md">{error}</div>;
  }

  return (
    <div className="container mx-auto">
      {searchTerm && (
        <h2 className="text-2xl font-semibold text-gray-700 mb-6">
          Hasil pencarian untuk: <span className="text-primary-600">"{searchTerm}"</span>
        </h2>
      )}
      {!searchTerm && (
        <div className="mb-8 p-6 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg shadow-lg">
          <h1 className="text-4xl font-bold mb-2">Selamat Datang di FoodGo!</h1>
          <p className="text-lg">Nikmati kelezatan makanan terbaik dengan cita rasa autentik dan harga terjangkau.</p>
        </div>
      )}

      <div className="mb-6 p-4 bg-white rounded-lg shadow">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <label htmlFor="category-filter" className="mr-2 font-medium text-gray-700">Kategori:</label>
            <select
              id="category-filter"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            >
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="sort-by" className="mr-2 font-medium text-gray-700">Urutkan:</label>
            <select
              id="sort-by"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="relevance">Relevansi</option>
              <option value="price-asc">Harga Terendah</option>
              <option value="price-desc">Harga Tertinggi</option>
              <option value="name-asc">Nama (A-Z)</option>
              <option value="name-desc">Nama (Z-A)</option>
            </select>
          </div>
        </div>
      </div>


      {filteredAndSortedProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredAndSortedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-10">
          <i className="fas fa-search-minus text-5xl text-gray-400 mb-4"></i>
          <p className="text-xl text-gray-600">
            {searchTerm ? 'Produk tidak ditemukan.' : 'Tidak ada produk yang tersedia saat ini.'}
          </p>
          {searchTerm && <p className="text-gray-500">Coba kata kunci lain atau periksa kategori.</p>}
        </div>
      )}
    </div>
  );
};

export default HomePage;