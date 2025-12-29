
import React, { useState } from 'react';
import { Student, AttendanceStatus } from '../types';
import { Check, X, Clock, Calendar, Filter, MessageCircle, ChevronDown, CheckCircle2, RotateCcw, Search } from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState('');
  
  const [notificationTarget, setNotificationTarget] = useState<{student: Student, type: 'absent' | 'late'} | null>(null);

  const formatDateDisplay = (dateString: string) => {
      const d = new Date(dateString);
      return d.toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' });
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

  const handleMarkAll = (status: AttendanceStatus | 'reset') => {
      if (classFilter === 'all' && students.length > 50) {
          if (!confirm(`سيتم تطبيق هذا الإجراء على جميع الطلاب (${students.length}). هل أنت متأكد؟`)) return;
      }
      
      setStudents(prev => prev.map(s => {
          if (classFilter !== 'all' && (!s.classes || !s.classes.includes(classFilter))) {
              return s;
          }
          const filtered = s.attendance.filter(a => a.date !== selectedDate);
          if (status === 'reset') return { ...s, attendance: filtered };
          return { ...s, attendance: [...filtered, { date: selectedDate, status }] };
      }));
  };

  const handleNotifyParent = (student: Student, type: 'absent' | 'late') => {
    if (!student.parentPhone) {
      alert('رقم ولي الأمر غير متوفر لهذا الطالب');
      return;
    }
    setNotificationTarget({ student, type });
  };

  const performNotification = (method: 'whatsapp' | 'sms') => {
      if(!notificationTarget || !notificationTarget.student.parentPhone) return;
      const { student, type } = notificationTarget;
      let cleanPhone = student.parentPhone.replace(/[^0-9]/g, '');
      if (cleanPhone.startsWith('00')) cleanPhone = cleanPhone.substring(2);
      if (cleanPhone.length === 8) cleanPhone = '968' + cleanPhone;
      else if (cleanPhone.startsWith('0')) cleanPhone = '968' + cleanPhone.substring(1);

      const statusText = type === 'absent' ? 'تغيب عن المدرسة' : 'تأخر في الحضور إلى المدرسة';
      const msg = encodeURIComponent(`السلام عليكم، نود إبلاغكم بأن الطالب ${student.name} قد ${statusText} اليوم ${new Date(selectedDate).toLocaleDateString('ar-EG')}.`);

      if (method === 'whatsapp') {
          const url = `https://wa.me/${cleanPhone}?text=${msg}`;
          if (Capacitor.isNativePlatform()) window.open(url, '_system');
          else window.open(url, '_blank');
      } else {
          if (Capacitor.isNativePlatform()) window.open(`sms:${cleanPhone}?&body=${msg}`, '_system');
          else window.open(`sms:${cleanPhone}?&body=${msg}`, '_self');
      }
      setNotificationTarget(null);
  };

  const getStatus = (student: Student) => {
    return student.attendance.find(a => a.date === selectedDate)?.status;
  };

  const filteredStudents = students.filter(s => {
      const matchClass = classFilter === 'all' || (s.classes && s.classes.includes(classFilter));
      const matchSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchClass && matchSearch;
  });

  // --- iOS Style Components ---

  const IOSSegmentedControl = ({ status, onChange }: { status?: AttendanceStatus, onChange: (s: AttendanceStatus) => void }) => {
      return (
          <div className="bg-[#767680]/15 p-0.5 rounded-lg flex h-8 w-full max-w-[220px] relative isolate">
              {/* Animated Background for Active State - Simplified for React without heavy libraries */}
              <div className={`absolute top-0.5 bottom-0.5 w-[calc(33.33%-2px)] bg-white rounded-[6px] shadow-sm transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] z-[-1] ${
                  status === 'present' ? 'right-0.5' : 
                  status === 'absent' ? 'right-1/2 translate-x-1/2' : 
                  status === 'late' ? 'left-0.5' : 'hidden'
              }`}></div>

              <button onClick={() => onChange('present')} className={`flex-1 flex items-center justify-center gap-1 rounded-[6px] text-[10px] font-bold transition-colors ${status === 'present' ? 'text-green-600' : 'text-gray-500 hover:text-gray-700'}`}>
                  {status === 'present' && <Check className="w-3 h-3" />}
                  <span>حاضر</span>
              </button>
              <div className={`w-px bg-gray-300/50 my-1.5 ${status === 'present' || status === 'absent' ? 'opacity-0' : ''}`}></div>
              <button onClick={() => onChange('absent')} className={`flex-1 flex items-center justify-center gap-1 rounded-[6px] text-[10px] font-bold transition-colors ${status === 'absent' ? 'text-red-600' : 'text-gray-500 hover:text-gray-700'}`}>
                  {status === 'absent' && <X className="w-3 h-3" />}
                  <span>غائب</span>
              </button>
              <div className={`w-px bg-gray-300/50 my-1.5 ${status === 'absent' || status === 'late' ? 'opacity-0' : ''}`}></div>
              <button onClick={() => onChange('late')} className={`flex-1 flex items-center justify-center gap-1 rounded-[6px] text-[10px] font-bold transition-colors ${status === 'late' ? 'text-amber-600' : 'text-gray-500 hover:text-gray-700'}`}>
                  {status === 'late' && <Clock className="w-3 h-3" />}
                  <span>تأخير</span>
              </button>
          </div>
      );
  };

  return (
    <div className="space-y-0 pb-32 md:pb-8 bg-[#f2f2f7] min-h-full">
      
      {/* iOS Style Header */}
      <div className="bg-[#f2f2f7]/80 backdrop-blur-xl sticky top-0 z-30 px-4 pt-2 pb-2 border-b border-gray-300/50 transition-all">
          <div className="flex items-end justify-between mb-2">
             <div>
                 <h1 className="text-3xl font-black text-black tracking-tight leading-none">الحضور</h1>
                 <p className="text-xs text-gray-500 font-medium mt-1">{formatDateDisplay(selectedDate)}</p>
             </div>
             <div className="flex gap-2">
                 {/* Class Filter Button */}
                 <div className="relative">
                    <select 
                        value={classFilter} 
                        onChange={(e) => setClassFilter(e.target.value)} 
                        className="appearance-none bg-white/80 backdrop-blur text-blue-600 font-bold text-xs py-1.5 pl-3 pr-8 rounded-full border-none shadow-sm focus:ring-0 cursor-pointer"
                    >
                        <option value="all">كل الفصول</option>
                        {classes.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <ChevronDown className="w-3 h-3 text-blue-600 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                 </div>
                 {/* Date Picker Button */}
                 <div className="relative">
                    <input 
                        type="date" 
                        value={selectedDate} 
                        onChange={(e) => setSelectedDate(e.target.value)} 
                        className="absolute inset-0 opacity-0 z-10 w-full cursor-pointer"
                    />
                    <button className="bg-white/80 backdrop-blur text-blue-600 font-bold text-xs py-1.5 px-3 rounded-full shadow-sm flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>التاريخ</span>
                    </button>
                 </div>
             </div>
          </div>

          {/* iOS Search Bar */}
          <div className="relative mb-2">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                  type="text"
                  className="w-full bg-[#767680]/12 text-gray-900 text-sm rounded-xl py-2 pr-9 pl-4 outline-none placeholder:text-gray-500 focus:bg-[#767680]/20 transition-colors text-right"
                  placeholder="بحث"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
              />
          </div>

          {/* Batch Actions */}
          <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
              <button 
                  onClick={() => handleMarkAll('present')}
                  className="flex-1 bg-white text-blue-600 py-2 rounded-xl text-[11px] font-bold shadow-sm active:opacity-70 transition-opacity border border-gray-100"
              >
                  تحديد الكل "حاضر"
              </button>
              <button 
                  onClick={() => handleMarkAll('reset')}
                  className="px-4 bg-white text-gray-400 py-2 rounded-xl shadow-sm active:opacity-70 transition-opacity border border-gray-100"
              >
                  <RotateCcw className="w-4 h-4" />
              </button>
          </div>
      </div>

      {/* Student List - iOS TableView Style */}
      <div className="px-4 mt-2">
          {filteredStudents.length > 0 ? (
              <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200/50">
                  {filteredStudents.map((student, index) => {
                    const status = getStatus(student);
                    return (
                        <div key={student.id} className={`flex items-center justify-between p-3.5 ${index !== filteredStudents.length - 1 ? 'border-b border-gray-100' : ''} active:bg-gray-50 transition-colors`}>
                            
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-sm ${
                                    status === 'present' ? 'bg-green-500' : 
                                    status === 'absent' ? 'bg-red-500' : 
                                    status === 'late' ? 'bg-amber-500' : 
                                    'bg-gray-300'
                                }`}>
                                    {student.name.charAt(0)}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h4 className="text-[13px] font-semibold text-gray-900 truncate text-right">{student.name}</h4>
                                    <p className="text-[10px] text-gray-400 truncate text-right">{student.classes[0]}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <IOSSegmentedControl status={status} onChange={(s) => toggleAttendance(student.id, s)} />
                                
                                {(status === 'absent' || status === 'late') && (
                                    <button 
                                        onClick={() => handleNotifyParent(student, status)} 
                                        className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-50 text-blue-600 active:scale-90 transition-transform"
                                    >
                                        <MessageCircle className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                        </div>
                    );
                  })}
              </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 opacity-40">
                <Filter className="w-12 h-12 text-gray-400 mb-2" />
                <p className="text-sm font-medium text-gray-500">لا يوجد طلاب مطابقين</p>
            </div>
          )}
      </div>

      {/* Notification Modal - CENTERED */}
      {notificationTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setNotificationTarget(null)}>
            <div className="bg-[#f2f2f7] w-full max-w-sm rounded-[20px] p-6 shadow-2xl animate-in zoom-in-95 duration-200 relative overflow-hidden" onClick={e => e.stopPropagation()}>
                <h3 className="text-center font-bold text-gray-900 text-sm mb-1">
                    إبلاغ ولي الأمر
                </h3>
                <p className="text-center text-xs text-gray-500 mb-6">
                    {notificationTarget.type === 'absent' ? 'الطالب غائب اليوم' : 'الطالب متأخر اليوم'}
                </p>
                
                <div className="space-y-3">
                    <button onClick={() => performNotification('whatsapp')} className="w-full bg-white active:bg-gray-50 py-3.5 rounded-xl text-green-600 font-bold text-sm flex items-center justify-center gap-2 shadow-sm">
                        <MessageCircle className="w-5 h-5" />
                        إرسال عبر واتساب
                    </button>
                    <button onClick={() => performNotification('sms')} className="w-full bg-white active:bg-gray-50 py-3.5 rounded-xl text-blue-600 font-bold text-sm flex items-center justify-center gap-2 shadow-sm">
                        <CheckCircle2 className="w-5 h-5" />
                        رسالة نصية SMS
                    </button>
                </div>
                
                <button onClick={() => setNotificationTarget(null)} className="w-full mt-3 bg-white active:bg-gray-50 py-3.5 rounded-xl text-red-500 font-bold text-sm shadow-sm">
                    إلغاء
                </button>
            </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceTracker;
