
export interface Student {
  id: string;
  name: string;
  grade: string;
  classes: string[];
  attendance: AttendanceRecord[];
  behaviors: BehaviorRecord[];
  grades: GradeRecord[];
  avatar?: string;
}

export type AttendanceStatus = 'present' | 'absent' | 'late';

export interface AttendanceRecord {
  date: string;
  status: AttendanceStatus;
}

export type BehaviorType = 'positive' | 'negative';

export interface BehaviorRecord {
  id: string;
  date: string;
  type: BehaviorType;
  description: string;
  points: number;
}

export interface GradeRecord {
  id: string;
  subject: string;
  category: string; // مثل: مشاركة، اختبار، مشروع
  score: number;
  maxScore: number;
  date: string;
}

export interface AppState {
  students: Student[];
  selectedStudentId: string | null;
}
