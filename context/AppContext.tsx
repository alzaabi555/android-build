
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Student, ScheduleDay, PeriodTime, Group } from '../types';

interface TeacherInfo {
    name: string;
    school: string;
    subject: string;
    governorate: string;
}

interface AppContextType {
  students: Student[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  classes: string[];
  setClasses: React.Dispatch<React.SetStateAction<string[]>>;
  groups: Group[];
  setGroups: React.Dispatch<React.SetStateAction<Group[]>>;
  schedule: ScheduleDay[];
  setSchedule: React.Dispatch<React.SetStateAction<ScheduleDay[]>>;
  periodTimes: PeriodTime[];
  setPeriodTimes: React.Dispatch<React.SetStateAction<PeriodTime[]>>;
  teacherInfo: TeacherInfo;
  setTeacherInfo: React.Dispatch<React.SetStateAction<TeacherInfo>>;
  currentSemester: '1' | '2';
  setCurrentSemester: React.Dispatch<React.SetStateAction<'1' | '2'>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const OMAN_GOVERNORATES = ["مسقط", "ظفار", "مسندم", "البريمي", "الداخلية", "شمال الباطنة", "جنوب الباطنة", "جنوب الشرقية", "شمال الشرقية", "الظاهرة", "الوسطى"];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // --- State Initialization ---
  const [currentSemester, setCurrentSemester] = useState<'1' | '2'>(() => {
     try { return localStorage.getItem('currentSemester') === '2' ? '2' : '1'; } catch { return '1'; }
  });

  const [students, setStudents] = useState<Student[]>(() => {
    try { const saved = localStorage.getItem('studentData'); return saved ? JSON.parse(saved) : []; } catch { return []; }
  });

  const [classes, setClasses] = useState<string[]>(() => {
    try { const saved = localStorage.getItem('classesData'); return saved ? JSON.parse(saved) : []; } catch { return []; }
  });

  const [groups, setGroups] = useState<Group[]>(() => {
      try {
          const saved = localStorage.getItem('groupsData');
          if (saved) return JSON.parse(saved);
          return [ { id: 'g1', name: 'الصقور', color: 'emerald' }, { id: 'g2', name: 'النمور', color: 'orange' }, { id: 'g3', name: 'النجوم', color: 'purple' }, { id: 'g4', name: 'الرواد', color: 'blue' } ];
      } catch { return [ { id: 'g1', name: 'الصقور', color: 'emerald' }, { id: 'g2', name: 'النمور', color: 'orange' }, { id: 'g3', name: 'النجوم', color: 'purple' }, { id: 'g4', name: 'الرواد', color: 'blue' } ]; }
  });

  const [schedule, setSchedule] = useState<ScheduleDay[]>(() => {
    const defaultSchedule = [ { dayName: 'الأحد', periods: Array(8).fill('') }, { dayName: 'الاثنين', periods: Array(8).fill('') }, { dayName: 'الثلاثاء', periods: Array(8).fill('') }, { dayName: 'الأربعاء', periods: Array(8).fill('') }, { dayName: 'الخميس', periods: Array(8).fill('') } ];
    try { const saved = localStorage.getItem('scheduleData'); if (saved) { const parsed = JSON.parse(saved); if (Array.isArray(parsed)) return parsed; } } catch {}
    return defaultSchedule;
  });

  const [periodTimes, setPeriodTimes] = useState<PeriodTime[]>(() => {
    const defaultTimes = Array(8).fill(null).map((_, i) => ({ periodNumber: i + 1, startTime: '', endTime: '' }));
    try { const saved = localStorage.getItem('periodTimes'); if (saved) { const parsed = JSON.parse(saved); if (Array.isArray(parsed)) return defaultTimes.map((def, i) => parsed[i] || def); } } catch {}
    return defaultTimes;
  });

  const [teacherInfo, setTeacherInfo] = useState<TeacherInfo>(() => {
    try { return { name: localStorage.getItem('teacherName') || '', school: localStorage.getItem('schoolName') || '', subject: localStorage.getItem('subjectName') || '', governorate: localStorage.getItem('governorate') || '' }; } catch { return { name: '', school: '', subject: '', governorate: '' }; }
  });

  // --- Persistence Effect ---
  useEffect(() => {
    localStorage.setItem('studentData', JSON.stringify(students));
    localStorage.setItem('classesData', JSON.stringify(classes));
    localStorage.setItem('groupsData', JSON.stringify(groups));
    localStorage.setItem('teacherName', teacherInfo.name);
    localStorage.setItem('schoolName', teacherInfo.school);
    localStorage.setItem('subjectName', teacherInfo.subject);
    localStorage.setItem('governorate', teacherInfo.governorate);
    localStorage.setItem('scheduleData', JSON.stringify(schedule));
    localStorage.setItem('periodTimes', JSON.stringify(periodTimes));
    localStorage.setItem('currentSemester', currentSemester);
  }, [students, classes, groups, teacherInfo, schedule, periodTimes, currentSemester]);

  return (
    <AppContext.Provider value={{
        students, setStudents,
        classes, setClasses,
        groups, setGroups,
        schedule, setSchedule,
        periodTimes, setPeriodTimes,
        teacherInfo, setTeacherInfo,
        currentSemester, setCurrentSemester
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
