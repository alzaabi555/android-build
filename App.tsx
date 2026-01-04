
import React, { useState, useEffect, Suspense, ErrorInfo, ReactNode } from 'react';
import { Student, ScheduleDay, PeriodTime, Group } from './types';
import Dashboard from './components/Dashboard';
import StudentList from './components/StudentList';
import AttendanceTracker from './components/AttendanceTracker';
import GradeBook from './components/GradeBook';
import StudentReport from './components/StudentReport';
import UserGuide from './components/UserGuide';
import About from './components/About';
import Settings from './components/Settings';
import Reports from './components/Reports';
import BrandLogo from './components/BrandLogo';
import ActivationScreen from './components/ActivationScreen';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AppProvider, useApp } from './context/AppContext';
import { useSchoolBell } from './hooks/useSchoolBell';
import { 
  LayoutDashboard, Users, CalendarCheck, BarChart3, FileText, 
  Trophy, HelpCircle, Info, 
  Menu, X, Moon, Sun, Zap, Settings as SettingsIcon, MoreHorizontal, Grid, FileWarning, FileSpreadsheet, Loader2
} from 'lucide-react';
import Modal from './components/Modal';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

// --- SECRET SALT (سر الخلطة) ---
const SECRET_SALT = "RASED_APP_SECURE_2025_OMAN";

// --- Error Boundary ---
interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };
  static getDerivedStateFromError(_: Error): ErrorBoundaryState { return { hasError: true }; }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) { console.error("Uncaught error:", error, errorInfo); }
  render() {
    if (this.state.hasError) return <div className="p-10 text-center text-slate-800 dark:text-white glass-card m-10 rounded-3xl"><h1>حدث خطأ غير متوقع.</h1><button onClick={() => window.location.reload()} className="mt-4 bg-white/20 hover:bg-white/30 text-slate-800 dark:text-white px-6 py-2 rounded-xl backdrop-blur-md transition-all">إعادة تحميل</button></div>;
    return (this as any).props.children;
  }
}

const AppContent: React.FC = () => {
  const { 
      students, setStudents, classes, setClasses, groups, setGroups,
      schedule, setSchedule, periodTimes, setPeriodTimes,
      teacherInfo, setTeacherInfo, currentSemester, setCurrentSemester,
      isDataLoaded 
  } = useApp();

  const { theme, setTheme, isDark, toggleLowPower, isLowPower } = useTheme();
  
  // State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 
  const [showMoreMenu, setShowMoreMenu] = useState(false); 
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [selectedStudentForReport, setSelectedStudentForReport] = useState<Student | null>(null);

  // --- Activation State ---
  const [isActivated, setIsActivated] = useState<boolean>(false);
  const [deviceId, setDeviceId] = useState<string>('');
  const [checkingActivation, setCheckingActivation] = useState(true);

  // Custom Hooks
  useSchoolBell(periodTimes, schedule, notificationsEnabled);

  // --- Activation Logic (Internal) ---
  const simpleHash = (str: string): string => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
          const char = str.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash;
      }
      return Math.abs(hash).toString(16).toUpperCase();
  };

  const generateValidCode = (id: string): string => {
      const raw = id.split('').reverse().join('') + SECRET_SALT;
      const hash = simpleHash(raw);
      const codePart = hash.padEnd(8, 'X').substring(0, 8); 
      return `${codePart.substring(0, 4)}-${codePart.substring(4, 8)}`;
  };

  // --- Persistent Auth Logic ---
  const AUTH_FILE = 'rased_auth_v1.json';

  useEffect(() => {
      const checkAuth = async () => {
          let storedId = '';
          let storedCode = '';

          // 1. Try Loading from Filesystem (Native)
          if (Capacitor.isNativePlatform()) {
              try {
                  const result = await Filesystem.readFile({
                      path: AUTH_FILE,
                      directory: Directory.Data,
                      encoding: Encoding.UTF8
                  });
                  const data = JSON.parse(result.data as string);
                  storedId = data.deviceId;
                  storedCode = data.code;
              } catch (e) {
                  // File not found, fallback to localStorage
              }
          }

          // 2. Fallback to LocalStorage (Web or First Run)
          if (!storedId) {
              storedId = localStorage.getItem('rased_device_id') || '';
              storedCode = localStorage.getItem('rased_activation_code') || '';
          }

          // 3. Generate New ID if needed
          if (!storedId) {
              storedId = Math.random().toString(36).substring(2, 10).toUpperCase();
              if (Capacitor.isNativePlatform()) {
                  // Save new ID to FS
                  await Filesystem.writeFile({
                      path: AUTH_FILE,
                      data: JSON.stringify({ deviceId: storedId, code: '' }),
                      directory: Directory.Data,
                      encoding: Encoding.UTF8
                  });
              }
              localStorage.setItem('rased_device_id', storedId);
          }

          setDeviceId(storedId);

          // 4. Validate Code
          if (storedCode) {
              const validCode = generateValidCode(storedId);
              if (storedCode === validCode) {
                  setIsActivated(true);
              }
          }
          setCheckingActivation(false);
      };

      checkAuth();
  }, []);

  const handleActivateApp = (code: string): boolean => {
      const validCode = generateValidCode(deviceId);
      if (code === validCode) {
          // Save to LocalStorage
          localStorage.setItem('rased_activation_code', code);
          
          // Save to Filesystem (Native) for persistence
          if (Capacitor.isNativePlatform()) {
              Filesystem.writeFile({
                  path: AUTH_FILE,
                  data: JSON.stringify({ deviceId: deviceId, code: code }),
                  directory: Directory.Data,
                  encoding: Encoding.UTF8
              }).catch(e => console.error('Failed to save auth', e));
          }

          setIsActivated(true);
          return true;
      }
      return false;
  };

  // Handlers
  const handleUpdateTeacherInfo = (info: any) => setTeacherInfo(prev => ({ ...prev, ...info }));
  const handleUpdateSchedule = (newSchedule: ScheduleDay[]) => setSchedule(newSchedule);
  const handleToggleNotifications = () => {
      setNotificationsEnabled(prev => {
          const newVal = !prev;
          if (newVal) alert('تم تفعيل جرس الحصص 🔔');
          else alert('تم إيقاف جرس الحصص 🔕');
          return newVal;
      });
  };

  const handleNavigate = (tab: string) => {
      setActiveTab(tab);
      setIsSidebarOpen(false);
      setShowMoreMenu(false);
      if (tab !== 'report') setSelectedStudentForReport(null);
  };

  // Helper to handle student operations
  const handleUpdateStudent = (updatedStudent: Student) => {
      setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
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
          avatar
      };
      setStudents(prev => [...prev, newStudent]);
      if (!classes.includes(className)) setClasses(prev => [...prev, className]);
  };

  const handleBatchAddStudents = (newStudents: Student[]) => {
      setStudents(prev => [...prev, ...newStudents]);
      // Extract new classes
      const newClasses = new Set(classes);
      newStudents.forEach(s => s.classes.forEach(c => newClasses.add(c)));
      setClasses(Array.from(newClasses));
  };

  const handleDeleteStudent = (id: string) => {
      setStudents(prev => prev.filter(s => s.id !== id));
  };

  const handleAddClass = (name: string) => {
      if (!classes.includes(name)) setClasses(prev => [...prev, name]);
  };

  const handleEditClass = (oldName: string, newName: string) => {
      setClasses(prev => prev.map(c => c === oldName ? newName : c));
      setStudents(prev => prev.map(s => ({
          ...s,
          classes: s.classes.map(c => c === oldName ? newName : c)
      })));
  };

  const handleDeleteClass = (className: string) => {
      if (confirm(`هل أنت متأكد من حذف الفصل "${className}"؟ سيتم حذف الفصل من قائمة الفصول، لكن الطلاب سيبقون مسجلين.`)) {
          setClasses(prev => prev.filter(c => c !== className));
      }
  };

  // --- Initial Loading Screen ---
  if (!isDataLoaded || checkingActivation) {
      return (
          <div className="flex h-screen items-center justify-center bg-slate-100 dark:bg-black">
              <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 glass-icon rounded-3xl flex items-center justify-center shadow-xl animate-bounce">
                      <BrandLogo showText={false} className="w-10 h-10" />
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 dark:text-white/60 font-bold">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>جاري التحميل...</span>
                  </div>
              </div>
          </div>
      );
  }

  // --- Lock Screen (If Not Activated) ---
  if (!isActivated) {
      return <ActivationScreen deviceId={deviceId} onActivate={handleActivateApp} />;
  }

  // Render Main Content
  const renderContent = () => {
      if (activeTab === 'dashboard') {
          return <Dashboard 
              students={students} 
              teacherInfo={teacherInfo} 
              onUpdateTeacherInfo={handleUpdateTeacherInfo}
              schedule={schedule}
              onUpdateSchedule={handleUpdateSchedule}
              onSelectStudent={(s) => { setSelectedStudentForReport(s); setActiveTab('report'); }}
              onNavigate={handleNavigate}
              onOpenSettings={() => setActiveTab('settings')} 
              periodTimes={periodTimes}
              setPeriodTimes={setPeriodTimes}
              notificationsEnabled={notificationsEnabled}
              onToggleNotifications={handleToggleNotifications}
          />;
      }
      if (activeTab === 'students') {
          return <StudentList 
              students={students} 
              classes={classes}
              onAddClass={handleAddClass}
              onAddStudentManually={handleAddStudentManually}
              onBatchAddStudents={handleBatchAddStudents}
              onUpdateStudent={handleUpdateStudent}
              onDeleteStudent={handleDeleteStudent}
              onViewReport={(s) => { setSelectedStudentForReport(s); setActiveTab('report'); }}
              currentSemester={currentSemester}
              onSemesterChange={setCurrentSemester}
              onEditClass={handleEditClass}
              onDeleteClass={handleDeleteClass}
          />;
      }
      if (activeTab === 'attendance') return <AttendanceTracker students={students} classes={classes} setStudents={setStudents} />;
      if (activeTab === 'grades') return <GradeBook students={students} classes={classes} onUpdateStudent={handleUpdateStudent} setStudents={setStudents} currentSemester={currentSemester} onSemesterChange={setCurrentSemester} teacherInfo={teacherInfo} />;
      
      if (activeTab === 'report') {
          if (selectedStudentForReport) return <StudentReport student={selectedStudentForReport} onUpdateStudent={handleUpdateStudent} currentSemester={currentSemester} teacherInfo={teacherInfo} onBack={() => setSelectedStudentForReport(null)} />;
          return <StudentList students={students} classes={classes} onAddClass={handleAddClass} onAddStudentManually={handleAddStudentManually} onBatchAddStudents={handleBatchAddStudents} onUpdateStudent={handleUpdateStudent} onDeleteStudent={handleDeleteStudent} onViewReport={(s) => { setSelectedStudentForReport(s); setActiveTab('report'); }} currentSemester={currentSemester} onSemesterChange={setCurrentSemester} onEditClass={handleEditClass} onDeleteClass={handleDeleteClass} />;
      }

      if (activeTab === 'reports_center') return <Reports />;
      if (activeTab === 'settings') return <Settings />;
      if (activeTab === 'guide') return <UserGuide />;
      if (activeTab === 'about') return <About />;
      
      return null;
  };

  // Main navigation items
  const mainNavItems = [
      { id: 'dashboard', label: 'الرئيسية', icon: LayoutDashboard },
      { id: 'attendance', label: 'الحضور', icon: CalendarCheck },
      { id: 'students', label: 'الطلاب', icon: Users },
      { id: 'grades', label: 'الدرجات', icon: BarChart3 },
  ];

  // Secondary items
  const secondaryNavItems = [
      { id: 'reports_center', label: 'التقارير', icon: FileSpreadsheet },
      { id: 'settings', label: 'البيانات', icon: SettingsIcon },
      { id: 'guide', label: 'الدليل', icon: HelpCircle },
      { id: 'about', label: 'حول', icon: Info },
  ];

  // Full Sidebar items
  const sidebarNavItems = [...mainNavItems, ...secondaryNavItems];

  return (
    <div className={`flex h-[100dvh] overflow-hidden font-sans text-slate-900 dark:text-white ${isLowPower ? 'low-power' : ''}`}>
        
        {/* --- DESKTOP SIDEBAR --- */}
        <aside className="hidden md:flex flex-col w-64 h-full p-4 shrink-0 relative z-50">
            <div className="h-full rounded-[2.5rem] glass-heavy flex flex-col overflow-hidden shadow-2xl border border-white/20">
                {/* Header */}
                <div className="p-6 pb-2 flex items-center gap-3">
                    <div className="w-10 h-10 shrink-0 glass-icon rounded-2xl border border-white/30"><BrandLogo className="w-full h-full" showText={false} /></div>
                    <span className="text-xl font-black text-slate-800 dark:text-white tracking-tight text-glow">راصد</span>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-2 custom-scrollbar">
                    {sidebarNavItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => handleNavigate(item.id)}
                            className={`
                                w-full flex items-center gap-4 px-4 py-3.5 rounded-[1.2rem] transition-all duration-300 font-bold text-sm relative group
                                ${activeTab === item.id 
                                    ? 'glass-card border-white/40 text-slate-900 dark:text-white shadow-[0_0_20px_rgba(255,255,255,0.15)] bg-white/20' 
                                    : 'text-slate-600 dark:text-white/60 hover:bg-white/10 hover:text-slate-900 dark:hover:text-white'
                                }
                            `}
                        >
                            <div className={`w-6 h-6 flex items-center justify-center transition-all ${activeTab === item.id ? 'scale-110 drop-shadow-md' : 'opacity-70'}`}>
                                <item.icon className="w-5 h-5" />
                            </div>
                            <span className="block tracking-wide">{item.label}</span>
                            {activeTab === item.id && <div className="absolute left-3 w-1.5 h-1.5 bg-indigo-400 dark:bg-white rounded-full shadow-[0_0_10px_currentColor]"></div>}
                        </button>
                    ))}
                </nav>

                {/* Footer Actions */}
                <div className="p-4 pt-2 space-y-2 bg-transparent">
                    <button onClick={() => setTheme(isDark ? 'ceramic' : 'vision')} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all text-slate-600 dark:text-white/60 hover:bg-white/10 glass-card border-white/10 hover:border-white/20 active:scale-95">
                        <div className="w-6 h-6 flex items-center justify-center">{isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}</div>
                        <span className="block">{isDark ? 'الوضع النهاري' : 'الوضع الليلي'}</span>
                    </button>
                </div>
            </div>
        </aside>

        {/* --- MAIN CONTENT --- */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative h-full">
            
            {/* Mobile Header */}
            <div 
                className="md:hidden px-4 pb-2 flex justify-between items-center z-30 transition-all"
                style={{ paddingTop: 'calc(env(safe-area-inset-top) + 10px)' }}
            >
                <div className="flex items-center gap-2">
                    <BrandLogo className="w-8 h-8" showText={false} />
                    <span className="text-lg font-black text-slate-900 dark:text-white tracking-tight">راصد</span>
                </div>
            </div>

            {/* Scrollable Area */}
            {/* تم زيادة مساحة الحشو السفلية لضمان عدم تغطية المحتوى بواسطة الشريط السفلي */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 custom-scrollbar scroll-smooth pb-32 md:pb-6">
                <div className="max-w-7xl mx-auto h-full">
                    {renderContent()}
                </div>
            </div>

            {/* --- IPHONE BOTTOM BAR (Mobile Only) --- */}
            {/* تم تعديل التموضع ليكون فوق منطقة الأمان باستخدام calc() بدلاً من وضعه داخلها */}
            <div 
                className="md:hidden fixed left-4 right-4 z-50 transition-all duration-300 ease-out"
                style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
            >
                <div className="glass-heavy rounded-[2rem] p-1.5 flex justify-between items-center shadow-2xl border border-white/20 backdrop-blur-xl relative">
                    {mainNavItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => handleNavigate(item.id)}
                            className={`flex-1 flex flex-col items-center justify-center py-3 rounded-[1.5rem] transition-all duration-300 relative overflow-hidden ${activeTab === item.id ? 'text-indigo-600 dark:text-white' : 'text-slate-400 dark:text-white/40 hover:text-slate-600'}`}
                        >
                            {activeTab === item.id && (
                                <div className="absolute inset-0 bg-white/20 shadow-inner rounded-[1.5rem]"></div>
                            )}
                            <item.icon className={`w-6 h-6 mb-0.5 relative z-10 transition-transform ${activeTab === item.id ? 'scale-110 -translate-y-0.5' : ''}`} strokeWidth={activeTab === item.id ? 2.5 : 2} />
                            <span className="text-[9px] font-black relative z-10">{item.label}</span>
                        </button>
                    ))}
                    
                    {/* More Button */}
                    <button
                        onClick={() => setShowMoreMenu(true)}
                        className={`flex-1 flex flex-col items-center justify-center py-3 rounded-[1.5rem] transition-all duration-300 ${['reports_center', 'settings', 'guide', 'about'].includes(activeTab) ? 'text-indigo-600 dark:text-white bg-white/10' : 'text-slate-400 dark:text-white/40'}`}
                    >
                        <Grid className="w-6 h-6 mb-0.5" />
                        <span className="text-[9px] font-black">المزيد</span>
                    </button>
                </div>
            </div>

            {/* --- MOBILE MORE MENU SHEET --- */}
            <Modal isOpen={showMoreMenu} onClose={() => setShowMoreMenu(false)} className="mb-20 rounded-[2.5rem] max-w-sm w-full mx-4">
                <div className="grid grid-cols-2 gap-3">
                    {secondaryNavItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => handleNavigate(item.id)}
                            className={`p-4 rounded-2xl flex flex-col items-center justify-center gap-2 border transition-all ${activeTab === item.id ? 'bg-indigo-600 text-white border-transparent shadow-lg' : 'glass-card border-white/10 text-slate-700 dark:text-white hover:bg-white/10'}`}
                        >
                            <div className={`p-3 rounded-full ${activeTab === item.id ? 'bg-white/20' : 'glass-icon'}`}>
                                <item.icon className="w-6 h-6" />
                            </div>
                            <span className="font-black text-sm">{item.label}</span>
                        </button>
                    ))}
                </div>
                
                <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 gap-3">
                    <button onClick={() => setTheme(isDark ? 'ceramic' : 'vision')} className="p-3 glass-card rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-slate-600 dark:text-white/70">
                        {isDark ? <Sun className="w-4 h-4"/> : <Moon className="w-4 h-4"/>}
                        {isDark ? 'نهاري' : 'ليلي'}
                    </button>
                    <button onClick={toggleLowPower} className={`p-3 glass-card rounded-xl flex items-center justify-center gap-2 text-xs font-bold ${isLowPower ? 'text-amber-500 border-amber-500/30' : 'text-slate-600 dark:text-white/70'}`}>
                        <Zap className={`w-4 h-4 ${isLowPower ? 'fill-amber-500' : ''}`}/>
                        توفير طاقة
                    </button>
                </div>
            </Modal>

        </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
