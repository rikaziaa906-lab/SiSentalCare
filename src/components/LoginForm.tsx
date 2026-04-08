import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, User, LogIn, UserPlus, ShieldCheck, Stethoscope, UserCog } from 'lucide-react';
import { loginWithEmail, registerWithEmail, signInWithGoogle, db } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { UserRole } from '../types';

interface LoginFormProps {
  onSuccess: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState<UserRole>('TGM');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isRegister) {
        const userCredential = await registerWithEmail(email, password);
        const user = userCredential.user;
        
        // Create user document in Firestore
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          displayName: displayName || user.email?.split('@')[0],
          role: role,
          createdAt: serverTimestamp()
        });
      } else {
        await loginWithEmail(email, password);
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat masuk');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat masuk dengan Google');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="text-blue-600 w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">
            {isRegister ? 'Daftar Akun Baru' : 'Masuk ke SiDental'}
          </h2>
          <p className="text-slate-500 mt-2">
            {isRegister ? 'Lengkapi data untuk akses sistem' : 'Gunakan akun Anda untuk masuk'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mb-6 text-center border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Nama Lengkap</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  required
                  type="text"
                  placeholder="Nama Anda"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                required
                type="email"
                placeholder="email@contoh.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Kata Sandi</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                required
                type="password"
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {isRegister && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Masuk Sebagai</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'admin', label: 'Admin', icon: UserCog },
                  { id: 'TGM', label: 'TGM', icon: ShieldCheck },
                  { id: 'dokter gigi', label: 'Dokter', icon: Stethoscope }
                ].map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRole(r.id as UserRole)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all ${
                      role === r.id 
                        ? 'bg-blue-50 border-blue-500 text-blue-600' 
                        : 'bg-white border-slate-200 text-slate-500 hover:border-blue-200'
                    }`}
                  >
                    <r.icon size={20} className="mb-1" />
                    <span className="text-[10px] font-bold uppercase">{r.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            disabled={loading}
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-4 shadow-lg shadow-blue-200"
          >
            {loading ? 'Memproses...' : (
              <>
                {isRegister ? <UserPlus size={20} /> : <LogIn size={20} />}
                {isRegister ? 'Daftar Sekarang' : 'Masuk Sekarang'}
              </>
            )}
          </button>
        </form>

        <div className="mt-6 relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-slate-500">Atau masuk dengan</span>
          </div>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full mt-6 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-3 rounded-xl flex items-center justify-center gap-3 transition-all"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
          Google Account
        </button>

        <div className="mt-8 text-center">
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-blue-600 font-semibold hover:underline text-sm"
          >
            {isRegister ? 'Sudah punya akun? Masuk' : 'Belum punya akun? Daftar'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
