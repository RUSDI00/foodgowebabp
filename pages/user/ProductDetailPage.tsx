import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { Product, Review as ReviewType } from '../../types';
import * as productService from '../../services/productService';
import { apiClient } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../../components/LoadingSpinner';
import StarRatingInput from '../../components/StarRatingInput';
import StarRatingDisplay from '../../components/StarRatingDisplay';
import { useSnackbar } from '../../hooks/useSnackbar';
import Snackbar from '../../components/Snackbar';

const ProductDetailPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { snackbar, showSuccess, showError, showWarning, hideSnackbar } = useSnackbar();

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<ReviewType[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [quantity, setQuantity] = useState(1);
  const [userRating, setUserRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

  const canReview = user && reviews.every(r => r.userId !== user.id); // User has not reviewed yet

  const fetchProductData = useCallback(async () => {
    if (!productId) {
      setError('ID Produk tidak valid.');
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const fetchedProduct = await productService.getProductById(productId);
      if (fetchedProduct) {
        setProduct(fetchedProduct);
        const fetchedReviews = productService.getProductReviews(productId);
        setReviews(fetchedReviews);
        setAverageRating(productService.getProductAverageRating(productId));
      } else {
        setError('Produk tidak ditemukan.');
      }
    } catch (err) {
      console.error("Error fetching product details:", err);
      setError('Gagal memuat detail produk.');
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchProductData();
  }, [fetchProductData]);



  const handleAddToCart = async () => {
    if (!product || !user) {
      showError('Silakan masuk untuk menambahkan produk ke keranjang.');
      setTimeout(() => navigate('/signin', { state: { from: location } }), 1500);
      return;
    }
    if (product.stock === 0) {
      showError('Maaf, produk ini sedang habis.');
      return;
    }
    if (quantity > product.stock) {
      showWarning(`Stok tidak mencukupi. Stok tersedia: ${product.stock}`);
      setQuantity(product.stock);
      return;
    }
    setAddingToCart(true);
    try {
      await apiClient.addToCart(product.id, quantity);
      showSuccess(`${product.name} (x${quantity}) berhasil ditambahkan ke keranjang!`);
      setTimeout(() => navigate('/cart'), 2000);
    } catch (error) {
      console.error('Failed to add to cart:', error);
      showError(error instanceof Error ? error.message : 'Gagal menambahkan ke keranjang. Silakan coba lagi.');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !product || userRating === 0 || !reviewText.trim()) {
      showError('Mohon berikan rating dan isi ulasan Anda.');
      return;
    }

    // Ensure we have a proper user name
    const userName = user.name && user.name.trim() !== '' ? user.name : user.email.split('@')[0];

    setSubmittingReview(true);
    try {
      await productService.addProductReview(product.id, user.id, userName, userRating, reviewText.trim());

      // Force refresh reviews and rating immediately FIRST
      const productReviews = productService.getProductReviews(product.id);
      setReviews(productReviews);

      // Calculate fresh average rating
      const avgRating = productService.getProductAverageRating(product.id);
      setAverageRating(avgRating);

      // Force a second update after a brief delay to ensure UI refresh
      setTimeout(() => {
        const finalReviews = productService.getProductReviews(product.id);
        const finalRating = productService.getProductAverageRating(product.id);
        setReviews(finalReviews);
        setAverageRating(finalRating);
      }, 100);

      // Clear form AFTER updating display
      setUserRating(0);
      setReviewText('');

      showSuccess('Ulasan Anda berhasil dikirim!');
    } catch (err) {
      console.error('Failed to submit review:', err);
      showError('Gagal mengirim ulasan. Silakan coba lagi.');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return <LoadingSpinner text="Memuat detail produk..." />;
  if (error) return <div className="text-center text-red-500 bg-red-100 p-4 rounded-md">{error}</div>;
  if (!product) return <div className="text-center text-gray-600">Produk tidak ditemukan.</div>;

  return (
    <>
      <div className="bg-white shadow-xl rounded-lg p-6 md:p-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Product Image */}
          <div>
            <img
              src={product.imageUrl || `https://picsum.photos/seed/${product.id}/600/400`}
              alt={product.name}
              className="w-full h-auto max-h-[500px] object-contain rounded-lg shadow-md"
            />
          </div>

          {/* Product Details */}
          <div className="flex flex-col">
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-2">{product.name}</h1>
            <p className="text-gray-500 text-sm mb-3">Kategori: {product.category}</p>

            <div className="flex items-center mb-4">
              <StarRatingDisplay key={`rating-${reviews.length}-${averageRating}`} rating={averageRating} size="md" />
              <span className="ml-2 text-gray-600">({reviews.length} ulasan)</span>
            </div>

            <p className="text-3xl font-bold text-primary-600 mb-4">
              Rp {product.price.toLocaleString()}
            </p>

            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-700 mb-1">Deskripsi Produk:</h3>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">{product.description}</p>
            </div>

            <p className={`font-medium mb-4 ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
              {product.stock > 0 ? `Stok Tersedia: ${product.stock}` : 'Stok Habis'}
            </p>

            {product.stock > 0 && (
              <div className="flex items-center space-x-3 mb-6">
                <label htmlFor="quantity" className="font-medium text-gray-700">Jumlah:</label>
                <input
                  type="number"
                  id="quantity"
                  name="quantity"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Math.min(parseInt(e.target.value) || 1, product.stock)))}
                  min="1"
                  max={product.stock}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            )}

            <div className="mt-auto">
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0 || addingToCart}
                className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-colors duration-300 flex items-center justify-center
                            ${product.stock > 0 ? 'bg-primary-600 hover:bg-primary-700' : 'bg-gray-400 cursor-not-allowed'}
                            ${addingToCart ? 'opacity-70' : ''}`}
              >
                <i className="fas fa-cart-plus mr-2"></i>
                {addingToCart ? 'Menambahkan...' : (product.stock > 0 ? 'Tambah ke Keranjang' : 'Stok Habis')}
              </button>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Ulasan Produk ({reviews.length})</h2>

          {/* Review Form */}
          {user && canReview && (
            <div className="mb-8 p-6 bg-gray-50 rounded-lg shadow">
              <h3 className="text-xl font-semibold text-gray-700 mb-3">Tulis Ulasan Anda</h3>
              <p className="text-sm text-gray-500 mb-3">Login sebagai: <strong>{user.name || user.email}</strong></p>
              <form onSubmit={handleReviewSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rating Anda: ({userRating}/5)</label>
                  <StarRatingInput rating={userRating} setRating={setUserRating} />
                </div>
                <div className="mb-4">
                  <label htmlFor="reviewText" className="block text-sm font-medium text-gray-700 mb-1">Ulasan Anda:</label>
                  <textarea
                    id="reviewText"
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    rows={4}
                    required
                    className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    placeholder={`Bagaimana pendapat Anda tentang ${product.name}?`}
                  ></textarea>
                </div>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="py-2 px-5 bg-secondary-500 hover:bg-secondary-600 text-white font-semibold rounded-lg transition-colors duration-300 disabled:opacity-70"
                >
                  {submittingReview ? 'Mengirim...' : 'Kirim Ulasan'}
                </button>
              </form>
            </div>
          )}
          {!user && <p className="mb-6 text-gray-600"><Link to="/signin" state={{ from: location }} className="text-primary-600 hover:underline">Masuk</Link> untuk menulis ulasan.</p>}
          {user && !canReview && <p className="mb-6 text-gray-600 italic">Anda sudah memberikan ulasan untuk produk ini.</p>}

          {/* Display Reviews */}
          {reviews.length > 0 ? (
            <div className="space-y-6">
              {reviews.map(review => (
                <div key={review.id} className="p-4 border border-gray-200 rounded-lg shadow-sm bg-white">
                  <div className="flex items-center mb-2">
                    <StarRatingDisplay rating={review.rating} size="sm" />
                    <span className="ml-3 font-semibold text-gray-700">{review.userName}</span>
                  </div>
                  <p className="text-gray-600 whitespace-pre-line">{review.text}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(review.createdAt).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Belum ada ulasan untuk produk ini.</p>
          )}
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

export default ProductDetailPage;
