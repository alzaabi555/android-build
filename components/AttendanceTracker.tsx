
import React, { useState, useMemo } from 'react';
import { Student, AttendanceStatus } from '../types';
import { Check, X, Clock, Calendar, MessageCircle, ChevronDown, Loader2, Share2, DoorOpen, UserCircle2, ArrowUpDown } from 'lucide-react';
import { Browser } from '@capacitor/browser';
import * as XLSX from 'xlsx';
import Modal from './Modal';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

interface AttendanceTrackerProps {
  students: Student[];
  classes: string[];
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
}

const AttendanceTracker: React.FC<AttendanceTrackerProps> = ({ students, classes, setStudents }) => {
  const today = new Date().toLocaleDateString('en-CA'); 
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [classFilter, setClassFilter] = useState<string>('all');
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
          // Check filters
          const matchesClass = classFilter === 'all' || s.classes.includes(classFilter);
          let matchesGrade = true;
          if (selectedGrade !== 'all') {
              matchesGrade = s.grade === selectedGrade || (s.classes[0] && s.classes[0].startsWith(selectedGrade));
          }

          if (!matchesClass || !matchesGrade) return s;

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

  // Logic: Extract unique Grades
  const availableGrades = useMemo(() => {
      const grades = new Set<string>();
      students.forEach(s => {
          if (s.grade) grades.add(s.grade);
          else if (s.classes[0]) {
              const match = s.classes[0].match(/^(\d+)/);
              if (match) grades.add(match[1]);
          }
      });
      if (grades.size === 0 && classes.length > 0) return ['عام']; 
      return Array.from(grades).sort();
  }, [students, classes]);

  // Logic: Filter classes based on selected grade
  const visibleClasses = useMemo(() => {
      if (selectedGrade === 'all') return classes;
      return classes.filter(c => c.startsWith(selectedGrade));
  }, [classes, selectedGrade]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesClass = classFilter === 'all' || s.classes.includes(classFilter);
      let matchesGrade = true;
      if (selectedGrade !== 'all') {
          matchesGrade = s.grade === selectedGrade || (s.classes[0] && s.classes[0].startsWith(selectedGrade));
      }
      return matchesClass && matchesGrade;
    });
  }, [students, classFilter, selectedGrade]);

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
    <div className="flex flex-col h-full text-gray-100 relative animate-in fade-in duration-500">
        
        {/* Sticky Header - Adjusted for safe area and removed gap */}
        <div className="sticky top-0 z-30 pb-2 glass-heavy bg-[#1f2937] border-b border-gray-700 shadow-md -mx-4 px-4 -mt-4">
            
            {/* Title & Actions */}
            <div className="flex justify-between items-center mb-4 pt-safe mt-4">
                <h1 className="text-2xl font-black tracking-tight text-white">سجل الغياب</h1>
                <button onClick={handleExportDailyExcel} disabled={isExportingExcel} className="w-10 h-10 glass-icon bg-[#374151] border border-gray-600 rounded-full text-emerald-500 shadow-sm flex items-center justify-center active:scale-95 transition-transform hover:bg-[#4b5563]" title="تصدير سجل شهري">
                     {isExportingExcel ? <Loader2 className="w-5 h-5 animate-spin"/> : <Share2 className="w-5 h-5"/>}
                </button>
            </div>

            {/* Date Scroller */}
            <div className="flex items-center justify-between glass-card bg-[#374151] rounded-2xl p-1 mb-3 shadow-sm border border-gray-600 mx-1">
                <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() - 1); setSelectedDate(d.toLocaleDateString('en-CA')); }} className="p-3 rounded-xl hover:bg-[#4b5563] active:bg-[#1f2937] transition-colors"><ChevronDown className="w-5 h-5 rotate-90 text-gray-400"/></button>
                <div className="flex items-center gap-2 font-black text-sm text-white">
                    <Calendar className="w-4 h-4 text-blue-400"/>
                    {formatDateDisplay(selectedDate)}
                </div>
                <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() + 1); setSelectedDate(d.toLocaleDateString('en-CA')); }} className="p-3 rounded-xl hover:bg-[#4b5563] active:bg-[#1f2937] transition-colors"><ChevronDown className="w-5 h-5 -rotate-90 text-gray-400"/></button>
            </div>

            {/* Filters (Grade Level first, then Classes) */}
            <div className="space-y-2 mb-2 px-1">
                {availableGrades.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                        <button onClick={() => { setSelectedGrade('all'); setClassFilter('all'); }} className={`px-4 py-1.5 text-[10px] font-bold whitespace-nowrap rounded-xl transition-all border ${selectedGrade === 'all' ? 'bg-indigo-600 text-white border-indigo-700 shadow-md' : 'glass-card bg-[#374151] text-gray-300 border-gray-600'}`}>كل المراحل</button>
                        {availableGrades.map(g => (
                            <button key={g} onClick={() => { setSelectedGrade(g); setClassFilter('all'); }} className={`px-4 py-1.5 text-[10px] font-bold whitespace-nowrap rounded-xl transition-all border ${selectedGrade === g ? 'bg-indigo-600 text-white border-indigo-700 shadow-md' : 'glass-card bg-[#374151] text-gray-300 border-gray-600'}`}>صف {g}</button>
                        ))}
                    </div>
                )}

                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                    {visibleClasses.map(c => (
                        <button key={c} onClick={() => setClassFilter(c)} className={`px-5 py-2 text-xs font-bold whitespace-nowrap rounded-xl transition-all border ${classFilter === c ? 'bg-indigo-600 text-white border-indigo-700 shadow-md' : 'glass-card bg-[#374151] text-gray-300 border-gray-600 hover:bg-[#4b5563]'}`}>{c}</button>
                    ))}
                </div>
            </div>
        </div>

        {/* Live Stats Strip */}
        <div className="grid grid-cols-5 gap-px bg-gray-700 rounded-2xl overflow-hidden mx-1 mb-4 shadow-sm border border-gray-600 mt-4">
            <button onClick={() => handleMarkAll('present')} className="bg-[#1f2937] py-3 flex flex-col items-center justify-center active:bg-[#111827] transition-colors hover:bg-[#374151]">
                <span className="text-[10px] font-bold text-gray-400 mb-1">حضور</span>
                <span className="text-sm font-black text-emerald-500">{stats.present}</span>
            </button>
            <button onClick={() => handleMarkAll('absent')} className="bg-[#1f2937] py-3 flex flex-col items-center justify-center active:bg-[#111827] transition-colors hover:bg-[#374151]">
                <span className="text-[10px] font-bold text-gray-400 mb-1">غياب</span>
                <span className="text-sm font-black text-rose-500">{stats.absent}</span>
            </button>
            <button onClick={() => handleMarkAll('late')} className="bg-[#1f2937] py-3 flex flex-col items-center justify-center active:bg-[#111827] transition-colors hover:bg-[#374151]">
                <span className="text-[10px] font-bold text-gray-400 mb-1">تأخر</span>
                <span className="text-sm font-black text-amber-500">{stats.late}</span>
            </button>
            <button onClick={() => handleMarkAll('truant')} className="bg-[#1f2937] py-3 flex flex-col items-center justify-center active:bg-[#111827] transition-colors hover:bg-[#374151]">
                <span className="text-[10px] font-bold text-gray-400 mb-1">تسرب</span>
                <span className="text-sm font-black text-purple-500">{stats.truant}</span>
            </button>
            <button onClick={() => handleMarkAll('reset')} className="bg-[#1f2937] py-3 flex flex-col items-center justify-center active:bg-[#111827] transition-colors hover:bg-[#374151]">
                <span className="text-[10px] font-bold text-gray-400 mb-1">باقي</span>
                <span className="text-sm font-black text-gray-500">{stats.total - (stats.present + stats.absent + stats.late + stats.truant)}</span>
            </button>
        </div>

        {/* Student List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-1 pb-24">
            {filteredStudents.length > 0 ? (
                <div className="space-y-2">
                    {filteredStudents.map((student, index) => {
                        const status = getStatus(student);
                        return (
                            <div 
                                key={student.id} 
                                className={`
                                    group flex items-center justify-between p-4 rounded-2xl border border-blue-500 transition-all duration-300 relative overflow-hidden shimmer-hover
                                    ${status 
                                        ? 'bg-[#374151] border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.15)]' 
                                        : 'bg-[#1f2937] border-indigo-500/40 hover:bg-[#374151] hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10'
                                    }
                                `}
                            >
                                {/* Left: Info */}
                                <div className="flex items-center gap-3 min-w-0 flex-1 relative z-10">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 bg-[#374151] text-gray-300 overflow-hidden border border-gray-600 transition-colors group-hover:border-indigo-400`}>
                                        {student.avatar ? <img src={student.avatar} className="w-full h-full object-cover" /> : student.name.charAt(0)}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className={`text-sm font-bold truncate transition-colors ${status ? 'text-white' : 'text-gray-300 group-hover:text-indigo-400'}`}>{student.name}</h3>
                                        {status && (
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                                                    status === 'present' ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-500/30' :
                                                    status === 'absent' ? 'bg-rose-900/30 text-rose-400 border border-rose-500/30' :
                                                    status === 'late' ? 'bg-amber-900/30 text-amber-400 border border-amber-500/30' :
                                                    'bg-purple-900/30 text-purple-400 border border-purple-500/30'
                                                }`}>
                                                    {status === 'present' ? 'حضور' : status === 'absent' ? 'غياب' : status === 'late' ? 'تأخر' : 'تسرب'}
                                                </span>
                                                {(status !== 'present') && (
                                                    <button onClick={() => setNotificationTarget({ student, type: status as any })} className="text-blue-400 bg-blue-900/20 p-1 rounded-full hover:bg-blue-900/40 border border-blue-500/20">
                                                        <MessageCircle className="w-3 h-3" />
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Right: Action Buttons (Compact) */}
                                <div className="flex items-center gap-1.5 shrink-0 relative z-10">
                                    <button onClick={() => toggleAttendance(student.id, 'present')} className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${status === 'present' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/50' : 'bg-[#374151] text-gray-500 hover:bg-emerald-900/20 hover:text-emerald-400 border border-gray-600'}`}>
                                        <Check className="w-5 h-5" strokeWidth={3} />
                                    </button>
                                    <button onClick={() => toggleAttendance(student.id, 'absent')} className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${status === 'absent' ? 'bg-rose-600 text-white shadow-md shadow-rose-900/50' : 'bg-[#374151] text-gray-500 hover:bg-rose-900/20 hover:text-rose-400 border border-gray-600'}`}>
                                        <X className="w-5 h-5" strokeWidth={3} />
                                    </button>
                                    <button onClick={() => toggleAttendance(student.id, 'late')} className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${status === 'late' ? 'bg-amber-600 text-white shadow-md shadow-amber-900/50' : 'bg-[#374151] text-gray-500 hover:bg-amber-900/20 hover:text-amber-400 border border-gray-600'}`}>
                                        <Clock className="w-5 h-5" strokeWidth={3} />
                                    </button>
                                    <button onClick={() => toggleAttendance(student.id, 'truant')} className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${status === 'truant' ? 'bg-purple-600 text-white shadow-md shadow-purple-900/50' : 'bg-[#374151] text-gray-500 hover:bg-purple-900/20 hover:text-purple-400 border border-gray-600'}`}>
                                        <DoorOpen className="w-5 h-5" strokeWidth={3} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 opacity-40">
                    <UserCircle2 className="w-16 h-16 text-gray-500 mb-4" />
                    <p className="text-xs font-bold text-gray-500">لا يوجد طلاب</p>
                </div>
            )}
        </div>

        {/* Notification Modal (Dark) */}
        <Modal isOpen={!!notificationTarget} onClose={() => setNotificationTarget(null)} className="max-w-xs rounded-[2rem]">
            <div className="text-center">
                <div className="w-16 h-16 bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-400 shadow-sm border border-blue-500/20">
                    <MessageCircle className="w-8 h-8" />
                </div>
                <h3 className="font-black text-lg mb-1 text-white">إشعار ولي الأمر</h3>
                <p className="text-xs text-gray-400 mb-6 font-bold">{notificationTarget?.student.name} - {notificationTarget?.type === 'truant' ? 'تسرب من الحصة' : (notificationTarget?.type === 'absent' ? 'غياب' : 'تأخير')}</p>
                
                <div className="space-y-3">
                    <button onClick={() => performNotification('whatsapp')} className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 transition-all active:scale-95">
                        <MessageCircle className="w-5 h-5" /> واتساب
                    </button>
                    <button onClick={() => performNotification('sms')} className="w-full bg-[#374151] hover:bg-[#4b5563] text-gray-200 py-3.5 rounded-2xl font-black text-sm transition-all active:scale-95 border border-gray-600">
                        رسالة نصية (SMS)
                    </button>
                    <button onClick={() => setNotificationTarget(null)} className="text-xs font-bold text-gray-500 mt-2 hover:text-gray-300">إلغاء</button>
                </div>
            </div>
        </Modal>

    </div>
  );
};

export default AttendanceTracker;
