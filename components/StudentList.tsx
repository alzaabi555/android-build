import React, { useState, useEffect, useRef } from 'react';
import { Student, BehaviorType } from '../types';
import { Search, ThumbsUp, ThumbsDown, FileBarChart, X, UserPlus, Filter, Edit, FileSpreadsheet, GraduationCap, ChevronRight, Clock, Download, MessageCircle, Smartphone, Loader2, Sparkles, Shuffle } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

// تعريف html2pdf لتجنب أخطاء TypeScript
declare var html2pdf: any;

interface StudentListProps {
  students: Student[];
  classes: string[];
  onAddClass: (name: string) => void;
  onAddStudentManually: (name: string, className: string, phone?: string) => void;
  onUpdateStudent: (s: Student) => void;
  onViewReport: (s: Student) => void;
  onSwitchToImport: () => void;
  currentSemester: '1' | '2';
  onSemesterChange: (sem: '1' | '2') => void;
}

const StudentList: React.FC<StudentListProps> = ({ students, classes, onAddClass, onAddStudentManually, onUpdateStudent, onViewReport, onSwitchToImport, currentSemester, onSemesterChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [showLogModal, setShowLogModal] = useState<{ student: Student; type: BehaviorType } | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('1'); 
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  
  const [showContactChoice, setShowContactChoice] = useState<{student: Student, message: string} | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  
  // Random Picker State
  const [showRandomPicker, setShowRandomPicker] = useState(false);
  const [randomStudent, setRandomStudent] = useState<Student | null>(null);
  const [isShuffling, setIsShuffling] = useState(false);
  
  const [studentNameInput, setStudentNameInput] = useState('');
  const [studentClassInput, setStudentClassInput] = useState('');
  const [studentPhoneInput, setStudentPhoneInput] = useState('');
  const [logDesc, setLogDesc] = useState('');

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = selectedClass === 'all' || (s.classes && s.classes.includes(selectedClass));
    return matchesSearch && matchesClass;
  });

  const getStudentGradeStats = (student: Student) => {
      // تصفية الدرجات حسب الفصل الدراسي الحالي للعرض في القائمة
      const grades = (student.grades || []).filter(g => !g.semester || g.semester === currentSemester);
      const earned = grades.reduce((a, b) => a + (Number(b.score) || 0), 0);
      const total = grades.reduce((a, b) => a + (Number(b.maxScore) || 0), 0);
      return { earned, total };
  };

  const getBase64Image = async (url: string): Promise<string> => {
      try {
          const response = await fetch(url);
          if (!response.ok) return ""; 
          
          const blob = await response.blob();
          return new Promise((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => {
                  const result = reader.result as string;
                  if (result && result.startsWith('data:')) {
                      resolve(result);
                  } else {
                      resolve("");
                  }
              };
              reader.onerror = () => resolve("");
              reader.readAsDataURL(blob);
          });
      } catch (error) {
          console.warn("Failed to load image:", url);
          return "";
      }
  };

  const openCreateModal = () => {
    setModalMode('create');
    setStudentNameInput('');
    setStudentClassInput('');
    setStudentPhoneInput('');
    setEditingStudentId(null);
    setShowStudentModal(true);
  };

  const openEditModal = (student: Student) => {
    setModalMode('edit');
    setStudentNameInput(student.name);
    setStudentClassInput(student.classes[0] || '');
    setStudentPhoneInput(student.parentPhone || '');
    setEditingStudentId(student.id);
    setShowStudentModal(true);
  };

  // --- Random Picker Logic ---
  const handleRandomPick = () => {
      if (filteredStudents.length === 0) return;
      setIsShuffling(true);
      setShowRandomPicker(true);
      setRandomStudent(null);

      let counter = 0;
      const maxIterations = 20;
      const interval = setInterval(() => {
          const randomIndex = Math.floor(Math.random() * filteredStudents.length);
          setRandomStudent(filteredStudents[randomIndex]);
          counter++;
          if (counter >= maxIterations) {
              clearInterval(interval);
              setIsShuffling(false);
          }
      }, 100);
  };

  const handleSaveStudent = () => {
    if (studentNameInput.trim() && studentClassInput.trim()) {
      if (modalMode === 'create') {
        onAddStudentManually(studentNameInput.trim(), studentClassInput.trim(), studentPhoneInput.trim());
      } else if (modalMode === 'edit' && editingStudentId) {
        const studentToUpdate = students.find(s => s.id === editingStudentId);
        if (studentToUpdate) {
            onUpdateStudent({
                ...studentToUpdate,
                name: studentNameInput.trim(),
                classes: [studentClassInput.trim()],
                parentPhone: studentPhoneInput.trim()
            });
        }
      }
      setShowStudentModal(false);
    } else {
      alert('يرجى إكمال جميع البيانات الأساسية');
    }
  };

  const handleAddBehavior = (desc?: string) => {
    if (!showLogModal) return;
    const finalDesc = desc || logDesc;
    if (!finalDesc.trim()) return;

    let behaviorText = finalDesc;
    if (finalDesc === 'التسرب من الحصص') {
        behaviorText = `${finalDesc} (الحصة ${selectedPeriod})`;
    }

    const newBehavior = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      type: showLogModal.type,
      description: behaviorText,
      points: showLogModal.type === 'positive' ? 1 : -1,
      semester: currentSemester // إضافة الفصل الدراسي للسلوك
    };

    onUpdateStudent({
      ...showLogModal.student,
      behaviors: [newBehavior, ...(showLogModal.student.behaviors || [])]
    });

    if (finalDesc === 'التسرب من الحصص' && showLogModal.student.parentPhone) {
         const msg = `السلام عليكم، نود إبلاغكم بأن الطالب ${showLogModal.student.name} قد تسرب من الحصة الدراسية (${selectedPeriod}) اليوم. يرجى المتابعة.`;
         setShowContactChoice({ student: showLogModal.student, message: msg });
    }

    setShowLogModal(null);
    setLogDesc('');
    setSelectedPeriod('1');
  };

  const handleSendNotification = (method: 'whatsapp' | 'sms') => {
      if (!showContactChoice) return;
      const { student, message } = showContactChoice;
      
      // تنظيف الرقم وإعداده للصيغة الدولية العمانية
      let cleanPhone = student.parentPhone!.replace(/[^0-9]/g, '');
      
      // إزالة الصفرين في البداية إذا وجدا
      if (cleanPhone.startsWith('00')) cleanPhone = cleanPhone.substring(2);
      
      // إذا كان الرقم 8 خانات (رقم محلي عماني)، أضف المفتاح الدولي 968
      if (cleanPhone.length === 8) {
          cleanPhone = '968' + cleanPhone;
      }
      // إذا كان الرقم يبدأ بـ 0 (مثل 09xxxxxxx)، أزل الصفر وأضف 968
      else if (cleanPhone.startsWith('0')) {
          cleanPhone = '968' + cleanPhone.substring(1);
      }

      const encodedMsg = encodeURIComponent(message);
      
      if (method === 'whatsapp') {
          // استخدام api.whatsapp.com و _system لضمان فتح التطبيق الأصلي في جميع البيئات
          window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMsg}`, '_system');
      } else {
          window.open(`sms:${cleanPhone}?&body=${encodedMsg}`, '_system');
      }
      setShowContactChoice(null);
  };

  // --- تقرير الفصل التفصيلي ---
  const handleSaveClassReport = async () => {
    if (filteredStudents.length === 0) {
        alert('لا يوجد طلاب لتوليد التقرير');
        return;
    }
    
    setIsGeneratingPdf(true);

    let emblemSrc = '';
    try {
        emblemSrc = await getBase64Image('National_emblem_of_Oman.svg');
        if (!emblemSrc) {
            emblemSrc = await getBase64Image('icon.png');
        }
    } catch (e) {
        console.warn('Failed to load logo', e);
    }

    const element = document.createElement('div');
    element.setAttribute('dir', 'rtl');
    element.style.fontFamily = 'Tajawal, sans-serif';
    element.style.padding = '20px';
    element.style.color = '#000';

    const reportTitle = selectedClass === 'all' ? 'تقرير جميع الطلاب' : `تقرير الصف ${selectedClass}`;
    const dateStr = new Date().toLocaleDateString('ar-EG');
    const semName = currentSemester === '1' ? 'الفصل الدراسي الأول' : 'الفصل الدراسي الثاني';
    const schoolName = localStorage.getItem('schoolName') || '';

    let htmlContent = `
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #333; padding-bottom: 15px; margin-bottom: 20px;">
          <div style="text-align: right;">
             <p style="margin: 0; font-size: 12px;">سلطنة عمان</p>
             <p style="margin: 0; font-size: 12px;">وزارة التربية والتعليم</p>
             <p style="margin: 0; font-size: 12px;">مدرسة ${schoolName}</p>
          </div>
          
          <div style="text-align: center;">
              ${emblemSrc ? `<img src="${emblemSrc}" style="height: 60px; width: auto;" />` : ''}
          </div>

          <div style="text-align: left;">
              <p style="margin: 0; font-size: 12px;">التاريخ: <span dir="ltr">${dateStr}</span></p>
          </div>
        </div>

        <div style="text-align: center; margin-bottom: 20px;">
           <h1 style="margin: 0; font-size: 20px; font-weight: bold;">${reportTitle}</h1>
           <h2 style="margin: 5px 0 0; font-size: 16px; color: #555;">${semName}</h2>
        </div>
    `;

    filteredStudents.forEach(student => {
        // تصفية البيانات حسب الفصل المختار للتقرير
        // التأكد من أن التصفية صحيحة وتأخذ القيم الفارغة كفصل أول افتراضياً
        const relevantGrades = (student.grades || []).filter(g => {
            if (!g.semester) return currentSemester === '1'; // إذا لم يحدد الفصل، نعتبره الأول
            return g.semester === currentSemester;
        });

        const relevantBehaviors = (student.behaviors || []).filter(b => {
             if (!b.semester) return currentSemester === '1';
             return b.semester === currentSemester;
        });
        
        const earned = relevantGrades.reduce((a, b) => a + (Number(b.score) || 0), 0);
        const total = relevantGrades.reduce((a, b) => a + (Number(b.maxScore) || 0), 0);
        
        const posPoints = relevantBehaviors.filter(b => b.type === 'positive').reduce((a, b) => a + b.points, 0);
        const negPoints = relevantBehaviors.filter(b => b.type === 'negative').reduce((a, b) => a + Math.abs(b.points), 0);
        
        const gradesRows = relevantGrades.map(g => `
            <tr>
                <td style="border:1px solid #ddd; padding:4px; font-size:10px;">${g.category}</td>
                <td style="border:1px solid #ddd; padding:4px; font-size:10px; text-align:center;">${g.score} / ${g.maxScore}</td>
            </tr>
        `).join('');

        const behaviorItems = relevantBehaviors.map(b => `
            <span style="display:inline-block; font-size:9px; padding:2px 5px; margin:2px; border-radius:4px; background:${b.type === 'positive' ? '#d1fae5' : '#fee2e2'}; color:${b.type === 'positive' ? '#065f46' : '#991b1b'};">
                ${b.description}
            </span>
        `).join('');

        htmlContent += `
        <div style="border: 1px solid #000; padding: 10px; border-radius: 8px; margin-bottom: 15px; page-break-inside: avoid; background: #fff;">
           <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 8px;">
              <h3 style="margin:0; font-size:14px; font-weight: bold;">${student.name}</h3>
              <div style="font-size:12px; font-weight:bold;">المجموع  ${earned} من ${total} | سلوك  <span style="color:green">+${posPoints}</span> - <span style="color:red">-${negPoints}</span></div>
           </div>
           
           <div style="display:flex; gap:10px;">
               <div style="flex:1;">
                   <h4 style="margin:0 0 5px 0; font-size:11px; text-decoration:underline;">الدرجات </h4>
                   ${relevantGrades.length > 0 ? `<table style="width:100%; border-collapse:collapse;">${gradesRows}</table>` : '<p style="font-size:10px; color:#999;">لا توجد درجات مسجلة لهذا الفصل</p>'}
               </div>
               <div style="flex:1;">
                   <h4 style="margin:0 0 5px 0; font-size:11px; text-decoration:underline;">السلوكيات </h4>
                   <div>${relevantBehaviors.length > 0 ? behaviorItems : '<p style="font-size:10px; color:#999;">سجل نظيف</p>'}</div>
               </div>
           </div>
        </div>
        `;
    });

    element.innerHTML = htmlContent;

    const filename = `تقرير_شامل_${selectedClass}_${semName}.pdf`;
    const opt = {
        margin: [10, 10, 10, 10],
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true, scrollY: 0 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    if (typeof html2pdf !== 'undefined') {
        try {
            const worker = html2pdf().set(opt).from(element).toPdf();
            
            if (Capacitor.isNativePlatform()) {
                 const pdfBase64 = await worker.output('datauristring');
                 const base64Data = pdfBase64.split(',')[1];
                 
                 const result = await Filesystem.writeFile({
                    path: filename,
                    data: base64Data,
                    directory: Directory.Cache,
                 });
                 
                 await Share.share({
                    title: 'مشاركة التقرير',
                    text: `تقرير شامل للصف ${selectedClass}`,
                    url: result.uri,
                    dialogTitle: 'حفظ التقرير PDF'
                 });
            } else {
                 const pdfBlob = await worker.output('blob');
                 const url = URL.createObjectURL(pdfBlob);
                 const link = document.createElement('a');
                 link.href = url;
                 link.download = filename; 
                 link.target = "_blank";
                 document.body.appendChild(link);
                 link.click();
                 
                 setTimeout(() => {
                     document.body.removeChild(link);
                     URL.revokeObjectURL(url);
                 }, 2000);
            }

        } catch (err) {
            console.error(err);
        } finally {
            setIsGeneratingPdf(false);
        }
    } else {
        alert('مكتبة PDF غير متوفرة');
        setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="space-y-4 overflow-x-hidden">
      
      {/* Semester Toggle & Search Header */}
      <div className="flex flex-col gap-3 sticky top-0 bg-[#f2f2f7]/95 backdrop-blur-xl md:bg-transparent md:backdrop-blur-none pt-2 pb-2 z-10 transition-all shadow-sm md:shadow-none px-1">
        
        {/* Semester Buttons */}
        <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
             <button 
                onClick={() => onSemesterChange('1')} 
                className={`flex-1 py-2 rounded-lg text-[10px] font-black transition-all ${currentSemester === '1' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}
             >
                الفصل الأول
             </button>
             <button 
                onClick={() => onSemesterChange('2')} 
                className={`flex-1 py-2 rounded-lg text-[10px] font-black transition-all ${currentSemester === '2' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}
             >
                الفصل الثاني
             </button>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1 group">
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            </div>
            <input 
                type="text" 
                placeholder="ابحث عن طالب..." 
                className="w-full bg-white border-none rounded-xl py-2.5 pr-9 pl-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all text-sm font-bold text-gray-800 placeholder:text-gray-500 shadow-sm border border-gray-100" 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
          <button 
            onClick={handleRandomPick}
            className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl shadow-sm active:scale-95 flex items-center justify-center transition-all border border-amber-200 hover:bg-amber-200" 
            title="القرعة العشوائية"
          >
             <Sparkles className="w-5 h-5" />
          </button>
          <button 
            onClick={handleSaveClassReport} 
            disabled={isGeneratingPdf}
            className="w-10 h-10 bg-white text-gray-700 rounded-xl shadow-sm active:scale-95 flex items-center justify-center transition-all border border-gray-200 hover:bg-gray-50 disabled:opacity-50" 
            title="تقرير الفصل الشامل"
          >
             {isGeneratingPdf ? <Loader2 className="w-5 h-5 animate-spin text-blue-600" /> : <Download className="w-5 h-5" />}
          </button>
          <button onClick={onSwitchToImport} className="w-10 h-10 bg-white text-emerald-600 rounded-xl shadow-sm active:scale-95 flex items-center justify-center transition-all border border-gray-200 hover:bg-gray-50" title="استيراد إكسل">
             <FileSpreadsheet className="w-5 h-5" />
          </button>
          <button onClick={openCreateModal} className="w-10 h-10 bg-blue-600 text-white rounded-xl shadow-md shadow-blue-200 active:scale-95 flex items-center justify-center transition-all hover:bg-blue-700">
             <UserPlus className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 px-1">
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-gray-200 text-gray-500 shrink-0 border border-gray-300"><Filter className="w-3.5 h-3.5" /></div>
          <button onClick={() => setSelectedClass('all')} className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all border ${selectedClass === 'all' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200'}`}>الكل</button>
          {classes.map(cls => (
            <button key={cls} onClick={() => setSelectedClass(cls)} className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all border ${selectedClass === cls ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white text-gray-600 border-gray-200'}`}>{cls}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 pb-24 md:pb-8">
        {filteredStudents.length > 0 ? filteredStudents.map((student, idx) => {
          const stats = getStudentGradeStats(student);
          return (
            <div key={student.id} className="bg-white rounded-2xl p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)] border border-gray-100 flex flex-col gap-4 active:scale-[0.99] transition-transform duration-200 relative overflow-hidden hover:shadow-md">
              <div className="flex justify-between items-start w-full relative">
                <div className="flex items-center gap-3.5 flex-1 min-w-0 pr-8">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-black text-lg shadow-sm shrink-0 ${idx % 3 === 0 ? 'bg-gradient-to-b from-blue-400 to-blue-600' : idx % 3 === 1 ? 'bg-gradient-to-b from-indigo-400 to-indigo-600' : 'bg-gradient-to-b from-violet-400 to-violet-600'}`}>{student.name.charAt(0)}</div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-gray-900 text-[15px] md:text-xs truncate leading-tight mb-1 w-full" title={student.name}>{student.name}</h4>
                    <div className="flex flex-wrap gap-1">
                      <span className="text-[10px] text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded text-center min-w-[30px]">{student.classes[0]}</span>
                      {stats.total > 0 && (
                          <span className="text-[10px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
                              {stats.earned}/{stats.total}
                          </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <button onClick={() => openEditModal(student)} className="absolute top-0 left-0 w-8 h-8 flex items-center justify-center bg-gray-50 rounded-full text-gray-400 hover:bg-gray-100 active:bg-gray-200 z-10 shrink-0">
                    <Edit className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex gap-2 mt-1">
                <button onClick={() => setShowLogModal({ student, type: 'positive' })} className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 py-3 rounded-xl text-[11px] font-bold active:bg-emerald-200 transition-colors"><ThumbsUp className="w-3.5 h-3.5" /> سلوك إيجابي</button>
                <button onClick={() => setShowLogModal({ student, type: 'negative' })} className="flex-1 flex items-center justify-center gap-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 py-3 rounded-xl text-[11px] font-bold active:bg-rose-200 transition-colors"><ThumbsDown className="w-3.5 h-3.5" /> سلوك سلبي</button>
                <button onClick={() => onViewReport(student)} className="w-10 bg-gray-50 text-gray-500 rounded-xl flex items-center justify-center active:bg-gray-200 hover:bg-gray-100"><ChevronRight className="w-5 h-5"/></button>
              </div>
            </div>
          );
        }) : (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-300">
                <Search className="w-12 h-12 mb-2 opacity-50" />
                <p className="text-sm font-bold text-gray-400">لا يوجد نتائج للبحث</p>
                <div className="mt-4 flex gap-3">
                   <button onClick={onSwitchToImport} className="text-xs text-emerald-600 font-bold bg-emerald-50 px-4 py-2 rounded-full">استيراد ملف</button>
                   <button onClick={openCreateModal} className="text-xs text-blue-600 font-bold bg-blue-50 px-4 py-2 rounded-full">إضافة طالب</button>
                </div>
            </div>
        )}
      </div>

      {/* Random Picker Modal */}
      {showRandomPicker && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[250] flex items-center justify-center p-6 animate-in fade-in duration-300" onClick={() => setShowRandomPicker(false)}>
              <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl flex flex-col items-center text-center relative overflow-hidden" onClick={e => e.stopPropagation()}>
                  
                  {/* Decorative Elements */}
                  <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-amber-50 to-transparent pointer-events-none"></div>
                  <Sparkles className="absolute top-6 right-6 w-8 h-8 text-amber-300 animate-pulse" />
                  <Sparkles className="absolute bottom-6 left-6 w-6 h-6 text-amber-300 animate-pulse delay-75" />

                  <div className="w-20 h-20 bg-amber-100 rounded-3xl flex items-center justify-center mb-6 shadow-lg shadow-amber-100 relative z-10">
                      <Shuffle className={`w-10 h-10 text-amber-600 ${isShuffling ? 'animate-spin' : ''}`} />
                  </div>

                  <h3 className="text-xl font-black text-gray-900 mb-2 relative z-10">القرعة العشوائية</h3>
                  <p className="text-xs font-bold text-gray-400 mb-8 relative z-10">اختر طالباً للمشاركة في الحصة</p>

                  <div className="w-full bg-gray-50 rounded-2xl p-6 min-h-[120px] flex items-center justify-center border-2 border-dashed border-gray-200 mb-6 relative z-10">
                      {randomStudent ? (
                          <div className="animate-in zoom-in duration-300">
                              <h2 className="text-2xl font-black text-blue-600 leading-tight">{randomStudent.name}</h2>
                              <p className="text-xs font-bold text-gray-400 mt-2">{randomStudent.classes[0]}</p>
                          </div>
                      ) : (
                          <p className="text-gray-300 text-sm font-bold">اضغط ابدأ للاختيار...</p>
                      )}
                  </div>

                  <button 
                    onClick={handleRandomPick} 
                    disabled={isShuffling}
                    className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-amber-200 active:scale-95 transition-all relative z-10 disabled:opacity-70 disabled:scale-100"
                  >
                     {isShuffling ? 'جاري الاختيار...' : 'ابدأ القرعة مرة أخرى'}
                  </button>
                  
                  <button onClick={() => setShowRandomPicker(false)} className="mt-4 text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors relative z-10">
                      إغلاق
                  </button>
              </div>
          </div>
      )}

      {showStudentModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-end sm:items-center justify-center sm:p-6 animate-in fade-in duration-200" onClick={() => setShowStudentModal(false)}>
          <div className="bg-white w-full sm:max-w-sm rounded-t-[2rem] sm:rounded-[2rem] p-6 shadow-2xl animate-in slide-in-from-bottom duration-300 pb-safe" onClick={e => e.stopPropagation()}>
             <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6 sm:hidden" />
             <h3 className="text-xl font-black text-center mb-6 text-gray-900">{modalMode === 'create' ? 'إضافة طالب' : 'تعديل البيانات'}</h3>
             
             <div className="space-y-4 mb-8">
                <div className="space-y-1">
                   <label className="text-[11px] font-bold text-gray-500 mr-1">الاسم الكامل</label>
                   <input type="text" className="w-full bg-gray-50 rounded-xl py-3.5 px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-800" value={studentNameInput} onChange={e => setStudentNameInput(e.target.value)} />
                </div>
                <div className="space-y-1">
                   <label className="text-[11px] font-bold text-gray-500 mr-1">الفصل</label>
                   <select className="w-full bg-gray-50 rounded-xl py-3.5 px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-800 appearance-none" value={studentClassInput} onChange={e => setStudentClassInput(e.target.value)}>
                      <option value="">اختر الفصل</option>
                      {classes.map(c => <option key={c} value={c}>{c}</option>)}
                   </select>
                </div>
                <div className="space-y-1">
                   <label className="text-[11px] font-bold text-gray-500 mr-1">رقم ولي الأمر</label>
                   <input type="tel" className="w-full bg-gray-50 rounded-xl py-3.5 px-4 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-800 text-left dir-ltr" placeholder="968..." value={studentPhoneInput} onChange={e => setStudentPhoneInput(e.target.value)} />
                </div>
             </div>
             
             <div className="flex gap-3">
                <button onClick={() => setShowStudentModal(false)} className="flex-1 py-3.5 bg-gray-100 text-gray-600 rounded-xl font-bold text-sm">إلغاء</button>
                <button onClick={handleSaveStudent} className="flex-[2] py-3.5 bg-blue-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-200">حفظ</button>
             </div>
          </div>
        </div>
      )}

      {showLogModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] flex items-end sm:items-center justify-center sm:p-4 animate-in fade-in duration-200" onClick={() => setShowLogModal(null)}>
          <div className="bg-white w-full max-w-md rounded-t-[2rem] sm:rounded-[2rem] p-6 shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-300 pb-safe" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6 sm:hidden" />
            
            <div className="flex justify-between items-center mb-6">
              <div>
                  <h3 className="font-black text-lg text-gray-900">رصد سلوك ({currentSemester === '1' ? 'فصل 1' : 'فصل 2'})</h3>
                  <p className="text-xs text-gray-400 font-bold">{showLogModal.student.name}</p>
              </div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${showLogModal.type === 'positive' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                  {showLogModal.type === 'positive' ? <ThumbsUp className="w-5 h-5" /> : <ThumbsDown className="w-5 h-5" />}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
              {(showLogModal.type === 'positive' ? ['مشاركة متميزة', 'إنجاز الواجب', 'مساعدة زميل', 'نظافة وترتيب'] : ['تأخر عن الحصة', 'إزعاج مستمر', 'التسرب من الحصص', 'عدم حل الواجب']).map(d => (
                <button key={d} onClick={() => d === 'التسرب من الحصص' ? setLogDesc(d) : handleAddBehavior(d)} className={`text-right p-3.5 rounded-xl text-[11px] font-bold transition-all active:scale-95 border ${showLogModal.type === 'positive' ? 'bg-emerald-50 text-emerald-800 border-emerald-100 hover:bg-emerald-100' : (logDesc === d ? 'bg-rose-600 text-white border-rose-600' : 'bg-rose-50 text-rose-800 border-rose-100 hover:bg-rose-100')}`}>{d}</button>
              ))}
            </div>

            {logDesc === 'التسرب من الحصص' && showLogModal.type === 'negative' && (
                <div className="mb-4 bg-rose-50 p-3 rounded-xl border border-rose-100 animate-in fade-in slide-in-from-top-2">
                    <label className="text-[10px] font-black text-rose-800 mb-2 block flex items-center gap-1"><Clock className="w-3 h-3"/> اختر الحصة التي تسرب منها:</label>
                    <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                        {[1,2,3,4,5,6,7,8].map(p => (
                            <button 
                                key={p} 
                                onClick={() => setSelectedPeriod(p.toString())}
                                className={`w-8 h-8 rounded-lg text-xs font-black shrink-0 ${selectedPeriod === p.toString() ? 'bg-rose-600 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                </div>
            )}
            
            <div className="relative mb-4">
                <textarea className="w-full p-4 bg-gray-50 rounded-2xl h-24 text-sm font-medium outline-none border-none focus:ring-2 focus:ring-gray-200 resize-none" placeholder="اكتب ملاحظة..." value={logDesc} onChange={e => setLogDesc(e.target.value)} />
            </div>
            
            <button onClick={() => handleAddBehavior()} className={`w-full py-4 rounded-2xl font-black text-sm text-white transition-all active:scale-95 shadow-lg ${showLogModal.type === 'positive' ? 'bg-emerald-600 shadow-emerald-200' : 'bg-rose-600 shadow-rose-200'}`}>تأكيد</button>
          </div>
        </div>
      )}

      {showContactChoice && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[220] flex items-center justify-center p-4" onClick={() => setShowContactChoice(null)}>
            <div className="bg-white rounded-[2rem] p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                <h3 className="text-center font-black text-lg mb-2 text-gray-800">إرسال التبليغ</h3>
                <p className="text-center text-xs text-gray-500 font-bold mb-6">اختر طريقة إرسال الرسالة لولي الأمر</p>
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => handleSendNotification('whatsapp')} className="flex flex-col items-center justify-center gap-2 p-4 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 hover:bg-emerald-100 active:scale-95 transition-all">
                        <MessageCircle className="w-8 h-8" />
                        <span className="text-xs font-black">واتساب</span>
                    </button>
                    <button onClick={() => handleSendNotification('sms')} className="flex flex-col items-center justify-center gap-2 p-4 bg-blue-50 text-blue-700 rounded-2xl border border-blue-100 hover:bg-blue-100 active:scale-95 transition-all">
                        <Smartphone className="w-8 h-8" />
                        <span className="text-xs font-black">رسالة نصية</span>
                    </button>
                </div>
                <button onClick={() => setShowContactChoice(null)} className="w-full mt-4 py-3 bg-gray-100 text-gray-500 rounded-xl font-bold text-xs">إلغاء</button>
            </div>
        </div>
      )}
    </div>
  );
};

export default StudentList;