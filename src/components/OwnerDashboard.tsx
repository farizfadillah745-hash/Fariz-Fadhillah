import React, { useState } from 'react';
import { Store, Product, Queue, Order } from '../types';
import { productAPI, queueAPI, orderAPI, formatIDR } from '../lib/api';
import { RevenueAreaChart, CategoryDonutChart } from './Charts';
import { Plus, Edit, Trash2, QrCode, RefreshCw, Clock, CheckCircle2, Star, PlusCircle, X } from 'lucide-react';

interface OwnerDashboardProps {
  ownerStore: Store;
  ownerProducts: Product[];
  ownerQueues: Queue[];
  ownerOrders: Order[];
  ownerReports: { dailySales: any[]; categorySales: any[]; totalRevenue: number; totalCompletedQueues: number } | null;
  onRefresh: () => void;
}

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({
  ownerStore,
  ownerProducts,
  ownerQueues,
  ownerOrders,
  ownerReports,
  onRefresh
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'queues' | 'products' | 'reports' | 'my-store'>('queues');

  // Product modal forms state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productName, setProductName] = useState('');
  const [productCategory, setProductCategory] = useState<'baju' | 'sepatu' | 'aksesori'>('baju');
  const [productPrice, setProductPrice] = useState('');
  const [productStock, setProductStock] = useState('');
  const [productBarcode, setProductBarcode] = useState('');
  const [productImage, setProductImage] = useState('');

  const handleQueueStatus = async (queueId: string, status: string) => {
    try {
      await queueAPI.updateQueueStatus(queueId, status);
      onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  const handleOrderStatus = async (orderId: string, status: string) => {
    try {
      await orderAPI.updateOrderStatus(orderId, status);
      onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddProductOpen = () => {
    setEditingProduct(null);
    setProductName('');
    setProductCategory('baju');
    setProductPrice('');
    setProductStock('');
    setProductBarcode(`899${Math.floor(1000000000 + Math.random() * 9000000000)}`);
    setProductImage('');
    setIsProductModalOpen(true);
  };

  const handleEditProductOpen = (p: Product) => {
    setEditingProduct(p);
    setProductName(p.name);
    setProductCategory(p.category);
    setProductPrice(p.price.toString());
    setProductStock(p.stock.toString());
    setProductBarcode(p.barcode);
    setProductImage(p.image);
    setIsProductModalOpen(true);
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        storeId: ownerStore.id,
        name: productName,
        category: productCategory,
        price: Number(productPrice),
        stock: Number(productStock),
        image: productImage || "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500&q=80",
        barcode: productBarcode
      };

      if (editingProduct) {
        await productAPI.editProduct({ id: editingProduct.id, ...payload });
      } else {
        await productAPI.addProduct(payload);
      }
      setIsProductModalOpen(false);
      onRefresh();
    } catch (err: any) {
      alert(err.message || "Gagal menyimpan produk.");
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Hapus produk ini secara permanen dari katalog?")) return;
    try {
      await productAPI.deleteProduct(id);
      onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Sub Tabs */}
      <div className="flex border-b border-slate-100 gap-4 text-xs font-bold text-slate-500">
        <button
          onClick={() => setActiveSubTab('queues')}
          className={`pb-2.5 border-b-2 transition-all ${
            activeSubTab === 'queues' ? 'border-emerald-500 text-emerald-600' : 'border-transparent hover:text-emerald-500'
          }`}
        >
          Sistem Antrian & Kasir
        </button>
        <button
          onClick={() => setActiveSubTab('products')}
          className={`pb-2.5 border-b-2 transition-all ${
            activeSubTab === 'products' ? 'border-emerald-500 text-emerald-600' : 'border-transparent hover:text-emerald-500'
          }`}
        >
          Katalog Produk
        </button>
        <button
          onClick={() => setActiveSubTab('reports')}
          className={`pb-2.5 border-b-2 transition-all ${
            activeSubTab === 'reports' ? 'border-emerald-500 text-emerald-600' : 'border-transparent hover:text-emerald-500'
          }`}
        >
          Laporan Toko
        </button>
        <button
          onClick={() => setActiveSubTab('my-store')}
          className={`pb-2.5 border-b-2 transition-all ${
            activeSubTab === 'my-store' ? 'border-emerald-500 text-emerald-600' : 'border-transparent hover:text-emerald-500'
          }`}
        >
          QR Code Pintu Masuk
        </button>
      </div>

      {/* QUEUES & CHECKOUT TRANSACTIONS */}
      {activeSubTab === 'queues' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Menunggu Giliran</span>
              <p className="text-xl font-extrabold text-slate-800 mt-1">{ownerQueues.filter(q => q.status === 'waiting').length} Orang</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Sudah Tiba</span>
              <p className="text-xl font-extrabold text-blue-600 mt-1">{ownerQueues.filter(q => q.status === 'checked-in').length} Orang</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Sedang Dilayani</span>
              <p className="text-xl font-extrabold text-purple-600 mt-1">{ownerQueues.filter(q => q.status === 'served').length} Orang</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Total Selesai</span>
              <p className="text-xl font-extrabold text-emerald-600 mt-1">{ownerQueues.filter(q => q.status === 'completed').length} Orang</p>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-700 uppercase">Antrian Pelanggan Aktif ({ownerQueues.length})</h3>
              <button onClick={onRefresh} className="p-1 text-slate-400 hover:text-emerald-600 transition-colors">
                <RefreshCw className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {ownerQueues.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">Belum ada pelanggan mengantri.</div>
              ) : (
                ownerQueues.map((q) => (
                  <div key={q.id} className="p-4 flex flex-wrap justify-between items-center gap-3 text-xs">
                    <div className="flex gap-3 items-center">
                      <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-mono font-extrabold text-slate-800">
                        {q.queueNumber}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">{q.userName}</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">Sesi: {q.scheduledHour} • ID: {q.id}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full uppercase ${
                        q.status === 'waiting' ? 'bg-amber-100 text-amber-800' :
                        q.status === 'checked-in' ? 'bg-blue-100 text-blue-800' :
                        q.status === 'served' ? 'bg-purple-100 text-purple-800' :
                        'bg-emerald-100 text-emerald-800'
                      }`}>
                        {q.status}
                      </span>

                      <div className="flex gap-1 ml-3">
                        {q.status === 'waiting' && (
                          <button
                            onClick={() => handleQueueStatus(q.id, 'checked-in')}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] px-2.5 py-1 rounded transition-colors"
                          >
                            Konfirmasi Tiba
                          </button>
                        )}
                        {q.status === 'checked-in' && (
                          <button
                            onClick={() => handleQueueStatus(q.id, 'served')}
                            className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10px] px-2.5 py-1 rounded transition-colors"
                          >
                            Mulai Layani
                          </button>
                        )}
                        {q.status === 'served' && (
                          <button
                            onClick={() => handleQueueStatus(q.id, 'completed')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-2.5 py-1 rounded transition-colors"
                          >
                            Layanan Selesai
                          </button>
                        )}
                        {['waiting', 'checked-in'].includes(q.status) && (
                          <button
                            onClick={() => handleQueueStatus(q.id, 'cancelled')}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[10px] px-2.5 py-1 rounded transition-colors"
                          >
                            Batal
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Scan & Go pending deliver order list */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="text-xs font-bold text-slate-700 uppercase">Verifikasi Penyerahan Barang Scan & Go</h3>
            </div>

            <div className="divide-y divide-slate-100">
              {ownerOrders.filter(o => o.paymentStatus === 'paid').length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">Tidak ada barang Scan & Go yang siap diserahkan saat ini.</div>
              ) : (
                ownerOrders.filter(o => o.paymentStatus === 'paid').map((o) => (
                  <div key={o.id} className="p-4 flex flex-wrap justify-between items-center gap-3 text-xs">
                    <div>
                      <p className="font-bold text-slate-800">{o.userName}</p>
                      <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">Metode VA/QRIS: Lunas (Paid) • Total: {formatIDR(o.total)}</p>
                      <div className="mt-2 space-y-0.5 bg-slate-50 p-2 rounded border border-slate-100 max-w-md">
                        {o.items.map((it, i) => (
                          <p key={i} className="text-[10px] text-gray-500">• {it.name} x{it.quantity}</p>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => handleOrderStatus(o.id, 'completed')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] px-3.5 py-1.5 rounded-lg shadow-sm"
                    >
                      Beri Barang & Selesaikan Order
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* PRODUCTS CATALOG LIST */}
      {activeSubTab === 'products' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Katalog Rak Produk ({ownerProducts.length})</h3>
            <button
              onClick={handleAddProductOpen}
              className="bg-slate-900 hover:bg-slate-850 text-white font-extrabold text-xs py-2 px-4 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Tambah Produk Baru
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {ownerProducts.map((p) => (
              <div key={p.id} className="bg-white border border-slate-100 rounded-2xl p-3 shadow-sm flex flex-col justify-between">
                <div>
                  <img src={p.image} className="w-full h-32 rounded-lg object-cover mb-2" />
                  <h4 className="text-xs font-bold text-slate-800 line-clamp-2">{p.name}</h4>
                  <p className="text-[10px] text-gray-400 mt-0.5 uppercase font-bold tracking-wider">{p.category}</p>
                  <p className="text-xs font-extrabold text-emerald-600 mt-1">{formatIDR(p.price)}</p>
                </div>

                <div className="border-t border-slate-100 pt-2.5 mt-2.5 flex justify-between items-center text-[10px] text-gray-500 font-semibold">
                  <span>Stok: {p.stock}</span>
                  <div className="flex gap-1.5">
                    <button onClick={() => handleEditProductOpen(p)} className="text-blue-500 hover:underline">Edit</button>
                    <button onClick={() => handleDeleteProduct(p.id)} className="text-rose-500 hover:underline">Hapus</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Product form modal */}
          {isProductModalOpen && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <form onSubmit={handleProductSubmit} className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-100 shadow-2xl font-sans space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <h3 className="text-sm font-extrabold text-slate-800">{editingProduct ? 'Edit Informasi Produk' : 'Tambah Produk Baru'}</h3>
                  <button type="button" onClick={() => setIsProductModalOpen(false)} className="p-1 hover:bg-slate-100 rounded-full">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Nama Produk</label>
                  <input
                    type="text"
                    required
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Kategori</label>
                    <select
                      value={productCategory}
                      onChange={(e: any) => setProductCategory(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 focus:outline-none"
                    >
                      <option value="baju">Baju / Pakaian</option>
                      <option value="sepatu">Sepatu</option>
                      <option value="aksesori">Aksesoris & Tas</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Barcode Scanner</label>
                    <input
                      type="text"
                      required
                      value={productBarcode}
                      onChange={(e) => setProductBarcode(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Harga (IDR)</label>
                    <input
                      type="number"
                      required
                      value={productPrice}
                      onChange={(e) => setProductPrice(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Jumlah Stok</label>
                    <input
                      type="number"
                      required
                      value={productStock}
                      onChange={(e) => setProductStock(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">URL Foto Produk</label>
                  <input
                    type="text"
                    value={productImage}
                    onChange={(e) => setProductImage(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 focus:outline-none"
                    placeholder="https://images.unsplash.com/photo-..."
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsProductModalOpen(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2 rounded-lg"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2 rounded-lg"
                  >
                    Simpan
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* REPORTS */}
      {activeSubTab === 'reports' && ownerReports && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Omset Toko</span>
              <p className="text-xl font-extrabold text-emerald-600 mt-1">{formatIDR(ownerReports.totalRevenue)}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Potongan Kemitraan (5%)</span>
              <p className="text-xl font-extrabold text-rose-500 mt-1">{formatIDR(Math.round((ownerReports.totalRevenue * 5) / 100))}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Antrian Terlayani</span>
              <p className="text-xl font-extrabold text-slate-800 mt-1">{ownerReports.totalCompletedQueues} Orang</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="text-xs font-bold text-slate-700 uppercase mb-4">Grafik Laporan Harian</h3>
              <RevenueAreaChart data={ownerReports.dailySales} />
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="text-xs font-bold text-slate-700 uppercase mb-4">Porsi Penjualan per Kategori</h3>
              <CategoryDonutChart data={ownerReports.categorySales} />
            </div>
          </div>
        </div>
      )}

      {/* ENTRANCE QR CODE */}
      {activeSubTab === 'my-store' && (
        <div className="max-w-md mx-auto">
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm text-center">
            <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">QR Code Cetak Pintu Masuk Toko</h3>
            
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex justify-center">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=FashCollab_Store_${ownerStore.id}`}
                alt="Entrance QR"
                className="w-44 h-44 bg-white p-1.5 border border-slate-100 rounded-lg"
              />
            </div>
            <h4 className="text-xs font-bold text-slate-800 mt-3">{ownerStore.name.toUpperCase()} ENTRANCE</h4>
            <p className="text-[10px] text-slate-400 mt-1 font-mono">{ownerStore.id}</p>
          </div>
        </div>
      )}
    </div>
  );
};
export const XIcon = () => <X className="w-4 h-4 text-gray-500" />;
