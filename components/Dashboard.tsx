
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Student, ScheduleDay, PeriodTime } from '../types';
import { 
  Bell, Clock, Edit3, Settings, 
  MapPin, School, BookOpen, Camera, Upload, FileSpreadsheet, Loader2, 
  ChevronLeft, ChevronRight, Stamp, Building, CalendarDays, PlayCircle
} from 'lucide-react';
import Modal from './Modal';
import { useTheme } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import * as XLSX from 'xlsx';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

interface DashboardProps {
    students: Student[];
    teacherInfo: { name: string; school: string; subject: string; governorate: string; avatar?: string; stamp?: string; ministryLogo?: string; academicYear?: string };
    onUpdateTeacherInfo: (info: any) => void;
    schedule: ScheduleDay[];
    onUpdateSchedule: (schedule: ScheduleDay[]) => void;
    onSelectStudent: (student: Student) => void;
    onNavigate: (tab: string) => void;
    onOpenSettings: () => void;
    periodTimes: PeriodTime[];
    setPeriodTimes: React.Dispatch<React.SetStateAction<PeriodTime[]>>;
    notificationsEnabled: boolean;
    onToggleNotifications: () => void;
}

const BELL_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

const Dashboard: React.FC<DashboardProps> = ({
    students,
    teacherInfo,
    onUpdateTeacherInfo,
    schedule,
    onUpdateSchedule,
    onNavigate,
    onOpenSettings,
    periodTimes,
    setPeriodTimes,
    notificationsEnabled,
    onToggleNotifications
}) => {
    const { classes } = useApp();
    const { theme } = useTheme();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const stampInputRef = useRef<HTMLInputElement>(null); 
    const ministryLogoInputRef = useRef<HTMLInputElement>(null); 
    const scheduleFileInputRef = useRef<HTMLInputElement>(null);

    const [isImportingSchedule, setIsImportingSchedule] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    
    // State for Teacher Info Modal
    const [showEditModal, setShowEditModal] = useState(false);
    const [editName, setEditName] = useState(teacherInfo.name);
    const [editSchool, setEditSchool] = useState(teacherInfo.school);
    const [editSubject, setEditSubject] = useState(teacherInfo.subject);
    const [editGovernorate, setEditGovernorate] = useState(teacherInfo.governorate);
    const [editAvatar, setEditAvatar] = useState(teacherInfo.avatar || '');
    const [editStamp, setEditStamp] = useState(teacherInfo.stamp || '');
    const [editMinistryLogo, setEditMinistryLogo] = useState(teacherInfo.ministryLogo || '');
    const [editAcademicYear, setEditAcademicYear] = useState(teacherInfo.academicYear || '');

    // State for Schedule/Timing Modal
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [scheduleTab, setScheduleTab] = useState<'timing' | 'classes'>('timing');
    const [editingDayIndex, setEditingDayIndex] = useState(0); 
    const [tempPeriodTimes, setTempPeriodTimes] = useState<PeriodTime[]>([]);
    const [tempSchedule, setTempSchedule] = useState<ScheduleDay[]>([]);

    useEffect(() => {
        setEditName(teacherInfo.name);
        setEditSchool(teacherInfo.school);
        setEditSubject(teacherInfo.subject);
        setEditGovernorate(teacherInfo.governorate);
        setEditAvatar(teacherInfo.avatar || '');
        setEditStamp(teacherInfo.stamp || '');
        setEditMinistryLogo(teacherInfo.ministryLogo || '');
        setEditAcademicYear(teacherInfo.academicYear || '');
    }, [teacherInfo]);

    // Update clock every minute
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    // Initialize temp states
    useEffect(() => {
        if (showScheduleModal) {
            setTempPeriodTimes(JSON.parse(JSON.stringify(periodTimes)));
            setTempSchedule(JSON.parse(JSON.stringify(schedule)));
        }
    }, [showScheduleModal, periodTimes, schedule]);

    const handleSaveInfo = () => {
        onUpdateTeacherInfo({
            name: editName,
            school: editSchool,
            subject: editSubject,
            governorate: editGovernorate,
            avatar: editAvatar,
            stamp: editStamp,
            ministryLogo: editMinistryLogo,
            academicYear: editAcademicYear
        });
        setShowEditModal(false);
    };

    const handleSaveScheduleSettings = () => {
        setPeriodTimes(tempPeriodTimes);
        onUpdateSchedule(tempSchedule);
        setShowScheduleModal(false);
    };

    const updateTempTime = (index: number, field: 'startTime' | 'endTime', value: string) => {
        const newTimes = [...tempPeriodTimes];
        newTimes[index] = { ...newTimes[index], [field]: value };
        setTempPeriodTimes(newTimes);
    };

    const updateTempClass = (dayIdx: number, periodIdx: number, value: string) => {
        const newSchedule = [...tempSchedule];
        newSchedule[dayIdx].periods[periodIdx] = value;
        setTempSchedule(newSchedule);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setEditAvatar(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleStampUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setEditStamp(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleMinistryLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setEditMinistryLogo(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleImportSchedule = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsImportingSchedule(true);
        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data, { type: 'array' });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

            const newSchedule: ScheduleDay[] = [
                { dayName: 'الأحد', periods: Array(8).fill('') },
                { dayName: 'الاثنين', periods: Array(8).fill('') },
                { dayName: 'الثلاثاء', periods: Array(8).fill('') },
                { dayName: 'الأربعاء', periods: Array(8).fill('') },
                { dayName: 'الخميس', periods: Array(8).fill('') }
            ];

            jsonData.forEach(row => {
                if (row.length < 2) return;
                const firstCell = String(row[0]).trim();
                const dayIndex = newSchedule.findIndex(d => d.dayName === firstCell || firstCell.includes(d.dayName));
                if (dayIndex !== -1) {
                    for (let i = 1; i <= 8; i++) {
                        if (row[i]) {
                            newSchedule[dayIndex].periods[i-1] = String(row[i]).trim();
                        }
                    }
                }
            });

            onUpdateSchedule(newSchedule);
            alert('تم استيراد الجدول بنجاح');
        } catch (error) {
            console.error(error);
            alert('حدث خطأ أثناء استيراد الجدول.');
        } finally {
            setIsImportingSchedule(false);
            if (e.target) e.target.value = '';
        }
    };

    const checkActivePeriod = (start: string, end: string) => {
        if (!start || !end) return false;
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        
        const [sh, sm] = start.split(':').map(Number);
        const [eh, em] = end.split(':').map(Number);
        
        const startMinutes = sh * 60 + sm;
        const endMinutes = eh * 60 + em;

        return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    };

    // Test Notification Button Logic
    const handleTestNotification = async () => {
        if (Capacitor.isNativePlatform()) {
            try {
                const perm = await LocalNotifications.requestPermissions();
                if (perm.display !== 'granted') {
                    alert('يرجى تفعيل الإشعارات من إعدادات الهاتف أولاً');
                    return;
                }
                const target = new Date();
                target.setSeconds(target.getSeconds() + 5);
                await LocalNotifications.schedule({
                    notifications: [
                        {
                            title: "🔔 تجربة الجرس",
                            body: "هذا اختبار للتأكد من عمل الإشعارات والصوت.",
                            id: 99999,
                            schedule: { at: target },
                            sound: 'beep.wav',
                            actionTypeId: "",
                            extra: null
                        }
                    ]
                });
                alert('تم جدولة جرس تجريبي بعد 5 ثوانٍ.');
            } catch (e) {
                alert('حدث خطأ: ' + JSON.stringify(e));
            }
        } else {
            const audio = new Audio(BELL_SOUND_URL);
            audio.play().then(() => alert('تم تشغيل الصوت التجريبي')).catch(() => alert('المتصفح منع الصوت'));
        }
    };

    const today = new Date();
    const dayIndex = today.getDay();
    const todaySchedule = schedule[dayIndex] || { dayName: 'اليوم', periods: [] };
    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];

    return (
        <div className="space-y-6 pb-20 text-slate-900 dark:text-white animate-in fade-in duration-500">
            
            {/* 1. Top Section: Teacher Profile Card */}
            <div className="glass-heavy rounded-[2.5rem] p-6 relative overflow-hidden shadow-2xl border border-white/20 group transition-all hover:bg-white/5">
                <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-indigo-500/10 to-purple-500/10 opacity-50 z-0"></div>
                
                <div className="relative z-10 flex items-center justify-between">
                    <button 
                        onClick={() => setShowEditModal(true)}
                        className="glass-icon p-3 rounded-2xl text-slate-500 dark:text-white/80 hover:text-white hover:bg-white/20 transition-all absolute left-0 top-0"
                    >
                        <Edit3 className="w-5 h-5" />
                    </button>

                    <div className="flex flex-col items-center w-full">
                        <div className="mt-2"></div>
                        <div className="w-24 h-24 rounded-[2rem] glass-card p-1 shadow-2xl mb-3 relative group-hover:scale-105 transition-transform border border-white/30">
                             {teacherInfo.avatar ? (
                                <img src={teacherInfo.avatar} className="w-full h-full object-cover rounded-[1.8rem]" alt="Profile" />
                             ) : (
                                <div className="w-full h-full bg-indigo-600 rounded-[1.8rem] flex items-center justify-center text-3xl font-black text-white">
                                    {teacherInfo.name ? teacherInfo.name.charAt(0) : 'T'}
                                </div>
                             )}
                        </div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white text-center mb-1 text-glow">
                            {teacherInfo.name || 'مرحباً بك يا معلم'}
                        </h1>
                        <div className="flex flex-col items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-300">
                            {teacherInfo.school && <span className="flex items-center gap-1"><School className="w-3 h-3 text-indigo-500"/> {teacherInfo.school}</span>}
                            {teacherInfo.subject && <span className="flex items-center gap-1"><BookOpen className="w-3 h-3 text-emerald-500"/> {teacherInfo.subject}</span>}
                        </div>
                        {teacherInfo.governorate && (
                            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-white/10 w-full text-center">
                                <span className="text-[10px] text-slate-400 dark:text-white/50 font-bold flex items-center justify-center gap-1">
                                    <MapPin className="w-3 h-3" /> {teacherInfo.governorate}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Schedule Card */}
            <div className="glass-card rounded-[2.5rem] p-5 border border-white/20 shadow-xl bg-white/5 relative">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                        <button onClick={() => setShowScheduleModal(true)} className="w-9 h-9 glass-icon rounded-full text-slate-500 dark:text-white/60 hover:text-indigo-500 hover:bg-white/10 transition-colors">
                            <Settings className="w-4 h-4" />
                        </button>
                        <button onClick={onToggleNotifications} className={`w-9 h-9 glass-icon rounded-full transition-colors ${notificationsEnabled ? 'text-amber-500 bg-amber-500/10' : 'text-slate-500 dark:text-white/60'}`}>
                            <Bell className={`w-4 h-4 ${notificationsEnabled ? 'fill-amber-500' : ''}`} />
                        </button>
                        <button onClick={handleTestNotification} className="w-9 h-9 glass-icon rounded-full text-slate-500 dark:text-white/60 hover:text-purple-500 hover:bg-white/10 transition-colors" title="تجربة الجرس">
                            <PlayCircle className="w-4 h-4" />
                        </button>
                        <button onClick={() => scheduleFileInputRef.current?.click()} className="w-9 h-9 glass-icon rounded-full text-slate-500 dark:text-white/60 hover:text-emerald-500 hover:bg-white/10 transition-colors relative">
                            {isImportingSchedule ? <Loader2 className="w-4 h-4 animate-spin"/> : <FileSpreadsheet className="w-4 h-4" />}
                        </button>
                        <input type="file" ref={scheduleFileInputRef} onChange={handleImportSchedule} accept=".xlsx, .xls" className="hidden" />
                    </div>
                    <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                        جدول {todaySchedule.dayName}
                        <Clock className="w-5 h-5 text-indigo-500" />
                    </h2>
                </div>
                {/* تم تعديل الشبكة لتكون مرنة: عمودين في الشاشات الصغيرة و 4 في الكبيرة */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {todaySchedule.periods.map((cls, idx) => {
                        const pt = periodTimes[idx] || { startTime: '--:--', endTime: '--:--' };
                        const isActive = checkActivePeriod(pt.startTime, pt.endTime) && todaySchedule.dayName === days[dayIndex];
                        return (
                            <div key={idx} className={`p-2 rounded-xl border flex flex-col items-center justify-center text-center min-h-[70px] relative overflow-hidden transition-all duration-300 ${isActive ? 'bg-indigo-600 text-white border-indigo-400 shadow-[0_0_20px_rgba(79,70,229,0.4)] scale-105 z-10 ring-2 ring-indigo-300 dark:ring-indigo-700' : 'glass-card border-white/5 hover:bg-white/5'}`}>
                                {isActive && <div className="absolute top-0 right-0 left-0 h-0.5 bg-white animate-pulse"></div>}
                                {isActive && <span className="text-[7px] font-black bg-white text-indigo-600 px-1.5 rounded-full mb-0.5 animate-bounce">جارية الآن</span>}
                                <div className={`text-[9px] font-black mb-0.5 ${isActive ? 'text-indigo-200' : 'text-indigo-400'}`}>#{idx + 1}</div>
                                <h3 className={`text-xs font-black truncate w-full px-1 ${isActive ? 'text-white' : 'text-slate-800 dark:text-white'}`}>{cls || '-'}</h3>
                                <span className={`text-[8px] font-bold dir-ltr block mt-0.5 ${isActive ? 'text-indigo-100' : 'text-slate-400 dark:text-white/40'}`}>{pt.startTime} - {pt.endTime}</span>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Edit Teacher Info Modal */}
            <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)}>
                 <div className="text-center">
                    <h3 className="font-black text-2xl mb-6 text-slate-900 dark:text-white">بيانات المعلم</h3>
                    
                    <div className="flex gap-4 justify-center mb-6 overflow-x-auto pb-2">
                        {/* Avatar Uploader */}
                        <div className="relative w-24 h-24 group cursor-pointer shrink-0" onClick={() => fileInputRef.current?.click()}>
                            <div className="w-full h-full rounded-[2rem] overflow-hidden border-4 border-white/20 shadow-xl glass-card">
                                {editAvatar ? (
                                    <img src={editAvatar} className="w-full h-full object-cover" alt="Avatar" />
                                ) : (
                                    <div className="w-full h-full bg-indigo-600 flex items-center justify-center text-3xl font-black text-white">
                                        {editName ? editName.charAt(0) : 'T'}
                                    </div>
                                )}
                            </div>
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-[2rem]">
                                <Camera className="w-6 h-6 text-white" />
                            </div>
                            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                            <p className="text-[10px] font-bold text-slate-500 dark:text-white/50 mt-1">الصورة الشخصية</p>
                        </div>

                        {/* Stamp Uploader */}
                        <div className="relative w-24 h-24 group cursor-pointer shrink-0" onClick={() => stampInputRef.current?.click()}>
                            <div className="w-full h-full rounded-[2rem] overflow-hidden border-4 border-white/20 shadow-xl glass-card flex items-center justify-center bg-white dark:bg-white/10">
                                {editStamp ? (
                                    <img src={editStamp} className="w-full h-full object-contain p-2" alt="Stamp" />
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-slate-300 dark:text-white/30">
                                        <Stamp className="w-8 h-8 mb-1" />
                                    </div>
                                )}
                            </div>
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-[2rem]">
                                <Upload className="w-6 h-6 text-white" />
                            </div>
                            <input type="file" ref={stampInputRef} onChange={handleStampUpload} accept="image/*" className="hidden" />
                            <p className="text-[10px] font-bold text-slate-500 dark:text-white/50 mt-1">ختم المدرسة</p>
                        </div>

                        {/* Ministry Logo Uploader */}
                        <div className="relative w-24 h-24 group cursor-pointer shrink-0" onClick={() => ministryLogoInputRef.current?.click()}>
                            <div className="w-full h-full rounded-[2rem] overflow-hidden border-4 border-white/20 shadow-xl glass-card flex items-center justify-center bg-white dark:bg-white/10">
                                {editMinistryLogo ? (
                                    <img src={editMinistryLogo} className="w-full h-full object-contain p-2" alt="Ministry Logo" />
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-slate-300 dark:text-white/30">
                                        <Building className="w-8 h-8 mb-1" />
                                    </div>
                                )}
                            </div>
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-[2rem]">
                                <Upload className="w-6 h-6 text-white" />
                            </div>
                            <input type="file" ref={ministryLogoInputRef} onChange={handleMinistryLogoUpload} accept="image/*" className="hidden" />
                            <p className="text-[10px] font-bold text-slate-500 dark:text-white/50 mt-1">شعار الوزارة</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <input className="w-full p-4 glass-input rounded-2xl font-bold text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 outline-none focus:border-indigo-500/50" value={editName} onChange={e => setEditName(e.target.value)} placeholder="الاسم" />
                        <input className="w-full p-4 glass-input rounded-2xl font-bold text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 outline-none focus:border-indigo-500/50" value={editSchool} onChange={e => setEditSchool(e.target.value)} placeholder="المدرسة" />
                        <input className="w-full p-4 glass-input rounded-2xl font-bold text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 outline-none focus:border-indigo-500/50" value={editSubject} onChange={e => setEditSubject(e.target.value)} placeholder="المادة" />
                        <input className="w-full p-4 glass-input rounded-2xl font-bold text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 outline-none focus:border-indigo-500/50" value={editGovernorate} onChange={e => setEditGovernorate(e.target.value)} placeholder="المديرية التعليمية (مثال: مسقط)" />
                        
                        <div className="relative">
                            <CalendarDays className="absolute right-4 top-4 w-5 h-5 text-indigo-500/50" />
                            <input 
                                className="w-full p-4 pr-12 glass-input rounded-2xl font-bold text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 outline-none focus:border-indigo-500/50" 
                                value={editAcademicYear} 
                                onChange={e => setEditAcademicYear(e.target.value)} 
                                placeholder="العام الدراسي (مثال: 2024 / 2025)" 
                            />
                        </div>

                        <button onClick={handleSaveInfo} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-sm mt-4 shadow-lg shadow-indigo-500/30 active:scale-95 transition-all">حفظ التغييرات</button>
                    </div>
                 </div>
            </Modal>

            {/* Schedule & Timing Modal */}
            <Modal isOpen={showScheduleModal} onClose={() => setShowScheduleModal(false)} className="max-w-lg rounded-[2.5rem]">
                <div className="flex flex-col h-[70vh]">
                    <h3 className="font-black text-xl mb-6 text-center text-slate-900 dark:text-white">إعدادات الجدول والتوقيت</h3>
                    <div className="flex bg-white/10 p-1 rounded-xl mb-4 shrink-0">
                        <button onClick={() => setScheduleTab('timing')} className={`flex-1 py-2 rounded-lg text-xs font-black transition-all ${scheduleTab === 'timing' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 dark:text-white/60 hover:bg-white/10'}`}>توقيت الحصص</button>
                        <button onClick={() => setScheduleTab('classes')} className={`flex-1 py-2 rounded-lg text-xs font-black transition-all ${scheduleTab === 'classes' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 dark:text-white/60 hover:bg-white/10'}`}>توزيع الحصص</button>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
                        {scheduleTab === 'timing' ? (
                            <div className="space-y-3">
                                <p className="text-[10px] text-slate-400 text-center mb-2 font-bold">اضبط وقت بداية ونهاية كل حصة لتفعيل الجرس</p>
                                {tempPeriodTimes.map((pt, i) => (
                                    <div key={i} className="flex items-center gap-2 glass-card p-3 rounded-xl border border-white/5">
                                        <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500 font-black text-sm shrink-0">{i + 1}</div>
                                        <input type="time" className="flex-1 bg-transparent text-center font-bold text-slate-900 dark:text-white text-sm outline-none border-b border-white/10 focus:border-indigo-500" value={pt.startTime} onChange={(e) => updateTempTime(i, 'startTime', e.target.value)} />
                                        <span className="text-slate-400 text-xs">إلى</span>
                                        <input type="time" className="flex-1 bg-transparent text-center font-bold text-slate-900 dark:text-white text-sm outline-none border-b border-white/10 focus:border-indigo-500" value={pt.endTime} onChange={(e) => updateTempTime(i, 'endTime', e.target.value)} />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between glass-card p-2 rounded-xl border border-white/5 sticky top-0 z-10 backdrop-blur-md">
                                    <button onClick={() => setEditingDayIndex(prev => prev > 0 ? prev - 1 : 4)} className="p-2 glass-icon rounded-lg"><ChevronRight className="w-4 h-4"/></button>
                                    <span className="font-black text-sm text-slate-900 dark:text-white">{days[editingDayIndex]}</span>
                                    <button onClick={() => setEditingDayIndex(prev => prev < 4 ? prev + 1 : 0)} className="p-2 glass-icon rounded-lg"><ChevronLeft className="w-4 h-4"/></button>
                                </div>
                                <div className="space-y-2">
                                    {Array(8).fill(null).map((_, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <span className="text-[10px] font-bold text-slate-400 w-10">حصة {i + 1}</span>
                                            <input type="text" placeholder="اسم المادة / الفصل" className="flex-1 p-3 glass-input rounded-xl text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-500/40 outline-none focus:border-indigo-500/50" value={tempSchedule[editingDayIndex]?.periods[i] || ''} onChange={(e) => updateTempClass(editingDayIndex, i, e.target.value)} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="pt-4 mt-4 border-t border-white/10 shrink-0">
                        <button onClick={handleSaveScheduleSettings} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-sm shadow-lg shadow-indigo-500/30 active:scale-95 transition-all">حفظ الإعدادات</button>
                    </div>
                </div>
            </Modal>

        </div>
    );
};

export default Dashboard;
