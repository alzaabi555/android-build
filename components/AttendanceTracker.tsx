
import React, { useState } from 'react';
import { Student, AttendanceStatus } from '../types';
import { Check, X, Clock, Calendar, Filter, MessageCircle, ChevronDown, CheckCircle2, RotateCcw, Search } from 'lucide-react';
import { Browser } from '@capacitor/browser';
import { motion } from 'framer-motion';
import Modal from './Modal';
import { useTheme } from '../context/ThemeContext';

interface AttendanceTrackerProps {
  students: Student[];
  classes: string[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
}

const AttendanceTracker: React.FC<AttendanceTrackerProps> = ({ students, classes, setStudents }) => {
  const { theme } = useTheme();
  const today = new Date().toLocaleDateString('en-CA'); 
  const [selectedDate, setSelectedDate] = useState(today);
  const [classFilter, setClassFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [notificationTarget, setNotificationTarget] = useState<{student: Student, type: 'absent' | 'late'} | null>(null);

  const styles = {
      header: 'bg-white/80 dark:bg-white/5 backdrop-blur-xl border-b border-gray-200 dark:border-white/10 shadow-sm dark:shadow-lg',
      card: 'bg-white dark:bg-white/5 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm hover:shadow-md dark:hover:bg-white/10',
      search: 'bg-white dark:bg-black/20 rounded-xl border border-gray-300 dark:border-white/10',
      select: 'bg-indigo-50 dark:bg-indigo-500/20 border border-indigo-100 dark:border-indigo-500/30 rounded-full',
      btnGroup: 'bg-slate-50 dark:bg-black/10 rounded-xl border border-gray-100 dark:border-white/5 p-2',
      statusBtn: 'rounded-xl',
  };

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

  const performNotification = async (method: 'whatsapp' | 'sms') => {
      if(!notificationTarget || !notificationTarget.student.parentPhone) {
          alert('لا يوجد رقم هاتف مسجل');
          return;
      }
      const { student, type } = notificationTarget;
      
      let cleanPhone = student.parentPhone.replace(/[^0-9]/g, '');
      
      if (!cleanPhone || cleanPhone.length < 5) {
          alert('رقم الهاتف غير صحيح أو قصير جداً');
          return;
      }
      
      if (cleanPhone.startsWith('00')) cleanPhone = cleanPhone.substring(2);
      
      if (cleanPhone.length === 8) {
          cleanPhone = '968' + cleanPhone;
      } else if (cleanPhone.length === 9 && cleanPhone.startsWith('0')) {
          cleanPhone = '968' + cleanPhone.substring(1);
      }

      const statusText = type === 'absent' ? 'تغيب عن المدرسة' : 'تأخر في الحضور إلى المدرسة';
      const msg = encodeURIComponent(`السلام عليكم، نود إبلاغكم بأن الطالب ${student.name} قد ${statusText} اليوم ${new Date(selectedDate).toLocaleDateString('ar-EG')}.`);

      if (method === 'whatsapp') {
          const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${msg}`;
          try {
            await Browser.open({ url: url });
          } catch (e) {
            window.open(url, '_blank');
          }
      } else {
          window.location.href = `sms:${cleanPhone}?body=${msg}`;
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

  return (
    <div className="space-y-0 pb-32 md:pb-8 min-h-full">
      
      {/* Dynamic Header */}
      <div className={`${styles.header} px-4 pt-2 pb-4 rounded-b-[2rem] sticky top-0 z-20 transition-colors duration-300`}>
          <div className="flex items-end justify-between mb-4">
             <div>
                 <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none">الحضور</h1>
                 <p className="text-xs text-slate-500 dark:text-white/50 font-bold mt-1">{formatDateDisplay(selectedDate)}</p>
             </div>
             <div className="flex gap-2">
                 {/* Class Filter Button */}
                 <div className="relative">
                    <select 
                        value={classFilter} 
                        onChange={(e) => setClassFilter(e.target.value)} 
                        className={`appearance-none text-indigo-700 dark:text-indigo-200 font-bold text-xs py-2 pl-3 pr-8 shadow-sm focus:ring-0 cursor-pointer outline-none transition-colors ${styles.select}`}
                    >
                        <option value="all" className="text-black">كل الفصول</option>
                        {classes.map(c => <option key={c} value={c} className="text-black">{c}</option>)}
                    </select>
                    <ChevronDown className="w-3 h-3 text-indigo-400 dark:text-indigo-300 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                 </div>
                 {/* Date Picker Button */}
                 <div className="relative">
                    <input 
                        type="date" 
                        value={selectedDate} 
                        onChange={(e) => setSelectedDate(e.target.value)} 
                        className="absolute inset-0 opacity-0 z-10 w-full cursor-pointer"
                    />
                    <button className="text-slate-700 dark:text-white/80 font-bold text-xs py-2 px-3 shadow-sm flex items-center gap-1 hover:bg-gray-50 dark:hover:bg-white/20 transition-all bg-white dark:bg-white/10 rounded-full border border-gray-200 dark:border-white/10">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>التاريخ</span>
                    </button>
                 </div>
             </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-3">
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-slate-400 dark:text-white/40" />
              </div>
              <input
                  type="text"
                  className={`w-full text-slate-900 dark:text-white text-sm py-2.5 pr-9 pl-4 outline-none placeholder:text-slate-400 dark:placeholder:text-white/30 transition-all text-right shadow-sm ${styles.search}`}
                  placeholder="بحث عن طالب..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
              />
          </div>

          {/* Batch Actions */}
          <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
              <button 
                  onClick={() => handleMarkAll('present')}
                  className="flex-1 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 py-2.5 text-[11px] font-bold shadow-sm active:scale-95 transition-all hover:bg-emerald-200 dark:hover:bg-emerald-500/30 rounded-xl border border-emerald-200 dark:border-emerald-500/20"
              >
                  تحديد الكل "حاضر"
              </button>
              <button 
                  onClick={() => handleMarkAll('reset')}
                  className="px-4 bg-white dark:bg-white/10 text-slate-600 dark:text-white/60 py-2.5 shadow-sm active:scale-95 transition-all hover:bg-gray-50 dark:hover:bg-white/20 hover:text-slate-900 dark:hover:text-white rounded-xl border border-gray-200 dark:border-white/10"
              >
                  <RotateCcw className="w-4 h-4" />
              </button>
          </div>
      </div>

      {/* Student List - Dynamic Cards */}
      <div className="px-4 mt-4 space-y-3">
          {filteredStudents.length > 0 ? (
              <>
                  {filteredStudents.map((student, index) => {
                    const status = getStatus(student);
                    return (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            key={student.id} 
                            className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 transition-all ${styles.card}`}
                        >
                            
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-base font-bold text-white shrink-0 shadow-md ${
                                    status === 'present' ? 'bg-emerald-500 border border-emerald-400' : 
                                    status === 'absent' ? 'bg-rose-500 border border-rose-400' : 
                                    status === 'late' ? 'bg-amber-500 border border-amber-400' : 
                                    'bg-slate-200 dark:bg-white/10 border border-slate-300 dark:border-white/20 text-slate-500 dark:text-white'
                                }`}>
                                    {student.name.charAt(0)}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h4 className="text-sm font-black text-slate-900 dark:text-white truncate text-right">{student.name}</h4>
                                    <p className="text-[10px] text-slate-500 dark:text-white/40 truncate text-right font-bold px-2 py-0.5 inline-block mt-1 bg-slate-100 dark:bg-white/5 rounded-md">{student.classes[0]}</p>
                                </div>
                            </div>

                            <div className={`flex items-center justify-end gap-3 w-full sm:w-auto ${styles.btnGroup}`}>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => toggleAttendance(student.id, 'present')} 
                                        className={`w-10 h-10 flex items-center justify-center transition-all ${styles.statusBtn} ${status === 'present' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-white dark:bg-white/5 text-slate-400 dark:text-emerald-400/50 border border-gray-200 dark:border-transparent hover:bg-emerald-50 dark:hover:bg-emerald-500/20 hover:text-emerald-600 dark:hover:text-emerald-400'}`}
                                        title="حاضر"
                                    >
                                        <Check className="w-5 h-5" strokeWidth={3} />
                                    </button>
                                    <button 
                                        onClick={() => toggleAttendance(student.id, 'absent')} 
                                        className={`w-10 h-10 flex items-center justify-center transition-all ${styles.statusBtn} ${status === 'absent' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30' : 'bg-white dark:bg-white/5 text-slate-400 dark:text-rose-400/50 border border-gray-200 dark:border-transparent hover:bg-rose-50 dark:hover:bg-rose-500/20 hover:text-rose-600 dark:hover:text-rose-400'}`}
                                        title="غائب"
                                    >
                                        <X className="w-5 h-5" strokeWidth={3} />
                                    </button>
                                    <button 
                                        onClick={() => toggleAttendance(student.id, 'late')} 
                                        className={`w-10 h-10 flex items-center justify-center transition-all ${styles.statusBtn} ${status === 'late' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' : 'bg-white dark:bg-white/5 text-slate-400 dark:text-amber-400/50 border border-gray-200 dark:border-transparent hover:bg-amber-50 dark:hover:bg-amber-500/20 hover:text-amber-600 dark:hover:text-amber-400'}`}
                                        title="تأخير"
                                    >
                                        <Clock className="w-5 h-5" strokeWidth={3} />
                                    </button>
                                </div>
                                
                                {(status === 'absent' || status === 'late') && (
                                    <button 
                                        onClick={() => handleNotifyParent(student, status)} 
                                        className={`w-10 h-10 flex items-center justify-center bg-blue-500 text-white active:scale-90 transition-transform shadow-lg shadow-blue-500/30 ml-1 ${styles.statusBtn}`}
                                    >
                                        <MessageCircle className="w-5 h-5" />
                                    </button>
                                )}
                            </div>

                        </motion.div>
                    );
                  })}
              </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 opacity-30">
                <Filter className="w-12 h-12 text-slate-400 dark:text-white mb-2" />
                <p className="text-sm font-bold text-slate-500 dark:text-white">لا يوجد طلاب مطابقين</p>
            </div>
          )}
      </div>

      {/* Notification Modal */}
      <Modal isOpen={!!notificationTarget} onClose={() => setNotificationTarget(null)} className="rounded-[28px]">
          <h3 className="text-center font-black text-slate-900 dark:text-white text-lg mb-1 shrink-0">
              إبلاغ ولي الأمر
          </h3>
          <p className="text-center text-xs font-bold text-slate-500 dark:text-white/50 mb-6 shrink-0">
              {notificationTarget?.type === 'absent' ? 'الطالب غائب اليوم' : 'الطالب متأخر اليوم'}
          </p>
          
          <div className="space-y-3">
              <button onClick={() => performNotification('whatsapp')} className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-3 shadow-lg shadow-[#25D366]/30 transition-all">
                  <MessageCircle className="w-6 h-6 fill-white" />
                  فتح واتساب مباشرة
              </button>
              <button onClick={() => performNotification('sms')} className="w-full bg-slate-100 dark:bg-white/10 active:bg-slate-200 dark:active:bg-white/20 py-4 rounded-2xl text-slate-700 dark:text-white font-black text-sm flex items-center justify-center gap-2 border border-gray-200 dark:border-white/10">
                  <CheckCircle2 className="w-5 h-5" />
                  رسالة نصية SMS
              </button>
          </div>
          
          <button onClick={() => setNotificationTarget(null)} className="w-full mt-3 bg-transparent py-3 rounded-xl text-rose-500 dark:text-rose-400 font-bold text-sm hover:bg-rose-50 dark:hover:bg-white/5">
              إلغاء
          </button>
      </Modal>
    </div>
  );
};

export default AttendanceTracker;
