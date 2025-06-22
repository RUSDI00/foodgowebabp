
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const AdminSidebar: React.FC = () => {
  const location = useLocation();
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    signOut();
    navigate('/signin');
  };

  const navItems = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: 'fas fa-tachometer-alt' },
    { name: 'Kelola Pengguna', path: '/admin/users', icon: 'fas fa-users-cog' },
    { name: 'Kelola Produk', path: '/admin/products', icon: 'fas fa-box-open' },
    { name: 'Kelola Pesanan', path: '/admin/orders', icon: 'fas fa-receipt' },
    { name: 'Kelola Promo', path: '/admin/promos', icon: 'fas fa-tags' },
    // { name: 'Laporan', path: '/admin/reports', icon: 'fas fa-chart-line' }, // Laporan bisa ditambahkan nanti
  ];

  return (
    <div className="w-64 h-screen bg-gray-800 text-white flex flex-col fixed top-0 left-0 shadow-lg">
      <div className="p-6 text-2xl font-semibold border-b border-gray-700">
        <Link to="/admin/dashboard">Admin Panel</Link>
      </div>
      <nav className="flex-grow p-4 space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            className={`flex items-center px-4 py-3 rounded-lg transition-colors duration-200 ease-in-out
                        ${location.pathname.startsWith(item.path) ? 'bg-primary-600 text-white' : 'hover:bg-gray-700 hover:text-white'}`}
          >
            <i className={`${item.icon} mr-3 w-5 text-center`}></i>
            {item.name}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-700">
        {user && (
            <div className="mb-4">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-gray-400">{user.email}</p>
            </div>
        )}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors duration-200"
        >
          <i className="fas fa-sign-out-alt mr-2"></i>
          Keluar
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;
