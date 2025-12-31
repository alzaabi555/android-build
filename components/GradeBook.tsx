import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Student, GradeRecord, AssessmentTool } from '../types';
import { Plus, Search, X, Trash2, Settings, Check, Loader2, Edit2, Printer, FileSpreadsheet, FileUp, Download, AlertTriangle } from 'lucide-react';
import Modal from './Modal';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import * as XLSX from 'xlsx';

declare var html2pdf: any;

interface GradeBookProps {
  students: Student[];
  classes: string[];
  onUpdateStudent: (s: Student) => void;
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  currentSemester: '1' | '2';
  onSemesterChange: (sem: '1' | '2') => void;
  teacherInfo?: { name: string; school: string; subject: string; governorate: string };
}

const GradeBook: React.FC<GradeBookProps> = ({ 
    students = [], 
    classes = [], 
    onUpdateStudent, 
    setStudents, 
    currentSemester, 
    onSemesterChange, 
    teacherInfo 
}) => {
  const { theme, isLowPower } = useTheme();
  const contextData = useApp();
  
  // Safe Access to Context Data
  const assessmentTools = contextData?.assessmentTools || [];
  const setAssessmentTools = contextData?.setAssessmentTools || (() => {});
  
  const tools = useMemo(() => Array.isArray(assessmentTools) ? assessmentTools : [], [assessmentTools]);

  const [selectedClass, setSelectedClass] = useState(() => {
      if (Array.isArray(classes) && classes.length > 0) return classes[0];
      return 'all';
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [showAddGrade, setShowAddGrade] = useState<{ student: Student } | null>(null);
  const [editingGrade, setEditingGrade] = useState<GradeRecord | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false); // Added State for Export Loading
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [showToolsManager, setShowToolsManager] = useState(false);
  const [isAddingTool, setIsAddingTool] = useState(false);
  const [newToolName, setNewToolName] = useState('');
  const [editingToolId, setEditingToolId] = useState<string | null>(null);
  const [editToolName, setEditToolName] = useState('');

  const [selectedToolId, setSelectedToolId] = useState<string>('');
  const [score, setScore] = useState('');

  const styles = {
      card: isLowPower 
        ? 'bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-800'
        : 'bg-white dark:bg-white/5 shadow-sm border border-gray-200 dark:border-white/5 backdrop-blur-md',
      pill: 'rounded-xl',
      header: isLowPower
        ? 'bg-white dark:bg-[#0f172a] border-b border-gray-200 dark:border-gray-800'
        : 'bg-white/90 dark:bg-[#0f172a]/90 border-b border-gray-200 dark:border-white/10 shadow-sm backdrop-blur-xl',
  };

  useEffect(() => {
     if (showAddGrade && !editingGrade) {
         setSelectedToolId('');
         setScore('');
     }
  }, [showAddGrade, editingGrade]);

  // --- SUPER UTILS: Intelligent Cleaners ---
  const cleanText = (text: string) => {
      if (!text) return '';
      return String(text).trim().replace(/[\u200B-\u200D\uFEFF]/g, '').replace(/\s+/g, ' ');
  };

  const normalizeKey = (text: string) => {
      if (!text) return '';
      return String(text).replace(/[\s\u200B-\u200D\uFEFF]/g, '').toLowerCase().trim();
  };

  const extractNumericScore = (val: any): number | null => {
      if (val === undefined || val === null || val === '') return null;
      const strVal = String(val).trim();
      const cleanNum = strVal.replace(/[^0-9.]/g, '');
      const num = Number(cleanNum);
      return isNaN(num) || cleanNum === '' ? null : num;
  };

  // --- Strict Filtering ---
  const filteredStudents = useMemo(() => {
    if (!Array.isArray(students)) return [];
    return students.filter(s => {
      if (!s || typeof s !== 'object') return false;
      const name = String(s.name || '').toLowerCase();
      const matchesSearch = name.includes(searchTerm.toLowerCase());
      const studentClasses = Array.isArray(s.classes) ? s.classes : [];
      const matchesClass = selectedClass === 'all' || studentClasses.includes(selectedClass);
      return matchesSearch && matchesClass;
    });
  }, [students, searchTerm, selectedClass]);

  const getSemesterGrades = (student: Student, sem: '1' | '2') => {
      if (!student || !Array.isArray(student.grades)) return [];
      return student.grades.filter(g => {
          if (!g.semester) return sem === '1'; 
          return g.semester === sem;
      });
  };

  const calculateStudentSemesterStats = (student: Student, sem: '1' | '2') => {
      const grades = getSemesterGrades(student, sem);
      let totalScore = 0;
      grades.forEach(g => {
          totalScore += Number(g.score) || 0;
      });
      return { totalScore };
  };

  const getGradeSymbol = (score: number) => {
      if (score >= 90) return 'أ';
      if (score >= 80) return 'ب';
      if (score >= 65) return 'ج';
      if (score >= 50) return 'د';
      return 'هـ';
  };

  // --- Dynamic Column Discovery ---
  // This ensures that even if a tool is deleted or not in the list, 
  // any existing grade on any student will still show up in exports.
  const getActiveColumns = () => {
      const categorySet = new Set<string>();
      
      // 1. Add all defined tools first
      tools.forEach(t => categorySet.add(t.name));

      // 2. Scan all students for any other categories used in this semester
      filteredStudents.forEach(s => {
          const sGrades = getSemesterGrades(s, currentSemester);
          sGrades.forEach(g => {
              if (g.category) categorySet.add(g.category);
          });
      });

      return Array.from(categorySet);
  };

  const handleAddTool = () => {
      if (newToolName.trim()) {
          const newTool: AssessmentTool = {
              id: Math.random().toString(36).substr(2, 9),
              name: cleanText(newToolName),
              maxScore: 0
          };
          setAssessmentTools([...tools, newTool]);
          setNewToolName('');
          setIsAddingTool(false);
      }
  };

  const handleDeleteTool = (id: string) => {
      if (confirm('هل أنت متأكد من حذف هذه الأداة؟ لن يتم حذف الدرجات المرصودة سابقاً.')) {
          setAssessmentTools(tools.filter(t => t.id !== id));
      }
  };

  const startEditingTool = (tool: AssessmentTool) => {
      setEditingToolId(tool.id);
      setEditToolName(tool.name);
  };

  const saveEditedTool = () => {
      if (editingToolId && editToolName.trim()) {
          const updatedTools = tools.map(t => 
              t.id === editingToolId ? { ...t, name: cleanText(editToolName) } : t
          );
          setAssessmentTools(updatedTools);
          setEditingToolId(null);
          setEditToolName('');
      }
  };

  const cancelEditingTool = () => {
      setEditingToolId(null);
      setEditToolName('');
  };

  const handleDeleteGrade = (gradeId: string) => {
    if(!showAddGrade) return;
    if(confirm('هل أنت متأكد من حذف هذه الدرجة؟')) {
        const updatedGrades = showAddGrade.student.grades.filter(g => g.id !== gradeId);
        const updatedStudent = { ...showAddGrade.student, grades: updatedGrades };
        onUpdateStudent(updatedStudent);
        setShowAddGrade({ student: updatedStudent });
    }
  };

  // --- SAFE DELETE CLASS GRADES ---
  const handleDeleteClassGrades = () => {
    // 1. Strict Safety Check
    if (selectedClass === 'all') {
        alert('⚠️ تنبيه:\nلا يمكن حذف الدرجات بينما الخيار "الكل" محدد.\n\nالرجاء اختيار فصل محدد من القائمة العلوية أولاً لضمان عدم حذف بيانات الفصول الأخرى بالخطأ.');
        return;
    }

    // 2. Explicit Confirmation
    const confirmMsg = `🛑 تحذير:\n\nأنت على وشك حذف جميع درجات طلاب الصف (${selectedClass}) للفصل الدراسي (${currentSemester}).\n\nلن تتأثر الفصول الأخرى بهذا الإجراء.\nهل أنت متأكد تماماً؟`;
    
    if (confirm(confirmMsg)) {
        const updatedStudents = students.map(s => {
            // Strictly check membership
            if (s.classes && s.classes.includes(selectedClass)) {
                return {
                    ...s,
                    grades: (s.grades || []).filter(g => {
                        const gSem = g.semester || '1';
                        return gSem !== currentSemester;
                    })
                };
            }
            // If not in class, return untouched
            return s;
        });
        setStudents(updatedStudents);
        setShowToolsManager(false);
        alert(`تم حذف درجات الصف ${selectedClass} للفصل ${currentSemester} بنجاح.`);
    }
  };

  const handleEditGrade = (grade: GradeRecord) => {
      setEditingGrade(grade);
      setScore(grade.score.toString());
      const tool = tools.find(t => normalizeKey(t.name) === normalizeKey(grade.category));
      setSelectedToolId(tool ? tool.id : '');
  };

  const handleToolClick = (tool: AssessmentTool) => {
      setSelectedToolId(tool.id);
  };

  const handleSaveGrade = () => {
    if (!showAddGrade || score === '') return;
    
    const student = showAddGrade.student;
    let categoryName = 'درجة عامة';
    
    if (selectedToolId) {
        const tool = tools.find(t => t.id === selectedToolId);
        if (tool) categoryName = cleanText(tool.name);
    } else if (editingGrade) {
        categoryName = editingGrade.category;
    }
    
    const newGrade: GradeRecord = {
        id: editingGrade ? editingGrade.id : Math.random().toString(36).substr(2, 9),
        subject: teacherInfo?.subject || 'المادة',
        category: categoryName,
        score: Number(score),
        maxScore: 0,
        date: new Date().toISOString(),
        semester: currentSemester
    };
    let updatedGrades;
    if (editingGrade) {
        updatedGrades = (student.grades || []).map(g => g.id === editingGrade.id ? newGrade : g);
    } else {
        const otherGrades = (student.grades || []).filter(
            g => !(normalizeKey(g.category) === normalizeKey(categoryName) && (g.semester === currentSemester || (!g.semester && currentSemester === '1')))
        );
        updatedGrades = [newGrade, ...otherGrades];
    }
    const updatedStudent = { ...student, grades: updatedGrades };
    onUpdateStudent(updatedStudent);
    setShowAddGrade({ student: updatedStudent });
    setScore('');
    setEditingGrade(null);
  };

  // --- REVISED: iOS Compatible Excel Export (Dynamic Columns) ---
  const handleExportExcel = async () => {
      if (filteredStudents.length === 0) return alert('لا يوجد طلاب لتصديرهم');
      setIsExporting(true);

      try {
          const activeColumns = getActiveColumns(); // Get all actual columns from data

          const data = filteredStudents.map((s, i) => {
              const semGrades = getSemesterGrades(s, currentSemester);
              const stats = calculateStudentSemesterStats(s, currentSemester);
              
              const row: any = { 'م': i + 1, 'الاسم': s.name };

              // Map dynamic columns
              activeColumns.forEach(colName => {
                  const grade = semGrades.find(g => normalizeKey(g.category) === normalizeKey(colName));
                  row[colName] = grade ? grade.score : '';
              });

              row['المجموع'] = stats.totalScore;
              row['التقدير'] = getGradeSymbol(stats.totalScore);
              
              return row;
          });

          // Explicitly define headers to ensure they appear even if first row is empty
          const headers = ['م', 'الاسم', ...activeColumns, 'المجموع', 'التقدير'];

          const ws = XLSX.utils.json_to_sheet(data, { header: headers });
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, `درجات_${currentSemester}`);
          
          const fileName = `سجل_الدرجات_${selectedClass === 'all' ? 'عام' : selectedClass}_ف${currentSemester}.xlsx`;

          if (Capacitor.isNativePlatform()) {
              // 1. Write File to Cache
              const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
              const result = await Filesystem.writeFile({
                  path: fileName,
                  data: wbout,
                  directory: Directory.Cache
              });

              // 2. Share/Save File
              await Share.share({
                  title: 'تصدير درجات الطلاب',
                  text: `سجل درجات فصل ${currentSemester}`,
                  url: result.uri,
                  dialogTitle: 'حفظ أو مشاركة السجل'
              });
          } else {
              // Web Fallback
              XLSX.writeFile(wb, fileName);
          }
      } catch (error) {
          console.error("Export Error:", error);
          alert("حدث خطأ أثناء التصدير. يرجى المحاولة مرة أخرى.");
      } finally {
          setIsExporting(false);
      }
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsImporting(true);
      try {
          const data = await file.arrayBuffer();
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet, { defval: "" }) as any[];

          if (jsonData.length === 0) throw new Error('الملف فارغ');

          const headers = Object.keys(jsonData[0]);
          const excludedHeaders = ['م', '#', 'الاسم', 'اسم الطالب', 'المجموع', 'التقدير', 'name', 'student', 'total', 'grade'];
          
          const potentialTools = headers.filter(h => {
              const normalizedH = normalizeKey(h);
              return !excludedHeaders.some(ex => normalizeKey(ex) === normalizedH);
          });

          let updatedTools = [...tools];
          let toolsChanged = false;
          
          potentialTools.forEach(headerStr => {
              const cleanName = cleanText(headerStr);
              const exists = updatedTools.some(t => normalizeKey(t.name) === normalizeKey(cleanName));
              
              if (cleanName && !exists) {
                  updatedTools.push({
                      id: Math.random().toString(36).substr(2, 9),
                      name: cleanName,
                      maxScore: 0
                  });
                  toolsChanged = true;
              }
          });

          if (toolsChanged) {
              setAssessmentTools(updatedTools);
          }

          const updatedStudents = students.map(s => {
              const row = jsonData.find((r: any) => {
                  const rName = normalizeKey(r['الاسم'] || r['name'] || r['اسم الطالب'] || '');
                  return rName === normalizeKey(s.name);
              });

              if (!row) return s;

              let studentGrades = s.grades || [];
              
              potentialTools.forEach(headerStr => {
                  const rawValue = row[headerStr];
                  const numScore = extractNumericScore(rawValue);

                  if (numScore !== null) {
                      const cleanToolName = cleanText(headerStr);
                      studentGrades = studentGrades.filter(g => !(normalizeKey(g.category) === normalizeKey(cleanToolName) && g.semester === currentSemester));
                      
                      studentGrades.push({
                          id: Math.random().toString(36).substr(2, 9),
                          subject: teacherInfo?.subject || 'عام',
                          category: cleanToolName,
                          score: numScore,
                          maxScore: 0,
                          date: new Date().toISOString(),
                          semester: currentSemester
                      });
                  }
              });

              return { ...s, grades: studentGrades };
          });

          setStudents(updatedStudents);
          alert(`تم استيراد الدرجات بنجاح! تم التعرف على ${potentialTools.length} أعمدة كأدوات تقويم.`);

      } catch (error) {
          console.error(error);
          alert('حدث خطأ أثناء استيراد الملف. تأكد من الصيغة.');
      } finally {
          setIsImporting(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
      }
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

  const handlePrintGradeReport = async () => {
      if (filteredStudents.length === 0) return alert('لا يوجد طلاب');
      setIsGeneratingPdf(true);
      
      const teacherName = localStorage.getItem('teacherName') || '................';
      const schoolName = localStorage.getItem('schoolName') || '................';
      const subjectName = localStorage.getItem('subjectName') || '................';
      let emblemSrc = await getBase64Image('oman_logo.png') || await getBase64Image('icon.png');

      const activeColumns = getActiveColumns(); // Use Dynamic Columns

      const rows = filteredStudents.map((s, i) => {
          const semGrades = getSemesterGrades(s, currentSemester);
          const stats = calculateStudentSemesterStats(s, currentSemester);
          const sName = s.name || '';
          
          const toolCells = activeColumns.map(colName => {
              const grade = semGrades.find(g => normalizeKey(g.category) === normalizeKey(colName));
              return `<td style="border:1px solid #000; padding:5px; text-align:center;">${grade ? grade.score : '-'}</td>`;
          }).join('');

          return `
            <tr>
                <td style="border:1px solid #000; padding:5px; text-align:center;">${i + 1}</td>
                <td style="border:1px solid #000; padding:5px; text-align:right;">${sName}</td>
                ${toolCells}
                <td style="border:1px solid #000; padding:5px; text-align:center; font-weight:bold;">${stats.totalScore}</td>
                <td style="border:1px solid #000; padding:5px; text-align:center;">${getGradeSymbol(stats.totalScore)}</td>
            </tr>
          `;
      }).join('');

      const toolHeaders = activeColumns.map(name => `<th style="border:1px solid #000; padding:5px; background:#f3f4f6;">${name}</th>`).join('');

      const element = document.createElement('div');
      element.setAttribute('dir', 'rtl');
      element.style.fontFamily = 'Tajawal, sans-serif';
      element.style.padding = '10px';
      element.style.color = '#000';
      element.style.background = '#fff';
      
      // CRITICAL FIX FOR IPHONE:
      // Force the container width to match A4 landscape (approx 297mm)
      // This prevents the table from compressing to the phone's viewport width before PDF generation.
      element.style.width = '290mm'; 
      element.style.maxWidth = '290mm';

      element.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
            ${emblemSrc ? `<img src="${emblemSrc}" style="height: 60px; margin-bottom: 10px;" />` : ''}
            <h2 style="margin:0; font-size:20px; font-weight:bold;">سجل درجات الطلاب - الفصل الدراسي ${currentSemester}</h2>
            <div style="display:flex; justify-content:space-between; margin-top:15px; border-bottom:2px solid #000; padding-bottom:10px; font-weight:bold; font-size:12px;">
                <span>المدرسة: ${schoolName}</span>
                <span>المعلم: ${teacherName}</span>
                <span>المادة: ${subjectName}</span>
                <span>الصف: ${selectedClass === 'all' ? 'جميع الفصول' : selectedClass}</span>
            </div>
        </div>
        <table style="width:100%; border-collapse:collapse; font-size:10px;">
            <thead>
                <tr>
                    <th style="border:1px solid #000; padding:5px; background:#f3f4f6; width:30px;">#</th>
                    <th style="border:1px solid #000; padding:5px; background:#f3f4f6; width:150px;">الاسم</th>
                    ${toolHeaders}
                    <th style="border:1px solid #000; padding:5px; background:#f3f4f6; width:50px;">المجموع</th>
                    <th style="border:1px solid #000; padding:5px; background:#f3f4f6; width:40px;">التقدير</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
      `;

      exportPDF(element, `سجل_الدرجات_${selectedClass}.pdf`, setIsGeneratingPdf);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-60px)] -mt-4 -mx-4 text-slate-900 dark:text-white">
        {/* Sticky Full-Width Header */}
        <div className={`px-4 pt-3 pb-3 sticky top-0 z-30 shrink-0 ${styles.header}`}>
            <div className="flex flex-col md:flex-row justify-between items-center gap-3">
                <div className="flex items-center gap-4 w-full md:w-auto justify-between">
                    <div className="flex flex-col">
                        <h2 className="text-lg font-black text-slate-900 dark:text-white leading-none">سجل الدرجات</h2>
                        <p className="text-[10px] font-bold text-slate-500 dark:text-white/50 mt-1">{filteredStudents.length} طالب • {tools.length} أدوات</p>
                    </div>
                    
                    <div className="flex bg-gray-100 dark:bg-white/10 rounded-xl p-1 shrink-0">
                        <button onClick={() => onSemesterChange('1')} className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all ${currentSemester === '1' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 dark:text-white/50'}`}>فصل 1</button>
                        <button onClick={() => onSemesterChange('2')} className={`px-3 py-1 text-[10px] font-black rounded-lg transition-all ${currentSemester === '2' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 dark:text-white/50'}`}>فصل 2</button>
                    </div>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto custom-scrollbar pb-1">
                     <button onClick={() => setShowToolsManager(true)} className={`p-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-[10px] font-black flex items-center justify-center transition-all ${styles.pill}`} title="إدارة الأدوات">
                         <Settings className="w-4 h-4" />
                     </button>
                     <button onClick={handleExportExcel} disabled={isExporting} className={`p-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-[10px] font-black flex items-center justify-center transition-all ${styles.pill}`} title="تصدير Excel">
                         {isExporting ? <Loader2 className="w-4 h-4 animate-spin"/> : <FileSpreadsheet className="w-4 h-4" />}
                     </button>
                     <button onClick={() => fileInputRef.current?.click()} disabled={isImporting} className={`p-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-[10px] font-black flex items-center justify-center transition-all ${styles.pill}`} title="استيراد Excel">
                         {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />}
                     </button>
                     <input type="file" accept=".xlsx,.xls,.csv" ref={fileInputRef} onChange={handleImportExcel} className="hidden" />

                     <button onClick={handlePrintGradeReport} disabled={isGeneratingPdf} className={`p-2 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-[10px] font-black flex items-center justify-center transition-all ${styles.pill}`} title="طباعة التقرير">
                         {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                     </button>
                     {classes.length > 0 && (
                         <>
                            <div className="w-px h-5 bg-gray-200 dark:bg-white/10 mx-1"></div>
                            <button onClick={() => setSelectedClass('all')} className={`px-3 py-1.5 text-[10px] font-black whitespace-nowrap transition-all ${selectedClass === 'all' ? 'bg-slate-800 text-white shadow-md' : 'bg-white dark:bg-white/5 text-slate-500 dark:text-white/60'} ${styles.pill}`}>الكل</button>
                            {classes.map(c => (
                                <button key={c} onClick={() => setSelectedClass(c)} className={`px-3 py-1.5 text-[10px] font-black whitespace-nowrap transition-all ${selectedClass === c ? 'bg-indigo-600 text-white shadow-md' : 'bg-white dark:bg-white/5 text-slate-500 dark:text-white/60'} ${styles.pill}`}>{c}</button>
                            ))}
                         </>
                     )}
                </div>
            </div>

            {/* Search */}
            <div className="relative mt-2">
                 <input type="text" placeholder="بحث عن طالب..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl py-2 pr-9 pl-4 text-xs font-bold outline-none focus:border-indigo-500/50" />
                 <Search className="absolute right-3 top-2.5 w-4 h-4 text-slate-400" />
            </div>
        </div>

        {/* Scrollable Table Area */}
        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-20 custom-scrollbar">
            <div className={`${styles.card} overflow-hidden rounded-2xl`}>
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100 dark:border-white/5">
                                <th className="p-3 text-right text-[10px] font-black text-slate-400 dark:text-white/40 w-10">#</th>
                                <th className="p-3 text-right text-[10px] font-black text-slate-400 dark:text-white/40 w-auto">الطالب</th>
                                <th className="p-3 text-center text-[10px] font-black text-slate-400 dark:text-white/40 w-16">رصد</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                            {filteredStudents.length > 0 ? filteredStudents.map((student, idx) => {
                                const displayName = student.name || 'غير معروف';
                                const initial = displayName.charAt(0) || '?';
                                return (
                                    <tr key={student.id || idx} className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                        <td className="p-3 text-[10px] font-bold text-slate-400 dark:text-white/30">{idx + 1}</td>
                                        <td className="p-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-xs font-black text-slate-600 dark:text-white shrink-0">{initial}</div>
                                                <span className="text-xs font-bold text-slate-800 dark:text-white leading-relaxed">{displayName}</span>
                                            </div>
                                        </td>
                                        <td className="p-3 text-center">
                                            <button onClick={() => setShowAddGrade({ student })} className="w-8 h-8 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 rounded-lg flex items-center justify-center hover:bg-indigo-100 dark:hover:bg-indigo-500/20 active:scale-95 transition-all">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr><td colSpan={5} className="p-8 text-center text-xs text-slate-400 dark:text-white/30 font-bold">لا يوجد طلاب مطابقين</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        {/* Tools Manager Modal */}
        <Modal isOpen={showToolsManager} onClose={() => setShowToolsManager(false)} className="rounded-[28px] max-w-sm">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-black text-slate-900 dark:text-white">إدارة أدوات التقويم</h3>
                <button onClick={() => setShowToolsManager(false)} className="p-2 bg-slate-100 dark:bg-white/10 rounded-full hover:bg-slate-200 dark:hover:bg-white/20"><X className="w-4 h-4 text-slate-500"/></button>
            </div>
            
            <div className="bg-slate-50 dark:bg-black/20 p-3 rounded-2xl mb-4 border border-gray-100 dark:border-white/5 max-h-60 overflow-y-auto custom-scrollbar space-y-2">
                {tools.length > 0 ? tools.map(tool => (
                    <div key={tool.id} className="bg-white dark:bg-white/5 p-3 rounded-xl flex items-center justify-between border border-gray-100 dark:border-white/5 group">
                        {editingToolId === tool.id ? (
                            <div className="flex items-center gap-2 w-full">
                                <input autoFocus type="text" value={editToolName} onChange={e => setEditToolName(e.target.value)} className="flex-1 bg-slate-50 dark:bg-black/20 border-none rounded-lg px-2 py-1 text-xs font-bold outline-none" />
                                <button onClick={saveEditedTool} className="p-1.5 bg-emerald-500 text-white rounded-lg"><Check className="w-3 h-3"/></button>
                                <button onClick={cancelEditingTool} className="p-1.5 bg-gray-200 text-gray-600 rounded-lg"><X className="w-3 h-3"/></button>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                                    <span className="text-xs font-bold text-slate-700 dark:text-white">{tool.name}</span>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => startEditingTool(tool)} className="p-1.5 text-blue-500 bg-blue-50 dark:bg-blue-500/10 rounded-lg hover:bg-blue-100"><Edit2 className="w-3 h-3" /></button>
                                    <button onClick={() => handleDeleteTool(tool.id)} className="p-1.5 text-rose-500 bg-rose-50 dark:bg-rose-500/10 rounded-lg hover:bg-rose-100"><Trash2 className="w-3 h-3" /></button>
                                </div>
                            </>
                        )}
                    </div>
                )) : <p className="text-center text-[10px] text-slate-400 py-4">أضف أدوات تقويم مثل: اختبار قصير، واجب..</p>}
            </div>

            {!isAddingTool ? (
                <button onClick={() => setIsAddingTool(true)} className="w-full py-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 rounded-xl font-black text-xs flex items-center justify-center gap-2 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all border border-indigo-100 dark:border-indigo-500/20">
                    <Plus className="w-4 h-4" /> إضافة أداة جديدة
                </button>
            ) : (
                <div className="flex gap-2 animate-in fade-in slide-in-from-bottom-2">
                    <input autoFocus type="text" placeholder="اسم الأداة (مثال: اختبار 1)" value={newToolName} onChange={e => setNewToolName(e.target.value)} className="flex-1 bg-slate-50 dark:bg-black/20 border border-indigo-200 dark:border-indigo-500/30 rounded-xl px-3 text-xs font-bold outline-none text-slate-900 dark:text-white" />
                    <button onClick={handleAddTool} className="bg-indigo-600 text-white px-4 rounded-xl"><Check className="w-4 h-4"/></button>
                    <button onClick={() => setIsAddingTool(false)} className="bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-white/50 px-4 rounded-xl"><X className="w-4 h-4"/></button>
                </div>
            )}
            
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/5 space-y-2">
                <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/20">
                    <h4 className="text-[10px] font-black text-red-600 dark:text-red-400 mb-2 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> منطقة الخطر
                    </h4>
                    <button 
                        onClick={handleDeleteClassGrades} 
                        disabled={selectedClass === 'all'}
                        className={`w-full py-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all ${selectedClass === 'all' ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-rose-600 text-white hover:bg-rose-700 shadow-lg shadow-rose-500/20'}`}
                    >
                        <Trash2 className="w-4 h-4" /> 
                        {selectedClass === 'all' ? 'اختر فصلاً للحذف' : `حذف درجات ${selectedClass} (فصل ${currentSemester})`}
                    </button>
                </div>
            </div>
        </Modal>

        {/* Grade Input Modal */}
        <Modal isOpen={!!showAddGrade} onClose={() => { setShowAddGrade(null); setEditingGrade(null); setScore(''); }} className="rounded-[28px] max-w-sm">
            {showAddGrade && (
                <>
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-white/10 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl font-black text-slate-700 dark:text-white shadow-inner">
                            {(showAddGrade.student.name || '?').charAt(0)}
                        </div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white">{showAddGrade.student.name || 'طالب غير معروف'}</h3>
                        <p className="text-xs font-bold text-slate-500 dark:text-white/50">{editingGrade ? 'تعديل درجة' : 'رصد درجة جديدة'}</p>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 dark:text-white/40 block">اختر الأداة</label>
                            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto custom-scrollbar">
                                {tools.length > 0 ? tools.map(tool => (
                                    <button 
                                        key={tool.id} 
                                        onClick={() => handleToolClick(tool)}
                                        className={`p-2 rounded-xl text-[10px] font-black transition-all border ${selectedToolId === tool.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-md transform scale-105' : 'bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-white/60 border-slate-100 dark:border-white/5 hover:bg-white dark:hover:bg-white/10'}`}
                                    >
                                        {tool.name}
                                    </button>
                                )) : <p className="col-span-2 text-center text-[10px] text-red-400 bg-red-50 p-2 rounded-lg">يجب إضافة أدوات تقويم أولاً أو استيرادها عبر Excel</p>}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 dark:text-white/40 block">الدرجة</label>
                            <div className="relative">
                                <input 
                                    type="number" 
                                    autoFocus
                                    placeholder="0" 
                                    value={score} 
                                    onChange={e => setScore(e.target.value)} 
                                    className="w-full bg-slate-50 dark:bg-black/20 border-2 border-transparent focus:border-indigo-500 dark:focus:border-indigo-400 rounded-2xl py-4 text-center text-2xl font-black outline-none text-slate-900 dark:text-white placeholder:text-slate-300" 
                                />
                            </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                             {editingGrade && (
                                 <button onClick={() => handleDeleteGrade(editingGrade.id)} className="p-4 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-2xl hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors">
                                     <Trash2 className="w-5 h-5" />
                                 </button>
                             )}
                             <button 
                                onClick={handleSaveGrade} 
                                disabled={!score || (!selectedToolId && !editingGrade)}
                                className="flex-1 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/30 disabled:opacity-50 disabled:shadow-none py-4"
                             >
                                 حفظ الدرجة
                             </button>
                        </div>

                        <div className="pt-4 border-t border-gray-100 dark:border-white/5">
                            <h4 className="text-[10px] font-black text-slate-400 dark:text-white/40 mb-2">سجل درجات الطالب (فصل {currentSemester})</h4>
                            <div className="flex flex-wrap gap-2">
                                {getSemesterGrades(showAddGrade.student, currentSemester).map(g => (
                                    <button 
                                        key={g.id} 
                                        onClick={() => handleEditGrade(g)}
                                        className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 px-3 py-1.5 rounded-lg flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors group"
                                    >
                                        <span className="text-[9px] text-slate-400 dark:text-white/40 font-bold">{g.category}</span>
                                        <span className="text-xs font-black text-slate-800 dark:text-white bg-slate-100 dark:bg-black/20 px-1.5 rounded">{g.score}</span>
                                    </button>
                                ))}
                                {getSemesterGrades(showAddGrade.student, currentSemester).length === 0 && <p className="text-[9px] text-slate-300">لا توجد درجات</p>}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </Modal>

    </div>
  );
};

export default GradeBook;