import React, { useState } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Patient } from '../types';
import { Search, User, ArrowRight, AlertCircle } from 'lucide-react';

interface PatientSearchProps {
  onSelect: (patient: Patient) => void;
}

export default function PatientSearch({ onSelect }: PatientSearchProps) {
  const [nik, setNik] = useState('');
  const [loading, setLoading] = useState(false);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nik) return;

    setLoading(true);
    setError(null);
    setPatient(null);

    try {
      const docRef = doc(db, 'patients', nik);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setPatient(docSnap.data() as Patient);
      } else {
        setError('Pasien dengan NIK tersebut tidak ditemukan.');
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `patients/${nik}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-50 rounded-lg">
          <Search className="text-blue-600 w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Cari Data Pasien</h2>
          <p className="text-sm text-slate-500">Gunakan NIK untuk mencari data survei sebelumnya</p>
        </div>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Masukkan 16 digit NIK..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            value={nik}
            onChange={(e) => setNik(e.target.value)}
          />
        </div>
        <button
          disabled={loading}
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 rounded-xl transition-all disabled:opacity-50"
        >
          {loading ? 'Mencari...' : 'Cari'}
        </button>
      </form>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 mb-6">
          <AlertCircle size={20} />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {patient && (
        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border border-slate-200 shadow-sm">
                <User className="text-slate-400 w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-lg">{patient.name}</h3>
                <p className="text-sm text-slate-500">NIK: {patient.nik}</p>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              patient.category === 'Sekolah' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'
            }`}>
              {patient.category}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm mb-8">
            <div>
              <p className="text-slate-500 mb-1">Jenis Kelamin</p>
              <p className="font-medium text-slate-900">{patient.gender}</p>
            </div>
            <div>
              <p className="text-slate-500 mb-1">TTL</p>
              <p className="font-medium text-slate-900">{patient.pob}, {patient.dob}</p>
            </div>
            {patient.category === 'Sekolah' ? (
              <div>
                <p className="text-slate-500 mb-1">Kelas</p>
                <p className="font-medium text-slate-900">{patient.className}</p>
              </div>
            ) : (
              <div>
                <p className="text-slate-500 mb-1">Pekerjaan</p>
                <p className="font-medium text-slate-900">{patient.occupation}</p>
              </div>
            )}
            <div className="col-span-2">
              <p className="text-slate-500 mb-1">Alamat</p>
              <p className="font-medium text-slate-900">{patient.address}</p>
            </div>
          </div>

          <button
            onClick={() => onSelect(patient)}
            className="w-full flex items-center justify-center gap-2 bg-white hover:bg-slate-100 text-blue-600 font-semibold py-3 px-6 rounded-xl border border-blue-200 transition-all"
          >
            Lihat Rekam Medis
            <ArrowRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
