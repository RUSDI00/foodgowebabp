
import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../../components/Navbar';

const Footer: React.FC = () => (
  <footer className="bg-gray-800 text-white py-8 mt-auto">
    <div className="container mx-auto px-4 text-center">
      <p>&copy; {new Date().getFullYear()} FoodGo. Semua hak dilindungi.</p>
      <p className="text-sm text-gray-400 mt-1">Belanja Mudah, Aman, dan Menyenangkan.</p>
    </div>
  </footer>
);

const UserLayout: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default UserLayout;