import React from 'react';
import { Student } from '../types';
import { Printer, Award, AlertCircle, MessageCircle, PhoneCall, GraduationCap } from 'lucide-react';

interface StudentReportProps {
  student: Student;
}

const StudentReport: React.FC<StudentReportProps> = ({ student }) => {
  const behaviors = student.behaviors || [];
  const allGrades = student.grades || [];

  // فصل الدرجات حسب الفصل الدراسي
  const sem1Grades = allGrades.filter(g => !g.semester || g.semester === '1');
  const sem2Grades = allGrades.filter(g => g.semester === '2');

  const calcSemStats = (grades: any[]) => {
      const score = grades.reduce((acc, g) => acc + g.score, 0);
      const max = grades.reduce((acc, g) => acc + g.maxScore, 0);
      const percentage = max > 0 ? Math.round((score / max) * 100) : 0;
      return { score, max, percentage };
  };

  const sem1Stats = calcSemStats(sem1Grades);
  const sem2Stats = calcSemStats(sem2Grades);

  // حساب المعدل النهائي
  let finalPercentage = 0;
  if (sem1Stats.max > 0 && sem2Stats.max > 0) {
      finalPercentage = Math.round((sem1Stats.percentage + sem2Stats.percentage) / 2);
  } else if (sem1Stats.max > 0) {
      finalPercentage = sem1Stats.percentage;
  } else if (sem2Stats.max > 0) {
      finalPercentage = sem2Stats.percentage;
  }

  const handlePrint = () => {
    // 1. العثور على محتوى التقرير
    const reportContent = document.getElementById('printable-report-container');
    if (!reportContent) return;

    // 2. إنشاء إطار مخفي (Iframe)
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    // 3. كتابة المحتوى داخل الإطار مع استدعاء المكتبات اللازمة (Tailwind + Fonts)
    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
          <head>
            <title>تقرير الطالب: ${student.name}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;900&display=swap" rel="stylesheet">
            <style>
              body { 
                font-family: 'Tajawal', sans-serif; 
                padding: 20px; 
                background: white;
                -webkit-print-color-adjust: exact; 
                print-color-adjust: exact; 
              }
              .no-print { display: none !important; }
              /* تحسينات للجداول عند الطباعة */
              .grade-table { page-break-inside: avoid; }
            </style>
          </head>
          <body>
            ${reportContent.innerHTML}
            <script>
              // تأخير بسيط لضمان تحميل التنسيقات قبل الطباعة
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                  // بعد الطباعة (أو الإلغاء) لا نقوم بحذف الإطار فوراً لنمنع الأخطاء، لكن يمكن تركه مخفياً
                }, 1000);
              };
            </script>
          </body>
        </html>
      `);
      doc.close();
      
      // تنظيف الإطار بعد فترة طويلة كافية
      setTimeout(() => {
          if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
          }
      }, 60000);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* هذا الحاوي هو الذي سيتم نسخ محتواه للطباعة */}
      <div id="printable-report-container" className="space-y-6">
          <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col gap-6">
            <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-[1.5rem] bg-blue-600 flex items-center justify-center text-white font-black text-2xl print:bg-gray-100 print:text-black">{student.name.charAt(0)}</div>
                <div>
                  <h1 className="text-sm font-black text-gray-900 mb-1">{student.name}</h1>
                  <span className="text-[9px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-black print:bg-transparent print:text-black print:border print:border-gray-300">الفصل: {student.classes?.join(' - ') || 'غير محدد'}</span>
                </div>
            </div>

            {/* إحصائيات نهائية */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-2xl print:border print:border-gray-200 print:bg-transparent">
              <div>
                  <span className="text-[9px] font-bold text-gray-400 block mb-1">النتيجة النهائية</span>
                  <span className="text-xl font-black text-gray-900">{finalPercentage}%</span>
              </div>
              <div>
                  <span className="text-[9px] font-bold text-gray-400 block mb-1">عدد السلوكيات</span>
                  <span className="text-xl font-black text-gray-900">{behaviors.length}</span>
              </div>
            </div>

            {/* أزرار الاتصال - مخفية عند الطباعة بواسطة كلاس no-print */}
            {student.parentPhone && (
              <div className="flex gap-2 border-t border-gray-50 pt-4 no-print">
                <a href={`https://wa.me/${student.parentPhone}`} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-50 text-emerald-700 rounded-2xl text-[10px] font-black active:scale-95"><MessageCircle className="w-4 h-4"/> واتساب ولي الأمر</a>
                <a href={`tel:${student.parentPhone}`} className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-50 text-blue-700 rounded-2xl text-[10px] font-black active:scale-95"><PhoneCall className="w-4 h-4"/> اتصال هاتف</a>
              </div>
            )}
          </div>

          {/* Grade Details Table - Semester 1 */}
          {sem1Grades.length > 0 && (
            <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm grade-table print:border-gray-300 print:shadow-none">
                <div className="bg-gray-50/50 p-4 border-b border-gray-100 flex justify-between items-center print:bg-gray-100">
                    <div className="flex items-center gap-2"><GraduationCap className="w-4 h-4 text-blue-600 print:text-black" /><h3 className="font-black text-gray-800 text-[11px]">الفصل الدراسي الأول</h3></div>
                    <span className="text-[10px] font-black text-blue-600 print:text-black">{sem1Stats.score} / {sem1Stats.max} ({sem1Stats.percentage}%)</span>
                </div>
                <div className="p-4 space-y-2">
                  {sem1Grades.map(grade => (
                      <div key={grade.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0 print:border-gray-200">
                        <span className="text-[10px] font-bold text-gray-700">{grade.category}</span>
                        <span className="text-[10px] font-black text-gray-900">{grade.score} / {grade.maxScore}</span>
                      </div>
                  ))}
                </div>
            </div>
          )}

          {/* Grade Details Table - Semester 2 */}
          {sem2Grades.length > 0 && (
            <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm grade-table print:border-gray-300 print:shadow-none">
                <div className="bg-gray-50/50 p-4 border-b border-gray-100 flex justify-between items-center print:bg-gray-100">
                    <div className="flex items-center gap-2"><GraduationCap className="w-4 h-4 text-indigo-600 print:text-black" /><h3 className="font-black text-gray-800 text-[11px]">الفصل الدراسي الثاني</h3></div>
                    <span className="text-[10px] font-black text-indigo-600 print:text-black">{sem2Stats.score} / {sem2Stats.max} ({sem2Stats.percentage}%)</span>
                </div>
                <div className="p-4 space-y-2">
                  {sem2Grades.map(grade => (
                      <div key={grade.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0 print:border-gray-200">
                        <span className="text-[10px] font-bold text-gray-700">{grade.category}</span>
                        <span className="text-[10px] font-black text-gray-900">{grade.score} / {grade.maxScore}</span>
                      </div>
                  ))}
                </div>
            </div>
          )}

          {/* Behavior Log */}
          <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm grade-table print:border-gray-300 print:shadow-none">
            <div className="bg-gray-50/50 p-4 border-b border-gray-100 flex items-center gap-2 print:bg-gray-100"><Award className="w-4 h-4 text-blue-600 print:text-black" /><h3 className="font-black text-gray-800 text-[11px]">سجل السلوكيات</h3></div>
            <div className="divide-y divide-gray-50 print:divide-gray-200">
              {behaviors.length > 0 ? behaviors.map(b => (
                <div key={b.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg ${b.type === 'positive' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'} print:bg-transparent print:text-black print:border print:border-gray-300`}>
                        {b.type === 'positive' ? <Award className="w-3.5 h-3.5"/> : <AlertCircle className="w-3.5 h-3.5"/>}
                    </div>
                    <span className="text-[10px] font-black text-gray-800">{b.description}</span>
                  </div>
                  <span className="text-[9px] text-gray-400 font-bold">{new Date(b.date).toLocaleDateString('ar-EG')}</span>
                </div>
              )) : <p className="p-8 text-center text-[10px] text-gray-400 font-bold">لا توجد ملاحظات سلوكية مسجلة</p>}
            </div>
          </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
          <button onClick={handlePrint} className="col-span-2 p-4 bg-blue-600 rounded-2xl font-black text-[11px] text-white shadow-xl shadow-blue-100 flex items-center justify-center gap-2 active:scale-95 transition-transform"><Printer className="w-4 h-4" /> طباعة تقرير PDF</button>
      </div>
    </div>
  );
};

export default StudentReport;