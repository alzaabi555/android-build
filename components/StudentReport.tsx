
import React, { useState } from 'react';
import { Student, GradeRecord } from '../types';
import { Award, AlertCircle, Trash2, Loader2, FileText, LayoutList, ArrowRight, Printer, CalendarX, DoorOpen } from 'lucide-react';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { useApp } from '../context/AppContext';

declare var html2pdf: any;

interface StudentReportProps {
  student: Student;
  onUpdateStudent?: (s: Student) => void;
  currentSemester?: '1' | '2';
  teacherInfo?: { name: string; school: string; subject: string; governorate: string; stamp?: string; ministryLogo?: string; academicYear?: string };
  onBack?: () => void;
}

const StudentReport: React.FC<StudentReportProps> = ({ student, onUpdateStudent, currentSemester, teacherInfo, onBack }) => {
  const { assessmentTools, certificateSettings } = useApp();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  
  const behaviors = (student.behaviors || []).filter(b => !b.semester || b.semester === (currentSemester || '1'));
  const allGrades = student.grades || [];

  const totalPositivePoints = behaviors.filter(b => b.type === 'positive').reduce((acc, b) => acc + b.points, 0);
  const totalNegativePoints = behaviors.filter(b => b.type === 'negative').reduce((acc, b) => acc + Math.abs(b.points), 0);

  // Filter grades for current semester
  const currentSemesterGrades = allGrades.filter(g => !g.semester || g.semester === (currentSemester || '1'));

  // --- Logic for Ordered Grade Rows (Matching GradeBook) ---
  const finalExamName = "الامتحان النهائي";
  const continuousTools = assessmentTools.filter(t => t.name.trim() !== finalExamName);
  const finalTool = assessmentTools.find(t => t.name.trim() === finalExamName);

  let continuousSum = 0;
  
  // Calculate continuous sum based on tools
  continuousTools.forEach(tool => {
      const g = currentSemesterGrades.find(r => r.category.trim() === tool.name.trim());
      if (g) continuousSum += (Number(g.score) || 0);
  });

  // Calculate final score
  let finalScore = 0;
  if (finalTool) {
      const g = currentSemesterGrades.find(r => r.category.trim() === finalTool.name.trim());
      if (g) finalScore = (Number(g.score) || 0);
  }

  // Fallback total calculation if no tools defined
  const fallbackTotal = currentSemesterGrades.reduce((a, b) => a + (Number(b.score) || 0), 0);
  const totalScore = assessmentTools.length > 0 ? (continuousSum + finalScore) : fallbackTotal;

  // Filter Absence and Truant records
  const absenceRecords = (student.attendance || []).filter(a => a.status === 'absent');
  const truantRecords = (student.attendance || []).filter(a => a.status === 'truant');

  const handleDeleteBehavior = (behaviorId: string) => {
      if (confirm('هل أنت متأكد من حذف هذا السلوك؟')) {
          const updatedBehaviors = (student.behaviors || []).filter(b => b.id !== behaviorId);
          if (onUpdateStudent) {
              onUpdateStudent({ ...student, behaviors: updatedBehaviors });
          }
      }
  };

  const exportPDF = async (element: HTMLElement, filename: string, setLoader: (val: boolean) => void, orientation: 'portrait' | 'landscape' = 'portrait') => {
    setLoader(true);
    const opt = {
        margin: 0,
        filename: filename,
        image: { type: 'jpeg', quality: 1.0 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true, scrollY: 0 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: orientation }
    };

    if (typeof html2pdf !== 'undefined') {
        try {
            const worker = html2pdf().set(opt).from(element).toPdf();
            if (Capacitor.isNativePlatform()) {
                 const pdfBase64 = await worker.output('datauristring');
                 const base64Data = pdfBase64.split(',')[1];
                 const result = await Filesystem.writeFile({ path: filename, data: base64Data, directory: Directory.Cache });
                 await Share.share({ title: filename, url: result.uri, dialogTitle: 'مشاركة/حفظ' });
            } else {
                 worker.save();
            }
        } catch (err) { console.error('PDF Error:', err); } finally { setLoader(false); }
    } else { alert('مكتبة PDF غير جاهزة'); setLoader(false); }
  };

  const handlePrintReport = async () => {
      const element = document.getElementById('report-content');
      if (element) {
          await exportPDF(element, `Report_${student.name}.pdf`, setIsGeneratingPdf);
      }
  };

  return (
    <div className="flex flex-col h-full space-y-4 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500 text-slate-900 dark:text-white">
        
        {/* Header Action Bar */}
        <div className="flex items-center justify-between glass-heavy p-4 rounded-[2rem] border border-white/20">
            <div className="flex items-center gap-3">
                <button onClick={onBack} className="p-3 rounded-full glass-icon hover:bg-white/10 transition-colors">
                    <ArrowRight className="w-5 h-5" />
                </button>
                <div>
                    <h2 className="text-lg font-black">{student.name}</h2>
                    <p className="text-xs font-bold text-slate-500 dark:text-white/60">{student.classes[0]} • تقرير الفصل {currentSemester}</p>
                </div>
            </div>
            <div className="flex gap-2">
                <button 
                    onClick={handlePrintReport} 
                    disabled={isGeneratingPdf}
                    className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-black text-xs shadow-lg shadow-indigo-500/30 active:scale-95 transition-all flex items-center gap-2"
                >
                    {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                    طباعة التقرير
                </button>
            </div>
        </div>

        {/* Report Preview (Screen) */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
            {/* Added 'force-print-style' class to ensure correct colors */}
            <div id="report-content" className="force-print-style bg-white text-slate-900 p-8 rounded-none md:rounded-[2rem] max-w-4xl mx-auto shadow-xl relative overflow-hidden border-[3px] border-black box-border" dir="rtl">
                
                {/* Formal Header */}
                <div className="flex justify-between items-start mb-8 border-b-2 border-slate-900/10 pb-6">
                    <div className="text-center w-1/3">
                        <p className="font-bold text-sm mb-1">سلطنة عمان</p>
                        <p className="font-bold text-sm mb-1">وزارة التربية والتعليم</p>
                        <p className="font-bold text-sm mb-1">المديرية العامة للتربية والتعليم لمحافظة {teacherInfo?.governorate || '.........'}</p>
                        <p className="font-bold text-sm">مدرسة {teacherInfo?.school || '................'}</p>
                    </div>
                    <div className="flex flex-col items-center justify-center w-1/3">
                         {teacherInfo?.ministryLogo ? (
                             <img src={teacherInfo.ministryLogo} className="h-20 object-contain" alt="Ministry Logo" />
                         ) : (
                             <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
                                 <FileText className="w-10 h-10 text-slate-300" />
                             </div>
                         )}
                         <h1 className="text-xl font-black mt-4 underline decoration-indigo-500 decoration-4 underline-offset-4">تقرير مستوى طالب</h1>
                    </div>
                    <div className="text-center w-1/3 flex flex-col items-end">
                        <div className="text-right">
                             <p className="font-bold text-sm mb-1">العام الدراسي: {teacherInfo?.academicYear || `${new Date().getFullYear()} / ${new Date().getFullYear() + 1}`}</p>
                             <p className="font-bold text-sm mb-1">الفصل الدراسي: {currentSemester === '1' ? 'الأول' : 'الثاني'}</p>
                             <p className="font-bold text-sm">تاريخ التقرير: {new Date().toLocaleDateString('en-GB')}</p>
                        </div>
                    </div>
                </div>

                {/* Student Info Card */}
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 mb-8 flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-6 mb-4">
                            <div>
                                <span className="text-xs font-bold text-slate-500 block mb-1">اسم الطالب</span>
                                <h3 className="text-xl font-black text-slate-900">{student.name}</h3>
                            </div>
                            <div className="w-px h-10 bg-slate-300"></div>
                            <div>
                                <span className="text-xs font-bold text-slate-500 block mb-1">الصف</span>
                                <h3 className="text-xl font-black text-slate-900">{student.classes[0]}</h3>
                            </div>
                            <div className="w-px h-10 bg-slate-300"></div>
                            <div>
                                <span className="text-xs font-bold text-slate-500 block mb-1">رقم ولي الأمر</span>
                                <h3 className="text-lg font-black text-slate-900 font-mono" dir="ltr">{student.parentPhone || '-'}</h3>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg text-xs font-bold">نقاط إيجابية: {totalPositivePoints}</div>
                            <div className="bg-rose-100 text-rose-700 px-3 py-1 rounded-lg text-xs font-bold">نقاط سلبية: {totalNegativePoints}</div>
                        </div>
                    </div>
                    <div className="w-24 h-24 bg-white rounded-2xl border-2 border-slate-100 p-1 shadow-sm">
                         {student.avatar ? <img src={student.avatar} className="w-full h-full object-cover rounded-xl" /> : <div className="w-full h-full flex items-center justify-center bg-slate-50 rounded-xl text-3xl font-black text-slate-300">{student.name.charAt(0)}</div>}
                    </div>
                </div>

                {/* Grades Section - Ordered to Match GradeBook */}
                <div className="mb-8">
                    <h3 className="font-black text-lg mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-indigo-600" />
                        التحصيل الدراسي
                    </h3>
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-100">
                                <th className="border border-slate-300 p-3 text-sm font-bold text-right">المادة</th>
                                <th className="border border-slate-300 p-3 text-sm font-bold text-center">أداة التقويم</th>
                                <th className="border border-slate-300 p-3 text-sm font-bold text-center">الدرجة</th>
                            </tr>
                        </thead>
                        <tbody>
                            {assessmentTools.length > 0 ? (
                                <>
                                    {/* 1. Continuous Tools Rows */}
                                    {continuousTools.map((tool) => {
                                        const grade = currentSemesterGrades.find(g => g.category.trim() === tool.name.trim());
                                        return (
                                            <tr key={tool.id}>
                                                <td className="border border-slate-300 p-3 text-sm font-bold text-right">{teacherInfo?.subject || 'المادة'}</td>
                                                <td className="border border-slate-300 p-3 text-sm text-center bg-[#ffedd5]">{tool.name}</td>
                                                <td className="border border-slate-300 p-3 text-sm text-center font-bold font-mono">{grade ? grade.score : '-'}</td>
                                            </tr>
                                        );
                                    })}
                                    
                                    {/* 2. Sum 60 Row */}
                                    <tr className="bg-blue-50 font-bold">
                                        <td colSpan={2} className="border border-slate-300 p-3 text-sm text-center text-blue-900 border-t-2 border-slate-400">المجموع (60)</td>
                                        <td className="border border-slate-300 p-3 text-sm text-center font-mono text-blue-900 border-t-2 border-slate-400">{continuousSum}</td>
                                    </tr>

                                    {/* 3. Final Exam Row (Only if tool exists) */}
                                    {finalTool && (() => {
                                        const grade = currentSemesterGrades.find(g => g.category.trim() === finalTool.name.trim());
                                        return (
                                            <tr key={finalTool.id}>
                                                <td className="border border-slate-300 p-3 text-sm font-bold text-right">{teacherInfo?.subject || 'المادة'}</td>
                                                <td className="border border-slate-300 p-3 text-sm text-center bg-[#fce7f3]">{finalTool.name} (40)</td>
                                                <td className="border border-slate-300 p-3 text-sm text-center font-bold font-mono">{grade ? grade.score : '-'}</td>
                                            </tr>
                                        );
                                    })()}
                                </>
                            ) : (
                                /* Fallback if no tools defined (Raw List) */
                                currentSemesterGrades.length > 0 ? currentSemesterGrades.map((g, idx) => (
                                    <tr key={idx}>
                                        <td className="border border-slate-300 p-3 text-sm font-bold">{g.subject}</td>
                                        <td className="border border-slate-300 p-3 text-sm text-center">{g.category}</td>
                                        <td className="border border-slate-300 p-3 text-sm text-center font-bold font-mono">{g.score}</td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={3} className="border border-slate-300 p-4 text-center text-sm text-slate-500">لا توجد درجات مرصودة لهذا الفصل</td>
                                    </tr>
                                )
                            )}
                        </tbody>
                        <tfoot>
                            <tr className="bg-slate-100">
                                <td colSpan={2} className="border border-slate-300 p-3 text-sm font-black text-right border-t-2 border-black">المجموع الكلي</td>
                                <td className="border border-slate-300 p-3 text-sm font-black text-center font-mono text-lg border-t-2 border-black">
                                    {totalScore}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Attendance Summary and Details */}
                <div className="mb-8">
                     <h3 className="font-black text-lg mb-4 flex items-center gap-2">
                        <LayoutList className="w-5 h-5 text-indigo-600" />
                        ملخص الحضور والغياب
                    </h3>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                            <span className="text-xs font-bold text-slate-500 block mb-1">أيام الغياب</span>
                            <span className="text-2xl font-black text-rose-600">{absenceRecords.length}</span>
                        </div>
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                            <span className="text-xs font-bold text-slate-500 block mb-1">الهروب (التسرب)</span>
                            <span className="text-2xl font-black text-purple-600">{truantRecords.length}</span>
                        </div>
                         <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
                            <span className="text-xs font-bold text-slate-500 block mb-1">الحضور</span>
                            <span className="text-2xl font-black text-emerald-600">{student.attendance.filter(a => a.status === 'present').length}</span>
                        </div>
                    </div>

                    {/* Detailed Absence/Truancy Table */}
                    {(absenceRecords.length > 0 || truantRecords.length > 0) && (
                        <table className="w-full border-collapse mt-2">
                            <thead>
                                <tr className="bg-slate-100">
                                    <th className="border border-slate-300 p-2 text-xs font-bold text-right w-1/3">التاريخ</th>
                                    <th className="border border-slate-300 p-2 text-xs font-bold text-center">الحالة</th>
                                    <th className="border border-slate-300 p-2 text-xs font-bold text-center">الملاحظات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[...absenceRecords, ...truantRecords]
                                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                    .map((rec, idx) => (
                                    <tr key={idx}>
                                        <td className="border border-slate-300 p-2 text-xs font-mono">{new Date(rec.date).toLocaleDateString('en-GB')}</td>
                                        <td className={`border border-slate-300 p-2 text-xs font-bold text-center ${rec.status === 'absent' ? 'text-rose-600' : 'text-purple-600'}`}>
                                            {rec.status === 'absent' ? 'غياب' : 'تسرب'}
                                        </td>
                                        <td className="border border-slate-300 p-2 text-xs text-center text-slate-500">-</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Behavior Log */}
                <div className="mb-12">
                    <h3 className="font-black text-lg mb-4 flex items-center gap-2">
                        <Award className="w-5 h-5 text-indigo-600" />
                        سجل السلوك والملاحظات
                    </h3>
                     {behaviors.length > 0 ? (
                         <div className="space-y-2">
                             {behaviors.map((b, idx) => (
                                 <div key={idx} className={`flex items-center justify-between p-3 rounded-lg border ${b.type === 'positive' ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                                     <div className="flex items-center gap-3">
                                         <div className={`w-8 h-8 rounded-full flex items-center justify-center ${b.type === 'positive' ? 'bg-emerald-200 text-emerald-700' : 'bg-rose-200 text-rose-700'}`}>
                                             {b.type === 'positive' ? <Award className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                         </div>
                                         <div>
                                             <p className="text-sm font-bold text-slate-800">{b.description}</p>
                                             <p className="text-[10px] text-slate-500">{new Date(b.date).toLocaleDateString('en-GB')}</p>
                                         </div>
                                     </div>
                                     <span className={`text-sm font-black ${b.type === 'positive' ? 'text-emerald-700' : 'text-rose-700'}`}>
                                         {b.type === 'positive' ? '+' : '-'}{Math.abs(b.points)}
                                     </span>
                                     {onUpdateStudent && (
                                         <button onClick={() => handleDeleteBehavior(b.id)} className="p-1 text-slate-400 hover:text-rose-500 print:hidden">
                                             <Trash2 className="w-4 h-4" />
                                         </button>
                                     )}
                                 </div>
                             ))}
                         </div>
                     ) : (
                         <p className="text-center text-sm text-slate-500 py-4 bg-slate-50 rounded-xl border border-dashed border-slate-300">لا توجد ملاحظات سلوكية مسجلة لهذا الفصل</p>
                     )}
                </div>

                {/* Signatures */}
                <div className="flex justify-between items-end pt-8 border-t-2 border-slate-900/10 relative">
                     <div className="text-center w-1/3">
                        <p className="font-bold text-sm mb-8 text-slate-500">معلم المادة</p>
                        <p className="font-black text-lg">{teacherInfo?.name || '....................'}</p>
                     </div>
                     
                     {/* School Stamp */}
                     {teacherInfo?.stamp && (
                         <div className="absolute left-1/2 bottom-2 transform -translate-x-1/2 w-32 opacity-80 mix-blend-multiply">
                             <img src={teacherInfo.stamp} className="w-full object-contain" alt="Stamp" />
                         </div>
                     )}

                     <div className="text-center w-1/3">
                        <p className="font-bold text-sm mb-8 text-slate-500">مدير المدرسة</p>
                        <p className="font-black text-lg">....................</p>
                     </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default StudentReport;
