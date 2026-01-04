
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Student, ScheduleDay, PeriodTime, Group, AssessmentTool, CertificateSettings } from '../types';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

interface TeacherInfo {
    name: string;
    school: string;
    subject: string;
    governorate: string;
    avatar?: string;
    stamp?: string;
    ministryLogo?: string;
    academicYear?: string;
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
  assessmentTools: AssessmentTool[];
  setAssessmentTools: React.Dispatch<React.SetStateAction<AssessmentTool[]>>;
  certificateSettings: CertificateSettings;
  setCertificateSettings: React.Dispatch<React.SetStateAction<CertificateSettings>>;
  isDataLoaded: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DB_FILENAME = 'rased_database_v2.json';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  
  // --- Initial States (Empty) ---
  const [currentSemester, setCurrentSemester] = useState<'1' | '2'>('1');
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  const [groups, setGroups] = useState<Group[]>([
      { id: 'g1', name: 'الصقور', color: 'emerald' }, 
      { id: 'g2', name: 'النمور', color: 'orange' }, 
      { id: 'g3', name: 'النجوم', color: 'purple' }, 
      { id: 'g4', name: 'الرواد', color: 'blue' }
  ]);
  const [schedule, setSchedule] = useState<ScheduleDay[]>([
    { dayName: 'الأحد', periods: Array(8).fill('') }, { dayName: 'الاثنين', periods: Array(8).fill('') }, 
    { dayName: 'الثلاثاء', periods: Array(8).fill('') }, { dayName: 'الأربعاء', periods: Array(8).fill('') }, 
    { dayName: 'الخميس', periods: Array(8).fill('') }
  ]);
  const [periodTimes, setPeriodTimes] = useState<PeriodTime[]>(
    Array(8).fill(null).map((_, i) => ({ periodNumber: i + 1, startTime: '', endTime: '' }))
  );
  
  // Calculate smart default for Academic Year
  const now = new Date();
  const defaultAcademicYear = now.getMonth() < 7 ? `${now.getFullYear() - 1} / ${now.getFullYear()}` : `${now.getFullYear()} / ${now.getFullYear() + 1}`;

  const [teacherInfo, setTeacherInfo] = useState<TeacherInfo>({ 
      name: '', school: '', subject: '', governorate: '', avatar: '', stamp: '', ministryLogo: '', academicYear: defaultAcademicYear 
  });
  const [assessmentTools, setAssessmentTools] = useState<AssessmentTool[]>([]);
  
  // Default Certificate Settings
  const [certificateSettings, setCertificateSettings] = useState<CertificateSettings>({
      title: 'شهادة تفوق دراسي',
      bodyText: 'تتشرف إدارة المدرسة بمنح الطالب هذه الشهادة نظير تفوقه وتميزه في المادة',
      showDefaultDesign: true
  });

  // Ref to track if we are in the initial load phase to prevent overwriting with empty data
  const isInitialLoad = useRef(true);
  const saveTimeoutRef = useRef<any>(null);

  // --- 1. LOAD DATA (One time on mount) ---
  useEffect(() => {
    const loadData = async () => {
        try {
            let data: any = null;
            let loadedFromFS = false;

            // A. Try loading from FileSystem (Preferred)
            if (Capacitor.isNativePlatform()) {
                try {
                    const result = await Filesystem.readFile({
                        path: DB_FILENAME,
                        directory: Directory.Data,
                        encoding: Encoding.UTF8
                    });
                    data = JSON.parse(result.data as string);
                    loadedFromFS = true;
                    console.log('📂 Data loaded from FileSystem');
                } catch (e) {
                    console.log('📂 No FileSystem data found, checking LocalStorage...');
                }
            }

            // B. Fallback/Migration from LocalStorage
            if (!data) {
                const lsStudents = localStorage.getItem('studentData');
                if (lsStudents) {
                    console.log('🔄 Migrating data from LocalStorage...');
                    data = {
                        students: JSON.parse(lsStudents),
                        classes: JSON.parse(localStorage.getItem('classesData') || '[]'),
                        groups: JSON.parse(localStorage.getItem('groupsData') || '[]'),
                        schedule: JSON.parse(localStorage.getItem('scheduleData') || '[]'),
                        periodTimes: JSON.parse(localStorage.getItem('periodTimes') || '[]'),
                        assessmentTools: JSON.parse(localStorage.getItem('assessmentTools') || '[]'),
                        currentSemester: localStorage.getItem('currentSemester') || '1',
                        teacherInfo: {
                            name: localStorage.getItem('teacherName') || '',
                            school: localStorage.getItem('schoolName') || '',
                            subject: localStorage.getItem('subjectName') || '',
                            governorate: localStorage.getItem('governorate') || '',
                            avatar: localStorage.getItem('teacherAvatar') || '',
                            stamp: localStorage.getItem('teacherStamp') || '',
                            ministryLogo: localStorage.getItem('ministryLogo') || '',
                            academicYear: localStorage.getItem('academicYear') || defaultAcademicYear
                        },
                        certificateSettings: JSON.parse(localStorage.getItem('certificateSettings') || 'null'),
                    };
                }
            }

            // C. Apply Data to State
            if (data) {
                if(data.students) setStudents(data.students);
                if(data.classes) setClasses(data.classes);
                if(data.groups && data.groups.length > 0) setGroups(data.groups);
                if(data.schedule && data.schedule.length > 0) setSchedule(data.schedule);
                if(data.periodTimes && data.periodTimes.length > 0) setPeriodTimes(data.periodTimes);
                if(data.assessmentTools) setAssessmentTools(data.assessmentTools);
                if(data.currentSemester) setCurrentSemester(data.currentSemester);
                if(data.teacherInfo) setTeacherInfo(prev => ({...prev, ...data.teacherInfo}));
                if(data.certificateSettings) setCertificateSettings(prev => ({...prev, ...data.certificateSettings}));
            }

        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setIsDataLoaded(true);
            setTimeout(() => { isInitialLoad.current = false; }, 1000); // Allow state to settle
        }
    };

    loadData();
  }, []);

  // --- 2. SAVE DATA (Debounced on change) ---
  useEffect(() => {
    if (isInitialLoad.current) return;

    // Clear previous timeout
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    // Set new timeout (Debounce 2 seconds to avoid excessive writes)
    saveTimeoutRef.current = setTimeout(async () => {
        const dataToSave = {
            version: '3.3.0',
            timestamp: new Date().toISOString(),
            students,
            classes,
            groups,
            schedule,
            periodTimes,
            teacherInfo,
            currentSemester,
            assessmentTools,
            certificateSettings,
        };

        const jsonString = JSON.stringify(dataToSave);

        // 1. Save to FileSystem (Native)
        if (Capacitor.isNativePlatform()) {
            try {
                await Filesystem.writeFile({
                    path: DB_FILENAME,
                    data: jsonString,
                    directory: Directory.Data,
                    encoding: Encoding.UTF8
                });
                console.log('💾 Saved to FileSystem');
            } catch (e) {
                console.error('Save to FS failed', e);
            }
        } 
        
        // 2. Backup to LocalStorage (Web/Fallback) - Only essential text data if possible, but for now full dump for web compatibility
        try {
            // Check size before saving to LS to avoid quota error crashing the app
            if (jsonString.length < 4500000) { // ~4.5MB limit safety
                localStorage.setItem('studentData', JSON.stringify(students));
                localStorage.setItem('classesData', JSON.stringify(classes));
                localStorage.setItem('groupsData', JSON.stringify(groups));
                localStorage.setItem('scheduleData', JSON.stringify(schedule));
                localStorage.setItem('periodTimes', JSON.stringify(periodTimes));
                localStorage.setItem('assessmentTools', JSON.stringify(assessmentTools));
                localStorage.setItem('currentSemester', currentSemester);
                localStorage.setItem('teacherName', teacherInfo.name);
                localStorage.setItem('academicYear', teacherInfo.academicYear || '');
                localStorage.setItem('certificateSettings', JSON.stringify(certificateSettings));
                // Save heavy images only if space permits or optimize later
                localStorage.setItem('teacherAvatar', teacherInfo.avatar || '');
            } else {
                console.warn('⚠️ Data too large for LocalStorage, relying on FileSystem only.');
            }
        } catch (e) {
            console.error('LocalStorage Quota Exceeded');
        }

    }, 2000);

    return () => {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [students, classes, groups, schedule, periodTimes, teacherInfo, currentSemester, assessmentTools, certificateSettings]);

  return (
    <AppContext.Provider value={{
        students, setStudents,
        classes, setClasses,
        groups, setGroups,
        schedule, setSchedule,
        periodTimes, setPeriodTimes,
        teacherInfo, setTeacherInfo,
        currentSemester, setCurrentSemester,
        assessmentTools, setAssessmentTools,
        certificateSettings, setCertificateSettings,
        isDataLoaded
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
