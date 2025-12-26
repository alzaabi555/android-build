import React, { useState } from 'react';
import { Student, AttendanceStatus } from '../types';
import { Check, X, Clock, Calendar, Filter, MessageCircle, ChevronDown, Smartphone, CheckCircle2, RotateCcw } from 'lucide-react';
import { Capacitor } from '@capacitor/core';

interface AttendanceTrackerProps {
  students: Student[];
  classes: string[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
}

const AttendanceTracker: React.FC<AttendanceTrackerProps> = ({ students, classes, setStudents }) => {
  const today = new Date().toLocaleDateString('en-CA'); 
  const [selectedDate, setSelectedDate] = useState(today);
  const [classFilter, setClassFilter] = useState<string>('all');
  
  // Notification Modal State
  const [notificationTarget, setNotificationTarget] = useState<Student | null>(null);

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

  // --- ميزة التحضير الجماعي ---
  const handleMarkAll = (status: AttendanceStatus | 'reset') => {
      if (classFilter === 'all' && students.length > 50) {
          if (!confirm(`سيتم تطبيق هذا الإجراء على جميع الطلاب (${students.length}). هل أنت متأكد؟`)) return;
      }
      
      setStudents(prev => prev.map(s => {
          // إذا كان الفلتر مفعلاً، طبق فقط على طلاب الفصل المختار
          if (classFilter !== 'all' && (!s.classes || !s.classes.includes(classFilter))) {
              return s;
          }

          const filtered = s.attendance.filter(a => a.date !== selectedDate);
          
          if (status === 'reset') {
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
    setNotificationTarget(student);
  };

  const performNotification = (method: 'whatsapp' | 'sms') => {
      if(!notificationTarget || !notificationTarget.parentPhone) return;

      // تنظيف الرقم وإعداده للصيغة الدولية العمانية
      let cleanPhone = notificationTarget.parentPhone.replace(/[^0-9]/g, '');

      // إزالة الصفرين في البداية إذا وجدا
      if (cleanPhone.startsWith('00')) cleanPhone = cleanPhone.substring(2);

      // إذا كان الرقم 8 خانات (رقم محلي عماني)، أضف المفتاح الدولي 968
      if (cleanPhone.length === 8) {
          cleanPhone = '968' + cleanPhone;
      }
      // إذا كان الرقم يبدأ بـ 0 (مثل 09xxxxxxx)، أزل الصفر وأضف 968
      else if (cleanPhone.startsWith('0')) {
          cleanPhone = '968' + cleanPhone.substring(1);
      }

      const msg = encodeURIComponent(`السلام عليكم، نود إبلاغكم بأن الطالب ${notificationTarget.name} قد تغيب عن المدرسة اليوم ${formatDateDisplay(selectedDate)}.`);

      if (method === 'whatsapp') {
          // استخدام api.whatsapp.com و _system لضمان فتح التطبيق الأصلي في جميع البيئات
          window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${msg}`, '_system');
      } else {
          window.open(`sms:${cleanPhone}?&body=${msg}`, '_system');
      }
      setNotificationTarget(null);
  };

  const getStatus = (student: Student) => {
    return student.attendance.find(a => a.date === selectedDate)?.status;
  };

  const filteredStudents = classFilter === 'all' 
    ? students 
    : students.filter(s => s.classes && s.classes.includes(classFilter));

  // مكون زر التحكم (iOS Segmented Control Style)
  const SegmentButton = ({ active, onClick, icon: Icon, label, colorClass }: any) => (
    <button 
        onClick={onClick} 
        className={`flex-1 py-1.5 rounded-[7px] text-[10px] font-bold flex items-center justify-center gap-1 transition-all duration-200 ${
            active 
            ? `bg-white text-${colorClass}-600 shadow-sm scale-[0.98]` 
            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
        }`}
    >
        <Icon className={`w-3.5 h-3.5 ${active ? '' : 'opacity-70'}`} />
        <span className={active ? '' : 'hidden sm:inline'}>{label}</span>
    </button>
  );

  return (
    <div className="space-y-4 pb-32 md:pb-8">
      
      {/* Header: ensure it is static (relative) not sticky */}
      <div className="relative z-20 bg-transparent pb-2 transition-all">
          <div className="flex items-center justify-between px-1 mb-2">
             <h2 className="text-2xl font-black text-gray-900 tracking-tight">تسجيل الحضور</h2>
             <span className="text-[10px] font-bold text-gray-400 bg-white px-2 py-1 rounded-full shadow-sm">{filteredStudents.length} طالب</span>
          </div>

          <div className="bg-white rounded-xl p-1.5 shadow-sm border border-gray-200/50 flex gap-2 mb-2">
            {/* Date Picker */}
            <div className="flex-1 relative bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group">
                <div className="absolute inset-0 flex items-center justify-between px-3 pointer-events-none">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-500" />
                        <span className="text-xs font-black text-gray-700">{formatDateDisplay(selectedDate)}</span>
                    </div>
                </div>
                <input 
                    type="date" 
                    value={selectedDate} 
                    onChange={(e) => setSelectedDate(e.target.value)} 
                    className="w-full h-9 opacity-0 cursor-pointer"
                />
            </div>

            {/* Class Filter */}
            <div className="flex-1 relative bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                 <div className="absolute inset-0 flex items-center justify-between px-3 pointer-events-none">
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-indigo-500" />
                        <span className="text-xs font-black text-gray-700 truncate max-w-[80px]">
                            {classFilter === 'all' ? 'كل الفصول' : classFilter}
                        </span>
                    </div>
                    <ChevronDown className="w-3 h-3 text-gray-400" />
                </div>
                <select 
                    value={classFilter} 
                    onChange={(e) => setClassFilter(e.target.value)} 
                    className="w-full h-9 opacity-0 cursor-pointer"
                >
                  <option value="all">كل الفصول</option>
                  {classes.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>
          </div>
          
          {/* Quick Actions (Batch) */}
          <div className="flex gap-2">
              <button 
                  onClick={() => handleMarkAll('present')}
                  className="flex-1 bg-emerald-50 text-emerald-700 py-3 rounded-xl text-xs font-black flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm border border-emerald-100"
              >
                  <CheckCircle2 className="w-4 h-4" /> تحديد الكل "حاضر"
              </button>
              <button 
                  onClick={() => handleMarkAll('reset')}
                  className="px-4 bg-gray-50 text-gray-500 py-3 rounded-xl text-xs font-black active:scale-95 transition-all border border-gray-200"
                  title="إعادة تعيين اليوم"
              >
                  <RotateCcw className="w-4 h-4" />
              </button>
          </div>
      </div>

      {/* Student List - متجاوب: قائمة عمودية للموبايل، شبكة للكمبيوتر */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
          {filteredStudents.length > 0 ? filteredStudents.map((student) => {
            const status = getStatus(student);
            return (
              <div key={student.id} className="bg-white rounded-2xl p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.05)] border border-gray-100 flex flex-col gap-3 transition-transform active:scale-[0.99] duration-200">
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shrink-0 transition-colors duration-300 ${
                        status === 'present' ? 'bg-emerald-100 text-emerald-600' : 
                        status === 'absent' ? 'bg-rose-100 text-rose-600' : 
                        status === 'late' ? 'bg-amber-100 text-amber-600' :
                        'bg-gray-100 text-gray-500'
                    }`}>
                        {student.name.charAt(0)}
                    </div>
                    
                    <div className="min-w-0">
                      <h4 className="font-bold text-gray-900 text-sm truncate leading-tight">{student.name}</h4>
                      <p className="text-[10px] text-gray-400 font-medium truncate">فصل: {student.classes[0]}</p>
                    </div>
                  </div>
                  
                  {status === 'absent' && (
                    <button 
                        onClick={() => handleNotifyParent(student)} 
                        className="w-8 h-8 flex items-center justify-center bg-emerald-50 text-emerald-600 rounded-full active:bg-emerald-100 transition-colors hover:bg-emerald-100"
                        title="إبلاغ ولي الأمر"
                    >
                        <MessageCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
                
                {/* iOS Segmented Control */}
                <div className="bg-gray-100/80 p-0.5 rounded-lg flex h-9 relative">
                    <SegmentButton 
                        active={status === 'present'} 
                        onClick={() => toggleAttendance(student.id, 'present')} 
                        icon={Check} 
                        label="حاضر" 
                        colorClass="emerald" 
                    />
                    <div className="w-px bg-gray-300/50 my-1.5 mx-0.5" />
                    <SegmentButton 
                        active={status === 'absent'} 
                        onClick={() => toggleAttendance(student.id, 'absent')} 
                        icon={X} 
                        label="غائب" 
                        colorClass="rose" 
                    />
                    <div className="w-px bg-gray-300/50 my-1.5 mx-0.5" />
                    <SegmentButton 
                        active={status === 'late'} 
                        onClick={() => toggleAttendance(student.id, 'late')} 
                        icon={Clock} 
                        label="تأخير" 
                        colorClass="amber" 
                    />
                </div>

              </div>
            );
          }) : (
            <div className="col-span-full flex flex-col items-center justify-center py-20 opacity-50">
                <Filter className="w-12 h-12 text-gray-300 mb-2" />
                <p className="text-sm font-bold text-gray-400">لا يوجد طلاب في هذا الفصل</p>
            </div>
          )}
      </div>

      {/* Notification Method Modal */}
      {notificationTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setNotificationTarget(null)}>
            <div className="bg-white rounded-[2rem] p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
                <h3 className="text-center font-black text-lg mb-2 text-gray-800">تبليغ عن غياب</h3>
                <p className="text-center text-xs text-gray-500 font-bold mb-6">اختر طريقة إرسال الرسالة لولي الأمر</p>
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => performNotification('whatsapp')} className="flex flex-col items-center justify-center gap-2 p-4 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 hover:bg-emerald-100 active:scale-95 transition-all">
                        <MessageCircle className="w-8 h-8" />
                        <span className="text-xs font-black">واتساب</span>
                    </button>
                    <button onClick={() => performNotification('sms')} className="flex flex-col items-center justify-center gap-2 p-4 bg-blue-50 text-blue-700 rounded-2xl border border-blue-100 hover:bg-blue-100 active:scale-95 transition-all">
                        <Smartphone className="w-8 h-8" />
                        <span className="text-xs font-black">رسالة نصية</span>
                    </button>
                </div>
                <button onClick={() => setNotificationTarget(null)} className="w-full mt-4 py-3 bg-gray-100 text-gray-500 rounded-xl font-bold text-xs">إلغاء</button>
            </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceTracker;