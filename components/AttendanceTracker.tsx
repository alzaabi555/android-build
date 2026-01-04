
import React, { useState, useMemo } from 'react';
import { Student, AttendanceStatus } from '../types';
import { Check, X, Clock, Calendar, MessageCircle, ChevronDown, Search, Loader2, Share2, DoorOpen, UserCircle2 } from 'lucide-react';
import { Browser } from '@capacitor/browser';
import * as XLSX from 'xlsx';
import { motion } from 'framer-motion';
import Modal from './Modal';
import { useTheme } from '../context/ThemeContext';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

interface AttendanceTrackerProps {
  students: Student[];
  classes: string[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
}

const AttendanceTracker: React.FC<AttendanceTrackerProps> = ({ students, classes, setStudents }) => {
  const { theme, isLowPower } = useTheme();
  const today = new Date().toLocaleDateString('en-CA'); 
  const [selectedDate, setSelectedDate] = useState(today);
  const [classFilter, setClassFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  
  const [notificationTarget, setNotificationTarget] = useState<{student: Student, type: 'absent' | 'late' | 'truant'} | null>(null);

  const formatDateDisplay = (dateString: string) => {
      const d = new Date(dateString);
      return d.toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  const getStatus = (student: Student) => {
    return student.attendance.find(a => a.date === selectedDate)?.status;
  };

  const toggleAttendance = (studentId: string, status: AttendanceStatus) => {
    setStudents(prev => prev.map(s => {
      if (s.id !== studentId) return s;
      const filtered = s.attendance.filter(a => a.date !== selectedDate);
      const currentStatus = s.attendance.find(a => a.date === selectedDate)?.status;
      
      const newStudent = {
        ...s,
        attendance: currentStatus === status ? filtered : [...filtered, { date: selectedDate, status }]
      };

      if (status === 'truant' && currentStatus !== 'truant') {
          setTimeout(() => setNotificationTarget({ student: newStudent, type: 'truant' }), 50);
      }

      return newStudent;
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
          if (status === 'reset') {
              return { ...s, attendance: filtered };
          }
          return {
              ...s,
              attendance: [...filtered, { date: selectedDate, status }]
          };
      }));
  };

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesClass = classFilter === 'all' || s.classes.includes(classFilter);
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesClass && matchesSearch;
    });
  }, [students, classFilter, searchQuery]);

  const stats = useMemo(() => {
      const present = filteredStudents.filter(s => getStatus(s) === 'present').length;
      const absent = filteredStudents.filter(s => getStatus(s) === 'absent').length;
      const late = filteredStudents.filter(s => getStatus(s) === 'late').length;
      const truant = filteredStudents.filter(s => getStatus(s) === 'truant').length;
      return { present, absent, late, truant, total: filteredStudents.length };
  }, [filteredStudents, selectedDate]);

  const performNotification = async (method: 'whatsapp' | 'sms') => {
      if(!notificationTarget || !notificationTarget.student.parentPhone) {
          alert('لا يوجد رقم هاتف مسجل');
          return;
      }
      
      const { student, type } = notificationTarget;
      let cleanPhone = student.parentPhone.replace(/[^0-9]/g, '');
      if (!cleanPhone || cleanPhone.length < 5) return alert('رقم الهاتف غير صحيح');
      
      // Smart Phone Formatting for Oman/General
      if (cleanPhone.startsWith('00')) cleanPhone = cleanPhone.substring(2);
      if (cleanPhone.length === 8) cleanPhone = '968' + cleanPhone;
      else if (cleanPhone.length === 9 && cleanPhone.startsWith('0')) cleanPhone = '968' + cleanPhone.substring(1);

      let statusText = '';
      if (type === 'absent') statusText = 'غائب';
      else if (type === 'late') statusText = 'متأخر';
      else if (type === 'truant') statusText = 'تسرب من الحصة (هروب)';

      const dateText = new Date().toLocaleDateString('ar-EG');
      const msg = encodeURIComponent(`السلام عليكم، نود إشعاركم بأن الطالب ${student.name} تم تسجيل حالة: *${statusText}* اليوم (${dateText}). نرجو المتابعة.`);
      
      if (method === 'whatsapp') {
          // --- PROVEN ROBUST WHATSAPP LOGIC ---
          if (window.electron) {
             window.electron.openExternal(`whatsapp://send?phone=${cleanPhone}&text=${msg}`);
          } else {
             const universalUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${msg}`;
             try {
                 if (Capacitor.isNativePlatform()) {
                     await Browser.open({ url: universalUrl });
                 } else {
                     window.open(universalUrl, '_blank');
                 }
             } catch (e) {
                 window.open(universalUrl, '_blank');
             }
          }
      } else {
          window.location.href = `sms:${cleanPhone}?body=${msg}`;
      }
      setNotificationTarget(null);
  };

  const handleExportDailyExcel = async () => {
      if (filteredStudents.length === 0) return alert('لا يوجد طلاب');
      setIsExportingExcel(true);
      try {
          const targetDate = new Date(selectedDate);
          const year = targetDate.getFullYear();
          const month = targetDate.getMonth();
          const daysInMonth = new Date(year, month + 1, 0).getDate();
          const data = filteredStudents.map((s, idx) => {
              const row: any = { 'م': idx + 1, 'اسم الطالب': s.name, 'الفصل': s.classes[0] || '' };
              let abs = 0, late = 0, truant = 0;
              for (let d = 1; d <= daysInMonth; d++) {
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                  const record = s.attendance.find(a => a.date === dateStr);
                  let symbol = '';
                  if (record) {
                      if (record.status === 'present') symbol = '✓';
                      else if (record.status === 'absent') { symbol = 'غ'; abs++; }
                      else if (record.status === 'late') { symbol = 'ت'; late++; }
                      else if (record.status === 'truant') { symbol = 'س'; truant++; }
                  }
                  row[`${d}`] = symbol;
              }
              row['مجموع الغياب'] = abs; row['مجموع التأخير'] = late; row['مجموع التسرب'] = truant;
              return row;
          });
          const wb = XLSX.utils.book_new(); const ws = XLSX.utils.json_to_sheet(data);
          const wscols = [{wch:5}, {wch:25}, {wch:10}]; for(let i=0; i<daysInMonth; i++) wscols.push({wch:3});
          ws['!cols'] = wscols; if(!ws['!views']) ws['!views'] = []; ws['!views'].push({ rightToLeft: true });
          XLSX.utils.book_append_sheet(wb, ws, `شهر_${month + 1}`);
          const fileName = `Attendance_${month + 1}_${year}.xlsx`;
          if (Capacitor.isNativePlatform()) {
              const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
              const result = await Filesystem.writeFile({ path: fileName, data: wbout, directory: Directory.Cache });
              await Share.share({ title: 'سجل الحضور الشهري', url: result.uri });
          } else { XLSX.writeFile(wb, fileName); }
      } catch (error) { console.error(error); alert('خطأ في التصدير'); } finally { setIsExportingExcel(false); }
  };

  return (
    <div className="flex flex-col h-full -mt-2 text-slate-900 dark:text-white relative">
        {/* ... (UI Remains the same, functional logic updated above) ... */}
        
        {/* iOS Style Header with Glass */}
        <div className="glass-heavy border-b border-white/20 sticky top-0 z-30 rounded-[0_0_2.5rem_2.5rem] mb-6 shadow-lg shrink-0">
            <div className="px-5 pt-4 pb-2">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-[28px] font-black tracking-tight text-slate-900 dark:text-white">الغياب</h1>
                    <div className="flex gap-2">
                         <button onClick={handleExportDailyExcel} disabled={isExportingExcel} className="w-10 h-10 glass-icon rounded-full text-emerald-600 dark:text-emerald-400 active:scale-90 transition-transform shadow-md hover:shadow-emerald-500/20 hover:scale-105 border border-white/20" title="تصدير سجل شهري (Excel)">
                             {isExportingExcel ? <Loader2 className="w-5 h-5 animate-spin"/> : <Share2 className="w-5 h-5"/>}
                         </button>
                    </div>
                </div>

                {/* Date Scroller */}
                <div className="flex items-center justify-between glass-card border-white/20 rounded-2xl p-1 mb-3 shadow-inner">
                    <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() - 1); setSelectedDate(d.toLocaleDateString('en-CA')); }} className="p-3 rounded-xl hover:bg-white/10 active:scale-90 transition-all"><ChevronDown className="w-5 h-5 rotate-90"/></button>
                    <div className="flex items-center gap-2 font-black text-sm">
                        <Calendar className="w-4 h-4 text-indigo-500 dark:text-indigo-400"/>
                        {formatDateDisplay(selectedDate)}
                    </div>
                    <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() + 1); setSelectedDate(d.toLocaleDateString('en-CA')); }} className="p-3 rounded-xl hover:bg-white/10 active:scale-90 transition-all"><ChevronDown className="w-5 h-5 -rotate-90"/></button>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
                    <div className="relative flex-1 min-w-[120px]">
                        <Search className="absolute right-3 top-2.5 w-4 h-4 text-gray-400"/>
                        <input 
                            type="text" 
                            placeholder="بحث..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full py-2.5 pr-9 pl-3 text-xs font-bold outline-none glass-input rounded-xl border border-white/10 focus:border-indigo-500/50 shadow-sm" 
                        />
                    </div>
                    <div className="h-6 w-px bg-white/20 mx-1 shrink-0"></div>
                    <button onClick={() => setClassFilter('all')} className={`px-4 py-2.5 text-xs font-black whitespace-nowrap rounded-xl transition-all shadow-sm ${classFilter === 'all' ? 'bg-indigo-600 text-white shadow-indigo-500/30' : 'glass-card border-white/10 text-slate-700 dark:text-white'}`}>الكل</button>
                    {classes.map(c => (
                        <button key={c} onClick={() => setClassFilter(c)} className={`px-4 py-2.5 text-xs font-black whitespace-nowrap rounded-xl transition-all shadow-sm ${classFilter === c ? 'bg-indigo-600 text-white shadow-indigo-500/30' : 'glass-card border-white/10 text-slate-700 dark:text-white'}`}>{c}</button>
                    ))}
                </div>
            </div>

            {/* Live Stats Strip - Improved for small screens */}
            {/* استخدام min-w-0 لمنع تجاوز النص، وتقليل الحشوات الداخلية */}
            <div className="grid grid-cols-5 gap-px bg-white/10 dark:bg-white/5 border-t border-white/10">
                <button onClick={() => handleMarkAll('present')} className="hover:bg-white/10 py-3 flex flex-col items-center justify-center active:bg-white/20 transition-colors min-w-0 px-1">
                    <span className="text-[9px] md:text-[10px] font-bold text-slate-500 dark:text-white/60 mb-0.5 truncate w-full text-center">حضور</span>
                    <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 drop-shadow-sm">{stats.present}</span>
                </button>
                <button onClick={() => handleMarkAll('absent')} className="hover:bg-white/10 py-3 flex flex-col items-center justify-center active:bg-white/20 transition-colors min-w-0 px-1">
                    <span className="text-[9px] md:text-[10px] font-bold text-slate-500 dark:text-white/60 mb-0.5 truncate w-full text-center">غياب</span>
                    <span className="text-sm font-black text-rose-600 dark:text-rose-400 drop-shadow-sm">{stats.absent}</span>
                </button>
                <button onClick={() => handleMarkAll('late')} className="hover:bg-white/10 py-3 flex flex-col items-center justify-center active:bg-white/20 transition-colors min-w-0 px-1">
                    <span className="text-[9px] md:text-[10px] font-bold text-slate-500 dark:text-white/60 mb-0.5 truncate w-full text-center">تأخر</span>
                    <span className="text-sm font-black text-amber-600 dark:text-amber-400 drop-shadow-sm">{stats.late}</span>
                </button>
                <button onClick={() => handleMarkAll('truant')} className="hover:bg-white/10 py-3 flex flex-col items-center justify-center active:bg-white/20 bg-purple-500/5 transition-colors min-w-0 px-1">
                    <span className="text-[9px] md:text-[10px] font-bold text-purple-500 dark:text-purple-300 mb-0.5 truncate w-full text-center">تسرب</span>
                    <span className="text-sm font-black text-purple-600 dark:text-purple-400 drop-shadow-sm">{stats.truant}</span>
                </button>
                <button onClick={() => handleMarkAll('reset')} className="hover:bg-white/10 py-3 flex flex-col items-center justify-center active:bg-white/20 transition-colors min-w-0 px-1">
                    <span className="text-[9px] md:text-[10px] font-bold text-slate-500 dark:text-white/60 mb-0.5 truncate w-full text-center">باقي</span>
                    <span className="text-sm font-black text-slate-400 dark:text-white/40">{stats.total - (stats.present + stats.absent + stats.late + stats.truant)}</span>
                </button>
            </div>
        </div>

        {/* Student List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-24">
            {filteredStudents.length > 0 ? (
                <div className="flex flex-col gap-3">
                    {filteredStudents.map((student) => {
                        const status = getStatus(student);
                        return (
                            <motion.div 
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={student.id} 
                                className={`
                                    p-4 rounded-[1.8rem] flex items-center justify-between glass-card shadow-lg transition-all duration-300 border border-white/20 hover:border-white/40 backdrop-blur-md relative overflow-hidden group
                                    ${status === 'absent' ? 'border-rose-500/40 bg-rose-500/10 shadow-[0_4px_20px_rgba(244,63,94,0.1)]' : 
                                      status === 'present' ? 'border-emerald-500/40 bg-emerald-500/10 shadow-[0_4px_20px_rgba(16,185,129,0.1)]' : 
                                      status === 'late' ? 'border-amber-500/40 bg-amber-500/10 shadow-[0_4px_20px_rgba(245,158,11,0.1)]' : 
                                      status === 'truant' ? 'border-purple-500/40 bg-purple-500/10 shadow-[0_4px_20px_rgba(168,85,247,0.1)]' : 
                                      'hover:shadow-[0_4px_20px_rgba(0,0,0,0.05)]'}
                                `}
                            >
                                {/* Subtle inner glow */}
                                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none opacity-50"></div>

                                <div className="flex items-center gap-4 min-w-0 flex-1 relative z-10">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black shrink-0 shadow-md glass-icon border border-white/20 group-hover:border-white/40 transition-colors`}>
                                        {student.avatar ? <img src={student.avatar} className="w-full h-full object-cover rounded-2xl" /> : student.name.charAt(0)}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className={`text-base font-bold truncate mb-1 ${status ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-gray-300'}`}>{student.name}</h3>
                                        {(status === 'absent' || status === 'late' || status === 'truant') && (
                                            <button 
                                                onClick={() => setNotificationTarget({ student, type: status as any })}
                                                className={`flex items-center gap-1.5 text-[10px] font-black px-3 py-1 rounded-lg w-fit active:scale-95 glass-card border-none shadow-sm ${
                                                    status === 'absent' 
                                                    ? 'text-rose-600 dark:text-rose-300 bg-rose-100 dark:bg-rose-900/30' 
                                                    : status === 'truant'
                                                    ? 'text-purple-600 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/30'
                                                    : 'text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/30'
                                                }`}
                                            >
                                                <MessageCircle className="w-3.5 h-3.5" /> {status === 'truant' ? 'إشعار تسرب' : (status === 'absent' ? 'إشعار غياب' : 'إشعار تأخير')}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0 pl-1 relative z-10">
                                    <button onClick={() => toggleAttendance(student.id, 'present')} className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all active:scale-90 ${status === 'present' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-105 ring-2 ring-emerald-300/50' : 'glass-icon text-gray-400 hover:text-emerald-500'}`}>
                                        <Check className="w-5 h-5" strokeWidth={3} />
                                    </button>
                                    <button onClick={() => toggleAttendance(student.id, 'absent')} className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all active:scale-90 ${status === 'absent' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30 scale-105 ring-2 ring-rose-300/50' : 'glass-icon text-gray-400 hover:text-rose-500'}`}>
                                        <X className="w-5 h-5" strokeWidth={3} />
                                    </button>
                                    <button onClick={() => toggleAttendance(student.id, 'late')} className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all active:scale-90 ${status === 'late' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30 scale-105 ring-2 ring-amber-300/50' : 'glass-icon text-gray-400 hover:text-amber-500'}`}>
                                        <Clock className="w-5 h-5" strokeWidth={3} />
                                    </button>
                                    <button onClick={() => toggleAttendance(student.id, 'truant')} className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all active:scale-90 ${status === 'truant' ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30 scale-105 ring-2 ring-purple-300/50' : 'glass-icon text-gray-400 hover:text-purple-500'}`} title="تسرب">
                                        <DoorOpen className="w-5 h-5" strokeWidth={3} />
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 opacity-40">
                    <UserCircle2 className="w-20 h-20 text-slate-300 dark:text-white mb-4" />
                    <p className="text-sm font-bold text-slate-400 dark:text-white">لا يوجد طلاب مطابقين</p>
                </div>
            )}
        </div>

        {/* Notification Modal */}
        <Modal isOpen={!!notificationTarget} onClose={() => setNotificationTarget(null)} className="max-w-xs rounded-[2rem]">
            <div className="text-center">
                <div className="w-16 h-16 glass-icon rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600 dark:text-emerald-400 shadow-lg border border-white/20">
                    <MessageCircle className="w-8 h-8" />
                </div>
                <h3 className="font-black text-lg mb-1 dark:text-white">إرسال إشعار</h3>
                <p className="text-xs text-gray-500 mb-6 font-bold">{notificationTarget?.student.name} - {notificationTarget?.type === 'truant' ? 'تسرب من الحصة' : (notificationTarget?.type === 'absent' ? 'غياب' : 'تأخير')}</p>
                
                <div className="space-y-3">
                    <button onClick={() => performNotification('whatsapp')} className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 transition-all active:scale-95">
                        <MessageCircle className="w-5 h-5" /> واتساب
                    </button>
                    <button onClick={() => performNotification('sms')} className="w-full glass-card hover:bg-white/20 text-slate-700 dark:text-white py-3.5 rounded-xl font-black text-sm transition-all active:scale-95">
                        رسالة نصية (SMS)
                    </button>
                    <button onClick={() => setNotificationTarget(null)} className="text-xs font-bold text-gray-400 mt-2">إلغاء</button>
                </div>
            </div>
        </Modal>

    </div>
  );
};

export default AttendanceTracker;
