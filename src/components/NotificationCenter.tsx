import React, { useState, useEffect } from 'react';
import { Bell, Mail, MessageSquare, Check, X, Info } from 'lucide-react';
import { Queue } from '../types';

interface Notification {
  id: string;
  type: 'email' | 'sms' | 'push';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

interface NotificationCenterProps {
  activeQueues: Queue[];
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ activeQueues }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Create notifications based on active queue statuses
  useEffect(() => {
    const list: Notification[] = [
      {
        id: 'welcome',
        type: 'push',
        title: 'Selamat Datang di FashCollab!',
        message: 'Platform kolaborasi fashion yang menghubungkan pelanggan dengan ribuan toko fisik di Indonesia.',
        time: 'Baru saja',
        read: false
      }
    ];

    activeQueues.forEach((q) => {
      if (q.status === 'waiting') {
        list.push({
          id: `wait-${q.id}`,
          type: 'email',
          title: `📩 Konfirmasi Antrian FashCollab — ${q.storeName}`,
          message: `Nomor antrian Anda adalah ${q.queueNumber}. Estimasi waktu tunggu adalah ${q.estimatedWaitMinutes} menit. Harap tunjukkan QR Code antrian Anda di pintu masuk toko untuk check-in.`,
          time: '1 menit yang lalu',
          read: false
        });
        
        // If they are first in line or wait time is low, simulate near-turn alert
        if (q.estimatedWaitMinutes <= 15) {
          list.push({
            id: `near-${q.id}`,
            type: 'sms',
            title: `💬 FashCollab SMS Alert`,
            message: `Giliran Anda mendekati! Nomor ${q.queueNumber} di ${q.storeName} tinggal 1 antrian lagi. Silakan menuju ke pintu masuk toko untuk check-in.`,
            time: 'Baru saja',
            read: false
          });
        }
      } else if (q.status === 'checked-in') {
        list.push({
          id: `check-${q.id}`,
          type: 'push',
          title: `✅ Berhasil Check-In di ${q.storeName}`,
          message: `Selamat berbelanja! Barcode produk dapat Anda scan langsung menggunakan fitur 'Scan & Go' untuk check-out mandiri.`,
          time: 'Baru saja',
          read: false
        });
      } else if (q.status === 'served') {
        list.push({
          id: `served-${q.id}`,
          type: 'push',
          title: `🛍️ Sedang Dilayani di ${q.storeName}`,
          message: `Asisten toko kami siap melayani kebutuhan fashion Anda saat ini.`,
          time: 'Baru saja',
          read: false
        });
      }
    });

    setNotifications(list);
  }, [activeQueues]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="w-4 h-4 text-emerald-500" />;
      case 'sms':
        return <MessageSquare className="w-4 h-4 text-blue-500" />;
      default:
        return <Bell className="w-4 h-4 text-purple-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'email':
        return 'Email Notification';
      case 'sms':
        return 'SMS Alert';
      default:
        return 'Push Notification';
    }
  };

  return (
    <div className="relative font-sans">
      {/* Floating Bell Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full text-slate-600 hover:text-emerald-600 hover:bg-slate-50 transition-all focus:outline-none"
        id="notification-trigger"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-extrabold text-white ring-2 ring-white">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Drawer */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2.5 w-80 md:w-96 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden transform origin-top-right transition-all">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4.5 h-4.5 text-slate-700" />
                <span className="font-extrabold text-xs text-slate-800">Pusat Notifikasi Real-Time</span>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[10px] text-emerald-600 hover:text-emerald-700 font-bold transition-colors"
                >
                  Tandai Semua Dibaca
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Tidak ada notifikasi baru saat ini.
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-4 transition-all hover:bg-slate-50 flex gap-3 ${
                      !notif.read ? 'bg-emerald-50/10' : ''
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-slate-100 h-fit">
                      {getIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                          {getTypeLabel(notif.type)}
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono">{notif.time}</span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-800 mt-1 truncate">{notif.title}</h4>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed break-words">
                        {notif.message}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer with simulation info */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 text-center flex items-center justify-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-blue-500" />
              <span>Simulasi otomatis Push, Email & SMS terpadu FashCollab.</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
