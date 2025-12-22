import React from 'react';
import { Student } from '../types';
import { Printer, Award, AlertCircle, MessageCircle, PhoneCall, GraduationCap } from 'lucide-react';

interface StudentReportProps {
  student: Student;
}

const StudentReport: React.FC<StudentReportProps> = ({ student }) => {
  const behaviors = student.behaviors || [];
  const grades = student.grades || [];
  
  const totalScore = grades.reduce((acc, g) => acc + g.score, 0);
  const totalMax = grades.reduce((acc, g) => acc + g.maxScore, 0);
  const percentage = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-20 print:p-0 print:pb-0">
      <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col gap-6 print:shadow-none print:border-none">
        <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-[1.5rem] bg-blue-600 flex items-center justify-center text-white font-black text-2xl print:text-black print:bg-gray-100">{student.name.charAt(0)}</div>
            <div>
              <h1 className="text-sm font-black text-gray-900 mb-1">{student.name}</h1>
              <span className="text-[9px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-black print:text-black print:bg-transparent">الفصل: {student.classes?.join(' - ') || 'غير محدد'}</span>
            </div>
        </div>

        {/* إحصائيات الدرجات */}
        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-2xl print:bg-transparent print:border print:border-gray-200">
           <div>
              <span className="text-[9px] font-bold text-gray-400 block mb-1">المعدل العام</span>
              <span className="text-xl font-black text-gray-900">{percentage}%</span>
           </div>
           <div>
              <span className="text-[9px] font-bold text-gray-400 block mb-1">مجموع الدرجات</span>
              <span className="text-xl font-black text-gray-900">{totalScore} <span className="text-gray-400 text-xs">/ {totalMax}</span></span>
           </div>
        </div>

        {student.parentPhone && (
          <div className="flex gap-2 no-print border-t border-gray-50 pt-4 print:hidden">
             <a href={`https://wa.me/${student.parentPhone}`} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-50 text-emerald-700 rounded-2xl text-[10px] font-black active:scale-95"><MessageCircle className="w-4 h-4"/> واتساب ولي الأمر</a>
             <a href={`tel:${student.parentPhone}`} className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-50 text-blue-700 rounded-2xl text-[10px] font-black active:scale-95"><PhoneCall className="w-4 h-4"/> اتصال هاتف</a>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 no-print print:hidden">
          <button onClick={handlePrint} className="col-span-2 p-4 bg-blue-600 rounded-2xl font-black text-[11px] text-white shadow-xl shadow-blue-100 flex items-center justify-center gap-2 active:scale-95"><Printer className="w-4 h-4" /> طباعة تقرير PDF</button>
      </div>

      {/* Grade Details Table */}
      {grades.length > 0 && (
         <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm print:shadow-none">
            <div className="bg-gray-50/50 p-4 border-b border-gray-100 flex items-center gap-2"><GraduationCap className="w-4 h-4 text-blue-600" /><h3 className="font-black text-gray-800 text-[11px]">تفاصيل الدرجات</h3></div>
            <div className="p-4 space-y-2">
               {grades.map(grade => (
                  <div key={grade.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                     <span className="text-[10px] font-bold text-gray-700">{grade.category}</span>
                     <span className="text-[10px] font-black text-blue-600">{grade.score} / {grade.maxScore}</span>
                  </div>
               ))}
            </div>
         </div>
      )}

      {/* Behavior Log */}
      <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm print:shadow-none">
        <div className="bg-gray-50/50 p-4 border-b border-gray-100 flex items-center gap-2"><Award className="w-4 h-4 text-blue-600" /><h3 className="font-black text-gray-800 text-[11px]">سجل السلوكيات</h3></div>
        <div className="divide-y divide-gray-50">
          {behaviors.length > 0 ? behaviors.map(b => (
            <div key={b.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-lg ${b.type === 'positive' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{b.type === 'positive' ? <Award className="w-3.5 h-3.5"/> : <AlertCircle className="w-3.5 h-3.5"/>}</div>
                <span className="text-[10px] font-black text-gray-800">{b.description}</span>
              </div>
              <span className="text-[9px] text-gray-400 font-bold">{new Date(b.date).toLocaleDateString('ar-EG')}</span>
            </div>
          )) : <p className="p-8 text-center text-[10px] text-gray-400 font-bold">لا توجد ملاحظات سلوكية مسجلة</p>}
        </div>
      </div>
    </div>
  );
};

export default StudentReport;