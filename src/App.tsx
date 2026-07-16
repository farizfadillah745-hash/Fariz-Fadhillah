import React, { useState, useEffect, useMemo } from 'react';
import { 
  User, Store, Product, Queue, Order, Review, SystemStats, UserRole 
} from './types';
import { 
  authAPI, storeAPI, productAPI, queueAPI, orderAPI, reviewAPI, adminAPI 
} from './lib/api';
import { MapLocator } from './components/MapLocator';
import { QRScanner } from './components/QRScanner';
import { NotificationCenter } from './components/NotificationCenter';
import { AuthForm } from './components/AuthForm';
import { OwnerDashboard } from './components/OwnerDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { formatIDR } from './components/Charts';
import { 
  MapPin, Search, Navigation, Clock, Star, User as UserIcon, Store as StoreIcon, 
  ShoppingCart, Shield, Settings, LogOut, RefreshCw, FileText, CheckCircle2, 
  AlertCircle, Menu, X, Sparkles, Send 
} from 'lucide-react';

export default function App() {
  // Current user state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Navigation tabs depending on roles
  const [activeTab, setActiveTab] = useState<string>('home'); // customer: home, queue, scan-go, purchases
  
  // Auth Form states
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);

  // Global data states
  const [stores, setStores] = useState<Store[]>([]);
  const [customerActiveQueues, setCustomerActiveQueues] = useState<Queue[]>([]);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [selectedStoreProducts, setSelectedStoreProducts] = useState<Product[]>([]);
  const [selectedStoreReviews, setSelectedStoreReviews] = useState<Review[]>([]);
  const [isJoinQueueModalOpen, setIsJoinQueueModalOpen] = useState(false);
  const [selectedHourSlot, setSelectedHourSlot] = useState('10:00 - 11:00');

  // Customer Scan & Go Cart state
  const [cart, setCart] = useState<{ product: Product; quantity: number; store: Store }[]>([]);
  const [checkoutOrder, setCheckoutOrder] = useState<Order | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'va' | 'qris' | 'cc'>('va');
  const [activePaymentOrder, setActivePaymentOrder] = useState<Order | null>(null);

  // Store Owner Dashboard state
  const [ownerStore, setOwnerStore] = useState<Store | null>(null);
  const [ownerProducts, setOwnerProducts] = useState<Product[]>([]);
  const [ownerQueues, setOwnerQueues] = useState<Queue[]>([]);
  const [ownerOrders, setOwnerOrders] = useState<Order[]>([]);
  const [ownerReports, setOwnerReports] = useState<{ dailySales: any[]; categorySales: any[]; totalRevenue: number; totalCompletedQueues: number } | null>(null);

  // Admin Dashboard state
  const [adminStores, setAdminStores] = useState<Store[]>([]);
  const [adminStats, setAdminStats] = useState<SystemStats | null>(null);
  const [allTransactions, setAllTransactions] = useState<Order[]>([]);
  const [commissionPercent, setCommissionPercent] = useState<number>(5);

  // Mobile menu toggle
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Review Input State
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewStoreId, setReviewStoreId] = useState('');

  // Initial load
  useEffect(() => {
    const user = authAPI.getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
    refreshGlobalData();
  }, []);

  // Refresh global data
  const refreshGlobalData = async () => {
    try {
      const allStores = await storeAPI.getStores(true); // Get all including pending
      setStores(allStores.filter(s => s.status === 'approved'));
      setAdminStores(allStores);

      if (currentUser) {
        if (currentUser.role === 'customer') {
          const queues = await queueAPI.getQueues({ userId: currentUser.id });
          setCustomerActiveQueues(queues.filter(q => ['waiting', 'checked-in', 'served'].includes(q.status)));
          
          const orders = await orderAPI.getOrders({ userId: currentUser.id });
          setCustomerOrders(orders);
          // Check if any order is pending payment
          const pendingPay = orders.find(o => o.paymentStatus === 'pending');
          if (pendingPay) {
            setActivePaymentOrder(pendingPay);
          }
        } else if (currentUser.role === 'store_owner' && currentUser.storeId) {
          const matchedStore = allStores.find(s => s.id === currentUser.storeId);
          if (matchedStore) {
            setOwnerStore(matchedStore);
            // Fetch products, queues, orders for this store
            const p = await productAPI.getProducts(matchedStore.id);
            setOwnerProducts(p);
            
            const q = await queueAPI.getQueues({ storeId: matchedStore.id });
            setOwnerQueues(q);
            
            const ords = await orderAPI.getOrders({ storeId: matchedStore.id });
            setOwnerOrders(ords);

            // Compute store owner statistics reports
            const completedOrds = ords.filter(o => o.paymentStatus !== 'pending');
            const totalRev = completedOrds.reduce((sum, o) => sum + o.subtotal, 0);
            
            // Group by daily
            const daysMap: { [key: string]: number } = {};
            completedOrds.forEach(o => {
              const day = o.createdAt.split('T')[0];
              daysMap[day] = (daysMap[day] || 0) + o.subtotal;
            });
            const dailySales = Object.keys(daysMap).sort().map(day => ({
              date: day,
              amount: daysMap[day]
            }));

            // Group by category
            const catsMap: { [key: string]: number } = { baju: 0, sepatu: 0, aksesori: 0 };
            completedOrds.forEach(o => {
              o.items.forEach(item => {
                catsMap[item.category] = (catsMap[item.category] || 0) + (item.price * item.quantity);
              });
            });
            const categorySales = Object.keys(catsMap).map(c => ({
              category: c,
              amount: catsMap[c]
            }));

            setOwnerReports({
              dailySales,
              categorySales,
              totalRevenue: totalRev,
              totalCompletedQueues: q.filter(que => que.status === 'completed').length
            });
          }
        } else if (currentUser.role === 'admin') {
          const statsRes = await adminAPI.getStats();
          setAdminStats(statsRes.stats);
          setCommissionPercent(statsRes.commissionPercent);
          
          const orders = await orderAPI.getOrders();
          setAllTransactions(orders);
        }
      }
    } catch (e) {
      console.error("Failed to load global application states", e);
    }
  };

  // Trigger load when current user changes
  useEffect(() => {
    refreshGlobalData();
    // Default tabs depending on role
    if (currentUser) {
      if (currentUser.role === 'customer') {
        setActiveTab('home');
      } else if (currentUser.role === 'store_owner') {
        setActiveTab('queues');
      } else if (currentUser.role === 'admin') {
        setActiveTab('stores');
      }
    }
  }, [currentUser]);

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    setCart([]);
    setCheckoutOrder(null);
    setActivePaymentOrder(null);
  };

  const handleLogout = () => {
    authAPI.logout();
    setCurrentUser(null);
    setCart([]);
    setCheckoutOrder(null);
    setActivePaymentOrder(null);
    setActiveTab('home');
    setIsMobileMenuOpen(false);
  };

  // Switch role helper for testing
  const handleQuickSwitchRole = async (targetRole: UserRole) => {
    let email = '';
    if (targetRole === 'admin') email = 'admin@fashcollab.com';
    else if (targetRole === 'store_owner') email = 'zara@fashcollab.com';
    else email = 'farizfadillah745@gmail.com';

    try {
      const user = await authAPI.login(email);
      setCurrentUser(user);
      setCart([]);
      setCheckoutOrder(null);
      setActivePaymentOrder(null);
    } catch (e) {
      console.error(e);
    }
  };

  // Customer Queuing functions
  const openJoinQueue = async (store: Store) => {
    setSelectedStore(store);
    try {
      const prods = await productAPI.getProducts(store.id);
      setSelectedStoreProducts(prods);
      const revs = await reviewAPI.getReviews(store.id);
      setSelectedStoreReviews(revs);
      setIsJoinQueueModalOpen(true);
    } catch (e) {
      console.error(e);
    }
  };

  const handleJoinQueueSubmit = async () => {
    if (!currentUser || !selectedStore) return;
    try {
      await queueAPI.joinQueue(selectedStore.id, currentUser.id, currentUser.name, selectedHourSlot);
      setIsJoinQueueModalOpen(false);
      setActiveTab('queue');
      refreshGlobalData();
    } catch (err: any) {
      alert(err.message || "Gagal mengambil nomor antrian.");
    }
  };

  const handleQueueCheckInSimulate = async (queueId: string) => {
    try {
      await queueAPI.updateQueueStatus(queueId, 'checked-in');
      refreshGlobalData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCancelQueueSimulate = async (queueId: string) => {
    if (!confirm("Apakah Anda yakin ingin membatalkan antrian virtual ini?")) return;
    try {
      await queueAPI.updateQueueStatus(queueId, 'cancelled');
      refreshGlobalData();
    } catch (e) {
      console.error(e);
    }
  };

  // Scan & Go / Shopping Cart functions
  const handleProductScannedSuccess = (product: Product, store: Store) => {
    // Add product to cart
    setCart((prev) => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1, store }];
    });
    setActiveTab('scan-go');
  };

  const updateCartQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev.map(item => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          // Check stock limit
          if (newQty > item.product.stock) {
            alert(`Stok produk ${item.product.name} tidak mencukupi.`);
            return item;
          }
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(Boolean) as any;
    });
  };

  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  }, [cart]);

  const cartCommission = useMemo(() => {
    return Math.round((cartSubtotal * 5) / 100);
  }, [cartSubtotal]);

  const cartTotal = cartSubtotal + cartCommission;

  const handleCheckout = async () => {
    if (!currentUser || cart.length === 0) return;
    
    const storeId = cart[0].store.id;
    const multiStore = cart.some(item => item.store.id !== storeId);
    if (multiStore) {
      alert("Untuk sistem antrian terintegrasi, harap checkout produk dari 1 toko fisik saja dalam satu pesanan.");
      return;
    }

    try {
      const items = cart.map(item => ({
        productId: item.product.id,
        quantity: item.quantity
      }));
      const order = await orderAPI.createOrder({
        userId: currentUser.id,
        userName: currentUser.name,
        storeId,
        items,
        paymentMethod
      });
      setCheckoutOrder(order);
      setActivePaymentOrder(order);
      setCart([]); // Clear cart
      refreshGlobalData();
    } catch (err: any) {
      alert(err.message || "Gagal memproses checkout.");
    }
  };

  const handlePaymentConfirmSimulate = async () => {
    if (!activePaymentOrder) return;
    try {
      await orderAPI.payOrder(activePaymentOrder.id);
      setActivePaymentOrder(null);
      setCheckoutOrder(null);
      setActiveTab('purchases');
      refreshGlobalData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !reviewComment || !reviewStoreId) return;

    try {
      await reviewAPI.addReview({
        storeId: reviewStoreId,
        userId: currentUser.id,
        userName: currentUser.name,
        rating: reviewRating,
        comment: reviewComment
      });
      setReviewComment('');
      setReviewStoreId('');
      refreshGlobalData();
      alert("Terima kasih atas ulasan Anda!");
    } catch (e) {
      console.error(e);
    }
  };

  const handleVerifyEmailInstant = async () => {
    if (!currentUser) return;
    try {
      const updated = await authAPI.verifyEmail(currentUser.id);
      setCurrentUser(updated);
      alert("Email Anda berhasil diverifikasi secara instan!");
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      
      {/* Top Testing Peran switchers bar */}
      <div className="bg-slate-900 text-white text-[11px] px-4 py-2 flex flex-wrap justify-between items-center gap-2 border-b border-slate-800">
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span><strong>FashCollab Sandboxed Environment</strong></span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-300">Hubungkan Toko Fisik dengan Belanja Scan & Go</span>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-semibold">Simulasi Peran Uji:</span>
          <button
            onClick={() => handleQuickSwitchRole('customer')}
            className={`px-2 py-0.5 rounded transition-all font-bold ${
              currentUser?.role === 'customer' 
                ? 'bg-emerald-500 text-slate-950 shadow-sm' 
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            Pelanggan (Fariz)
          </button>
          <button
            onClick={() => handleQuickSwitchRole('store_owner')}
            className={`px-2 py-0.5 rounded transition-all font-bold ${
              currentUser?.role === 'store_owner' 
                ? 'bg-emerald-500 text-slate-950 shadow-sm' 
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            Zara Manager
          </button>
          <button
            onClick={() => handleQuickSwitchRole('admin')}
            className={`px-2 py-0.5 rounded transition-all font-bold ${
              currentUser?.role === 'admin' 
                ? 'bg-emerald-500 text-slate-950 shadow-sm' 
                : 'bg-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            Super Admin
          </button>
        </div>
      </div>

      {/* Main App Navigation Bar */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600 text-white p-2.5 rounded-xl flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 fill-current animate-pulse" />
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight text-slate-900 leading-none">FashCollab</h1>
              <span className="text-[10px] font-bold text-emerald-600 tracking-widest uppercase">Fashion Collab Platform</span>
            </div>
          </div>

          {/* Desktop Nav Actions */}
          <div className="hidden md:flex items-center gap-6">
            {currentUser && currentUser.role === 'customer' && (
              <nav className="flex items-center gap-5 text-xs font-bold text-slate-600">
                <button 
                  onClick={() => setActiveTab('home')} 
                  className={`py-2 border-b-2 transition-colors ${activeTab === 'home' ? 'text-emerald-600 border-emerald-500' : 'border-transparent hover:text-emerald-500'}`}
                >
                  Cari Toko & Map
                </button>
                <button 
                  onClick={() => setActiveTab('queue')} 
                  className={`py-2 border-b-2 transition-colors relative ${activeTab === 'queue' ? 'text-emerald-600 border-emerald-500' : 'border-transparent hover:text-emerald-500'}`}
                >
                  Antrian Saya
                  {customerActiveQueues.length > 0 && (
                    <span className="absolute -top-1 -right-2 w-2 h-2 rounded-full bg-emerald-500"></span>
                  )}
                </button>
                <button 
                  onClick={() => setActiveTab('scan-go')} 
                  className={`py-2 border-b-2 transition-colors flex items-center gap-1 ${activeTab === 'scan-go' ? 'text-emerald-600 border-emerald-500' : 'border-transparent hover:text-emerald-500'}`}
                  id="scan-go-tab"
                >
                  Scan & Go
                  {cart.length > 0 && (
                    <span className="bg-rose-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-extrabold">{cart.length}</span>
                  )}
                </button>
                <button 
                  onClick={() => setActiveTab('purchases')} 
                  className={`py-2 border-b-2 transition-colors ${activeTab === 'purchases' ? 'text-emerald-600 border-emerald-500' : 'border-transparent hover:text-emerald-500'}`}
                >
                  Riwayat Belanja
                </button>
              </nav>
            )}

            {/* Notification and User Actions */}
            {currentUser ? (
              <div className="flex items-center gap-4 border-l border-slate-100 pl-4">
                
                <NotificationCenter activeQueues={customerActiveQueues} />

                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold flex items-center justify-center border border-emerald-200">
                    {currentUser.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-slate-800 truncate max-w-[100px]">{currentUser.name}</span>
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-600 leading-none">{currentUser.role}</span>
                  </div>
                </div>

                <button 
                  onClick={handleLogout}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setActiveTab('auth')}
                  className="text-xs font-bold text-slate-600 hover:text-emerald-600 transition-colors"
                >
                  Masuk / Daftar
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu toggle */}
          <div className="flex md:hidden items-center gap-3">
            {currentUser && <NotificationCenter activeQueues={customerActiveQueues} />}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-50 transition-all"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-100 px-4 py-3 flex flex-col gap-3 z-20 shadow-md">
          {currentUser && currentUser.role === 'customer' && (
            <div className="flex flex-col gap-2 font-bold text-xs text-slate-600">
              <button onClick={() => { setActiveTab('home'); setIsMobileMenuOpen(false); }} className="p-2 rounded text-left">Cari Toko & Map</button>
              <button onClick={() => { setActiveTab('queue'); setIsMobileMenuOpen(false); }} className="p-2 rounded text-left">Antrian Saya</button>
              <button onClick={() => { setActiveTab('scan-go'); setIsMobileMenuOpen(false); }} className="p-2 rounded text-left">Scan & Go</button>
              <button onClick={() => { setActiveTab('purchases'); setIsMobileMenuOpen(false); }} className="p-2 rounded text-left">Riwayat Belanja</button>
            </div>
          )}

          {currentUser ? (
            <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-bold">{currentUser.name}</span>
              <button onClick={handleLogout} className="text-rose-600 font-bold text-xs flex items-center gap-1">
                <LogOut className="w-4 h-4" /> Keluar
              </button>
            </div>
          ) : (
            <button onClick={() => { setActiveTab('auth'); setIsMobileMenuOpen(false); }} className="w-full bg-emerald-600 text-white py-1.5 rounded-lg text-xs font-bold text-center">Masuk / Daftar</button>
          )}
        </div>
      )}

      {/* Mandatory Email Verification Banner */}
      {currentUser && !currentUser.isEmailVerified && (
        <div className="bg-amber-50 border-b border-amber-200 py-2.5 px-4 text-center">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 text-xs text-amber-800 font-medium">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Akun Anda belum terverifikasi. Untuk akses antrian virtual penuh, silakan verifikasi email Anda secara instan.</span>
            <button
              onClick={handleVerifyEmailInstant}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] px-2.5 py-1 rounded transition-colors"
            >
              Simulasi Verifikasi Instan
            </button>
          </div>
        </div>
      )}

      {/* MAIN LAYOUT CONTENT */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* AUTH FORMS */}
        {!currentUser && (
          <AuthForm 
            onAuthSuccess={handleAuthSuccess}
            isVerifyingEmail={isVerifyingEmail}
            setIsVerifyingEmail={setIsVerifyingEmail}
          />
        )}

        {/* CUSTOMER VIEWS */}
        {currentUser && currentUser.role === 'customer' && (
          <div className="space-y-6">
            
            {/* SEARCH & MAP HOME TAB */}
            {activeTab === 'home' && (
              <div className="space-y-6">
                
                {/* Promo/Callout Banner */}
                <div className="bg-slate-900 text-white rounded-3xl p-6 relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-6 border border-slate-800 shadow-lg">
                  <div className="absolute right-0 top-0 w-96 h-96 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:12px_12px] opacity-15 pointer-events-none" />
                  
                  <div className="relative space-y-2 text-center md:text-left">
                    <span className="inline-block bg-emerald-500/20 text-emerald-400 font-extrabold text-[10px] tracking-wider uppercase px-2.5 py-1 rounded-full border border-emerald-500/20">
                      Sistem Belanja Bebas Antri 2026
                    </span>
                    <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">FashCollab: Kolaborasi Toko Fisik Terpadu!</h2>
                    <p className="text-xs text-gray-400 max-w-md">
                      Pilih toko tujuan Anda di seluruh Indonesia, ambil tiket antrian virtual dari jauh, lalu berbelanja cepat dengan fitur <strong>Scan & Go</strong>.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3 relative shrink-0">
                    <button
                      onClick={() => {
                        const storeMap = document.getElementById('store-map-finder');
                        if (storeMap) storeMap.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2.5 px-4 rounded-xl transition-colors flex items-center gap-1.5 shadow-md shadow-emerald-600/10"
                    >
                      <MapPin className="w-4 h-4" /> Cari Toko Terdekat
                    </button>
                    <button
                      onClick={() => setActiveTab('scan-go')}
                      className="bg-white hover:bg-slate-50 text-slate-950 font-extrabold text-xs py-2.5 px-4 rounded-xl transition-colors flex items-center gap-1.5 border border-slate-200"
                    >
                      <ShoppingCart className="w-4 h-4" /> Scan & Go
                    </button>
                  </div>
                </div>

                {/* Map finder */}
                <MapLocator stores={stores} onSelectStore={openJoinQueue} />

                {/* Join Queue modal */}
                {isJoinQueueModalOpen && selectedStore && (
                  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden border border-slate-100 shadow-2xl font-sans">
                      <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                        <div className="flex gap-2.5 items-center">
                          <img src={selectedStore.logo} className="w-8 h-8 rounded-lg object-cover" />
                          <div>
                            <h3 className="text-xs font-extrabold text-slate-800 leading-none">{selectedStore.name}</h3>
                            <span className="text-[10px] text-gray-400 block mt-1">{selectedStore.city}</span>
                          </div>
                        </div>
                        <button onClick={() => setIsJoinQueueModalOpen(false)} className="p-1 rounded-full hover:bg-slate-200">
                          <X className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>

                      <div className="p-6 space-y-4">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Informasi Toko Fisik</span>
                          <p className="text-xs text-slate-600 leading-relaxed">{selectedStore.description}</p>
                        </div>

                        {/* Queue analytics */}
                        <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400">Kuota Per Jam:</span>
                            <p className="text-xs font-extrabold text-slate-700">{selectedStore.queueQuotaPerHour} Orang</p>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400">Rata-rata Layanan:</span>
                            <p className="text-xs font-extrabold text-slate-700">{selectedStore.avgServiceTimeMinutes} Menit</p>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400">Sisa Antrian Aktif:</span>
                            <p className="text-xs font-extrabold text-slate-700">{selectedStore.currentQueueCount} Orang</p>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-slate-400">Estimasi Menunggu:</span>
                            <p className="text-xs font-extrabold text-emerald-600">
                              ~{selectedStore.currentQueueCount * selectedStore.avgServiceTimeMinutes} Menit
                            </p>
                          </div>
                        </div>

                        {/* Slot booking selector */}
                        <div className="space-y-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pilih Sesi Jam Kunjungan</span>
                          <div className="grid grid-cols-3 gap-2">
                            {['10:00 - 11:00', '11:00 - 12:00', '13:00 - 14:00', '14:00 - 15:00', '15:00 - 16:00', '16:00 - 17:00'].map((slot, idx) => (
                              <button
                                key={idx}
                                onClick={() => setSelectedHourSlot(slot)}
                                className={`py-2 rounded-xl text-xs font-bold transition-all border text-center ${
                                  selectedHourSlot === slot 
                                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800' 
                                    : 'border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                {slot}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Store Products sneak peek */}
                        <div className="pt-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Katalog Di Toko ({selectedStoreProducts.length})</span>
                          <div className="flex gap-2 overflow-x-auto pr-2">
                            {selectedStoreProducts.map((p) => (
                              <div key={p.id} className="w-24 shrink-0 bg-slate-50 rounded-lg p-1.5 border border-slate-100">
                                <img src={p.image} className="w-20 h-20 rounded object-cover" />
                                <p className="text-[10px] font-bold truncate mt-1 text-slate-700">{p.name}</p>
                                <p className="text-[9px] text-emerald-600 font-bold">{formatIDR(p.price)}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="p-6 border-t border-slate-100 flex gap-2 bg-slate-50">
                        <button
                          onClick={() => setIsJoinQueueModalOpen(false)}
                          className="flex-1 bg-white hover:bg-slate-50 border border-slate-200 font-bold text-xs py-2.5 rounded-xl"
                        >
                          Batal
                        </button>
                        <button
                          onClick={handleJoinQueueSubmit}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2.5 rounded-xl shadow-md"
                        >
                          Dapatkan Antrian Virtual
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* QUEUE TICKETS TAB */}
            {activeTab === 'queue' && (
              <div className="space-y-6">
                <div className="max-w-2xl mx-auto">
                  <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-emerald-500" />
                    Antrian Virtual Jarak Jauh Anda
                  </h3>

                  {customerActiveQueues.length === 0 ? (
                    <div className="bg-white border border-slate-100 rounded-2xl p-10 text-center shadow-sm">
                      <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <h4 className="text-sm font-extrabold text-slate-800">Tidak ada antrian aktif saat ini</h4>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
                        Anda belum mengambil tiket antrian virtual. Cari toko fisik favorit Anda di peta lalu ambil tiket Anda!
                      </p>
                      <button
                        onClick={() => setActiveTab('home')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2 px-4 rounded-xl transition-colors"
                      >
                        Pilih Toko Sekarang
                      </button>
                    </div>
                  ) : (
                    customerActiveQueues.map((q) => (
                      <div key={q.id} className="bg-white border border-slate-100 rounded-3xl shadow-md overflow-hidden mb-4">
                        <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
                          <span className="text-[10px] font-extrabold tracking-widest uppercase text-emerald-400">Virtual Ticket</span>
                          <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full uppercase ${
                            q.status === 'checked-in' ? 'bg-blue-500 text-white' : 'bg-emerald-500 text-slate-950'
                          }`}>
                            {q.status === 'waiting' ? 'Menunggu Giliran' : q.status === 'checked-in' ? 'Check-In Sukses' : q.status}
                          </span>
                        </div>

                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-4 text-xs">
                            <div>
                              <span className="text-gray-400 font-bold">Toko Fisik</span>
                              <h4 className="text-base font-extrabold text-slate-800 mt-0.5">{q.storeName}</h4>
                              <p className="text-slate-400">Sesi Kunjungan: {q.scheduledHour}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                <span className="text-slate-400 font-bold">Nomor Tiket</span>
                                <p className="text-lg font-extrabold text-slate-800 mt-1">{q.queueNumber}</p>
                              </div>
                              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                <span className="text-slate-400 font-bold">Estimasi Tunggu</span>
                                <p className="text-lg font-extrabold text-emerald-600 mt-1">~{q.estimatedWaitMinutes}m</p>
                              </div>
                            </div>

                            <div className="pt-3 border-t border-slate-100 space-y-2">
                              <span className="text-slate-400 font-bold block">Simulasi Kedatangan Anda:</span>
                              
                              {q.status === 'waiting' ? (
                                <button
                                  onClick={() => handleQueueCheckInSimulate(q.id)}
                                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-2 px-4 rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-md"
                                >
                                  📍 Klik saat Tiba di Toko (Check-In)
                                </button>
                              ) : (
                                <div className="p-3 bg-blue-50 border border-blue-100 text-blue-800 font-semibold rounded-xl flex items-center gap-2">
                                  <CheckCircle2 className="w-5 h-5 text-blue-500" />
                                  <span>Berhasil check-in! Silakan masuk toko dan gunakan Scan & Go.</span>
                                </div>
                              )}

                              <button
                                onClick={() => handleCancelQueueSimulate(q.id)}
                                className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold py-2 px-4 rounded-xl transition-colors"
                              >
                                Batalkan Antrian Virtual
                              </button>
                            </div>
                          </div>

                          <div className="flex flex-col items-center justify-center border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-6 text-center">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">QR Code Tiket Antrian</span>
                            <img
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=FashCollab_Queue_${q.id}`}
                              alt="Queue QR"
                              className="w-40 h-40 border-4 border-slate-50 rounded-xl shadow-sm bg-white"
                            />
                            <p className="text-[10px] text-gray-400 mt-2">
                              Tunjukkan QR ini ke staf pintu masuk toko fisik untuk scan kedatangan instan.
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* SCAN & GO SHOPPING CART TAB */}
            {activeTab === 'scan-go' && (
              <div className="space-y-6">
                
                <QRScanner 
                  stores={stores} 
                  onProductScanned={handleProductScannedSuccess} 
                />

                <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5 font-sans">
                  <h3 className="text-sm font-extrabold text-slate-800 mb-4 flex items-center gap-1.5">
                    <ShoppingCart className="w-4.5 h-4.5 text-emerald-500" />
                    Keranjang Belanja Scan & Go Anda
                  </h3>

                  {cart.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs">
                      Keranjang belanja Anda kosong. Gunakan pemindai barcode di atas untuk menyimulasikan scan baju di rak toko fisik!
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-3 bg-slate-50 rounded-lg flex items-center justify-between border border-slate-100">
                        <span className="text-xs font-bold text-slate-700">Toko Pembelian: {cart[0].store.name}</span>
                      </div>

                      <div className="divide-y divide-slate-100">
                        {cart.map((item) => (
                          <div key={item.product.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                            <div className="flex gap-2.5 items-center">
                              <img src={item.product.image} className="w-10 h-10 rounded object-cover" />
                              <div>
                                <h4 className="text-xs font-bold text-slate-800">{item.product.name}</h4>
                                <span className="text-slate-400 block mt-0.5">{formatIDR(item.product.price)} • Stock: {item.product.stock}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
                                <button
                                  onClick={() => updateCartQuantity(item.product.id, -1)}
                                  className="w-6 h-6 flex items-center justify-center font-bold"
                                >
                                  -
                                </button>
                                <span className="w-8 text-center font-bold">{item.quantity}</span>
                                <button
                                  onClick={() => updateCartQuantity(item.product.id, 1)}
                                  className="w-6 h-6 flex items-center justify-center font-bold"
                                >
                                  +
                                </button>
                              </div>
                              <span className="font-bold text-slate-800 w-20 text-right">{formatIDR(item.product.price * item.quantity)}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="border-t border-slate-100 pt-4 grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-2.5">
                          <span className="text-slate-400 font-bold text-xs block">Pilih Metode Pembayaran</span>
                          <div className="grid grid-cols-3 gap-2 text-xs font-bold">
                            <button
                              type="button"
                              onClick={() => setPaymentMethod('va')}
                              className={`p-2.5 rounded-xl border text-center transition-all ${
                                paymentMethod === 'va' ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-slate-200'
                              }`}
                            >
                              Virtual Account
                            </button>
                            <button
                              type="button"
                              onClick={() => setPaymentMethod('qris')}
                              className={`p-2.5 rounded-xl border text-center transition-all ${
                                paymentMethod === 'qris' ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-slate-200'
                              }`}
                            >
                              QRIS Code
                            </button>
                            <button
                              type="button"
                              onClick={() => setPaymentMethod('cc')}
                              className={`p-2.5 rounded-xl border text-center transition-all ${
                                paymentMethod === 'cc' ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-slate-200'
                              }`}
                            >
                              Credit Card
                            </button>
                          </div>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2 text-xs">
                          <div className="flex justify-between text-slate-600">
                            <span>Subtotal Belanja:</span>
                            <span className="font-semibold">{formatIDR(cartSubtotal)}</span>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>Komisi Layanan platform (5%):</span>
                            <span className="font-semibold">{formatIDR(cartCommission)}</span>
                          </div>
                          <hr className="border-slate-200" />
                          <div className="flex justify-between font-extrabold text-slate-900">
                            <span>Total Pembayaran:</span>
                            <span className="text-emerald-600">{formatIDR(cartTotal)}</span>
                          </div>

                          <button
                            onClick={handleCheckout}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2.5 rounded-xl transition-all shadow-md mt-2"
                          >
                            Proses Checkout Mandiri via App
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* ACTIVE PAYMENT GATEWAY BLOCK */}
                {activePaymentOrder && (
                  <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 font-sans shadow-xl">
                    <div className="flex justify-between items-start border-b border-slate-800 pb-4 mb-4">
                      <div>
                        <span className="inline-block bg-emerald-500/20 text-emerald-400 font-extrabold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-emerald-500/20 mb-1">
                          Simulasi Midtrans Payment Gateway
                        </span>
                        <h3 className="text-sm font-extrabold text-white">Menunggu Pembayaran VA/QRIS</h3>
                        <p className="text-[11px] text-gray-400 mt-0.5">ID: {activePaymentOrder.id} • Toko: {activePaymentOrder.storeName}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center text-xs">
                      <div className="space-y-4">
                        <div>
                          <span className="text-gray-400">Total Tagihan:</span>
                          <p className="text-lg font-extrabold text-emerald-400 mt-0.5">{formatIDR(activePaymentOrder.total)}</p>
                        </div>

                        {activePaymentOrder.paymentMethod === 'va' ? (
                          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                            <span className="text-gray-400 font-bold">Nomor Virtual Account (VA):</span>
                            <div className="flex items-center gap-2 mt-1.5 justify-between">
                              <span className="text-sm font-mono font-extrabold tracking-wider text-emerald-400">{activePaymentOrder.vaNumber}</span>
                            </div>
                            <p className="text-[10px] text-gray-500 mt-2">
                              Simulasikan transfer bank ke nomor Virtual Account di atas.
                            </p>
                          </div>
                        ) : activePaymentOrder.paymentMethod === 'qris' ? (
                          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center flex flex-col items-center">
                            <img src={activePaymentOrder.qrisUrl} className="w-40 h-40 bg-white rounded-lg p-2" />
                            <p className="text-[10px] text-gray-500 mt-2">Scan QRIS Code di atas untuk melunasi pembayaran belanja.</p>
                          </div>
                        ) : (
                          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
                            <span className="text-gray-400 font-bold">Pembayaran Kartu Kredit</span>
                            <p className="text-sm font-bold text-gray-300 mt-1">Visa/MasterCard Secure Gateway</p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-center justify-center p-4 bg-slate-950 rounded-2xl border border-slate-800 text-center">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2 animate-pulse" />
                        <h4 className="text-xs font-bold text-white">Simulasi Transfer Sukses</h4>
                        <p className="text-[11px] text-gray-400 mt-1 max-w-xs leading-normal mb-4">
                          Klik tombol di bawah ini untuk mensimulasikan konfirmasi pembayaran sukses (Paid).
                        </p>
                        <button
                          onClick={handlePaymentConfirmSimulate}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2 px-4 rounded-xl transition-colors shadow-lg"
                        >
                          Selesaikan Pembayaran Sekarang
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* PURCHASES HISTORY TAB */}
            {activeTab === 'purchases' && (
              <div className="space-y-6">
                <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-1.5">
                  <FileText className="w-5 h-5 text-emerald-500" />
                  Riwayat Belanja & Ulasan Toko
                </h3>

                {customerOrders.length === 0 ? (
                  <div className="bg-white border border-slate-100 rounded-2xl p-8 text-center shadow-sm">
                    <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-600">Belum ada transaksi pembelian</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {customerOrders.map((order) => (
                      <div key={order.id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                        <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-100 pb-3 mb-3 text-xs">
                          <div>
                            <span className="font-bold text-slate-800">{order.storeName}</span>
                            <span className="text-slate-400 text-[10px] block mt-0.5">Tanggal: {order.createdAt.split('T')[0]} • ID: {order.id}</span>
                          </div>
                          
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            order.paymentStatus === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                            order.paymentStatus === 'paid' ? 'bg-blue-100 text-blue-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {order.paymentStatus}
                          </span>
                        </div>

                        <div className="space-y-2 text-xs text-slate-600">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between">
                              <span>{item.name} <strong>x{item.quantity}</strong></span>
                              <span className="font-mono">{formatIDR(item.price * item.quantity)}</span>
                            </div>
                          ))}
                        </div>

                        <div className="border-t border-slate-100 pt-3 mt-3 flex justify-between items-center text-xs">
                          <span className="text-slate-400">Total Pembayaran:</span>
                          <span className="font-extrabold text-slate-800">{formatIDR(order.total)}</span>
                        </div>

                        {/* Submit review */}
                        {['paid', 'completed'].includes(order.paymentStatus) && (
                          <div className="mt-4 pt-3 border-t border-dashed border-slate-100 bg-slate-50/50 p-3 rounded-xl">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Beri Rating Toko</span>
                            <form onSubmit={handleReviewSubmit} className="space-y-3">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-600">Rating:</span>
                                <div className="flex gap-1">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                      type="button"
                                      key={star}
                                      onClick={() => { setReviewRating(star); setReviewStoreId(order.storeId); }}
                                    >
                                      <Star className={`w-4 h-4 ${reviewRating >= star && reviewStoreId === order.storeId ? 'text-amber-500 fill-current' : 'text-slate-300'}`} />
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div className="flex gap-1.5">
                                <input
                                  type="text"
                                  placeholder="Tulis ulasan Anda disini..."
                                  value={reviewStoreId === order.storeId ? reviewComment : ''}
                                  onChange={(e) => { setReviewComment(e.target.value); setReviewStoreId(order.storeId); }}
                                  className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 focus:outline-none"
                                />
                                <button
                                  type="submit"
                                  className="bg-slate-900 text-white font-bold text-xs px-3 py-1.5 rounded-lg"
                                >
                                  Kirim
                                </button>
                              </div>
                            </form>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* STORE OWNER VIEWS */}
        {currentUser && currentUser.role === 'store_owner' && ownerStore && (
          <OwnerDashboard 
            ownerStore={ownerStore}
            ownerProducts={ownerProducts}
            ownerQueues={ownerQueues}
            ownerOrders={ownerOrders}
            ownerReports={ownerReports}
            onRefresh={refreshGlobalData}
          />
        )}

        {/* ADMIN VIEWS */}
        {currentUser && currentUser.role === 'admin' && (
          <AdminDashboard 
            adminStores={adminStores}
            allTransactions={allTransactions}
            adminStats={adminStats}
            commissionPercent={commissionPercent}
            onRefresh={refreshGlobalData}
          />
        )}

      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-100 py-6 text-center text-xs text-slate-400 font-medium font-sans">
        <p>© 2026 FashCollab — Platform Kolaborasi Penjualan Fashion B2B2C Indonesia.</p>
        <p className="text-[10px] text-gray-400 mt-1">Menghubungkan gerai toko fisik dengan virtual queuing & checkout mandiri.</p>
      </footer>
    </div>
  );
}
