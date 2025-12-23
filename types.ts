
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
  category: string;
  score: number;
  maxScore: number;
  date: string;
  semester: '1' | '2'; // 1 for First Semester, 2 for Second Semester
}

export interface ScheduleDay {
  dayName: string;
  periods: string[]; // 8 periods
}

export interface AppState {
  students: Student[];
  selectedStudentId: string | null;
}