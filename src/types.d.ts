interface CaseData {
  id?: string;
  caseReference: string;           // الرقم المرجعي
  trackType: 'PROSECUTION' | 'PENALTY_EXECUTION'; // المسار الإجرائي
  crimeType: 'FELONY' | 'SIMPLE_MISDEMEANOR' | 'AGGRAVATED_MISDEMEANOR' | 'VIOLATION' | 'EXEMPTED'; // نوع الجريمة
  severityLevel?: 'HIDDEN' | 'EQUAL_TO_SENTENCE' | 'CUSTOM'; // درجة الجسامة
  customPenaltyDuration?: number;  // مدة تخصيص العقوبة (1-30 سنة)
  judicialAuthority: string;       // الجهة القضائية
  judicialOfficer: string;         // الصفة القضائية
  crimeDate: Date;                 // تاريخ اقتراف الجريمة
  status: 'ACTIVE' | 'WARNING' | 'URGENT' | 'CRITICAL' | 'SUSPENDED' | 'EXPIRED' | 'NON_PRESCRIPTIBLE';
  createdBy: string;
  createdAt: any; // server timestamp
  prescriptionStartDate: Date;
  prescriptionEndDate: Date;
  interruptionHistory?: InterruptionRecord[]; // سجل الانقطاعات
  suspensionHistory?: SuspensionRecord[]; // سجل الوقف
  lastActionDate?: Date;
  caseStage?: 'PROSECUTION' | 'SENTENCE'; // المرحلة (موجودة لتوافقية)
}

interface InterruptionRecord {
  id: string;
  type: 'INVESTIGATION' | 'PROSECUTION' | 'JUDICIAL_INVESTIGATION' | 'TRIAL';
  date: Date;
  performedBy: string;
  performedByName: string;
  notes?: string;
}

interface SuspensionRecord {
  id: string;
  startDate: Date;
  endDate?: Date;
  reason: string;
  suspendedBy: string;
  suspendedByName: string;
  resumedBy?: string;
  resumedByName?: string;
}

declare module './context/AuthContext.jsx' {
  import type { ReactNode } from 'react'

  export function AuthProvider(props: { children: ReactNode }): JSX.Element
  export function useAuth(): any
}

declare module './context/ToastContext.jsx' {
  import type { ReactNode } from 'react'

  export function ToastProvider(props: { children: ReactNode }): JSX.Element
  export function useToast(): any
}