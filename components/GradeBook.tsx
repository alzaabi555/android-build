
import React, { useState, useEffect } from 'react';
import { Student, GradeRecord } from '../types';
import { Plus, Search, X, Trash2, Settings, Check, FileSpreadsheet, Loader2, Info, Edit2, Download, AlertTriangle, Eye, UploadCloud, Printer, PieChart } from 'lucide-react';
import * as XLSX from 'xlsx';
import Modal from './Modal';
import { useTheme } from '../context/ThemeContext';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

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

interface AssessmentTool {
    id: string;
    name: string;
    maxScore: number;
}

const GradeBook: React.FC<GradeBookProps> = ({ students, classes, onUpdateStudent, setStudents, currentSemester, onSemesterChange, teacherInfo }) => {
  const { theme, isLowPower } = useTheme();
  const [selectedClass, setSelectedClass] = useState(classes[0] || 'all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddGrade, setShowAddGrade] = useState<{ student: Student } | null>(null);
  const [editingGrade, setEditingGrade] = useState<GradeRecord | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  
  // Bulk Import State
  const [isImporting, setIsImporting] = useState(false);

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

  const styles = {
      card: isLowPower 
        ? 'bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-800 rounded-2xl'
        : 'bg-white dark:bg-white/5 p-3 rounded-2xl shadow-sm border border-gray-200 dark:border-white/5 backdrop-blur-md',
      pill: 'rounded-xl',
      header: isLowPower
        ? 'bg-white dark:bg-[#0f172a] border-b border-gray-200 dark:border-gray-800'
        : 'bg-white/80 dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-sm backdrop-blur-xl',
      toolBtn: 'rounded-xl border shadow-sm',
  };

  useEffect(() => {
     localStorage.setItem('assessmentTools', JSON.stringify(tools));
  }, [tools]);

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

  // --- Grading Logic Helpers ---
  const getGradeSymbol = (score: number, max: number) => {
    if (max === 0) return '-';
    const percentage = (score / max) * 100;
    if (percentage >= 90) return 'أ';
    if (percentage >= 80) return 'ب';
    if (percentage >= 65) return 'ج';
    if (percentage >= 50) return 'د';
    return 'هـ';
  };

  const getSemesterGrades = (student: Student, sem: '1' | '2') => {
      return (student.grades || []).filter(g => {
          if (!g.semester) return sem === '1';
          return g.semester === sem;
      });
  };

  const calculateStudentSemesterStats = (student: Student, sem: '1' | '2') => {
      const grades = getSemesterGrades(student, sem);
      const totalScore = grades.reduce((acc, g) => acc + (Number(g.score) || 0), 0);
      const totalMax = grades.reduce((acc, g) => acc + (Number(g.maxScore) || 0), 0);
      const symbol = getGradeSymbol(totalScore, totalMax);
      return { totalScore, totalMax, symbol };
  };

  const calculateFullStats = (student: Student) => {
    const sem1 = calculateStudentSemesterStats(student, '1');
    const sem2 = calculateStudentSemesterStats(student, '2');

    const totalScore = sem1.totalScore + sem2.totalScore;
    const totalMax = sem1.totalMax + sem2.totalMax;
    const totalPercent = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;
    
    return { sem1, sem2, totalScore, totalMax, totalPercent };
  };

  // --- Handlers ---

  const handleDeleteGrade = (gradeId: string) => {
    if(!showAddGrade) return;
    if(confirm('هل أنت متأكد من حذف هذه الدرجة؟')) {
        const updatedGrades = showAddGrade.student.grades.filter(g => g.id !== gradeId);
        const updatedStudent = { ...showAddGrade.student, grades: updatedGrades };
        onUpdateStudent(updatedStudent);
        setShowAddGrade({ student: updatedStudent });
    }
  };

  const handleDeleteAllGrades = () => {
    if (confirm('تحذير هام: سيتم حذف جميع درجات هذا الفصل. هل أنت متأكد؟')) {
        const updatedStudents = students.map(s => ({
            ...s,
            grades: s.grades.filter(g => g.semester !== currentSemester && (g.semester || currentSemester !== '1'))
        }));
        setStudents(updatedStudents);
        setTools([]);
        setEditingGrade(null);
        setShowAddGrade(null);
    }
  };

  const handleEditGrade = (grade: GradeRecord) => {
      setEditingGrade(grade);
      setScore(grade.score.toString());
      setCurrentMaxScore(grade.maxScore.toString());
      const tool = tools.find(t => t.name === grade.category);
      if(tool) setSelectedToolId(tool.id);
      else setSelectedToolId('');
  };

  const handleToolClick = (tool: AssessmentTool) => {
      setSelectedToolId(tool.id);
      if (tool.maxScore > 0) setCurrentMaxScore(tool.maxScore.toString());
      else setCurrentMaxScore('');
  };

  const handleSaveGrade = () => {
    if (!showAddGrade || score === '') return;
    if (!currentMaxScore || Number(currentMaxScore) <= 0) {
        alert('الرجاء إدخال الدرجة العظمى يدوياً بشكل صحيح');
        return;
    }
    const student = showAddGrade.student;
    let categoryName = 'درجة عامة';
    let maxVal = Number(currentMaxScore);
    if (selectedToolId) {
        const tool = tools.find(t => t.id === selectedToolId);
        if (tool) categoryName = tool.name;
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
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(sheet) as any[];

          if (jsonData.length === 0) throw new Error("الملف فارغ");

          // Audit: Trim headers to ensure matching
          const headers = Object.keys(jsonData[0]).map(h => h.trim());
          const nameKeywords = ['الاسم', 'name', 'student'];
          const nameKeyOriginal = Object.keys(jsonData[0]).find(h => nameKeywords.some(kw => h.toLowerCase().includes(kw)));
          
          if (!nameKeyOriginal) throw new Error("لم يتم العثور على عمود الاسم");

          const gradeKeys = headers.filter(h => h !== nameKeyOriginal.trim() && !h.toLowerCase().includes('phone') && !h.includes('رقم') && !h.includes('صف') && !h.includes('class'));

          const newTools: AssessmentTool[] = [];
          gradeKeys.forEach(key => {
              const exists = tools.some(t => t.name === key) || newTools.some(t => t.name === key);
              if (!exists) {
                  const maxMatch = key.match(/[(\[](\d+)[)\]]/);
                  const maxScore = maxMatch ? parseInt(maxMatch[1]) : 100;
                  
                  newTools.push({
                      id: Math.random().toString(36).substr(2, 9),
                      name: key,
                      maxScore
                  });
              }
          });

          if (newTools.length > 0) {
              setTools(prev => [...prev, ...newTools]);
          }

          let updatedStudents = [...students];
          let matchedCount = 0;

          jsonData.forEach(row => {
              const studentName = String(row[nameKeyOriginal] || '').trim();
              const studentIndex = updatedStudents.findIndex(s => s.name.trim() === studentName);
              
              if (studentIndex !== -1) {
                  matchedCount++;
                  const student = updatedStudents[studentIndex];
                  const newGrades: GradeRecord[] = [];

                  // Iterate over raw keys to match data, but use trimmed keys for Tools
                  Object.keys(row).forEach(rawKey => {
                      const cleanKey = rawKey.trim();
                      if (gradeKeys.includes(cleanKey)) {
                          const scoreVal = row[rawKey];
                          if (scoreVal !== undefined && scoreVal !== '' && !isNaN(Number(scoreVal))) {
                              const tool = [...tools, ...newTools].find(t => t.name === cleanKey);
                              let maxScore = tool ? tool.maxScore : 100;
                              
                              if (!tool) {
                                  const maxMatch = cleanKey.match(/[(\[](\d+)[)\]]/);
                                  if (maxMatch) maxScore = parseInt(maxMatch[1]);
                              }

                              const existingGradeIndex = student.grades.findIndex(g => g.category === cleanKey && g.semester === currentSemester);
                              if (existingGradeIndex === -1) {
                                  newGrades.push({
                                      id: Math.random().toString(36).substr(2, 9),
                                      subject: teacherInfo?.subject || 'General',
                                      category: cleanKey,
                                      score: Number(scoreVal),
                                      maxScore: maxScore,
                                      date: new Date().toISOString(),
                                      semester: currentSemester
                                  });
                              }
                          }
                      }
                  });
                  
                  if (newGrades.length > 0) {
                      updatedStudents[studentIndex] = {
                          ...student,
                          grades: [...student.grades, ...newGrades]
                      };
                  }
              }
          });

          setStudents(updatedStudents);
          alert(`تم استيراد الدرجات لـ ${matchedCount} طالب بنجاح.`);

      } catch (err: any) {
          console.error(err);
          alert(`فشل الاستيراد: ${err.message}`);
      } finally {
          setIsImporting(false);
          if (e.target) e.target.value = '';
      }
  };

  // --- Export Logic (PDF & Excel) ---

  const prepareClassStats = () => {
      const stats = { 'أ': 0, 'ب': 0, 'ج': 0, 'د': 0, 'هـ': 0, '-': 0 };
      const uniqueTools = new Set<string>();
      
      const rows = filteredStudents.map(s => {
          const semStats = calculateStudentSemesterStats(s, currentSemester);
          
          if (semStats.totalMax > 0) {
              const sym = semStats.symbol as keyof typeof stats;
              if (stats[sym] !== undefined) stats[sym]++;
          } else {
              stats['-']++;
          }

          const grades = getSemesterGrades(s, currentSemester);
          grades.forEach(g => uniqueTools.add(g.category));

          return {
              name: s.name,
              grades: grades,
              total: semStats.totalScore,
              max: semStats.totalMax,
              symbol: semStats.symbol
          };
      });

      return { stats, rows, uniqueTools: Array.from(uniqueTools) };
  };

  const handleExportGradeBook = async () => {
      const { stats, rows, uniqueTools } = prepareClassStats();
      
      const data = rows.map(r => {
          const rowObj: any = { 
              'الاسم': r.name, 
              'الفصل': selectedClass === 'all' ? 'متعدد' : selectedClass 
          };
          
          uniqueTools.forEach(tool => {
              const g = r.grades.find(gr => gr.category === tool);
              rowObj[tool] = g ? g.score : '-';
          });

          rowObj['المجموع'] = r.total;
          rowObj['الدرجة العظمى'] = r.max;
          rowObj['الرمز الحرفي'] = r.symbol;
          
          return rowObj;
      });

      const ws = XLSX.utils.json_to_sheet(data);
      
      // Calculate Percentages for Mirror Table
      const totalStudents = rows.length > 0 ? rows.length : 1;
      const getPerc = (count: number) => Math.round((count / totalStudents) * 100) + '%';

      // Append "Mirror of Results" (مرآة النتائج) with Percentages
      const startRow = data.length + 4;
      XLSX.utils.sheet_add_aoa(ws, [['مرآة النتائج (إحصائية الفصل)']], { origin: `A${startRow}` });
      XLSX.utils.sheet_add_aoa(ws, [['الرمز', 'العدد', 'النسبة']], { origin: `A${startRow + 1}` });
      XLSX.utils.sheet_add_aoa(ws, [['أ (90-100)', stats['أ'], getPerc(stats['أ'])]], { origin: `A${startRow + 2}` });
      XLSX.utils.sheet_add_aoa(ws, [['ب (80-89)', stats['ب'], getPerc(stats['ب'])]], { origin: `A${startRow + 3}` });
      XLSX.utils.sheet_add_aoa(ws, [['ج (65-79)', stats['ج'], getPerc(stats['ج'])]], { origin: `A${startRow + 4}` });
      XLSX.utils.sheet_add_aoa(ws, [['د (50-64)', stats['د'], getPerc(stats['د'])]], { origin: `A${startRow + 5}` });
      XLSX.utils.sheet_add_aoa(ws, [['هـ (<50)', stats['هـ'], getPerc(stats['هـ'])]], { origin: `A${startRow + 6}` });

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, `سجل_فصل_${currentSemester}`);
      XLSX.writeFile(wb, `سجل_الدرجات_${selectedClass}_ف${currentSemester}.xlsx`);
  };

  const handlePrintClassReport = async () => {
      setIsGeneratingPdf(true);
      const { stats, rows, uniqueTools } = prepareClassStats();
      
      const element = document.createElement('div');
      element.setAttribute('dir', 'rtl');
      element.style.fontFamily = 'Tajawal, sans-serif';
      element.style.padding = '20px';
      element.style.backgroundColor = 'white';
      element.style.color = 'black';

      const thStyle = "border: 1px solid #000; padding: 8px; background-color: #f3f4f6; font-weight: bold; font-size: 12px;";
      const tdStyle = "border: 1px solid #000; padding: 8px; font-size: 12px; text-align: center;";

      const toolHeaders = uniqueTools.map(t => `<th style="${thStyle}">${t}</th>`).join('');
      const studentRows = rows.map((r, i) => {
          const toolCells = uniqueTools.map(t => {
              const g = r.grades.find(gr => gr.category === t);
              return `<td style="${tdStyle}">${g ? g.score : '-'}</td>`;
          }).join('');
          
          return `<tr>
              <td style="${tdStyle}">${i + 1}</td>
              <td style="${tdStyle}; text-align: right;">${r.name}</td>
              ${toolCells}
              <td style="${tdStyle}; font-weight: bold;">${r.total}</td>
              <td style="${tdStyle}; font-weight: bold;">${r.symbol}</td>
          </tr>`;
      }).join('');

      element.innerHTML = `
        <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="margin: 0 0 10px 0; font-size: 24px; font-weight: bold;">تقرير الأداء الفصلي لمادة ${teacherInfo?.subject || '.....'}</h2>
            <div style="display: flex; justify-content: space-between; font-size: 14px; font-weight: bold; border-bottom: 2px solid #000; padding-bottom: 15px;">
                <span>المحافظة: ${teacherInfo?.governorate || '.....'}</span>
                <span>المدرسة: ${teacherInfo?.school || '.....'}</span>
                <span>المعلم: ${teacherInfo?.name || '.....'}</span>
                <span>الفصل الدراسي: ${currentSemester}</span>
                <span>الصف: ${selectedClass === 'all' ? 'متعدد' : selectedClass}</span>
            </div>
        </div>

        <h3 style="margin-bottom: 10px; font-size: 16px; font-weight: bold;">أولاً: كشف الدرجات</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px;">
            <thead>
                <tr>
                    <th style="${thStyle}; width: 40px;">#</th>
                    <th style="${thStyle}; text-align: right;">اسم الطالب</th>
                    ${toolHeaders}
                    <th style="${thStyle}; background-color: #e5e7eb;">المجموع</th>
                    <th style="${thStyle}; background-color: #e5e7eb;">الرمز</th>
                </tr>
            </thead>
            <tbody>
                ${studentRows}
            </tbody>
        </table>

        <div style="page-break-inside: avoid;">
            <h3 style="margin-bottom: 10px; font-size: 16px; font-weight: bold;">ثانياً: مرآة النتائج (إحصائية المستويات)</h3>
            <table style="width: 60%; margin: 0 auto; border-collapse: collapse;">
                <thead>
                    <tr>
                        <th style="${thStyle}">الرمز (المستوى)</th>
                        <th style="${thStyle}">المدى</th>
                        <th style="${thStyle}">عدد الطلاب</th>
                        <th style="${thStyle}">النسبة</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td style="${tdStyle}; font-weight:bold;">أ (ممتاز)</td><td style="${tdStyle}">90 - 100</td><td style="${tdStyle}">${stats['أ']}</td><td style="${tdStyle}">${rows.length ? Math.round((stats['أ']/rows.length)*100) : 0}%</td></tr>
                    <tr><td style="${tdStyle}; font-weight:bold;">ب (جيد جداً)</td><td style="${tdStyle}">80 - 89</td><td style="${tdStyle}">${stats['ب']}</td><td style="${tdStyle}">${rows.length ? Math.round((stats['ب']/rows.length)*100) : 0}%</td></tr>
                    <tr><td style="${tdStyle}; font-weight:bold;">ج (جيد)</td><td style="${tdStyle}">65 - 79</td><td style="${tdStyle}">${stats['ج']}</td><td style="${tdStyle}">${rows.length ? Math.round((stats['ج']/rows.length)*100) : 0}%</td></tr>
                    <tr><td style="${tdStyle}; font-weight:bold;">د (مقبول)</td><td style="${tdStyle}">50 - 64</td><td style="${tdStyle}">${stats['د']}</td><td style="${tdStyle}">${rows.length ? Math.round((stats['د']/rows.length)*100) : 0}%</td></tr>
                    <tr><td style="${tdStyle}; font-weight:bold; color: red;">هـ (يحتاج مساعدة)</td><td style="${tdStyle}">أقل من 50</td><td style="${tdStyle}">${stats['هـ']}</td><td style="${tdStyle}">${rows.length ? Math.round((stats['هـ']/rows.length)*100) : 0}%</td></tr>
                </tbody>
            </table>
        </div>
      `;

      const opt = {
        margin: 10,
        filename: `تقرير_فصل_${selectedClass}_${currentSemester}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
      };

      try {
        const worker = html2pdf().set(opt).from(element).toPdf();
        if (Capacitor.isNativePlatform()) {
             const pdfBase64 = await worker.output('datauristring');
             const base64Data = pdfBase64.split(',')[1];
             const result = await Filesystem.writeFile({ path: opt.filename, data: base64Data, directory: Directory.Cache });
             await Share.share({ title: opt.filename, url: result.uri });
        } else {
             worker.save();
        }
      } catch (err) {
          console.error(err);
          alert('حدث خطأ أثناء إنشاء التقرير');
      } finally {
          setIsGeneratingPdf(false);
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
          if (selectedToolId === id) setCurrentMaxScore(val.toString());
      }
  };

  return (
    <div className="space-y-4 pb-20 text-slate-900 dark:text-white">
      <div className="flex flex-col gap-3">
          <div className={`${isLowPower ? 'bg-white dark:bg-white/10' : 'bg-white/80 dark:bg-white/5 border border-gray-200 dark:border-white/10'} p-1 rounded-2xl shadow-sm flex`}>
             <button onClick={() => onSemesterChange('1')} className={`flex-1 py-2.5 ${styles.pill} text-xs font-black transition-all ${currentSemester === '1' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 dark:text-white/40 hover:bg-gray-100 dark:hover:bg-white/5'}`}>فصل 1</button>
             <button onClick={() => onSemesterChange('2')} className={`flex-1 py-2.5 ${styles.pill} text-xs font-black transition-all ${currentSemester === '2' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 dark:text-white/40 hover:bg-gray-100 dark:hover:bg-white/5'}`}>فصل 2</button>
          </div>

          <div className={`${styles.header} p-4 rounded-[2rem] flex flex-wrap items-center gap-3 transition-all duration-300`}>
             <div className="flex items-center gap-2 min-w-[150px]">
                 <h2 className="text-xs font-black text-slate-900 dark:text-white whitespace-nowrap">السجل</h2>
                 <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="bg-gray-100 dark:bg-black/20 border-gray-200 dark:border-white/10 rounded-lg px-2 py-1 text-[10px] font-bold outline-none border text-slate-900 dark:text-white">
                    <option value="all" className="text-black">كل الفصول</option>
                    {classes.map(c => <option key={c} value={c} className="text-black">{c}</option>)}
                 </select>
             </div>
             
             {/* Toolbar Buttons */}
             <div className="flex items-center justify-between flex-1 gap-4">
                 <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                     <label className={`px-3 py-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 active:scale-95 transition-all flex items-center gap-1 shrink-0 cursor-pointer ${styles.toolBtn}`}>
                         {isImporting ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <UploadCloud className="w-3.5 h-3.5" />}
                         <span className="text-[9px] font-black hidden sm:inline">استيراد</span>
                         <input type="file" accept=".xlsx, .csv" className="hidden" onChange={handleBulkImport} disabled={isImporting} />
                     </label>
                     <button onClick={() => setShowToolsManager(true)} className={`px-3 py-2 bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-500/30 active:scale-95 transition-all flex items-center gap-1 shrink-0 ${styles.toolBtn}`}><Settings className="w-3.5 h-3.5" /><span className="text-[9px] font-black hidden sm:inline">أدوات</span></button>
                     
                     <div className="flex bg-gray-100 dark:bg-white/5 rounded-xl p-0.5 border border-gray-200 dark:border-white/10">
                        <button onClick={handleExportGradeBook} className={`px-3 py-1.5 text-indigo-700 dark:text-indigo-300 hover:bg-white dark:hover:bg-white/10 rounded-lg active:scale-95 transition-all flex items-center gap-1 shrink-0`} title="تصدير Excel"><Download className="w-3.5 h-3.5" /><span className="text-[9px] font-black hidden sm:inline">Excel</span></button>
                        <button onClick={handlePrintClassReport} disabled={isGeneratingPdf} className={`px-3 py-1.5 text-rose-700 dark:text-rose-300 hover:bg-white dark:hover:bg-white/10 rounded-lg active:scale-95 transition-all flex items-center gap-1 shrink-0`} title="طباعة تقرير PDF">{isGeneratingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Printer className="w-3.5 h-3.5" />}<span className="text-[9px] font-black hidden sm:inline">PDF</span></button>
                     </div>
                 </div>

                 <div>
                     <button onClick={handleDeleteAllGrades} className={`px-3 py-2 bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-200 hover:bg-rose-200 dark:hover:bg-rose-500/30 active:scale-95 transition-all flex items-center gap-1 shrink-0 ${styles.toolBtn}`} title="حذف الكل">
                         <Trash2 className="w-3.5 h-3.5" />
                     </button>
                 </div>
             </div>
          </div>

          <div className="relative">
             <Search className="absolute right-3 top-3 w-4 h-4 text-slate-400 dark:text-white/30" />
             <input type="text" placeholder="ابحث عن طالب..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full py-2.5 pr-9 pl-4 text-xs font-bold outline-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:border-indigo-500 transition-all bg-white dark:bg-black/20 rounded-xl border border-gray-300 dark:border-white/10 shadow-sm dark:shadow-inner" />
          </div>
      </div>

      <div className="space-y-2">
        {filteredStudents.length > 0 ? filteredStudents.map(student => {
          const stats = calculateFullStats(student);
          const currentSemStats = currentSemester === '1' ? stats.sem1 : stats.sem2;
          
          return (
            <div key={student.id} onClick={() => { setEditingGrade(null); setShowAddGrade({ student }); }} className={`p-3 flex flex-col gap-2 hover:bg-gray-50 dark:hover:bg-white/10 active:scale-[0.99] transition-all cursor-pointer ${styles.card}`}>
              <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-black text-white shadow-lg ${stats.totalPercent >= 50 ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-rose-500 shadow-rose-500/20'}`}>{stats.totalPercent}%</div>
                     <div>
                         <h4 className="text-[11px] font-black text-slate-900 dark:text-white">{student.name}</h4>
                         <span className="text-[9px] text-slate-500 dark:text-white/40 font-bold">{student.classes[0]}</span>
                     </div>
                  </div>
                  <button className="w-8 h-8 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30 rounded-full flex items-center justify-center"><Plus className="w-4 h-4" /></button>
              </div>
              <div className="flex gap-1 mt-1 p-2 text-center bg-gray-50 dark:bg-black/20 rounded-xl border border-gray-100 dark:border-white/5">
                  <div className="flex-1 border-l border-gray-200 dark:border-white/10">
                      <span className="block text-[8px] text-slate-400 dark:text-white/40 font-bold">مجموع (ف{currentSemester})</span>
                      <span className="block text-[10px] font-black text-slate-800 dark:text-white">{currentSemStats.totalScore}</span>
                  </div>
                  <div className="flex-1 border-l border-gray-200 dark:border-white/10">
                      <span className="block text-[8px] text-slate-400 dark:text-white/40 font-bold">التقدير (ف{currentSemester})</span>
                      <span className={`block text-[10px] font-black ${currentSemStats.symbol === 'هـ' ? 'text-rose-500' : 'text-emerald-500'}`}>{currentSemStats.symbol}</span>
                  </div>
                  <div className="flex-1">
                      <span className="block text-[8px] text-blue-500 dark:text-blue-400 font-bold">التراكمي</span>
                      <span className="block text-[10px] font-black text-blue-600 dark:text-blue-300">{stats.totalScore}</span>
                  </div>
              </div>
            </div>
          );
        }) : <div className="text-center py-10 text-slate-400 dark:text-white/30 text-xs font-bold bg-gray-50 dark:bg-white/5 rounded-2xl border border-dashed border-gray-200 dark:border-white/10">لا يوجد طلاب</div>}
      </div>

      {/* Tools Manager Modal */}
      <Modal isOpen={showToolsManager} onClose={() => setShowToolsManager(false)} className="rounded-[28px]">
          <div className="flex justify-between items-center mb-2 shrink-0">
              <h3 className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2"><Settings className="w-4 h-4 text-blue-500"/> أدوات التقويم</h3>
              <button onClick={() => setShowToolsManager(false)} className="p-2 bg-slate-100 dark:bg-white/10 rounded-full hover:bg-slate-200 dark:hover:bg-white/20"><X className="w-4 h-4 text-slate-500 dark:text-white/70"/></button>
          </div>
          
          <div className="space-y-2 pr-1 border-t border-b border-gray-200 dark:border-white/10 py-2">
              {tools.map(tool => (
                  <div key={tool.id} className="flex items-center gap-2 bg-white dark:bg-white/5 p-2 rounded-xl border border-gray-200 dark:border-white/10">
                      <span className="flex-1 block text-[10px] font-black text-slate-900 dark:text-white">{tool.name}</span>
                      <div className="flex items-center gap-1 bg-gray-50 dark:bg-black/20 px-2 py-1 rounded-lg border border-gray-200 dark:border-white/10">
                        <span className="text-[9px] text-slate-500 dark:text-white/40 font-bold">عظمى:</span>
                        <input type="number" value={tool.maxScore} onChange={(e) => handleUpdateToolMax(tool.id, e.target.value)} className="w-8 text-center text-[10px] font-bold outline-none text-blue-600 dark:text-blue-300 bg-transparent" />
                      </div>
                      <button onClick={(e) => handleDeleteTool(e, tool.id)} className="p-1.5 text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-500/20 border border-rose-100 dark:border-rose-500/20"><Trash2 className="w-3 h-3"/></button>
                  </div>
              ))}
              {tools.length === 0 && <p className="text-center text-[10px] text-slate-400 dark:text-white/40">لا توجد أدوات</p>}
          </div>
          
          <div className="space-y-2 shrink-0">
              <button onClick={() => setIsAddingTool(!isAddingTool)} className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-500/30">{isAddingTool ? 'إغلاق الإضافة' : 'إضافة أداة يدوياً'}</button>
              {isAddingTool && (
                 <div className="flex gap-2">
                     <input type="text" placeholder="الاسم" value={newToolName} onChange={e => setNewToolName(e.target.value)} className="flex-[2] bg-slate-50 dark:bg-black/20 text-slate-900 dark:text-white rounded-xl px-2 text-xs border border-gray-200 dark:border-white/10 outline-none focus:border-blue-500" />
                     <input type="number" placeholder="Max" value={newToolMax} onChange={e => setNewToolMax(e.target.value)} className="flex-1 bg-slate-50 dark:bg-black/20 text-slate-900 dark:text-white rounded-xl px-2 text-xs border border-gray-200 dark:border-white/10 text-center outline-none focus:border-blue-500" />
                     <button onClick={handleAddTool} className="bg-emerald-600 text-white p-2 rounded-xl"><Check className="w-4 h-4"/></button>
                 </div>
              )}
          </div>
      </Modal>

      {/* Add Grade Modal */}
      <Modal isOpen={!!showAddGrade} onClose={() => setShowAddGrade(null)} className="rounded-[28px]">
         <div className="flex justify-between items-center shrink-0">
            <div>
                <h3 className="font-black text-slate-900 dark:text-white text-sm">{editingGrade ? 'تعديل درجة' : 'رصد درجة'}</h3>
                <p className="text-[10px] font-bold text-blue-500 dark:text-blue-300">{showAddGrade?.student.name}</p>
            </div>
            <button onClick={() => setShowAddGrade(null)} className="p-2 bg-slate-100 dark:bg-white/10 rounded-full hover:bg-slate-200 dark:hover:bg-white/20"><X className="w-4 h-4 text-slate-500 dark:text-white/70"/></button>
         </div>
         
         <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
             {!editingGrade && (
                <div className="grid grid-cols-2 gap-2">
                    {tools.map(tool => (
                        <div key={tool.id} onClick={() => handleToolClick(tool)} className={`p-2 rounded-xl border cursor-pointer text-center transition-all ${selectedToolId === tool.id ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/30' : 'bg-slate-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-slate-600 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10'}`}>
                            <span className="block text-[10px] font-black">{tool.name}</span>
                        </div>
                    ))}
                </div>
             )}

             <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-4 flex items-end justify-center gap-2 border border-gray-200 dark:border-white/10">
                <div className="text-center"><input type="number" value={score} onChange={e => setScore(e.target.value)} placeholder="0" className="w-16 h-10 bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-xl text-center font-black text-lg text-blue-600 dark:text-blue-300 outline-none focus:border-blue-500" autoFocus /><span className="text-[9px] block text-slate-400 dark:text-white/40 mt-1">الدرجة</span></div>
                <span className="pb-4 text-slate-300 dark:text-white/20">/</span>
                <div className="text-center"><input type="number" value={currentMaxScore} onChange={(e) => setCurrentMaxScore(e.target.value)} className="w-16 h-10 bg-slate-100 dark:bg-black/20 border border-transparent dark:border-white/5 rounded-xl text-center font-black text-lg text-slate-500 dark:text-white/50 outline-none" placeholder="Max" /><span className="text-[9px] block text-slate-400 dark:text-white/40 mt-1">العظمى</span></div>
             </div>

             <button onClick={handleSaveGrade} disabled={!score} className="w-full py-3 bg-blue-600 text-white rounded-xl font-black text-xs shadow-lg shadow-blue-500/30 active:scale-95 transition-all disabled:opacity-50">حفظ</button>
             
             <div className="border-t border-gray-200 dark:border-white/10 pt-2">
                <h4 className="text-[9px] font-black text-slate-400 dark:text-white/40 mb-2">سجل درجات الفصل {currentSemester}</h4>
                <div className="space-y-1 max-h-[100px] overflow-y-auto">
                    {showAddGrade && getSemesterGrades(showAddGrade.student, currentSemester).map(g => (
                        <div key={g.id} className="flex justify-between items-center p-2 bg-white dark:bg-white/5 rounded-lg text-[9px] border border-gray-200 dark:border-white/5">
                            <span className="font-bold text-slate-700 dark:text-white/80">{g.category}</span>
                            <div className="flex items-center gap-2">
                                <span className="font-black text-blue-600 dark:text-blue-300">{g.score}/{g.maxScore}</span>
                                <button onClick={() => handleEditGrade(g)} className="text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-white"><Edit2 className="w-3 h-3"/></button>
                                <button onClick={() => handleDeleteGrade(g.id)} className="text-rose-500 dark:text-rose-400 hover:text-rose-700 dark:hover:text-white"><Trash2 className="w-3 h-3"/></button>
                            </div>
                        </div>
                    ))}
                </div>
             </div>
         </div>
      </Modal>
    </div>
  );
};

export default GradeBook;
