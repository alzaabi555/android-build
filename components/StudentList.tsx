import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Student, BehaviorType } from '../types';
import { Search, ThumbsUp, ThumbsDown, X, UserPlus, Edit2, FileSpreadsheet, Sparkles, Shuffle, Trash2, CheckCircle2, MessageCircle, Plus, UploadCloud, UserX, Image as ImageIcon, PhoneOff, AlertCircle, FileUp, User, Camera, Printer, Loader2, Star } from 'lucide-react';
import { Browser } from '@capacitor/browser';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from './Modal';
import { useTheme } from '../context/ThemeContext';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

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

const StudentItem = React.memo(({ student, theme, onViewReport, onAction, styles, currentSemester }: { 
    student: Student, 
    theme: string, 
    onViewReport: (s: Student) => void,
    onAction: (s: Student, type: 'positive' | 'negative' | 'edit' | 'delete') => void,
    styles: any,
    currentSemester: '1' | '2'
}) => {
    // Calculate Grade Stats on the fly
    const totalScore = useMemo(() => {
        return (student.grades || [])
            .filter(g => !g.semester || g.semester === currentSemester)
            .reduce((sum, g) => sum + (Number(g.score) || 0), 0);
    }, [student.grades, currentSemester]);

    const gradeSymbol = useMemo(() => {
        if (totalScore >= 90) return 'أ';
        if (totalScore >= 80) return 'ب';
        if (totalScore >= 65) return 'ج';
        if (totalScore >= 50) return 'د';
        return 'هـ';
    }, [totalScore]);

    const gradeColor = useMemo(() => {
        if (totalScore >= 90) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300';
        if (totalScore >= 80) return 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300';
        if (totalScore >= 65) return 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300';
        if (totalScore >= 50) return 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300';
        return 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300';
    }, [totalScore]);

    return (
        <div className={`group flex items-center justify-between p-3 transition-all duration-200 relative overflow-hidden ${styles.card} hover:bg-white/90 dark:hover:bg-white/10`}>
            <div className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer z-10" onClick={() => onViewReport(student)}>
                <div className={`w-12 h-12 flex items-center justify-center text-slate-700 dark:text-white/80 font-black text-lg shrink-0 overflow-hidden relative ${styles.avatar} bg-slate-100 dark:bg-white/5 shadow-sm border border-gray-100 dark:border-white/5`}>
                    {student.avatar ? (
                        <img src={student.avatar} alt={student.name} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                        student.name.charAt(0)
                    )}
                </div>
                
                <div className="min-w-0 flex flex-col justify-center flex-1 gap-1.5">
                    {/* Top Row: Name */}
                    <div className="flex items-center gap-2 w-full">
                        <h3 className="text-sm font-black text-slate-900 dark:text-white truncate leading-none">
                            {student.name}
                        </h3>
                        {!student.parentPhone && (
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" title="لا يوجد رقم ولي أمر" />
                        )}
                    </div>

                    {/* Bottom Row: Stats & Actions (Horizontal Layout) */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[9px] font-bold text-slate-500 dark:text-white/50 bg-slate-50 dark:bg-white/5 px-2 py-0.5 rounded-md border border-gray-100 dark:border-white/5`}>
                            {student.classes[0]}
                        </span>
                        
                        {/* Score Badge */}
                        <div className="flex items-center gap-1 bg-slate-50 dark:bg-white/5 px-2 py-0.5 rounded-md border border-gray-100 dark:border-white/5">
                            <span className="text-[9px] font-bold text-slate-400 dark:text-white/40">المجموع:</span>
                            <span className="text-[10px] font-black text-slate-700 dark:text-white">{totalScore}</span>
                        </div>

                        {/* Grade Symbol Badge */}
                        <div className={`px-2 py-0.5 rounded-md text-[10px] font-black ${gradeColor}`}>
                            {gradeSymbol}
                        </div>

                        <div className="w-px h-4 bg-gray-200 dark:bg-white/10 mx-2"></div>

                        {/* Quick Actions - IMPROVED UI FOR TOUCH SAFETY */}
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={(e) => { e.stopPropagation(); onAction(student, 'edit'); }} 
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-all active:scale-90"
                                title="تعديل"
                            >
                                <Edit2 className="w-4 h-4" strokeWidth={2.5} />
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); onAction(student, 'delete'); }} 
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all active:scale-90"
                                title="حذف"
                            >
                                <Trash2 className="w-4 h-4" strokeWidth={2.5} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2 z-10 shrink-0 ml-2 self-center border-r border-gray-100 dark:border-white/5 pr-3 mr-1">
                <button onClick={() => onAction(student, 'positive')} className="w-9 h-9 flex items-center justify-center transition-all active:scale-90 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 border border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 hover:shadow-sm">
                    <ThumbsUp className="w-4 h-4" strokeWidth={2.5} />
                </button>
                <button onClick={() => onAction(student, 'negative')} className="w-9 h-9 flex items-center justify-center transition-all active:scale-90 rounded-full bg-rose-50 dark:bg-rose-500/10 text-rose-600 border border-rose-200 dark:border-rose-500/20 hover:bg-rose-100 dark:hover:bg-rose-500/20 hover:shadow-sm">
                    <ThumbsDown className="w-4 h-4" strokeWidth={2.5} />
                </button>
            </div>
        </div>
    );
}, (prev, next) => prev.student === next.student && prev.theme === next.theme && prev.currentSemester === next.currentSemester);

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

  const [showNegativeReasons, setShowNegativeReasons] = useState<{student: Student} | null>(null);
  const [showPositiveReasons, setShowPositiveReasons] = useState<{student: Student} | null>(null);
  const [customReason, setCustomReason] = useState('');
  const [notificationTarget, setNotificationTarget] = useState<{student: Student, type: 'truancy'} | null>(null);
  const [randomStudent, setRandomStudent] = useState<Student | null>(null);
  const [isRandomPicking, setIsRandomPicking] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

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
      { name: 'تسرب', points: -5 },
      { name: 'سلوك غير لائق', points: -5 }
  ];

  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const styles = useMemo(() => {
      let cardStyle = '';
      let headerStyle = '';

      if (isLowPower) {
          cardStyle = 'bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-800 rounded-[1.2rem] mb-2 shadow-sm';
          headerStyle = 'bg-white dark:bg-[#0f172a] border-b border-gray-200 dark:border-gray-800';
      } else {
          cardStyle = 'bg-white/60 dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-[1.2rem] mb-2 shadow-sm backdrop-blur-sm';
          headerStyle = 'bg-slate-50/95 dark:bg-[#0f172a]/95 backdrop-blur-md border-b border-gray-200 dark:border-white/5 shadow-sm';
      }

      return {
          card: cardStyle,
          header: headerStyle,
          search: 'bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10',
          actionBtn: 'rounded-full',
          avatar: 'rounded-2xl',
          chipActive: 'bg-indigo-600 text-white shadow-md rounded-full',
          chip: 'bg-white dark:bg-white/5 text-slate-600 dark:text-white/60 rounded-full border border-gray-200 dark:border-white/10',
      };
  }, [theme, isLowPower]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesClass = selectedClass === 'all' || s.classes?.includes(selectedClass);
      return matchesSearch && matchesClass;
    });
  }, [students, searchTerm, selectedClass]);

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

  // --- CRASH FIX: Robust Excel Import Logic ---
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
          const data = await file.arrayBuffer();
          const workbook = XLSX.read(data, { type: 'array' });
          if (!workbook.SheetNames.length) throw new Error("Excel file is empty");
          
          const worksheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "", raw: false }) as any[];

          if (!Array.isArray(jsonData) || jsonData.length === 0) throw new Error('الملف فارغ أو التنسيق غير مدعوم');

          const headers = Object.keys(jsonData[0]);
          
          const cleanHeader = (header: string) => String(header).trim().replace(/[\u200B-\u200D\uFEFF]/g, '').toLowerCase();
          
          const nameKeywords = ['الاسم', 'اسم الطالب', 'name', 'student'];
          const phoneKeywords = ['جوال', 'هاتف', 'phone', 'mobile', 'ولي', 'contact'];
          const gradeKeywords = ['الصف', 'صف', 'grade', 'class', 'فصل'];

          let nameKey = headers.find(h => nameKeywords.some(kw => cleanHeader(h).includes(kw)));
          let phoneKey = headers.find(h => phoneKeywords.some(kw => cleanHeader(h).includes(kw)));
          let gradeKey = headers.find(h => gradeKeywords.some(kw => cleanHeader(h).includes(kw)));

          // CRITICAL FIX: If no name column found, use the first column blindly
          if (!nameKey) nameKey = headers[0]; 

          const cleanPhoneNumber = (raw: any): string => {
              if (!raw) return '';
              return String(raw).trim().replace(/[^0-9+]/g, '');
          };

          const mappedStudents: Student[] = jsonData
            .map((row): Student | null => {
              if (!row || typeof row !== 'object') return null;
              
              const studentName = String(row[nameKey!] || '').trim();
              if (!studentName || studentName.length < 2) return null;

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
              onBatchAddStudents(mappedStudents); 
              setShowSelectionModal(false); 
              alert(`تم استيراد ${mappedStudents.length} طالب بنجاح`);
          } else {
              alert('لم يتم العثور على بيانات صالحة في الملف');
          }

      } catch (error) {
          console.error("Excel Import Error:", error);
          alert('حدث خطأ أثناء قراءة الملف. تأكد من أن الملف سليم وغير تالف.');
      } finally {
          if (e.target) e.target.value = '';
      }
  };

  const pickRandomStudent = () => {
    if (filteredStudents.length === 0) return;
    setIsRandomPicking(true);
    // Initialize random student to start the modal immediately
    setRandomStudent(filteredStudents[Math.floor(Math.random() * filteredStudents.length)]);
    
    let counter = 0;
    const interval = setInterval(() => {
      setRandomStudent(filteredStudents[Math.floor(Math.random() * filteredStudents.length)]);
      counter++;
      if (counter > 15) { clearInterval(interval); setIsRandomPicking(false); }
    }, 100);
  };

  const performNotification = async (method: 'whatsapp' | 'sms') => {
      if(!notificationTarget || !notificationTarget.student.parentPhone) {
          alert('لا يوجد رقم هاتف مسجل');
          return;
      }
      
      const { student } = notificationTarget;
      
      // Clean phone number (Identical logic to AttendanceTracker for consistency)
      let cleanPhone = student.parentPhone.replace(/[^0-9]/g, '');
      
      if (!cleanPhone || cleanPhone.length < 5) {
          alert('رقم الهاتف غير صحيح أو قصير جداً');
          return;
      }
      
      if (cleanPhone.startsWith('00')) cleanPhone = cleanPhone.substring(2);
      
      if (cleanPhone.length === 8) {
          cleanPhone = '968' + cleanPhone;
      } else if (cleanPhone.length === 9 && cleanPhone.startsWith('0')) {
          cleanPhone = '968' + cleanPhone.substring(1);
      }

      const msg = encodeURIComponent(`السلام عليكم، نود إبلاغكم بأن الطالب ${student.name} قد تسرب من الحصة.`);
      
      if (method === 'whatsapp') {
          const appUrl = `whatsapp://send?phone=${cleanPhone}&text=${msg}`;
          const webUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${msg}`;
          
          if (Capacitor.isNativePlatform()) {
              try {
                  await Browser.open({ url: appUrl });
              } catch (e) {
                  await Browser.open({ url: webUrl });
              }
          } else {
              window.open(webUrl, '_blank');
          }
      } else {
          window.location.href = `sms:${cleanPhone}?body=${msg}`;
      }
      setNotificationTarget(null);
  };

  const handleExportExcel = async () => {
      if (filteredStudents.length === 0) return alert('لا يوجد طلاب');
      setIsExportingExcel(true);
      
      try {
          const data = filteredStudents.map(s => ({
              'الاسم': s.name, 
              'الصف': s.classes[0] || '', 
              'رقم الولي': s.parentPhone || '',
              'نقاط إيجابية': (s.behaviors || []).filter(b => b.type === 'positive').reduce((a,b) => a + b.points, 0),
              'نقاط سلبية': (s.behaviors || []).filter(b => b.type === 'negative').reduce((a,b) => a + Math.abs(b.points), 0),
          }));

          const ws = XLSX.utils.json_to_sheet(data);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, "الطلاب");
          
          const fileName = `Behavior_Summary_${selectedClass !== 'all' ? selectedClass : 'All'}.xlsx`;

          if (Capacitor.isNativePlatform()) {
              // iOS/Android Logic: Write to Cache then Share
              const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
              const result = await Filesystem.writeFile({
                  path: fileName,
                  data: wbout,
                  directory: Directory.Cache
              });
              
              await Share.share({
                  title: 'مشاركة ملخص السلوك',
                  text: 'ملخص سلوكيات الطلاب',
                  url: result.uri,
                  dialogTitle: 'مشاركة الملف'
              });
          } else {
              // Web Fallback
              XLSX.writeFile(wb, fileName);
          }
      } catch (e) {
          console.error("Export error", e);
          alert("حدث خطأ أثناء التصدير.");
      } finally {
          setIsExportingExcel(false);
      }
  };

  // --- PDF Generation for General Class Report ---
  const getBase64Image = async (url: string): Promise<string> => {
      try {
          const response = await fetch(url);
          if (!response.ok) return "";
          const blob = await response.blob();
          return new Promise((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => {
                  const result = reader.result as string;
                  if (result && result.startsWith('data:')) resolve(result);
                  else resolve("");
              };
              reader.onerror = () => resolve("");
              reader.readAsDataURL(blob);
          });
      } catch (error) { return ""; }
  };

  const exportPDF = async (element: HTMLElement, filename: string, setLoader: (val: boolean) => void) => {
    setLoader(true);
    const opt = {
        margin: 5,
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };

    if (typeof html2pdf !== 'undefined') {
        try {
            const worker = html2pdf().set(opt).from(element).toPdf();
            if (Capacitor.isNativePlatform()) {
                 const pdfBase64 = await worker.output('datauristring');
                 const base64Data = pdfBase64.split(',')[1];
                 const result = await Filesystem.writeFile({ path: filename, data: base64Data, directory: Directory.Cache });
                 await Share.share({ title: filename, url: result.uri, dialogTitle: 'مشاركة/حفظ' });
            } else {
                 const pdfBlob = await worker.output('blob');
                 const url = URL.createObjectURL(pdfBlob);
                 const link = document.createElement('a');
                 link.href = url; link.download = filename; link.target = "_blank";
                 document.body.appendChild(link); link.click();
                 setTimeout(() => { document.body.removeChild(link); URL.revokeObjectURL(url); }, 2000);
            }
        } catch (err) { console.error('PDF Error:', err); } finally { setLoader(false); }
    } else { alert('مكتبة PDF غير جاهزة'); setLoader(false); }
  };

  const handlePrintGeneralReport = async () => {
      if (filteredStudents.length === 0) {
          alert('لا يوجد طلاب لطباعة التقرير');
          return;
      }
      
      setIsGeneratingPdf(true);
      
      const teacherName = localStorage.getItem('teacherName') || '................';
      const schoolName = localStorage.getItem('schoolName') || '................';
      const subjectName = localStorage.getItem('subjectName') || '................';
      
      let emblemSrc = await getBase64Image('oman_logo.png') || await getBase64Image('icon.png');

      const rows = filteredStudents.map((s, i) => {
          // Calculate Stats
          const absentCount = (s.attendance || []).filter(a => a.status === 'absent').length;
          
          const posBehaviors = (s.behaviors || []).filter(b => b.type === 'positive');
          const negBehaviors = (s.behaviors || []).filter(b => b.type === 'negative');

          const positivePoints = posBehaviors.reduce((sum, b) => sum + b.points, 0);
          const negativePoints = negBehaviors.reduce((sum, b) => sum + Math.abs(b.points), 0);
          
          // Generate Summary Strings
          const getBehaviorSummary = (behaviors: typeof posBehaviors) => {
              if (behaviors.length === 0) return '';
              const counts: Record<string, number> = {};
              behaviors.forEach(b => {
                  const desc = b.description.split('(')[0].trim(); // Remove group names if any
                  counts[desc] = (counts[desc] || 0) + 1;
              });
              return Object.entries(counts)
                  .map(([name, count]) => `${name}: ${count}`)
                  .join('، ');
          };

          const posDetails = getBehaviorSummary(posBehaviors);
          const negDetails = getBehaviorSummary(negBehaviors);

          const totalGrade = (s.grades || []).reduce((sum, g) => sum + (Number(g.score) || 0), 0);
          
          let level = 'متوسط';
          if (totalGrade >= 90) level = 'متاز';
          else if (totalGrade >= 80) level = 'جيد جداً';
          else if (totalGrade >= 65) level = 'جيد';
          else if (totalGrade < 50) level = 'ضعيف';

          // Force Styles for PDF visibility
          const cellStyle = "border: 1px solid #000000 !important; padding: 8px; text-align: center; color: #000000 !important;";
          const nameCellStyle = "border: 1px solid #000000 !important; padding: 8px; text-align: right; width: 20%; color: #000000 !important;";

          return `
            <tr>
                <td style="${cellStyle}">${i + 1}</td>
                <td style="${nameCellStyle}">${s.name}</td>
                <td style="${cellStyle}; font-weight: bold; color: ${absentCount > 3 ? '#ef4444' : '#000000'} !important;">${absentCount} أيام</td>
                
                <td style="${cellStyle}; vertical-align: top;">
                    <div style="font-weight: bold; font-size: 14px; color: #16a34a !important; margin-bottom: 4px;">${positivePoints}</div>
                    <div style="font-size: 9px; color: #555555 !important; line-height: 1.2;">${posDetails}</div>
                </td>
                
                <td style="${cellStyle}; vertical-align: top;">
                    <div style="font-weight: bold; font-size: 14px; color: #dc2626 !important; margin-bottom: 4px;">${negativePoints}</div>
                    <div style="font-size: 9px; color: #555555 !important; line-height: 1.2;">${negDetails}</div>
                </td>

                <td style="${cellStyle}; font-weight: bold;">${totalGrade}</td>
                <td style="${cellStyle}">${level}</td>
            </tr>
          `;
      }).join('');

      const element = document.createElement('div');
      element.setAttribute('dir', 'rtl');
      element.style.fontFamily = 'Tajawal, sans-serif';
      element.style.padding = '20px';
      element.style.backgroundColor = '#ffffff'; // Force white background
      element.style.color = '#000000'; // Force black text

      const headerStyle = "border: 1px solid #000000 !important; padding: 10px; color: #000000 !important; font-weight: bold;";

      element.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px; color: #000000 !important;">
            ${emblemSrc ? `<img src="${emblemSrc}" style="height: 60px; margin-bottom: 10px;" />` : ''}
            <h2 style="margin: 0; font-size: 22px; font-weight: 800; color: #000000 !important;">تقرير الأداء الشامل للصف (تفصيلي)</h2>
            <div style="display: flex; justify-content: space-between; margin-top: 20px; font-weight: bold; border-bottom: 2px solid #000000; padding-bottom: 10px; color: #000000 !important;">
                <span>المدرسة: ${schoolName}</span>
                <span>المعلم: ${teacherName}</span>
                <span>المادة: ${subjectName}</span>
                <span>الصف: ${selectedClass === 'all' ? 'جميع الفصول' : selectedClass}</span>
            </div>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; font-size: 12px; table-layout: fixed; border: 1px solid #000000 !important;">
            <thead>
                <tr style="background-color: #f3f4f6 !important; color: #000000 !important;">
                    <th style="${headerStyle}; width: 30px;">#</th>
                    <th style="${headerStyle}; text-align: right; width: 15%;">اسم الطالب</th>
                    <th style="${headerStyle}; width: 8%;">الغياب</th>
                    <th style="${headerStyle}; width: 25%;">سلوك إيجابي</th>
                    <th style="${headerStyle}; width: 25%;">سلوك سلبي</th>
                    <th style="${headerStyle}; width: 8%;">المجموع</th>
                    <th style="${headerStyle}; width: 8%;">التقدير</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
        </table>
        
        <div style="margin-top: 40px; display: flex; justify-content: space-between; padding: 0 50px; color: #000000 !important;">
            <div style="text-align: center;">
                <p style="font-weight: bold; margin-bottom: 40px;">توقيع المعلم</p>
                <p>......................</p>
            </div>
            <div style="text-align: center;">
                <p style="font-weight: bold; margin-bottom: 40px;">مدير المدرسة</p>
                <p>......................</p>
            </div>
        </div>
      `;

      exportPDF(element, `تقرير_شامل_تفصيلي_${selectedClass}.pdf`, setIsGeneratingPdf);
  };

  return (
    <div className="min-h-full text-slate-900 dark:text-white -mt-4 -mx-4 flex flex-col h-[calc(100vh-60px)]">
      {/* 
          === STICKY FULL WIDTH HEADER === 
          Attached to top, no gap, with blur effect
      */}
      <div className={`sticky top-0 z-40 px-4 pt-1 pb-2 transition-all shrink-0 ${styles.header}`}>
          <div className="flex justify-between items-end mb-2 pt-1">
              <div>
                  <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">الطلاب</h1>
                  <p className="text-xs text-slate-500 dark:text-white/50 font-bold mt-0.5">{filteredStudents.length} طالب</p>
              </div>
              <div className="flex gap-2">
                  <button onClick={pickRandomStudent} className={`w-9 h-9 flex items-center justify-center transition-all bg-indigo-50 dark:bg-white/10 rounded-full text-indigo-600 dark:text-indigo-300 border border-indigo-100 dark:border-white/5`}><Sparkles className="w-4 h-4" /></button>
                  
                  {/* General Report Button */}
                  <button onClick={handlePrintGeneralReport} disabled={isGeneratingPdf} className={`w-9 h-9 flex items-center justify-center transition-all bg-amber-50 dark:bg-white/10 rounded-full text-amber-600 dark:text-amber-300 border border-amber-100 dark:border-white/5`} title="طباعة تقرير شامل للصف">
                      {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin"/> : <Printer className="w-4 h-4" />}
                  </button>

                  <button onClick={handleExportExcel} disabled={isExportingExcel} className={`w-9 h-9 flex items-center justify-center transition-all bg-blue-50 dark:bg-white/10 rounded-full text-blue-600 dark:text-blue-300 border border-blue-100 dark:border-white/5`}>
                      {isExportingExcel ? <Loader2 className="w-4 h-4 animate-spin"/> : <FileSpreadsheet className="w-4 h-4" />}
                  </button>
                  
                  <button onClick={onSwitchToImport} className={`w-9 h-9 flex items-center justify-center transition-all bg-emerald-50 dark:bg-white/10 rounded-full text-emerald-600 dark:text-emerald-300 border border-emerald-100 dark:border-white/5`}><UploadCloud className="w-4 h-4" /></button>
                  
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

      {/* 
          === SCROLLABLE LIST AREA === 
          Scrolls underneath the sticky header
      */}
      <div className="px-4 pb-32 pt-2 overflow-y-auto flex-1 custom-scrollbar">
          {filteredStudents.length > 0 ? (
              filteredStudents.map((student, index) => (
                  <div key={student.id} className={!isLowPower && index < 10 ? "animate-in fade-in slide-in-from-bottom-2 duration-300" : ""}>
                      <StudentItem 
                        student={student} 
                        theme={theme} 
                        onViewReport={onViewReport} 
                        onAction={handleAction}
                        styles={styles}
                        currentSemester={currentSemester}
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

      <Modal isOpen={showSelectionModal} onClose={() => setShowSelectionModal(false)} className="rounded-[2rem] max-w-sm">
          <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-lg text-slate-900 dark:text-white">إضافة طلاب</h3>
              <button onClick={() => setShowSelectionModal(false)} className="p-2 bg-gray-100 dark:bg-white/10 rounded-full hover:bg-gray-200"><X className="w-5 h-5"/></button>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => { setShowSelectionModal(false); setEditingStudent(null); setEditName(''); setEditPhone(''); setEditClass(''); setEditAvatar(''); setShowManualAddModal(true); }}
                className="flex flex-col items-center justify-center p-6 bg-indigo-50 dark:bg-indigo-500/10 border-2 border-indigo-100 dark:border-indigo-500/20 rounded-3xl hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all active:scale-95 group"
              >
                  <div className="w-14 h-14 bg-indigo-500 text-white rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-indigo-500/30 group-hover:scale-110 transition-transform">
                      <User className="w-7 h-7" />
                  </div>
                  <span className="font-black text-slate-800 dark:text-white text-sm">تسجيل فردي</span>
              </button>

              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center p-6 bg-emerald-50 dark:bg-emerald-500/10 border-2 border-emerald-100 dark:border-emerald-500/20 rounded-3xl hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all active:scale-95 group"
              >
                  <div className="w-14 h-14 bg-emerald-500 text-white rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
                      <FileUp className="w-7 h-7" />
                  </div>
                  <span className="font-black text-slate-800 dark:text-white text-sm">استيراد Excel</span>
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

      <Modal isOpen={showManualAddModal} onClose={() => setShowManualAddModal(false)}>
          <h3 className="font-black text-lg mb-4 text-slate-900 dark:text-white">{editingStudent ? 'تعديل بيانات الطالب' : 'تسجيل طالب جديد'}</h3>
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

      {/* Random Student Modal */}
      <Modal isOpen={!!randomStudent || isRandomPicking} onClose={() => { setRandomStudent(null); setIsRandomPicking(false); }} className="max-w-sm rounded-[2.5rem]">
          <div className="flex flex-col items-center justify-center p-6 text-center">
              <div className={`w-20 h-20 mb-4 rounded-full flex items-center justify-center text-3xl font-black shadow-xl transition-all duration-100 ${isRandomPicking ? 'scale-110 bg-indigo-100 text-indigo-600' : 'bg-emerald-500 text-white scale-100'}`}>
                  {randomStudent?.avatar ? (
                      <img src={randomStudent.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                  ) : (
                      randomStudent?.name.charAt(0) || '?'
                  )}
              </div>
              
              <h2 className={`text-2xl font-black mb-2 transition-colors ${isRandomPicking ? 'text-indigo-400' : 'text-slate-900 dark:text-white'}`}>
                  {randomStudent?.name || 'جارِ الاختيار...'}
              </h2>
              
              <p className={`text-sm font-bold mb-6 ${isRandomPicking ? 'text-indigo-300' : 'text-emerald-500'}`}>
                  {isRandomPicking ? 'جاري السحب...' : '✨ تم الاختيار!'}
              </p>

              {!isRandomPicking && (
                  <div className="flex gap-2 w-full">
                      <button onClick={() => { setRandomStudent(null); pickRandomStudent(); }} className="flex-1 py-3 bg-gray-100 dark:bg-white/10 rounded-xl font-bold text-xs text-slate-600 dark:text-white hover:bg-gray-200">
                          اختيار آخر <Shuffle className="w-3 h-3 inline mr-1"/>
                      </button>
                      <button onClick={() => handleAction(randomStudent!, 'positive')} className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-emerald-500/30">
                          تعزيز <ThumbsUp className="w-3 h-3 inline mr-1"/>
                      </button>
                  </div>
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