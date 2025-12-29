
import React, { useState } from 'react';
import { Student, ScheduleDay, PeriodTime } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Users, Award, AlertCircle, Sun, Moon, Coffee, Sparkles, School, Calendar, Edit2, X, Clock, ArrowRight, FileSpreadsheet, Loader2, BookOpen, Settings, ChevronLeft, CalendarCheck, BellRing } from 'lucide-react';
import * as XLSX from 'xlsx';

interface DashboardProps {
  students: Student[];
  teacherInfo: { name: string; school: string; subject: string; governorate: string };
  onUpdateTeacherInfo: (info: { name: string; school: string; subject: string; governorate: string }) => void;
  schedule: ScheduleDay[];
  onUpdateSchedule: (newSchedule: ScheduleDay[]) => void;
  onSelectStudent: (s: Student) => void;
  onNavigate: (tab: string) => void;
  onOpenSettings: () => void;
  periodTimes: PeriodTime[];
  setPeriodTimes: React.Dispatch<React.SetStateAction<PeriodTime[]>>;
}

const OMAN_GOVERNORATES = ["مسقط", "ظفار", "مسندم", "البريمي", "الداخلية", "شمال الباطنة", "جنوب الباطنة", "جنوب الشرقية", "شمال الشرقية", "الظاهرة", "الوسطى"];

const Dashboard: React.FC<DashboardProps> = ({ students = [], teacherInfo, onUpdateTeacherInfo, schedule, onUpdateSchedule, onSelectStudent, onNavigate, onOpenSettings, periodTimes, setPeriodTimes }) => {
  const [isEditingSchedule, setIsEditingSchedule] = useState(false);
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [showTimeSettings, setShowTimeSettings] = useState(false);
  const [isImportingSchedule, setIsImportingSchedule] = useState(false);
  
  const [editName, setEditName] = useState(teacherInfo.name);
  const [editSchool, setEditSchool] = useState(teacherInfo.school);
  const [editSubject, setEditSubject] = useState(teacherInfo.subject);
  const [editGovernorate, setEditGovernorate] = useState(teacherInfo.governorate);

  const hour = new Date().getHours();
  const getGreetingData = () => {
    if (hour < 12) return { text: "صباح الخير", icon: Sun, color: "text-amber-200" };
    if (hour < 17) return { text: "طاب يومك", icon: Coffee, color: "text-orange-200" };
    return { text: "مساء الخير", icon: Moon, color: "text-indigo-200" };
  };

  const greeting = getGreetingData();
  const GreetingIcon = greeting.icon;
  
  const today = new Date().toLocaleDateString('en-CA');
  
  const attendanceToday = students.reduce((acc, s) => {
    if (!s.attendance) return acc;
    const record = s.attendance.find(a => a.date === today);
    if (record?.status === 'present') acc.present++;
    else if (record?.status === 'absent') acc.absent++;
    return acc;
  }, { present: 0, absent: 0 });

  const behaviorStats = students.reduce((acc, s) => {
    (s.behaviors || []).forEach(b => {
      if (b.type === 'positive') acc.positive++;
      else acc.negative++; 
    });
    return acc;
  }, { positive: 0, negative: 0 });

  const COLORS = ['#10b981', '#f43f5e'];
  const hasAttendanceData = attendanceToday.present > 0 || attendanceToday.absent > 0;
  
  const pieData = hasAttendanceData 
    ? [
        { name: 'حاضر', value: attendanceToday.present },
        { name: 'غائب', value: attendanceToday.absent },
      ]
    : [{ name: 'لا توجد بيانات', value: 1 }];

  const daysMap = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const todayIndex = new Date().getDay();
  const todayName = daysMap[todayIndex];
  const todaySchedule = schedule.find(s => s.dayName === todayName);

  const handlePeriodChange = (dayIdx: number, periodIdx: number, val: string) => {
    const updated = [...schedule];
    updated[dayIdx].periods[periodIdx] = val;
    onUpdateSchedule(updated);
  };

  const handleTimeChange = (periodIndex: number, field: 'startTime' | 'endTime', value: string) => {
      const updated = [...periodTimes];
      updated[periodIndex] = { ...updated[periodIndex], [field]: value };
      setPeriodTimes(updated);
  };

  const handleSaveInfo = () => {
      onUpdateTeacherInfo({ name: editName, school: editSchool, subject: editSubject, governorate: editGovernorate });
      setIsEditingInfo(false);
  };

  const openInfoEditor = () => {
      setEditName(teacherInfo.name);
      setEditSchool(teacherInfo.school);
      setEditSubject(teacherInfo.subject);
      setEditGovernorate(teacherInfo.governorate);
      setIsEditingInfo(true);
  };

  const handleImportSchedule = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setIsImportingSchedule(true);
      try {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];
        const targetDays = [ { key: 'أحد', full: 'الأحد' }, { key: 'اثنين', full: 'الاثنين' }, { key: 'ثلاثاء', full: 'الثلاثاء' }, { key: 'أربعاء', full: 'الأربعاء' }, { key: 'خميس', full: 'الخميس' } ];
        const newSchedule = [...schedule];
        let foundData = false;
        jsonData.forEach((row) => {
           const dayIndexInRow = row.findIndex(cell => { if (typeof cell !== 'string') return false; return targetDays.some(d => cell.includes(d.key)); });
           if (dayIndexInRow !== -1) {
               const cellText = String(row[dayIndexInRow]).trim();
               const matchedDayObj = targetDays.find(d => cellText.includes(d.key));
               if (matchedDayObj) {
                   const scheduleDayIndex = newSchedule.findIndex(s => s.dayName === matchedDayObj.full);
                   if (scheduleDayIndex !== -1) {
                       const newPeriods = [];
                       for (let i = 1; i <= 8; i++) { const val = row[dayIndexInRow + i]; newPeriods.push(val ? String(val).trim() : ''); }
                       newSchedule[scheduleDayIndex] = { ...newSchedule[scheduleDayIndex], periods: newPeriods };
                       foundData = true;
                   }
               }
           }
        });
        if (foundData) { onUpdateSchedule(newSchedule); alert('تم استيراد الجدول بنجاح!'); } 
        else { alert('لم يتم العثور على أيام الأسبوع.'); }
      } catch (error) { alert('خطأ في قراءة الملف'); } finally { setIsImportingSchedule(false); if (e.target) e.target.value = ''; }
  };

  return (
    <div className="space-y-2 pb-24 md:pb-8">
      
      {/* 1. Compact Welcome Banner */}
      <div className="relative overflow-hidden rounded-[1.5rem] bg-[#4f46e5] text-white shadow-lg shadow-indigo-500/20">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600 opacity-100"></div>
        {/* Abstract shapes hidden on mobile for cleaner look */}
        <div className="hidden md:block absolute top-[-50%] right-[-20%] w-[500px] h-[500px] bg-white/10 rounded-full blur-[100px]"></div>

        <div className="relative z-10 px-5 py-4 flex flex-row justify-between items-center">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-0.5">
              <GreetingIcon className={`${greeting.color} w-3.5 h-3.5`} strokeWidth={2.5} />
              <span className="text-[9px] font-bold tracking-wider uppercase opacity-80">{greeting.text}</span>
            </div>
            <div className="flex items-center gap-2">
               <h2 className="text-lg font-black tracking-tight">أ. {teacherInfo?.name || 'المعلم'}</h2>
               <button onClick={openInfoEditor} className="w-5 h-5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md flex items-center justify-center border border-white/10">
                   <Edit2 className="w-2.5 h-2.5 text-white" strokeWidth={2.5} />
               </button>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
               <span className="text-[9px] opacity-70 font-bold">{teacherInfo?.school || 'المدرسة'}</span>
               {teacherInfo?.subject && <span className="text-[9px] opacity-60">• {teacherInfo.subject}</span>}
            </div>
          </div>
          
          <button 
              onClick={onOpenSettings} 
              className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center hover:bg-white/20 backdrop-blur-md border border-white/10 active:scale-95"
          >
              <Settings className="w-4.5 h-4.5 text-white" strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* 2. Slim Action Button */}
      <button onClick={() => onNavigate('attendance')} className="w-full bg-white rounded-2xl p-1 shadow-sm border border-indigo-100 active:scale-[0.98] transition-all">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl px-4 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-md shadow-indigo-200">
                        <CalendarCheck className="w-4 h-4" strokeWidth={2.5} />
                    </div>
                    <span className="font-black text-xs text-slate-800">تسجيل الحضور اليومي</span>
                </div>
                <div className="bg-white px-3 py-1 rounded-lg text-[9px] font-black text-indigo-600 shadow-sm">
                    ابدأ الآن <ChevronLeft className="w-2.5 h-2.5 inline" />
                </div>
            </div>
      </button>

      {/* 3. Grid Schedule (2 Rows x 4 Columns) - REDUCED HEIGHT */}
      <div className="bg-white/80 backdrop-blur-xl rounded-[1.5rem] p-3 shadow-sm border border-white/50 relative">
         <div className="flex justify-between items-center mb-2">
           <h3 className="font-black text-slate-800 flex items-center gap-1.5 text-xs">
             <Calendar className="w-3.5 h-3.5 text-indigo-500" strokeWidth={2.5} />
             جدول {todayName}
           </h3>
           <div className="flex gap-1">
               <button onClick={() => setShowTimeSettings(true)} className="p-1.5 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 border border-amber-100">
                   <Clock className="w-3 h-3" strokeWidth={2.5}/>
               </button>
               <button onClick={() => setIsEditingSchedule(true)} className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 border border-indigo-100">
                   <Edit2 className="w-3 h-3" strokeWidth={2.5} />
               </button>
           </div>
         </div>

         {todaySchedule ? (
           <div className="grid grid-cols-4 gap-1.5">
                {todaySchedule.periods.slice(0, 8).map((p, idx) => {
                   const time = periodTimes[idx];
                   const isActive = p && p !== '';
                   return (
                       <div key={idx} className={`flex flex-col items-center justify-between p-1.5 rounded-xl border transition-all h-[75px] ${isActive ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-gray-50 border-gray-100'}`}>
                          <span className="text-[8px] font-black text-slate-300 w-full text-right">#{idx + 1}</span>
                          <span className={`text-[9px] font-black text-center leading-tight line-clamp-2 w-full break-words ${isActive ? 'text-indigo-900' : 'text-slate-300'}`}>
                              {p || '-'}
                          </span>
                          {time && time.startTime ? (
                              <div className="mt-0.5 text-[7px] font-bold text-slate-400 bg-white/60 px-1 py-0.5 rounded-full">
                                  {time.startTime}
                              </div>
                          ) : <div className="h-3"></div>}
                       </div>
                   );
                })}
           </div>
        ) : (
          <div className="text-center py-4 text-xs text-gray-400 font-bold bg-gray-50 rounded-xl border border-dashed border-gray-200">
            لا توجد حصص اليوم
          </div>
        )}
      </div>

      {/* 4. Compact Stats Grid (Side-by-Side) - REDUCED HEIGHT */}
      <div className="grid grid-cols-2 gap-2 pb-16 md:pb-0">
          {/* Attendance (Left) */}
          <div className="bg-white/80 backdrop-blur-xl rounded-[1.5rem] p-2 shadow-sm border border-white/50 flex flex-col justify-center items-center relative overflow-hidden h-[100px]">
              <div className="absolute top-2 right-2 text-[9px] font-black text-slate-400">الحضور</div>
              <div className="h-12 w-12 relative my-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={15} outerRadius={24} paddingAngle={5} dataKey="value" stroke="none">
                      {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={hasAttendanceData ? COLORS[index % COLORS.length] : '#f1f5f9'} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center">
                    <Users className="w-3 h-3 text-slate-300" />
                </div>
              </div>
              <div className="flex gap-2 text-[8px] font-black">
                  <span className="text-emerald-500">{attendanceToday.present} حاضر</span>
                  <span className="text-rose-500">{attendanceToday.absent} غائب</span>
              </div>
          </div>

          {/* Behavior (Right - Stacked) */}
          <div className="flex flex-col gap-1.5 h-[100px]">
              <div className="flex-1 bg-emerald-50 rounded-2xl p-2 px-3 border border-emerald-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-sm text-emerald-500">
                          <Award className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[9px] font-black text-emerald-800">إيجابي</span>
                  </div>
                  <span className="text-lg font-black text-emerald-600">{behaviorStats.positive}</span>
              </div>
              
              <div className="flex-1 bg-rose-50 rounded-2xl p-2 px-3 border border-rose-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-sm text-rose-500">
                          <AlertCircle className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[9px] font-black text-rose-800">سلبي</span>
                  </div>
                  <span className="text-lg font-black text-rose-600">{behaviorStats.negative}</span>
              </div>
          </div>
      </div>

      {/* ... Modals ... */}
      
      {/* Edit Info Modal */}
      {isEditingInfo && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[120] flex items-center justify-center p-6 animate-in fade-in duration-200" onClick={() => setIsEditingInfo(false)}>
              <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 border border-white/50 max-h-[90vh] md:max-h-[600px] overflow-y-auto" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="font-black text-lg text-gray-900">تعديل البيانات</h3>
                      <button onClick={() => setIsEditingInfo(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X className="w-5 h-5 text-gray-500"/></button>
                  </div>
                  <div className="space-y-4">
                      <div className="space-y-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase">اسم المعلم</label>
                          <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all" />
                      </div>
                      <div className="space-y-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase">المادة</label>
                          <input type="text" value={editSubject} onChange={e => setEditSubject(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all" />
                      </div>
                      <div className="space-y-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase">المدرسة</label>
                          <input type="text" value={editSchool} onChange={e => setEditSchool(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-bold outline-none focus:border-indigo-500 focus:bg-white transition-all" />
                      </div>
                      <div className="space-y-1">
                          <label className="text-[10px] font-black text-gray-400 uppercase">المحافظة</label>
                          <select value={editGovernorate} onChange={e => setEditGovernorate(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm font-bold outline-none focus:border-indigo-500 appearance-none">
                                <option value="">اختر المحافظة...</option>
                                {OMAN_GOVERNORATES.map(gov => <option key={gov} value={gov}>{gov}</option>)}
                          </select>
                      </div>
                      <button onClick={handleSaveInfo} className="w-full bg-indigo-600 text-white rounded-2xl py-4 text-sm font-black shadow-lg shadow-indigo-200 mt-2 hover:bg-indigo-700 active:scale-95 transition-all">حفظ التغييرات</button>
                  </div>
              </div>
          </div>
      )}

      {/* Edit Schedule Modal - CENTERED */}
      {isEditingSchedule && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setIsEditingSchedule(false)}>
           <div className="bg-white w-full max-w-md h-[80vh] md:h-auto md:max-h-[600px] rounded-[2.5rem] p-8 shadow-2xl flex flex-col border border-white/50 relative overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                 <h3 className="font-black text-lg text-gray-900">تعديل الجدول</h3>
                 <button onClick={() => setIsEditingSchedule(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X className="w-5 h-5 text-gray-500" /></button>
              </div>

              <div className="mb-6">
                  <label className="flex items-center justify-center gap-3 w-full p-4 bg-emerald-50 text-emerald-700 rounded-[2rem] border border-emerald-100 cursor-pointer active:scale-95 transition-all shadow-sm hover:shadow-md">
                      {isImportingSchedule ? <Loader2 className="w-5 h-5 animate-spin"/> : <FileSpreadsheet className="w-5 h-5"/>}
                      <span className="text-xs font-black">استيراد من Excel</span>
                      <input type="file" accept=".xlsx, .xls, .csv" className="hidden" onChange={handleImportSchedule} disabled={isImportingSchedule} />
                  </label>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-4 custom-scrollbar">
                {schedule.map((day, idx) => (
                  <button key={idx} onClick={() => setActiveDayIndex(idx)} className={`px-5 py-2.5 rounded-2xl text-[11px] font-black whitespace-nowrap transition-all border ${activeDayIndex === idx ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-gray-50 text-gray-500 border-transparent hover:bg-gray-100'}`}>
                    {day.dayName}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pb-6 custom-scrollbar pr-1">
                 {schedule[activeDayIndex].periods.map((period, pIdx) => (
                    <div key={pIdx} className="flex items-center gap-3 bg-gray-50 p-2 rounded-2xl border border-gray-100 focus-within:border-indigo-300 focus-within:bg-white transition-colors">
                       <span className="w-10 h-10 rounded-xl bg-white flex items-center justify-center font-black text-xs text-gray-400 shadow-sm border border-gray-100">{pIdx + 1}</span>
                       <input type="text" value={period} onChange={(e) => handlePeriodChange(activeDayIndex, pIdx, e.target.value)} placeholder={`مادة / فصل`} className="flex-1 bg-transparent text-sm font-bold outline-none text-gray-800 placeholder:text-gray-300 px-2" />
                    </div>
                 ))}
              </div>
              <button onClick={() => setIsEditingSchedule(false)} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-200 mt-2 hover:bg-indigo-700 active:scale-95 transition-all">حفظ الجدول</button>
           </div>
        </div>
      )}

      {/* Edit Time Settings Modal - CENTERED */}
      {showTimeSettings && (
         <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setShowTimeSettings(false)}>
            <div className="bg-white w-full max-w-sm h-[80vh] md:h-auto md:max-h-[600px] rounded-[2.5rem] p-8 shadow-2xl flex flex-col border border-white/50" onClick={e => e.stopPropagation()}>
               <div className="flex justify-between items-center mb-6">
                   <h3 className="font-black text-lg text-gray-900 flex items-center gap-2"><Clock className="w-6 h-6 text-indigo-600"/> التوقيت</h3>
                   <button onClick={() => setShowTimeSettings(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X className="w-5 h-5 text-gray-500" /></button>
               </div>
               <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pb-4">
                   {periodTimes.map((period, index) => (
                       <div key={index} className="flex items-center gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                           <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center font-black text-sm text-gray-500 shadow-sm">{period.periodNumber}</div>
                           <div className="flex items-center gap-2 flex-1">
                               <input type="time" value={period.startTime} onChange={(e) => handleTimeChange(index, 'startTime', e.target.value)} className="flex-1 bg-white rounded-xl border border-gray-200 text-xs font-bold px-1 py-3 text-center outline-none focus:border-indigo-300" />
                               <ArrowRight className="w-4 h-4 text-gray-300"/>
                               <input type="time" value={period.endTime} onChange={(e) => handleTimeChange(index, 'endTime', e.target.value)} className="flex-1 bg-white rounded-xl border border-gray-200 text-xs font-bold px-1 py-3 text-center outline-none focus:border-indigo-300" />
                           </div>
                       </div>
                   ))}
               </div>
               <button onClick={() => setShowTimeSettings(false)} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl mt-2 hover:bg-indigo-700 active:scale-95 transition-all">حفظ التوقيت</button>
            </div>
         </div>
      )}
    </div>
  );
};

export default Dashboard;
