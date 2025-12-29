import React, { Component, useState, useEffect, Suspense, useRef } from 'react';
import { Student, ScheduleDay, PeriodTime, Group } from './types';
import Dashboard from './components/Dashboard';
import StudentList from './components/StudentList';
import AttendanceTracker from './components/AttendanceTracker';
import GradeBook from './components/GradeBook';
import StudentReport from './components/StudentReport';
import ExcelImport from './components/ExcelImport';
import NoorPlatform from './components/NoorPlatform';
import GroupCompetition from './components/GroupCompetition';
import UserGuide from './components/UserGuide';
import BrandLogo from './components/BrandLogo';
import { App as CapApp } from '@capacitor/app';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share as SharePlugin } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { 
  Users, 
  CalendarCheck, 
  BarChart3, 
  ChevronLeft,
  GraduationCap,
  CheckCircle2,
  Info,
  Database,
  Trash2,
  Phone,
  Heart,
  X,
  Download,
  Share,
  Globe,
  Upload,
  AlertTriangle,
  Bell,
  RefreshCcw,
  MapPin,
  Trophy,
  HelpCircle,
  RotateCcw
} from 'lucide-react';

interface ErrorBoundaryProps {
  children?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMsg: string;
}

// --- Error Boundary Component ---
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMsg: '' };
  }

  static getDerivedStateFromError(error: any): ErrorBoundaryState {
    return { hasError: true, errorMsg: error.toString() };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("App Error Boundary Caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-slate-50 p-6 text-center" dir="rtl">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl max-w-sm border border-rose-100">
             <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-10 h-10 text-rose-500" />
             </div>
             <h2 className="text-xl font-black text-slate-800 mb-2">عذراً، حدث خطأ غير متوقع</h2>
             <p className="text-sm text-slate-500 font-bold mb-6 leading-relaxed">
               لا تقلق، بياناتك محفوظة. حدثت مشكلة تقنية بسيطة في عرض الواجهة.
             </p>
             <button 
                onClick={() => window.location.reload()} 
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
             >
                <RotateCcw className="w-4 h-4" /> إعادة تشغيل التطبيق
             </button>
             <p className="mt-4 text-[10px] text-gray-400 font-mono dir-ltr">{this.state.errorMsg.substring(0, 100)}</p>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Modern Toast Notification
const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error' | 'info' | 'bell', onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  // ألوان عصرية وتأثير زجاجي للتنبيهات
  const styles = type === 'success' 
    ? 'bg-emerald-500/90 text-white shadow-emerald-500/30' 
    : type === 'error' 
    ? 'bg-rose-500/90 text-white shadow-rose-500/30' 
    : type === 'bell' 
    ? 'bg-amber-500/90 text-white shadow-amber-500/30' 
    : 'bg-indigo-600/90 text-white shadow-indigo-500/30';
  
  const Icon = type === 'bell' ? Bell : (type === 'success' ? CheckCircle2 : (type === 'error' ? AlertTriangle : Info));

  return (
    <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 ${styles} backdrop-blur-md px-6 py-3.5 rounded-full shadow-2xl z-[200] flex items-center gap-3 animate-in slide-in-from-top-6 duration-500 border border-white/20 max-w-[90vw]`}>
      <div className="bg-white/20 p-1.5 rounded-full">
         <Icon className="w-4 h-4" />
      </div>
      <span className="text-xs font-black tracking-wide">{message}</span>
    </div>
  );
};

const OMAN_GOVERNORATES = [
  "مسقط",
  "ظفار",
  "مسندم",
  "البريمي",
  "الداخلية",
  "شمال الباطنة",
  "جنوب الباطنة",
  "جنوب الشرقية",
  "شمال الشرقية",
  "الظاهرة",
  "الوسطى"
];

// --- Security & Obfuscation Layer ---
const _SIG_N = "2YXYrdmF2K8g2K/YsdmI2YrYtCDYp9mE2LLYuNin2KjZig==";
const _SIG_P = "OTgzNDQ1NTU=";

const getCredits = () => {
    try {
        const n = decodeURIComponent(escape(window.atob(_SIG_N)));
        const p = window.atob(_SIG_P);
        return { name: n, phone: p };
    } catch (e) {
        return { name: "Error", phone: "" };
    }
};

const verifyIntegrity = () => {
    const c = getCredits();
    const check = window.btoa(unescape(encodeURIComponent(c.name)));
    return check === _SIG_N;
};

const AppContent: React.FC = () => {
  // Initialize activeTab from localStorage to persist state across restarts
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('activeTab') || 'dashboard');
  
  useEffect(() => {
      if (!verifyIntegrity()) {
          document.body.innerHTML = '<div style="display:flex;justify-content:center;align-items:center;height:100vh;background:#000;color:red;font-weight:bold;text-align:center;">Security Violation: Unauthorized Modification Detected.<br/>تم اكتشاف تعديل غير مصرح به في ملفات التطبيق.</div>';
          throw new Error("Security Violation");
      }
  }, []);

  const [currentSemester, setCurrentSemester] = useState<'1' | '2'>(() => {
     try {
         const saved = localStorage.getItem('currentSemester');
         return (saved === '1' || saved === '2') ? saved : '1';
     } catch { return '1'; }
  });

  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const saved = localStorage.getItem('studentData');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [classes, setClasses] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('classesData');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [groups, setGroups] = useState<Group[]>(() => {
      try {
          const saved = localStorage.getItem('groupsData');
          if (saved) return JSON.parse(saved);
          return [
              { id: 'g1', name: 'الصقور', color: 'emerald' },
              { id: 'g2', name: 'النمور', color: 'orange' },
              { id: 'g3', name: 'النجوم', color: 'purple' },
              { id: 'g4', name: 'الرواد', color: 'blue' },
          ];
      } catch { 
          return [
              { id: 'g1', name: 'الصقور', color: 'emerald' },
              { id: 'g2', name: 'النمور', color: 'orange' },
              { id: 'g3', name: 'النجوم', color: 'purple' },
              { id: 'g4', name: 'الرواد', color: 'blue' },
          ]; 
      }
  });

  const [schedule, setSchedule] = useState<ScheduleDay[]>(() => {
    const defaultSchedule = [
      { dayName: 'الأحد', periods: Array(8).fill('') },
      { dayName: 'الاثنين', periods: Array(8).fill('') },
      { dayName: 'الثلاثاء', periods: Array(8).fill('') },
      { dayName: 'الأربعاء', periods: Array(8).fill('') },
      { dayName: 'الخميس', periods: Array(8).fill('') },
    ];

    try {
      const saved = localStorage.getItem('scheduleData');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
            return parsed.map((day: any) => ({
                ...day,
                periods: Array.isArray(day.periods) 
                    ? (day.periods.length === 8 
                        ? day.periods 
                        : [...day.periods, ...Array(Math.max(0, 8 - day.periods.length)).fill('')].slice(0, 8))
                    : Array(8).fill('')
            }));
        }
      }
    } catch {}
    return defaultSchedule;
  });

  const [periodTimes, setPeriodTimes] = useState<PeriodTime[]>(() => {
    const defaultTimes = Array(8).fill(null).map((_, i) => ({ periodNumber: i + 1, startTime: '', endTime: '' }));
    try {
      const saved = localStorage.getItem('periodTimes');
      if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
              const merged = defaultTimes.map((def, i) => parsed[i] || def);
              return merged;
          }
      }
    } catch {}
    return defaultTimes;
  });

  const [teacherInfo, setTeacherInfo] = useState(() => {
    try {
      return {
        name: localStorage.getItem('teacherName') || '',
        school: localStorage.getItem('schoolName') || '',
        subject: localStorage.getItem('subjectName') || '',
        governorate: localStorage.getItem('governorate') || ''
      };
    } catch {
      return { name: '', school: '', subject: '', governorate: '' };
    }
  });

  const [viewSheetUrl, setViewSheetUrl] = useState(() => {
    try { return localStorage.getItem('viewSheetUrl') || ''; } catch { return ''; }
  });

  const [isSetupComplete, setIsSetupComplete] = useState(!!teacherInfo.name && !!teacherInfo.school);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(() => localStorage.getItem('selectedStudentId') || null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error' | 'info' | 'bell'} | null>(null);

  const bellAudioRef = useRef<HTMLAudioElement | null>(null);
  const credits = getCredits();

  useEffect(() => {
    bellAudioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/1085/1085-preview.mp3');
  }, []);

  useEffect(() => {
    const setupAppStateListener = async () => {
      try {
        await CapApp.removeAllListeners(); 
        await CapApp.addListener('appStateChange', ({ isActive }) => {
          if (isActive) {
             // Optional: Refresh data or check time
          }
        });
      } catch (e) {
        console.error('Error setting up app state listener', e);
      }
    };
    setupAppStateListener();
  }, []);

  useEffect(() => {
      const checkTime = () => {
          const now = new Date();
          const currentTime = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); 
          const currentDay = now.getDay(); 

          if (currentDay > 4) return;

          periodTimes.forEach(p => {
              if (p.startTime === currentTime || p.endTime === currentTime) {
                   const type = p.startTime === currentTime ? 'بداية' : 'نهاية';
                   setToast({ message: `حان موعد ${type} الحصة ${p.periodNumber}`, type: 'bell' });
                   if (bellAudioRef.current) {
                       bellAudioRef.current.play().catch(e => console.log('Audio play failed', e));
                   }
              }
          });
      };

      const interval = setInterval(checkTime, 1000 * 30);
      return () => clearInterval(interval);
  }, [periodTimes]);

  useEffect(() => {
    const scheduleNotifications = async () => {
        try {
            const perm = await LocalNotifications.requestPermissions();
            if (perm.display !== 'granted') return;

            const pending = await LocalNotifications.getPending();
            if (pending.notifications.length > 0) {
                await LocalNotifications.cancel(pending);
            }

            const now = new Date();
            const currentDay = now.getDay();
            if (currentDay > 4) return;

            const notifsToSchedule: any[] = [];
            let idCounter = 1000;

            const createDateFromTime = (timeStr: string, offsetMinutes: number) => {
                if (!timeStr) return null;
                const [h, m] = timeStr.split(':').map(Number);
                const d = new Date();
                d.setHours(h);
                d.setMinutes(m + offsetMinutes);
                d.setSeconds(0);
                return d;
            };

            periodTimes.forEach(p => {
                if (p.startTime) {
                    const notifyTime = createDateFromTime(p.startTime, -5);
                    if (notifyTime && notifyTime > now) {
                        notifsToSchedule.push({
                            id: idCounter++,
                            title: 'تنبيه الحصص 🔔',
                            body: `الحصة ${p.periodNumber} تبدأ بعد 5 دقائق`,
                            schedule: { at: notifyTime },
                            sound: 'beep.wav'
                        });
                    }
                }

                if (p.endTime) {
                    const notifyTime = createDateFromTime(p.endTime, -5);
                    if (notifyTime && notifyTime > now) {
                         notifsToSchedule.push({
                            id: idCounter++,
                            title: 'تنبيه الحصص 🔔',
                            body: `الحصة ${p.periodNumber} تنتهي بعد 5 دقائق`,
                            schedule: { at: notifyTime },
                            sound: 'beep.wav'
                        });
                    }
                }
            });

            if (notifsToSchedule.length > 0) {
                await LocalNotifications.schedule({ notifications: notifsToSchedule });
            }

        } catch (e) {
            console.error('Error scheduling notifications:', e);
        }
    };

    scheduleNotifications();
  }, [periodTimes]);

  useEffect(() => {
    let backButtonListener: any;
    const setupBackButton = async () => {
      try {
        backButtonListener = await CapApp.addListener('backButton', ({ canGoBack }) => {
            if (showSettingsModal) {
                setShowSettingsModal(false);
            } else if (activeTab !== 'dashboard') {
                setActiveTab('dashboard');
            } else {
                CapApp.exitApp();
            }
        });
      } catch (e) {
      }
    };
    setupBackButton();
    return () => { if(backButtonListener) backButtonListener.remove(); };
  }, [showSettingsModal, activeTab]);

  useEffect(() => {
    const saveData = () => {
        try {
            localStorage.setItem('studentData', JSON.stringify(students));
            localStorage.setItem('classesData', JSON.stringify(classes));
            localStorage.setItem('groupsData', JSON.stringify(groups));
            localStorage.setItem('teacherName', teacherInfo.name);
            localStorage.setItem('schoolName', teacherInfo.school);
            localStorage.setItem('subjectName', teacherInfo.subject);
            localStorage.setItem('governorate', teacherInfo.governorate);
            localStorage.setItem('scheduleData', JSON.stringify(schedule));
            localStorage.setItem('periodTimes', JSON.stringify(periodTimes));
            localStorage.setItem('viewSheetUrl', viewSheetUrl);
            localStorage.setItem('currentSemester', currentSemester);
            localStorage.setItem('activeTab', activeTab);
            if (selectedStudentId) {
                localStorage.setItem('selectedStudentId', selectedStudentId);
            } else {
                localStorage.removeItem('selectedStudentId');
            }
        } catch (e) {
            console.warn("Storage restricted", e);
        }
    };

    saveData();

    window.addEventListener('beforeunload', saveData);
    return () => {
        window.removeEventListener('beforeunload', saveData);
    };
  }, [students, classes, activeTab, teacherInfo, schedule, viewSheetUrl, currentSemester, periodTimes, groups, selectedStudentId]);

  const handleUpdateStudent = (updatedStudent: Student) => {
    setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
  };

  const handleDeleteStudent = (studentId: string) => {
      setStudents(prev => prev.filter(s => s.id !== studentId));
      setToast({ message: 'تم حذف الطالب بنجاح', type: 'success' });
  };

  const handleAddStudentManually = (name: string, className: string, phone?: string, avatar?: string) => {
    const newStudent: Student = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      grade: '',
      classes: [className],
      attendance: [],
      behaviors: [],
      grades: [],
      parentPhone: phone,
      avatar: avatar
    };
    setStudents(prev => [newStudent, ...prev]);
    if (!classes.includes(className)) {
      setClasses(prev => [...prev, className].sort());
    }
  };

  const handleClearAllData = () => {
    if (confirm('هل أنت متأكد من رغبتك في حذف جميع بيانات الطلاب؟')) {
      setStudents([]);
      setClasses([]);
      setToast({ message: 'تم حذف البيانات', type: 'success' });
      setShowSettingsModal(false);
    }
  };

  const handleEditClass = (oldName: string, newName: string) => {
      setClasses(prev => prev.map(c => c === oldName ? newName : c).sort());
      setStudents(prev => prev.map(s => ({
          ...s,
          classes: s.classes.map(c => c === oldName ? newName : c)
      })));
      setToast({ message: 'تم تعديل اسم الفصل بنجاح', type: 'success' });
  };

  const handleDeleteClass = (className: string) => {
      setClasses(prev => prev.filter(c => c !== className));
      setStudents(prev => prev.map(s => ({
          ...s,
          classes: s.classes.filter(c => c !== className)
      })));
      setToast({ message: 'تم حذف الفصل', type: 'success' });
  };

  const handleBackupData = async (mode: 'share' | 'download') => {
    try {
      const dataToSave = { teacherInfo, students, classes, groups, schedule, periodTimes, exportDate: new Date().toISOString() };
      const fileName = `madrasati_backup_${new Date().toISOString().split('T')[0]}.json`;
      const jsonString = JSON.stringify(dataToSave, null, 2);

      if (Capacitor.isNativePlatform()) {
          try {
              const result = await Filesystem.writeFile({
                  path: fileName,
                  data: jsonString,
                  directory: Directory.Cache,
                  encoding: Encoding.UTF8
              });

              await SharePlugin.share({
                  title: 'نسخة احتياطية - راصد',
                  url: result.uri,
                  dialogTitle: mode === 'share' ? 'مشاركة عبر' : 'حفظ الملف'
              });
          } catch (e) {
              setToast({ message: 'حدث خطأ أثناء العملية', type: 'error' });
          }
          return;
      }

      const file = new File([jsonString], fileName, { type: 'application/json' });

      if (mode === 'share') {
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
              await navigator.share({
                files: [file],
                title: 'نسخة احتياطية',
                text: 'ملف بيانات تطبيق راصد'
              });
              return; 
            } catch (shareError) {
              return;
            }
          } else {
              setToast({ message: 'المشاركة المباشرة غير مدعومة في هذا المتصفح. استخدم زر التحميل.', type: 'info' });
              return;
          }
      }

      const url = URL.createObjectURL(file);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setToast({ message: 'تم تحميل ملف النسخة الاحتياطية', type: 'success' });

    } catch (error) { setToast({ message: 'فشل إنشاء النسخة', type: 'error' }); }
  };

  const handleRestoreData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!confirm('سيتم استبدال البيانات الحالية. هل أنت متأكد؟')) { if(e.target) e.target.value = ''; return; }

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const json = JSON.parse(event.target?.result as string);
            if (!json.students || !Array.isArray(json.students)) throw new Error('ملف غير صالح');
            setTeacherInfo(json.teacherInfo || { name: '', school: '', subject: '', governorate: '' });
            setStudents(json.students || []);
            setClasses(json.classes || []);
            setGroups(json.groups || []);
            setSchedule(json.schedule || []);
            if(json.periodTimes) setPeriodTimes(json.periodTimes);
            setToast({ message: 'تم استعادة البيانات', type: 'success' });
            setShowSettingsModal(false);
        } catch (error) { setToast({ message: 'ملف غير صالح', type: 'error' }); }
    };
    reader.readAsText(file);
    if(e.target) e.target.value = '';
  };

  const handleStartApp = (e?: React.FormEvent) => {
    if(e) e.preventDefault();
    setIsSetupComplete(true);
  };

  const handleResetSetup = () => {
    setTeacherInfo({ name: '', school: '', subject: '', governorate: '' });
  };

  const navItems = [
    { id: 'dashboard', icon: BarChart3, label: 'الرئيسية' },
    { id: 'attendance', icon: CalendarCheck, label: 'الحضور' }, 
    { id: 'students', icon: Users, label: 'الطلاب' },
    { id: 'grades', icon: GraduationCap, label: 'الدرجات' },
    { id: 'group-competition', icon: Trophy, label: 'الدوري' }, 
    { id: 'noor', icon: Globe, label: 'نور' },
    { id: 'guide', icon: HelpCircle, label: 'الدليل' },
  ];

  if (!isSetupComplete) {
    return (
      <div className="fixed inset-0 w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-50 px-8 animate-in fade-in duration-700 overflow-auto" style={{direction: 'rtl'}}>
        <div className="bg-white/70 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-2xl w-full max-w-sm border border-white/50">
            <div className="mb-6 flex justify-center">
               <div className="w-28 h-28 transform hover:scale-105 transition-transform duration-500">
                   <BrandLogo className="w-full h-full" />
               </div>
            </div>

            <h1 className="text-3xl font-black text-slate-800 mb-2 text-center tracking-tight">مرحباً بك في راصد</h1>
            <p className="text-sm text-slate-500 font-bold mb-8 text-center leading-relaxed">رفيقك الذكي لإدارة الفصل الدراسي باحترافية</p>
            
            <form onSubmit={handleStartApp} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 mr-2">اسم المعلم / المعلمة</label>
                <input 
                    type="text" 
                    className="w-full bg-white/80 rounded-2xl py-3.5 px-5 text-sm font-bold outline-none border border-transparent focus:border-indigo-500/30 focus:bg-white focus:shadow-lg focus:shadow-indigo-500/10 transition-all text-slate-800 placeholder:text-slate-300" 
                    value={teacherInfo.name} 
                    onChange={(e) => setTeacherInfo({...teacherInfo, name: e.target.value})}
                    autoComplete="off"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 mr-2">المادة الدراسية</label>
                <input 
                    type="text" 
                    className="w-full bg-white/80 rounded-2xl py-3.5 px-5 text-sm font-bold outline-none border border-transparent focus:border-indigo-500/30 focus:bg-white focus:shadow-lg focus:shadow-indigo-500/10 transition-all text-slate-800 placeholder:text-slate-300" 
                    placeholder="مثال: اللغة العربية"
                    value={teacherInfo.subject} 
                    onChange={(e) => setTeacherInfo({...teacherInfo, subject: e.target.value})}
                    autoComplete="off"
                />
              </div>
               <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 mr-2">المحافظة التعليمية</label>
                <div className="relative">
                    <select 
                        className="w-full bg-white/80 rounded-2xl py-3.5 px-5 text-sm font-bold outline-none border border-transparent focus:border-indigo-500/30 focus:bg-white focus:shadow-lg focus:shadow-indigo-500/10 transition-all text-slate-800 appearance-none"
                        value={teacherInfo.governorate}
                        onChange={(e) => setTeacherInfo({...teacherInfo, governorate: e.target.value})}
                    >
                        <option value="">اختر المحافظة...</option>
                        {OMAN_GOVERNORATES.map(gov => (
                            <option key={gov} value={gov}>{gov}</option>
                        ))}
                    </select>
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <MapPin className="w-4 h-4" />
                    </div>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 mr-2">اسم المدرسة</label>
                <input 
                    type="text" 
                    className="w-full bg-white/80 rounded-2xl py-3.5 px-5 text-sm font-bold outline-none border border-transparent focus:border-indigo-500/30 focus:bg-white focus:shadow-lg focus:shadow-indigo-500/10 transition-all text-slate-800 placeholder:text-slate-300" 
                    value={teacherInfo.school} 
                    onChange={(e) => setTeacherInfo({...teacherInfo, school: e.target.value})}
                    autoComplete="off"
                />
              </div>

              <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={handleResetSetup}
                    className="p-4 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-100 transition-colors shadow-sm"
                    title="إعادة تعيين"
                  >
                      <RefreshCcw className="w-5 h-5" />
                  </button>
                  <button 
                    type="submit" 
                    disabled={!teacherInfo.name || !teacherInfo.school} 
                    className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm active:scale-95 flex items-center justify-center gap-2 shadow-xl shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 disabled:shadow-none transition-all"
                  >
                    بدء الاستخدام <CheckCircle2 className="w-5 h-5" />
                  </button>
              </div>
            </form>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex bg-transparent overflow-hidden select-none" style={{direction: 'rtl'}}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Floating Glass Sidebar (Desktop) */}
      <aside className="hidden md:flex w-72 flex-col h-[calc(100vh-32px)] m-4 rounded-[2rem] bg-white/80 backdrop-blur-2xl border border-white/50 shadow-2xl shrink-0 z-50 overflow-hidden relative">
         {/* Sidebar Header */}
         <div className="p-8 flex flex-col items-center border-b border-gray-100/50">
             <div className="w-24 h-24 mb-4 filter drop-shadow-xl hover:scale-105 transition-transform duration-500">
               <BrandLogo className="w-full h-full" showText={false} />
             </div>
             <h2 className="text-xl font-black text-slate-800 tracking-tight">راصد</h2>
             <p className="text-[10px] font-bold text-slate-400 mt-1">{teacherInfo.school}</p>
         </div>

         {/* Nav Items */}
         <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2 custom-scrollbar">
            {navItems.map(item => (
               <button
                 key={item.id}
                 onClick={() => setActiveTab(item.id)}
                 className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-300 group ${
                    activeTab === item.id 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 translate-x-1' 
                    : 'text-slate-500 hover:bg-slate-100/80 hover:text-slate-900'
                 }`}
               >
                 <item.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${activeTab === item.id ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                 <span className="text-sm font-bold">{item.label}</span>
               </button>
            ))}
         </nav>

         {/* Footer Action */}
         <div className="p-4 border-t border-gray-100/50 bg-white/30">
             <button onClick={() => setShowSettingsModal(true)} className="w-full flex items-center gap-3 px-5 py-3 rounded-2xl text-slate-500 hover:bg-white hover:shadow-md transition-all">
                <Info className="w-5 h-5" />
                <span className="text-xs font-bold">حول التطبيق</span>
             </button>
         </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <main 
          className="flex-1 overflow-y-auto pt-[var(--sat)] md:pt-4 px-4 md:px-6 scrollbar-thin scroll-smooth pb-[calc(90px+var(--sab))]"
          style={{ overscrollBehaviorY: 'none' }}
        >
          <div className="max-w-full md:max-w-7xl mx-auto h-full pt-2 md:pt-4">
            <Suspense fallback={
                <div className="flex flex-col items-center justify-center h-96 gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm font-bold text-gray-400">جاري التحميل...</p>
                </div>
            }>
              {/* Apply page transition class wrapper */}
              <div key={activeTab} className="page-enter-active">
                  {activeTab === 'dashboard' && (
                    <Dashboard 
                      students={students} 
                      teacherInfo={teacherInfo}
                      onUpdateTeacherInfo={setTeacherInfo} 
                      schedule={schedule}
                      onUpdateSchedule={setSchedule}
                      onSelectStudent={(s) => { setSelectedStudentId(s.id); setActiveTab('report'); }} 
                      onNavigate={(tab) => setActiveTab(tab)}
                      onOpenSettings={() => setShowSettingsModal(true)}
                      periodTimes={periodTimes}
                      setPeriodTimes={setPeriodTimes}
                    />
                  )}
                  {activeTab === 'students' && (
                    <StudentList 
                      students={students} 
                      classes={classes} 
                      onAddClass={(c) => setClasses(prev => [...prev, c].sort())} 
                      onAddStudentManually={handleAddStudentManually} 
                      onUpdateStudent={handleUpdateStudent} 
                      onDeleteStudent={handleDeleteStudent}
                      onViewReport={(s) => { setSelectedStudentId(s.id); setActiveTab('report'); }}
                      onSwitchToImport={() => setActiveTab('import')}
                      currentSemester={currentSemester}
                      onSemesterChange={setCurrentSemester}
                      onEditClass={handleEditClass}
                      onDeleteClass={handleDeleteClass}
                    />
                  )}
                  {activeTab === 'attendance' && <AttendanceTracker students={students} classes={classes} setStudents={setStudents} />}
                  {activeTab === 'grades' && (
                    <GradeBook 
                      students={students} 
                      classes={classes} 
                      onUpdateStudent={handleUpdateStudent}
                      setStudents={setStudents}
                      currentSemester={currentSemester}
                      onSemesterChange={setCurrentSemester}
                      teacherInfo={teacherInfo}
                    />
                  )}
                   {activeTab === 'group-competition' && (
                    <GroupCompetition 
                      students={students}
                      classes={classes}
                      onUpdateStudent={handleUpdateStudent}
                      groups={groups}
                      onUpdateGroups={setGroups}
                      setStudents={setStudents}
                    />
                  )}

                  {activeTab === 'import' && <ExcelImport existingClasses={classes} onImport={(ns) => { setStudents(prev => [...prev, ...ns]); setActiveTab('students'); }} onAddClass={(c) => setClasses(prev => [...prev, c].sort())} />}
                  {activeTab === 'noor' && <NoorPlatform />}
                  {activeTab === 'guide' && <UserGuide />}
                  {activeTab === 'report' && selectedStudentId && (
                    <div className="max-w-4xl mx-auto">
                      <button onClick={() => setActiveTab('students')} className="mb-4 flex items-center gap-2 text-indigo-600 font-bold text-xs bg-white/80 backdrop-blur px-4 py-2 rounded-full hover:bg-white transition-all shadow-sm"><ChevronLeft className="w-4 h-4" /> العودة للقائمة</button>
                      <StudentReport 
                        student={students.find(s => s.id === selectedStudentId)!} 
                        onUpdateStudent={handleUpdateStudent} 
                        currentSemester={currentSemester}
                        teacherInfo={teacherInfo}
                      />
                    </div>
                  )}
              </div>
            </Suspense>
          </div>
        </main>

        {/* Mobile Bottom Navigation (Glassmorphism) */}
        <nav 
          className="md:hidden fixed bottom-6 left-4 right-4 bg-white/90 backdrop-blur-2xl border border-white/20 z-50 shadow-2xl shadow-indigo-900/10 rounded-[2rem] h-16 flex items-center justify-around px-2"
        >
            {navItems.map(item => (
              <button 
                key={item.id} 
                onClick={() => setActiveTab(item.id)} 
                className={`flex flex-col items-center justify-center w-full h-full transition-all duration-300 active:scale-90 ${activeTab === item.id ? 'text-indigo-600' : 'text-slate-400'}`}
              >
                <div className={`p-1.5 rounded-xl transition-all ${activeTab === item.id ? 'bg-indigo-50 translate-y-[-2px]' : ''}`}>
                    <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'fill-indigo-600/20 stroke-[2.5px]' : 'stroke-2'}`} />
                </div>
              </button>
            ))}
        </nav>
      </div>

      {/* Settings Modal - CENTERED */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setShowSettingsModal(false)}>
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
             {/* Modal Header */}
             <div className="p-6 pb-2">
                 <div className="flex justify-between items-start mb-4">
                     <div>
                         <h2 className="text-xl font-black text-gray-900">الإعدادات</h2>
                         <p className="text-xs text-gray-500 font-bold">تخصيص التطبيق والبيانات</p>
                     </div>
                     <button onClick={() => setShowSettingsModal(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X className="w-5 h-5 text-gray-500"/></button>
                 </div>
             </div>

             {/* Modal Body */}
             <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-6 space-y-4">
                 
                 <div className="bg-indigo-50 p-4 rounded-2xl flex items-center gap-4">
                     <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                         <BrandLogo className="w-8 h-8" showText={false} />
                     </div>
                     <div>
                         <h3 className="font-black text-indigo-900 text-sm">راصد التعليمي</h3>
                         <p className="text-[10px] font-bold text-indigo-600">الإصدار 3.3</p>
                     </div>
                 </div>

                 <div className="space-y-2">
                     <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider">النسخ الاحتياطي</h4>
                     <button onClick={() => handleBackupData('download')} className="w-full flex items-center gap-3 p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
                         <Download className="w-5 h-5 text-gray-600" />
                         <span className="text-xs font-bold text-gray-700">تحميل نسخة احتياطية</span>
                     </button>
                     <button onClick={() => handleBackupData('share')} className="w-full flex items-center gap-3 p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
                         <Share className="w-5 h-5 text-gray-600" />
                         <span className="text-xs font-bold text-gray-700">مشاركة نسخة احتياطية</span>
                     </button>
                     <label className="w-full flex items-center gap-3 p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors cursor-pointer relative">
                         <Upload className="w-5 h-5 text-gray-600" />
                         <span className="text-xs font-bold text-gray-700">استعادة نسخة احتياطية</span>
                         <input type="file" accept=".json" onChange={handleRestoreData} className="absolute inset-0 opacity-0 cursor-pointer" />
                     </label>
                 </div>

                 <div className="space-y-2">
                     <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-wider">منطقة الخطر</h4>
                     <button onClick={handleClearAllData} className="w-full flex items-center gap-3 p-4 bg-rose-50 rounded-2xl hover:bg-rose-100 transition-colors">
                         <Trash2 className="w-5 h-5 text-rose-500" />
                         <span className="text-xs font-bold text-rose-600">حذف جميع البيانات</span>
                     </button>
                 </div>
                 
                 <div className="pt-4 border-t border-gray-100 text-center">
                    <p className="text-[10px] text-gray-400 font-bold mb-1">تم التطوير بواسطة</p>
                    <p className="text-xs font-black text-gray-600">{credits.name}</p>
                    {credits.phone && <p className="text-[10px] font-mono text-gray-400 mt-1" dir="ltr">{credits.phone}</p>}
                 </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
    return (
        <ErrorBoundary>
            <AppContent />
        </ErrorBoundary>
    );
};

export default App;