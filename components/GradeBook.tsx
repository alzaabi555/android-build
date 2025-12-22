import React, { useState, useEffect } from 'react';
import { Student, GradeRecord } from '../types';
import { GraduationCap, Plus, Search, X, Edit3, Trash2, Save, FilePlus2, PieChart } from 'lucide-react';

interface GradeBookProps {
  students: Student[];
  classes: string[];
  onUpdateStudent: (s: Student) => void;
}

interface AssessmentTool {
    id: string;
    name: string;
    maxScore: number;
}

const GradeBook: React.FC<GradeBookProps> = ({ students, classes, onUpdateStudent }) => {
  const [selectedClass, setSelectedClass] = useState(classes[0] || 'all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddGrade, setShowAddGrade] = useState<{ student: Student; existingGrade?: GradeRecord } | null>(null);
  
  // Custom Assessment Tools State
  const [tools, setTools] = useState<AssessmentTool[]>(() => {
    try {
        const saved = localStorage.getItem('assessmentTools');
        // تفريغ الأدوات الافتراضية
        return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [isAddingTool, setIsAddingTool] = useState(false);
  const [newToolName, setNewToolName] = useState('');
  const [newToolMax, setNewToolMax] = useState('');
  
  const [selectedToolId, setSelectedToolId] = useState<string>('');
  const [score, setScore] = useState('');
  const [currentMaxScore, setCurrentMaxScore] = useState('10'); // For display/edit if needed

  useEffect(() => {
     localStorage.setItem('assessmentTools', JSON.stringify(tools));
  }, [tools]);

  // When opening modal
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

  const handleAddTool = () => {
      if (newToolName.trim() && newToolMax) {
          const newTool: AssessmentTool = {
              id: Math.random().toString(36).substr(2, 9),
              name: newToolName.trim(),
              maxScore: Number(newToolMax)
          };
          const updatedTools = [...tools, newTool];
          setTools(updatedTools);
          setSelectedToolId(newTool.id);
          setCurrentMaxScore(newTool.maxScore.toString());
          
          setIsAddingTool(false);
          setNewToolName('');
          setNewToolMax('');
      }
  };

  const handleDeleteTool = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (confirm('هل أنت متأكد من حذف أداة التقويم هذه؟')) {
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
        date: new Date().toISOString()
    };
    
    const updatedGrades = [newGrade, ...(student.grades || [])];
    onUpdateStudent({ ...student, grades: updatedGrades });
    
    setShowAddGrade(null);
    setScore('');
  };

  const calculateTotal = (student: Student) => {
    if (!student.grades || student.grades.length === 0) return 0;
    const earned = student.grades.reduce((a, b) => a + b.score, 0);
    const total = student.grades.reduce((a, b) => a + b.maxScore, 0);
    return total > 0 ? Math.round((earned / total) * 100) : 0;
  };

  const getStudentStats = (student: Student) => {
      const grades = student.grades || [];
      const earned = grades.reduce((a, b) => a + b.score, 0);
      const total = grades.reduce((a, b) => a + b.maxScore, 0);
      return { earned, total, count: grades.length };
  };

  return (
    <div className="space-y-4 pb-20">
      <div className="flex flex-col gap-3 sticky top-0 bg-[#f2f2f7] pt-2 pb-2 z-10">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
             <h2 className="text-xs font-black text-gray-900">سجل الدرجات</h2>
             <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="bg-gray-50 rounded-lg px-2 py-1 text-[10px] font-black outline-none border-none">
                <option value="all">كل الفصول</option>
                {classes.map(c => <option key={c} value={c}>{c}</option>)}
             </select>
          </div>
          <div className="relative">
             <Search className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
             <input type="text" placeholder="ابحث عن طالب..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-white rounded-xl py-2.5 pr-9 pl-4 text-xs font-bold outline-none border-none shadow-sm" />
          </div>
      </div>

      <div className="space-y-2">
        {filteredStudents.length > 0 ? filteredStudents.map(student => (
          <div key={student.id} onClick={() => setShowAddGrade({ student })} className="bg-white p-3 rounded-2xl shadow-sm border border-gray-50 flex items-center justify-between active:bg-blue-50 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
               <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[11px] font-black text-white shadow-sm ${calculateTotal(student) >= 50 ? 'bg-emerald-500' : 'bg-rose-500'}`}>{calculateTotal(student)}%</div>
               <div>
                  <h4 className="text-[11px] font-black text-gray-900">{student.name}</h4>
                  <span className="text-[9px] text-gray-400 font-bold">تم رصد {student.grades?.length || 0} درجات</span>
               </div>
            </div>
            <button className="w-8 h-8 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center"><Plus className="w-4 h-4" /></button>
          </div>
        )) : <div className="text-center py-10 text-gray-400 text-xs font-bold">لا يوجد طلاب</div>}
      </div>

      {showAddGrade && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[120] flex items-end sm:items-center justify-center" onClick={() => setShowAddGrade(null)}>
          <div className="bg-white w-full max-w-md h-[90vh] sm:h-auto rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
             <div className="flex justify-between items-center mb-4">
                <h3 className="font-black text-gray-900 text-sm">رصد درجة للطالب: <span className="text-blue-600">{showAddGrade.student.name}</span></h3>
                <button onClick={() => setShowAddGrade(null)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X className="w-4 h-4"/></button>
             </div>
             
             {/* Assessment Tools Section */}
             <div className="flex-1 overflow-y-auto mb-4">
                 <div className="flex justify-between items-center mb-3">
                    <label className="text-[10px] font-black text-gray-400">أدوات التقويم</label>
                    <button onClick={() => setIsAddingTool(!isAddingTool)} className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                        {isAddingTool ? 'إلغاء' : 'أداة جديدة +'}
                    </button>
                 </div>

                 {isAddingTool && (
                     <div className="bg-gray-50 p-3 rounded-2xl mb-3 border border-blue-100 animate-in fade-in slide-in-from-top-2">
                         <div className="flex gap-2 mb-2">
                             <input type="text" placeholder="اسم الأداة (مثال: واجب)" value={newToolName} onChange={e => setNewToolName(e.target.value)} className="flex-[2] bg-white border-none rounded-xl px-3 py-2 text-xs font-bold outline-none" />
                             <input type="number" placeholder="من" value={newToolMax} onChange={e => setNewToolMax(e.target.value)} className="flex-1 bg-white border-none rounded-xl px-3 py-2 text-xs font-bold outline-none text-center" />
                         </div>
                         <button onClick={handleAddTool} className="w-full bg-blue-600 text-white py-2 rounded-xl text-xs font-black">حفظ الأداة</button>
                     </div>
                 )}

                 <div className="grid grid-cols-2 gap-2">
                    {tools.map(tool => (
                        <div key={tool.id} onClick={() => handleToolSelection(tool)} className={`p-3 rounded-2xl border transition-all cursor-pointer relative group ${selectedToolId === tool.id ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200' : 'bg-white text-gray-600 border-gray-100 hover:border-gray-200'}`}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="block text-[10px] font-black">{tool.name}</span>
                                    <span className={`text-[9px] font-bold ${selectedToolId === tool.id ? 'text-blue-200' : 'text-gray-400'}`}>من {tool.maxScore} درجات</span>
                                </div>
                                <button onClick={(e) => handleDeleteTool(e, tool.id)} className={`p-1.5 rounded-lg ${selectedToolId === tool.id ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-gray-50 text-gray-400 hover:text-rose-500 hover:bg-rose-50'}`}>
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    ))}
                    {tools.length === 0 && !isAddingTool && <p className="col-span-2 text-center text-[10px] text-gray-400 py-4">لا توجد أدوات، أضف أداة جديدة.</p>}
                 </div>
             </div>

             {/* Score Input Section */}
             <div className="bg-gray-50 rounded-[2rem] p-4 flex flex-col items-center justify-center gap-2 mb-4 border border-gray-100">
                <div className="flex items-end gap-2">
                    <div className="text-center">
                        {/* تم تصغير الحجم هنا */}
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
                        <p className="text-[10px] text-indigo-800 font-bold">ملخص الطالب</p>
                        <p className="text-xs font-black text-indigo-900">
                           {getStudentStats(showAddGrade.student).earned} / {getStudentStats(showAddGrade.student).total}
                        </p>
                     </div>
                  </div>
                  <div className="text-center">
                     <p className="text-[9px] text-indigo-400 font-bold">المجموع</p>
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