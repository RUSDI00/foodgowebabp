
import React from 'react';
import { Link } from 'react-router-dom';

const OnboardingPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary-500 to-secondary-500 p-4">
      <div className="bg-white shadow-2xl rounded-xl p-8 md:p-12 text-center max-w-lg w-full transform transition-all hover:scale-105 duration-500">
        <h1 className="text-4xl md:text-5xl font-bold text-primary-700 mb-4">
          Selamat Datang di Food<span className="text-secondary-600">Go</span>!
        </h1>
        <p className="text-gray-600 text-lg mb-8">
          Temukan berbagai produk berkualitas dengan harga terbaik. Belanja mudah, aman, dan menyenangkan.
        </p>
        <div className="space-y-4 md:space-y-0 md:space-x-4">
          <Link
            to="/signup"
            className="w-full md:w-auto inline-block bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-8 rounded-lg shadow-md transition-transform transform hover:scale-105 duration-300 text-lg"
          >
            Daftar Sekarang
          </Link>
          <Link
            to="/signin"
            className="w-full md:w-auto inline-block bg-secondary-500 hover:bg-secondary-600 text-white font-semibold py-3 px-8 rounded-lg shadow-md transition-transform transform hover:scale-105 duration-300 text-lg"
          >
            Masuk
          </Link>
        </div>
        <p className="mt-8 text-sm text-gray-500">
          🎉 Bergabunglah dengan ribuan pengguna yang sudah merasakan kemudahan berbelanja di FoodGo!
        </p>
      </div>
      <footer className="mt-12 text-center text-white text-opacity-80">
        <p>&copy; {new Date().getFullYear()} FoodGo. Semua hak dilindungi.</p>
      </footer>
    </div>
  );
};

export default OnboardingPage;