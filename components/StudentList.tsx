
import React, { useState } from 'react';
import { Student, BehaviorType } from '../types';
import { Search, ThumbsUp, ThumbsDown, FileBarChart, X, UserCircle, Camera, LayoutGrid, Plus } from 'lucide-react';

interface StudentListProps {
  students: Student[];
  classes: string[];
  onAddClass: (name: string) => void;
  onUpdateStudent: (s: Student) => void;
  onViewReport: (s: Student) => void;
}

const StudentList: React.FC<StudentListProps> = ({ students, classes, onAddClass, onUpdateStudent, onViewReport }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [showLogModal, setShowLogModal] = useState<{ student: Student; type: BehaviorType } | null>(null);
  const [logDesc, setLogDesc] = useState('');
  const [isAddingClass, setIsAddingClass] = useState(false);
  const [newClassName, setNewClassName] = useState('');

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = selectedClass === 'all' || (s.classes && s.classes.includes(selectedClass));
    return matchesSearch && matchesClass;
  });

  const handleAvatarChange = (student: Student, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateStudent({ ...student, avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
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

    // إصلاح: التأكد من وجود مصفوفة behaviors قبل الإضافة
    const updatedStudent = {
      ...showLogModal.student,
      behaviors: [newBehavior, ...(showLogModal.student.behaviors || [])]
    };

    onUpdateStudent(updatedStudent);
    setShowLogModal(null);
    setLogDesc('');
  };

  const handleCreateClass = () => {
    if (newClassName.trim()) {
      onAddClass(newClassName.trim());
      setIsAddingClass(false);
      setNewClassName('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-gray-400" />
            </div>
            <input 
              type="text" 
              placeholder="ابحث عن طالب..." 
              className="w-full bg-white border border-gray-200 rounded-xl py-2.5 pr-9 pl-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm text-sm font-bold"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button onClick={() => setIsAddingClass(true)} className="p-2.5 bg-white border border-gray-200 rounded-xl text-blue-600 shadow-sm active:bg-gray-50"><LayoutGrid className="w-5 h-5" /></button>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          <button onClick={() => setSelectedClass('all')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black whitespace-nowrap transition-all ${selectedClass === 'all' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-400 border border-gray-100'}`}>الكل</button>
          {classes.map(cls => (
            <button key={cls} onClick={() => setSelectedClass(cls)} className={`px-4 py-1.5 rounded-lg text-[10px] font-black whitespace-nowrap transition-all ${selectedClass === cls ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-400 border border-gray-100'}`}>{cls}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {filteredStudents.length === 0 ? (
          <div className="text-center py-10 text-gray-400 bg-white rounded-2xl border border-gray-100">
            <UserCircle className="w-12 h-12 mx-auto opacity-20 mb-2" />
            <p className="text-xs font-bold">لا توجد نتائج</p>
          </div>
        ) : (
          filteredStudents.map((student, idx) => (
            <div key={student.id} className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 flex flex-col gap-3 transition-all active:bg-gray-50/50">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <label className="relative cursor-pointer shrink-0">
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleAvatarChange(student, e)} />
                    {student.avatar ? (
                      <img src={student.avatar} className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm bg-gradient-to-br ${idx % 2 === 0 ? 'from-blue-500 to-indigo-600' : 'from-emerald-500 to-teal-600'}`}>
                        {student.name.charAt(0)}
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1 bg-white p-0.5 rounded-full shadow-sm border border-gray-100"><Camera className="w-2.5 h-2.5 text-blue-600" /></div>
                  </label>
                  <div className="min-w-0">
                    <h4 className="font-bold text-gray-900 text-xs truncate">{student.name}</h4>
                    <span className="text-[10px] text-gray-400 font-bold">الفصل: {student.classes?.join(' - ') || 'غير محدد'}</span>
                  </div>
                </div>
                <button onClick={() => onViewReport(student)} className="p-2 bg-blue-50 text-blue-600 rounded-lg active:scale-90"><FileBarChart className="w-4 h-4" /></button>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowLogModal({ student, type: 'positive' })} className="flex-1 flex items-center justify-center gap-1 bg-emerald-50 text-emerald-700 py-2.5 rounded-lg text-[10px] font-black active:bg-emerald-100"><ThumbsUp className="w-3.5 h-3.5" /> إيجابي</button>
                <button onClick={() => setShowLogModal({ student, type: 'negative' })} className="flex-1 flex items-center justify-center gap-1 bg-rose-50 text-rose-700 py-2.5 rounded-lg text-[10px] font-black active:bg-rose-100"><ThumbsDown className="w-3.5 h-3.5" /> سلبي</button>
              </div>
            </div>
          ))
        )}
      </div>

      {isAddingClass && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-6" onClick={() => setIsAddingClass(false)}>
          <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl animate-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
            <h3 className="font-black text-gray-900 text-sm mb-4 text-center">إضافة فصل جديد</h3>
            <input type="text" placeholder="مثال: 1/أ" className="w-full bg-gray-50 border-none rounded-xl py-4 px-4 text-sm font-bold outline-none mb-6" value={newClassName} onChange={(e) => setNewClassName(e.target.value)} autoFocus />
            <button onClick={handleCreateClass} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-sm active:scale-95">حفظ</button>
          </div>
        </div>
      )}

      {showLogModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center" onClick={() => setShowLogModal(null)}>
          <div className="bg-white w-full max-w-md rounded-t-[2.5rem] shadow-2xl animate-in slide-in-from-bottom duration-300 flex flex-col relative" onClick={e => e.stopPropagation()} style={{ maxHeight: '80vh' }}>
            <div className="flex justify-between items-center p-6 border-b shrink-0">
              <div><h3 className="font-black text-gray-900 text-sm">تسجيل سلوك</h3><p className="text-[10px] text-gray-400">{showLogModal.student.name}</p></div>
              <button onClick={() => setShowLogModal(null)} className="p-2 bg-gray-100 rounded-full"><X className="w-4 h-4"/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
               <div className="grid grid-cols-2 gap-2">
                {(showLogModal.type === 'positive' ? ['مشاركة فعالة', 'إنجاز الواجب', 'التزام الهدوء', 'مساعدة زميل'] : ['عدم إحضار الكتاب', 'إزعاج في الفصل', 'تأخر عن الحصة', 'عدم حل الواجب']).map(d => (
                  <button key={d} onClick={() => handleAddBehavior(d)} className={`text-right p-3 rounded-xl text-[11px] font-black active:scale-95 transition-all border ${showLogModal.type === 'positive' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>{d}</button>
                ))}
              </div>
              <textarea className="w-full p-4 bg-gray-50 rounded-2xl h-24 text-xs font-bold outline-none border border-transparent focus:border-blue-100" placeholder="وصف مخصص..." value={logDesc} onChange={(e) => setLogDesc(e.target.value)} />
            </div>
            <div className="p-6 shrink-0"><button onClick={() => handleAddBehavior()} className={`w-full py-4 rounded-2xl font-black text-sm text-white shadow-lg ${showLogModal.type === 'positive' ? 'bg-emerald-600' : 'bg-rose-600'}`}>تأكيد</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentList;
