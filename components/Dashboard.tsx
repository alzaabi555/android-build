
import React from 'react';
import { Student } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { FileText, Users, Award, AlertCircle, Sun, Moon, Coffee, Sparkles, School } from 'lucide-react';

interface DashboardProps {
  students: Student[];
  teacherInfo: { name: string; school: string };
  onSelectStudent: (s: Student) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ students, teacherInfo, onSelectStudent }) => {
  const totalStudents = students.length;
  const hour = new Date().getHours();
  
  const getGreeting = () => {
    if (hour < 12) return { text: "صباح الخير", icon: <Sun className="text-amber-400 w-5 h-5" /> };
    if (hour < 17) return { text: "طاب يومك", icon: <Coffee className="text-orange-400 w-5 h-5" /> };
    return { text: "مساء الخير", icon: <Moon className="text-indigo-400 w-5 h-5" /> };
  };

  const greeting = getGreeting();
  const today = new Date().toISOString().split('T')[0];
  
  const attendanceToday = students.reduce((acc, s) => {
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
  const pieData = [
    { name: 'حاضر', value: attendanceToday.present || 0 },
    { name: 'غائب', value: attendanceToday.absent || 0 },
  ];

  return (
    <div className="space-y-5 animate-in fade-in duration-500">
      {/* Welcome Header */}
      <div className="bg-gradient-to-l from-blue-600 to-indigo-600 rounded-[1.75rem] p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2 opacity-90">
            {greeting.icon}
            <span className="text-xs font-black">{greeting.text}</span>
          </div>
          <h2 className="text-xl font-black">أهلاً بك، أ. {teacherInfo.name || 'محمد'}</h2>
          <div className="flex items-center gap-1.5 mt-2 opacity-80">
            <School className="w-3.5 h-3.5" />
            <p className="text-[10px] font-black">{teacherInfo.school || 'اسم المدرسة'}</p>
          </div>
          <p className="text-blue-100 text-[9px] mt-4 font-bold bg-white/10 w-fit px-3 py-1 rounded-full">{totalStudents} طالب مسجل حالياً</p>
        </div>
        <Sparkles className="absolute -left-2 -bottom-2 w-20 h-20 opacity-10 rotate-12" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0"><Award className="text-emerald-500 w-5 h-5" /></div>
          <div><p className="text-gray-400 text-[9px] font-black">إيجابي</p><p className="text-base font-black text-gray-900">{behaviorStats.positive}</p></div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center shrink-0"><AlertCircle className="text-rose-500 w-5 h-5" /></div>
          <div><p className="text-gray-400 text-[9px] font-black">تنبيهات</p><p className="text-base font-black text-gray-900">{behaviorStats.negative}</p></div>
        </div>
      </div>

      <div className="bg-white p-5 rounded-[1.75rem] border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-black text-gray-800 flex items-center gap-1.5 text-xs"><Users className="w-4 h-4 text-blue-500" /> حضور اليوم</h3>
          <span className="text-[9px] bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-black">{new Date().toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-32 w-32 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={attendanceToday.present + attendanceToday.absent > 0 ? pieData : [{value: 1}]} cx="50%" cy="50%" innerRadius={35} outerRadius={50} paddingAngle={5} dataKey="value" stroke="none">
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={attendanceToday.present + attendanceToday.absent > 0 ? COLORS[index % COLORS.length] : '#f1f5f9'} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-2">
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-50"><p className="text-[9px] text-emerald-600 font-black mb-0.5">حاضر</p><p className="text-lg font-black text-emerald-700">{attendanceToday.present}</p></div>
            <div className="p-3 bg-rose-50 rounded-xl border border-rose-50"><p className="text-[9px] text-rose-600 font-black mb-0.5">غائب</p><p className="text-lg font-black text-rose-700">{attendanceToday.absent}</p></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
