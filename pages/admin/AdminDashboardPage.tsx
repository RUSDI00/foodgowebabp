import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { apiClient } from '../../services/api';
import { Order, OrderStatus, Product } from '../../types';

const StatCard: React.FC<{ title: string; value: string | number; icon: string; color: string }> = ({ title, value, icon, color }) => (
  <div className={`bg-white p-6 rounded-xl shadow-lg border-l-4 ${color}`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        <p className="text-3xl font-bold text-gray-800">{value}</p>
      </div>
      <div className={`p-3 rounded-full bg-opacity-20 ${color.replace('border-l-4 border-', 'bg-')}`}>
        <i className={`${icon} text-2xl ${color.replace('border-l-4 border-', 'text-')}`}></i>
      </div>
    </div>
  </div>
);


const AdminDashboardPage: React.FC = () => {
  const [userCount, setUserCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [productCount, setProductCount] = useState(0);
  const [ordersByStatusData, setOrdersByStatusData] = useState<any[]>([]);
  const [topProductsData, setTopProductsData] = useState<any[]>([]);


  useEffect(() => {
    const fetchData = async () => {
      try {
        const users = await apiClient.getAllUsers();
        const orders = await apiClient.getAllOrders();
        const products = await apiClient.getProducts();

        setUserCount(users.length);
        setOrderCount(orders.length);
        setProductCount(products.length);

        const pending = orders.filter((o: Order) => o.status === OrderStatus.PROCESSING || o.status === OrderStatus.PENDING_PAYMENT).length;
        setPendingOrders(pending);

        // Data for charts
        const statusCounts = Object.values(OrderStatus).map(status => ({
          name: status,
          count: orders.filter((o: Order) => o.status === status).length
        })).filter(s => s.count > 0);
        setOrdersByStatusData(statusCounts);

        const productSales: { [key: string]: { name: string, sales: number } } = {};
        orders.forEach((order: Order) => {
          if (order.status === OrderStatus.DELIVERED || order.status === OrderStatus.SHIPPED) {
            order.items.forEach((item: any) => {
              if (!productSales[item.productId]) {
                const product = products.find((p: Product) => p.id === item.productId);
                productSales[item.productId] = { name: product ? product.name : 'Unknown Product', sales: 0 };
              }
              productSales[item.productId].sales += item.quantity * item.price;
            });
          }
        });
        const sortedTopProducts = Object.values(productSales)
          .sort((a, b) => b.sales - a.sales)
          .slice(0, 5); // Top 5 products by revenue
        setTopProductsData(sortedTopProducts);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      }
    };

    fetchData();
  }, []);

  const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold text-gray-800">Dashboard Admin</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Pengguna" value={userCount} icon="fas fa-users" color="border-blue-500" />
        <StatCard title="Total Pesanan" value={orderCount} icon="fas fa-receipt" color="border-green-500" />
        <StatCard title="Pesanan Pending" value={pendingOrders} icon="fas fa-hourglass-half" color="border-yellow-500" />
        <StatCard title="Total Produk" value={productCount} icon="fas fa-boxes" color="border-purple-500" />
        {/* <StatCard title="Total Pendapatan" value={`Rp ${totalRevenue.toLocaleString()}`} icon="fas fa-dollar-sign" color="border-teal-500" /> */}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Pesanan Berdasarkan Status</h2>
          {ordersByStatusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={ordersByStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {ordersByStatusData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `${value} pesanan`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-500">Belum ada data pesanan.</p>}
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Produk Terlaris (Berdasarkan Pendapatan)</h2>
          {topProductsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topProductsData} layout="vertical" margin={{ top: 5, right: 20, left: 100, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={(value) => `Rp ${value.toLocaleString()}`} />
                <YAxis dataKey="name" type="category" width={100} interval={0} />
                <Tooltip formatter={(value: number) => `Rp ${value.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="sales" fill="#82ca9d" name="Pendapatan" />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-500">Belum ada data penjualan produk.</p>}
        </div>
      </div>

      {/* Placeholder for Promo Settings - or link to ManagePromosPage */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Pengaturan Promo & Diskon</h2>
        <p className="text-gray-600">
          Kelola promosi dan diskon untuk meningkatkan penjualan. Anda dapat menambahkan, mengubah, atau menghapus promo.
        </p>
        <div className="mt-4">
          <a href="#/admin/promos" className="bg-primary-500 hover:bg-primary-600 text-white font-medium py-2 px-4 rounded-md transition-colors">
            Kelola Promo
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
