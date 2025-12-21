import React, { useState } from 'react';
import { Student, AttendanceStatus } from '../types';
import { Check, X, Clock, Calendar, Filter, Users, ClipboardCheck } from 'lucide-react';

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

  const getStatus = (student: Student) => {
    return student.attendance.find(a => a.date === selectedDate)?.status;
  };

  const filteredStudents = classFilter === 'all' 
    ? students 
    : students.filter(s => s.classes && s.classes.includes(classFilter));

  const attendanceStats = filteredStudents.reduce((acc, s) => {
    const status = getStatus(s);
    if (status === 'present') acc.p++;
    else if (status === 'absent') acc.a++;
    else if (status === 'late') acc.l++;
    return acc;
  }, { p: 0, a: 0, l: 0 });

  return (
    <div className="space-y-6">
      {/* Configuration Header */}
      <div className="grid grid-cols-1 gap-3">
        <div className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-2xl flex items-center justify-center">
                    <Calendar className="text-blue-600 w-5 h-5" />
                </div>
                <span className="font-black text-sm text-gray-700">تاريخ التحضير</span>
            </div>
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-gray-50 border-none rounded-xl px-4 py-2 text-xs font-bold focus:ring-2 focus:ring-blue-100 text-blue-600 outline-none"
            />
        </div>

        <div className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center">
                    <Filter className="text-indigo-600 w-5 h-5" />
                </div>
                <span className="font-black text-sm text-gray-700">تصفية الفصل</span>
            </div>
            <select 
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="bg-gray-50 border-none rounded-xl px-4 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-100 outline-none text-indigo-600 appearance-none min-w-[120px] text-center"
            >
              <option value="all">كل الفصول</option>
              {classes.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
        </div>
      </div>

      {/* Mini Progress Bar */}
      {filteredStudents.length > 0 && (
        <div className="bg-white p-4 rounded-[1.5rem] shadow-sm border border-gray-50">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] font-black text-gray-400 uppercase">تقدم التحضير اليومي</span>
            <span className="text-[10px] font-black text-blue-600">{Math.round(((attendanceStats.p + attendanceStats.a + attendanceStats.l) / filteredStudents.length) * 100)}%</span>
          </div>
          <div className="h-2 bg-gray-50 rounded-full overflow-hidden flex">
            <div className="h-full bg-emerald-400 transition-all duration-500" style={{ width: `${(attendanceStats.p / filteredStudents.length) * 100}%` }}></div>
            <div className="h-full bg-rose-400 transition-all duration-500" style={{ width: `${(attendanceStats.a / filteredStudents.length) * 100}%` }}></div>
            <div className="h-full bg-amber-400 transition-all duration-500" style={{ width: `${(attendanceStats.l / filteredStudents.length) * 100}%` }}></div>
          </div>
        </div>
      )}

      {/* Students Attendance List */}
      <div className="bg-white rounded-[2rem] shadow-sm overflow-hidden border border-gray-100">
        <div className="grid grid-cols-1 divide-y divide-gray-50">
          {filteredStudents.length > 0 ? filteredStudents.map((student, idx) => {
            const status = getStatus(student);
            return (
              <div key={student.id} className="p-5 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                    status === 'present' ? 'bg-emerald-100 text-emerald-600' : 
                    status === 'absent' ? 'bg-rose-100 text-rose-600' :
                    status === 'late' ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-gray-900 truncate text-sm">{student.name}</h4>
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">
                      {student.classes?.join(' • ') || 'بدون فصل'}
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-2 shrink-0">
                  <button 
                    onClick={() => toggleAttendance(student.id, 'present')}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${status === 'present' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100 scale-110' : 'bg-gray-100 text-gray-300'}`}
                  >
                    <Check className="w-5 h-5 stroke-[3px]" />
                  </button>
                  <button 
                    onClick={() => toggleAttendance(student.id, 'absent')}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${status === 'absent' ? 'bg-rose-500 text-white shadow-lg shadow-rose-100 scale-110' : 'bg-gray-100 text-gray-300'}`}
                  >
                    <X className="w-5 h-5 stroke-[3px]" />
                  </button>
                  <button 
                    onClick={() => toggleAttendance(student.id, 'late')}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${status === 'late' ? 'bg-amber-500 text-white shadow-lg shadow-amber-100 scale-110' : 'bg-gray-100 text-gray-300'}`}
                  >
                    <Clock className="w-5 h-5 stroke-[3px]" />
                  </button>
                </div>
              </div>
            );
          }) : (
            <div className="text-center py-24 px-10">
                <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <ClipboardCheck className="w-10 h-10 text-blue-200" />
                </div>
                <h4 className="font-bold text-gray-900 mb-2">القائمة فارغة</h4>
                <p className="text-gray-400 text-xs font-medium leading-relaxed">
                    {students.length === 0 
                        ? "قم بإضافة الطلاب أولاً من خلال التبويبات الأخرى لبدء التحضير." 
                        : "لا يوجد طلاب يطابقون تصفية الفصل المختارة حالياً."}
                </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendanceTracker;