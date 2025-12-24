import React, { useState } from 'react';
import { Student } from '../types';
import { Award, AlertCircle, MessageCircle, PhoneCall, GraduationCap, Trash2, Download, Loader2 } from 'lucide-react';
import { Capacitor } from '@capacitor/core';

// تعريف html2pdf لتجنب أخطاء TypeScript
declare var html2pdf: any;

interface StudentReportProps {
  student: Student;
  onUpdateStudent?: (s: Student) => void;
}

const StudentReport: React.FC<StudentReportProps> = ({ student, onUpdateStudent }) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
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

  // حساب المعدل النهائي والمجموع الكلي
  let finalPercentage = 0;
  let finalScore = 0;
  let finalMax = 0;

  if (sem1Stats.max > 0 && sem2Stats.max > 0) {
      finalPercentage = Math.round((sem1Stats.percentage + sem2Stats.percentage) / 2);
      finalScore = sem1Stats.score + sem2Stats.score;
      finalMax = sem1Stats.max + sem2Stats.max;
  } else if (sem1Stats.max > 0) {
      finalPercentage = sem1Stats.percentage;
      finalScore = sem1Stats.score;
      finalMax = sem1Stats.max;
  } else if (sem2Stats.max > 0) {
      finalPercentage = sem2Stats.percentage;
      finalScore = sem2Stats.score;
      finalMax = sem2Stats.max;
  }

  // دالة تحديد الرمز اللفظي للدرجة
  const getGradeSymbol = (percentage: number) => {
    if (percentage >= 90) return { symbol: 'أ', color: 'text-emerald-600 bg-emerald-50' };
    if (percentage >= 80) return { symbol: 'ب', color: 'text-blue-600 bg-blue-50' };
    if (percentage >= 65) return { symbol: 'ج', color: 'text-indigo-600 bg-indigo-50' };
    if (percentage >= 50) return { symbol: 'د', color: 'text-amber-600 bg-amber-50' };
    return { symbol: 'هـ', color: 'text-rose-600 bg-rose-50' };
  };

  const finalSymbol = finalMax > 0 ? getGradeSymbol(finalPercentage) : null;

  const handleDeleteBehavior = (behaviorId: string) => {
      if (confirm('هل أنت متأكد من حذف هذا السلوك؟')) {
          const updatedBehaviors = behaviors.filter(b => b.id !== behaviorId);
          if (onUpdateStudent) {
              onUpdateStudent({ ...student, behaviors: updatedBehaviors });
          }
      }
  };

  // --- دالة حفظ تقرير الطالب كـ PDF ---
  const handleSaveReport = () => {
    setIsGeneratingPdf(true);

    const element = document.createElement('div');
    element.setAttribute('dir', 'rtl');
    element.style.fontFamily = 'Tajawal, sans-serif';
    element.style.padding = '20px';

    const reportHtml = `
      <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #eee; padding-bottom: 10px;">
        <h1 style="margin: 0; font-size: 24px; color: #000;">تقرير الطالب المفصل</h1>
        <p style="margin: 5px 0 0; font-size: 14px; color: #555;">تاريخ الاستخراج: ${new Date().toLocaleDateString('ar-EG')}</p>
      </div>

      <div style="background: #f9fafb; border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
         <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 16px; font-weight: bold; color: #333;"><span>الاسم:</span> <span>${student.name}</span></div>
         <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 16px; font-weight: bold; color: #333;"><span>الفصل:</span> <span>${student.classes?.join(' - ')}</span></div>
         <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: bold; color: #333;"><span>رقم ولي الأمر:</span> <span>${student.parentPhone || 'غير مسجل'}</span></div>
      </div>

      <div style="display: flex; gap: 10px; margin-bottom: 20px;">
         <div style="flex: 1; border: 1px solid #ddd; padding: 10px; border-radius: 8px; text-align: center;">
            <div style="font-size: 12px; color: #666;">المعدل العام</div>
            <div style="font-size: 20px; font-weight: 900; color: #2563eb;">${finalPercentage}%</div>
            <div style="font-size: 12px; color: #888;">${finalScore}/${finalMax}</div>
         </div>
         <div style="flex: 1; border: 1px solid #ddd; padding: 10px; border-radius: 8px; text-align: center;">
            <div style="font-size: 12px; color: #666;">أيام الغياب</div>
            <div style="font-size: 20px; font-weight: 900; color: #dc2626;">${student.attendance.filter(a => a.status === 'absent').length}</div>
         </div>
         <div style="flex: 1; border: 1px solid #ddd; padding: 10px; border-radius: 8px; text-align: center;">
            <div style="font-size: 12px; color: #666;">السلوكيات</div>
            <div style="font-size: 20px; font-weight: 900; color: #059669;">${behaviors.length}</div>
         </div>
      </div>

      <h2 style="font-size: 16px; border-bottom: 2px solid #333; padding-bottom: 5px; margin-top: 20px; color: #000;">تفاصيل الدرجات</h2>
      <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">المادة/الأداة</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">الدرجة</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">العظمى</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">الفصل</th>
          </tr>
        </thead>
        <tbody>
          ${allGrades.length > 0 ? allGrades.map(g => `
            <tr>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${g.category}</td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold;">${g.score}</td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${g.maxScore}</td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${g.semester === '1' ? 'الأول' : 'الثاني'}</td>
            </tr>`).join('') : '<tr><td colspan="4" style="border: 1px solid #ddd; padding: 8px; text-align: center;">لا توجد درجات</td></tr>'}
        </tbody>
      </table>

      <h2 style="font-size: 16px; border-bottom: 2px solid #333; padding-bottom: 5px; margin-top: 20px; color: #000;">سجل السلوكيات</h2>
      <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px;">
        <thead>
          <tr style="background-color: #f3f4f6;">
            <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">السلوك</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">النوع</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">النقاط</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">التاريخ</th>
          </tr>
        </thead>
        <tbody>
          ${behaviors.length > 0 ? behaviors.map(b => `
            <tr>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${b.description}</td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: center; color: ${b.type === 'positive' ? '#059669' : '#dc2626'}; font-weight: bold;">${b.type === 'positive' ? 'إيجابي' : 'سلبي'}</td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${b.points > 0 ? '+' + b.points : b.points}</td>
              <td style="border: 1px solid #ddd; padding: 8px; text-align: center;">${new Date(b.date).toLocaleDateString('ar-EG')}</td>
            </tr>`).join('') : '<tr><td colspan="4" style="border: 1px solid #ddd; padding: 8px; text-align: center;">سجل نظيف</td></tr>'}
        </tbody>
      </table>
    `;
    
    element.innerHTML = reportHtml;

    const opt = {
        margin:       10,
        filename:     `Student_Report_${student.name.replace(/\s+/g, '_')}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    if (typeof html2pdf !== 'undefined') {
        const worker = html2pdf().set(opt).from(element);
        
        // إصلاح نسخة الهاتف: فتح الملف في نافذة جديدة
        if (Capacitor.isNativePlatform()) {
             worker.toPdf().get('pdf').then((pdf: any) => {
                 const blob = pdf.output('bloburl');
                 window.open(blob, '_blank');
                 setIsGeneratingPdf(false);
             }).catch((err: any) => {
                 console.error(err);
                 alert('حدث خطأ أثناء معاينة الملف');
                 setIsGeneratingPdf(false);
             });
        } else {
             worker.save().then(() => {
                setIsGeneratingPdf(false);
             }).catch((err: any) => {
                console.error(err);
                alert('حدث خطأ أثناء حفظ الملف');
                setIsGeneratingPdf(false);
             });
        }
    } else {
        alert('مكتبة PDF غير محملة. تأكد من الاتصال بالإنترنت.');
        setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="space-y-6">
          <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col gap-6 relative">
            {/* زر الحفظ كـ PDF */}
            <button 
                onClick={handleSaveReport} 
                disabled={isGeneratingPdf}
                className="absolute top-6 left-6 p-3 bg-gray-50 rounded-full hover:bg-gray-100 text-gray-600 transition-colors disabled:opacity-50" 
                title={Capacitor.isNativePlatform() ? "معاينة التقرير (PDF)" : "حفظ التقرير (PDF)"}
            >
                {isGeneratingPdf ? <Loader2 className="w-5 h-5 animate-spin text-blue-600" /> : <Download className="w-5 h-5" />}
            </button>

            <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-[1.5rem] bg-blue-600 flex items-center justify-center text-white font-black text-2xl">{student.name.charAt(0)}</div>
                <div>
                  <h1 className="text-sm font-black text-gray-900 mb-1">{student.name}</h1>
                  <span className="text-[9px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-black">الفصل: {student.classes?.join(' - ') || 'غير محدد'}</span>
                </div>
            </div>

            {/* إحصائيات نهائية - تم تعديل مكان المستوى */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-2xl">
              <div>
                  <span className="text-[9px] font-bold text-gray-400 block mb-1">النتيجة النهائية</span>
                  <div className="flex flex-col items-start gap-1">
                     <span className="text-3xl font-black text-gray-900 leading-none">{finalPercentage}%</span>
                     {finalMax > 0 && <span className="text-[10px] font-bold text-gray-400">({finalScore}/{finalMax})</span>}
                     
                     {/* نقل المستوى للأسفل */}
                     {finalSymbol && (
                         <div className="flex items-center gap-2 mt-2 bg-white px-3 py-1.5 rounded-xl border border-gray-100 shadow-sm">
                             <span className="text-[9px] font-bold text-gray-400">المستوى:</span>
                             <span className={`text-xs font-black ${finalSymbol.color.replace('bg-', 'text-').split(' ')[0]}`}>{finalSymbol.symbol}</span>
                         </div>
                     )}
                  </div>
              </div>
              <div>
                  <span className="text-[9px] font-bold text-gray-400 block mb-1">عدد السلوكيات</span>
                  <span className="text-3xl font-black text-gray-900 leading-none">{behaviors.length}</span>
              </div>
            </div>

            {/* أزرار الاتصال */}
            {student.parentPhone && (
              <div className="flex gap-2 border-t border-gray-50 pt-4">
                <a href={`https://wa.me/${student.parentPhone}`} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-50 text-emerald-700 rounded-2xl text-[10px] font-black active:scale-95"><MessageCircle className="w-4 h-4"/> واتساب ولي الأمر</a>
                <a href={`tel:${student.parentPhone}`} className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-50 text-blue-700 rounded-2xl text-[10px] font-black active:scale-95"><PhoneCall className="w-4 h-4"/> اتصال هاتف</a>
              </div>
            )}
          </div>

          {/* Grade Details Table - Semester 1 */}
          {sem1Grades.length > 0 && (
            <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm">
                <div className="bg-gray-50/50 p-4 border-b border-gray-100 flex justify-between items-center">
                    <div className="flex items-center gap-2"><GraduationCap className="w-4 h-4 text-blue-600" /><h3 className="font-black text-gray-800 text-[11px]">الفصل الدراسي الأول</h3></div>
                    <span className="text-[10px] font-black text-blue-600">{sem1Stats.score} / {sem1Stats.max} ({sem1Stats.percentage}%)</span>
                </div>
                <div className="p-4 space-y-2">
                  {sem1Grades.map(grade => (
                      <div key={grade.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                        <span className="text-[10px] font-bold text-gray-700">{grade.category}</span>
                        <span className="text-[10px] font-black text-gray-900">{grade.score} / {grade.maxScore}</span>
                      </div>
                  ))}
                </div>
            </div>
          )}

          {/* Grade Details Table - Semester 2 */}
          {sem2Grades.length > 0 && (
            <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm">
                <div className="bg-gray-50/50 p-4 border-b border-gray-100 flex justify-between items-center">
                    <div className="flex items-center gap-2"><GraduationCap className="w-4 h-4 text-indigo-600" /><h3 className="font-black text-gray-800 text-[11px]">الفصل الدراسي الثاني</h3></div>
                    <span className="text-[10px] font-black text-indigo-600">{sem2Stats.score} / {sem2Stats.max} ({sem2Stats.percentage}%)</span>
                </div>
                <div className="p-4 space-y-2">
                  {sem2Grades.map(grade => (
                      <div key={grade.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                        <span className="text-[10px] font-bold text-gray-700">{grade.category}</span>
                        <span className="text-[10px] font-black text-gray-900">{grade.score} / {grade.maxScore}</span>
                      </div>
                  ))}
                </div>
            </div>
          )}

          {/* Behavior Log */}
          <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm">
            <div className="bg-gray-50/50 p-4 border-b border-gray-100 flex items-center gap-2"><Award className="w-4 h-4 text-blue-600" /><h3 className="font-black text-gray-800 text-[11px]">سجل السلوكيات</h3></div>
            <div className="divide-y divide-gray-50">
              {behaviors.length > 0 ? behaviors.map(b => (
                <div key={b.id} className="p-4 flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg ${b.type === 'positive' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {b.type === 'positive' ? <Award className="w-3.5 h-3.5"/> : <AlertCircle className="w-3.5 h-3.5"/>}
                    </div>
                    <div>
                        <span className="block text-[10px] font-black text-gray-800">{b.description}</span>
                        <span className="text-[9px] text-gray-400 font-bold">{new Date(b.date).toLocaleDateString('ar-EG')}</span>
                    </div>
                  </div>
                  {onUpdateStudent && (
                      <button onClick={() => handleDeleteBehavior(b.id)} className="p-2 text-gray-300 hover:text-rose-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                      </button>
                  )}
                </div>
              )) : <p className="p-8 text-center text-[10px] text-gray-400 font-bold">لا توجد ملاحظات سلوكية مسجلة</p>}
            </div>
          </div>
      </div>
    </div>
  );
};

export default StudentReport;