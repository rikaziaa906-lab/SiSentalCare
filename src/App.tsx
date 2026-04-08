/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { auth, signInWithGoogle, logout, db } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { LogIn, LogOut, UserPlus, Search, ClipboardList, Stethoscope, ShieldCheck, UserCog, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import PatientForm from './components/PatientForm';
import PatientSearch from './components/PatientSearch';
import PatientList from './components/PatientList';
import RecordForm from './components/RecordForm';
import { LoginForm } from './components/LoginForm';
import { Patient, AppUser } from './types';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'register' | 'search' | 'record' | 'list'>('register');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Fetch or create user document
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          setAppUser(userDoc.data() as AppUser);
        } else {
          // Default role for Google login if not exists
          const newUser: AppUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || 'User',
            role: 'TGM', // Default role
            photoURL: firebaseUser.photoURL || undefined,
            createdAt: serverTimestamp()
          };
          await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
          setAppUser(newUser);
        }
      } else {
        setAppUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <div className="mb-8 text-center">
          <div className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
            <Stethoscope className="text-white w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">SiDental Care</h1>
          <p className="text-slate-500 font-medium">Sistem Informasi Survei Kesehatan Gigi</p>
        </div>
        <LoginForm onSuccess={() => {}} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Stethoscope className="text-blue-600 w-6 h-6" />
            <span className="font-bold text-slate-900 hidden sm:block">SiDental Care</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="text-right hidden md:block">
                <div className="text-sm font-bold text-slate-900">{appUser?.displayName || user.displayName}</div>
                <div className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  {appUser?.role || 'Staff'}
                </div>
              </div>
              <img 
                src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(appUser?.displayName || 'User')}&background=random`} 
                alt="" 
                className="w-10 h-10 rounded-full border-2 border-white shadow-sm" 
                referrerPolicy="no-referrer" 
              />
            </div>
            <button
              onClick={logout}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
              title="Keluar"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 bg-slate-200/50 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('register')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'register' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserPlus size={18} />
            Pendaftaran
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'search' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Search size={18} />
            Cari Pasien
          </button>
          {(appUser?.role === 'admin' || appUser?.role === 'dokter gigi') && (
            <button
              onClick={() => setActiveTab('list')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users size={18} />
              Daftar Pasien
            </button>
          )}
          <button
            onClick={() => setActiveTab('record')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'record' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
            disabled={!selectedPatient}
          >
            <ClipboardList size={18} />
            Rekam Medis
            {!selectedPatient && <span className="text-[10px] opacity-50 ml-1">(Pilih Pasien)</span>}
          </button>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
          <AnimatePresence mode="wait">
            {activeTab === 'register' && (
              <motion.div
                key="register"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <PatientForm onComplete={(patient) => {
                  setSelectedPatient(patient);
                  setActiveTab('record');
                }} />
              </motion.div>
            )}

            {activeTab === 'search' && (
              <motion.div
                key="search"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <PatientSearch onSelect={(patient) => {
                  setSelectedPatient(patient);
                  setActiveTab('record');
                }} />
              </motion.div>
            )}

            {activeTab === 'list' && (appUser?.role === 'admin' || appUser?.role === 'dokter gigi') && (
              <motion.div
                key="list"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <PatientList 
                  userRole={appUser?.role}
                  onSelect={(patient) => {
                    setSelectedPatient(patient);
                    setActiveTab('record');
                  }} 
                />
              </motion.div>
            )}

            {activeTab === 'record' && selectedPatient && (
              <motion.div
                key="record"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <RecordForm patient={selectedPatient} onBack={() => setActiveTab('search')} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
