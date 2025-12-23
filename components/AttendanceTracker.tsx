import React, { useState } from 'react';
import { Student, AttendanceStatus } from '../types';
import { Check, X, Clock, Calendar, Filter, MessageCircle, ChevronDown } from 'lucide-react';

interface AttendanceTrackerProps {
  students: Student[];
  classes: string[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
}

const AttendanceTracker: React.FC<AttendanceTrackerProps> = ({ students, classes, setStudents }) => {
  const today = new Date().toLocaleDateString('en-CA'); 
  const [selectedDate, setSelectedDate] = useState(today);
  const [classFilter, setClassFilter] = useState<string>('all');

  // Helper to display date as dd/mm/yyyy
  const formatDateDisplay = (dateString: string) => {
      const d = new Date(dateString);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
  };

  const toggleAttendance = (studentId: string, status: AttendanceStatus) => {
    setStudents(prev => prev.map(s => {
      if (s.id !== studentId) return s;
      const filtered = s.attendance.filter(a => a.date !== selectedDate);
      const currentStatus = s.attendance.find(a => a.date === selectedDate)?.status;
      if (currentStatus === status) {
          return { ...s, attendance: filtered };
      }
      return {
        ...s,
        attendance: [...filtered, { date: selectedDate, status }]
      };
    }));
  };

  const handleNotifyParent = (student: Student) => {
    if (!student.parentPhone) {
      alert('رقم ولي الأمر غير متوفر لهذا الطالب');
      return;
    }
    
    const rawPhone = student.parentPhone.replace(/[^0-9+]/g, '');
    const cleanPhone = rawPhone.startsWith('0') ? '966' + rawPhone.substring(1) : rawPhone;
    const msg = encodeURIComponent(`السلام عليكم، نود إبلاغكم بأن الطالب ${student.name} قد تغيب عن المدرسة اليوم ${formatDateDisplay(selectedDate)}.`);
    
    if (confirm('اختر طريقة الإرسال:\nموافق = واتساب\nإلغاء = رسالة نصية (SMS)')) {
         window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
    } else {
         window.open(`sms:${rawPhone}?&body=${msg}`, '_blank');
    }
  };

  const getStatus = (student: Student) => {
    return student.attendance.find(a => a.date === selectedDate)?.status;
  };

  const filteredStudents = classFilter === 'all' 
    ? students 
    : students.filter(s => s.classes && s.classes.includes(classFilter));

  return (
    <div className="space-y-4 pb-24">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between relative">
            <div className="flex items-center gap-2 pointer-events-none z-10">
                <Calendar className="text-blue-600 w-4 h-4" />
                <span className="font-black text-xs text-gray-700">تاريخ الحضور</span>
            </div>
            
            {/* Custom styled date display trigger */}
            <div className="relative">
                <div className="flex items-center gap-1 bg-gray-50 px-3 py-1.5 rounded-xl border border-transparent focus-within:border-blue-200">
                    <span className="text-xs font-black text-blue-600 dir-ltr">{formatDateDisplay(selectedDate)}</span>
                    <ChevronDown className="w-3 h-3 text-blue-400" />
                </div>
                {/* Hidden date input covering the trigger area */}
                <input 
                    type="date" 
                    value={selectedDate} 
                    onChange={(e) => setSelectedDate(e.target.value)} 
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                />
            </div>
        </div>
        
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2"><Filter className="text-indigo-600 w-4 h-4" /><span className="font-black text-xs text-gray-700">تصفية الفصل</span></div>
            <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="bg-gray-50 border-none rounded-xl px-3 py-1.5 text-xs font-bold outline-none text-indigo-600 appearance-none min-w-[100px] text-center">
              <option value="all">كل الفصول</option>
              {classes.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
        <div className="divide-y divide-gray-50">
          {filteredStudents.length > 0 ? filteredStudents.map((student, idx) => {
            const status = getStatus(student);
            return (
              <div key={student.id} className="p-3 flex flex-col gap-2 hover:bg-gray-50/50 transition-colors bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[9px] shrink-0 ${status === 'present' ? 'bg-emerald-100 text-emerald-600' : status === 'absent' ? 'bg-rose-100 text-rose-600' : 'bg-gray-100 text-gray-400'}`}>{idx + 1}</div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-gray-900 truncate text-xs">{student.name}</h4>
                    </div>
                  </div>
                  
                  {status === 'absent' && student.parentPhone && (
                    <button onClick={() => handleNotifyParent(student)} className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[8px] font-black active:scale-95 border border-emerald-100"><MessageCircle className="w-3 h-3" /> إبلاغ</button>
                  )}
                </div>
                
                <div className="bg-gray-100 p-1 rounded-xl flex gap-1 h-9">
                    <button 
                        onClick={() => toggleAttendance(student.id, 'present')} 
                        className={`flex-1 rounded-lg text-[9px] font-black flex items-center justify-center gap-1 transition-all ${status === 'present' ? 'bg-white text-emerald-600 shadow-sm scale-[0.98]' : 'text-gray-400 hover:text-gray-500'}`}
                    >
                        <Check className="w-3 h-3" /> حاضر
                    </button>
                    <button 
                        onClick={() => toggleAttendance(student.id, 'absent')} 
                        className={`flex-1 rounded-lg text-[9px] font-black flex items-center justify-center gap-1 transition-all ${status === 'absent' ? 'bg-white text-rose-600 shadow-sm scale-[0.98]' : 'text-gray-400 hover:text-gray-500'}`}
                    >
                        <X className="w-3 h-3" /> غائب
                    </button>
                    <button 
                        onClick={() => toggleAttendance(student.id, 'late')} 
                        className={`flex-1 rounded-lg text-[9px] font-black flex items-center justify-center gap-1 transition-all ${status === 'late' ? 'bg-white text-amber-500 shadow-sm scale-[0.98]' : 'text-gray-400 hover:text-gray-500'}`}
                    >
                        <Clock className="w-3 h-3" /> تأخير
                    </button>
                </div>
              </div>
            );
          }) : <div className="p-8 text-center text-gray-400 text-xs font-bold">لا يوجد طلاب في هذا الفصل</div>}
        </div>
      </div>
    </div>
  );
};

export default AttendanceTracker;