import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { Patient, DentalRecord } from '../types';
import { ClipboardList, Plus, History, Calendar, User as UserIcon, ArrowLeft, Send, X, FileText, Activity, HeartPulse, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RecordFormProps {
  patient: Patient;
  onBack: () => void;
}

export default function RecordForm({ patient, onBack }: RecordFormProps) {
  const [records, setRecords] = useState<DentalRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<DentalRecord | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Partial<DentalRecord>>({
    examiner: '',
    vitalSigns: { bp: '', pulse: 0, respiration: 0 },
    medicalHistory: {
      isHealthy: true,
      seriousIllness: '',
      bloodClotting: '',
      allergies: { food: '', medicine: '', anesthesia: '', weather: '', others: '' }
    },
    dentalHistory: {
      reason: '',
      concerns: [],
      lastXray: 'Tidak',
      previousComplications: 'Tidak',
      previousExperience: '',
      oralHealthBelief: 'Setuju',
      symptoms: [],
      biteGuard: false,
      appearanceConcerns: [],
      injuryHistory: 'Tidak',
      previousTreatments: []
    },
    ohiS: { debrisIndex: 0, calculusIndex: 0, totalScore: 0, category: '-' },
    dmft: { d: 0, m: 0, f: 0, total: 0 },
    deft: { d: 0, e: 0, f: 0, total: 0 },
    indices: { rti: 0, pti: 0 },
    diagnosis: {
      needs: '',
      causes: '',
      signs: '',
      goals: '',
      interventions: '',
      evaluation: ''
    }
  });

  // Calculate Indices
  useEffect(() => {
    const d = formData.dmft?.d || 0;
    const m = formData.dmft?.m || 0;
    const f = formData.dmft?.f || 0;
    const total = d + m + f;
    
    const rti = total > 0 ? (d / total) * 100 : 0;
    const pti = total > 0 ? (f / total) * 100 : 0;

    const di = formData.ohiS?.debrisIndex || 0;
    const ci = formData.ohiS?.calculusIndex || 0;
    const ohiTotal = di + ci;
    let ohiCat = '-';
    if (ohiTotal <= 1.2) ohiCat = 'Baik';
    else if (ohiTotal <= 3.0) ohiCat = 'Sedang';
    else ohiCat = 'Buruk';

    setFormData(prev => ({
      ...prev,
      dmft: { ...prev.dmft!, total },
      indices: { rti, pti },
      ohiS: { ...prev.ohiS!, totalScore: ohiTotal, category: ohiCat }
    }));
  }, [formData.dmft?.d, formData.dmft?.m, formData.dmft?.f, formData.ohiS?.debrisIndex, formData.ohiS?.calculusIndex]);

  useEffect(() => {
    const d = formData.deft?.d || 0;
    const e = formData.deft?.e || 0;
    const f = formData.deft?.f || 0;
    const total = d + e + f;
    setFormData(prev => ({
      ...prev,
      deft: { ...prev.deft!, total }
    }));
  }, [formData.deft?.d, formData.deft?.e, formData.deft?.f]);

  useEffect(() => {
    const q = query(
      collection(db, 'patients', patient.nik, 'records'),
      orderBy('surveyDate', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DentalRecord[];
      setRecords(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `patients/${patient.nik}/records`);
    });

    return unsubscribe;
  }, [patient.nik]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.examiner) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'patients', patient.nik, 'records'), {
        ...formData,
        patientNik: patient.nik,
        surveyDate: serverTimestamp()
      });
      setShowForm(false);
      setCurrentStep(1);
      setFormData({
        examiner: '',
        vitalSigns: { bp: '', pulse: 0, respiration: 0 },
        medicalHistory: {
          isHealthy: true,
          seriousIllness: '',
          bloodClotting: '',
          allergies: { food: '', medicine: '', anesthesia: '', weather: '', others: '' }
        },
        dentalHistory: {
          reason: '',
          concerns: [],
          lastXray: 'Tidak',
          previousComplications: 'Tidak',
          previousExperience: '',
          oralHealthBelief: 'Setuju',
          symptoms: [],
          biteGuard: false,
          appearanceConcerns: [],
          injuryHistory: 'Tidak',
          previousTreatments: []
        },
        ohiS: { debrisIndex: 0, calculusIndex: 0, totalScore: 0, category: '-' },
        dmft: { d: 0, m: 0, f: 0, total: 0 },
        deft: { d: 0, e: 0, f: 0, total: 0 },
        indices: { rti: 0, pti: 0 },
        diagnosis: {
          needs: '',
          causes: '',
          signs: '',
          goals: '',
          interventions: '',
          evaluation: ''
        }
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `patients/${patient.nik}/records`);
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="font-bold text-slate-900 border-b pb-2">1. Tanda Vital & Riwayat Medis</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">Tekanan Darah</label>
                <input
                  type="text"
                  placeholder="120/80"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                  value={formData.vitalSigns?.bp}
                  onChange={(e) => setFormData({ ...formData, vitalSigns: { ...formData.vitalSigns!, bp: e.target.value } })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">Denyut Nadi (BPM)</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                  value={formData.vitalSigns?.pulse}
                  onChange={(e) => setFormData({ ...formData, vitalSigns: { ...formData.vitalSigns!, pulse: Number(e.target.value) } })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">Pernafasan (RPM)</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                  value={formData.vitalSigns?.respiration}
                  onChange={(e) => setFormData({ ...formData, vitalSigns: { ...formData.vitalSigns!, respiration: Number(e.target.value) } })}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-slate-700">Pasien merasa sehat?</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="radio" checked={formData.medicalHistory?.isHealthy} onChange={() => setFormData({ ...formData, medicalHistory: { ...formData.medicalHistory!, isHealthy: true } })} /> Ya
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="radio" checked={!formData.medicalHistory?.isHealthy} onChange={() => setFormData({ ...formData, medicalHistory: { ...formData.medicalHistory!, isHealthy: false } })} /> Tidak
                  </label>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">Penyakit Serius/Operasi (5 thn terakhir)</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                  value={formData.medicalHistory?.seriousIllness}
                  onChange={(e) => setFormData({ ...formData, medicalHistory: { ...formData.medicalHistory!, seriousIllness: e.target.value } })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">Kelainan Pembekuan Darah</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                  value={formData.medicalHistory?.bloodClotting}
                  onChange={(e) => setFormData({ ...formData, medicalHistory: { ...formData.medicalHistory!, bloodClotting: e.target.value } })}
                />
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <h3 className="font-bold text-slate-900 border-b pb-2">2. Riwayat Kesehatan Gigi</h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">Alasan Utama Kunjungan</label>
                <textarea
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                  value={formData.dentalHistory?.reason}
                  onChange={(e) => setFormData({ ...formData, dentalHistory: { ...formData.dentalHistory!, reason: e.target.value } })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">Pengalaman Kunjungan Sebelumnya</label>
                <select
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                  value={formData.dentalHistory?.previousExperience}
                  onChange={(e) => setFormData({ ...formData, dentalHistory: { ...formData.dentalHistory!, previousExperience: e.target.value } })}
                >
                  <option value="">Pilih</option>
                  <option value="Sangat cemas/takut">Sangat cemas/takut</option>
                  <option value="Agak cemas/takut">Agak cemas/takut</option>
                  <option value="Tidak penting sama sekali">Tidak penting sama sekali</option>
                  <option value="Antusias">Antusias</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">Keyakinan: Kesehatan gigi mempengaruhi kesehatan umum?</label>
                <select
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                  value={formData.dentalHistory?.oralHealthBelief}
                  onChange={(e) => setFormData({ ...formData, dentalHistory: { ...formData.dentalHistory!, oralHealthBelief: e.target.value } })}
                >
                  <option value="Sangat Setuju">Sangat Setuju</option>
                  <option value="Setuju">Setuju</option>
                  <option value="Tidak Setuju">Tidak Setuju</option>
                  <option value="Sangat tidak setuju">Sangat tidak setuju</option>
                </select>
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6">
            <h3 className="font-bold text-slate-900 border-b pb-2">3. Indeks Kesehatan Gigi (OHI-S, DMF-T, def-t)</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* OHI-S */}
              <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h4 className="font-bold text-sm text-blue-600 uppercase tracking-wider">OHI-S (Oral Hygiene Index Simplified)</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500">Debris Index (DI)</label>
                    <input
                      type="number" step="0.1"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                      value={formData.ohiS?.debrisIndex}
                      onChange={(e) => setFormData({ ...formData, ohiS: { ...formData.ohiS!, debrisIndex: Number(e.target.value) } })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-500">Calculus Index (CI)</label>
                    <input
                      type="number" step="0.1"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                      value={formData.ohiS?.calculusIndex}
                      onChange={(e) => setFormData({ ...formData, ohiS: { ...formData.ohiS!, calculusIndex: Number(e.target.value) } })}
                    />
                  </div>
                </div>
                <div className="pt-2 flex justify-between items-center text-sm">
                  <span className="text-slate-500">Total OHI-S: <span className="font-bold text-slate-900">{formData.ohiS?.totalScore?.toFixed(1)}</span></span>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                    formData.ohiS?.category === 'Baik' ? 'bg-green-100 text-green-700' : 
                    formData.ohiS?.category === 'Sedang' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {formData.ohiS?.category}
                  </span>
                </div>
              </div>

              {/* DMF-T */}
              <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h4 className="font-bold text-sm text-blue-600 uppercase tracking-wider">DMF-T (Gigi Permanen)</h4>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-slate-500 uppercase">D (Decay)</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                      value={formData.dmft?.d}
                      onChange={(e) => setFormData({ ...formData, dmft: { ...formData.dmft!, d: Number(e.target.value) } })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-slate-500 uppercase">M (Missing)</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                      value={formData.dmft?.m}
                      onChange={(e) => setFormData({ ...formData, dmft: { ...formData.dmft!, m: Number(e.target.value) } })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-slate-500 uppercase">F (Filled)</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                      value={formData.dmft?.f}
                      onChange={(e) => setFormData({ ...formData, dmft: { ...formData.dmft!, f: Number(e.target.value) } })}
                    />
                  </div>
                </div>
                <div className="pt-2 flex justify-between items-center text-xs">
                  <span className="text-slate-500">Total DMF-T: <span className="font-bold text-slate-900">{formData.dmft?.total}</span></span>
                  <div className="flex gap-2">
                    <span className="text-slate-500">RTI: <span className="font-bold text-slate-900">{formData.indices?.rti?.toFixed(1)}%</span></span>
                    <span className="text-slate-500">PTI: <span className="font-bold text-slate-900">{formData.indices?.pti?.toFixed(1)}%</span></span>
                  </div>
                </div>
              </div>

              {/* def-t */}
              <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h4 className="font-bold text-sm text-blue-600 uppercase tracking-wider">def-t (Gigi Susu)</h4>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-slate-500 uppercase">d (decayed)</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                      value={formData.deft?.d}
                      onChange={(e) => setFormData({ ...formData, deft: { ...formData.deft!, d: Number(e.target.value) } })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-slate-500 uppercase">e (extracted)</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                      value={formData.deft?.e}
                      onChange={(e) => setFormData({ ...formData, deft: { ...formData.deft!, e: Number(e.target.value) } })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-slate-500 uppercase">f (filled)</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                      value={formData.deft?.f}
                      onChange={(e) => setFormData({ ...formData, deft: { ...formData.deft!, f: Number(e.target.value) } })}
                    />
                  </div>
                </div>
                <div className="pt-2 text-sm">
                  <span className="text-slate-500">Total def-t: <span className="font-bold text-slate-900">{formData.deft?.total}</span></span>
                </div>
              </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6">
            <h3 className="font-bold text-slate-900 border-b pb-2">4. Diagnosis & Perencanaan (Askesgilut)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">Kebutuhan yang tidak terpenuhi</label>
                <textarea
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                  value={formData.diagnosis?.needs}
                  onChange={(e) => setFormData({ ...formData, diagnosis: { ...formData.diagnosis!, needs: e.target.value } })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">Penyebab</label>
                <textarea
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                  value={formData.diagnosis?.causes}
                  onChange={(e) => setFormData({ ...formData, diagnosis: { ...formData.diagnosis!, causes: e.target.value } })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">Tanda-tanda dan Gejala</label>
                <textarea
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                  value={formData.diagnosis?.signs}
                  onChange={(e) => setFormData({ ...formData, diagnosis: { ...formData.diagnosis!, signs: e.target.value } })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-500">Intervensi Askesgilut</label>
                <textarea
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                  value={formData.diagnosis?.interventions}
                  onChange={(e) => setFormData({ ...formData, diagnosis: { ...formData.diagnosis!, interventions: e.target.value } })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Nama Pemeriksa</label>
              <input
                required
                type="text"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                value={formData.examiner}
                onChange={(e) => setFormData({ ...formData, examiner: e.target.value })}
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Patient Summary Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 p-6 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-100">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-xl font-bold">{patient.name}</h2>
            <p className="text-blue-100 text-sm">NIK: {patient.nik} • {patient.category}</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center justify-center gap-2 bg-white text-blue-600 font-bold py-2 px-6 rounded-xl hover:bg-blue-50 transition-all shadow-sm"
        >
          {showForm ? 'Batal' : (
            <>
              <Plus size={20} />
              Survei Baru
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form */}
        <div className={`lg:col-span-2 ${showForm ? 'block' : 'hidden lg:block'}`}>
          {!showForm ? (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
              <ClipboardList className="text-slate-300 w-16 h-16 mb-4" />
              <h3 className="font-bold text-slate-900 mb-2">Belum ada survei aktif</h3>
              <p className="text-slate-500 text-sm mb-6">Klik tombol "Survei Baru" untuk menambahkan hasil pemeriksaan kesehatan gigi.</p>
              <button
                onClick={() => setShowForm(true)}
                className="text-blue-600 font-semibold hover:underline"
              >
                Mulai Survei Sekarang
              </button>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-slate-200 p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 text-slate-900 font-bold">
                  <Plus className="text-blue-600" size={20} />
                  Input Hasil Survei
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((s) => (
                    <div key={s} className={`w-8 h-1 rounded-full ${currentStep >= s ? 'bg-blue-600' : 'bg-slate-200'}`} />
                  ))}
                </div>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {renderStep()}

                <div className="flex justify-between pt-6 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={currentStep === 1}
                    onClick={() => setCurrentStep(prev => prev - 1)}
                    className="px-6 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-30"
                  >
                    Kembali
                  </button>
                  
                  {currentStep < 4 ? (
                    <button
                      type="button"
                      onClick={() => setCurrentStep(prev => prev + 1)}
                      className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-semibold"
                    >
                      Lanjut
                    </button>
                  ) : (
                    <button
                      disabled={loading}
                      type="submit"
                      className="flex items-center gap-2 px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-semibold disabled:opacity-50"
                    >
                      {loading ? 'Menyimpan...' : (
                        <>
                          <Send size={18} />
                          Simpan Survei
                        </>
                      )}
                    </button>
                  )}
                </div>
              </form>
            </motion.div>
          )}
        </div>

        {/* Right Column: History */}
        <div className="lg:col-span-1">
          <div className="flex items-center gap-2 mb-4 text-slate-900 font-bold">
            <History className="text-blue-600" size={20} />
            Riwayat Survei
          </div>

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {records.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-slate-400 text-sm italic">Belum ada riwayat</p>
              </div>
            ) : (
              records.map((record) => (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                    <Calendar size={14} />
                    {record.surveyDate?.toDate().toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </div>
                  <div className="space-y-2 mb-3">
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Temuan Utama</div>
                    <h4 className="font-bold text-slate-900 text-sm line-clamp-2">
                      {record.diagnosis?.signs || record.dentalHistory?.reason || 'Survei Rutin'}
                    </h4>
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Tanda Vital & Indeks</div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                      <span>BP: {record.vitalSigns?.bp || '-'}</span>
                      <span>OHI-S: {record.ohiS?.totalScore?.toFixed(1) || '-'} ({record.ohiS?.category || '-'})</span>
                      <span>DMF-T: {record.dmft?.total || '-'}</span>
                      <span>def-t: {record.deft?.total || '-'}</span>
                      <span>RTI: {record.indices?.rti?.toFixed(1) || '0.0'}%</span>
                      <span>PTI: {record.indices?.pti?.toFixed(1) || '0.0'}%</span>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => setSelectedRecord(record)}
                      className="text-[10px] text-blue-600 font-bold uppercase hover:underline"
                    >
                      Lihat Detail
                    </button>
                    <span className="text-xs font-medium text-slate-700">{record.examiner}</span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl custom-scrollbar"
            >
              <div className="sticky top-0 bg-white border-b border-slate-100 px-8 py-6 flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-xl">
                    <FileText className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Detail Hasil Survei</h3>
                    <p className="text-slate-500 text-sm">
                      {selectedRecord.surveyDate?.toDate().toLocaleDateString('id-ID', { 
                        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X size={24} className="text-slate-400" />
                </button>
              </div>

              <div className="p-8 space-y-8">
                {/* Section 1: Vital Signs */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-blue-600 font-bold uppercase tracking-widest text-xs">
                    <Activity size={16} />
                    Tanda Vital & Riwayat Medis
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-50 p-4 rounded-2xl">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">TD (BP)</div>
                      <div className="text-lg font-bold text-slate-900">{selectedRecord.vitalSigns?.bp || '-'}</div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Nadi (Pulse)</div>
                      <div className="text-lg font-bold text-slate-900">{selectedRecord.vitalSigns?.pulse || '0'} <span className="text-xs font-normal">BPM</span></div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Nafas (Resp)</div>
                      <div className="text-lg font-bold text-slate-900">{selectedRecord.vitalSigns?.respiration || '0'} <span className="text-xs font-normal">RPM</span></div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Status Sehat</div>
                      <div className="text-lg font-bold text-slate-900">{selectedRecord.medicalHistory?.isHealthy ? 'Ya' : 'Tidak'}</div>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl space-y-2">
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Penyakit Serius / Operasi</div>
                    <div className="text-sm text-slate-700">{selectedRecord.medicalHistory?.seriousIllness || 'Tidak ada'}</div>
                  </div>
                </section>

                {/* Section 2: Dental History */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-blue-600 font-bold uppercase tracking-widest text-xs">
                    <HeartPulse size={16} />
                    Riwayat Kesehatan Gigi
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl space-y-4">
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">Alasan Kunjungan</div>
                      <div className="text-sm text-slate-700 font-medium">{selectedRecord.dentalHistory?.reason || '-'}</div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Pengalaman Sebelumnya</div>
                        <div className="text-sm text-slate-700">{selectedRecord.dentalHistory?.previousExperience || '-'}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Keyakinan Pasien</div>
                        <div className="text-sm text-slate-700">{selectedRecord.dentalHistory?.oralHealthBelief || '-'}</div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Section 3: Indices */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-blue-600 font-bold uppercase tracking-widest text-xs">
                    <Info size={16} />
                    Indeks Klinis (OHI-S, DMF-T, def-t)
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-blue-50 p-5 rounded-3xl border border-blue-100">
                      <div className="text-xs font-bold text-blue-600 uppercase mb-3">OHI-S</div>
                      <div className="flex items-end gap-2 mb-2">
                        <div className="text-3xl font-black text-blue-900">{selectedRecord.ohiS?.totalScore?.toFixed(1)}</div>
                        <div className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase mb-1 ${
                          selectedRecord.ohiS?.category === 'Baik' ? 'bg-green-100 text-green-700' : 
                          selectedRecord.ohiS?.category === 'Sedang' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {selectedRecord.ohiS?.category}
                        </div>
                      </div>
                      <div className="text-[10px] text-blue-400">DI: {selectedRecord.ohiS?.debrisIndex} | CI: {selectedRecord.ohiS?.calculusIndex}</div>
                    </div>

                    <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200">
                      <div className="text-xs font-bold text-slate-500 uppercase mb-3">DMF-T (Permanen)</div>
                      <div className="text-3xl font-black text-slate-900 mb-2">{selectedRecord.dmft?.total}</div>
                      <div className="flex gap-3 text-[10px] text-slate-400 font-bold">
                        <span>D: {selectedRecord.dmft?.d}</span>
                        <span>M: {selectedRecord.dmft?.m}</span>
                        <span>F: {selectedRecord.dmft?.f}</span>
                      </div>
                      <div className="mt-2 pt-2 border-t border-slate-200 flex gap-4 text-[10px] font-bold">
                        <span className="text-blue-600">RTI: {selectedRecord.indices?.rti?.toFixed(1)}%</span>
                        <span className="text-green-600">PTI: {selectedRecord.indices?.pti?.toFixed(1)}%</span>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200">
                      <div className="text-xs font-bold text-slate-500 uppercase mb-3">def-t (Susu)</div>
                      <div className="text-3xl font-black text-slate-900 mb-2">{selectedRecord.deft?.total}</div>
                      <div className="flex gap-3 text-[10px] text-slate-400 font-bold">
                        <span>d: {selectedRecord.deft?.d}</span>
                        <span>e: {selectedRecord.deft?.e}</span>
                        <span>f: {selectedRecord.deft?.f}</span>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Section 4: Diagnosis */}
                <section className="space-y-4">
                  <div className="flex items-center gap-2 text-blue-600 font-bold uppercase tracking-widest text-xs">
                    <ClipboardList size={16} />
                    Diagnosis & Perencanaan
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-2xl">
                      <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">Kebutuhan</div>
                      <div className="text-sm text-slate-700">{selectedRecord.diagnosis?.needs || '-'}</div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl">
                      <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">Penyebab</div>
                      <div className="text-sm text-slate-700">{selectedRecord.diagnosis?.causes || '-'}</div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl">
                      <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">Tanda & Gejala</div>
                      <div className="text-sm text-slate-700">{selectedRecord.diagnosis?.signs || '-'}</div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl">
                      <div className="text-[10px] text-slate-400 font-bold uppercase mb-1">Intervensi</div>
                      <div className="text-sm text-slate-700">{selectedRecord.diagnosis?.interventions || '-'}</div>
                    </div>
                  </div>
                </section>

                <div className="pt-8 border-t border-slate-100 flex justify-between items-center text-sm">
                  <div className="text-slate-500">
                    Pemeriksa: <span className="font-bold text-slate-900">{selectedRecord.examiner}</span>
                  </div>
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all"
                  >
                    Cetak Laporan
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
