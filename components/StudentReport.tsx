
import React from 'react';
import { Student } from '../types';
import { Printer, Download, Award, AlertCircle, FileText, ChevronRight } from 'lucide-react';

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
    // نفتح نافذة الطباعة الخاصة بالمتصفح
    window.print();
  };

  const handleExportCSV = () => {
    try {
      const BOM = "\uFEFF"; // لضمان ظهور اللغة العربية بشكل صحيح في Excel
      let csv = BOM + "اسم الطالب,الفصل,المادة,الفئة,الدرجة,من,التاريخ\n";
      
      const studentClass = student.classes?.join('-') || 'غير محدد';
      
      if (grades.length > 0) {
        grades.forEach(g => {
          csv += `"${student.name}","${studentClass}","${g.subject}","${g.category}",${g.score},${g.maxScore},"${new Date(g.date).toLocaleDateString('ar-EG')}"\n`;
        });
      } else {
        csv += `"${student.name}","${studentClass}",-,-,-,-,"${new Date().toLocaleDateString('ar-EG')}"\n`;
      }

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `تقرير_${student.name}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      alert('حدث خطأ أثناء تصدير الملف');
    }
  };

  return (
    <div className="space-y-6 pb-20 print:p-8 print:bg-white print:space-y-8">
      {/* Report Header for Print */}
      <div className="hidden print:flex justify-between items-center border-b-2 border-gray-100 pb-6 mb-8">
        <div className="text-right">
          <h1 className="text-2xl font-black text-blue-600 mb-1">تقرير أداء طالب</h1>
          <p className="text-sm font-bold text-gray-500">نظام مدرستي الذكي</p>
        </div>
        <div className="bg-blue-600 text-white p-3 rounded-2xl font-black text-xl">م</div>
      </div>

      {/* Profile Card */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-[1.5rem] bg-blue-600 flex items-center justify-center text-white font-black text-2xl shadow-lg">
                {student.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-sm font-black text-gray-900 mb-1">{student.name}</h1>
              <div className="flex gap-2">
                <span className="text-[9px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-black">الفصل: {student.classes?.join(' - ') || 'غير محدد'}</span>
                <span className="text-[9px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-black">{percentage}%</span>
              </div>
            </div>
        </div>
      </div>

      {/* Actions (Hidden on Print) */}
      <div className="grid grid-cols-2 gap-3 no-print">
          <button onClick={handleExportCSV} className="p-4 bg-white rounded-2xl border-2 border-gray-50 font-black text-[11px] text-gray-700 flex items-center justify-center gap-2 active-scale">
            <Download className="w-4 h-4 text-blue-500" /> تصدير ملف Excel
          </button>
          <button onClick={handlePrint} className="p-4 bg-blue-600 rounded-2xl font-black text-[11px] text-white shadow-xl shadow-blue-100 flex items-center justify-center gap-2 active-scale">
            <Printer className="w-4 h-4" /> طباعة تقرير PDF
          </button>
      </div>

      {/* Behavior Stats (Print-friendly) */}
      <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm">
        <div className="bg-gray-50/50 p-4 border-b border-gray-100 flex items-center gap-2">
           <Award className="w-4 h-4 text-blue-600" />
           <h3 className="font-black text-gray-800 text-[11px]">سجل السلوكيات</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {behaviors.length > 0 ? behaviors.map(b => (
            <div key={b.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-lg ${b.type === 'positive' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                  {b.type === 'positive' ? <Award className="w-3.5 h-3.5"/> : <AlertCircle className="w-3.5 h-3.5"/>}
                </div>
                <span className="text-[10px] font-black text-gray-800">{b.description}</span>
              </div>
              <span className="text-[9px] text-gray-400 font-bold">{new Date(b.date).toLocaleDateString('ar-EG')}</span>
            </div>
          )) : <p className="p-8 text-center text-[10px] text-gray-400 font-bold">لا توجد ملاحظات سلوكية مسجلة</p>}
        </div>
      </div>

      {/* Academic Stats (Print-friendly) */}
      <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm">
        <div className="bg-gray-50/50 p-4 border-b border-gray-100 flex items-center gap-2">
           <FileText className="w-4 h-4 text-blue-600" />
           <h3 className="font-black text-gray-800 text-[11px]">نتائج التقييمات والدرجات</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {grades.length > 0 ? grades.map(g => (
            <div key={g.id} className="p-4 flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-black text-gray-800">{g.category}</span>
                <span className="text-[8px] text-gray-400 font-bold">{new Date(g.date).toLocaleDateString('ar-EG')}</span>
              </div>
              <div className="bg-blue-50 px-4 py-1.5 rounded-xl text-[11px] font-black border border-blue-100">
                <span className="text-blue-600">{g.score}</span> / {g.maxScore}
              </div>
            </div>
          )) : <p className="p-8 text-center text-[10px] text-gray-400 font-bold">لم يتم رصد درجات لهذا الطالب بعد</p>}
        </div>
      </div>

      {/* Footer for Print Only */}
      <div className="hidden print:block text-center pt-12 text-gray-400">
        <p className="text-[10px] font-bold">هذا التقرير تم إنشاؤه آلياً بواسطة نظام مدرستي</p>
      </div>
    </div>
  );
};

export default StudentReport;
