const API_BASE_URL = 'http://localhost:5000/api';

class ApiClient {
  private token: string | null = null;

  constructor() {
    // Try to get token from localStorage on initialization
    this.token = localStorage.getItem('token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      console.error(`API Error: ${response.status} ${response.statusText}`);
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      console.error('API Error details:', error);
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    // Handle empty responses (like 204 No Content)
    const text = await response.text();
    return text ? JSON.parse(text) : {} as T;
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const response = await this.request<{ data: { token: string; user: any } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(response.data.token);
    return response.data;
  }

  async register(email: string, password: string, name: string, phone?: string) {
    const response = await this.request<{ data: { token: string; user: any } }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, phone }),
    });
    this.setToken(response.data.token);
    return response.data;
  }

  async getCurrentUser() {
    const response = await this.request<{ data: { user: any } }>('/auth/me');
    return response.data.user;
  }

  // Profile endpoints
  async updateProfile(name: string, phone?: string) {
    const response = await this.request<{ data: { user: any } }>('/users/profile', {
      method: 'PUT',
      body: JSON.stringify({ name, phone }),
    });
    return response.data.user;
  }

  async changePassword(currentPassword: string, newPassword: string) {
    const response = await this.request<{ message: string }>('/users/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return response;
  }

  // Product endpoints
  async getProducts() {
    const response = await this.request<{ data: { products: any[] } }>('/products');
    return response.data.products;
  }

  async getProductById(id: string) {
    const response = await this.request<{ data: { product: any } }>(`/products/${id}`);
    return response.data.product;
  }

  async getProductsByCategory(category: string) {
    const response = await this.request<{ data: { products: any[] } }>(`/products/category/${category}`);
    return response.data.products;
  }

  async searchProducts(query: string) {
    const response = await this.request<{ data: { products: any[] } }>(`/products/search?q=${encodeURIComponent(query)}`);
    return response.data.products;
  }

  async createProduct(product: any) {
    const response = await this.request<{ data: { product: any } }>('/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
    return response.data.product;
  }

  async updateProduct(id: string, product: any) {
    const response = await this.request<{ data: { product: any } }>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product),
    });
    return response.data.product;
  }

  async deleteProduct(id: string) {
    await this.request(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  // Cart endpoints
  async getCart() {
    const response = await this.request<{ data: { cartItems: any[] } }>('/cart');
    return response.data.cartItems;
  }

  async addToCart(productId: string, quantity: number) {
    await this.request('/cart/add', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity }),
    });
  }

  async updateCartItem(productId: string, quantity: number) {
    await this.request(`/cart/item/${productId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
  }

  async removeFromCart(productId: string) {
    await this.request(`/cart/item/${productId}`, {
      method: 'DELETE',
    });
  }

  async clearCart() {
    await this.request('/cart/clear', {
      method: 'DELETE',
    });
  }

  // User management endpoints (admin only)
  async getAllUsers() {
    const response = await this.request<{ data: { users: any[] } }>('/users');
    return response.data.users;
  }

  async getUserById(id: string) {
    const response = await this.request<{ data: { user: any } }>(`/users/${id}`);
    return response.data.user;
  }

  async updateUser(id: string, userData: any) {
    const response = await this.request<{ data: { user: any } }>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
    return response.data.user;
  }

  async deleteUser(id: string) {
    await this.request(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Order endpoints
  async createOrder(shippingAddress: string, paymentMethod: string) {
    const response = await this.request<{ data: { order: any } }>('/orders', {
      method: 'POST',
      body: JSON.stringify({ shippingAddress, paymentMethod }),
    });
    return response.data.order;
  }

  async getUserOrders() {
    const response = await this.request<{ data: { orders: any[] } }>('/orders/my-orders');
    return response.data.orders;
  }

  async getAllOrders() {
    const response = await this.request<{ data: { orders: any[] } }>('/orders');
    return response.data.orders;
  }

  async updateOrderStatus(orderId: string, status: string) {
    const response = await this.request<{ data: { order: any } }>(`/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
    return response.data.order;
  }

  async cancelOrder(orderId: string) {
    const response = await this.request<{ data: { order: any } }>(`/orders/${orderId}/cancel`, {
      method: 'PUT',
    });
    return response.data.order;
  }

  // Wallet endpoints
  async getWallet() {
    const response = await this.request<{ data: { wallet: any } }>('/wallet');
    return response.data.wallet;
  }

  async topUpWallet(amount: number, method: string) {
    const response = await this.request<{ data: { wallet: any; message: string } }>('/wallet/topup', {
      method: 'POST',
      body: JSON.stringify({ amount, method }),
    });
    return response.data;
  }

  async getWalletTransactions() {
    const response = await this.request<{ data: { transactions: any[] } }>('/wallet/transactions');
    return response.data.transactions;
  }
}

export const apiClient = new ApiClient(); 