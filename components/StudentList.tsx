
import React, { useState } from 'react';
import { Student, BehaviorType } from '../types';
import { Search, ThumbsUp, ThumbsDown, FileBarChart, X, UserPlus, Plus } from 'lucide-react';

interface StudentListProps {
  students: Student[];
  classes: string[];
  onAddClass: (name: string) => void;
  onAddStudentManually: (name: string, className: string) => void;
  onUpdateStudent: (s: Student) => void;
  onViewReport: (s: Student) => void;
}

const StudentList: React.FC<StudentListProps> = ({ students, classes, onAddClass, onAddStudentManually, onUpdateStudent, onViewReport }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [showLogModal, setShowLogModal] = useState<{ student: Student; type: BehaviorType } | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isAddingClass, setIsAddingClass] = useState(false);
  
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentClass, setNewStudentClass] = useState('');
  const [newClassName, setNewClassName] = useState('');
  const [logDesc, setLogDesc] = useState('');

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = selectedClass === 'all' || (s.classes && s.classes.includes(selectedClass));
    return matchesSearch && matchesClass;
  });

  const handleCreateStudent = () => {
    if (newStudentName.trim() && newStudentClass.trim()) {
      onAddStudentManually(newStudentName.trim(), newStudentClass.trim());
      setShowAddModal(false);
      setNewStudentName('');
      setNewStudentClass('');
    } else {
      alert('يرجى إكمال جميع البيانات');
    }
  };

  const handleAddBehavior = (desc?: string) => {
    if (!showLogModal) return;
    const finalDesc = desc || logDesc;
    if (!finalDesc.trim()) return;

    const newBehavior = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      type: showLogModal.type,
      description: finalDesc,
      points: showLogModal.type === 'positive' ? 1 : -1
    };

    onUpdateStudent({
      ...showLogModal.student,
      behaviors: [newBehavior, ...(showLogModal.student.behaviors || [])]
    });
    setShowLogModal(null);
    setLogDesc('');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-gray-400" />
            </div>
            <input type="text" placeholder="ابحث عن طالب..." className="w-full bg-white border border-gray-200 rounded-xl py-3 pr-9 pl-4 focus:outline-none shadow-sm text-sm font-black" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <button onClick={() => setShowAddModal(true)} className="p-3 bg-blue-600 text-white rounded-xl shadow-lg active-scale flex items-center justify-center"><UserPlus className="w-5 h-5" /></button>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
          <button onClick={() => setSelectedClass('all')} className={`px-4 py-2 rounded-xl text-[10px] font-black whitespace-nowrap transition-all ${selectedClass === 'all' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-400'}`}>الكل</button>
          {classes.map(cls => (
            <button key={cls} onClick={() => setSelectedClass(cls)} className={`px-4 py-2 rounded-xl text-[10px] font-black whitespace-nowrap transition-all ${selectedClass === cls ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-400'}`}>{cls}</button>
          ))}
          <button onClick={() => setIsAddingClass(true)} className="px-3 py-2 rounded-xl text-[10px] font-black bg-gray-100 text-gray-500 border border-dashed border-gray-300">+</button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {filteredStudents.length > 0 ? filteredStudents.map((student, idx) => (
          <div key={student.id} className="bg-white rounded-[2rem] p-5 shadow-sm border border-gray-50 flex flex-col gap-5 animate-in fade-in duration-300">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-sm ${idx % 2 === 0 ? 'bg-blue-500' : 'bg-indigo-500'}`}>{student.name.charAt(0)}</div>
                <div className="min-w-0">
                  <h4 className="font-black text-gray-900 text-xs truncate">{student.name}</h4>
                  <span className="text-[9px] text-gray-400 font-black">الفصل: {student.classes?.join(' • ') || 'غير محدد'}</span>
                </div>
              </div>
              <button onClick={() => onViewReport(student)} className="p-3 bg-blue-50 text-blue-600 rounded-2xl active-scale"><FileBarChart className="w-5 h-5" /></button>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowLogModal({ student, type: 'positive' })} className="flex-1 flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 py-4 rounded-2xl text-[10px] font-black active-scale border border-emerald-100"><ThumbsUp className="w-4 h-4" /> إيجابي</button>
              <button onClick={() => setShowLogModal({ student, type: 'negative' })} className="flex-1 flex items-center justify-center gap-2 bg-rose-50 text-rose-700 py-4 rounded-2xl text-[10px] font-black active-scale border border-rose-100"><ThumbsDown className="w-4 h-4" /> سلبي</button>
            </div>
          </div>
        )) : (
          <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-gray-200">
             <p className="text-gray-400 text-xs font-black">لا يوجد طلاب للعرض</p>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[150] flex items-center justify-center p-6" onClick={() => setShowAddModal(false)}>
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
             <h3 className="text-base font-black text-center mb-6">إضافة طالب جديد</h3>
             <div className="space-y-4 mb-6">
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-gray-400 mr-2 uppercase">اسم الطالب الكامل</label>
                   <input type="text" placeholder="اكتب اسم الطالب هنا" className="w-full bg-gray-50 border-none rounded-2xl py-4 px-5 text-sm font-black outline-none focus:ring-2 focus:ring-blue-100" value={newStudentName} onChange={e => setNewStudentName(e.target.value)} />
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-gray-400 mr-2 uppercase">الفصل الدراسي</label>
                   <select className="w-full bg-gray-50 border-none rounded-2xl py-4 px-5 text-sm font-black outline-none appearance-none" value={newStudentClass} onChange={e => setNewStudentClass(e.target.value)}>
                      <option value="">اختر الفصل</option>
                      {classes.map(c => <option key={c} value={c}>{c}</option>)}
                      <option value="NEW">+ فصل جديد</option>
                   </select>
                </div>
                {newStudentClass === 'NEW' && (
                  <input type="text" placeholder="اسم الفصل الجديد" className="w-full bg-blue-50 border-none rounded-2xl py-4 px-5 text-sm font-black outline-none" value={newClassName} onChange={e => setNewClassName(e.target.value)} onBlur={() => { if(newClassName) { onAddClass(newClassName); setNewStudentClass(newClassName); } }} />
                )}
             </div>
             <div className="flex gap-2">
                <button onClick={() => setShowAddModal(false)} className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-sm">إلغاء</button>
                <button onClick={handleCreateStudent} className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-sm active-scale">إضافة الطالب</button>
             </div>
          </div>
        </div>
      )}

      {isAddingClass && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[150] flex items-center justify-center p-6" onClick={() => setIsAddingClass(false)}>
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="font-black text-sm mb-4 text-center">إضافة فصل جديد</h3>
            <input type="text" placeholder="مثال: 10/أ" className="w-full bg-gray-50 border-none rounded-2xl py-4 px-4 text-sm font-black mb-6 outline-none" value={newClassName} onChange={(e) => setNewClassName(e.target.value)} />
            <button onClick={() => { if(newClassName) onAddClass(newClassName); setIsAddingClass(false); setNewClassName(''); }} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-sm">حفظ الفصل</button>
          </div>
        </div>
      )}

      {showLogModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[150] flex items-end justify-center" onClick={() => setShowLogModal(null)}>
          <div className="bg-white w-full max-w-md rounded-t-[2.5rem] p-6 shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-sm">رصد سلوك: {showLogModal.student.name}</h3>
              <button onClick={() => setShowLogModal(null)} className="p-2 bg-gray-100 rounded-full"><X className="w-4 h-4"/></button>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {(showLogModal.type === 'positive' ? ['مشاركة متميزة', 'إنجاز الواجب', 'مساعدة زميل', 'التزام تام'] : ['تأخر عن الحصة', 'إزعاج مستمر', 'عدم إحضار كتاب', 'إهمال الواجب']).map(d => (
                <button key={d} onClick={() => handleAddBehavior(d)} className={`text-right p-4 rounded-xl text-[10px] font-black border transition-all active:scale-95 ${showLogModal.type === 'positive' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>{d}</button>
              ))}
            </div>
            <textarea className="w-full p-4 bg-gray-50 rounded-2xl h-24 text-xs font-black outline-none mb-4" placeholder="اكتب ملاحظة سلوكية مخصصة..." value={logDesc} onChange={e => setLogDesc(e.target.value)} />
            <button onClick={() => handleAddBehavior()} className={`w-full py-4 rounded-2xl font-black text-sm text-white transition-all active:scale-95 ${showLogModal.type === 'positive' ? 'bg-emerald-600 shadow-emerald-100' : 'bg-rose-600 shadow-rose-100'}`}>حفظ الملاحظة</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentList;
