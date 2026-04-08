import React, { useState } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Patient } from '../types';
import { Save, User } from 'lucide-react';

interface PatientFormProps {
  onComplete: (patient: Patient) => void;
}

export default function PatientForm({ onComplete }: PatientFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Patient>>({
    gender: 'Laki-laki',
    category: 'Sekolah'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nik || !formData.name) return;

    setLoading(true);
    try {
      const patientData = {
        ...formData,
        createdAt: serverTimestamp()
      } as Patient;

      await setDoc(doc(db, 'patients', formData.nik), patientData);
      onComplete(patientData);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `patients/${formData.nik}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-50 rounded-lg">
          <User className="text-blue-600 w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Pendaftaran Pasien Baru</h2>
          <p className="text-sm text-slate-500">Lengkapi data diri pasien untuk memulai survei</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">NIK (Nomor Induk Kependudukan)</label>
            <input
              required
              type="text"
              placeholder="Masukkan 16 digit NIK"
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              value={formData.nik || ''}
              onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Nama Lengkap</label>
            <input
              required
              type="text"
              placeholder="Nama sesuai KTP"
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Jenis Kelamin</label>
            <select
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
            >
              <option value="Laki-laki">Laki-laki</option>
              <option value="Perempuan">Perempuan</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Agama</label>
            <input
              type="text"
              placeholder="Contoh: Islam"
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              value={formData.religion || ''}
              onChange={(e) => setFormData({ ...formData, religion: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Tempat Lahir</label>
            <input
              required
              type="text"
              placeholder="Kota/Kabupaten"
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              value={formData.pob || ''}
              onChange={(e) => setFormData({ ...formData, pob: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Tanggal Lahir</label>
            <input
              required
              type="date"
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              value={formData.dob || ''}
              onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Bangsa</label>
            <input
              type="text"
              placeholder="Contoh: Indonesia"
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              value={formData.nationality || ''}
              onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Golongan Darah</label>
            <select
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              value={formData.bloodType || ''}
              onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })}
            >
              <option value="">Pilih</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="AB">AB</option>
              <option value="O">O</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Nomor Telepon</label>
            <input
              type="tel"
              placeholder="08xxxxxxxxxx"
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              value={formData.phone || ''}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Status</label>
            <input
              type="text"
              placeholder="Contoh: Belum Menikah"
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              value={formData.status || ''}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Berat Badan (kg)</label>
            <input
              type="number"
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              value={formData.weight || ''}
              onChange={(e) => setFormData({ ...formData, weight: Number(e.target.value) })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Tinggi Badan (cm)</label>
            <input
              type="number"
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              value={formData.height || ''}
              onChange={(e) => setFormData({ ...formData, height: Number(e.target.value) })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Asuransi Kesehatan</label>
            <input
              type="text"
              placeholder="Contoh: BPJS"
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              value={formData.insurance || ''}
              onChange={(e) => setFormData({ ...formData, insurance: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Kategori</label>
            <select
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
            >
              <option value="Sekolah">Anak Sekolah</option>
              <option value="Umum">Masyarakat Umum</option>
            </select>
          </div>

          {formData.category === 'Sekolah' ? (
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Kelas</label>
              <input
                required
                type="text"
                placeholder="Contoh: 6A"
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                value={formData.className || ''}
                onChange={(e) => setFormData({ ...formData, className: e.target.value })}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Pekerjaan</label>
              <input
                required
                type="text"
                placeholder="Contoh: Karyawan Swasta"
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                value={formData.occupation || ''}
                onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
              />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Alamat</label>
          <textarea
            required
            rows={3}
            placeholder="Alamat lengkap tempat tinggal"
            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            value={formData.address || ''}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
        </div>

        <div className="pt-4">
          <button
            disabled={loading}
            type="submit"
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-blue-100"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <Save size={20} />
                Simpan & Lanjutkan
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
