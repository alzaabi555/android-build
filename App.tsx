
import React, { useState, useEffect, Suspense, useRef, ErrorInfo, ReactNode, Component } from 'react';
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
import Modal from './components/Modal';
import { ThemeProvider, useTheme, ThemeMode } from './context/ThemeContext';
import { AppProvider, useApp } from './context/AppContext';
import { useSchoolBell } from './hooks/useSchoolBell';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import { 
  Users, 
  CalendarCheck, 
  BarChart3, 
  ChevronLeft, 
  ChevronDown, 
  CheckCircle2, 
  Info, 
  Trash2, 
  X, 
  Globe, 
  AlertTriangle, 
  Bell, 
  Trophy, 
  RotateCcw, 
  Github, 
  Save, 
  FileUp, 
  Sun, 
  Moon, 
  Smartphone, 
  Layout, 
  Palette, 
  GraduationCap, 
  Frown, 
  Zap, 
  BookOpen, 
  Clock3, 
  Ban, 
  UserMinus, 
  Utensils, 
  Heart, 
  Battery, 
  ZapOff, 
  MessageCircle, 
  Code2,
  HelpCircle,
  User,
  School,
  MapPin,
  ArrowRight
} from 'lucide-react';
import { Browser } from '@capacitor/browser';

// Error Boundary
interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null
  };

  // Explicitly declare props to fix TS error
  public props: ErrorBoundaryProps;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.props = props;
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-red-50 text-red-900 p-4 text-center" dir="rtl">
          <div className="bg-red-100 p-4 rounded-full mb-4">
            <AlertTriangle className="w-12 h-12 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2">عذراً، حدث خطأ غير متوقع</h1>
          <button onClick={() => window.location.reload()} className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold">تحديث الصفحة</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error' | 'info' | 'bell', onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colors = {
    success: 'bg-emerald-500/90 text-emerald-100',
    error: 'bg-rose-500/90 text-rose-100',
    bell: 'bg-amber-500/90 text-amber-100',
    info: 'bg-blue-500/90 text-blue-100'
  };
  
  const Icon = type === 'bell' ? Bell : (type === 'success' ? CheckCircle2 : (type === 'error' ? AlertTriangle : Info));

  return (
    <div className={`fixed top-6 left-1/2 -translate-x-1/2 ${colors[type]} backdrop-blur-sm border border-white/10 px-6 py-3.5 rounded-full shadow-lg z-[2000] flex items-center gap-3 max-w-[90vw] animate-in slide-in-from-top-2 fade-in duration-300`}>
      <Icon className="w-4 h-4" />
      <span className="text-xs font-bold tracking-wide">{message}</span>
    </div>
  );
};

const OMAN_GOVERNORATES = ["مسقط", "ظفار", "مسندم", "البريمي", "الداخلية", "شمال الباطنة", "جنوب الباطنة", "جنوب الشرقية", "شمال الشرقية", "الظاهرة", "الوسطى"];

// Optimized Background Component
const BackgroundOrbs = React.memo(({ isLowPower }: { isLowPower: boolean }) => {
  if (isLowPower) return null; // Disable completely in low power mode
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 transform-gpu">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/10 dark:bg-blue-600/20 blur-[100px] opacity-70 will-change-transform" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-purple-600/10 dark:bg-purple-600/20 blur-[80px] opacity-60 will-change-transform" />
    </div>
  );
});

const AppContent: React.FC = () => {
  const { theme, setTheme, isLowPower, toggleLowPower } = useTheme();
  
  // Optimized Styles - Only Ceramic (Light) and Vision (Dark)
  const getThemeStyles = () => {
    const blurClass = isLowPower ? '' : 'backdrop-blur-md';
    const bgOpacity = isLowPower ? 'bg-white dark:bg-[#0f172a]' : 'bg-white/70 dark:bg-white/5';
    const borderClass = isLowPower ? 'border-gray-200 dark:border-gray-800' : 'border-white/40 dark:border-white/10';

    if (theme === 'ceramic') {
        // Light Mode (iOS Style)
        return {
          sidebar: `${bgOpacity} ${blurClass} border ${borderClass} shadow-2xl rounded-[2rem]`,
          activeNav: 'bg-white text-indigo-600 shadow-sm border border-gray-100 rounded-2xl',
          inactiveNav: 'text-slate-500 hover:text-slate-900 rounded-2xl',
          button: 'rounded-2xl',
        };
    } else {
        // Dark Mode (Vision)
        const visionBg = isLowPower ? 'bg-[#1e1e1e]' : 'bg-white/5';
        return {
          sidebar: `${visionBg} ${blurClass} border border-white/10 shadow-2xl rounded-[2rem]`,
          activeNav: 'bg-white/10 text-white border border-white/10 rounded-2xl',
          inactiveNav: 'text-white/50 hover:text-white rounded-2xl',
          button: 'rounded-2xl',
        };
    }
  };

  const themeStyles = getThemeStyles();

  const { 
      students, setStudents, classes, setClasses, groups, setGroups, 
      schedule, setSchedule, periodTimes, setPeriodTimes, 
      teacherInfo, setTeacherInfo, currentSemester, setCurrentSemester 
  } = useApp();

  // Initialize Bell Hook
  useSchoolBell(periodTimes, schedule);

  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('activeTab') || 'dashboard');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(() => localStorage.getItem('selectedStudentId') || null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error' | 'info' | 'bell'} | null>(null);
  const [isSetupComplete, setIsSetupComplete] = useState(!!teacherInfo.name && !!teacherInfo.school);

  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
    if(selectedStudentId) localStorage.setItem('selectedStudentId', selectedStudentId);
    else localStorage.removeItem('selectedStudentId');
  }, [activeTab, selectedStudentId]);

  const handleUpdateStudent = (updatedStudent: Student) => setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
  const handleDeleteStudent = (studentId: string) => { setStudents(prev => prev.filter(s => s.id !== studentId)); setToast({ message: 'تم حذف الطالب', type: 'success' }); };
  const handleAddStudentManually = (name: string, className: string, phone?: string, avatar?: string) => {
    setStudents(prev => [{ id: Math.random().toString(36).substr(2, 9), name, grade: '', classes: [className], attendance: [], behaviors: [], grades: [], parentPhone: phone, avatar }, ...prev]);
    if (!classes.includes(className)) setClasses(prev => [...prev, className].sort());
  };

  const handleBatchAddStudents = (newStudents: Student[]) => {
      setStudents(prev => [...newStudents, ...prev]);
      // Update classes list if new classes are introduced
      const newClasses = new Set(classes);
      newStudents.forEach(s => s.classes.forEach(c => newClasses.add(c)));
      setClasses(Array.from(newClasses).sort());
      setToast({ message: `تم إضافة ${newStudents.length} طالب بنجاح`, type: 'success' });
  };

  const handleEditClass = (oldName: string, newName: string) => {
      setClasses(prev => prev.map(c => c === oldName ? newName : c).sort());
      setStudents(prev => prev.map(s => ({ ...s, classes: s.classes.map(c => c === oldName ? newName : c) })));
  };

  const handleDeleteClass = (className: string) => {
      setClasses(prev => prev.filter(c => c !== className));
      setStudents(prev => prev.map(s => ({ ...s, classes: s.classes.filter(c => c !== className) })));
  };

  const handleClearAllData = () => {
    if (confirm('سيتم حذف جميع البيانات. هل أنت متأكد؟')) {
      setStudents([]); setClasses([]); setToast({ message: 'تم الحذف', type: 'success' }); setShowSettingsModal(false);
    }
  };

  const handleBackupData = () => {
    const data = {
      students, classes, groups, schedule, periodTimes, teacherInfo, currentSemester, timestamp: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `rased_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    setToast({ message: 'تم حفظ النسخة الاحتياطية', type: 'success' });
  };

  const handleRestoreData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.students) setStudents(data.students);
        if (data.classes) setClasses(data.classes);
        if (data.groups) setGroups(data.groups);
        if (data.schedule) setSchedule(data.schedule);
        if (data.periodTimes) setPeriodTimes(data.periodTimes);
        if (data.teacherInfo) setTeacherInfo(data.teacherInfo);
        if (data.currentSemester) setCurrentSemester(data.currentSemester);
        setToast({ message: 'تم استعادة البيانات بنجاح', type: 'success' });
        setShowSettingsModal(false);
      } catch (err) { console.error(err); setToast({ message: 'فشل في استعادة البيانات', type: 'error' }); }
    };
    reader.readAsText(file); e.target.value = '';
  };

  const handleContactDeveloper = () => {
    const phone = "96898344555"; 
    Browser.open({ url: `https://wa.me/${phone}` });
  };

  const navItems = [
    { id: 'dashboard', icon: BarChart3, label: 'الرئيسية' },
    { id: 'attendance', icon: CalendarCheck, label: 'الحضور' }, 
    { id: 'students', icon: Users, label: 'الطلاب' },
    { id: 'grades', icon: GraduationCap, label: 'الدرجات' },
    { id: 'group-competition', icon: Trophy, label: 'الدوري' }, 
    { id: 'noor', icon: Globe, label: 'نور' },
    { id: 'guide', icon: BookOpen, label: 'الدليل' }, // Added Guide
  ];

  const ThemeSwitcher = () => (
    <div className={`p-1 rounded-2xl flex gap-1 mb-2 bg-gray-100/50 dark:bg-black/20`}>
        <button onClick={() => setTheme('ceramic')} className={`flex-1 py-2 rounded-xl text-[9px] font-bold ${theme === 'ceramic' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>نهاري</button>
        <button onClick={() => setTheme('vision')} className={`flex-1 py-2 rounded-xl text-[9px] font-bold ${theme === 'vision' ? 'bg-black text-white shadow-sm' : 'text-slate-500'}`}>ليلي</button>
    </div>
  );

  if (!isSetupComplete) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-50 dark:bg-[#0f172a] px-6 transition-colors duration-500" dir="rtl">
        <BackgroundOrbs isLowPower={isLowPower} />
        
        {/* Main Card */}
        <div className="relative z-10 w-full max-w-sm bg-white/80 dark:bg-white/5 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-white/20 dark:border-white/10 shadow-2xl shadow-indigo-500/10 dark:shadow-black/50">
            
            {/* Logo Section */}
            <div className="flex justify-center mb-8 relative">
                <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full scale-150 animate-pulse"></div>
                <div className="w-24 h-24 bg-white dark:bg-white/10 rounded-[2rem] flex items-center justify-center shadow-xl shadow-indigo-500/20 border border-white/50 dark:border-white/10 relative z-10">
                    <BrandLogo className="w-16 h-16" showText={false} />
                </div>
            </div>

            <div className="text-center mb-8">
                <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">مرحباً بك في راصد</h1>
                <p className="text-slate-500 dark:text-white/60 text-sm font-medium">قم بإعداد ملفك الشخصي للبدء</p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); setIsSetupComplete(true); }} className="space-y-4">
                
                {/* Name Input */}
                <div className="relative group">
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/40 group-focus-within:text-indigo-500 transition-colors">
                        <User className="w-5 h-5" />
                    </div>
                    <input 
                        type="text" 
                        className="w-full py-4 pr-12 pl-4 rounded-2xl bg-slate-50 dark:bg-black/20 border border-transparent focus:bg-white dark:focus:bg-white/5 focus:border-indigo-500/50 outline-none text-slate-900 dark:text-white font-bold text-sm placeholder:text-slate-400 transition-all shadow-sm focus:shadow-md" 
                        value={teacherInfo.name} 
                        onChange={(e) => setTeacherInfo({...teacherInfo, name: e.target.value})} 
                        placeholder="الاسم الكريم" 
                        required 
                    />
                </div>

                {/* School Input */}
                <div className="relative group">
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/40 group-focus-within:text-indigo-500 transition-colors">
                        <School className="w-5 h-5" />
                    </div>
                    <input 
                        type="text" 
                        className="w-full py-4 pr-12 pl-4 rounded-2xl bg-slate-50 dark:bg-black/20 border border-transparent focus:bg-white dark:focus:bg-white/5 focus:border-indigo-500/50 outline-none text-slate-900 dark:text-white font-bold text-sm placeholder:text-slate-400 transition-all shadow-sm focus:shadow-md" 
                        value={teacherInfo.school} 
                        onChange={(e) => setTeacherInfo({...teacherInfo, school: e.target.value})} 
                        placeholder="اسم المدرسة" 
                        required 
                    />
                </div>

                {/* Subject Input */}
                <div className="relative group">
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/40 group-focus-within:text-indigo-500 transition-colors">
                        <BookOpen className="w-5 h-5" />
                    </div>
                    <input 
                        type="text" 
                        className="w-full py-4 pr-12 pl-4 rounded-2xl bg-slate-50 dark:bg-black/20 border border-transparent focus:bg-white dark:focus:bg-white/5 focus:border-indigo-500/50 outline-none text-slate-900 dark:text-white font-bold text-sm placeholder:text-slate-400 transition-all shadow-sm focus:shadow-md" 
                        value={teacherInfo.subject} 
                        onChange={(e) => setTeacherInfo({...teacherInfo, subject: e.target.value})} 
                        placeholder="المادة الدراسية" 
                        required 
                    />
                </div>

                {/* Governorate Select */}
                <div className="relative group">
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/40 group-focus-within:text-indigo-500 transition-colors pointer-events-none">
                        <MapPin className="w-5 h-5" />
                    </div>
                    <select 
                        value={teacherInfo.governorate} 
                        onChange={(e) => setTeacherInfo({...teacherInfo, governorate: e.target.value})} 
                        className="w-full py-4 pr-12 pl-4 rounded-2xl bg-slate-50 dark:bg-black/20 border border-transparent focus:bg-white dark:focus:bg-white/5 focus:border-indigo-500/50 outline-none text-slate-900 dark:text-white font-bold text-sm appearance-none cursor-pointer transition-all shadow-sm focus:shadow-md" 
                        required
                    >
                        <option value="" disabled>المحافظة التعليمية...</option>
                        {OMAN_GOVERNORATES.map(g => <option key={g} value={g} className="text-slate-900">{g}</option>)}
                    </select>
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <ChevronDown className="w-4 h-4" />
                    </div>
                </div>

                {/* Submit Button */}
                <button 
                    type="submit" 
                    className="w-full py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-2xl font-black text-sm hover:shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5 active:translate-y-0 active:shadow-md transition-all flex items-center justify-center gap-2 mt-4 group"
                >
                    ابدأ رحلتك
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-[-4px] transition-transform" />
                </button>
            </form>
        </div>
      </div>
    );
  }

  return (
    <MotionConfig reducedMotion={isLowPower ? "always" : "user"}>
        <div className="fixed inset-0 flex bg-transparent overflow-hidden select-none text-slate-900 dark:text-white transition-colors duration-300" style={{direction: 'rtl'}}>
        <BackgroundOrbs isLowPower={isLowPower} />
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

        {/* Sidebar */}
        <aside className={`hidden md:flex w-64 flex-col shrink-0 z-50 overflow-hidden relative transition-all duration-300 transform-gpu ${themeStyles.sidebar}`}>
            <div className="p-6 flex flex-col items-center border-b border-gray-100/50 dark:border-white/5">
                <div className="w-16 h-16 mb-3"><BrandLogo className="w-full h-full" showText={false} /></div>
                <h2 className="text-lg font-black">راصد OS</h2>
            </div>
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 custom-scrollbar">
                {navItems.map(item => (
                <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-3 px-4 py-3 transition-all ${activeTab === item.id ? themeStyles.activeNav : themeStyles.inactiveNav}`}>
                    <item.icon className="w-5 h-5" /> <span className="text-sm font-bold">{item.label}</span>
                </button>
                ))}
            </nav>
            <div className={`p-4 border-t border-gray-100/50 dark:border-white/5`}>
                <ThemeSwitcher />
                <button onClick={() => setShowSettingsModal(true)} className={`w-full flex items-center gap-2 px-4 py-2 mt-2 text-slate-500 dark:text-white/50 hover:bg-white/20 transition-all rounded-xl`}><Info className="w-4 h-4" /><span className="text-xs font-bold">الإعدادات</span></button>
            </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10 transform-gpu">
            <main className="flex-1 overflow-y-auto pt-[var(--sat)] md:pt-4 px-3 md:px-6 scrollbar-thin pb-[calc(90px+var(--sab))]" style={{ overscrollBehaviorY: 'none' }}>
            <div className="max-w-full md:max-w-7xl mx-auto h-full pt-2 md:pt-4">
                <Suspense fallback={<div className="flex justify-center pt-20"><div className="w-8 h-8 border-4 border-indigo-500 rounded-full animate-spin border-t-transparent"></div></div>}>
                    <div className={isLowPower ? '' : 'animate-in fade-in duration-300'}>
                        {activeTab === 'dashboard' && <Dashboard students={students} teacherInfo={teacherInfo} onUpdateTeacherInfo={setTeacherInfo} schedule={schedule} onUpdateSchedule={setSchedule} onSelectStudent={(s) => { setSelectedStudentId(s.id); setActiveTab('report'); }} onNavigate={(tab) => setActiveTab(tab)} onOpenSettings={() => setShowSettingsModal(true)} periodTimes={periodTimes} setPeriodTimes={setPeriodTimes} />}
                        {activeTab === 'students' && <StudentList students={students} classes={classes} onAddClass={(c) => setClasses(prev => [...prev, c].sort())} onAddStudentManually={handleAddStudentManually} onBatchAddStudents={handleBatchAddStudents} onUpdateStudent={handleUpdateStudent} onDeleteStudent={handleDeleteStudent} onViewReport={(s) => { setSelectedStudentId(s.id); setActiveTab('report'); }} onSwitchToImport={() => setActiveTab('import')} currentSemester={currentSemester} onSemesterChange={setCurrentSemester} onEditClass={handleEditClass} onDeleteClass={handleDeleteClass} />}
                        {activeTab === 'attendance' && <AttendanceTracker students={students} classes={classes} setStudents={setStudents} />}
                        {activeTab === 'grades' && <GradeBook students={students} classes={classes} onUpdateStudent={handleUpdateStudent} setStudents={setStudents} currentSemester={currentSemester} onSemesterChange={setCurrentSemester} teacherInfo={teacherInfo} />}
                        {activeTab === 'group-competition' && <GroupCompetition students={students} classes={classes} onUpdateStudent={handleUpdateStudent} groups={groups} onUpdateGroups={setGroups} setStudents={setStudents} />}
                        {activeTab === 'import' && <ExcelImport existingClasses={classes} onImport={(ns) => { setStudents(prev => [...prev, ...ns]); setActiveTab('students'); }} onAddClass={(c) => setClasses(prev => [...prev, c].sort())} />}
                        {activeTab === 'noor' && <NoorPlatform />}
                        {activeTab === 'guide' && <UserGuide />}
                        {activeTab === 'report' && selectedStudentId && <div className="max-w-4xl mx-auto"><button onClick={() => setActiveTab('students')} className={`mb-4 flex items-center gap-2 text-slate-500 font-bold text-xs bg-white/60 dark:bg-white/10 px-4 py-2 border border-gray-200 dark:border-white/10 rounded-xl hover:bg-white dark:hover:bg-white/20`}><ChevronLeft className="w-4 h-4" /> العودة</button><StudentReport student={students.find(s => s.id === selectedStudentId)!} onUpdateStudent={handleUpdateStudent} currentSemester={currentSemester} teacherInfo={teacherInfo} /></div>}
                    </div>
                </Suspense>
            </div>
            </main>
            
            {/* Mobile Dock */}
            <nav className={`md:hidden fixed bottom-6 left-4 right-4 bg-white/90 dark:bg-slate-900/95 ${isLowPower ? '' : 'backdrop-blur-lg'} border border-gray-200 dark:border-white/10 z-50 shadow-xl rounded-[2rem] h-16 flex items-center justify-around px-2`}>
                {navItems.slice(0, 5).map(item => (
                <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex flex-col items-center justify-center w-full h-full relative ${activeTab === item.id ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
                    <item.icon className="w-6 h-6" />
                    {activeTab === item.id && <div className="absolute bottom-1 w-1 h-1 rounded-full bg-current" />}
                </button>
                ))}
                <button onClick={() => setActiveTab('guide')} className={`flex flex-col items-center justify-center w-full h-full relative ${activeTab === 'guide' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}>
                    <BookOpen className="w-6 h-6" />
                    {activeTab === 'guide' && <div className="absolute bottom-1 w-1 h-1 rounded-full bg-current" />}
                </button>
            </nav>
        </div>

        {/* Settings Modal */}
        <Modal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)}>
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-black text-lg">الإعدادات</h3>
                <button onClick={() => setShowSettingsModal(false)} className="p-2 bg-gray-100 dark:bg-white/10 rounded-full hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl">
                    <label className="text-xs font-bold text-gray-500 mb-2 block">المظهر</label>
                    <ThemeSwitcher />
                </div>

                {/* PERFORMANCE TOGGLE */}
                <button onClick={toggleLowPower} className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-colors ${isLowPower ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300' : 'bg-gray-50 dark:bg-white/5 border-transparent text-gray-700 dark:text-white'}`}>
                    <div className="flex items-center gap-3 text-right">
                        <div className={`p-2 rounded-full ${isLowPower ? 'bg-emerald-100 dark:bg-emerald-800' : 'bg-gray-200 dark:bg-white/10'}`}>
                            {isLowPower ? <Battery className="w-5 h-5" /> : <ZapOff className="w-5 h-5" />}
                        </div>
                        <div>
                            <span className="block text-sm font-black">تقليل المؤثرات البصرية</span>
                            <span className="block text-[10px] font-bold opacity-70">للأجهزة القديمة: يوقف الشفافية والحركة</span>
                        </div>
                    </div>
                    <div className={`w-10 h-6 rounded-full relative transition-colors ${isLowPower ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isLowPower ? 'left-5' : 'left-1'}`} />
                    </div>
                </button>

                <div className="h-px bg-gray-200 dark:bg-white/10 my-2"></div>

                <button onClick={handleBackupData} className="w-full flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-500/20 rounded-2xl font-bold text-xs hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors"><Save className="w-4 h-4" /> حفظ نسخة احتياطية</button>
                <label className="w-full flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-500/20 rounded-2xl font-bold text-xs cursor-pointer hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"><FileUp className="w-4 h-4" /> استعادة بيانات <input type="file" accept=".json" className="hidden" onChange={handleRestoreData} /></label>
                <button onClick={handleClearAllData} className="w-full flex items-center gap-3 p-4 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-100 dark:border-rose-500/20 rounded-2xl font-bold text-xs hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors"><Trash2 className="w-4 h-4" /> حذف كافة البيانات</button>
                
                <div className="h-px bg-gray-200 dark:bg-white/10 my-2"></div>

                {/* About Developer Section */}
                <div className="p-4 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-500/10 dark:to-blue-500/10 rounded-2xl border border-indigo-100 dark:border-indigo-500/20 text-center">
                    <div className="w-12 h-12 bg-white dark:bg-white/10 rounded-2xl mx-auto mb-3 flex items-center justify-center shadow-sm">
                        <Code2 className="w-6 h-6 text-indigo-500 dark:text-indigo-300" />
                    </div>
                    <h4 className="text-xs font-black text-indigo-900 dark:text-indigo-200 mb-1">حول المطور</h4>
                    <p className="text-[10px] font-bold text-slate-500 dark:text-white/60 mb-3">تصميم وتطوير: محمد درويش الزعابي</p>
                    <button 
                        onClick={handleContactDeveloper}
                        className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 transition-colors shadow-lg shadow-emerald-500/20"
                    >
                        <MessageCircle className="w-4 h-4" />
                        تواصل مع المطور (واتساب)
                    </button>
                </div>
                <div className="text-center">
                    <p className="text-[9px] text-slate-300 dark:text-white/20 font-mono mt-2">Version 3.4.0 (Performance Update)</p>
                </div>
            </div>
        </Modal>
        </div>
    </MotionConfig>
  );
};

const App: React.FC = () => (
  <ThemeProvider>
    <AppProvider>
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </AppProvider>
  </ThemeProvider>
);

export default App;
