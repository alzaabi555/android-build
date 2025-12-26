import React, { useState, useEffect, Suspense, useRef } from 'react';
import { Student, ScheduleDay, PeriodTime, Group } from './types';
import Dashboard from './components/Dashboard';
import StudentList from './components/StudentList';
import AttendanceTracker from './components/AttendanceTracker';
import GradeBook from './components/GradeBook';
import StudentReport from './components/StudentReport';
import ExcelImport from './components/ExcelImport';
import NoorPlatform from './components/NoorPlatform';
import GroupCompetition from './components/GroupCompetition';
import { App as CapApp } from '@capacitor/app';
import { LocalNotifications } from '@capacitor/local-notifications';
import { 
  Users, 
  CalendarCheck, 
  BarChart3, 
  ChevronLeft,
  GraduationCap,
  School,
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
  BookOpen,
  RefreshCcw,
  MapPin,
  Trophy
} from 'lucide-react';

// Toast Notification Component
const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error' | 'info' | 'bell', onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bg = type === 'success' ? 'bg-emerald-600/95' : type === 'error' ? 'bg-rose-600/95' : type === 'bell' ? 'bg-amber-500/95' : 'bg-blue-600/95';
  const Icon = type === 'bell' ? Bell : (type === 'success' ? CheckCircle2 : (type === 'error' ? AlertTriangle : Info));

  return (
    <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 ${bg} backdrop-blur-md text-white px-6 py-4 rounded-2xl shadow-2xl z-[200] flex items-center gap-3 animate-in slide-in-from-top-4 duration-300 border border-white/10 max-w-[90vw]`}>
      <div className="bg-white/20 p-2 rounded-full">
         <Icon className="w-5 h-5" />
      </div>
      <span className="text-sm font-bold">{message}</span>
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

// Helper to decode credits (Simple Obfuscation)
const getCredits = () => {
    try {
        // "محمد درويش الزعابي" encoded in Base64
        const name = decodeURIComponent(escape(window.atob('2YXYrdmF2K8g2K/YsdmI2YrYtCDYp9mE2LLYo9in2KjZjg==')));
        // "98344555" encoded
        const phone = window.atob('OTgzNDQ1NTU=');
        return { name, phone };
    } catch {
        return { name: "محمد درويش الزعابي", phone: "98344555" };
    }
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState(() => {
    try {
      const saved = localStorage.getItem('activeTab');
      return (!saved || saved === 'ministry') ? 'dashboard' : saved;
    } catch { return 'dashboard'; }
  });

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

  // Groups State
  const [groups, setGroups] = useState<Group[]>(() => {
      try {
          const saved = localStorage.getItem('groupsData');
          if (saved) return JSON.parse(saved);
          // Default Groups
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

  // Schedule State - Ensure 8 periods structure
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

  // إضافة حقل المحافظة (governorate)
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
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error' | 'info' | 'bell'} | null>(null);

  const bellAudioRef = useRef<HTMLAudioElement | null>(null);
  const credits = getCredits();

  useEffect(() => {
    bellAudioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/1085/1085-preview.mp3');
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
            localStorage.setItem('activeTab', activeTab);
            localStorage.setItem('teacherName', teacherInfo.name);
            localStorage.setItem('schoolName', teacherInfo.school);
            localStorage.setItem('subjectName', teacherInfo.subject);
            localStorage.setItem('governorate', teacherInfo.governorate); // حفظ المحافظة
            localStorage.setItem('scheduleData', JSON.stringify(schedule));
            localStorage.setItem('periodTimes', JSON.stringify(periodTimes));
            localStorage.setItem('viewSheetUrl', viewSheetUrl);
            localStorage.setItem('currentSemester', currentSemester);
        } catch (e) {
            console.warn("Storage restricted", e);
        }
    };

    saveData();

    window.addEventListener('beforeunload', saveData);
    return () => {
        window.removeEventListener('beforeunload', saveData);
    };
  }, [students, classes, activeTab, teacherInfo, schedule, viewSheetUrl, currentSemester, periodTimes, groups]);

  const handleUpdateStudent = (updatedStudent: Student) => {
    setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
  };

  const handleAddStudentManually = (name: string, className: string, phone?: string) => {
    const newStudent: Student = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      grade: '',
      classes: [className],
      attendance: [],
      behaviors: [],
      grades: [],
      parentPhone: phone
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

  const handleBackupData = async () => {
    try {
      const dataToSave = { teacherInfo, students, classes, groups, schedule, periodTimes, exportDate: new Date().toISOString() };
      const fileName = `madrasati_backup_${new Date().toISOString().split('T')[0]}.json`;
      const file = new File([JSON.stringify(dataToSave, null, 2)], fileName, { type: 'application/json' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: 'نسخة احتياطية', text: 'نسخة احتياطية من بيانات تطبيق مدرستي' });
          return;
        } catch (shareError) { console.log('Share cancelled', shareError); }
      }
      const url = URL.createObjectURL(file);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
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
    { id: 'group-competition', icon: Trophy, label: 'الدوري' }, // New Tab
    { id: 'noor', icon: Globe, label: 'نور' },
  ];

  if (!isSetupComplete) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-white px-8 animate-in fade-in duration-700" style={{direction: 'rtl'}}>
        <div className="mb-6 p-4 rounded-3xl shadow-xl shadow-blue-100 bg-white ring-4 ring-blue-50">
           <img src="icon.png" className="w-24 h-24 object-contain" alt="شعار التطبيق" onError={(e) => { e.currentTarget.src = ''; e.currentTarget.className='hidden'; }} />
           <School className="text-blue-600 w-16 h-16 hidden first:block" /> 
        </div>

        <h1 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">راصد</h1>
        <p className="text-sm text-slate-400 font-bold mb-8 text-center">قم بإعداد هويتك التعليمية للبدء</p>
        
        <form onSubmit={handleStartApp} className="w-full max-w-sm space-y-3">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 mr-2">اسم المعلم / المعلمة</label>
            <input 
                type="text" 
                className="w-full bg-slate-50 rounded-2xl py-3 px-5 text-sm font-bold outline-none border-2 border-transparent focus:border-blue-500/20 focus:bg-white transition-all text-slate-800 placeholder:text-slate-300" 
                value={teacherInfo.name} 
                onChange={(e) => setTeacherInfo({...teacherInfo, name: e.target.value})}
                autoComplete="off"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 mr-2">المادة الدراسية</label>
            <input 
                type="text" 
                className="w-full bg-slate-50 rounded-2xl py-3 px-5 text-sm font-bold outline-none border-2 border-transparent focus:border-blue-500/20 focus:bg-white transition-all text-slate-800 placeholder:text-slate-300" 
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
                    className="w-full bg-slate-50 rounded-2xl py-3 px-5 text-sm font-bold outline-none border-2 border-transparent focus:border-blue-500/20 focus:bg-white transition-all text-slate-800 appearance-none"
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
                className="w-full bg-slate-50 rounded-2xl py-3 px-5 text-sm font-bold outline-none border-2 border-transparent focus:border-blue-500/20 focus:bg-white transition-all text-slate-800 placeholder:text-slate-300" 
                value={teacherInfo.school} 
                onChange={(e) => setTeacherInfo({...teacherInfo, school: e.target.value})}
                autoComplete="off"
            />
          </div>

          <div className="flex gap-2 pt-2">
              <button 
                type="button"
                onClick={handleResetSetup}
                className="p-3.5 bg-rose-50 text-rose-600 rounded-2xl hover:bg-rose-100 transition-colors"
                title="إعادة تعيين البيانات"
              >
                  <RefreshCcw className="w-5 h-5" />
              </button>
              <button 
                type="submit" 
                disabled={!teacherInfo.name || !teacherInfo.school} 
                className="flex-1 py-3.5 bg-blue-600 text-white rounded-2xl font-black text-sm active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-blue-200 disabled:opacity-50 disabled:shadow-none transition-all"
              >
                بدء الاستخدام <CheckCircle2 className="w-5 h-5" />
              </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    // استبدال h-screen بـ h-full لأن الارتفاع محدد في الـ body بـ dvh
    <div className="flex h-full bg-[#f2f2f7] overflow-hidden select-none" style={{direction: 'rtl'}}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <aside className="hidden md:flex w-64 bg-white border-l border-gray-200 flex-col h-full shrink-0 z-20">
         <div className="p-6 flex flex-col items-center border-b border-gray-100">
             <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-3">
               <img src="icon.png" className="w-12 h-12 object-contain" alt="Logo" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
               <School className="w-8 h-8 text-blue-600 hidden first:block" />
             </div>
             <h2 className="text-lg font-black text-gray-800">راصد</h2>
             <p className="text-[10px] font-bold text-gray-400">{teacherInfo.school}</p>
         </div>

         <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
            {navItems.map(item => (
               <button
                 key={item.id}
                 onClick={() => setActiveTab(item.id)}
                 className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === item.id ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
               >
                 <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                 <span className="text-sm font-bold">{item.label}</span>
               </button>
            ))}
         </nav>

         <div className="p-4 border-t border-gray-100">
             <button onClick={() => setShowSettingsModal(true)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 hover:bg-gray-50 transition-all">
                <Info className="w-5 h-5" />
                <span className="text-sm font-bold">حول التطبيق</span>
             </button>
         </div>
      </aside>

      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <main 
          // تعديل الحشوة السفلية لضمان عدم اختفاء المحتوى خلف شريط التنقل السفلي في الايفون
          className="flex-1 overflow-y-auto pt-[var(--sat)] md:pt-6 px-4 md:px-8 scrollbar-thin scroll-smooth pb-[calc(80px+var(--sab))]"
        >
          <div className="max-w-full md:max-w-6xl mx-auto h-full pt-2 md:pt-0">
            <Suspense fallback={<div className="flex items-center justify-center h-40"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>}>
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
                  onViewReport={(s) => { setSelectedStudentId(s.id); setActiveTab('report'); }}
                  onSwitchToImport={() => setActiveTab('import')}
                  currentSemester={currentSemester}
                  onSemesterChange={setCurrentSemester}
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
              {activeTab === 'report' && selectedStudentId && (
                <div className="animate-in slide-in-from-right duration-300 max-w-3xl mx-auto">
                  <button onClick={() => setActiveTab('students')} className="mb-4 flex items-center gap-1.5 text-blue-600 font-bold text-xs bg-blue-50 w-fit px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors"><ChevronLeft className="w-4 h-4" /> العودة للقائمة</button>
                  <StudentReport 
                    student={students.find(s => s.id === selectedStudentId)!} 
                    onUpdateStudent={handleUpdateStudent} 
                    currentSemester={currentSemester}
                    teacherInfo={teacherInfo}
                  />
                </div>
              )}
            </Suspense>
          </div>
        </main>

        <nav 
          // ضمان ارتفاع الشريط السفلي بشكل صحيح مع المنطقة الآمنة
          className="md:hidden fixed bottom-0 left-0 right-0 bg-[#f2f2f7]/95 backdrop-blur-xl border-t border-gray-300/50 z-50 shadow-[0_-1px_3px_rgba(0,0,0,0.05)] pb-[env(safe-area-inset-bottom,20px)]"
        >
          <div className="flex justify-around items-center h-14 max-w-lg mx-auto">
            {navItems.map(item => (
              <button 
                key={item.id} 
                onClick={() => setActiveTab(item.id)} 
                className={`flex flex-col items-center justify-center w-full h-full transition-all duration-300 active:scale-95 ${activeTab === item.id ? 'text-blue-600' : 'text-gray-400'}`}
              >
                <item.icon className={`w-[22px] h-[22px] mb-1 ${activeTab === item.id ? 'fill-current' : 'stroke-[1.8px]'}`} />
                <span className="text-[10px] font-medium tracking-tight">{item.label}</span>
              </button>
            ))}
          </div>
        </nav>
      </div>

      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center sm:p-6 animate-in fade-in duration-200" onClick={() => setShowSettingsModal(false)}>
           <div className="bg-white w-full sm:max-w-sm rounded-t-[2rem] sm:rounded-[2rem] p-6 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom duration-300" onClick={e => e.stopPropagation()}>
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6 sm:hidden" />
              
              <div className="absolute top-0 right-0 p-6 z-10 hidden sm:block">
                 <button onClick={() => setShowSettingsModal(false)} className="p-2 bg-gray-50 rounded-full hover:bg-gray-100"><X className="w-4 h-4 text-gray-500" /></button>
              </div>

              <div className="flex flex-col items-center text-center mb-6 pt-2 shrink-0">
                 <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-[1.2rem] flex items-center justify-center mb-3 shadow-xl shadow-blue-200">
                    <Info className="text-white w-8 h-8" />
                 </div>
                 <h2 className="text-xl font-black text-gray-900 mb-0.5">حول التطبيق</h2>
                 <p className="text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full mb-3">الإصدار 3.2</p>
                 
                 <div className="space-y-0.5 mb-4">
                    <p className="text-[10px] font-bold text-gray-400">تصميم وتطوير</p>
                    <h3 className="text-sm font-black text-gray-800">{credits.name}</h3>
                    <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-gray-400">
                      <Phone className="w-3 h-3" /> <span>{credits.phone}</span>
                    </div>
                 </div>

                 <div className="bg-amber-50 border border-amber-100 p-3 rounded-2xl w-full relative overflow-hidden">
                    <Heart className="w-12 h-12 text-amber-500/10 absolute -left-2 -bottom-2 rotate-12" />
                    <p className="text-[10px] font-bold text-amber-800 leading-relaxed relative z-10">
                    "هذا التطبيق عمل خيري وصدقة عن روح والدتي ؛ فأرجو الدعاء لها بالرحمة والمغفرة"
                    </p>
                 </div>
              </div>

              <div className="overflow-y-auto pr-1 space-y-4 custom-scrollbar flex-1 pb-safe">
                 <div className="border-t border-gray-100 pt-4 space-y-2">
                    <h3 className="text-xs font-black text-gray-400 mb-2 flex items-center gap-2 uppercase tracking-wider"><Database className="w-3.5 h-3.5" /> إدارة البيانات</h3>
                    
                    <button onClick={handleBackupData} className="w-full flex items-center justify-between p-4 bg-gray-50 text-gray-700 rounded-2xl text-[12px] font-bold hover:bg-gray-100 active:scale-95 transition-all">
                        <span>حفظ نسخة احتياطية</span>
                        {navigator.canShare ? <Share className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                    </button>

                    <label className="w-full flex items-center justify-between p-4 bg-gray-50 text-gray-700 rounded-2xl text-[12px] font-bold hover:bg-gray-100 active:scale-95 transition-all cursor-pointer">
                        <span>استعادة نسخة</span>
                        <Upload className="w-4 h-4" />
                        <input type="file" accept=".json" className="hidden" onChange={handleRestoreData} />
                    </label>

                    <button onClick={handleClearAllData} className="w-full flex items-center justify-between p-4 bg-rose-50 text-rose-600 rounded-2xl text-[12px] font-bold hover:bg-rose-100 active:scale-95 transition-all mt-4">
                        <span>حذف جميع البيانات</span>
                        <Trash2 className="w-4 h-4" />
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;