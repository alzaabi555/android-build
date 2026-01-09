
import React, { useState, useEffect, useRef } from 'react';
import { ScheduleDay, PeriodTime } from '../types';
import { 
  Bell, Clock, Edit3, Settings, 
  MapPin, School, BookOpen, Camera, Upload, FileSpreadsheet, Loader2, 
  PlayCircle
} from 'lucide-react';
import Modal from './Modal';
import { useApp } from '../context/AppContext';
import * as XLSX from 'xlsx';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import BrandLogo from './BrandLogo';

interface DashboardProps {
    students: any[];
    teacherInfo: { name: string; school: string; subject: string; governorate: string; avatar?: string; stamp?: string; ministryLogo?: string; academicYear?: string };
    onUpdateTeacherInfo: (info: any) => void;
    schedule: ScheduleDay[];
    onUpdateSchedule: (schedule: ScheduleDay[]) => void;
    onSelectStudent: (student: any) => void;
    onNavigate: (tab: string) => void;
    onOpenSettings: () => void;
    periodTimes: PeriodTime[];
    setPeriodTimes: React.Dispatch<React.SetStateAction<PeriodTime[]>>;
    notificationsEnabled: boolean;
    onToggleNotifications: () => void;
    currentSemester: '1' | '2';
    onSemesterChange: (sem: '1' | '2') => void;
}

const BELL_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

const Dashboard: React.FC<DashboardProps> = ({
    teacherInfo,
    onUpdateTeacherInfo,
    schedule,
    onUpdateSchedule,
    periodTimes,
    setPeriodTimes,
    notificationsEnabled,
    onToggleNotifications,
    currentSemester,
    onSemesterChange
}) => {
    const { classes } = useApp();
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
    const [editSemester, setEditSemester] = useState<'1' | '2'>(currentSemester);

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
        setEditSemester(currentSemester);
    }, [teacherInfo, currentSemester]);

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
        onSemesterChange(editSemester);
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

    const handleTestNotification = async () => {
        try {
            const audio = new Audio(BELL_SOUND_URL);
            audio.volume = 1.0;
            await audio.play().catch(e => console.warn('Audio blocked', e));

            if (Capacitor.isNativePlatform()) {
                await LocalNotifications.schedule({
                    notifications: [{
                        id: 99999,
                        title: '🔔 تجربة الجرس',
                        body: 'هذا مثال على صوت جرس الحصة',
                        schedule: { at: new Date(Date.now() + 1000) },
                        sound: 'beep.wav'
                    }]
                });
            }
        } catch (e) {
            console.error('Test notification failed', e);
        }
    };

    const today = new Date();
    const dayIndex = today.getDay();
    const todaySchedule = schedule[dayIndex] || { dayName: 'اليوم', periods: [] };
    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];

    return (
        <div className="space-y-4 pb-20 text-gray-100 animate-in fade-in duration-500">
            
            {/* 1. Top Section: Teacher Profile Card (Sticky Header) */}
            {/* Removed negative margins to prevent overlap with status bar */}
            <div className="sticky top-0 z-40 bg-[#111827] -mx-4 -mt-4">
                <div className="glass-heavy bg-[#1f2937] p-4 md:p-6 pt-safe relative overflow-hidden rounded-b-[2rem] border-b border-gray-700 group">
                    <div className="relative z-10 flex items-center justify-between mt-4">
                        <button 
                            onClick={() => setShowEditModal(true)}
                            className="glass-icon p-3 rounded-2xl text-gray-300 hover:bg-gray-700 transition-all absolute left-0 top-0 border border-gray-600"
                        >
                            <Edit3 className="w-5 h-5 text-indigo-400" />
                        </button>

                        <div className="absolute right-3 top-3 flex flex-col items-center gap-1">
                            <BrandLogo className="w-10 h-10" showText={false} />
                            <span className="text-[10px] font-black text-indigo-300 tracking-wider">راصد</span>
                        </div>

                        <div className="flex flex-col items-center w-full">
                            <div className="mt-2"></div>
                            <div className="w-20 h-20 md:w-24 md:h-24 rounded-[2rem] bg-[#374151] p-1 shadow-lg mb-3 relative group-hover:scale-105 transition-transform border border-gray-600">
                                {teacherInfo.avatar ? (
                                    <img src={teacherInfo.avatar} className="w-full h-full object-cover rounded-[1.8rem]" alt="Profile" />
                                ) : (
                                    <div className="w-full h-full bg-indigo-900 rounded-[1.8rem] flex items-center justify-center text-3xl font-black text-white">
                                        {teacherInfo.name ? teacherInfo.name.charAt(0) : 'T'}
                                    </div>
                                )}
                            </div>
                            <h1 className="text-xl md:text-2xl font-black text-white text-center mb-1">
                                {teacherInfo.name || 'مرحباً بك يا معلم'}
                            </h1>
                            <div className="flex flex-col items-center gap-1 text-[10px] font-bold text-gray-400">
                                {teacherInfo.school && <span className="flex items-center gap-1"><School className="w-3 h-3 text-indigo-400"/> {teacherInfo.school}</span>}
                                <span className="flex items-center gap-2">
                                    <span className="bg-indigo-900/50 text-indigo-200 px-2 py-0.5 rounded-md border border-indigo-500/30">
                                        الفصل الدراسي {currentSemester === '1' ? 'الأول' : 'الثاني'}
                                    </span>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Schedule Card (Dark Gray) */}
            <div className="glass-card bg-[#1f2937] rounded-[2.5rem] p-4 border border-gray-700 shadow-xl relative mt-4 mx-1">
                <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                        <button onClick={() => setShowScheduleModal(true)} className="w-8 h-8 glass-icon rounded-full text-gray-300 hover:bg-gray-700 transition-colors border border-gray-600 shadow-sm shimmer-hover">
                            <Settings className="w-4 h-4 text-indigo-400" />
                        </button>
                        <button onClick={onToggleNotifications} className={`w-8 h-8 glass-icon rounded-full transition-colors border border-gray-600 shadow-sm shimmer-hover ${notificationsEnabled ? 'text-amber-500 bg-amber-900/30' : 'text-gray-500'}`}>
                            <Bell className={`w-4 h-4 ${notificationsEnabled ? 'fill-amber-500' : ''}`} />
                        </button>
                        <button onClick={handleTestNotification} className="w-8 h-8 glass-icon rounded-full text-gray-300 hover:bg-gray-700 transition-colors border border-gray-600 shadow-sm shimmer-hover" title="تجربة صوت الجرس">
                            <PlayCircle className="w-4 h-4 text-indigo-400" />
                        </button>
                        <button onClick={() => scheduleFileInputRef.current?.click()} className="w-8 h-8 glass-icon rounded-full text-gray-300 hover:bg-gray-700 transition-colors border border-gray-600 shadow-sm relative shimmer-hover">
                            {isImportingSchedule ? <Loader2 className="w-4 h-4 animate-spin"/> : <FileSpreadsheet className="w-4 h-4 text-emerald-500" />}
                        </button>
                        <input type="file" ref={scheduleFileInputRef} onChange={handleImportSchedule} accept=".xlsx, .xls" className="hidden" />
                    </div>
                    <h2 className="text-base font-black text-white flex items-center gap-2">
                        جدول {todaySchedule.dayName}
                        <Clock className="w-4 h-4 text-amber-500" />
                    </h2>
                </div>
                
                {/* Clear & Visible Schedule Grid (COMPACT) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {todaySchedule.periods.map((cls, idx) => {
                        const pt = periodTimes[idx] || { startTime: '--:--', endTime: '--:--' };
                        const isActive = checkActivePeriod(pt.startTime, pt.endTime) && todaySchedule.dayName === days[dayIndex];
                        return (
                            <div key={idx} className={`
                                p-1.5 rounded-xl flex flex-col items-center justify-center text-center min-h-[55px] relative transition-all duration-300 shimmer-hover
                                ${isActive 
                                    ? 'bg-indigo-700 text-white border-2 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)] scale-105 z-10' 
                                    : 'glass-card bg-[#374151] border border-gray-600 shadow-sm hover:border-indigo-500/50'
                                }
                            `}>
                                {isActive && <span className="absolute -top-2 bg-amber-500 text-black text-[7px] font-black px-1.5 py-0.5 rounded-full shadow-sm animate-pulse">الآن</span>}
                                <div className={`text-[8px] font-black mb-0.5 ${isActive ? 'text-indigo-200' : 'text-gray-500'}`}>حصة {idx + 1}</div>
                                <h3 className={`text-[10px] font-black truncate w-full px-1 mb-0.5 ${isActive ? 'text-white' : 'text-gray-200'}`}>{cls || '-'}</h3>
                                <span className={`text-[7px] font-bold dir-ltr block ${isActive ? 'text-indigo-200' : 'text-gray-500'}`}>{pt.startTime} - {pt.endTime}</span>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Edit Teacher Info Modal (Dark) */}
            <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)}>
                 <div className="text-center">
                    <h3 className="font-black text-2xl mb-6 text-white">إعدادات الهوية</h3>
                    
                    <div className="flex gap-4 justify-center mb-6 overflow-x-auto pb-2">
                        {/* Avatar Uploader */}
                        <div className="relative w-20 h-20 group cursor-pointer shrink-0" onClick={() => fileInputRef.current?.click()}>
                            <div className="w-full h-full rounded-[1.5rem] overflow-hidden border-4 border-gray-700 shadow-xl glass-card bg-[#374151]">
                                {editAvatar ? (
                                    <img src={editAvatar} className="w-full h-full object-cover" alt="Avatar" />
                                ) : (
                                    <div className="w-full h-full bg-indigo-900 flex items-center justify-center text-3xl font-black text-white">
                                        {editName ? editName.charAt(0) : 'T'}
                                    </div>
                                )}
                            </div>
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-[1.5rem]">
                                <Camera className="w-5 h-5 text-white" />
                            </div>
                            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                            <p className="text-[9px] font-bold text-gray-300 mt-1">الصورة الشخصية</p>
                        </div>

                        {/* Stamp Uploader */}
                        <div className="relative w-20 h-20 group cursor-pointer shrink-0" onClick={() => stampInputRef.current?.click()}>
                            <div className="w-full h-full rounded-[1.5rem] overflow-hidden border-4 border-gray-700 shadow-xl glass-card flex items-center justify-center bg-[#374151]">
                                {editStamp ? (
                                    <img src={editStamp} className="w-full h-full object-contain p-2" alt="Stamp" />
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-gray-300">
                                        <div className="w-6 h-6 mb-1 border-2 border-gray-500 rounded-lg flex items-center justify-center">S</div>
                                    </div>
                                )}
                            </div>
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-[1.5rem]">
                                <Upload className="w-5 h-5 text-white" />
                            </div>
                            <input type="file" ref={stampInputRef} onChange={handleStampUpload} accept="image/*" className="hidden" />
                            <p className="text-[9px] font-bold text-gray-300 mt-1">ختم المدرسة</p>
                        </div>

                        {/* Ministry Logo Uploader */}
                        <div className="relative w-20 h-20 group cursor-pointer shrink-0" onClick={() => ministryLogoInputRef.current?.click()}>
                            <div className="w-full h-full rounded-[1.5rem] overflow-hidden border-4 border-gray-700 shadow-xl glass-card flex items-center justify-center bg-[#374151]">
                                {editMinistryLogo ? (
                                    <img src={editMinistryLogo} className="w-full h-full object-contain p-2" alt="Ministry Logo" />
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-gray-300">
                                        <div className="w-6 h-6 mb-1 border-2 border-gray-500 rounded-full flex items-center justify-center">M</div>
                                    </div>
                                )}
                            </div>
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-[1.5rem]">
                                <Upload className="w-5 h-5 text-white" />
                            </div>
                            <input type="file" ref={ministryLogoInputRef} onChange={handleMinistryLogoUpload} accept="image/*" className="hidden" />
                            <p className="text-[9px] font-bold text-gray-300 mt-1">شعار الوزارة</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <input className="w-full p-2.5 glass-input rounded-xl font-bold text-xs md:text-sm text-white bg-[#374151] border border-gray-600 focus:border-indigo-500 outline-none" placeholder="اسم المعلم" value={editName} onChange={e => setEditName(e.target.value)} />
                        <input className="w-full p-2.5 glass-input rounded-xl font-bold text-xs md:text-sm text-white bg-[#374151] border border-gray-600 focus:border-indigo-500 outline-none" placeholder="اسم المدرسة" value={editSchool} onChange={e => setEditSchool(e.target.value)} />
                        <input className="w-full p-2.5 glass-input rounded-xl font-bold text-xs md:text-sm text-white bg-[#374151] border border-gray-600 focus:border-indigo-500 outline-none" placeholder="المادة (مثال: رياضيات)" value={editSubject} onChange={e => setEditSubject(e.target.value)} />
                        <input className="w-full p-2.5 glass-input rounded-xl font-bold text-xs md:text-sm text-white bg-[#374151] border border-gray-600 focus:border-indigo-500 outline-none" placeholder="المحافظة (للتوجيه)" value={editGovernorate} onChange={e => setEditGovernorate(e.target.value)} />
                        <input className="w-full p-2.5 glass-input rounded-xl font-bold text-xs md:text-sm text-white bg-[#374151] border border-gray-600 focus:border-indigo-500 outline-none" placeholder="العام الدراسي (مثال: 2024 / 2025)" value={editAcademicYear} onChange={e => setEditAcademicYear(e.target.value)} />
                        
                        <div className="bg-[#374151] rounded-xl p-2 flex items-center justify-between border border-gray-600">
                            <span className="text-xs font-bold text-gray-300 pr-2">الفصل الدراسي:</span>
                            <div className="flex gap-1">
                                <button onClick={() => setEditSemester('1')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${editSemester === '1' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}>الأول</button>
                                <button onClick={() => setEditSemester('2')} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${editSemester === '2' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}>الثاني</button>
                            </div>
                        </div>

                        <button onClick={handleSaveInfo} className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-black text-xs md:text-sm shadow-lg hover:bg-indigo-700 transition-all mt-3">حفظ وتطبيق</button>
                    </div>
                 </div>
            </Modal>

            {/* Schedule Settings Modal (Dark) */}
            <Modal isOpen={showScheduleModal} onClose={() => setShowScheduleModal(false)} className="max-w-md rounded-[2rem]">
                <div className="text-center">
                    <h3 className="font-black text-xl mb-4 text-white">إعدادات الجدول</h3>
                    
                    <div className="flex p-1 bg-[#111827] rounded-xl mb-4">
                        <button onClick={() => setScheduleTab('timing')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${scheduleTab === 'timing' ? 'bg-[#374151] shadow text-white' : 'text-gray-500'}`}>التوقيت</button>
                        <button onClick={() => setScheduleTab('classes')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${scheduleTab === 'classes' ? 'bg-[#374151] shadow text-white' : 'text-gray-500'}`}>الحصص</button>
                    </div>

                    {scheduleTab === 'timing' ? (
                        <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar p-1">
                            {tempPeriodTimes.map((pt, idx) => (
                                <div key={idx} className="flex items-center gap-2 mb-2">
                                    <span className="text-xs font-bold w-16 text-gray-300">حصة {pt.periodNumber}</span>
                                    <input type="time" value={pt.startTime} onChange={e => updateTempTime(idx, 'startTime', e.target.value)} className="flex-1 p-2 glass-input rounded-lg text-xs font-bold text-white bg-[#374151] border border-gray-600" />
                                    <span className="text-gray-500">-</span>
                                    <input type="time" value={pt.endTime} onChange={e => updateTempTime(idx, 'endTime', e.target.value)} className="flex-1 p-2 glass-input rounded-lg text-xs font-bold text-white bg-[#374151] border border-gray-600" />
                                </div>
                            ))}
                        </div>
                    ) : (
                         <div className="space-y-4 max-h-60 overflow-y-auto custom-scrollbar p-1">
                             <div className="flex gap-2 overflow-x-auto pb-2">
                                 {tempSchedule.map((day, idx) => (
                                     <button key={idx} onClick={() => setEditingDayIndex(idx)} className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${editingDayIndex === idx ? 'bg-indigo-600 text-white' : 'glass-card bg-[#374151] text-gray-300 border border-gray-600'}`}>
                                         {day.dayName}
                                     </button>
                                 ))}
                             </div>
                             <div className="space-y-2">
                                 {tempSchedule[editingDayIndex]?.periods.map((cls, pIdx) => (
                                     <div key={pIdx} className="flex items-center gap-2">
                                         <span className="text-xs font-bold w-12 text-gray-300">#{pIdx + 1}</span>
                                         <input 
                                             placeholder="اسم الفصل / المادة" 
                                             value={cls} 
                                             onChange={e => updateTempClass(editingDayIndex, pIdx, e.target.value)}
                                             className="flex-1 p-2 glass-input rounded-lg text-xs font-bold text-white bg-[#374151] border border-gray-600 focus:border-indigo-500 outline-none"
                                         />
                                     </div>
                                 ))}
                             </div>
                         </div>
                    )}
                    
                    <div className="flex gap-2 mt-4 pt-4 border-t border-gray-700">
                        <button onClick={() => setShowScheduleModal(false)} className="flex-1 py-3 text-gray-400 font-bold text-xs hover:bg-[#374151] rounded-xl">إلغاء</button>
                        <button onClick={handleSaveScheduleSettings} className="flex-[2] py-3 bg-indigo-600 text-white rounded-xl font-black text-sm shadow-lg hover:bg-indigo-700">حفظ الجدول</button>
                    </div>
                </div>
            </Modal>

        </div>
    );
};

export default Dashboard;
