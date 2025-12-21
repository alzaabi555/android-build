
import React, { useState } from 'react';
import { Student, GradeRecord } from '../types';
import { GraduationCap, Plus, Search, X, Edit3, Trash2 } from 'lucide-react';

interface GradeBookProps {
  students: Student[];
  classes: string[];
  onUpdateStudent: (s: Student) => void;
}

const GradeBook: React.FC<GradeBookProps> = ({ students, classes, onUpdateStudent }) => {
  const [selectedClass, setSelectedClass] = useState(classes[0] || 'all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddGrade, setShowAddGrade] = useState<{ student: Student; existingGrade?: GradeRecord } | null>(null);
  const [selectedStudentIdForGrades, setSelectedStudentIdForGrades] = useState<string | null>(null);
  
  const [category, setCategory] = useState('العرض الشفوي');
  const [score, setScore] = useState('');
  const [maxScore, setMaxScore] = useState('10');

  const categories = [
    { name: 'العرض الشفوي', max: 10 },
    { name: 'السؤال القصير الأول', max: 5 },
    { name: 'الاختبار القصير الأول', max: 15 },
    { name: 'التقرير', max: 10 },
    { name: 'الاختبار النهائي', max: 40 }
  ];

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.includes(searchTerm);
    const matchesClass = selectedClass === 'all' || s.classes?.includes(selectedClass);
    return matchesSearch && matchesClass;
  });

  const activeStudentInModal = students.find(s => s.id === selectedStudentIdForGrades);

  const handleSaveGrade = () => {
    if (!showAddGrade || score === '') return;
    const student = showAddGrade.student;
    const existingGrade = showAddGrade.existingGrade;

    let updatedGrades: GradeRecord[];
    if (existingGrade) {
        updatedGrades = (student.grades || []).map(g => 
            g.id === existingGrade.id 
            ? { ...g, category, score: Number(score), maxScore: Number(maxScore) }
            : g
        );
    } else {
        const newGrade: GradeRecord = {
          id: Math.random().toString(36).substr(2, 9),
          subject: 'المادة',
          category,
          score: Number(score),
          maxScore: Number(maxScore),
          date: new Date().toISOString()
        };
        updatedGrades = [newGrade, ...(student.grades || [])];
    }

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

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
         <h2 className="text-xs font-black text-gray-900">سجل الدرجات</h2>
         <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="bg-gray-50 rounded-lg px-2 py-1 text-[10px] font-black outline-none border-none">
            <option value="all">الكل</option>
            {classes.map(c => <option key={c} value={c}>{c}</option>)}
         </select>
      </div>

      <div className="space-y-2">
        {filteredStudents.map(student => (
          <div key={student.id} onClick={() => setSelectedStudentIdForGrades(student.id)} className="bg-white p-3 rounded-2xl shadow-sm border border-gray-50 flex items-center justify-between active:bg-blue-50">
            <div className="flex items-center gap-3">
               <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-[10px] font-black text-blue-600">{calculateTotal(student)}%</div>
               <h4 className="text-[11px] font-black text-gray-900">{student.name}</h4>
            </div>
            <button onClick={(e) => { e.stopPropagation(); setShowAddGrade({ student }); }} className="p-2 bg-blue-600 text-white rounded-lg"><Plus className="w-3 h-3" /></button>
          </div>
        ))}
      </div>

      {showAddGrade && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[120] flex items-end justify-center" onClick={() => setShowAddGrade(null)}>
          <div className="bg-white w-full max-w-md rounded-t-[2rem] shadow-2xl p-6" onClick={e => e.stopPropagation()}>
             <div className="flex justify-between items-center mb-6">
                <h3 className="font-black text-gray-900 text-sm">رصد درجة للطالب</h3>
                <button onClick={() => setShowAddGrade(null)} className="p-2 bg-gray-100 rounded-full"><X className="w-4 h-4"/></button>
             </div>
             
             <div className="grid grid-cols-2 gap-2 mb-6">
                {categories.map(cat => (
                    <button key={cat.name} onClick={() => { setCategory(cat.name); setMaxScore(cat.max.toString()); }} className={`p-3 rounded-xl text-[9px] font-black transition-all border text-right ${category === cat.name ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-500'}`}>
                        {cat.name} ({cat.max})
                    </button>
                ))}
             </div>

             <div className="bg-gray-50 rounded-2xl p-4 flex items-center justify-center gap-4 mb-6">
                <div className="text-center">
                    <label className="text-[8px] font-black text-gray-400 block mb-1">الدرجة</label>
                    <input type="number" value={score} onChange={e => setScore(e.target.value)} placeholder="0" className="w-14 bg-white border border-blue-100 rounded-lg py-2 text-center font-black text-blue-600 text-sm outline-none" autoFocus />
                </div>
                <div className="text-2xl font-black text-gray-300">/</div>
                <div className="text-center">
                    <label className="text-[8px] font-black text-gray-400 block mb-1">القصوى</label>
                    <div className="w-14 py-2 text-center font-black text-gray-400 text-sm">{maxScore}</div>
                </div>
             </div>

             <button onClick={handleSaveGrade} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-sm active:scale-95">حفظ الدرجة</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GradeBook;
