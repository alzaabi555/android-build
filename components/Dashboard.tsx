import React, { useState } from 'react';
import { Student, ScheduleDay } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Users, Award, AlertCircle, Sun, Moon, Coffee, Sparkles, School, Calendar, Edit2, X, Check, CalendarCheck, ChevronLeft } from 'lucide-react';

interface DashboardProps {
  students: Student[];
  teacherInfo: { name: string; school: string };
  schedule: ScheduleDay[];
  onUpdateSchedule: (newSchedule: ScheduleDay[]) => void;
  onSelectStudent: (s: Student) => void;
  onNavigate: (tab: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ students = [], teacherInfo, schedule, onUpdateSchedule, onSelectStudent, onNavigate }) => {
  const [isEditingSchedule, setIsEditingSchedule] = useState(false);
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  
  const totalStudents = students?.length || 0;
  const hour = new Date().getHours();
  
  const getGreetingData = () => {
    if (hour < 12) return { text: "صباح الخير", icon: Sun, color: "text-amber-400" };
    if (hour < 17) return { text: "طاب يومك", icon: Coffee, color: "text-orange-400" };
    return { text: "مساء الخير", icon: Moon, color: "text-indigo-400" };
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

  return (
    <div className="space-y-4 animate-in fade-in duration-500 pb-24">
      {/* Welcome Header */}
      <div className="bg-gradient-to-l from-blue-600 to-indigo-600 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1 opacity-90">
            <GreetingIcon className={`${greeting.color} w-4 h-4`} />
            <span className="text-[10px] font-black">{greeting.text}</span>
          </div>
          <h2 className="text-lg font-black">أهلاً بك، أ. {teacherInfo?.name || 'المعلم'}</h2>
          <div className="flex items-center gap-1.5 mt-1 opacity-80">
            <School className="w-3 h-3" />
            <p className="text-[10px] font-black">{teacherInfo?.school || 'اسم المدرسة'}</p>
          </div>
        </div>
        <Sparkles className="absolute -left-2 -bottom-2 w-16 h-16 opacity-10 rotate-12" />
      </div>

      {/* Quick Actions */}
      <button onClick={() => onNavigate('attendance')} className="w-full bg-white text-blue-900 p-4 rounded-2xl shadow-sm border border-blue-50 flex items-center justify-between group active:scale-95 transition-all">
            <div className="flex items-center gap-3">
                <div className="bg-blue-50 p-2.5 rounded-xl">
                    <CalendarCheck className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-right">
                    <h3 className="font-black text-base text-gray-900">تسجيل الحضور</h3>
                    <p className="text-gray-400 text-[10px] font-bold">اضغط هنا لبدء رصد الغياب لهذا اليوم</p>
                </div>
            </div>
            <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-black group-hover:scale-110 transition-transform">
                <ChevronLeft className="w-5 h-5" />
            </div>
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Schedule Section */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm relative lg:col-span-2">
            <div className="flex justify-between items-center mb-3">
               <h3 className="font-black text-gray-800 flex items-center gap-1.5 text-xs">
                 <Calendar className="w-4 h-4 text-blue-500" /> الجدول المدرسي
               </h3>
               <button onClick={() => setIsEditingSchedule(true)} className="text-[9px] bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-black flex items-center gap-1 active:scale-95 transition-transform">
                 <Edit2 className="w-3 h-3" /> تعديل
               </button>
            </div>

            {todaySchedule ? (
               <div className="space-y-2">
                 <p className="text-[9px] font-bold text-gray-400 mb-1">جدول اليوم: {todayName}</p>
                 <div className="grid grid-cols-4 md:grid-cols-8 gap-1.5">
                    {todaySchedule.periods.slice(0, 8).map((p, idx) => (
                       <div key={idx} className={`p-1.5 rounded-lg text-center border ${p ? 'bg-blue-50 border-blue-100 text-blue-700' : 'bg-gray-50 border-transparent text-gray-300'}`}>
                          <span className="block text-[7px] font-black opacity-50 mb-0.5">حـ{idx + 1}</span>
                          <span className="block text-[10px] font-black truncate leading-tight">{p || '-'}</span>
                       </div>
                    ))}
                 </div>
               </div>
            ) : (
              <div className="p-3 bg-gray-50 rounded-xl text-center">
                <p className="text-[10px] font-bold text-gray-400">اليوم عطلة أو خارج أيام الجدول</p>
              </div>
            )}
          </div>

          {/* Attendance Chart */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-black text-gray-800 flex items-center gap-1.5 text-xs"><Users className="w-4 h-4 text-blue-500" /> حضور اليوم</h3>
              <span className="text-[9px] bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-black">{new Date().toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-24 w-24 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={pieData} 
                      cx="50%" 
                      cy="50%" 
                      innerRadius={25} 
                      outerRadius={40} 
                      paddingAngle={5} 
                      dataKey="value" 
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={hasAttendanceData ? COLORS[index % COLORS.length] : '#f1f5f9'} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-1.5">
                <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-50"><p className="text-[8px] text-emerald-600 font-black mb-0.5">حاضر</p><p className="text-sm font-black text-emerald-700">{attendanceToday.present}</p></div>
                <div className="p-2 bg-rose-50 rounded-lg border border-rose-50"><p className="text-[8px] text-rose-600 font-black mb-0.5">غائب</p><p className="text-sm font-black text-rose-700">{attendanceToday.absent}</p></div>
              </div>
            </div>
          </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div className="bg-white p-3 rounded-2xl border border-gray-100 flex items-center gap-2.5 shadow-sm">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0"><Award className="text-emerald-500 w-4 h-4" /></div>
          <div><p className="text-gray-400 text-[8px] font-black">سلوك إيجابي</p><p className="text-sm font-black text-gray-900">{behaviorStats.positive}</p></div>
        </div>
        <div className="bg-white p-3 rounded-2xl border border-gray-100 flex items-center gap-2.5 shadow-sm">
          <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center shrink-0"><AlertCircle className="text-rose-500 w-4 h-4" /></div>
          <div><p className="text-gray-400 text-[8px] font-black">تنبيهات سلوكية</p><p className="text-sm font-black text-gray-900">{behaviorStats.negative}</p></div>
        </div>
      </div>

      {/* Edit Schedule Modal */}
      {isEditingSchedule && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center" onClick={() => setIsEditingSchedule(false)}>
           <div className="bg-white w-full max-w-md h-[90vh] sm:h-auto rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-5">
                 <h3 className="font-black text-sm text-gray-900">تعديل الجدول المدرسي</h3>
                 <button onClick={() => setIsEditingSchedule(false)} className="p-2 bg-gray-100 rounded-full"><X className="w-4 h-4" /></button>
              </div>

              {/* Day Tabs */}
              <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
                {schedule.map((day, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setActiveDayIndex(idx)}
                    className={`px-3 py-2 rounded-xl text-[10px] font-black whitespace-nowrap transition-all border ${activeDayIndex === idx ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-500 border-transparent'}`}
                  >
                    {day.dayName}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pb-6">
                 <p className="text-[10px] font-bold text-gray-500">حصص يوم: <span className="text-blue-600">{schedule[activeDayIndex].dayName}</span></p>
                 {schedule[activeDayIndex].periods.map((period, pIdx) => (
                    <div key={pIdx} className="flex items-center gap-2 bg-gray-50 p-2.5 rounded-2xl border border-gray-100">
                       <span className="w-7 h-7 rounded-lg bg-white flex items-center justify-center font-black text-[9px] text-gray-400 border border-gray-100">{pIdx + 1}</span>
                       <input 
                         type="text" 
                         value={period} 
                         onChange={(e) => handlePeriodChange(activeDayIndex, pIdx, e.target.value)}
                         placeholder={`المادة / الفصل للحصة ${pIdx + 1}`}
                         className="flex-1 bg-transparent text-xs font-bold outline-none text-gray-800 placeholder:text-gray-300"
                       />
                    </div>
                 ))}
              </div>

              <button onClick={() => setIsEditingSchedule(false)} className="w-full py-3.5 bg-blue-600 text-white rounded-2xl font-black text-xs shadow-lg shadow-blue-200 mt-2">حفظ الجدول</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;