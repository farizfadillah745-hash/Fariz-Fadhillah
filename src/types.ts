export type UserRole = 'customer' | 'store_owner' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isEmailVerified: boolean;
  storeId?: string;
}

export type StoreStatus = 'pending' | 'approved' | 'suspended';

export interface Store {
  id: string;
  name: string;
  ownerId: string;
  city: string;
  province: string;
  address: string;
  category: 'baju' | 'sepatu' | 'aksesori' | 'all';
  status: StoreStatus;
  description: string;
  logo: string;
  queueQuotaPerHour: number;
  avgServiceTimeMinutes: number;
  currentQueueCount: number;
  rating: number;
  reviewCount: number;
  latitude?: number;
  longitude?: number;
  openingHours?: {
    monday?: string;
    tuesday?: string;
    wednesday?: string;
    thursday?: string;
    friday?: string;
    saturday?: string;
    sunday?: string;
  };
  isOpen?: boolean;
}

export type ProductCategory = 'baju' | 'sepatu' | 'aksesori';

export interface Product {
  id: string;
  storeId: string;
  name: string;
  category: ProductCategory;
  price: number;
  stock: number;
  image: string;
  barcode: string;
}

export type QueueStatus = 'waiting' | 'checked-in' | 'served' | 'completed' | 'cancelled';

export interface Queue {
  id: string;
  storeId: string;
  storeName: string;
  userId: string;
  userName: string;
  queueNumber: string;
  status: QueueStatus;
  scheduledHour: string; // e.g. "10:00 - 11:00"
  date: string; // YYYY-MM-DD
  createdAt: string;
  checkInTime?: string;
  estimatedWaitMinutes: number;
}

export type OrderStatus = 'pending' | 'paid' | 'processing' | 'ready' | 'completed';

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  category: ProductCategory;
}

export interface Order {
  id: string;
  userId: string;
  userName: string;
  storeId: string;
  storeName: string;
  items: OrderItem[];
  subtotal: number;
  commission: number;
  total: number;
  paymentMethod: 'va' | 'qris' | 'cc';
  paymentStatus: OrderStatus;
  vaNumber?: string;
  qrisUrl?: string;
  createdAt: string;
}

export interface Review {
  id: string;
  storeId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface SystemStats {
  totalSales: number;
  totalCommission: number;
  totalTransactions: number;
  totalStores: number;
  totalQueues: number;
  salesByDate: { date: string; amount: number; commission: number }[];
  salesByCategory: { category: string; amount: number }[];
}
