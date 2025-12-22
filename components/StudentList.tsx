import React, { useState } from 'react';
import { Student, BehaviorType } from '../types';
import { Search, ThumbsUp, ThumbsDown, FileBarChart, X, UserPlus, Phone, Filter, Edit } from 'lucide-react';

interface StudentListProps {
  students: Student[];
  classes: string[];
  onAddClass: (name: string) => void;
  onAddStudentManually: (name: string, className: string, phone?: string) => void;
  onUpdateStudent: (s: Student) => void;
  onViewReport: (s: Student) => void;
}

const StudentList: React.FC<StudentListProps> = ({ students, classes, onAddClass, onAddStudentManually, onUpdateStudent, onViewReport }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [showLogModal, setShowLogModal] = useState<{ student: Student; type: BehaviorType } | null>(null);
  
  // Create/Edit Modal State
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  
  const [studentNameInput, setStudentNameInput] = useState('');
  const [studentClassInput, setStudentClassInput] = useState('');
  const [studentPhoneInput, setStudentPhoneInput] = useState('');
  const [logDesc, setLogDesc] = useState('');

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = selectedClass === 'all' || (s.classes && s.classes.includes(selectedClass));
    return matchesSearch && matchesClass;
  });

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
                classes: [studentClassInput.trim()], // Update primary class
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

    if (finalDesc === 'التسرب من الحصص' && showLogModal.student.parentPhone) {
      if (confirm(`هل ترغب في إبلاغ ولي أمر الطالب (${showLogModal.student.name}) بتسربه من الحصة؟`)) {
        const msg = encodeURIComponent(`السلام عليكم، نود إبلاغكم بأن الطالب ${showLogModal.student.name} قد تغيب/تسرب من الحصة الدراسية اليوم. يرجى المتابعة.`);
        window.open(`https://wa.me/${showLogModal.student.parentPhone}?text=${msg}`, '_blank');
      }
    }

    setShowLogModal(null);
    setLogDesc('');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sticky top-0 bg-[#f2f2f7] pt-2 pb-2 z-10">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-gray-400" />
            </div>
            <input type="text" placeholder="ابحث عن طالب..." className="w-full bg-white border border-gray-200 rounded-2xl py-3.5 pr-10 pl-4 focus:outline-none focus:border-blue-300 transition-all shadow-sm text-sm font-black text-gray-800" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <button onClick={openCreateModal} className="w-12 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-200 active:scale-95 flex items-center justify-center transition-all"><UserPlus className="w-5 h-5" /></button>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
           <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white text-gray-400 shrink-0 border border-gray-100"><Filter className="w-3 h-3" /></div>
          <button onClick={() => setSelectedClass('all')} className={`px-4 py-2 rounded-xl text-[10px] font-black whitespace-nowrap transition-all border ${selectedClass === 'all' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-gray-500 border-gray-100'}`}>الكل</button>
          {classes.map(cls => (
            <button key={cls} onClick={() => setSelectedClass(cls)} className={`px-4 py-2 rounded-xl text-[10px] font-black whitespace-nowrap transition-all border ${selectedClass === cls ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100' : 'bg-white text-gray-500 border-gray-100'}`}>{cls}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 pb-20">
        {filteredStudents.length > 0 ? filteredStudents.map((student, idx) => (
          <div key={student.id} className="bg-white rounded-[1.75rem] p-4 shadow-sm border border-gray-100 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500" style={{animationDelay: `${idx * 0.05}s`}}>
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3.5">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-sm ${idx % 3 === 0 ? 'bg-gradient-to-br from-blue-500 to-blue-600' : idx % 3 === 1 ? 'bg-gradient-to-br from-indigo-500 to-indigo-600' : 'bg-gradient-to-br from-violet-500 to-violet-600'}`}>{student.name.charAt(0)}</div>
                <div className="min-w-0">
                  <h4 className="font-black text-gray-900 text-sm truncate leading-tight mb-1">{student.name}</h4>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] text-gray-400 font-bold bg-gray-50 w-fit px-2 py-0.5 rounded-md">فصل: {student.classes?.join(' • ') || 'غير محدد'}</span>
                    {student.parentPhone && <span className="text-[9px] text-blue-500 font-bold flex items-center gap-1"><Phone className="w-2.5 h-2.5" /> {student.parentPhone}</span>}
                  </div>
                </div>
              </div>
              <div className="flex gap-1">
                  <button onClick={() => openEditModal(student)} className="p-2.5 bg-gray-50 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-colors"><Edit className="w-5 h-5" /></button>
                  <button onClick={() => onViewReport(student)} className="p-2.5 bg-gray-50 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"><FileBarChart className="w-5 h-5" /></button>
              </div>
            </div>
            
            <div className="h-px bg-gray-50 w-full"></div>

            <div className="flex gap-3">
              <button onClick={() => setShowLogModal({ student, type: 'positive' })} className="flex-1 flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 py-3.5 rounded-2xl text-[11px] font-black active:scale-95 transition-all border border-emerald-100/50"><ThumbsUp className="w-4 h-4" /> سلوك إيجابي</button>
              <button onClick={() => setShowLogModal({ student, type: 'negative' })} className="flex-1 flex items-center justify-center gap-2 bg-rose-50 text-rose-700 hover:bg-rose-100 py-3.5 rounded-2xl text-[11px] font-black active:scale-95 transition-all border border-rose-100/50"><ThumbsDown className="w-4 h-4" /> سلوك سلبي</button>
            </div>
          </div>
        )) : (
            <div className="flex flex-col items-center justify-center py-20 text-gray-300">
                <Search className="w-12 h-12 mb-2 opacity-50" />
                <p className="text-xs font-bold">لا يوجد طلاب مطابقين للبحث</p>
            </div>
        )}
      </div>

      {showStudentModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[150] flex items-center justify-center p-6 animate-in fade-in duration-200" onClick={() => setShowStudentModal(false)}>
          <div className="bg-white w-full max-sm rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
             <h3 className="text-lg font-black text-center mb-8 text-gray-800">{modalMode === 'create' ? 'إضافة طالب جديد' : 'تعديل بيانات الطالب'}</h3>
             <div className="space-y-5 mb-8">
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-gray-400 mr-2 uppercase">الاسم الكامل</label>
                   <input type="text" placeholder="اكتب الاسم هنا" className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-100 focus:bg-white rounded-2xl py-4 px-5 text-sm font-black outline-none transition-all" value={studentNameInput} onChange={e => setStudentNameInput(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-gray-400 mr-2 uppercase">الفصل الدراسي</label>
                   <select className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-100 focus:bg-white rounded-2xl py-4 px-5 text-sm font-black outline-none appearance-none transition-all" value={studentClassInput} onChange={e => setStudentClassInput(e.target.value)}>
                      <option value="">اختر الفصل</option>
                      {classes.map(c => <option key={c} value={c}>{c}</option>)}
                   </select>
                </div>
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black text-gray-400 mr-2 uppercase">رقم ولي الأمر (اختياري)</label>
                   <input type="tel" placeholder="مثال: 96650..." className="w-full bg-gray-50 border-2 border-transparent focus:border-blue-100 focus:bg-white rounded-2xl py-4 px-5 text-sm font-black outline-none transition-all" value={studentPhoneInput} onChange={e => setStudentPhoneInput(e.target.value)} />
                </div>
             </div>
             <div className="flex gap-3">
                <button onClick={() => setShowStudentModal(false)} className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black text-sm hover:bg-gray-200 transition-colors">إلغاء</button>
                <button onClick={handleSaveStudent} className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-sm active:scale-95 shadow-lg shadow-blue-200 transition-all">حفظ البيانات</button>
             </div>
          </div>
        </div>
      )}

      {showLogModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[150] flex items-end justify-center sm:items-center p-0 sm:p-4 animate-in fade-in duration-200" onClick={() => setShowLogModal(null)}>
          <div className="bg-white w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-300" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6 px-2">
              <h3 className="font-black text-sm text-gray-800">رصد سلوك: <span className="text-blue-600">{showLogModal.student.name}</span></h3>
              <button onClick={() => setShowLogModal(null)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"><X className="w-4 h-4 text-gray-500"/></button>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-5">
              {(showLogModal.type === 'positive' ? ['مشاركة متميزة', 'إنجاز الواجب', 'مساعدة زميل', 'نظافة وترتيب'] : ['تأخر عن الحصة', 'إزعاج مستمر', 'التسرب من الحصص', 'عدم حل الواجب']).map(d => (
                <button key={d} onClick={() => handleAddBehavior(d)} className={`text-right p-4 rounded-2xl text-[10px] font-black border transition-all active:scale-95 shadow-sm ${showLogModal.type === 'positive' ? 'bg-white text-emerald-700 border-emerald-100 hover:bg-emerald-50' : 'bg-white text-rose-700 border-rose-100 hover:bg-rose-50'}`}>{d}</button>
              ))}
            </div>
            <textarea className="w-full p-4 bg-gray-50 rounded-2xl h-24 text-xs font-black outline-none border-2 border-transparent focus:border-gray-200 focus:bg-white transition-all mb-4 resize-none" placeholder="أو اكتب ملاحظة خاصة هنا..." value={logDesc} onChange={e => setLogDesc(e.target.value)} />
            <button onClick={() => handleAddBehavior()} className={`w-full py-4 rounded-2xl font-black text-sm text-white transition-all active:scale-95 shadow-lg ${showLogModal.type === 'positive' ? 'bg-emerald-600 shadow-emerald-200' : 'bg-rose-600 shadow-rose-200'}`}>تأكيد الرصد</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentList;