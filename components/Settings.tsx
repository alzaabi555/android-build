
import React, { useRef, useState } from 'react';
import { Save, Upload, Trash2, AlertTriangle, Database, Download, RefreshCw, FileJson } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

const Settings: React.FC = () => {
  const { students, classes, groups, schedule, periodTimes, teacherInfo, assessmentTools } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState<'backup' | 'restore' | 'reset' | null>(null);

  // --- Logic: Backup Data ---
  const handleBackup = async () => {
    setLoading('backup');
    try {
      const dataToSave = {
        version: '3.3.0',
        timestamp: new Date().toISOString(),
        students,
        classes,
        groups,
        schedule,
        periodTimes,
        teacherInfo,
        assessmentTools
      };

      const fileName = `Rased_Backup_${new Date().toISOString().split('T')[0]}.json`;
      const jsonString = JSON.stringify(dataToSave, null, 2);

      if (Capacitor.isNativePlatform()) {
        // Native: Save to cache and share
        const result = await Filesystem.writeFile({
          path: fileName,
          data: jsonString,
          directory: Directory.Cache,
          encoding: Encoding.UTF8,
        });
        await Share.share({
          title: 'نسخة احتياطية - راصد',
          url: result.uri,
          dialogTitle: 'حفظ ملف البيانات',
        });
      } else {
        // Web: Download link
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      alert('تم إنشاء النسخة الاحتياطية بنجاح ✅');
    } catch (error) {
      console.error(error);
      alert('حدث خطأ أثناء الحفظ ❌');
    } finally {
      setLoading(null);
    }
  };

  // --- Logic: Restore Data ---
  const handleRestoreClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('تحذير: استعادة البيانات ستقوم باستبدال جميع البيانات الحالية. هل أنت متأكد؟')) {
        if(e.target) e.target.value = '';
        return;
    }

    setLoading('restore');
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        
        // Validation logic
        if (!json.students || !Array.isArray(json.students)) throw new Error('ملف غير صالح');

        // Restore to LocalStorage
        localStorage.setItem('studentData', JSON.stringify(json.students));
        localStorage.setItem('classesData', JSON.stringify(json.classes || []));
        localStorage.setItem('groupsData', JSON.stringify(json.groups || []));
        localStorage.setItem('scheduleData', JSON.stringify(json.schedule || []));
        localStorage.setItem('periodTimes', JSON.stringify(json.periodTimes || []));
        localStorage.setItem('assessmentTools', JSON.stringify(json.assessmentTools || []));
        
        if (json.teacherInfo) {
            localStorage.setItem('teacherName', json.teacherInfo.name || '');
            localStorage.setItem('schoolName', json.teacherInfo.school || '');
            localStorage.setItem('subjectName', json.teacherInfo.subject || '');
            localStorage.setItem('governorate', json.teacherInfo.governorate || '');
            localStorage.setItem('teacherAvatar', json.teacherInfo.avatar || '');
        }

        alert('تم استعادة البيانات بنجاح. سيتم إعادة تشغيل التطبيق.');
        window.location.reload();
      } catch (error) {
        alert('الملف تالف أو غير متوافق ❌');
      } finally {
        setLoading(null);
        if(e.target) e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  // --- Logic: Factory Reset ---
  const handleReset = () => {
    const confirmation = prompt('للتأكيد، اكتب كلمة "حذف" في المربع أدناه.\n\n⚠️ هذا الإجراء سيحذف كل البيانات نهائياً!');
    if (confirmation === 'حذف') {
        setLoading('reset');
        localStorage.clear();
        setTimeout(() => window.location.reload(), 1000);
    }
  };

  return (
    <div className="space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500 text-slate-900 dark:text-white">
      
      {/* Header */}
      <div 
        className="glass-heavy p-6 rounded-[2.5rem] border border-white/20 shadow-xl flex items-center justify-between select-none transition-transform"
      >
        <div>
            <h1 className="text-2xl font-black text-glow">إدارة البيانات</h1>
            <p className="text-xs font-bold text-slate-500 dark:text-white/60 mt-1">النسخ الاحتياطي والاستعادة وتصفير النظام</p>
        </div>
        <div className="w-12 h-12 glass-icon rounded-2xl flex items-center justify-center text-indigo-500">
            <Database className="w-6 h-6" />
        </div>
      </div>

      <div className="grid gap-6">
          
          {/* Backup Section */}
          <div className="glass-card p-6 rounded-[2rem] border border-emerald-500/20 relative overflow-hidden group hover:border-emerald-500/40 transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
              
              <div className="flex items-start gap-4 relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                      <Save className="w-7 h-7" />
                  </div>
                  <div className="flex-1">
                      <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">حفظ نسخة احتياطية</h3>
                      <p className="text-xs font-bold text-slate-500 dark:text-white/60 mb-4 leading-relaxed">
                          قم بتنزيل ملف كامل يحتوي على جميع بيانات الطلاب، الدرجات، الحضور، والجدول المدرسي. يفضل القيام بذلك أسبوعياً.
                      </p>
                      <button 
                        onClick={handleBackup} 
                        disabled={loading === 'backup'}
                        className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs shadow-lg shadow-emerald-500/30 active:scale-95 transition-all w-full md:w-auto justify-center"
                      >
                          {loading === 'backup' ? <RefreshCw className="w-4 h-4 animate-spin"/> : <Download className="w-4 h-4" />}
                          تصدير البيانات (Backup)
                      </button>
                  </div>
              </div>
          </div>

          {/* Restore Section */}
          <div className="glass-card p-6 rounded-[2rem] border border-blue-500/20 relative overflow-hidden group hover:border-blue-500/40 transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
              
              <div className="flex items-start gap-4 relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                      <Upload className="w-7 h-7" />
                  </div>
                  <div className="flex-1">
                      <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">استعادة البيانات</h3>
                      <p className="text-xs font-bold text-slate-500 dark:text-white/60 mb-4 leading-relaxed">
                          استرجع بياناتك من ملف JSON محفوظ سابقاً. انتبه: هذه العملية ستحذف البيانات الحالية وتستبدلها بالنسخة الجديدة.
                      </p>
                      <button 
                        onClick={handleRestoreClick}
                        disabled={loading === 'restore'}
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-xs shadow-lg shadow-blue-500/30 active:scale-95 transition-all w-full md:w-auto justify-center"
                      >
                          {loading === 'restore' ? <RefreshCw className="w-4 h-4 animate-spin"/> : <FileJson className="w-4 h-4" />}
                          استيراد ملف (Restore)
                      </button>
                      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
                  </div>
              </div>
          </div>

          {/* Reset Section */}
          <div className="glass-card p-6 rounded-[2rem] border border-rose-500/20 relative overflow-hidden group hover:border-rose-500/40 transition-all bg-rose-500/5">
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
              
              <div className="flex items-start gap-4 relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0 border border-rose-500/20">
                      <Trash2 className="w-7 h-7" />
                  </div>
                  <div className="flex-1">
                      <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">حذف كافة البيانات</h3>
                      <p className="text-xs font-bold text-slate-500 dark:text-white/60 mb-4 leading-relaxed">
                          تصفير التطبيق بالكامل وحذف جميع الطلاب والدرجات والجداول. استخدم هذا الخيار فقط عند بدء عام دراسي جديد كلياً.
                      </p>
                      <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 mb-4 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-rose-500" />
                          <span className="text-[10px] font-bold text-rose-600 dark:text-rose-300">لا يمكن التراجع عن هذا الإجراء</span>
                      </div>
                      <button 
                        onClick={handleReset}
                        disabled={loading === 'reset'}
                        className="flex items-center gap-2 px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-xs shadow-lg shadow-rose-500/30 active:scale-95 transition-all w-full md:w-auto justify-center"
                      >
                          {loading === 'reset' ? <RefreshCw className="w-4 h-4 animate-spin"/> : <Trash2 className="w-4 h-4" />}
                          حذف البيانات (Factory Reset)
                      </button>
                  </div>
              </div>
          </div>

      </div>
    </div>
  );
};

export default Settings;
