
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import OnboardingPage from './pages/OnboardingPage';
import SignUpPage from './pages/SignUpPage';
import SignInPage from './pages/SignInPage';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import ManageUsersPage from './pages/admin/ManageUsersPage';
import ManageProductsPage from './pages/admin/ManageProductsPage';
import ManageOrdersPage from './pages/admin/ManageOrdersPage';
import ManagePromosPage from './pages/admin/ManagePromosPage';
import UserLayout from './pages/user/UserLayout';
import HomePage from './pages/user/HomePage';
import ProductDetailPage from './pages/user/ProductDetailPage';
import CartPage from './pages/user/CartPage';
import CheckoutPage from './pages/user/CheckoutPage';
import OrdersPage from './pages/user/OrdersPage';
import WalletPage from './pages/user/WalletPage';
import ProfilePage from './pages/user/ProfilePage';
import TransactionHistoryPage from './pages/user/TransactionHistoryPage';
import NotificationsPage from './pages/user/NotificationsPage';
import { WHATSAPP_CUSTOMER_SERVICE } from './constants';

interface ProtectedRouteProps {
  children: React.ReactNode;
  role?: 'admin' | 'user';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, role }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;
  }

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  if (role && user.role !== role) {
    // If specific role required and user doesn't have it, redirect appropriately
    // For simplicity, redirecting to user home or signin. A real app might have an "Unauthorized" page.
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/'} replace />;
  }

  return <>{children}</>;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <ProtectedRoute role="admin">{children}</ProtectedRoute>;
};

const UserRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <ProtectedRoute role="user">{children}</ProtectedRoute>;
};


const FloatingWhatsAppButton: React.FC = () => {
  return (
    <div className="fixed bottom-6 right-6 z-50 group">
      <a
        href={`https://wa.me/${WHATSAPP_CUSTOMER_SERVICE}`}
        target="_blank"
        rel="noopener noreferrer"
        className="bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-green-600 transition-all duration-300 hover:scale-110 flex items-center justify-center"
        aria-label="Chat via WhatsApp"
      >
        <i className="fab fa-whatsapp text-3xl"></i>
      </a>

      {/* Tooltip */}
      <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
        Butuh bantuan CS, klik
        <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
      </div>
    </div>
  );
};


const AppRoutes: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>;
  }

  return (
    <>
      <Routes>
        <Route path="/onboarding" element={user ? <Navigate to="/" /> : <OnboardingPage />} />
        <Route path="/signup" element={user ? <Navigate to="/" /> : <SignUpPage />} />
        <Route path="/signin" element={user ? <Navigate to="/" /> : <SignInPage />} />

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="users" element={<ManageUsersPage />} />
          <Route path="products" element={<ManageProductsPage />} />
          <Route path="orders" element={<ManageOrdersPage />} />
          <Route path="promos" element={<ManagePromosPage />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>

        {/* User Routes */}
        <Route path="/" element={<UserRoute><UserLayout /></UserRoute>}>
          <Route index element={<HomePage />} />
          <Route path="product/:productId" element={<ProductDetailPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="wallet" element={<WalletPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="transactions" element={<TransactionHistoryPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
        </Route>

        {/* Fallback redirect */}
        <Route path="*" element={<Navigate to={user ? (user.role === 'admin' ? '/admin/dashboard' : '/') : '/onboarding'} replace />} />
      </Routes>
      <FloatingWhatsAppButton />
    </>
  );
}

const App: React.FC = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </AuthProvider>
  );
};

export default App;
