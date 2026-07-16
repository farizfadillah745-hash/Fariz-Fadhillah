import React, { useState } from 'react';
import { Camera, Scan, Sparkles, CheckCircle2, AlertCircle, ShoppingCart } from 'lucide-react';
import { Product, Store } from '../types';
import { productAPI, formatIDR } from '../lib/api';

interface QRScannerProps {
  onProductScanned?: (product: Product, store: Store) => void;
  onStoreQRScanned?: (store: Store) => void;
  activeStoreId?: string; // Optional: restrict product scan to active store
  stores: Store[];
}

export const QRScanner: React.FC<QRScannerProps> = ({ 
  onProductScanned, 
  onStoreQRScanned, 
  activeStoreId,
  stores
}) => {
  const [scanType, setScanType] = useState<'product' | 'store'>('product');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string; data?: any } | null>(null);

  // Load all products to let the user select a product barcode to simulate a camera scan
  const [simulationProducts, setSimulationProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  const fetchProductsForSimulation = async (storeId?: string) => {
    setIsLoadingProducts(true);
    try {
      const data = await productAPI.getProducts(storeId);
      setSimulationProducts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const startScanSimulation = () => {
    setIsScanning(true);
    setScanResult(null);
    if (scanType === 'product') {
      fetchProductsForSimulation(activeStoreId);
    }
  };

  const handleManualScan = async (code: string) => {
    setIsScanning(true);
    setScanResult(null);
    
    // Simulate camera delay
    setTimeout(async () => {
      try {
        if (scanType === 'product') {
          const result = await productAPI.scanProduct(code);
          // If customer is checked-in or shopping
          setScanResult({
            success: true,
            message: `Produk '${result.product.name}' berhasil di-scan di ${result.store.name}!`,
            data: result
          });
          if (onProductScanned) {
            onProductScanned(result.product, result.store);
          }
        } else {
          // Store QR scanning
          // Code represents storeId
          const store = stores.find(s => s.id === code || s.name.toLowerCase().includes(code.toLowerCase()));
          if (!store) {
            throw new Error("Toko tidak ditemukan. Silakan gunakan QR Code toko yang valid.");
          }
          setScanResult({
            success: true,
            message: `Toko '${store.name}' terdeteksi! Mengambil status antrian virtual...`,
            data: store
          });
          if (onStoreQRScanned) {
            onStoreQRScanned(store);
          }
        }
      } catch (err: any) {
        setScanResult({
          success: false,
          message: err.message || "Gagal melakukan scan barcode."
        });
      } finally {
        setIsScanning(false);
      }
    }, 1200);
  };

  return (
    <div id="qr-barcode-scanner" className="bg-white border border-slate-100 rounded-2xl shadow-sm p-5 font-sans">
      <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
        <div>
          <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
            <Scan className="w-4.5 h-4.5 text-emerald-500" />
            Scanner Kamera FashCollab
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">Scan Barcode untuk belanja cepat, atau Scan QR Toko untuk masuk antrian.</p>
        </div>
        
        {/* Toggle Scanning type */}
        <div className="flex bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold">
          <button
            onClick={() => { setScanType('product'); setScanResult(null); }}
            className={`px-3 py-1 rounded-md transition-all ${scanType === 'product' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
          >
            Scan & Go (Produk)
          </button>
          <button
            onClick={() => { setScanType('store'); setScanResult(null); }}
            className={`px-3 py-1 rounded-md transition-all ${scanType === 'store' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
          >
            Scan Masuk Antrian (QR Toko)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Left side: Simulated Viewfinder */}
        <div className="relative aspect-square md:aspect-video rounded-xl bg-slate-900 border border-slate-800 overflow-hidden flex flex-col items-center justify-center text-white">
          {isScanning ? (
            <>
              {/* Scan effect lines */}
              <div className="absolute inset-x-0 h-0.5 bg-emerald-500 shadow-[0_0_15px_#10b981] animate-bounce top-1/4" />
              <div className="absolute inset-0 bg-emerald-500/5 animate-pulse" />
              <div className="text-center z-10 p-4">
                <Camera className="w-8 h-8 text-emerald-400 mx-auto animate-spin mb-2" />
                <p className="text-xs font-bold text-emerald-400">Menghubungkan Kamera...</p>
                <p className="text-[10px] text-gray-400 mt-1">Mengaktifkan sensor pemindai optik</p>
              </div>
            </>
          ) : (
            <div className="text-center p-6">
              <div className="p-3 bg-slate-800/80 rounded-full w-fit mx-auto mb-3">
                <Scan className="w-6 h-6 text-emerald-400" />
              </div>
              <p className="text-xs font-bold">Pemindai Siap Digunakan</p>
              <p className="text-[10px] text-gray-400 mt-1 mb-4">Arahkan kamera ponsel ke Barcode produk atau QR Code toko fisik.</p>
              <button
                onClick={startScanSimulation}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] py-1.5 px-4 rounded-lg transition-colors shadow-lg"
              >
                Mulai Kamera Scanner
              </button>
            </div>
          )}

          {/* Camera Frame outline */}
          <div className="absolute inset-6 border-2 border-dashed border-gray-600/50 pointer-events-none rounded" />
          <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-emerald-500 pointer-events-none" />
          <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-emerald-500 pointer-events-none" />
          <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-emerald-500 pointer-events-none" />
          <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-emerald-500 pointer-events-none" />
        </div>

        {/* Right side: Interactive Simulation Controls */}
        <div className="flex flex-col justify-between">
          <div className="space-y-4">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Papan Simulasi Interaktif (Tanpa Kamera Fisik)
            </span>

            {scanType === 'product' ? (
              <div>
                <p className="text-[11px] text-slate-500 mb-2">
                  Pilih produk dari rak toko fisik berikut untuk menyimulasikan scan barcode secara langsung:
                </p>
                
                {isScanning && simulationProducts.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                    {simulationProducts.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => handleManualScan(p.barcode)}
                        className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 hover:bg-emerald-50 border border-slate-100 transition-colors text-left text-xs"
                      >
                        <img src={p.image} className="w-8 h-8 rounded object-cover" />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-700 truncate">{p.name}</p>
                          <p className="text-[10px] text-gray-500 font-mono mt-0.5">BC: {p.barcode} • {formatIDR(p.price)}</p>
                        </div>
                        <span className="bg-emerald-100 text-emerald-800 text-[9px] font-extrabold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                          <ShoppingCart className="w-2.5 h-2.5" /> Scan
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-[11px] text-slate-400 bg-slate-50 p-3 rounded-lg border border-slate-100 border-dashed text-center">
                    Klik <strong>Mulai Kamera Scanner</strong> untuk memunculkan produk-produk rak toko fisik yang siap di-scan.
                  </div>
                )}
              </div>
            ) : (
              <div>
                <p className="text-[11px] text-slate-500 mb-2">
                  Pilih salah satu toko fisik aktif untuk mensimulasikan scan QR Code di pintu masuk toko:
                </p>
                <div className="grid grid-cols-2 gap-1.5 max-h-44 overflow-y-auto">
                  {stores.filter(s => s.status === 'approved').map((store) => (
                    <button
                      key={store.id}
                      onClick={() => handleManualScan(store.id)}
                      className="p-2 text-left bg-slate-50 hover:bg-emerald-50 border border-slate-100 rounded-lg transition-all text-xs"
                    >
                      <p className="font-bold text-slate-700 truncate">{store.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5 truncate">{store.city}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Manual input as fallback */}
            <div className="pt-3 border-t border-slate-100 flex gap-1.5">
              <input
                type="text"
                placeholder={scanType === 'product' ? 'Masukkan Barcode Manual (e.g. 8991234567012)' : 'Masukkan Nama Toko...'}
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-700 focus:border-emerald-500 focus:outline-none"
              />
              <button
                onClick={() => handleManualScan(barcodeInput)}
                disabled={!barcodeInput}
                className="bg-slate-900 hover:bg-slate-850 disabled:bg-slate-200 text-white font-semibold text-xs px-3 py-1.5 rounded-lg transition-colors"
              >
                Scan Code
              </button>
            </div>
          </div>

          {/* Results Block */}
          {scanResult && (
            <div className={`mt-4 p-3 rounded-lg border flex gap-2.5 items-start ${
              scanResult.success ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'
            }`}>
              {scanResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="text-xs font-bold">{scanResult.success ? 'Scan Berhasil!' : 'Scan Gagal'}</p>
                <p className="text-[11px] mt-0.5 font-medium leading-relaxed">{scanResult.message}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
