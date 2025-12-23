import React, { useState, useEffect } from 'react';
import { Student, GradeRecord } from '../types';
import { Plus, Search, X, Trash2, Save, PieChart, FileSpreadsheet, Loader2, Info, Settings, Check, Calculator, CalendarRange } from 'lucide-react';
import * as XLSX from 'xlsx';

interface GradeBookProps {
  students: Student[];
  classes: string[];
  onUpdateStudent: (s: Student) => void;
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
  currentSemester: '1' | '2';
  onSemesterChange: (sem: '1' | '2') => void;
}

interface AssessmentTool {
    id: string;
    name: string;
    maxScore: number;
}

const GradeBook: React.FC<GradeBookProps> = ({ students, classes, onUpdateStudent, setStudents, currentSemester, onSemesterChange }) => {
  const [selectedClass, setSelectedClass] = useState(classes[0] || 'all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddGrade, setShowAddGrade] = useState<{ student: Student; existingGrade?: GradeRecord } | null>(null);
  
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
  const [currentMaxScore, setCurrentMaxScore] = useState('10'); 

  useEffect(() => {
     localStorage.setItem('assessmentTools', JSON.stringify(tools));
  }, [tools]);

  useEffect(() => {
     if (showAddGrade && tools.length > 0 && !selectedToolId) {
         setSelectedToolId(tools[0].id);
         setCurrentMaxScore(tools[0].maxScore.toString());
     }
  }, [showAddGrade, tools]);

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = selectedClass === 'all' || s.classes?.includes(selectedClass);
    return matchesSearch && matchesClass;
  });

  // Calculate Total Sum of Tools Max Score
  const toolsTotalMax = tools.reduce((acc, t) => acc + Number(t.maxScore), 0);

  // --- Tool Management Functions ---

  const handleAddTool = () => {
      if (newToolName.trim() && newToolMax) {
          const newTool: AssessmentTool = {
              id: Math.random().toString(36).substr(2, 9),
              name: newToolName.trim(),
              maxScore: Number(newToolMax)
          };
          setTools(prev => [...prev, newTool]);
          
          // If adding from modal select it immediately
          if (showAddGrade) {
            setSelectedToolId(newTool.id);
            setCurrentMaxScore(newTool.maxScore.toString());
          }

          setIsAddingTool(false);
          setNewToolName('');
          setNewToolMax('');
      }
  };

  const handleUpdateToolMaxScore = (toolId: string, newMax: number) => {
    if (newMax <= 0) return;
    
    // 1. Update the tool definition
    const updatedTools = tools.map(t => t.id === toolId ? { ...t, maxScore: newMax } : t);
    setTools(updatedTools);
    
    const toolName = tools.find(t => t.id === toolId)?.name;
    if (!toolName) return;

    if (confirm(`هل تريد تحديث الدرجة العظمى لجميع الطلاب في "${toolName}" لتصبح ${newMax}؟\nسيتم إعادة حساب النسبة المئوية تلقائياً.`)) {
        // Deep update of students
        setStudents(prevStudents => {
            return prevStudents.map(student => {
                const hasGrade = student.grades.some(g => g.category === toolName);
                if (!hasGrade) return student;

                const newGrades = student.grades.map(grade => {
                    if (grade.category === toolName) {
                        return { ...grade, maxScore: newMax };
                    }
                    return grade;
                });

                return { ...student, grades: newGrades };
            });
        });
        alert('تم تحديث الدرجات والمجموع الكلي بنجاح');
    }
  };

  const handleDeleteTool = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (confirm('هل أنت متأكد من حذف أداة التقويم هذه؟ لن يتم حذف الدرجات المرصودة سابقاً.')) {
          setTools(prev => prev.filter(t => t.id !== id));
          if (selectedToolId === id) {
              setSelectedToolId('');
              setCurrentMaxScore('');
          }
      }
  };

  const handleToolSelection = (tool: AssessmentTool) => {
      setSelectedToolId(tool.id);
      setCurrentMaxScore(tool.maxScore.toString());
  };

  const handleSaveGrade = () => {
    if (!showAddGrade || score === '' || !selectedToolId) return;
    const student = showAddGrade.student;
    
    const tool = tools.find(t => t.id === selectedToolId);
    const categoryName = tool ? tool.name : 'درجة عامة';
    const maxVal = tool ? tool.maxScore : Number(currentMaxScore);

    const newGrade: GradeRecord = {
        id: Math.random().toString(36).substr(2, 9),
        subject: 'المادة',
        category: categoryName,
        score: Number(score),
        maxScore: maxVal,
        date: new Date().toISOString(),
        semester: currentSemester
    };
    
    // Remove existing grade for same category in same semester if exists
    const filteredGrades = (student.grades || []).filter(
        g => !(g.category === categoryName && (g.semester === currentSemester || (!g.semester && currentSemester === '1')))
    );

    const updatedGrades = [newGrade, ...filteredGrades];
    onUpdateStudent({ ...student, grades: updatedGrades });

    setShowAddGrade(null);
    setScore('');
  };

  // --- دالة الاستيراد ---
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
      let headerRowIndex = -1;
      let headers: string[] = [];

      for (let i = 0; i < Math.min(rawData.length, 30); i++) {
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
      const ignoreKeywords = ['رقم', 'م.', 'ملاحظات', 'الجنس', 'الهاتف', 'gender', 'mobile', 'id', 'notes'];

      const gradeColIndices: number[] = [];
      headers.forEach((h, idx) => {
          if (idx === nameColIndex || !h) return;
          if (ignoreKeywords.some(kw => h.toLowerCase().includes(kw))) return;
          gradeColIndices.push(idx);
      });

      const colMaxValues: Record<number, number> = {};
      for (let i = headerRowIndex + 1; i < rawData.length; i++) {
          const row = rawData[i];
          if(!row) continue;
          gradeColIndices.forEach(colIdx => {
             const val = parseFloat(row[colIdx]);
             if (!isNaN(val)) {
                 colMaxValues[colIdx] = Math.max(colMaxValues[colIdx] || 0, val);
             }
          });
      }

      let updatedCount = 0;
      const updatedStudents = [...students];
      const currentTools = [...tools];

      const findOrCreateTool = (toolName: string, observedMax: number): number => {
          const cleanName = toolName.trim();
          const existing = currentTools.find(t => t.name.trim() === cleanName);
          if (existing) return existing.maxScore;
          
          const smartMax = Math.max(10, Math.ceil(observedMax));
          const newTool = {
              id: Math.random().toString(36).substr(2, 9),
              name: cleanName,
              maxScore: smartMax
          };
          currentTools.push(newTool);
          return smartMax;
      };

      for (let i = headerRowIndex + 1; i < rawData.length; i++) {
          const row = rawData[i];
          if (!row) continue;
          const studentName = String(row[nameColIndex] || '').trim();
          if (!studentName || studentName.length < 3) continue;

          const studentIndex = updatedStudents.findIndex(s => s.name.trim() === studentName);

          if (studentIndex > -1) {
              let gradesAdded = 0;
              gradeColIndices.forEach(colIdx => {
                  const cellValue = row[colIdx];
                  if (cellValue !== undefined && cellValue !== null && String(cellValue).trim() !== '') {
                      const numericScore = parseFloat(String(cellValue));
                      if (!isNaN(numericScore)) {
                          const toolName = headers[colIdx];
                          const maxScore = findOrCreateTool(toolName, colMaxValues[colIdx] || 10);

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
                          updatedStudents[studentIndex] = {
                              ...updatedStudents[studentIndex],
                              grades: [newGrade, ...currentGrades]
                          };
                          gradesAdded++;
                      }
                  }
              });
              if (gradesAdded > 0) updatedCount++;
          }
      }

      if (updatedCount > 0) {
          setStudents(updatedStudents);
          setTools(currentTools);
          alert(`تم استيراد ${updatedCount} سجل للفصل الدراسي ${currentSemester === '1' ? 'الأول' : 'الثاني'}.`);
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

  // Helper to filter grades by current semester
  const getSemesterGrades = (student: Student) => {
      return (student.grades || []).filter(g => {
          if (!g.semester) return currentSemester === '1'; // Default to 1 if missing
          return g.semester === currentSemester;
      });
  };

  const calculateTotal = (student: Student) => {
    const grades = getSemesterGrades(student);
    if (grades.length === 0) return 0;
    const earned = grades.reduce((a, b) => a + b.score, 0);
    const total = grades.reduce((a, b) => a + b.maxScore, 0);
    return total > 0 ? Math.round((earned / total) * 100) : 0;
  };

  const getStudentStats = (student: Student) => {
      const grades = getSemesterGrades(student);
      const earned = grades.reduce((a, b) => a + b.score, 0);
      const total = grades.reduce((a, b) => a + b.maxScore, 0);
      return { earned, total, count: grades.length };
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="flex flex-col gap-3 sticky top-0 bg-[#f2f2f7] pt-2 pb-2 z-10">
          
          {/* Semester Toggle */}
          <div className="bg-white p-1 rounded-2xl shadow-sm border border-gray-100 flex">
             <button 
                onClick={() => onSemesterChange('1')} 
                className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${currentSemester === '1' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}
             >
                الفصل الدراسي الأول
             </button>
             <button 
                onClick={() => onSemesterChange('2')} 
                className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all ${currentSemester === '2' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:bg-gray-50'}`}
             >
                الفصل الدراسي الثاني
             </button>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between gap-3">
             <div className="flex items-center gap-2 flex-1">
                 <h2 className="text-xs font-black text-gray-900 whitespace-nowrap">سجل الدرجات</h2>
                 <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="bg-gray-50 rounded-lg px-2 py-1 text-[10px] font-black outline-none border-none">
                    <option value="all">كل الفصول</option>
                    {classes.map(c => <option key={c} value={c}>{c}</option>)}
                 </select>
             </div>
             
             <div className="flex items-center gap-2">
                 {/* Tools Manager Button */}
                 <button 
                    onClick={() => setShowToolsManager(true)} 
                    className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 active:scale-95 transition-all"
                    title="إدارة أدوات التقويم"
                 >
                    <Settings className="w-4 h-4" />
                 </button>

                 {/* Import Button */}
                 <button onClick={() => setShowImportInfo(!showImportInfo)} className="p-2 bg-gray-50 text-gray-400 rounded-xl hover:bg-gray-100"><Info className="w-4 h-4" /></button>
                 <label className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-3 py-2 rounded-xl text-[10px] font-black cursor-pointer hover:bg-emerald-100 active:scale-95 transition-all">
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
                      <li>يتم الكشف عن <strong>الدرجة العظمى</strong> تلقائياً.</li>
                  </ul>
              </div>
          )}

          <div className="relative">
             <Search className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
             <input type="text" placeholder="ابحث عن طالب..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-white rounded-xl py-2.5 pr-9 pl-4 text-xs font-bold outline-none border-none shadow-sm" />
          </div>
      </div>

      {/* Students List */}
      <div className="space-y-2">
        {filteredStudents.length > 0 ? filteredStudents.map(student => {
          const stats = getStudentStats(student);
          return (
            <div key={student.id} onClick={() => setShowAddGrade({ student })} className="bg-white p-3 rounded-2xl shadow-sm border border-gray-50 flex items-center justify-between active:bg-blue-50 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                 <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[11px] font-black text-white shadow-sm ${calculateTotal(student) >= 50 ? 'bg-emerald-500' : 'bg-rose-500'}`}>{calculateTotal(student)}%</div>
                 <div>
                    <h4 className="text-[11px] font-black text-gray-900">{student.name}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] text-gray-400 font-bold">{stats.count} تقييمات</span>
                        {stats.total > 0 && (
                            <>
                                <span className="text-gray-300 text-[8px]">•</span>
                                <span className="text-[9px] font-black text-blue-600">المجموع: {stats.earned}/{stats.total}</span>
                            </>
                        )}
                    </div>
                 </div>
              </div>
              <button className="w-8 h-8 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center"><Plus className="w-4 h-4" /></button>
            </div>
          );
        }) : <div className="text-center py-10 text-gray-400 text-xs font-bold">لا يوجد طلاب</div>}
      </div>

      {/* Tools Manager Modal */}
      {showToolsManager && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[130] flex items-center justify-center p-6" onClick={() => setShowToolsManager(false)}>
              <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-6 shadow-2xl relative flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-6 shrink-0">
                      <h3 className="font-black text-gray-900 text-sm flex items-center gap-2"><Settings className="w-4 h-4 text-blue-600"/> إدارة أدوات التقويم</h3>
                      <button onClick={() => setShowToolsManager(false)} className="p-2 bg-gray-100 rounded-full"><X className="w-4 h-4"/></button>
                  </div>
                  
                  <div className="overflow-y-auto space-y-3 pr-1 custom-scrollbar flex-1 mb-4">
                      {tools.length > 0 ? tools.map(tool => (
                          <div key={tool.id} className="flex items-center gap-2 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                              <div className="flex-1">
                                  <span className="block text-[10px] font-black text-gray-800">{tool.name}</span>
                              </div>
                              <div className="flex items-center gap-1 bg-white rounded-lg px-2 py-1 border border-gray-200">
                                  <span className="text-[9px] text-gray-400 font-bold">من</span>
                                  <input 
                                    id={`tool-input-${tool.id}`}
                                    type="number" 
                                    className="w-10 text-center text-xs font-black text-blue-600 outline-none" 
                                    defaultValue={tool.maxScore}
                                  />
                              </div>
                              <button 
                                onClick={() => {
                                    const input = document.getElementById(`tool-input-${tool.id}`) as HTMLInputElement;
                                    if(input) {
                                        const val = Number(input.value);
                                        if (val > 0) handleUpdateToolMaxScore(tool.id, val);
                                    }
                                }}
                                className="p-2 text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
                              >
                                <Save className="w-3.5 h-3.5"/>
                              </button>
                              <button onClick={(e) => handleDeleteTool(e, tool.id)} className="p-2 text-rose-500 bg-rose-50 rounded-lg hover:bg-rose-100"><Trash2 className="w-3.5 h-3.5"/></button>
                          </div>
                      )) : <p className="text-center text-[10px] text-gray-400 py-4">لا توجد أدوات تقويم محفوظة</p>}
                  </div>
                  
                  <div className="pt-2 border-t border-gray-100 shrink-0 space-y-3">
                      <div className="flex items-center justify-between bg-gray-900 text-white p-3 rounded-xl">
                          <div className="flex items-center gap-2">
                              <Calculator className="w-4 h-4 text-emerald-400" />
                              <span className="text-[10px] font-bold">المجموع الكلي:</span>
                          </div>
                          <span className="text-sm font-black text-emerald-400">{toolsTotalMax}</span>
                      </div>

                      <button onClick={() => setIsAddingTool(!isAddingTool)} className="w-full py-3 bg-blue-600 text-white rounded-xl text-xs font-black">
                         {isAddingTool ? 'إغلاق الإضافة' : 'إضافة أداة يدوياً'}
                      </button>
                      
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

      {/* Add Grade Modal - Fixed Positioning */}
      {showAddGrade && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[120] flex items-center justify-center p-4" onClick={() => setShowAddGrade(null)}>
          <div className="bg-white w-full max-w-md h-auto max-h-[90vh] rounded-[2rem] p-6 shadow-2xl flex flex-col relative" onClick={e => e.stopPropagation()}>
             
             {/* Modal Header */}
             <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className="font-black text-gray-900 text-sm">رصد الدرجة</h3>
                    <p className="text-[10px] font-bold text-blue-600 mt-0.5">{showAddGrade.student.name}</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[9px] bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg font-black">{currentSemester === '1' ? 'ف1' : 'ف2'}</span>
                    <button onClick={() => setShowAddGrade(null)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X className="w-4 h-4"/></button>
                </div>
             </div>
             
             {/* Assessment Tools Section */}
             <div className="flex-1 overflow-y-auto mb-4 custom-scrollbar min-h-[120px]">
                 <div className="grid grid-cols-2 gap-2">
                    {tools.map(tool => (
                        <div key={tool.id} onClick={() => handleToolSelection(tool)} className={`p-3 rounded-2xl border transition-all cursor-pointer relative group ${selectedToolId === tool.id ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200' : 'bg-white text-gray-600 border-gray-100 hover:border-gray-200'}`}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="block text-[10px] font-black">{tool.name}</span>
                                    <span className={`text-[9px] font-bold ${selectedToolId === tool.id ? 'text-blue-200' : 'text-gray-400'}`}>من {tool.maxScore} درجات</span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {tools.length === 0 && <p className="col-span-2 text-center text-[10px] text-gray-400 py-4">أضف أدوات من زر الإعدادات في الأعلى.</p>}
                 </div>
             </div>

             {/* Score Input Section */}
             <div className="bg-gray-50 rounded-[2rem] p-4 flex flex-col items-center justify-center gap-2 mb-4 border border-gray-100">
                <div className="flex items-end gap-2">
                    <div className="text-center">
                        <input 
                            type="number" 
                            value={score} 
                            onChange={e => setScore(e.target.value)} 
                            placeholder="0" 
                            className="w-16 h-16 bg-white border-2 border-transparent focus:border-blue-500 rounded-2xl text-center font-black text-2xl text-blue-600 outline-none shadow-sm transition-all" 
                            autoFocus 
                        />
                        <label className="text-[9px] font-black text-gray-400 block mt-2">الدرجة</label>
                    </div>
                    <div className="pb-6 text-xl font-black text-gray-300">/</div>
                    <div className="text-center pb-1">
                         <div className="text-xl font-black text-gray-400">{currentMaxScore}</div>
                         <label className="text-[9px] font-black text-gray-400 block mt-2">العظمى</label>
                    </div>
                </div>
             </div>

             <button onClick={handleSaveGrade} disabled={!score || !selectedToolId} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-sm active:scale-95 shadow-lg shadow-blue-200 disabled:opacity-50 disabled:shadow-none transition-all mb-4">
                رصد الدرجة
             </button>

             {/* Student Summary Stats */}
             <div className="bg-indigo-50 rounded-2xl p-4 flex items-center justify-between border border-indigo-100">
                  <div className="flex items-center gap-3">
                     <div className="bg-indigo-100 p-2 rounded-xl text-indigo-600"><PieChart className="w-5 h-5"/></div>
                     <div>
                        <p className="text-[10px] text-indigo-800 font-bold">ملخص الفصل {currentSemester === '1' ? 'الأول' : 'الثاني'}</p>
                        <p className="text-xs font-black text-indigo-900">
                           {getStudentStats(showAddGrade.student).earned} / {getStudentStats(showAddGrade.student).total}
                        </p>
                     </div>
                  </div>
                  <div className="text-center">
                     <p className="text-[9px] text-indigo-400 font-bold">النسبة</p>
                     <p className="text-lg font-black text-indigo-600">{calculateTotal(showAddGrade.student)}%</p>
                  </div>
             </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default GradeBook;