
export interface Student {
  id: string;
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
}

export interface Group {
  id: string;
  name: string;
  color: string; // Tailwind color class prefix (e.g., 'emerald')
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
  semester?: '1' | '2'; 
}

export interface GradeRecord {
  id: string;
  subject: string;
  category: string;
  score: number;
  maxScore: number;
  date: string;
  semester: '1' | '2'; 
}

export interface ScheduleDay {
  dayName: string;
  periods: string[]; 
}

export interface PeriodTime {
  periodNumber: number;
  startTime: string; 
  endTime: string;   
}

export interface AppState {
  students: Student[];
  selectedStudentId: string | null;
}