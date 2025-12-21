import React from 'react';
import { Student } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { FileText, Users, Award, AlertCircle, Sun, Moon, Coffee, Sparkles } from 'lucide-react';

interface DashboardProps {
  students: Student[];
  onSelectStudent: (s: Student) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ students, onSelectStudent }) => {
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
    s.behaviors.forEach(b => {
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

  const hasData = (attendanceToday.present + attendanceToday.absent) > 0;
  const displayPieData = hasData ? pieData : [{ name: 'لا بيانات', value: 1 }];
  const displayColors = hasData ? COLORS : ['#f1f5f9'];

  return (
    <div className="space-y-5">
      {/* Welcome Header */}
      <div className="bg-gradient-to-l from-blue-600 to-indigo-600 rounded-[1.75rem] p-5 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1 opacity-90">
            {greeting.icon}
            <span className="text-xs font-medium">{greeting.text}</span>
          </div>
          <h2 className="text-xl font-bold">أهلاً بك، أ. محمد</h2>
          <p className="text-blue-100 text-[10px] mt-0.5">لديك {totalStudents} طالب مسجل في النظام</p>
        </div>
        <Sparkles className="absolute -left-2 -bottom-2 w-20 h-20 opacity-10 rotate-12" />
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
             <Award className="text-emerald-500 w-5 h-5" />
          </div>
          <div>
            <p className="text-gray-400 text-[9px] font-bold">إيجابي</p>
            <p className="text-base font-bold text-gray-900">{behaviorStats.positive}</p>
          </div>
        </div>
        <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
             <AlertCircle className="text-rose-500 w-5 h-5" />
          </div>
          <div>
            <p className="text-gray-400 text-[9px] font-bold">تنبيهات</p>
            <p className="text-base font-bold text-gray-900">{behaviorStats.negative}</p>
          </div>
        </div>
      </div>

      {/* Attendance Chart Card */}
      <div className="bg-white p-5 rounded-[1.75rem] shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-800 flex items-center gap-1.5 text-xs">
             <Users className="w-4 h-4 text-blue-500" />
             حضور اليوم
          </h3>
          <span className="text-[9px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold">
            {new Date().toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-32 w-32 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={displayPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={50}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {displayPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={displayColors[index % displayColors.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="flex-1 space-y-2">
            <div className="p-2.5 bg-emerald-50/50 rounded-xl border border-emerald-50">
                <p className="text-[9px] text-emerald-600 font-bold uppercase mb-0.5">حاضر</p>
                <p className="text-lg font-black text-emerald-700">{attendanceToday.present}</p>
            </div>
            <div className="p-2.5 bg-rose-50/50 rounded-xl border border-rose-50">
                <p className="text-[9px] text-rose-600 font-bold uppercase mb-0.5">غائب</p>
                <p className="text-lg font-black text-rose-700">{attendanceToday.absent}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="space-y-3 pb-2">
        <div className="flex justify-between items-center px-1">
          <h3 className="font-bold text-gray-800 text-xs">نشاط الطلاب</h3>
        </div>
        
        {students.length === 0 ? (
            <div className="bg-white p-8 rounded-[1.75rem] border-2 border-dashed border-gray-100 flex flex-col items-center">
                <p className="text-gray-400 text-[10px] font-medium">ابدأ بإضافة الطلاب لرؤية النشاط</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 gap-2.5">
              {students.slice(0, 3).map((s, idx) => (
                  <div 
                    key={s.id} 
                    onClick={() => onSelectStudent(s)} 
                    className="bg-white p-3 rounded-2xl shadow-sm border border-gray-50 flex items-center justify-between cursor-pointer active:scale-95 transition-all"
                  >
                      <div className="flex items-center gap-3 min-w-0">
                          {s.avatar ? (
                            <img src={s.avatar} className="w-10 h-10 rounded-xl object-cover" />
                          ) : (
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm ${
                              idx % 2 === 0 ? 'bg-blue-500' : 'bg-indigo-500'
                            }`}>
                                {s.name.charAt(0)}
                            </div>
                          )}
                          <div className="min-w-0">
                              <p className="font-bold text-gray-900 text-xs truncate">{s.name}</p>
                              <p className="text-[9px] text-gray-400 font-medium truncate">
                                {s.classes && s.classes.length > 0 ? s.classes[0] : 'غير مصنف'}
                              </p>
                          </div>
                      </div>
                      <FileText className="w-4 h-4 text-gray-300" />
                  </div>
              ))}
            </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;