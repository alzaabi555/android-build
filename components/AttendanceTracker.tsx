import React, { useState, useMemo } from 'react';
import { Student, AttendanceStatus } from '../types';
import { Check, X, Clock, Calendar, Filter, MessageCircle, ChevronDown, CheckCircle2, RotateCcw, Search, Printer, Loader2, CalendarRange, UserCircle2, Share2, Download, FileSpreadsheet } from 'lucide-react';
import { Browser } from '@capacitor/browser';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from './Modal';
import { useTheme } from '../context/ThemeContext';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

declare var html2pdf: any;

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
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  
  const [notificationTarget, setNotificationTarget] = useState<{student: Student, type: 'absent' | 'late'} | null>(null);

  // iOS Style Classes
  const styles = {
      header: 'bg-white/80 dark:bg-[#0f172a]/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-white/5 sticky top-0 z-30 transition-all duration-300',
      contentContainer: 'px-4 pb-32 pt-4 overflow-y-auto custom-scrollbar',
      card: 'bg-white dark:bg-[#1c1c1e] active:scale-[0.99] transition-transform duration-200 touch-manipulation',
      search: 'bg-gray-100/80 dark:bg-white/10 rounded-xl border-none text-center focus:text-right transition-all',
      pill: 'rounded-full text-xs font-bold transition-all',
  };

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
      return { present, absent, late, total: filteredStudents.length };
  }, [filteredStudents, selectedDate]);

  const performNotification = async (method: 'whatsapp' | 'sms') => {
      if(!notificationTarget || !notificationTarget.student.parentPhone) {
          alert('لا يوجد رقم هاتف مسجل');
          return;
      }
      
      const { student, type } = notificationTarget;
      
      // Clean phone number strictly
      let cleanPhone = student.parentPhone.replace(/[^0-9]/g, '');
      
      // Validate length (Oman numbers are usually 8 digits, with 968 country code becomes 11)
      if (!cleanPhone || cleanPhone.length < 5) {
          alert('رقم الهاتف غير صحيح أو قصير جداً');
          return;
      }
      
      // Add country code if missing (Assuming Oman +968)
      if (cleanPhone.startsWith('00')) cleanPhone = cleanPhone.substring(2);
      
      if (cleanPhone.length === 8) {
          cleanPhone = '968' + cleanPhone;
      } else if (cleanPhone.length === 9 && cleanPhone.startsWith('0')) {
          cleanPhone = '968' + cleanPhone.substring(1);
      }

      const statusText = type === 'absent' ? 'غائب' : 'متأخر';
      const dateText = new Date().toLocaleDateString('ar-EG');
      const msg = encodeURIComponent(`السلام عليكم، نود إشعاركم بأن الطالب ${student.name} تم تسجيله *${statusText}* اليوم (${dateText}).`);
      
      if (method === 'whatsapp') {
          const appUrl = `whatsapp://send?phone=${cleanPhone}&text=${msg}`;
          const webUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${msg}`;
          
          if (Capacitor.isNativePlatform()) {
              try {
                  await Browser.open({ url: appUrl });
              } catch (e) {
                  await Browser.open({ url: webUrl });
              }
          } else {
              window.open(webUrl, '_blank');
          }
      } else {
          window.location.href = `sms:${cleanPhone}?body=${msg}`;
      }
      setNotificationTarget(null);
  };

  // --- iOS Compatible Excel Export ---
  const handleExportDailyExcel = async () => {
      if (filteredStudents.length === 0) return alert('لا يوجد طلاب');
      setIsExportingExcel(true);

      try {
          const data = filteredStudents.map((s, i) => ({
              'م': i + 1,
              'الاسم': s.name,
              'الصف': s.classes[0] || '',
              'الحالة': getStatus(s) === 'present' ? 'حاضر' : getStatus(s) === 'absent' ? 'غائب' : getStatus(s) === 'late' ? 'تأخر' : 'غير مسجل',
              'التاريخ': selectedDate
          }));

          const ws = XLSX.utils.json_to_sheet(data);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, "الحضور اليومي");
          
          const fileName = `حضور_${selectedDate}.xlsx`;

          if (Capacitor.isNativePlatform()) {
              // 1. Write File
              const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
              const result = await Filesystem.writeFile({
                  path: fileName,
                  data: wbout,
                  directory: Directory.Cache
              });

              // 2. Share File
              await Share.share({
                  title: 'مشاركة ملف الحضور',
                  text: `كشف حضور ليوم ${selectedDate}`,
                  url: result.uri,
                  dialogTitle: 'مشاركة عبر'
              });
          } else {
              // Web Fallback
              XLSX.writeFile(wb, fileName);
          }
      } catch (error) {
          console.error("Export Error:", error);
          alert("حدث خطأ أثناء التصدير.");
      } finally {
          setIsExportingExcel(false);
      }
  };

  // --- PDF Export Logic ---
  const getBase64Image = async (url: string): Promise<string> => {
      try {
          const response = await fetch(url);
          const blob = await response.blob();
          return new Promise((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
          });
      } catch { return ""; }
  };

  const handlePrintDailyReport = async () => {
    if (filteredStudents.length === 0) return alert('لا يوجد بيانات');
    setIsGeneratingPdf(true);

    const teacherName = localStorage.getItem('teacherName') || '................';
    const schoolName = localStorage.getItem('schoolName') || '................';
    let emblemSrc = await getBase64Image('oman_logo.png') || await getBase64Image('icon.png');

    const rows = filteredStudents.map((s, i) => {
        const st = getStatus(s);
        const stText = st === 'present' ? 'حاضر' : st === 'absent' ? 'غائب' : st === 'late' ? 'تأخر' : '-';
        const stColor = st === 'absent' ? 'red' : 'black';
        return `
            <tr>
                <td style="border:1px solid #000; padding:5px; text-align:center;">${i + 1}</td>
                <td style="border:1px solid #000; padding:5px; text-align:right;">${s.name}</td>
                <td style="border:1px solid #000; padding:5px; text-align:center;">${s.classes[0] || ''}</td>
                <td style="border:1px solid #000; padding:5px; text-align:center; color:${stColor}; font-weight:bold;">${stText}</td>
            </tr>
        `;
    }).join('');

    const content = `
        <div style="font-family:'Tajawal',sans-serif; direction:rtl; padding:20px; color:#000;">
            <div style="text-align:center; margin-bottom:20px; border-bottom:2px solid #000; padding-bottom:10px;">
                ${emblemSrc ? `<img src="${emblemSrc}" style="height:60px; margin-bottom:5px;" />` : ''}
                <h2 style="margin:5px 0;">كشف الحضور اليومي</h2>
                <p style="margin:0; font-size:12px;">التاريخ: ${selectedDate} | المدرسة: ${schoolName}</p>
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom:10px; font-weight:bold; font-size:12px; background:#f0f0f0; padding:5px; border-radius:5px;">
                <span>إجمالي الطلاب: ${stats.total}</span>
                <span>حضور: ${stats.present}</span>
                <span style="color:red;">غياب: ${stats.absent}</span>
                <span style="color:#d97706;">تأخر: ${stats.late}</span>
            </div>
            <table style="width:100%; border-collapse:collapse; font-size:12px;">
                <tr style="background:#e5e5e5;">
                    <th style="border:1px solid #000; padding:5px; width:40px;">#</th>
                    <th style="border:1px solid #000; padding:5px;">الطالب</th>
                    <th style="border:1px solid #000; padding:5px; width:60px;">الصف</th>
                    <th style="border:1px solid #000; padding:5px; width:60px;">الحالة</th>
                </tr>
                ${rows}
            </table>
        </div>
    `;

    const element = document.createElement('div');
    element.innerHTML = content;
    
    // PDF Generation
    const opt = {
        margin: 10,
        filename: `Attendance_${selectedDate}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    if (typeof html2pdf !== 'undefined') {
        const worker = html2pdf().set(opt).from(element).toPdf();
        if (Capacitor.isNativePlatform()) {
             const pdfBase64 = await worker.output('datauristring');
             const base64Data = pdfBase64.split(',')[1];
             const result = await Filesystem.writeFile({
                  path: `Attendance_${selectedDate}.pdf`,
                  data: base64Data,
                  directory: Directory.Cache
             });
             await Share.share({
                  url: result.uri,
                  title: 'مشاركة التقرير'
             });
        } else {
             worker.save();
        }
    }
    setIsGeneratingPdf(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-60px)] -mt-4 -mx-4 text-slate-900 dark:text-white relative bg-slate-50 dark:bg-[#000]">
        
        {/* iOS Style Header */}
        <div className={styles.header}>
            <div className="px-5 pt-4 pb-2">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-[28px] font-black tracking-tight text-slate-900 dark:text-white">الغياب</h1>
                    <div className="flex gap-2">
                         <button onClick={handlePrintDailyReport} disabled={isGeneratingPdf} className="w-9 h-9 bg-slate-100 dark:bg-white/10 rounded-full flex items-center justify-center text-slate-600 dark:text-white shadow-sm active:scale-90 transition-transform">
                             {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin"/> : <Printer className="w-5 h-5"/>}
                         </button>
                         <button onClick={handleExportDailyExcel} disabled={isExportingExcel} className="w-9 h-9 bg-emerald-50 dark:bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm active:scale-90 transition-transform">
                             {isExportingExcel ? <Loader2 className="w-4 h-4 animate-spin"/> : <Share2 className="w-5 h-5"/>}
                         </button>
                    </div>
                </div>

                {/* Date Scroller (Simplified) */}
                <div className="flex items-center justify-between bg-gray-100/50 dark:bg-white/5 rounded-xl p-1 mb-3">
                    <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() - 1); setSelectedDate(d.toLocaleDateString('en-CA')); }} className="p-2 rounded-lg hover:bg-white dark:hover:bg-white/10 shadow-sm"><ChevronDown className="w-4 h-4 rotate-90"/></button>
                    <div className="flex items-center gap-2 font-bold text-sm">
                        <Calendar className="w-4 h-4 text-indigo-500"/>
                        {formatDateDisplay(selectedDate)}
                    </div>
                    <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate() + 1); setSelectedDate(d.toLocaleDateString('en-CA')); }} className="p-2 rounded-lg hover:bg-white dark:hover:bg-white/10 shadow-sm"><ChevronDown className="w-4 h-4 -rotate-90"/></button>
                </div>

                {/* Filters Row */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
                    <div className="relative flex-1 min-w-[120px]">
                        <Search className="absolute right-3 top-2.5 w-3.5 h-3.5 text-gray-400"/>
                        <input 
                            type="text" 
                            placeholder="بحث..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`w-full py-2 pr-8 pl-3 text-xs font-bold outline-none ${styles.search}`} 
                        />
                    </div>
                    <div className="h-6 w-px bg-gray-200 dark:bg-white/10 mx-1 shrink-0"></div>
                    <button onClick={() => setClassFilter('all')} className={`px-4 py-2 text-[10px] whitespace-nowrap ${styles.pill} ${classFilter === 'all' ? 'bg-indigo-600 text-white border-transparent' : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10'}`}>الكل</button>
                    {classes.map(c => (
                        <button key={c} onClick={() => setClassFilter(c)} className={`px-4 py-2 text-[10px] whitespace-nowrap ${styles.pill} ${classFilter === c ? 'bg-indigo-600 text-white border-transparent' : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10'}`}>{c}</button>
                    ))}
                </div>
            </div>

            {/* Live Stats Strip */}
            <div className="grid grid-cols-4 gap-px bg-gray-200 dark:bg-white/10 border-t border-gray-200 dark:border-white/5">
                <button onClick={() => handleMarkAll('present')} className="bg-white dark:bg-[#1c1c1e] py-3 flex flex-col items-center active:bg-gray-50 dark:active:bg-white/5">
                    <span className="text-[10px] font-bold text-gray-400 mb-0.5">حضور</span>
                    <span className="text-sm font-black text-emerald-500">{stats.present}</span>
                </button>
                <button onClick={() => handleMarkAll('absent')} className="bg-white dark:bg-[#1c1c1e] py-3 flex flex-col items-center active:bg-gray-50 dark:active:bg-white/5">
                    <span className="text-[10px] font-bold text-gray-400 mb-0.5">غياب</span>
                    <span className="text-sm font-black text-rose-500">{stats.absent}</span>
                </button>
                <button onClick={() => handleMarkAll('late')} className="bg-white dark:bg-[#1c1c1e] py-3 flex flex-col items-center active:bg-gray-50 dark:active:bg-white/5">
                    <span className="text-[10px] font-bold text-gray-400 mb-0.5">تأخر</span>
                    <span className="text-sm font-black text-amber-500">{stats.late}</span>
                </button>
                <button onClick={() => handleMarkAll('reset')} className="bg-white dark:bg-[#1c1c1e] py-3 flex flex-col items-center active:bg-gray-50 dark:active:bg-white/5">
                    <span className="text-[10px] font-bold text-gray-400 mb-0.5">غير محدد</span>
                    <span className="text-sm font-black text-gray-400">{stats.total - (stats.present + stats.absent + stats.late)}</span>
                </button>
            </div>
        </div>

        {/* Student List */}
        <div className={styles.contentContainer}>
            {filteredStudents.length > 0 ? (
                <div className="flex flex-col gap-2">
                    {filteredStudents.map((student) => {
                        const status = getStatus(student);
                        return (
                            <motion.div 
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={student.id} 
                                className={`p-3 rounded-[18px] border flex items-center justify-between ${styles.card} ${
                                    status === 'absent' ? 'border-rose-100 bg-rose-50/30 dark:border-rose-500/20 dark:bg-rose-500/5' : 
                                    status === 'present' ? 'border-emerald-100 bg-emerald-50/30 dark:border-emerald-500/20 dark:bg-emerald-500/5' : 
                                    status === 'late' ? 'border-amber-100 bg-amber-50/30 dark:border-amber-500/20 dark:bg-amber-500/5' : 
                                    'border-transparent'
                                }`}
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-black shrink-0 shadow-sm ${
                                        status === 'absent' ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-300' :
                                        status === 'late' ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300' :
                                        status === 'present' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300' :
                                        'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400'
                                    }`}>
                                        {student.avatar ? <img src={student.avatar} className="w-full h-full object-cover rounded-full" /> : student.name.charAt(0)}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className={`text-sm font-bold truncate ${status ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-gray-300'}`}>{student.name}</h3>
                                        {(status === 'absent' || status === 'late') && (
                                            <button 
                                                onClick={() => setNotificationTarget({ student, type: status === 'absent' ? 'absent' : 'late' })}
                                                className={`mt-1 flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md w-fit active:scale-95 ${
                                                    status === 'absent' 
                                                    ? 'text-rose-500 bg-rose-100 dark:bg-rose-500/20' 
                                                    : 'text-amber-600 bg-amber-100 dark:bg-amber-500/20'
                                                }`}
                                            >
                                                <MessageCircle className="w-3 h-3" /> {status === 'absent' ? 'إشعار غياب' : 'إشعار تأخير'}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                    <button onClick={() => toggleAttendance(student.id, 'present')} className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${status === 'present' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-110' : 'bg-gray-100 dark:bg-white/5 text-gray-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 hover:text-emerald-500'}`}>
                                        <Check className="w-5 h-5" strokeWidth={3} />
                                    </button>
                                    <button onClick={() => toggleAttendance(student.id, 'absent')} className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${status === 'absent' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30 scale-110' : 'bg-gray-100 dark:bg-white/5 text-gray-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 hover:text-rose-500'}`}>
                                        <X className="w-5 h-5" strokeWidth={3} />
                                    </button>
                                    <button onClick={() => toggleAttendance(student.id, 'late')} className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${status === 'late' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30 scale-110' : 'bg-gray-100 dark:bg-white/5 text-gray-400 hover:bg-amber-100 dark:hover:bg-amber-500/20 hover:text-amber-500'}`}>
                                        <Clock className="w-5 h-5" strokeWidth={3} />
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 opacity-40">
                    <UserCircle2 className="w-16 h-16 text-slate-300 dark:text-white mb-4" />
                    <p className="text-sm font-bold text-slate-400 dark:text-white">لا يوجد طلاب مطابقين</p>
                </div>
            )}
        </div>

        {/* Notification Modal */}
        <Modal isOpen={!!notificationTarget} onClose={() => setNotificationTarget(null)} className="max-w-xs rounded-[2rem]">
            <div className="text-center">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600 dark:text-emerald-400">
                    <MessageCircle className="w-8 h-8" />
                </div>
                <h3 className="font-black text-lg mb-1 dark:text-white">إرسال إشعار</h3>
                <p className="text-xs text-gray-500 mb-6 font-bold">{notificationTarget?.student.name}</p>
                
                <div className="space-y-3">
                    <button onClick={() => performNotification('whatsapp')} className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 transition-all active:scale-95">
                        <MessageCircle className="w-5 h-5" /> واتساب
                    </button>
                    <button onClick={() => performNotification('sms')} className="w-full bg-slate-100 dark:bg-white/10 hover:bg-slate-200 text-slate-700 dark:text-white py-3.5 rounded-xl font-black text-sm transition-all active:scale-95">
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