export type UserRole = 'admin' | 'TGM' | 'dokter gigi';

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  photoURL?: string;
  createdAt: any;
}

export interface Patient {
  nik: string;
  name: string;
  gender: 'Laki-laki' | 'Perempuan';
  pob: string;
  dob: string;
  address: string;
  category: 'Sekolah' | 'Umum';
  className?: string;
  occupation?: string;
  religion?: string;
  nationality?: string;
  bloodType?: string;
  phone?: string;
  status?: string;
  weight?: number;
  height?: number;
  insurance?: string;
  createdAt: any;
}

export interface DentalRecord {
  id?: string;
  patientNik: string;
  surveyDate: any;
  examiner: string;
  
  // Page 1: Health History
  vitalSigns?: {
    bp: string;
    pulse: number;
    respiration: number;
  };
  medicalHistory?: {
    isHealthy: boolean;
    seriousIllness: string;
    bloodClotting: string;
    allergies: {
      food: string;
      medicine: string;
      anesthesia: string;
      weather: string;
      others: string;
    };
  };
  pharmacologicalHistory?: {
    takingMeds: boolean;
    medNames: string;
    medPurpose: string;
    sideEffects: string;
    positiveEffects: string;
    dosageIssues: string;
    regularConsumption: boolean;
  };

  // Page 2: Dental History & Habits
  dentalHistory?: {
    reason: string;
    concerns: string[];
    lastXray: string;
    previousComplications: string;
    previousExperience: string;
    oralHealthBelief: string;
    symptoms: string[];
    biteGuard: boolean;
    appearanceConcerns: string[];
    injuryHistory: string;
    previousTreatments: string[];
  };
  habits?: {
    brushingTools: string[];
    toothpasteType: string[];
    brushingDuration: number;
    brushingFrequency: string;
    difficultyBrushing: boolean;
    monthlyCheckup: boolean;
    badHabits: string[];
  };
  diet?: {
    candy: string;
    sweetDrinks: string;
    driedFruit: string;
    cannedDrinks: string;
    gum: string;
    crackers: string;
    syrup: string;
    chips: string;
    cookies: string;
    others: string;
  };

  // Page 3-4: Clinical Exam
  extraOral?: any;
  intraOral?: any;
  ohiS?: {
    debrisIndex: number;
    calculusIndex: number;
    totalScore: number;
    category: string;
  };
  dmft?: {
    d: number;
    m: number;
    f: number;
    total: number;
  };
  deft?: {
    d: number;
    e: number;
    f: number;
    total: number;
  };
  indices?: {
    rti: number;
    pti: number;
  };
  plaqueControl?: number;
  odontogram?: any;

  // Page 5: Diagnosis & Planning
  diagnosis?: {
    needs: string;
    causes: string;
    signs: string;
    goals: string;
    interventions: string;
    evaluation: string;
  };
  nextVisit?: string;
  recommendations?: string;
}
