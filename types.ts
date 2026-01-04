
export interface Student {
  id: string;
  ministryId?: string; // معرف الوزارة للمزامنة
  name: string;
  grade: string;
  classes: string[];
  attendance: AttendanceRecord[];
  behaviors: BehaviorRecord[];
  grades: GradeRecord[];
  parentPhone?: string;
  avatar?: string;
  spentCoins?: number; 
  groupId?: string | null; // معرف الفريق (ديناميكي)
  examPapers?: ExamPaper[];
}

export interface Group {
  id: string;
  name: string;
  color: string; // Tailwind color
}

export interface AttendanceRecord {
  date: string;
  status: AttendanceStatus;
}

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'truant';

export interface BehaviorRecord {
  id: string;
  date: string;
  type: BehaviorType;
  description: string;
  points: number;
  semester?: '1' | '2';
}

export type BehaviorType = 'positive' | 'negative';

export interface GradeRecord {
  id: string;
  subject: string;
  category: string; // "short_test_1", "project", etc.
  score: number;
  maxScore: number;
  date: string;
  semester?: '1' | '2';
}

export interface ScheduleDay {
  dayName: string;
  periods: string[]; // Array of class names or subjects for 8 periods
}

export interface PeriodTime {
  periodNumber: number;
  startTime: string; // "07:30"
  endTime: string;   // "08:10"
}

export interface AssessmentTool {
  id: string;
  name: string;
  maxScore: number;
}

export interface CertificateSettings {
  title: string;
  bodyText: string;
  backgroundImage?: string; // Base64 string for custom background
  showDefaultDesign: boolean; // Toggle built-in CSS shapes
}

// --- أنواع بيانات الوزارة (Ministry Sync) ---
export interface MinistrySession {
  userId: string;
  auth: string;
  userRoleId: string;
  schoolId: string;
  teacherId: string;
}

export interface StdsAbsDetail {
  StudentId: string;
  AbsenceType: number;
  Notes: string;
}

export interface StdsGradeDetail {
  StudentId: string;
  MarkValue: string;
  IsAbsent: boolean;
  Notes: string;
}

// --- Exam Grading Types ---
export interface GradingData {
  mcq: (number | null)[];
  essay: { [key: string]: { [part: string]: number } };
}

export interface ExamPaper {
  id: string;
  title: string;
  fileData: string; // Base64 string
  date: string;
  gradingData?: GradingData;
  totalScore?: number;
  maxScore?: number;
}

// --- تعريف الجسر الإلكتروني (Electron Bridge) ---
// هذا يسمح لـ TypeScript بمعرفة أن window.electron موجود وآمن للاستخدام
declare global {
  interface Window {
    electron?: {
      openExternal: (url: string) => Promise<void>;
    };
  }
}