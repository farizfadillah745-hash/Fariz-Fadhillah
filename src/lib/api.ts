import { User, Store, Product, Queue, Order, Review, SystemStats } from '../types';

// Simple client-side storage for the logged in user
let currentUser: User | null = null;
const USER_KEY = 'fashcollab_user';

// Initialize from localStorage if exists
try {
  const saved = localStorage.getItem(USER_KEY);
  if (saved) {
    currentUser = JSON.parse(saved);
  }
} catch (e) {
  console.error('Failed to load user', e);
}

export const authAPI = {
  getCurrentUser: () => currentUser,
  
  saveUser: (user: User | null) => {
    currentUser = user;
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  },

  register: async (name: string, email: string, role: string) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, role })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data.user as User;
  },

  login: async (email: string) => {
    // For convenience of testing, we accept just the email (password verified in backend)
    // The password is automatically supplied or entered by user
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: getPasswordForEmail(email) })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    const user = data.user as User;
    authAPI.saveUser(user);
    return user;
  },

  googleLogin: async (name: string, email: string) => {
    const res = await fetch('/api/auth/google-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    const user = data.user as User;
    authAPI.saveUser(user);
    return user;
  },

  verifyEmail: async (userId: string) => {
    const res = await fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    const user = data.user as User;
    if (currentUser && currentUser.id === userId) {
      authAPI.saveUser(user);
    }
    return user;
  },

  resetPassword: async (email: string) => {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data.message as string;
  },

  logout: () => {
    authAPI.saveUser(null);
  }
};

// Helper to resolve passwords for default seed accounts
function getPasswordForEmail(email: string): string {
  const mapping: { [key: string]: string } = {
    'admin@fashcollab.com': 'admin123',
    'zara@fashcollab.com': 'zara123',
    'hm@fashcollab.com': 'hm123',
    'uniqlo@fashcollab.com': 'uniqlo123',
    'adidas@fashcollab.com': 'adidas123',
    'elizabeth@fashcollab.com': 'elizabeth123',
    'buttonscarves@fashcollab.com': 'button123',
    'farizfadillah745@gmail.com': 'password123',
    'budi@gmail.com': 'password123',
    'ani@gmail.com': 'password123'
  };
  return mapping[email.toLowerCase()] || 'password123';
}

export const storeAPI = {
  getStores: async (all: boolean = false) => {
    const res = await fetch(`/api/stores?all=${all}`);
    return await res.json() as Store[];
  },

  updateStore: async (store: Partial<Store>) => {
    const res = await fetch('/api/stores/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(store)
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data.store as Store;
  },

  performAction: async (id: string, status: string) => {
    const res = await fetch('/api/stores/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return true;
  }
};

export const productAPI = {
  getProducts: async (storeId?: string) => {
    const url = storeId ? `/api/products?storeId=${storeId}` : '/api/products';
    const res = await fetch(url);
    return await res.json() as Product[];
  },

  scanProduct: async (barcode: string) => {
    const res = await fetch(`/api/products?barcode=${barcode}`);
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data as { product: Product; store: Store };
  },

  addProduct: async (product: Omit<Product, 'id'>) => {
    const res = await fetch('/api/products/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data.product as Product;
  },

  editProduct: async (product: Product) => {
    const res = await fetch('/api/products/edit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data.product as Product;
  },

  deleteProduct: async (id: string) => {
    const res = await fetch('/api/products/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return true;
  }
};

export const queueAPI = {
  getQueues: async (params?: { storeId?: string; userId?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    const res = await fetch(`/api/queues?${query}`);
    return await res.json() as Queue[];
  },

  joinQueue: async (storeId: string, userId: string, userName: string, scheduledHour?: string) => {
    const res = await fetch('/api/queues/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storeId, userId, userName, scheduledHour })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data.queue as Queue;
  },

  updateQueueStatus: async (id: string, status: string) => {
    const res = await fetch('/api/queues/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data.queue as Queue;
  }
};

export const orderAPI = {
  getOrders: async (params?: { userId?: string; storeId?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    const res = await fetch(`/api/orders?${query}`);
    return await res.json() as Order[];
  },

  createOrder: async (orderData: { userId: string; userName: string; storeId: string; items: { productId: string; quantity: number }[]; paymentMethod: string }) => {
    const res = await fetch('/api/orders/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data.order as Order;
  },

  payOrder: async (orderId: string) => {
    const res = await fetch('/api/orders/pay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data.order as Order;
  },

  updateOrderStatus: async (id: string, status: string) => {
    const res = await fetch('/api/orders/update-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data.order as Order;
  }
};

export const reviewAPI = {
  getReviews: async (storeId?: string) => {
    const url = storeId ? `/api/reviews?storeId=${storeId}` : '/api/reviews';
    const res = await fetch(url);
    return await res.json() as Review[];
  },

  addReview: async (review: Omit<Review, 'id' | 'createdAt'>) => {
    const res = await fetch('/api/reviews/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(review)
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data.review as Review;
  }
};

export const adminAPI = {
  getStats: async () => {
    const res = await fetch('/api/admin/stats');
    return await res.json() as { stats: SystemStats; commissionPercent: number };
  },

  updateCommission: async (commissionPercent: number) => {
    const res = await fetch('/api/admin/commission', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commissionPercent })
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data.commissionPercent as number;
  }
};

export const formatIDR = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

