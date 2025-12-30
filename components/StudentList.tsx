
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Student, BehaviorType } from '../types';
import { Search, ThumbsUp, ThumbsDown, X, UserPlus, Edit2, FileSpreadsheet, Sparkles, Shuffle, Trash2, CheckCircle2, MessageCircle, Plus, UploadCloud, UserX, Image as ImageIcon, PhoneOff, AlertCircle, FileUp, User, Camera } from 'lucide-react';
import { Browser } from '@capacitor/browser';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from './Modal';
import { useTheme } from '../context/ThemeContext';

declare var html2pdf: any;

interface StudentListProps {
  students: Student[];
  classes: string[];
  onAddClass: (name: string) => void;
  onAddStudentManually: (name: string, className: string, phone?: string, avatar?: string) => void;
  onBatchAddStudents: (students: Student[]) => void;
  onUpdateStudent: (s: Student) => void;
  onDeleteStudent: (id: string) => void;
  onViewReport: (s: Student) => void;
  onSwitchToImport: () => void;
  currentSemester: '1' | '2';
  onSemesterChange: (sem: '1' | '2') => void;
  onEditClass: (oldName: string, newName: string) => void;
  onDeleteClass: (className: string) => void;
}

// --------------------------------------------------------------------------------
// Optimized Student Item Component (Memoized)
// --------------------------------------------------------------------------------
const StudentItem = React.memo(({ student, theme, onViewReport, onAction, styles }: { 
    student: Student, 
    theme: string, 
    onViewReport: (s: Student) => void,
    onAction: (s: Student, type: 'positive' | 'negative' | 'edit' | 'delete') => void,
    styles: any
}) => {
    return (
        <div className={`group flex items-center justify-between p-3 transition-all duration-200 relative overflow-hidden ${styles.card} hover:bg-white/90 dark:hover:bg-white/10`}>
            <div className="flex items-center gap-4 flex-1 min-w-0 cursor-pointer z-10" onClick={() => onViewReport(student)}>
                <div className={`w-12 h-12 flex items-center justify-center text-slate-700 dark:text-white/80 font-black text-xl shrink-0 overflow-hidden relative ${styles.avatar} bg-slate-100 dark:bg-white/5 shadow-inner`}>
                    {student.avatar ? (
                        <img src={student.avatar} alt={student.name} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                        student.name.charAt(0)
                    )}
                </div>
                <div className="min-w-0 flex flex-col justify-center flex-1">
                    <div className="flex items-center gap-2 mb-1 w-full">
                        <h3 className="text-sm font-black text-slate-900 dark:text-white truncate flex-1 min-w-0">{student.name}</h3>
                        {/* MISSING DATA ALERT: Visual Indicator for missing phone number */}
                        {!student.parentPhone && (
                            <div className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center shrink-0" title="بيانات ناقصة: لا يوجد رقم ولي أمر">
                                <PhoneOff className="w-3 h-3 text-amber-500 dark:text-amber-400" />
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <p className={`text-[10px] text-slate-500 dark:text-white/40 font-bold truncate px-2 py-0.5 inline-block bg-slate-50 dark:bg-white/5 rounded-md`}>{student.classes[0]}</p>
                        <button onClick={(e) => { e.stopPropagation(); onAction(student, 'edit'); }} className="p-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/20 text-slate-400 hover:text-blue-600"><Edit2 className="w-3 h-3" /></button>
                        <button onClick={(e) => { e.stopPropagation(); onAction(student, 'delete'); }} className="p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/20 text-slate-400 hover:text-rose-600"><Trash2 className="w-3 h-3" /></button>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2 z-10 shrink-0 ml-4">
                <button onClick={() => onAction(student, 'positive')} className="w-10 h-10 flex items-center justify-center transition-colors active:scale-90 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                    <ThumbsUp className="w-5 h-5" strokeWidth={2.5} />
                </button>
                <button onClick={() => onAction(student, 'negative')} className="w-10 h-10 flex items-center justify-center transition-colors active:scale-90 rounded-full bg-rose-500/10 text-rose-600 border border-rose-500/20">
                    <ThumbsDown className="w-5 h-5" strokeWidth={2.5} />
                </button>
            </div>
        </div>
    );
}, (prev, next) => prev.student === next.student && prev.theme === next.theme);

const StudentList: React.FC<StudentListProps> = ({ students, classes, onAddClass, onAddStudentManually, onBatchAddStudents, onUpdateStudent, onDeleteStudent, onViewReport, onSwitchToImport, currentSemester, onSemesterChange, onEditClass, onDeleteClass }) => {
  const { theme, isLowPower } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  
  // Modals States
  const [showManualAddModal, setShowManualAddModal] = useState(false);
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [classToEdit, setClassToEdit] = useState<string | null>(null);
  const [newClassName, setNewClassName] = useState('');
  
  // Editing & Behavior States
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editClass, setEditClass] = useState('');
  const [editAvatar, setEditAvatar] = useState('');

  const [showNegativeReasons, setShowNegativeReasons] = useState<{student: Student} | null>(null);
  const [showPositiveReasons, setShowPositiveReasons] = useState<{student: Student} | null>(null);
  const [customReason, setCustomReason] = useState('');
  const [notificationTarget, setNotificationTarget] = useState<{student: Student, type: 'truancy'} | null>(null);
  const [randomStudent, setRandomStudent] = useState<Student | null>(null);
  const [isRandomPicking, setIsRandomPicking] = useState(false);

  // Behavior Lists
  const positiveBehaviors = [
      { name: 'مشاركة فعالة', points: 1 },
      { name: 'التزام بالهدوء', points: 1 },
      { name: 'حل الواجب', points: 2 },
      { name: 'مبادرة', points: 3 },
      { name: 'مساعدة المعلم', points: 2 },
      { name: 'نظافة', points: 1 }
  ];

  const negativeBehaviors = [
      { name: 'إزعاج', points: -1 },
      { name: 'عدم إحضار أدوات', points: -1 },
      { name: 'عدم حل الواجب', points: -2 },
      { name: 'تأخر', points: -1 },
      { name: 'نوم', points: -2 },
      { name: 'سلوك غير لائق', points: -5 }
  ];

  // File Upload Reference
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Memoized Styles - Aware of Low Power Mode
  const styles = useMemo(() => {
      // Base styles depending on mode
      let cardStyle = '';
      let headerStyle = '';

      if (isLowPower) {
          // Solid Backgrounds
          cardStyle = 'bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-800 rounded-[1.2rem] mb-2 shadow-sm';
          headerStyle = 'bg-white dark:bg-[#0f172a] border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30';
      } else {
          // Glass Backgrounds
          cardStyle = 'bg-white/60 dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-[1.2rem] mb-2 shadow-sm backdrop-blur-sm';
          headerStyle = 'bg-white/80 dark:bg-black/40 backdrop-blur-xl border-b border-gray-200 dark:border-white/5 sticky top-0 z-30';
      }

      return {
          card: cardStyle,
          header: headerStyle,
          search: 'bg-slate-100 dark:bg-white/5 rounded-xl border-none',
          actionBtn: 'rounded-full',
          avatar: 'rounded-2xl',
          chipActive: 'bg-indigo-600 text-white shadow-md rounded-full',
          chip: 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/60 rounded-full',
      };
  }, [theme, isLowPower]);

  // Optimized Filtering
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesClass = selectedClass === 'all' || s.classes?.includes(selectedClass);
      return matchesSearch && matchesClass;
    });
  }, [students, searchTerm, selectedClass]);

  // Handlers
  const handleAction = useCallback((student: Student, type: 'positive' | 'negative' | 'edit' | 'delete') => {
      if (type === 'positive') setShowPositiveReasons({student});
      else if (type === 'negative') setShowNegativeReasons({student});
      else if (type === 'edit') {
          setEditingStudent(student);
          setEditName(student.name);
          setEditPhone(student.parentPhone || '');
          setEditClass(student.classes[0] || '');
          setEditAvatar(student.avatar || '');
          setShowManualAddModal(true);
      } else if (type === 'delete') {
          if(confirm('هل أنت متأكد من حذف الطالب؟')) onDeleteStudent(student.id);
      }
  }, [onDeleteStudent]);

  const handleAddBehavior = (student: Student, type: BehaviorType, description: string, points: number) => {
    if (description.includes('تسرب') || description.includes('هروب') || (type === 'negative' && description === 'غياب')) {
        if (student.parentPhone) setNotificationTarget({ student, type: 'truancy' });
        else alert('تم التسجيل، لكن لا يوجد رقم ولي أمر.');
    }
    const newBehavior = { id: Math.random().toString(36).substr(2, 9), date: new Date().toISOString(), type, description, points, semester: currentSemester };
    onUpdateStudent({ ...student, behaviors: [newBehavior, ...(student.behaviors || [])] });
    setShowNegativeReasons(null);
    setShowPositiveReasons(null);
    setCustomReason('');
  };

  const handleSaveStudent = () => {
      if (!editName.trim() || !editClass.trim()) return alert('البيانات ناقصة');
      if (editingStudent) {
          onUpdateStudent({ 
              ...editingStudent, 
              name: editName, 
              parentPhone: editPhone, 
              classes: [editClass],
              avatar: editAvatar 
          });
      } else {
          onAddStudentManually(editName, editClass, editPhone, editAvatar);
      }
      setShowManualAddModal(false);
      setEditingStudent(null);
      setEditName(''); setEditPhone(''); setEditClass(''); setEditAvatar('');
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setEditAvatar(reader.result as string);
          };
          reader.readAsDataURL(file);
      }
  };

  // Class Management Handlers
  const confirmDeleteClass = () => {
      if (selectedClass === 'all') return;
      if (confirm(`هل أنت متأكد من حذف الفصل "${selectedClass}"؟`)) {
          onDeleteClass(selectedClass);
          setSelectedClass('all');
      }
  };

  const startEditClass = () => {
      if (selectedClass === 'all') return;
      setClassToEdit(selectedClass);
      setNewClassName(selectedClass);
  };

  const saveEditClass = () => {
      if (classToEdit && newClassName.trim() && newClassName !== classToEdit) {
          onEditClass(classToEdit, newClassName.trim());
          setSelectedClass(newClassName.trim());
      }
      setClassToEdit(null);
  };

  // --- RE-IMPLEMENTED EXCEL IMPORT LOGIC ---
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
          const data = await file.arrayBuffer();
          const workbook = XLSX.read(data, { type: 'array' });
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "", raw: false }) as any[];

          if (jsonData.length === 0) throw new Error('الملف فارغ');

          const headers = Object.keys(jsonData[0]);
          
          // Helper to clean headers
          const cleanHeader = (header: string) => String(header).trim().replace(/[\u200B-\u200D\uFEFF]/g, '').toLowerCase();
          
          const nameKeywords = ['الاسم', 'اسم الطالب', 'name', 'student'];
          const phoneKeywords = ['جوال', 'هاتف', 'phone', 'mobile', 'ولي', 'contact'];
          const gradeKeywords = ['الصف', 'صف', 'grade', 'class', 'فصل'];

          let nameKey = headers.find(h => nameKeywords.some(kw => cleanHeader(h).includes(kw)));
          let phoneKey = headers.find(h => phoneKeywords.some(kw => cleanHeader(h).includes(kw)));
          let gradeKey = headers.find(h => gradeKeywords.some(kw => cleanHeader(h).includes(kw)));

          if (!nameKey) nameKey = headers[0]; // Fallback to first column

          // Smart Phone Number Detection if column not found
          if (!phoneKey) {
              const looksLikeAPhoneNumber = (val: string) => /^\+?\d{7,15}$/.test(String(val).replace(/[^0-9+]/g, ''));
              for (const header of headers) {
                  if (header === nameKey) continue;
                  let matchCount = 0;
                  let checkLimit = Math.min(jsonData.length, 10);
                  for (let i = 0; i < checkLimit; i++) {
                      if (looksLikeAPhoneNumber(jsonData[i][header])) matchCount++;
                  }
                  if (matchCount >= checkLimit * 0.3) {
                      phoneKey = header;
                      break;
                  }
              }
          }

          const cleanPhoneNumber = (raw: any): string => {
              if (!raw) return '';
              return String(raw).trim().replace(/[^0-9+]/g, '');
          };

          const mappedStudents: Student[] = jsonData
            .map((row): Student | null => {
              const studentName = String(row[nameKey!] || '').trim();
              if (!studentName) return null;

              // Determine Class: If column exists use it, otherwise use currently selected filter or default
              let className = gradeKey ? String(row[gradeKey]).trim() : '';
              if (!className) className = selectedClass !== 'all' ? selectedClass : 'عام';

              return {
                id: Math.random().toString(36).substr(2, 9),
                name: studentName,
                grade: '',
                classes: [className],
                attendance: [],
                behaviors: [],
                grades: [],
                parentPhone: phoneKey ? cleanPhoneNumber(row[phoneKey]) : ''
              };
            })
            .filter((s): s is Student => s !== null);

          if (mappedStudents.length > 0) {
              onBatchAddStudents(mappedStudents); // Bulk Add
              setShowSelectionModal(false); // Close modal
          } else {
              alert('لم يتم العثور على بيانات صالحة');
          }

      } catch (error) {
          console.error("Excel Import Error:", error);
          alert('حدث خطأ أثناء قراءة الملف. تأكد من الصيغة.');
      } finally {
          if (e.target) e.target.value = '';
      }
  };

  const pickRandomStudent = () => {
    if (filteredStudents.length === 0) return;
    setIsRandomPicking(true);
    let counter = 0;
    const interval = setInterval(() => {
      setRandomStudent(filteredStudents[Math.floor(Math.random() * filteredStudents.length)]);
      counter++;
      if (counter > 15) { clearInterval(interval); setIsRandomPicking(false); }
    }, 100);
  };

  const performNotification = async (method: 'whatsapp' | 'sms') => {
      if(!notificationTarget?.student.parentPhone) return;
      let phone = notificationTarget.student.parentPhone.replace(/[^0-9]/g, '');
      if (phone.length === 8) phone = '968' + phone;
      const msg = encodeURIComponent(`السلام عليكم، نود إبلاغكم بأن الطالب ${notificationTarget.student.name} قد تسرب من الحصة.`);
      if (method === 'whatsapp') Browser.open({ url: `https://api.whatsapp.com/send?phone=${phone}&text=${msg}` });
      else window.location.href = `sms:${phone}?body=${msg}`;
      setNotificationTarget(null);
  };

  const handleExportExcel = () => {
      if (filteredStudents.length === 0) return alert('لا يوجد طلاب');
      const data = filteredStudents.map(s => ({
          'الاسم': s.name, 'الصف': s.classes[0] || '', 'رقم الولي': s.parentPhone || '',
          'نقاط إيجابية': (s.behaviors || []).filter(b => b.type === 'positive').reduce((a,b) => a + b.points, 0),
          'نقاط سلبية': (s.behaviors || []).filter(b => b.type === 'negative').reduce((a,b) => a + Math.abs(b.points), 0),
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "الطلاب");
      XLSX.writeFile(wb, `Students_Export.xlsx`);
  };

  return (
    <div className="min-h-full pb-32 text-slate-900 dark:text-white">
      <div className={`pt-safe-top transition-all ${styles.header}`}>
          <div className="px-4 pb-3">
              <div className="flex justify-between items-end mb-3 pt-4">
                  <div>
                      <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">الطلاب</h1>
                      <p className="text-xs text-slate-500 dark:text-white/50 font-bold mt-0.5">{filteredStudents.length} طالب</p>
                  </div>
                  <div className="flex gap-2">
                      <button onClick={pickRandomStudent} className={`w-9 h-9 flex items-center justify-center transition-all bg-indigo-50 dark:bg-white/10 rounded-full text-indigo-600 dark:text-indigo-300 border border-indigo-100 dark:border-white/5`}><Sparkles className="w-4 h-4" /></button>
                      <button onClick={handleExportExcel} className={`w-9 h-9 flex items-center justify-center transition-all bg-blue-50 dark:bg-white/10 rounded-full text-blue-600 dark:text-blue-300 border border-blue-100 dark:border-white/5`}><FileSpreadsheet className="w-4 h-4" /></button>
                      <button onClick={onSwitchToImport} className={`w-9 h-9 flex items-center justify-center transition-all bg-emerald-50 dark:bg-white/10 rounded-full text-emerald-600 dark:text-emerald-300 border border-emerald-100 dark:border-white/5`}><UploadCloud className="w-4 h-4" /></button>
                      
                      {/* MODIFIED: This button now opens the Selection Modal */}
                      <button onClick={() => setShowSelectionModal(true)} className={`w-9 h-9 flex items-center justify-center transition-all bg-indigo-600 text-white rounded-full active:scale-95 hover:bg-indigo-500 border border-indigo-500 shadow-sm`}><UserPlus className="w-4 h-4" /></button>
                  </div>
              </div>

              <div className="relative mb-3">
                  <Search className="absolute right-3 top-2.5 w-4 h-4 text-slate-400 dark:text-white/40" />
                  <input type="text" placeholder="بحث..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className={`w-full py-2 pr-9 pl-4 text-sm font-medium outline-none placeholder:text-slate-400 dark:placeholder:text-white/20 transition-all ${styles.search}`} />
              </div>

              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 items-center">
                  <button onClick={() => setSelectedClass('all')} className={`px-4 py-1.5 text-[10px] font-bold whitespace-nowrap transition-all border border-transparent ${selectedClass === 'all' ? styles.chipActive : styles.chip}`}>الكل</button>
                  {classes.map(c => (<button key={c} onClick={() => setSelectedClass(c)} className={`px-4 py-1.5 text-[10px] font-bold whitespace-nowrap transition-all border border-transparent ${selectedClass === c ? styles.chipActive : styles.chip}`}>{c}</button>))}
                  
                  {/* Edit/Delete Class Controls - Only show if specific class selected */}
                  {selectedClass !== 'all' && (
                      <div className="flex items-center gap-1 pr-2 border-r border-gray-200 dark:border-white/10 mr-2">
                          <button onClick={startEditClass} className="p-1.5 bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-500/30 active:scale-95 transition-all">
                              <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={confirmDeleteClass} className="p-1.5 bg-rose-50 dark:bg-rose-500/20 text-rose-600 dark:text-rose-300 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-500/30 active:scale-95 transition-all">
                              <Trash2 className="w-3.5 h-3.5" />
                          </button>
                      </div>
                  )}
              </div>
          </div>
      </div>

      <div className="px-4 mt-3">
          {filteredStudents.length > 0 ? (
              filteredStudents.map((student, index) => (
                  <div key={student.id} className={!isLowPower && index < 10 ? "animate-in fade-in slide-in-from-bottom-2 duration-300" : ""}>
                      <StudentItem 
                        student={student} 
                        theme={theme} 
                        onViewReport={onViewReport} 
                        onAction={handleAction}
                        styles={styles}
                      />
                  </div>
              ))
          ) : (
              <div className="flex flex-col items-center justify-center py-20 opacity-40">
                  <UserX className="w-16 h-16 text-slate-300 dark:text-white mb-4" />
                  <p className="text-sm font-bold text-slate-400 dark:text-white">لا يوجد طلاب</p>
              </div>
          )}
      </div>

      {/* SELECTION MODAL: Choose between Manual or Excel */}
      <Modal isOpen={showSelectionModal} onClose={() => setShowSelectionModal(false)} className="rounded-[2rem] max-w-sm">
          <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-lg text-slate-900 dark:text-white">إضافة طلاب</h3>
              <button onClick={() => setShowSelectionModal(false)} className="p-2 bg-gray-100 dark:bg-white/10 rounded-full hover:bg-gray-200"><X className="w-5 h-5"/></button>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
              {/* Option 1: Manual Entry */}
              <button 
                onClick={() => { setShowSelectionModal(false); setEditingStudent(null); setEditName(''); setEditPhone(''); setEditClass(''); setEditAvatar(''); setShowManualAddModal(true); }}
                className="flex flex-col items-center justify-center p-6 bg-indigo-50 dark:bg-indigo-500/10 border-2 border-indigo-100 dark:border-indigo-500/20 rounded-3xl hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all active:scale-95 group"
              >
                  <div className="w-14 h-14 bg-indigo-500 text-white rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-indigo-500/30 group-hover:scale-110 transition-transform">
                      <User className="w-7 h-7" />
                  </div>
                  <span className="font-black text-slate-800 dark:text-white text-sm">تسجيل فردي</span>
              </button>

              {/* Option 2: Excel Import (With File Input Logic Restored) */}
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center p-6 bg-emerald-50 dark:bg-emerald-500/10 border-2 border-emerald-100 dark:border-emerald-500/20 rounded-3xl hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all active:scale-95 group"
              >
                  <div className="w-14 h-14 bg-emerald-500 text-white rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
                      <FileUp className="w-7 h-7" />
                  </div>
                  <span className="font-black text-slate-800 dark:text-white text-sm">استيراد Excel</span>
                  
                  {/* Hidden File Input */}
                  <input 
                      type="file" 
                      accept=".xlsx, .csv, .xls" 
                      className="hidden" 
                      ref={fileInputRef}
                      onChange={handleExcelUpload}
                  />
              </button>
          </div>
          
          <p className="text-center text-[10px] text-gray-400 mt-4 font-bold">
              يدعم ملفات Excel التي تحتوي على أعمدة (الاسم، الهاتف، الفصل)
          </p>
      </Modal>

      {/* Manual Entry Modal - With Avatar Upload */}
      <Modal isOpen={showManualAddModal} onClose={() => setShowManualAddModal(false)}>
          <h3 className="font-black text-lg mb-4 text-slate-900 dark:text-white">{editingStudent ? 'تعديل بيانات الطالب' : 'تسجيل طالب جديد'}</h3>
          
          {/* Avatar Upload */}
          <div className="flex justify-center mb-6">
              <div 
                className="w-24 h-24 rounded-full bg-slate-100 dark:bg-white/10 border-2 border-dashed border-slate-300 dark:border-white/20 flex items-center justify-center cursor-pointer relative overflow-hidden group"
                onClick={() => avatarInputRef.current?.click()}
              >
                  {editAvatar ? (
                      <img src={editAvatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                      <Camera className="w-8 h-8 text-slate-400 dark:text-white/40" />
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Edit2 className="w-6 h-6 text-white" />
                  </div>
              </div>
              <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  ref={avatarInputRef} 
                  onChange={handleAvatarChange}
              />
          </div>

          <div className="space-y-3">
              <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-white/5 rounded-xl border-none outline-none font-bold text-sm text-slate-900 dark:text-white" placeholder="الاسم" />
              {classes.length > 0 ? (
                  <select value={editClass} onChange={e => setEditClass(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-white/5 rounded-xl border-none outline-none font-bold text-sm text-slate-900 dark:text-white">
                      <option value="">الفصل...</option>{classes.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
              ) : <input type="text" value={editClass} onChange={e => setEditClass(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-white/5 rounded-xl border-none outline-none font-bold text-sm" placeholder="الفصل" />}
              <input type="tel" value={editPhone} onChange={e => setEditPhone(e.target.value)} className="w-full p-3 bg-slate-50 dark:bg-white/5 rounded-xl border-none outline-none font-bold text-sm" placeholder="رقم الولي" />
              <button onClick={handleSaveStudent} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-sm mt-2">حفظ</button>
          </div>
      </Modal>

      {/* Edit Class Modal */}
      <Modal isOpen={!!classToEdit} onClose={() => setClassToEdit(null)} className="max-w-xs rounded-[2rem]">
          <h3 className="font-black text-lg mb-4 text-slate-900 dark:text-white text-center">تعديل اسم الفصل</h3>
          <input 
              type="text" 
              value={newClassName} 
              onChange={(e) => setNewClassName(e.target.value)}
              className="w-full p-4 bg-slate-50 dark:bg-white/5 rounded-2xl font-black text-lg mb-4 outline-none border border-transparent focus:border-blue-500 text-center text-slate-900 dark:text-white"
              autoFocus
          />
          <button onClick={saveEditClass} className="w-full py-3 bg-blue-600 text-white rounded-xl font-black text-sm active:scale-95 transition-all shadow-lg shadow-blue-500/30">حفظ التغييرات</button>
      </Modal>

      {/* Behavior Modals - RESTORED with Named Actions */}
      <Modal isOpen={!!showPositiveReasons} onClose={() => setShowPositiveReasons(null)} className="max-w-sm rounded-[2rem]">
          <div className="text-center mb-4">
              <h3 className="font-black text-lg text-emerald-600 dark:text-emerald-400">تعزيز إيجابي</h3>
              <p className="text-xs text-gray-500 dark:text-white/50">{showPositiveReasons?.student.name}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mb-4 max-h-[40vh] overflow-y-auto custom-scrollbar">
              {positiveBehaviors.map((b, idx) => (
                  <button 
                    key={idx} 
                    className="py-3 px-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl font-bold text-xs text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 active:scale-95 transition-all border border-emerald-100 dark:border-emerald-500/20 flex flex-col items-center justify-center gap-1" 
                    onClick={() => handleAddBehavior(showPositiveReasons!.student, 'positive', b.name, b.points)}
                  >
                      <span>{b.name}</span>
                      <span className="text-[10px] opacity-70">+{b.points}</span>
                  </button>
              ))}
          </div>
          
          <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="سبب آخر..." 
                value={customReason} 
                onChange={e => setCustomReason(e.target.value)} 
                className="flex-1 p-3 bg-slate-50 dark:bg-white/5 rounded-xl text-sm font-bold border-none outline-none focus:ring-2 focus:ring-emerald-500/50" 
              />
              <button 
                onClick={() => handleAddBehavior(showPositiveReasons!.student, 'positive', customReason || 'تميز', 1)} 
                className="bg-emerald-600 text-white p-3 rounded-xl font-bold shadow-lg shadow-emerald-500/30 disabled:opacity-50 disabled:shadow-none"
                disabled={!customReason}
              >
                  <Plus className="w-5 h-5" />
              </button>
          </div>
      </Modal>

      <Modal isOpen={!!showNegativeReasons} onClose={() => setShowNegativeReasons(null)} className="max-w-sm rounded-[2rem]">
          <div className="text-center mb-4">
              <h3 className="font-black text-lg text-rose-600 dark:text-rose-400">تسجيل مخالفة</h3>
              <p className="text-xs text-gray-500 dark:text-white/50">{showNegativeReasons?.student.name}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mb-4 max-h-[40vh] overflow-y-auto custom-scrollbar">
              {negativeBehaviors.map((b, idx) => (
                  <button 
                    key={idx} 
                    className="py-3 px-2 bg-rose-50 dark:bg-rose-500/10 rounded-xl font-bold text-xs text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-500/20 active:scale-95 transition-all border border-rose-100 dark:border-rose-500/20 flex flex-col items-center justify-center gap-1" 
                    onClick={() => handleAddBehavior(showNegativeReasons!.student, 'negative', b.name, b.points)}
                  >
                      <span>{b.name}</span>
                      <span className="text-[10px] opacity-70">{b.points}</span>
                  </button>
              ))}
          </div>

          <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="مخالفة أخرى..." 
                value={customReason} 
                onChange={e => setCustomReason(e.target.value)} 
                className="flex-1 p-3 bg-slate-50 dark:bg-white/5 rounded-xl text-sm font-bold border-none outline-none focus:ring-2 focus:ring-rose-500/50" 
              />
              <button 
                onClick={() => handleAddBehavior(showNegativeReasons!.student, 'negative', customReason || 'سلوك سلبي', -1)} 
                className="bg-rose-600 text-white p-3 rounded-xl font-bold shadow-lg shadow-rose-500/30 disabled:opacity-50 disabled:shadow-none"
                disabled={!customReason}
              >
                  <Plus className="w-5 h-5" />
              </button>
          </div>
      </Modal>

      {/* Random Picker & Notifications Modals Omitted for brevity but logic is same */}
      {/* Just keeping layout structure valid */}
      <Modal isOpen={!!isRandomPicking || !!randomStudent} onClose={() => { setRandomStudent(null); setIsRandomPicking(false); }} className="text-center">
          <div className="py-8 flex flex-col items-center">
              {isRandomPicking ? <Shuffle className="w-12 h-12 text-indigo-500 animate-spin" /> : randomStudent && (
                  <>
                    <div className="w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-black mb-4 overflow-hidden border-4 border-indigo-500">
                        {randomStudent.avatar ? <img src={randomStudent.avatar} alt={randomStudent.name} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-indigo-500 flex items-center justify-center">{randomStudent.name.charAt(0)}</div>}
                    </div>
                    <h2 className="text-xl font-black dark:text-white">{randomStudent.name}</h2>
                    <div className="flex gap-2 mt-6 w-full"><button onClick={() => { setShowPositiveReasons({student: randomStudent}); setRandomStudent(null); }} className="flex-1 bg-emerald-500 text-white py-3 rounded-xl font-bold">مكافأة</button><button onClick={pickRandomStudent} className="flex-1 bg-indigo-500 text-white py-3 rounded-xl font-bold">آخر</button></div>
                  </>
              )}
          </div>
      </Modal>

      <Modal isOpen={!!notificationTarget} onClose={() => setNotificationTarget(null)}>
          <h3 className="text-center font-black mb-4 dark:text-white">تنبيه تسرب</h3>
          <button onClick={() => performNotification('whatsapp')} className="w-full bg-[#25D366] text-white py-3 rounded-xl font-bold mb-2 flex items-center justify-center gap-2"><MessageCircle className="w-5 h-5"/> واتساب</button>
          <button onClick={() => performNotification('sms')} className="w-full bg-slate-100 text-slate-900 py-3 rounded-xl font-bold">SMS</button>
      </Modal>
    </div>
  );
};

export default StudentList;
