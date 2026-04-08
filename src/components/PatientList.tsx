import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { Patient, UserRole } from '../types';
import { Users, Trash2, Search, ArrowRight, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PatientListProps {
  onSelect: (patient: Patient) => void;
  userRole?: UserRole;
}

export default function PatientList({ onSelect, userRole }: PatientListProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'patients'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        ...doc.data()
      })) as Patient[];
      setPatients(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'patients');
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleDelete = async (nik: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus data pasien ini?')) return;
    try {
      await deleteDoc(doc(db, 'patients', nik));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `patients/${nik}`);
    }
  };

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.nik.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Users className="text-blue-600 w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Daftar Semua Pasien</h2>
            <p className="text-sm text-slate-500">Total: {patients.length} Pasien</p>
          </div>
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Cari nama atau NIK..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Pasien</th>
              <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Kategori</th>
              <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">TTL</th>
              <th className="py-4 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            <AnimatePresence>
              {filteredPatients.map((patient) => (
                <motion.tr
                  key={patient.nik}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="hover:bg-slate-50 transition-colors group"
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                        <User size={14} className="text-slate-400" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900">{patient.name}</div>
                        <div className="text-[10px] text-slate-500">NIK: {patient.nik}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      patient.category === 'Sekolah' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'
                    }`}>
                      {patient.category}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="text-xs text-slate-600">{patient.pob}, {patient.dob}</div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onSelect(patient)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="Lihat Rekam Medis"
                      >
                        <ArrowRight size={18} />
                      </button>
                      {userRole === 'admin' && (
                        <button
                          onClick={() => handleDelete(patient.nik)}
                          className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          title="Hapus Pasien"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
        {filteredPatients.length === 0 && (
          <div className="text-center py-12 text-slate-500 text-sm">
            Tidak ada data pasien ditemukan.
          </div>
        )}
      </div>
    </div>
  );
}
