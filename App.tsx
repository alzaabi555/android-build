import React, { useState, useEffect, Suspense } from 'react';
import { Student, ScheduleDay } from './types';
import Dashboard from './components/Dashboard';
import StudentList from './components/StudentList';
import AttendanceTracker from './components/AttendanceTracker';
import GradeBook from './components/GradeBook';
import StudentReport from './components/StudentReport';
import ExcelImport from './components/ExcelImport';
import { 
  Users, 
  CalendarCheck, 
  BarChart3, 
  FileUp, 
  ChevronLeft,
  GraduationCap,
  School,
  CheckCircle2
} from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState(() => {
    try {
      return localStorage.getItem('activeTab') || 'dashboard';
    } catch { return 'dashboard'; }
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

  // Schedule State
  const [schedule, setSchedule] = useState<ScheduleDay[]>(() => {
    try {
      const saved = localStorage.getItem('scheduleData');
      if (saved) return JSON.parse(saved);
    } catch {}
    // Default Schedule Structure
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

  const [isSetupComplete, setIsSetupComplete] = useState(!!teacherInfo.name && !!teacherInfo.school);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('studentData', JSON.stringify(students));
      localStorage.setItem('classesData', JSON.stringify(classes));
      localStorage.setItem('activeTab', activeTab);
      localStorage.setItem('teacherName', teacherInfo.name);
      localStorage.setItem('schoolName', teacherInfo.school);
      localStorage.setItem('scheduleData', JSON.stringify(schedule));
    } catch (e) {
      console.warn("Storage restricted", e);
    }
  }, [students, classes, activeTab, teacherInfo, schedule]);

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

  if (!isSetupComplete) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-white px-8 animate-in fade-in duration-700" style={{direction: 'rtl'}}>
        <div className="w-24 h-24 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-xl shadow-blue-200 ring-4 ring-blue-50">
           <School className="text-white w-12 h-12" />
        </div>
        <h1 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">نظام مدرستي</h1>
        <p className="text-sm text-slate-400 font-bold mb-12 text-center">قم بإعداد هويتك التعليمية للبدء</p>
        <div className="w-full max-w-sm space-y-5">
          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-400 mr-2">الاسم الكريم</label>
            <input type="text" className="w-full bg-slate-50 rounded-2xl py-4 px-5 text-sm font-bold outline-none border-2 border-transparent focus:border-blue-500/20 focus:bg-white transition-all text-slate-800 placeholder:text-slate-300" placeholder="أ. محمد أحمد" value={teacherInfo.name} onChange={(e) => setTeacherInfo({...teacherInfo, name: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-black text-slate-400 mr-2">اسم المدرسة</label>
            <input type="text" className="w-full bg-slate-50 rounded-2xl py-4 px-5 text-sm font-bold outline-none border-2 border-transparent focus:border-blue-500/20 focus:bg-white transition-all text-slate-800 placeholder:text-slate-300" placeholder="مدرسة المستقبل الابتدائية" value={teacherInfo.school} onChange={(e) => setTeacherInfo({...teacherInfo, school: e.target.value})} />
          </div>
          <button onClick={() => setIsSetupComplete(true)} disabled={!teacherInfo.name || !teacherInfo.school} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-sm active:scale-95 flex items-center justify-center gap-2 mt-4 shadow-lg shadow-blue-200 disabled:opacity-50 disabled:shadow-none transition-all">بدء الاستخدام <CheckCircle2 className="w-5 h-5" /></button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#f2f2f7]" style={{direction: 'rtl'}}>
      {/* Header with Safe Area support */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-40 pt-[var(--sat)] transition-all">
        <div className="px-5 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-md shadow-blue-100">م</div>
              <div>
                <h1 className="text-[13px] font-black text-slate-800 leading-tight truncate max-w-[150px]">{teacherInfo.school}</h1>
                <p className="text-[10px] font-bold text-slate-400">أ. {teacherInfo.name}</p>
              </div>
          </div>
          {/* تم إزالة زر الإعدادات لتجنب الأخطاء كما طلبت */}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-4 overflow-y-auto pb-[calc(80px+var(--sab))]">
        <div className="max-w-md mx-auto h-full">
          <Suspense fallback={<div className="flex items-center justify-center h-40"><div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>}>
            {activeTab === 'dashboard' && (
              <Dashboard 
                students={students} 
                teacherInfo={teacherInfo} 
                schedule={schedule}
                onUpdateSchedule={setSchedule}
                onSelectStudent={(s) => { setSelectedStudentId(s.id); setActiveTab('report'); }} 
              />
            )}
            {activeTab === 'students' && <StudentList students={students} classes={classes} onAddClass={(c) => setClasses(prev => [...prev, c].sort())} onAddStudentManually={handleAddStudentManually} onUpdateStudent={handleUpdateStudent} onViewReport={(s) => { setSelectedStudentId(s.id); setActiveTab('report'); }} />}
            {activeTab === 'attendance' && <AttendanceTracker students={students} classes={classes} setStudents={setStudents} />}
            {activeTab === 'grades' && <GradeBook students={students} classes={classes} onUpdateStudent={handleUpdateStudent} />}
            {activeTab === 'import' && <ExcelImport existingClasses={classes} onImport={(ns) => { setStudents(prev => [...prev, ...ns]); setActiveTab('students'); }} onAddClass={(c) => setClasses(prev => [...prev, c].sort())} />}
            {activeTab === 'report' && selectedStudentId && (
              <div className="animate-in slide-in-from-right duration-300">
                <button onClick={() => setActiveTab('students')} className="mb-4 flex items-center gap-1.5 text-blue-600 font-bold text-xs bg-blue-50 w-fit px-3 py-1.5 rounded-full"><ChevronLeft className="w-4 h-4" /> العودة للقائمة</button>
                <StudentReport student={students.find(s => s.id === selectedStudentId)!} />
              </div>
            )}
          </Suspense>
        </div>
      </main>

      {/* Bottom Navigation with Safe Area */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-gray-200/50 pb-[var(--sab)] z-50">
        <div className="flex justify-around items-center h-16 max-w-md mx-auto">
          {[
            { id: 'dashboard', icon: BarChart3, label: 'الرئيسية' },
            { id: 'attendance', icon: CalendarCheck, label: 'الحضور' }, // تم تغيير الاسم
            { id: 'students', icon: Users, label: 'الطلاب' },
            { id: 'grades', icon: GraduationCap, label: 'الدرجات' },
            { id: 'import', icon: FileUp, label: 'أدوات' },
          ].map(item => (
            <button 
              key={item.id} 
              onClick={() => setActiveTab(item.id)} 
              className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-all duration-300 ${activeTab === item.id ? 'text-blue-600' : 'text-gray-400 hover:text-gray-500'}`}
            >
              <div className={`p-1 rounded-xl transition-all ${activeTab === item.id ? 'bg-blue-50 transform -translate-y-1' : ''}`}>
                 <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'stroke-[2.5px]' : 'stroke-2'}`} />
              </div>
              <span className={`text-[9px] font-black transition-opacity ${activeTab === item.id ? 'opacity-100' : 'opacity-70'}`}>{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default App;