import React, { useState, useEffect, Suspense } from 'react';
import { Student, ScheduleDay } from './types';
import Dashboard from './components/Dashboard';
import StudentList from './components/StudentList';
import AttendanceTracker from './components/AttendanceTracker';
import GradeBook from './components/GradeBook';
import StudentReport from './components/StudentReport';
import ExcelImport from './components/ExcelImport';
import NoorPlatform from './components/NoorPlatform';
import { App as CapApp } from '@capacitor/app';
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
  AlertTriangle
} from 'lucide-react';

// Toast Notification Component
const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error' | 'info', onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bg = type === 'success' ? 'bg-emerald-600' : type === 'error' ? 'bg-rose-600' : 'bg-blue-600';

  return (
    <div className={`fixed top-12 left-1/2 transform -translate-x-1/2 ${bg} text-white px-6 py-3 rounded-full shadow-xl z-[200] flex items-center gap-2 animate-in slide-in-from-top-2 duration-300`}>
      {type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : type === 'error' ? <AlertTriangle className="w-4 h-4" /> : <Info className="w-4 h-4" />}
      <span className="text-xs font-black">{message}</span>
    </div>
  );
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

  const [schedule, setSchedule] = useState<ScheduleDay[]>(() => {
    try {
      const saved = localStorage.getItem('scheduleData');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      { dayName: 'الأحد', periods: Array(8).fill('') },
      { dayName: 'الاثنين', periods: Array(8).fill('') },
      { dayName: 'الثلاثاء', periods: Array(8).fill('') },
      { dayName: 'الأربعاء', periods: Array(8).fill('') },
      { dayName: 'الخميس', periods: Array(8).fill('') },
    ];
  });

  const [teacherInfo, setTeacherInfo] = useState(() => {
    try {
      return {
        name: localStorage.getItem('teacherName') || '',
        school: localStorage.getItem('schoolName') || ''
      };
    } catch {
      return { name: '', school: '' };
    }
  });

  const [viewSheetUrl, setViewSheetUrl] = useState(() => {
    try { return localStorage.getItem('viewSheetUrl') || ''; } catch { return ''; }
  });

  const [isSetupComplete, setIsSetupComplete] = useState(!!teacherInfo.name && !!teacherInfo.school);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);

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
        // تجاهل الخطأ
      }
    };
    setupBackButton();
    return () => { if(backButtonListener) backButtonListener.remove(); };
  }, [showSettingsModal, activeTab]);

  useEffect(() => {
    try {
      localStorage.setItem('studentData', JSON.stringify(students));
      localStorage.setItem('classesData', JSON.stringify(classes));
      localStorage.setItem('activeTab', activeTab);
      localStorage.setItem('teacherName', teacherInfo.name);
      localStorage.setItem('schoolName', teacherInfo.school);
      localStorage.setItem('scheduleData', JSON.stringify(schedule));
      localStorage.setItem('viewSheetUrl', viewSheetUrl);
      localStorage.setItem('currentSemester', currentSemester);
    } catch (e) {
      console.warn("Storage restricted", e);
    }
  }, [students, classes, activeTab, teacherInfo, schedule, viewSheetUrl, currentSemester]);

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
      const dataToSave = { teacherInfo, students, classes, schedule, exportDate: new Date().toISOString() };
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
            setTeacherInfo(json.teacherInfo || { name: '', school: '' });
            setStudents(json.students || []);
            setClasses(json.classes || []);
            setSchedule(json.schedule || []);
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

  if (!isSetupComplete) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-white px-8 animate-in fade-in duration-700" style={{direction: 'rtl'}}>
        <div className="mb-8 p-4 rounded-3xl shadow-xl shadow-blue-100 bg-white ring-4 ring-blue-50">
           <img src="icon.png" className="w-24 h-24 object-contain" alt="شعار التطبيق" onError={(e) => { e.currentTarget.src = ''; e.currentTarget.className='hidden'; }} />
           <School className="text-blue-600 w-16 h-16 hidden first:block" /> 
        </div>

        <h1 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">راصد</h1>
        <p className="text-sm text-slate-400 font-bold mb-12 text-center">قم بإعداد هويتك التعليمية للبدء</p>
        <form onSubmit={handleStartApp} className="w-full max-w-sm space-y-5">
          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-400 mr-2">اسم المعلم / المعلمة</label>
            <input 
                type="text" 
                className="w-full bg-slate-50 rounded-2xl py-4 px-5 text-sm font-bold outline-none border-2 border-transparent focus:border-blue-500/20 focus:bg-white transition-all text-slate-800 placeholder:text-slate-300" 
                placeholder="" 
                value={teacherInfo.name} 
                onChange={(e) => setTeacherInfo({...teacherInfo, name: e.target.value})}
                autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-400 mr-2">اسم المدرسة</label>
            <input 
                type="text" 
                className="w-full bg-slate-50 rounded-2xl py-4 px-5 text-sm font-bold outline-none border-2 border-transparent focus:border-blue-500/20 focus:bg-white transition-all text-slate-800 placeholder:text-slate-300" 
                placeholder="" 
                value={teacherInfo.school} 
                onChange={(e) => setTeacherInfo({...teacherInfo, school: e.target.value})}
                autoComplete="off"
            />
          </div>
          <button 
            type="submit" 
            disabled={!teacherInfo.name || !teacherInfo.school} 
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-sm active:scale-95 flex items-center justify-center gap-2 mt-4 shadow-lg shadow-blue-200 disabled:opacity-50 disabled:shadow-none transition-all"
          >
            بدء الاستخدام <CheckCircle2 className="w-5 h-5" />
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#f2f2f7]" style={{direction: 'rtl'}}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Main Content: INCREASED paddingTop significantly to push content down from notch - Changed from 3.5rem to 5rem for better Android support */}
      <main className="flex-1 px-4 overflow-y-auto pb-[calc(60px+var(--sab))] pt-[calc(5rem+var(--sat))]">
        <div className="max-w-7xl mx-auto h-full">
          <Suspense fallback={<div className="flex items-center justify-center h-40"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>}>
            {activeTab === 'dashboard' && (
              <Dashboard 
                students={students} 
                teacherInfo={teacherInfo} 
                schedule={schedule}
                onUpdateSchedule={setSchedule}
                onSelectStudent={(s) => { setSelectedStudentId(s.id); setActiveTab('report'); }} 
                onNavigate={(tab) => setActiveTab(tab)}
                onOpenSettings={() => setShowSettingsModal(true)}
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
            {activeTab === 'import' && <ExcelImport existingClasses={classes} onImport={(ns) => { setStudents(prev => [...prev, ...ns]); setActiveTab('students'); }} onAddClass={(c) => setClasses(prev => [...prev, c].sort())} />}
            {activeTab === 'noor' && <NoorPlatform />}
            {activeTab === 'report' && selectedStudentId && (
              <div className="animate-in slide-in-from-right duration-300 max-w-3xl mx-auto">
                <button onClick={() => setActiveTab('students')} className="mb-4 flex items-center gap-1.5 text-blue-600 font-bold text-xs bg-blue-50 w-fit px-3 py-1.5 rounded-full"><ChevronLeft className="w-4 h-4" /> العودة للقائمة</button>
                <StudentReport student={students.find(s => s.id === selectedStudentId)!} />
              </div>
            )}
          </Suspense>
        </div>
      </main>

      {/* Smaller Bottom Navbar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-200/50 pb-[var(--sab)] z-50">
        <div className="flex justify-around items-center h-12 max-w-lg mx-auto">
          {[
            { id: 'dashboard', icon: BarChart3, label: 'الرئيسية' },
            { id: 'attendance', icon: CalendarCheck, label: 'الحضور' }, 
            { id: 'students', icon: Users, label: 'الطلاب' },
            { id: 'grades', icon: GraduationCap, label: 'الدرجات' },
            { id: 'noor', icon: Globe, label: 'نور' },
          ].map(item => (
            <button 
              key={item.id} 
              onClick={() => setActiveTab(item.id)} 
              className={`flex flex-col items-center justify-center gap-0.5 w-full h-full transition-all duration-300 ${activeTab === item.id ? 'text-blue-600' : 'text-gray-400 hover:text-gray-500'}`}
            >
              <div className={`p-1 rounded-xl transition-all ${activeTab === item.id ? 'bg-blue-50 transform -translate-y-0.5' : ''}`}>
                 <item.icon className={`w-4 h-4 ${activeTab === item.id ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              </div>
              <span className={`text-[8px] font-black transition-opacity ${activeTab === item.id ? 'opacity-100' : 'opacity-70'}`}>{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-in fade-in duration-200" onClick={() => setShowSettingsModal(false)}>
           <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
              <div className="absolute top-0 right-0 p-6 z-10">
                 <button onClick={() => setShowSettingsModal(false)} className="p-2 bg-gray-50 rounded-full hover:bg-gray-100"><X className="w-4 h-4 text-gray-500" /></button>
              </div>

              <div className="flex flex-col items-center text-center mb-6 pt-2 shrink-0">
                 <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center mb-3 shadow-xl shadow-blue-200">
                    <Info className="text-white w-8 h-8" />
                 </div>
                 <h2 className="text-lg font-black text-gray-800 mb-0.5">حول التطبيق</h2>
                 <p className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-full mb-3">الإصدار 3.0</p>
                 
                 <div className="space-y-0.5 mb-4">
                    <p className="text-[10px] font-bold text-gray-400">تصميم وتطوير</p>
                    <h3 className="text-xs font-black text-gray-800">محمد درويش الزعابي</h3>
                    <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-gray-400">
                      <Phone className="w-3 h-3" /> <span>98344555</span>
                    </div>
                 </div>

                 <div className="bg-amber-50 border border-amber-100 p-3 rounded-2xl w-full relative overflow-hidden">
                    <Heart className="w-12 h-12 text-amber-500/10 absolute -left-2 -bottom-2 rotate-12" />
                    <p className="text-[10px] font-black text-amber-800 leading-relaxed relative z-10">
                    "هذا التطبيق عمل خيري وصدقة عن روح والدتي ؛ فأرجو الدعاء لها بالرحمة والمغفرة"
                    </p>
                 </div>
              </div>

              <div className="overflow-y-auto pr-1 space-y-4 custom-scrollbar flex-1">
                 
                 <div className="border-t border-gray-100 pt-4 space-y-2">
                    <h3 className="text-xs font-black text-gray-400 mb-2 flex items-center gap-2"><Database className="w-3.5 h-3.5" /> إدارة البيانات</h3>
                    
                    <button onClick={handleBackupData} className="w-full flex items-center justify-between p-3.5 bg-blue-50 text-blue-700 rounded-2xl text-[11px] font-black hover:bg-blue-100 active:scale-95 transition-all">
                        <span>حفظ نسخة احتياطية (نسخ شامل)</span>
                        {navigator.canShare ? <Share className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                    </button>

                    <label className="w-full flex items-center justify-between p-3.5 bg-purple-50 text-purple-700 rounded-2xl text-[11px] font-black hover:bg-purple-100 active:scale-95 transition-all cursor-pointer">
                        <span>استعادة نسخة (استيراد)</span>
                        <Upload className="w-4 h-4" />
                        <input type="file" accept=".json" className="hidden" onChange={handleRestoreData} />
                    </label>

                    <button onClick={handleClearAllData} className="w-full flex items-center justify-between p-3.5 bg-rose-50 text-rose-700 rounded-2xl text-[11px] font-black hover:bg-rose-100 active:scale-95 transition-all">
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