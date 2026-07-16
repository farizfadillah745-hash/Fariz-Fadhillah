import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { authAPI } from '../lib/api';
import { AlertCircle, CheckCircle2, Sparkles, User as UserIcon, Store as StoreIcon, Send } from 'lucide-react';

interface AuthFormProps {
  onAuthSuccess: (user: User) => void;
  isVerifyingEmail: boolean;
  setIsVerifyingEmail: (val: boolean) => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({ 
  onAuthSuccess, 
  isVerifyingEmail, 
  setIsVerifyingEmail 
}) => {
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'reset'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authRole, setAuthRole] = useState<UserRole>('customer');
  const [authError, setAuthError] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [tempUser, setTempUser] = useState<User | null>(null);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthMessage('');

    try {
      if (authMode === 'login') {
        if (!authEmail || !authPassword) {
          throw new Error("Harap isi semua kolom input.");
        }
        const user = await authAPI.login(authEmail);
        onAuthSuccess(user);
      } else if (authMode === 'register') {
        if (!authName || !authEmail || !authPassword) {
          throw new Error("Harap isi semua kolom input.");
        }
        const user = await authAPI.register(authName, authEmail, authRole);
        setTempUser(user);
        setAuthMessage("Pendaftaran akun berhasil! Kami telah mengirimkan kode verifikasi.");
        setIsVerifyingEmail(true);
      } else if (authMode === 'reset') {
        if (!authEmail) {
          throw new Error("Harap masukkan alamat email.");
        }
        const msg = await authAPI.resetPassword(authEmail);
        setAuthMessage(msg);
      }
    } catch (err: any) {
      setAuthError(err.message || "Terjadi kesalahan sistem.");
    }
  };

  const handleGoogleLogin = async () => {
    setAuthError('');
    try {
      const user = await authAPI.googleLogin("Fariz Fadillah (Google)", "farizfadillah745@gmail.com");
      onAuthSuccess(user);
    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  const handleVerifyEmail = async () => {
    if (!tempUser) return;
    try {
      const verifiedUser = await authAPI.verifyEmail(tempUser.id);
      onAuthSuccess(verifiedUser);
      setIsVerifyingEmail(false);
    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden font-sans">
      <div className="p-8">
        <div className="text-center mb-6">
          <div className="bg-emerald-50 text-emerald-600 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm">
            <Sparkles className="w-6 h-6 fill-current animate-pulse" />
          </div>
          <h2 className="text-lg font-extrabold text-slate-900">
            {authMode === 'login' ? 'Masuk ke FashCollab' : authMode === 'register' ? 'Buat Akun Baru' : 'Reset Password'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">Platform Kolaborasi & Antrian Virtual Fashion Indonesia</p>
        </div>

        {authError && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-100 text-rose-800 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4.5 h-4.5 text-rose-500 shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        {authMessage && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0" />
            <span>{authMessage}</span>
          </div>
        )}

        {isVerifyingEmail ? (
          <div className="space-y-4">
            <p className="text-xs text-slate-500 text-center">
              Masukkan kode verifikasi 6 digit yang dikirim ke email Anda untuk mengaktifkan akun.
            </p>
            <input
              type="text"
              maxLength={6}
              placeholder="123456"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              className="w-full text-center text-lg font-bold rounded-xl border border-slate-200 py-2.5 focus:border-emerald-500 focus:outline-none"
            />
            <button
              onClick={handleVerifyEmail}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-3 rounded-xl transition-all shadow-md"
            >
              Verifikasi & Masuk
            </button>
          </div>
        ) : (
          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {authMode === 'register' && (
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nama Lengkap</label>
                <input
                  type="text"
                  placeholder="Nama Lengkap..."
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-700 placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Alamat Email</label>
              <input
                type="email"
                placeholder="nama@email.com"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-700 placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
                required
              />
            </div>

            {authMode !== 'reset' && (
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-700 placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>
            )}

            {authMode === 'register' && (
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tipe Peran Akun</label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setAuthRole('customer')}
                    className={`p-3 rounded-xl border text-center font-bold text-xs flex flex-col items-center gap-1.5 transition-all ${
                      authRole === 'customer' 
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800' 
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    <UserIcon className="w-5 h-5 text-emerald-600" />
                    Pelanggan
                  </button>
                  <button
                    type="button"
                    onClick={() => setAuthRole('store_owner')}
                    className={`p-3 rounded-xl border text-center font-bold text-xs flex flex-col items-center gap-1.5 transition-all ${
                      authRole === 'store_owner' 
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-800' 
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    <StoreIcon className="w-5 h-5 text-emerald-600" />
                    Pemilik Toko
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-3 rounded-xl transition-all shadow-lg"
            >
              {authMode === 'login' ? 'Masuk Sekarang' : authMode === 'register' ? 'Buat Akun' : 'Kirim Link Reset'}
            </button>
          </form>
        )}

        {!isVerifyingEmail && (
          <>
            <div className="relative my-6 text-center">
              <hr className="border-slate-100" />
              <span className="absolute -top-2.5 left-1/2 transform -translate-x-1/2 bg-white px-3 text-[10px] text-slate-400 font-bold uppercase tracking-widest">Atau</span>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.68 1.54 14.98 1 12 1 7.35 1 3.37 3.65 1.39 7.56l3.85 2.99c.92-2.77 3.51-4.51 6.76-4.51z"/>
                <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.4 3.58l3.76 2.91c2.2-2.03 3.67-5.02 3.67-8.64z"/>
                <path fill="#FBBC05" d="M5.24 14.81c-.24-.72-.38-1.49-.38-2.31s.14-1.59.38-2.31L1.39 7.2C.5 9 0 11 0 13s.5 4 1.39 5.8l3.85-2.99z"/>
                <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.76-2.91c-1.07.72-2.45 1.16-4.2 1.16-3.25 0-5.84-1.74-6.76-4.51L1.39 16.8C3.37 20.35 7.35 23 12 23z"/>
              </svg>
              Masuk cepat dengan Google
            </button>

            <div className="mt-6 text-center text-xs text-slate-500 font-medium">
              {authMode === 'login' ? (
                <>
                  Belum punya akun?{' '}
                  <button onClick={() => setAuthMode('register')} className="text-emerald-600 font-bold hover:underline">
                    Daftar Disini
                  </button>
                </>
              ) : (
                <>
                  Sudah punya akun?{' '}
                  <button onClick={() => setAuthMode('login')} className="text-emerald-600 font-bold hover:underline">
                    Masuk Disini
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
