import React, { useState } from 'react';
import { Store, Order, SystemStats } from '../types';
import { adminAPI, storeAPI, formatIDR } from '../lib/api';
import { Shield, Settings, Trash2, Coins, FileText, CheckCircle2, TrendingUp, Users, Store as StoreIcon } from 'lucide-react';

interface AdminDashboardProps {
  adminStores: Store[];
  allTransactions: Order[];
  adminStats: SystemStats | null;
  commissionPercent: number;
  onRefresh: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  adminStores,
  allTransactions,
  adminStats,
  commissionPercent,
  onRefresh
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'stores' | 'transactions' | 'config'>('stores');
  const [commissionInput, setCommissionInput] = useState<number>(commissionPercent);

  const handleStoreApproval = async (storeId: string, status: string) => {
    try {
      await storeAPI.performAction(storeId, status);
      onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateCommission = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminAPI.updateCommission(commissionInput);
      alert(`Tarif komisi platform berhasil diperbarui menjadi ${commissionInput}%!`);
      onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportCSV = () => {
    if (!allTransactions || allTransactions.length === 0) return;
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ID Pesanan,Nama Pelanggan,Toko Fisik,Subtotal,Komisi Platform,Total,Metode Pembayaran,Status,Tanggal\n";
    
    allTransactions.forEach((t) => {
      csvContent += `${t.id},${t.userName},${t.storeName},${t.subtotal},${t.commission},${t.total},${t.paymentMethod.toUpperCase()},${t.paymentStatus.toUpperCase()},${t.createdAt.split('T')[0]}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_Transaksi_FashCollab_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Top statistics dashboard */}
      {adminStats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Omset Bersama</span>
              <p className="text-sm font-extrabold text-slate-800 mt-0.5">{formatIDR(adminStats.totalSales)}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
            <div className="p-3 bg-rose-50 rounded-xl text-rose-600">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Komisi Admin ({commissionPercent}%)</span>
              <p className="text-sm font-extrabold text-rose-600 mt-0.5">{formatIDR(adminStats.totalCommission)}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
            <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Volume Order</span>
              <p className="text-sm font-extrabold text-slate-800 mt-0.5">{adminStats.totalTransactions} Transaksi</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
            <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
              <StoreIcon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Total Toko</span>
              <p className="text-sm font-extrabold text-slate-800 mt-0.5">{adminStats.totalStores} Toko Fisik</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-100 gap-4 text-xs font-bold text-slate-500">
        <button
          onClick={() => setActiveSubTab('stores')}
          className={`pb-2.5 border-b-2 transition-all ${
            activeSubTab === 'stores' ? 'border-emerald-500 text-emerald-600' : 'border-transparent hover:text-emerald-500'
          }`}
        >
          Kemitraan Toko Baru
        </button>
        <button
          onClick={() => setActiveSubTab('transactions')}
          className={`pb-2.5 border-b-2 transition-all ${
            activeSubTab === 'transactions' ? 'border-emerald-500 text-emerald-600' : 'border-transparent hover:text-emerald-500'
          }`}
        >
          Log Audit Transaksi
        </button>
        <button
          onClick={() => setActiveSubTab('config')}
          className={`pb-2.5 border-b-2 transition-all ${
            activeSubTab === 'config' ? 'border-emerald-500 text-emerald-600' : 'border-transparent hover:text-emerald-500'
          }`}
        >
          Tarif Komisi Platform
        </button>
      </div>

      {/* STORES APPROVAL */}
      {activeSubTab === 'stores' && (
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Verifikasi Toko Mendaftar</h4>
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="divide-y divide-slate-100">
              {adminStores.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">Belum ada permohonan kemitraan.</div>
              ) : (
                adminStores.map((store) => (
                  <div key={store.id} className="p-4 flex flex-wrap justify-between items-center gap-3">
                    <div className="flex gap-3 items-center">
                      <img src={store.logo} className="w-10 h-10 rounded-lg object-cover border border-slate-100 bg-slate-50" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">{store.name}</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">{store.city}, {store.province} • Kategori: {store.category.toUpperCase()}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <span className={`px-2.5 py-0.5 text-[9px] font-extrabold rounded-full uppercase ${
                        store.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                        store.status === 'suspended' ? 'bg-rose-100 text-rose-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {store.status}
                      </span>

                      <div className="flex gap-1.5">
                        {store.status === 'pending' && (
                          <button
                            onClick={() => handleStoreApproval(store.id, 'approved')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-2.5 py-1 rounded transition-colors"
                          >
                            Setujui Toko
                          </button>
                        )}
                        {store.status === 'approved' && (
                          <button
                            onClick={() => handleStoreApproval(store.id, 'suspended')}
                            className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] px-2.5 py-1 rounded transition-colors"
                          >
                            Suspend
                          </button>
                        )}
                        {store.status === 'suspended' && (
                          <button
                            onClick={() => handleStoreApproval(store.id, 'approved')}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-2.5 py-1 rounded transition-colors"
                          >
                            Aktifkan Kembali
                          </button>
                        )}
                        <button
                          onClick={() => handleStoreApproval(store.id, 'deleted')}
                          className="text-rose-600 hover:bg-rose-50 p-1 rounded"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* AUDIT TRANSACTIONS */}
      {activeSubTab === 'transactions' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Log Semua Pembayaran</h4>
            <button
              onClick={handleExportCSV}
              className="bg-slate-900 hover:bg-slate-850 text-white font-bold text-xs py-1.5 px-3 rounded-lg transition-all"
            >
              Ekspor Laporan CSV
            </button>
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="divide-y divide-slate-100">
              {allTransactions.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">Belum ada transaksi pembelian.</div>
              ) : (
                allTransactions.map((t) => (
                  <div key={t.id} className="p-4 flex flex-wrap justify-between items-center gap-3 text-xs">
                    <div>
                      <p className="font-bold text-slate-800">Toko: {t.storeName} • Pelanggan: {t.userName}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">ID: {t.id} • Tanggal: {t.createdAt.split('T')[0]}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-right min-w-[300px]">
                      <div>
                        <span className="text-gray-400 text-[10px] block">Subtotal</span>
                        <span className="font-semibold text-slate-700">{formatIDR(t.subtotal)}</span>
                      </div>
                      <div>
                        <span className="text-rose-500 text-[10px] block">Potongan Admin</span>
                        <span className="font-bold text-rose-500">+{formatIDR(t.commission)}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 text-[10px] block">Status</span>
                        <span className={`inline-block font-extrabold uppercase ${t.paymentStatus === 'completed' ? 'text-emerald-600' : 'text-amber-500'}`}>{t.paymentStatus}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* COMMISSION CONFIG */}
      {activeSubTab === 'config' && (
        <div className="max-w-md mx-auto">
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
            <h4 className="text-xs font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Settings className="w-4.5 h-4.5 text-emerald-500" />
              Sesuaikan Komisi Platform FashCollab
            </h4>

            <form onSubmit={handleUpdateCommission} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-2">Persentase Komisi Platform (%)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    required
                    min={1}
                    max={50}
                    value={commissionInput}
                    onChange={(e) => setCommissionInput(Number(e.target.value))}
                    className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold font-mono focus:border-emerald-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition-all"
                  >
                    Terapkan
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-2">
                  Setiap transaksi pembayaran Scan & Go mandiri di platform ini akan langsung dipotong komisi admin sesuai nilai di atas.
                </p>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
