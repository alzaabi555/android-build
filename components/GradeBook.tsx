
import React, { useState, useEffect } from 'react';
import { Student, GradeRecord } from '../types';
import { Plus, Search, X, Trash2, Settings, Check, FileSpreadsheet, Loader2, Info, Edit2, Download, AlertTriangle, Eye } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

interface GradeBookProps {
  students: Student[];
  classes: string[];
  onUpdateStudent: (s: Student) => void;
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  currentSemester: '1' | '2';
  onSemesterChange: (sem: '1' | '2') => void;
  teacherInfo?: { name: string; school: string; subject: string; governorate: string };
}

interface AssessmentTool {
    id: string;
    name: string;
    maxScore: number;
}

const GradeBook: React.FC<GradeBookProps> = ({ students, classes, onUpdateStudent, setStudents, currentSemester, onSemesterChange, teacherInfo }) => {
  const [selectedClass, setSelectedClass] = useState(classes[0] || 'all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddGrade, setShowAddGrade] = useState<{ student: Student } | null>(null);
  const [editingGrade, setEditingGrade] = useState<GradeRecord | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  
  // Bulk Import State
  const [isImporting, setIsImporting] = useState(false);
  const [showImportInfo, setShowImportInfo] = useState(false);

  // Tools Manager State
  const [showToolsManager, setShowToolsManager] = useState(false);

  // Custom Assessment Tools State
  const [tools, setTools] = useState<AssessmentTool[]>(() => {
    try {
        const saved = localStorage.getItem('assessmentTools');
        return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [isAddingTool, setIsAddingTool] = useState(false);
  const [newToolName, setNewToolName] = useState('');
  const [newToolMax, setNewToolMax] = useState('');
  
  const [selectedToolId, setSelectedToolId] = useState<string>('');
  const [score, setScore] = useState('');
  const [currentMaxScore, setCurrentMaxScore] = useState(''); 

  useEffect(() => {
     localStorage.setItem('assessmentTools', JSON.stringify(tools));
  }, [tools]);

  // Reset state when modal opens
  useEffect(() => {
     if (showAddGrade && !editingGrade) {
         setSelectedToolId('');
         setCurrentMaxScore('');
         setScore('');
     }
  }, [showAddGrade, editingGrade]);

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = selectedClass === 'all' || s.classes?.includes(selectedClass);
    return matchesSearch && matchesClass;
  });

  // --- Grade Management Functions ---

  const handleDeleteGrade = (gradeId: string) => {
    if(!showAddGrade) return;
    if(confirm('هل أنت متأكد من حذف هذه الدرجة؟')) {
        const updatedGrades = showAddGrade.student.grades.filter(g => g.id !== gradeId);
        const updatedStudent = { ...showAddGrade.student, grades: updatedGrades };
        onUpdateStudent(updatedStudent);
        setShowAddGrade({ student: updatedStudent }); // Update modal view
    }
  };

  const handleDeleteAllGrades = () => {
    const warningMsg = `تحذير هام:
هل أنت متأكد من رغبتك في حذف سجل الدرجات بالكامل للفصل الدراسي ${currentSemester === '1' ? 'الأول' : 'الثاني'}؟

- سيتم حذف جميع الدرجات المرصودة في هذا الفصل.
- سيتم حذف جميع أدوات التقويم (الأعمدة).
- لن يتم حذف بيانات الطلاب (الأسماء والأرقام).

هذا الإجراء لا يمكن التراجع عنه.`;

    if (confirm(warningMsg)) {
        // حذف درجات الفصل الحالي فقط، والإبقاء على درجات الفصل الآخر
        const updatedStudents = students.map(s => ({
            ...s,
            grades: s.grades.filter(g => g.semester !== currentSemester && (g.semester || currentSemester !== '1'))
        }));
        
        setStudents(updatedStudents);
        setTools([]); // تصفير الأدوات لبدء سجل جديد نظيف
        setEditingGrade(null);
        setShowAddGrade(null);
        alert('تم حذف سجل الدرجات وأدوات التقويم بنجاح.');
    }
  };

  const handleEditGrade = (grade: GradeRecord) => {
      setEditingGrade(grade);
      setScore(grade.score.toString());
      setCurrentMaxScore(grade.maxScore.toString());
      // Find tool by name if possible, otherwise keep manual max
      const tool = tools.find(t => t.name === grade.category);
      if(tool) {
          setSelectedToolId(tool.id);
      } else {
          setSelectedToolId('');
      }
  };

  const handleToolClick = (tool: AssessmentTool) => {
      setSelectedToolId(tool.id);
      // إذا كانت الأداة تحتوي على درجة عظمى محددة (أكبر من 0)، قم بتعبئتها
      // وإلا اترك الحقل فارغاً للإدخال اليدوي
      if (tool.maxScore > 0) {
          setCurrentMaxScore(tool.maxScore.toString());
      } else {
          setCurrentMaxScore('');
      }
  };

  const handleSaveGrade = () => {
    if (!showAddGrade || score === '') return;

    // التحقق من إدخال الدرجة العظمى يدوياً وبشكل إجباري
    if (!currentMaxScore || Number(currentMaxScore) <= 0) {
        alert('الرجاء إدخال الدرجة العظمى يدوياً بشكل صحيح');
        return;
    }

    const student = showAddGrade.student;
    
    // Determine category and max score
    let categoryName = 'درجة عامة';
    // استخدام المدخل اليدوي
    let maxVal = Number(currentMaxScore);

    if (selectedToolId) {
        const tool = tools.find(t => t.id === selectedToolId);
        if (tool) {
            categoryName = tool.name;
        }
    } else if (editingGrade) {
        categoryName = editingGrade.category;
    }

    const newGrade: GradeRecord = {
        id: editingGrade ? editingGrade.id : Math.random().toString(36).substr(2, 9),
        subject: 'المادة',
        category: categoryName,
        score: Number(score),
        maxScore: maxVal,
        date: new Date().toISOString(),
        semester: currentSemester
    };
    
    let updatedGrades;
    if (editingGrade) {
        updatedGrades = student.grades.map(g => g.id === editingGrade.id ? newGrade : g);
    } else {
        const otherGrades = student.grades.filter(
            g => !(g.category === categoryName && (g.semester === currentSemester || (!g.semester && currentSemester === '1')))
        );
        updatedGrades = [newGrade, ...otherGrades];
    }

    const updatedStudent = { ...student, grades: updatedGrades };
    onUpdateStudent(updatedStudent);
    setShowAddGrade({ student: updatedStudent });
    
    // Reset inputs
    setScore('');
    if (editingGrade) {
        setEditingGrade(null);
        setCurrentMaxScore(''); 
        setSelectedToolId('');
    }
  };

  const handleBulkImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];

      if (!rawData || rawData.length === 0) throw new Error('الملف فارغ');

      const nameKeywords = ['الاسم', 'اسم الطالب', 'Name', 'Student', 'Student Name', 'المتعلم'];
      const phoneKeywords = ['هاتف', 'جوال', 'mobile', 'phone', 'contact', 'ولي', 'parent']; // كلمات مفتاحية للهاتف

      let headerRowIndex = -1;
      let headers: string[] = [];

      for (let i = 0; i < Math.min(rawData.length, 100); i++) {
          const row = rawData[i];
          if (!row) continue;
          if (row.some(cell => typeof cell === 'string' && nameKeywords.some(kw => cell.trim().includes(kw)))) {
              headerRowIndex = i;
              headers = row.map(cell => String(cell || '').trim());
              break;
          }
      }

      if (headerRowIndex === -1) {
          alert('لم يتم العثور على عمود "الاسم".');
          return;
      }

      const nameColIndex = headers.findIndex(h => nameKeywords.some(kw => h.includes(kw)));
      const phoneColIndex = headers.findIndex(h => phoneKeywords.some(kw => h.toLowerCase().includes(kw))); // تحديد عمود الهاتف

      const ignoreKeywords = ['النوع', 'gender', 'id', 'notes', 'رقم', 'ملاحظات', 'الجنس']; 

      const gradeColIndices: number[] = [];
      headers.forEach((h, idx) => {
          if (idx === nameColIndex || idx === phoneColIndex) return; // تجاهل الاسم والهاتف عند البحث عن الدرجات
          if (!h || h === '') return;
          if (ignoreKeywords.some(kw => h.toLowerCase() === kw || h.toLowerCase().includes(kw + ' '))) return;
          if (phoneKeywords.some(kw => h.toLowerCase().includes(kw))) return; // تأكيد عدم اعتبار الهاتف درجة
          gradeColIndices.push(idx);
      });

      // 1. حساب الدرجة العظمى المقترحة لكل عمود بناءً على أعلى درجة موجودة فيه
      const columnMaxScores: {[key: number]: number} = {};
      for (let i = headerRowIndex + 1; i < rawData.length; i++) {
        const row = rawData[i];
        if (!row) continue;
        gradeColIndices.forEach(colIdx => {
             const val = parseFloat(row[colIdx]);
             if (!isNaN(val)) {
                 if (!columnMaxScores[colIdx] || val > columnMaxScores[colIdx]) {
                     columnMaxScores[colIdx] = val;
                 }
             }
        });
      }

      let updatedCount = 0;
      let toolsAddedCount = 0;
      let phonesUpdatedCount = 0;
      const updatedStudents = [...students];
      const currentTools = [...tools];

      const findOrCreateTool = (toolName: string, colIdx: number): number => {
          const cleanName = toolName.trim();
          const existing = currentTools.find(t => t.name.trim() === cleanName);
          const maxFound = columnMaxScores[colIdx] || 0;
          if (existing) return existing.maxScore;
          
          const newTool = {
              id: Math.random().toString(36).substr(2, 9),
              name: cleanName,
              maxScore: maxFound
          };
          currentTools.push(newTool);
          toolsAddedCount++;
          return maxFound;
      };

      // Create tools based on headers and data analysis
      gradeColIndices.forEach(colIdx => {
          const toolName = headers[colIdx];
          findOrCreateTool(toolName, colIdx);
      });

      // Import grades and update student info
      for (let i = headerRowIndex + 1; i < rawData.length; i++) {
          const row = rawData[i];
          if (!row) continue;
          const studentName = String(row[nameColIndex] || '').trim();
          if (!studentName || studentName.length < 3) continue;

          const studentIndex = updatedStudents.findIndex(s => s.name.trim() === studentName);

          if (studentIndex > -1) {
              // --- تحديث رقم ولي الأمر إذا وجد ---
              if (phoneColIndex > -1) {
                  const rawPhone = row[phoneColIndex];
                  if (rawPhone) {
                      const newPhone = String(rawPhone).replace(/[^0-9+]/g, ''); // تنظيف الرقم
                      if (newPhone && updatedStudents[studentIndex].parentPhone !== newPhone) {
                          updatedStudents[studentIndex] = {
                              ...updatedStudents[studentIndex],
                              parentPhone: newPhone
                          };
                          phonesUpdatedCount++;
                      }
                  }
              }

              // --- رصد الدرجات ---
              let gradesAdded = 0;
              gradeColIndices.forEach(colIdx => {
                  const cellValue = row[colIdx];
                  if (cellValue !== undefined && cellValue !== null && String(cellValue).trim() !== '') {
                      const numericScore = parseFloat(String(cellValue));
                      if (!isNaN(numericScore)) {
                          const toolName = headers[colIdx];
                          const tool = currentTools.find(t => t.name.trim() === toolName.trim());
                          const maxScore = tool ? tool.maxScore : 0;

                          const newGrade: GradeRecord = {
                              id: Math.random().toString(36).substr(2, 9),
                              subject: 'عام',
                              category: toolName,
                              score: numericScore,
                              maxScore: maxScore,
                              date: new Date().toISOString(),
                              semester: currentSemester
                          };

                          const currentGrades = updatedStudents[studentIndex].grades || [];
                          const filteredGrades = currentGrades.filter(g => 
                              !(g.category === toolName && (g.semester === currentSemester || (!g.semester && currentSemester === '1')))
                          );
                          
                          updatedStudents[studentIndex] = {
                              ...updatedStudents[studentIndex],
                              grades: [newGrade, ...filteredGrades]
                          };
                          gradesAdded++;
                      }
                  }
              });
              if (gradesAdded > 0) updatedCount++;
          }
      }

      if (updatedCount > 0 || toolsAddedCount > 0 || phonesUpdatedCount > 0) {
          setStudents(updatedStudents);
          setTools(currentTools);
          alert(`تقرير الاستيراد:\n- تم تحديث درجات: ${updatedCount} طالب\n- تم تحديث أرقام هواتف: ${phonesUpdatedCount} طالب\n- تم إضافة ${toolsAddedCount} أدوات تقويم جديدة.`);
      } else {
          alert('لم يتم العثور على تطابق في الأسماء.');
      }

    } catch (error) {
        console.error(error);
        alert('حدث خطأ أثناء قراءة الملف.');
    } finally {
        setIsImporting(false);
        if (e.target) e.target.value = '';
    }
  };

  const getSemesterGrades = (student: Student, sem: '1' | '2') => {
      return (student.grades || []).filter(g => {
          if (!g.semester) return sem === '1';
          return g.semester === sem;
      });
  };

  const calculateFullStats = (student: Student) => {
    const sem1 = getSemesterGrades(student, '1').reduce((acc, g) => ({ 
        score: acc.score + (Number(g.score) || 0), 
        max: acc.max + (Number(g.maxScore) || 0) 
    }), { score: 0, max: 0 });

    const sem2 = getSemesterGrades(student, '2').reduce((acc, g) => ({ 
        score: acc.score + (Number(g.score) || 0), 
        max: acc.max + (Number(g.maxScore) || 0) 
    }), { score: 0, max: 0 });

    const totalScore = sem1.score + sem2.score;
    const totalMax = sem1.max + sem2.max;
    const totalPercent = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;
    
    // إضافة حساب المعدل (مجموع الفصلين / 2)
    const finalAverage = totalScore / 2;

    return { sem1, sem2, totalScore, totalMax, totalPercent, finalAverage };
  };

  const handleExportGradeBook = async () => {
    if (filteredStudents.length === 0) {
        alert('لا يوجد طلاب لتصدير بياناتهم.');
        return;
    }

    const semesterLabel = currentSemester === '1' ? 'الفصل_الأول' : 'الفصل_الثاني';
    const semesterText = currentSemester === '1' ? 'الأول' : 'الثاني';
    const subjectText = teacherInfo?.subject || '...............';
    const classText = selectedClass === 'all' ? 'جميع الفصول' : selectedClass;

    // العنوان المخصص حسب الطلب
    const headerTitle = `استمارة رصد الدرجات للصفوف (${classText}) مادة ${subjectText} / الصف ${classText} الشعبة ${classText} الفصل الدراسي ${semesterText} - للعام الدراسي 2025 / 2026 م`;

    // إعداد عدادات الرموز
    const symbolCounts = { 'أ': 0, 'ب': 0, 'ج': 0, 'د': 0, 'هـ': 0, '-': 0 };
    const totalStudents = filteredStudents.length;

    const data = filteredStudents.map(s => {
        const stats = calculateFullStats(s);
        // نأخذ إحصائيات الفصل الحالي فقط
        const currentSemStats = currentSemester === '1' ? stats.sem1 : stats.sem2;
        
        // حساب رمز المستوى
        const percentage = currentSemStats.max > 0 ? (currentSemStats.score / currentSemStats.max) * 100 : 0;
        let gradeSymbol = '-';
        if (currentSemStats.max > 0) {
            if (percentage >= 90) { gradeSymbol = 'أ'; symbolCounts['أ']++; }
            else if (percentage >= 80) { gradeSymbol = 'ب'; symbolCounts['ب']++; }
            else if (percentage >= 65) { gradeSymbol = 'ج'; symbolCounts['ج']++; }
            else if (percentage >= 50) { gradeSymbol = 'د'; symbolCounts['د']++; }
            else { gradeSymbol = 'هـ'; symbolCounts['هـ']++; }
        } else {
             symbolCounts['-']++;
        }

        const row: any = {
            'اسم الطالب': s.name,
            'الفصل': s.classes.join(', ')
        };

        // إضافة أعمدة الأدوات للفصل الحالي فقط
        tools.forEach(t => {
            const grade = s.grades.find(g => 
                g.category === t.name && 
                (g.semester === currentSemester || (!g.semester && currentSemester === '1'))
            );
            
            row[t.name] = grade ? grade.score : '-';
        });

        // الإجمالي للفصل الحالي والمستوى
        row['المجموع'] = currentSemStats.score;
        row['المستوى'] = gradeSymbol;

        return row;
    });

    // بدء البيانات من السطر الثالث لترك مجال للعنوان
    const ws = XLSX.utils.json_to_sheet(data, { origin: "A3" });

    // إضافة العنوان في الخلية الأولى
    XLSX.utils.sheet_add_aoa(ws, [[headerTitle]], { origin: "A1" });

    // إضافة جدول الملخص أسفل البيانات
    const summaryRows = [
        [""], // سطر فارغ
        ["ملخص التحصيل العام للطلاب"],
        ["الرمز", "التقدير", "عدد الطلاب", "النسبة المئوية"],
        ["أ", "ممتاز (90-100)", symbolCounts['أ'], `${totalStudents > 0 ? ((symbolCounts['أ']/totalStudents)*100).toFixed(1) : 0}%`],
        ["ب", "جيد جداً (80-89)", symbolCounts['ب'], `${totalStudents > 0 ? ((symbolCounts['ب']/totalStudents)*100).toFixed(1) : 0}%`],
        ["ج", "جيد (65-79)", symbolCounts['ج'], `${totalStudents > 0 ? ((symbolCounts['ج']/totalStudents)*100).toFixed(1) : 0}%`],
        ["د", "مقبول (50-64)", symbolCounts['د'], `${totalStudents > 0 ? ((symbolCounts['د']/totalStudents)*100).toFixed(1) : 0}%`],
        ["هـ", "يحتاج مساعدة (<50)", symbolCounts['هـ'], `${totalStudents > 0 ? ((symbolCounts['هـ']/totalStudents)*100).toFixed(1) : 0}%`],
        ["-", "غير مكتمل", symbolCounts['-'], `${totalStudents > 0 ? ((symbolCounts['-']/totalStudents)*100).toFixed(1) : 0}%`],
        ["الإجمالي", "", totalStudents, "100%"]
    ];

    // إضافة البيانات الإضافية للورقة
    XLSX.utils.sheet_add_aoa(ws, summaryRows, { origin: -1 });

    const wb = XLSX.utils.book_new();
    // ضبط اتجاه الورقة لليمين لليسار
    if(!wb.Workbook) wb.Workbook = {};
    if(!wb.Workbook.Views) wb.Workbook.Views = [];
    if(!wb.Workbook.Views[0]) wb.Workbook.Views[0] = {};
    wb.Workbook.Views[0].RTL = true;

    XLSX.utils.book_append_sheet(wb, ws, `سجل_${semesterLabel}`);

    const fileName = `سجل_الدرجات_${semesterLabel}_${new Date().toISOString().split('T')[0]}.xlsx`;

    // --- معالجة الحفظ حسب المنصة ---
    if (Capacitor.isNativePlatform()) {
        try {
            // للهواتف: تحويل لـ Base64 وحفظ في الملفات ثم مشاركة
            const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
            
            const result = await Filesystem.writeFile({
                path: fileName,
                data: wbout,
                directory: Directory.Cache
            });

            await Share.share({
                title: 'تصدير سجل الدرجات',
                text: 'تم تصدير سجل الدرجات من تطبيق راصد',
                url: result.uri,
                dialogTitle: 'مشاركة الملف'
            });
        } catch (e) {
            console.error('Export Error', e);
            alert('حدث خطأ أثناء حفظ الملف على الهاتف');
        }
    } else {
        // للويب والويندوز: التنزيل المباشر
        XLSX.writeFile(wb, fileName);
    }
  };

  const handleAddTool = () => {
      if (newToolName.trim() && newToolMax) {
          const newTool: AssessmentTool = {
              id: Math.random().toString(36).substr(2, 9),
              name: newToolName.trim(),
              maxScore: Number(newToolMax)
          };
          setTools(prev => [...prev, newTool]);
          if (showAddGrade) {
            setSelectedToolId(newTool.id);
            setCurrentMaxScore(newTool.maxScore.toString());
          }
          setIsAddingTool(false);
          setNewToolName('');
          setNewToolMax('');
      }
  };

  const handleDeleteTool = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (confirm('حذف الأداة؟')) {
          setTools(prev => prev.filter(t => t.id !== id));
          if (selectedToolId === id) {
              setSelectedToolId('');
              setCurrentMaxScore('');
          }
      }
  };

  const handleUpdateToolMax = (id: string, newMax: string) => {
      const val = parseInt(newMax);
      if (!isNaN(val) && val > 0) {
          setTools(prev => prev.map(t => t.id === id ? { ...t, maxScore: val } : t));
          if (selectedToolId === id) {
              setCurrentMaxScore(val.toString());
          }
      }
  };

  return (
    <div className="space-y-4 pb-20">
      <div className="flex flex-col gap-3">
          <div className="bg-white p-1 rounded-2xl shadow-sm border border-gray-100 flex">
             <button 
                onClick={() => onSemesterChange('1')} 
                className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${currentSemester === '1' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}
             >
                فصل 1
             </button>
             <button 
                onClick={() => onSemesterChange('2')} 
                className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${currentSemester === '2' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}
             >
                فصل 2
             </button>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap items-center justify-between gap-3">
             <div className="flex items-center gap-2 flex-1 min-w-[150px]">
                 <h2 className="text-xs font-black text-gray-900 whitespace-nowrap">السجل</h2>
                 <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="bg-gray-50 rounded-lg px-2 py-1 text-[10px] font-black outline-none border-none">
                    <option value="all">كل الفصول</option>
                    {classes.map(c => <option key={c} value={c}>{c}</option>)}
                 </select>
             </div>
             
             {/* Toolbar Buttons - Horizontal Scroll Fix */}
             <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full sm:w-auto pb-1">
                 <button onClick={() => setShowToolsManager(true)} className="px-3 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 active:scale-95 transition-all flex items-center gap-1 shrink-0" title="إدارة أدوات التقويم">
                    <Settings className="w-3.5 h-3.5" />
                    <span className="text-[9px] font-black hidden sm:inline">أدوات</span>
                 </button>
                 <button onClick={() => setShowPreviewModal(true)} className="px-3 py-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 active:scale-95 transition-all flex items-center gap-1 shrink-0" title="معاينة التقرير">
                    <Eye className="w-3.5 h-3.5" />
                    <span className="text-[9px] font-black hidden sm:inline">معاينة</span>
                 </button>
                 <button onClick={handleExportGradeBook} className="px-3 py-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 active:scale-95 transition-all flex items-center gap-1 shrink-0" title={`تحميل سجل ${currentSemester === '1' ? 'الفصل الأول' : 'الفصل الثاني'} (Excel)`}>
                    <Download className="w-3.5 h-3.5" />
                    <span className="text-[9px] font-black hidden sm:inline">تحميل</span>
                 </button>
                 <button onClick={handleDeleteAllGrades} className="px-3 py-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 active:scale-95 transition-all flex items-center gap-1 shrink-0" title="حذف سجل الدرجات بالكامل">
                    <Trash2 className="w-3.5 h-3.5" />
                 </button>
                 <button onClick={() => setShowImportInfo(!showImportInfo)} className="p-2 bg-gray-50 text-gray-400 rounded-xl hover:bg-gray-100 shrink-0"><Info className="w-4 h-4" /></button>
                 <label className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-3 py-2 rounded-xl text-[10px] font-black cursor-pointer hover:bg-emerald-100 active:scale-95 transition-all shrink-0">
                    {isImporting ? <Loader2 className="w-4 h-4 animate-spin"/> : <FileSpreadsheet className="w-4 h-4"/>}
                    <span className="hidden sm:inline">استيراد</span>
                    <input type="file" accept=".xlsx, .xls, .csv" className="hidden" onChange={handleBulkImport} disabled={isImporting} />
                 </label>
             </div>
          </div>
          
          {showImportInfo && (
              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 animate-in slide-in-from-top-2">
                  <div className="flex justify-between items-start">
                    <h4 className="text-[10px] font-black text-amber-800 mb-2">تعليمات الاستيراد:</h4>
                    <button onClick={() => setShowImportInfo(false)}><X className="w-3 h-3 text-amber-600"/></button>
                  </div>
                  <ul className="list-disc list-inside text-[9px] text-amber-700 font-bold space-y-1">
                      <li>تأكد من اختيار <strong>الفصل الدراسي الصحيح</strong> قبل الاستيراد.</li>
                      <li>يتم استيراد كافة الأعمدة الرقمية كأدوات تقويم.</li>
                      <li>إذا قمت بإعادة رفع الملف، سيتم <strong>تحديث أرقام هواتف أولياء الأمور</strong> تلقائياً إذا وجدت.</li>
                  </ul>
              </div>
          )}

          <div className="relative">
             <Search className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
             <input type="text" placeholder="ابحث عن طالب..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-white rounded-xl py-2.5 pr-9 pl-4 text-xs font-bold outline-none border-none shadow-sm" />
          </div>
      </div>

      <div className="space-y-2">
        {filteredStudents.length > 0 ? filteredStudents.map(student => {
          const stats = calculateFullStats(student);
          return (
            <div key={student.id} onClick={() => { setEditingGrade(null); setShowAddGrade({ student }); }} className="bg-white p-3 rounded-2xl shadow-sm border border-gray-50 flex flex-col gap-2 active:bg-blue-50 transition-colors cursor-pointer">
              
              <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-black text-white shadow-sm ${stats.totalPercent >= 50 ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                        {stats.totalPercent}%
                     </div>
                     <div>
                        <h4 className="text-[11px] font-black text-gray-900">{student.name}</h4>
                        <span className="text-[9px] text-gray-400 font-bold">{student.classes[0]}</span>
                     </div>
                  </div>
                  <button className="w-8 h-8 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center"><Plus className="w-4 h-4" /></button>
              </div>

              <div className="flex gap-1 mt-1 bg-gray-50 p-2 rounded-xl">
                  <div className="flex-1 text-center border-l border-gray-200">
                      <span className="block text-[8px] text-gray-400 font-bold">فصل 1</span>
                      <span className="block text-[10px] font-black text-gray-700">{stats.sem1.score}</span>
                  </div>
                  <div className="flex-1 text-center border-l border-gray-200">
                      <span className="block text-[8px] text-gray-400 font-bold">فصل 2</span>
                      <span className="block text-[10px] font-black text-gray-700">{stats.sem2.score}</span>
                  </div>
                  <div className="flex-1 text-center border-l border-gray-200">
                      <span className="block text-[8px] text-blue-500 font-bold">المجموع</span>
                      <span className="block text-[10px] font-black text-blue-700">{stats.totalScore}/{stats.totalMax}</span>
                  </div>
                  <div className="flex-1 text-center bg-indigo-50 rounded-lg">
                      <span className="block text-[8px] text-indigo-500 font-bold">المعدل</span>
                      <span className="block text-[10px] font-black text-indigo-700">{stats.finalAverage}</span>
                  </div>
              </div>
            </div>
          );
        }) : <div className="text-center py-10 text-gray-400 text-xs font-bold">لا يوجد طلاب</div>}
      </div>

      {showToolsManager && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[130] flex items-center justify-center p-6" onClick={() => setShowToolsManager(false)}>
              <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl relative flex flex-col max-h-[85vh] md:max-h-[600px]" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-6 shrink-0">
                      <h3 className="font-black text-gray-900 text-sm flex items-center gap-2"><Settings className="w-4 h-4 text-blue-600"/> إدارة أدوات التقويم</h3>
                      <button onClick={() => setShowToolsManager(false)} className="p-2 bg-gray-100 rounded-full"><X className="w-4 h-4"/></button>
                  </div>
                  
                  <div className="overflow-y-auto space-y-3 pr-1 custom-scrollbar flex-1 mb-4">
                      {tools.map(tool => (
                          <div key={tool.id} className="flex items-center gap-2 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                              <span className="flex-1 block text-[10px] font-black text-gray-800">{tool.name}</span>
                              
                              <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-gray-200">
                                <span className="text-[9px] text-gray-400 font-bold">عظمى:</span>
                                <input 
                                    type="number" 
                                    value={tool.maxScore} 
                                    onChange={(e) => handleUpdateToolMax(tool.id, e.target.value)}
                                    className="w-10 text-center text-[10px] font-bold outline-none text-blue-600"
                                />
                              </div>
                              
                              <button onClick={(e) => handleDeleteTool(e, tool.id)} className="p-2 text-rose-500 bg-rose-50 rounded-lg hover:bg-rose-100"><Trash2 className="w-3.5 h-3.5"/></button>
                          </div>
                      ))}
                      {tools.length === 0 && <p className="text-center text-[10px] text-gray-400 py-4">لا توجد أدوات تقويم</p>}
                  </div>
                  
                  <div className="pt-2 border-t border-gray-100 shrink-0 space-y-3">
                      <button onClick={() => setIsAddingTool(!isAddingTool)} className="w-full py-3 bg-blue-600 text-white rounded-xl text-xs font-black">{isAddingTool ? 'إغلاق الإضافة' : 'إضافة أداة يدوياً'}</button>
                      {isAddingTool && (
                         <div className="mt-3 flex gap-2 animate-in fade-in slide-in-from-top-2">
                             <input type="text" placeholder="اسم الأداة" value={newToolName} onChange={e => setNewToolName(e.target.value)} className="flex-[2] bg-gray-50 rounded-xl px-3 text-xs font-bold outline-none border border-gray-200" />
                             <input type="number" placeholder="من" value={newToolMax} onChange={e => setNewToolMax(e.target.value)} className="flex-1 bg-gray-50 rounded-xl px-3 text-xs font-bold outline-none border border-gray-200 text-center" />
                             <button onClick={handleAddTool} className="bg-emerald-500 text-white p-3 rounded-xl"><Check className="w-4 h-4"/></button>
                         </div>
                      )}
                  </div>
              </div>
          </div>
      )}

      {showAddGrade && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[120] flex items-center justify-center p-4" onClick={() => setShowAddGrade(null)}>
          <div className="bg-white w-full max-w-md h-[90vh] md:h-auto md:max-h-[650px] rounded-[2rem] p-6 shadow-2xl flex flex-col relative" onClick={e => e.stopPropagation()}>
             
             <div className="flex justify-between items-center mb-4 shrink-0">
                <div>
                    <h3 className="font-black text-gray-900 text-sm">{editingGrade ? 'تعديل درجة' : 'رصد درجة جديدة'}</h3>
                    <p className="text-[10px] font-bold text-blue-600 mt-0.5">{showAddGrade.student.name}</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[9px] bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg font-black">{currentSemester === '1' ? 'ف1' : 'ف2'}</span>
                    <button onClick={() => setShowAddGrade(null)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X className="w-4 h-4"/></button>
                </div>
             </div>
             
             <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-1">
                 
                 {/* 1. Tool Selection */}
                 {!editingGrade && (
                    <div className="grid grid-cols-2 gap-2">
                        {tools.map(tool => (
                            <div key={tool.id} onClick={() => handleToolClick(tool)} className={`p-3 rounded-2xl border transition-all cursor-pointer relative ${selectedToolId === tool.id ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-gray-600 border-gray-100'}`}>
                                <span className="block text-[10px] font-black">{tool.name}</span>
                                <span className={`text-[9px] font-bold ${selectedToolId === tool.id ? 'text-blue-200' : 'text-gray-400'}`}>
                                    {tool.maxScore > 0 ? `من ${tool.maxScore}` : '(غير محدد)'}
                                </span>
                            </div>
                        ))}
                    </div>
                 )}

                 {/* 2. Input Area */}
                 <div className="bg-gray-50 rounded-[2rem] p-6 flex flex-col items-center justify-center border border-gray-100">
                    <div className="flex items-end gap-2">
                        <div className="text-center">
                            <input type="number" value={score} onChange={e => setScore(e.target.value)} placeholder="0" className="w-16 h-12 bg-white border-2 border-transparent focus:border-blue-500 rounded-xl text-center font-black text-xl text-blue-600 outline-none shadow-sm transition-all" autoFocus />
                            <label className="text-[9px] font-black text-gray-400 block mt-2">الدرجة</label>
                        </div>
                        <div className="pb-5 text-xl font-black text-gray-300">/</div>
                        <div className="text-center">
                             <input 
                                type="number" 
                                value={currentMaxScore} 
                                onChange={(e) => setCurrentMaxScore(e.target.value)}
                                className="w-16 h-12 bg-white/50 border-2 border-transparent focus:border-blue-500/50 rounded-xl text-center font-black text-xl text-gray-400 outline-none transition-all placeholder-gray-300"
                                placeholder="العظمى"
                             />
                             <label className="text-[9px] font-black text-gray-400 block mt-2">العظمى</label>
                        </div>
                    </div>
                 </div>

                 <button onClick={handleSaveGrade} disabled={!score} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-sm active:scale-95 shadow-lg shadow-blue-200 disabled:opacity-50 disabled:shadow-none transition-all">
                    {editingGrade ? 'حفظ التعديل' : 'رصد الدرجة'}
                 </button>
                 
                 {editingGrade && (
                     <button onClick={() => { setEditingGrade(null); setScore(''); }} className="w-full py-3 bg-gray-100 text-gray-500 rounded-2xl font-black text-xs">إلغاء التعديل</button>
                 )}

                 {/* 3. Grades List (History) */}
                 <div className="border-t border-gray-100 pt-4">
                    <h4 className="text-[10px] font-black text-gray-400 mb-3 flex items-center gap-2"><FileSpreadsheet className="w-3 h-3"/> الدرجات المرصودة ({currentSemester === '1' ? 'الفصل الأول' : 'الفصل الثاني'})</h4>
                    <div className="space-y-2">
                        {getSemesterGrades(showAddGrade.student, currentSemester).length > 0 ? getSemesterGrades(showAddGrade.student, currentSemester).map(g => (
                            <div key={g.id} className={`flex items-center justify-between p-3 rounded-2xl border ${editingGrade?.id === g.id ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200' : 'bg-white border-gray-50'}`}>
                                <div>
                                    <span className="block text-[10px] font-black text-gray-800">{g.category}</span>
                                    <span className="text-[9px] text-gray-400 font-bold">{new Date(g.date).toLocaleDateString('ar-EG')}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-black text-blue-600">{g.score}/{g.maxScore}</span>
                                    <div className="flex gap-1">
                                        <button onClick={() => handleEditGrade(g)} className="p-1.5 bg-gray-50 text-blue-500 rounded-lg hover:bg-blue-100"><Edit2 className="w-3.5 h-3.5" /></button>
                                        <button onClick={() => handleDeleteGrade(g.id)} className="p-1.5 bg-gray-50 text-rose-500 rounded-lg hover:bg-rose-100"><Trash2 className="w-3.5 h-3.5" /></button>
                                    </div>
                                </div>
                            </div>
                        )) : <p className="text-center text-[10px] text-gray-300 py-2">لا توجد درجات لهذا الفصل</p>}
                    </div>
                 </div>

             </div>

          </div>
        </div>
      )}

      {/* Preview Report Modal */}
      {showPreviewModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[140] flex items-center justify-center p-4" onClick={() => setShowPreviewModal(false)}>
              <div className="bg-white w-full max-w-4xl h-[90vh] md:max-h-[80vh] rounded-[2rem] p-6 shadow-2xl flex flex-col relative" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-4 shrink-0">
                      <h3 className="font-black text-gray-900 text-sm flex items-center gap-2">
                          <Eye className="w-4 h-4 text-emerald-600"/>
                          معاينة تقرير الدرجات ({currentSemester === '1' ? 'الفصل الأول' : 'الفصل الثاني'})
                      </h3>
                      <button onClick={() => setShowPreviewModal(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X className="w-4 h-4"/></button>
                  </div>
                  
                  <div className="flex-1 overflow-auto scrollbar-thin border border-gray-100 rounded-xl">
                      <table className="w-full text-right border-collapse">
                          <thead className="bg-gray-50 sticky top-0 z-10">
                              <tr>
                                  <th className="p-3 text-[10px] font-black text-gray-500 border-b border-gray-200 whitespace-nowrap">اسم الطالب</th>
                                  <th className="p-3 text-[10px] font-black text-gray-500 border-b border-gray-200 whitespace-nowrap">الفصل</th>
                                  {tools.map(tool => (
                                      <th key={tool.id} className="p-3 text-[10px] font-black text-gray-500 border-b border-gray-200 whitespace-nowrap text-center">
                                          {tool.name} <span className="text-[8px] text-gray-400">({tool.maxScore})</span>
                                      </th>
                                  ))}
                                  <th className="p-3 text-[10px] font-black text-blue-600 border-b border-gray-200 whitespace-nowrap text-center bg-blue-50/50">المجموع</th>
                                  <th className="p-3 text-[10px] font-black text-gray-500 border-b border-gray-200 whitespace-nowrap text-center">المستوى</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                              {filteredStudents.length > 0 ? filteredStudents.map(student => {
                                  const stats = calculateFullStats(student);
                                  const currentSemStats = currentSemester === '1' ? stats.sem1 : stats.sem2;
                                  
                                  const percentage = currentSemStats.max > 0 ? (currentSemStats.score / currentSemStats.max) * 100 : 0;
                                  let gradeSymbol = '-';
                                  let symbolColor = 'text-gray-400';
                                  
                                  if (currentSemStats.max > 0) {
                                      if (percentage >= 90) { gradeSymbol = 'أ'; symbolColor = 'text-emerald-600'; }
                                      else if (percentage >= 80) { gradeSymbol = 'ب'; symbolColor = 'text-blue-600'; }
                                      else if (percentage >= 65) { gradeSymbol = 'ج'; symbolColor = 'text-indigo-600'; }
                                      else if (percentage >= 50) { gradeSymbol = 'د'; symbolColor = 'text-amber-600'; }
                                      else { gradeSymbol = 'هـ'; symbolColor = 'text-rose-600'; }
                                  }

                                  return (
                                      <tr key={student.id} className="hover:bg-gray-50/50">
                                          <td className="p-3 text-[11px] font-bold text-gray-800">{student.name}</td>
                                          <td className="p-3 text-[10px] text-gray-500">{student.classes[0]}</td>
                                          {tools.map(tool => {
                                              const grade = student.grades.find(g => 
                                                  g.category === tool.name && 
                                                  (g.semester === currentSemester || (!g.semester && currentSemester === '1'))
                                              );
                                              return (
                                                  <td key={tool.id} className="p-3 text-[10px] font-bold text-center text-gray-600">
                                                      {grade ? grade.score : '-'}
                                                  </td>
                                              );
                                          })}
                                          <td className="p-3 text-[10px] font-black text-blue-700 text-center bg-blue-50/30">
                                              {currentSemStats.score}
                                          </td>
                                          <td className={`p-3 text-[10px] font-black text-center ${symbolColor}`}>
                                              {gradeSymbol}
                                          </td>
                                      </tr>
                                  );
                              }) : (
                                  <tr>
                                      <td colSpan={tools.length + 4} className="p-8 text-center text-xs text-gray-400 font-bold">
                                          لا يوجد طلاب للعرض
                                      </td>
                                  </tr>
                              )}
                          </tbody>
                      </table>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
                      <button onClick={() => setShowPreviewModal(false)} className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold text-xs hover:bg-gray-200">
                          إغلاق المعاينة
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default GradeBook;
