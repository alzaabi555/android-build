import React, { useState } from 'react';
import { Student, AttendanceStatus } from '../types';
import { Check, X, Clock, Calendar, Filter, MessageCircle, Phone } from 'lucide-react';

interface AttendanceTrackerProps {
  students: Student[];
  classes: string[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
}

const AttendanceTracker: React.FC<AttendanceTrackerProps> = ({ students, classes, setStudents }) => {
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [classFilter, setClassFilter] = useState<string>('all');

  const toggleAttendance = (studentId: string, status: AttendanceStatus) => {
    setStudents(prev => prev.map(s => {
      if (s.id !== studentId) return s;
      const filtered = s.attendance.filter(a => a.date !== selectedDate);
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
    
    // تنظيف رقم الهاتف (حذف المسافات والرموز)
    const rawPhone = student.parentPhone.replace(/[^0-9+]/g, '');
    const cleanPhone = rawPhone.startsWith('0') ? '966' + rawPhone.substring(1) : rawPhone;
    
    const msg = encodeURIComponent(`السلام عليكم، نود إبلاغكم بأن الطالب ${student.name} قد تغيب عن المدرسة اليوم ${new Date(selectedDate).toLocaleDateString('ar-EG')}.`);
    
    // إظهار خيارات (واتساب أو رسالة نصية)
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
    <div className="space-y-6 pb-20">
      <div className="grid grid-cols-1 gap-3">
        <div className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3"><Calendar className="text-blue-600 w-5 h-5" /><span className="font-black text-sm text-gray-700">تاريخ الحضور</span></div>
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-gray-50 border-none rounded-xl px-4 py-2 text-xs font-bold focus:ring-2 focus:ring-blue-100 text-blue-600 outline-none" />
        </div>
        <div className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3"><Filter className="text-indigo-600 w-5 h-5" /><span className="font-black text-sm text-gray-700">تصفية الفصل</span></div>
            <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="bg-gray-50 border-none rounded-xl px-4 py-2 text-xs font-bold outline-none text-indigo-600 appearance-none min-w-[120px] text-center">
              <option value="all">كل الفصول</option>
              {classes.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm overflow-hidden border border-gray-100">
        <div className="grid grid-cols-1 divide-y divide-gray-50">
          {filteredStudents.map((student, idx) => {
            const status = getStatus(student);
            return (
              <div key={student.id} className="p-5 flex flex-col gap-4 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-[10px] shrink-0 ${status === 'present' ? 'bg-emerald-100 text-emerald-600' : status === 'absent' ? 'bg-rose-100 text-rose-600' : 'bg-gray-100 text-gray-400'}`}>{idx + 1}</div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-gray-900 truncate text-xs">{student.name}</h4>
                    </div>
                  </div>
                  
                  {status === 'absent' && student.parentPhone && (
                    <button onClick={() => handleNotifyParent(student)} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl text-[9px] font-black active:scale-95 border border-emerald-100"><MessageCircle className="w-3.5 h-3.5" /> إبلاغ</button>
                  )}
                </div>
                
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => toggleAttendance(student.id, 'present')} className={`flex-1 py-3 rounded-2xl flex items-center justify-center transition-all ${status === 'present' ? 'bg-emerald-500 text-white shadow-lg' : 'bg-gray-50 text-gray-300'}`}><Check className="w-4 h-4 stroke-[3px]" /></button>
                  <button onClick={() => toggleAttendance(student.id, 'absent')} className={`flex-1 py-3 rounded-2xl flex items-center justify-center transition-all ${status === 'absent' ? 'bg-rose-500 text-white shadow-lg' : 'bg-gray-50 text-gray-300'}`}><X className="w-4 h-4 stroke-[3px]" /></button>
                  <button onClick={() => toggleAttendance(student.id, 'late')} className={`flex-1 py-3 rounded-2xl flex items-center justify-center transition-all ${status === 'late' ? 'bg-amber-500 text-white shadow-lg' : 'bg-gray-50 text-gray-300'}`}><Clock className="w-4 h-4 stroke-[3px]" /></button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AttendanceTracker;