
import React, { useState, useEffect, useRef } from 'react';
import { Student } from './types';
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
  Settings as SettingsIcon,
  ChevronLeft,
  Trash2,
  Download,
  GraduationCap,
  UploadCloud,
  School,
  User,
  CheckCircle2
} from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'students' | 'attendance' | 'grades' | 'import' | 'report'>(() => {
    return (localStorage.getItem('activeTab') as any) || 'dashboard';
  });
  
  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('studentData');
    return saved ? JSON.parse(saved) : [];
  });

  const [classes, setClasses] = useState<string[]>(() => {
    const saved = localStorage.getItem('classesData');
    if (saved) return JSON.parse(saved);
    return [];
  });

  const [teacherInfo, setTeacherInfo] = useState({
    name: localStorage.getItem('teacherName') || '',
    school: localStorage.getItem('schoolName') || ''
  });

  const [isSetupComplete, setIsSetupComplete] = useState(!!teacherInfo.name);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(localStorage.getItem('selectedStudentId'));
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const restoreInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('studentData', JSON.stringify(students));
    localStorage.setItem('classesData', JSON.stringify(classes));
    localStorage.setItem('activeTab', activeTab);
    localStorage.setItem('teacherName', teacherInfo.name);
    localStorage.setItem('schoolName', teacherInfo.school);
    if (selectedStudentId) localStorage.setItem('selectedStudentId', selectedStudentId);
    
    setIsSaving(true);
    const timeout = setTimeout(() => setIsSaving(false), 800);
    return () => clearTimeout(timeout);
  }, [students, classes, activeTab, selectedStudentId, teacherInfo]);

  const handleUpdateStudent = (updatedStudent: Student) => {
    setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
  };

  const handleAddStudentManually = (name: string, className: string) => {
    const newStudent: Student = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      grade: '',
      classes: [className],
      attendance: [],
      behaviors: [],
      grades: []
    };
    setStudents(prev => [newStudent, ...prev]);
    if (!classes.includes(className)) {
      setClasses(prev => [...prev, className].sort());
    }
  };

  const handleImportStudents = (newStudents: Student[]) => {
    setStudents(prev => [...prev, ...newStudents]);
    const newClasses = Array.from(new Set(newStudents.flatMap(s => s.classes || [])));
    setClasses(prev => Array.from(new Set([...prev, ...newClasses])).sort());
    setActiveTab('students');
  };

  const handleAddClass = (className: string) => {
    if (!classes.includes(className)) {
        setClasses(prev => [...prev, className].sort());
    }
  };

  const handleBackup = () => {
    try {
      const data = { students, classes, teacherInfo, v: "2.7" };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `نسخة_مدرستي_${new Date().toLocaleDateString('ar-EG').replace(/\//g, '-')}.json`;
      link.click();
    } catch (e) { alert('فشل تصدير النسخة'); }
  };

  const handleRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (json.students) {
          if (confirm('هل تريد استعادة البيانات؟')) {
            setStudents(json.students);
            setClasses(json.classes || []);
            if (json.teacherInfo) setTeacherInfo(json.teacherInfo);
            alert('تمت استعادة البيانات');
          }
        }
      } catch (err) { alert('الملف غير صالح'); }
    };
    reader.readAsText(file);
  };

  if (!isSetupComplete) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-white px-8">
        <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl shadow-blue-200">
           <School className="text-white w-10 h-10" />
        </div>
        <h1 className="text-2xl font-black text-gray-900 mb-2">مرحباً بك في مدرستي</h1>
        <p className="text-xs text-gray-400 font-bold mb-8 text-center">يرجى إدخال بياناتك الأساسية للبدء</p>
        
        <div className="w-full max-w-sm space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 mr-2 uppercase">اسم المعلم / المعلمة</label>
            <div className="relative">
              <User className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                className="w-full bg-gray-50 border-none rounded-2xl py-4 pr-12 pl-4 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-blue-500/10 transition-all"
                placeholder="مثال: أ. محمد"
                value={teacherInfo.name}
                onChange={(e) => setTeacherInfo({...teacherInfo, name: e.target.value})}
              />
            </div>
          </div>
          
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 mr-2 uppercase">اسم المدرسة</label>
            <div className="relative">
              <School className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                className="w-full bg-gray-50 border-none rounded-2xl py-4 pr-12 pl-4 text-sm font-bold outline-none ring-2 ring-transparent focus:ring-blue-500/10 transition-all"
                placeholder="اسم مدرستك الموقرة"
                value={teacherInfo.school}
                onChange={(e) => setTeacherInfo({...teacherInfo, school: e.target.value})}
              />
            </div>
          </div>

          <button 
            disabled={!teacherInfo.name || !teacherInfo.school}
            onClick={() => setIsSetupComplete(true)}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-100 disabled:opacity-50 disabled:shadow-none mt-4 flex items-center justify-center gap-2"
          >
            بدء الاستخدام <CheckCircle2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-[#f2f2f7] overflow-hidden">
      <header className="bg-white/95 backdrop-blur-xl border-b border-gray-200 z-40 safe-top no-print shrink-0">
        <div className="px-5 h-14 flex justify-between items-center">
          <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowInfoModal(true)} 
                className="p-1 border border-gray-100 rounded-xl active-scale transition-all overflow-hidden bg-white shadow-sm"
              >
                  <img src="icon.png" className="w-8 h-8 object-cover rounded-lg" alt="logo" onError={(e) => e.currentTarget.src='https://cdn-icons-png.flaticon.com/512/3532/3532299.png'} />
              </button>
              <h1 className="text-xs font-black text-gray-900 truncate max-w-[120px]">{teacherInfo.school}</h1>
          </div>
          <div className="flex items-center gap-2">
            {isSaving && <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />}
            <button onClick={() => setShowSettingsModal(true)} className="p-1.5 bg-gray-50 text-gray-400 rounded-full active-scale">
              <SettingsIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4 no-print scroll-container">
        <div className="max-w-md mx-auto w-full pb-24">
          {activeTab === 'dashboard' && <Dashboard students={students} teacherInfo={teacherInfo} onSelectStudent={(s) => { setSelectedStudentId(s.id); setActiveTab('report'); }} />}
          {activeTab === 'students' && <StudentList students={students} classes={classes} onAddClass={handleAddClass} onAddStudentManually={handleAddStudentManually} onUpdateStudent={handleUpdateStudent} onViewReport={(s) => { setSelectedStudentId(s.id); setActiveTab('report'); }} />}
          {activeTab === 'attendance' && <AttendanceTracker students={students} classes={classes} setStudents={setStudents} />}
          {activeTab === 'grades' && <GradeBook students={students} classes={classes} onUpdateStudent={handleUpdateStudent} />}
          {activeTab === 'import' && <ExcelImport existingClasses={classes} onImport={handleImportStudents} onAddClass={handleAddClass} />}
          {activeTab === 'report' && selectedStudentId && students.find(s => s.id === selectedStudentId) && (
            <div className="pb-10">
              <button onClick={() => setActiveTab('students')} className="flex items-center text-blue-600 mb-4 font-black px-2 py-1 rounded-lg"><ChevronLeft className="w-5 h-5 ml-1" /> العودة</button>
              <StudentReport student={students.find(s => s.id === selectedStudentId)!} />
            </div>
          )}
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-200 safe-bottom no-print z-50 shadow-2xl rounded-t-[2rem]">
        <div className="flex justify-around items-center py-2 px-1 max-w-md mx-auto">
          {[
            { id: 'dashboard', icon: BarChart3, label: 'الرئيسية' },
            { id: 'attendance', icon: CalendarCheck, label: 'الحضور' },
            { id: 'grades', icon: GraduationCap, label: 'الدرجات' },
            { id: 'students', icon: Users, label: 'الطلاب' },
            { id: 'import', icon: FileUp, label: 'استيراد' },
          ].map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`flex flex-col items-center gap-1 min-w-[55px] py-2 transition-all rounded-xl active-scale ${activeTab === item.id ? 'text-blue-600' : 'text-gray-400'}`}>
              <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'stroke-[2.5px]' : ''}`} />
              <span className="text-[9px] font-black">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6" onClick={() => setShowSettingsModal(false)}>
          <div className="bg-white w-full max-w-[320px] rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
             <h3 className="text-base font-black text-gray-900 mb-6 text-center">إدارة البيانات</h3>
             <div className="space-y-3">
               <button onClick={handleBackup} className="w-full flex items-center gap-3 p-4 bg-blue-50 text-blue-700 rounded-2xl font-black text-xs active-scale shadow-sm"><Download className="w-5 h-5"/> نسخة احتياطية</button>
               <button onClick={() => restoreInputRef.current?.click()} className="w-full flex items-center gap-3 p-4 bg-emerald-50 text-emerald-700 rounded-2xl font-black text-xs active-scale shadow-sm"><UploadCloud className="w-5 h-5"/> استعادة البيانات</button>
               <input type="file" ref={restoreInputRef} className="hidden" accept=".json" onChange={handleRestore} />
               <button onClick={() => { if(confirm('هل أنت متأكد من مسح كل البيانات نهائياً؟')) { localStorage.clear(); location.reload(); } }} className="w-full flex items-center gap-3 p-4 bg-rose-50 text-rose-700 rounded-2xl font-black text-xs active-scale"><Trash2 className="w-5 h-5"/> مسح كل البيانات</button>
             </div>
             <button onClick={() => setShowSettingsModal(false)} className="w-full mt-6 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-[10px]">إغلاق</button>
          </div>
        </div>
      )}

      {showInfoModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-6" onClick={() => setShowInfoModal(false)}>
          <div className="bg-white w-full max-w-[320px] rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
             <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl border border-gray-100 overflow-hidden p-1">
                <img src="icon.png" className="w-full h-full object-cover rounded-[1.25rem]" onError={(e) => e.currentTarget.src='https://cdn-icons-png.flaticon.com/512/3532/3532299.png'} />
             </div>
             <h3 className="text-lg font-black text-center text-gray-900 mb-2">نظام مدرستي</h3>
             <div className="bg-gray-50 p-4 rounded-2xl space-y-3 mb-6 text-[10px] font-black">
                <div className="flex justify-between border-b pb-2"><span>المعلم</span><span className="text-blue-600">أ. {teacherInfo.name}</span></div>
                <div className="flex justify-between"><span>المدرسة</span><span>{teacherInfo.school}</span></div>
             </div>
             <button onClick={() => setShowInfoModal(false)} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-xs shadow-lg active-scale">إغلاق</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
