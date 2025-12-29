
import React, { useState } from 'react';
import { Student, GradeRecord } from '../types';
import { Award, AlertCircle, MessageCircle, PhoneCall, Trash2, Loader2, Mail, UserCheck, FileText, Medal } from 'lucide-react';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

declare var html2pdf: any;

interface StudentReportProps {
  student: Student;
  onUpdateStudent?: (s: Student) => void;
  currentSemester?: '1' | '2';
  teacherInfo?: { name: string; school: string; subject: string; governorate: string };
}

const StudentReport: React.FC<StudentReportProps> = ({ student, onUpdateStudent, currentSemester, teacherInfo }) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [generatingSummonsId, setGeneratingSummonsId] = useState<string | null>(null);
  
  const behaviors = (student.behaviors || []).filter(b => !b.semester || b.semester === (currentSemester || '1'));
  const allGrades = student.grades || [];

  const totalPositivePoints = behaviors.filter(b => b.type === 'positive').reduce((acc, b) => acc + b.points, 0);
  const totalNegativePoints = behaviors.filter(b => b.type === 'negative').reduce((acc, b) => acc + Math.abs(b.points), 0);

  const sem1Grades = allGrades.filter(g => !g.semester || g.semester === '1');
  const sem2Grades = allGrades.filter(g => g.semester === '2');

  const calcStats = (grades: GradeRecord[]) => {
      const score = grades.reduce((acc, g) => acc + (Number(g.score) || 0), 0);
      const max = grades.reduce((acc, g) => acc + (Number(g.maxScore) || 0), 0);
      return { score, max };
  };

  const sem1Stats = calcStats(sem1Grades);
  const sem2Stats = calcStats(sem2Grades);

  const finalScore = sem1Stats.score + sem2Stats.score;
  const finalMax = sem1Stats.max + sem2Stats.max;
  
  const finalAverage = finalScore / 2; // لم يعد يستخدم للعرض الأساسي، سنستخدم النتيجة النهائية
  const finalPercentage = finalMax > 0 ? Math.round((finalScore / finalMax) * 100) : 0;

  const getGradeSymbol = (percentage: number) => {
    if (finalMax === 0 && percentage === 0) return null;
    if (percentage >= 90) return { symbol: 'أ', desc: 'ممتاز', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' };
    if (percentage >= 80) return { symbol: 'ب', desc: 'جيد جداً', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' };
    if (percentage >= 65) return { symbol: 'ج', desc: 'جيد', color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200' };
    if (percentage >= 50) return { symbol: 'د', desc: 'مقبول', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' };
    return { symbol: 'هـ', desc: 'يحتاج مساعدة', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' };
  };

  const finalSymbol = getGradeSymbol(finalPercentage);

  const lowGradesForSummons = allGrades.filter(g => {
    const isExam = g.category.includes('اختبار'); 
    const isFailing = g.score < (g.maxScore / 2);
    return isExam && isFailing;
  });

  const handleDeleteBehavior = (behaviorId: string) => {
      if (confirm('هل أنت متأكد من حذف هذا السلوك؟')) {
          const updatedBehaviors = (student.behaviors || []).filter(b => b.id !== behaviorId);
          if (onUpdateStudent) {
              onUpdateStudent({ ...student, behaviors: updatedBehaviors });
          }
      }
  };

  const handleWhatsAppClick = () => {
    if (!student.parentPhone) return;
    let cleanPhone = student.parentPhone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('00')) cleanPhone = cleanPhone.substring(2);
    if (cleanPhone.length === 8) cleanPhone = '968' + cleanPhone;
    else if (cleanPhone.startsWith('0')) cleanPhone = '968' + cleanPhone.substring(1);

    const url = `https://wa.me/${cleanPhone}`;
    if (Capacitor.isNativePlatform()) window.open(url, '_system');
    else window.open(url, '_blank');
  };

  const getBase64Image = async (url: string): Promise<string> => {
      try {
          const response = await fetch(url);
          if (!response.ok) return ""; 
          const blob = await response.blob();
          return new Promise((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => {
                  const result = reader.result as string;
                  if (result && result.startsWith('data:')) resolve(result);
                  else resolve("");
              };
              reader.onerror = () => resolve("");
              reader.readAsDataURL(blob);
          });
      } catch (error) { return ""; }
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
                 const pdfBlob = await worker.output('blob');
                 const url = URL.createObjectURL(pdfBlob);
                 const link = document.createElement('a');
                 link.href = url; link.download = filename; link.target = "_blank";
                 document.body.appendChild(link); link.click();
                 setTimeout(() => { document.body.removeChild(link); URL.revokeObjectURL(url); }, 2000);
            }
        } catch (err) { console.error('PDF Error:', err); } finally { setLoader(false); }
    } else { alert('مكتبة PDF غير جاهزة'); setLoader(false); }
  };

  const handleGenerateCertificate = async () => {
      setIsGeneratingPdf(true);
      const schoolName = teacherInfo?.school || '...................';
      const teacherName = teacherInfo?.name || '...................';
      const subject = teacherInfo?.subject || '...............';
      const currentYear = new Date().getFullYear();
      const governorate = teacherInfo?.governorate || '...............';
      
      let emblemSrc = await getBase64Image('oman_logo.png') || await getBase64Image('icon.png');

      const element = document.createElement('div');
      element.setAttribute('dir', 'rtl');
      element.style.fontFamily = 'Tajawal, sans-serif';
      element.style.padding = '0';
      element.style.margin = '0';
      element.style.width = '297mm'; 
      element.style.height = '210mm';
      element.style.backgroundColor = '#fff';
      element.style.position = 'relative';
      element.style.overflow = 'hidden';

      // تصميم الشهادة
      element.innerHTML = `
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;800&display=swap');
            @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap');
            @import url('https://fonts.googleapis.com/css2?family=Aref+Ruqaa:wght@400;700&display=swap');

            .cert-body { 
                width: 100%; height: 100%; position: relative; background: #fff; overflow: hidden;
                display: flex; flex-direction: column; align-items: center;
                box-sizing: border-box;
                padding: 15mm;
            }
            .frame-border {
                position: absolute; top: 10mm; left: 10mm; right: 10mm; bottom: 10mm;
                border: 2px solid #0891b2; border-radius: 10px; z-index: 1; background: transparent;
            }
            .frame-corner { position: absolute; width: 40px; height: 40px; z-index: 2; border: 6px solid #f59e0b; }
            .c-tl { top: -2px; left: -2px; border-right: none; border-bottom: none; border-radius: 10px 0 0 0; }
            .c-tr { top: -2px; right: -2px; border-left: none; border-bottom: none; border-radius: 0 10px 0 0; }
            .c-bl { bottom: -2px; left: -2px; border-right: none; border-top: none; border-radius: 0 0 0 10px; }
            .c-br { bottom: -2px; right: -2px; border-left: none; border-top: none; border-radius: 0 0 10px 0; }
            .deco-tri { position: absolute; width: 0; height: 0; opacity: 0.1; z-index: 0; }
            .tri-1 { top: 0; left: 0; border-top: 200px solid #0891b2; border-right: 200px solid transparent; }
            .tri-2 { bottom: 0; right: 0; border-bottom: 200px solid #0891b2; border-left: 200px solid transparent; }
            .content-wrapper { position: relative; width: 100%; height: 100%; z-index: 10; display: flex; flex-direction: column; align-items: center; }
            .header-container { text-align: center; margin-bottom: 15px; width: 100%; }
            .oman-logo { height: 80px; width: auto; margin-bottom: 10px; }
            .ministry-info { font-family: 'Tajawal', sans-serif; font-size: 14px; color: #444; line-height: 1.5; font-weight: bold; }
            .main-title { font-family: 'Aref Ruqaa', serif; font-size: 60px; color: #1e293b; margin: 5px 0 30px 0; position: relative; }
            .title-underline { width: 150px; height: 3px; background: #f59e0b; margin: 0 auto; border-radius: 2px; }
            .cert-text-block { font-family: 'Amiri', serif; font-size: 26px; text-align: center; line-height: 2.2; color: #1f2937; width: 90%; margin-bottom: auto; }
            .highlight-name { color: #0e7490; font-weight: bold; font-size: 38px; padding: 0 10px; display: inline-block; }
            .highlight-data { color: #b45309; font-weight: bold; padding: 0 5px; }
            
            /* Signatures: Teacher Right, Principal Left */
            .signatures-row { 
                width: 100%; display: flex; justify-content: space-between; align-items: flex-end;
                padding: 0 40px 20px 40px; margin-top: 20px;
            }
            .sig-box { text-align: center; width: 250px; }
            .sig-title { font-family: 'Tajawal', sans-serif; font-size: 18px; font-weight: bold; color: #64748b; margin-bottom: 40px; }
            .sig-line { font-family: 'Amiri', serif; font-size: 20px; font-weight: bold; color: #000; border-top: 1px solid #cbd5e1; padding-top: 10px; display: block; }
        </style>

        <div class="cert-body">
            <div class="frame-border"><div class="frame-corner c-tl"></div><div class="frame-corner c-tr"></div><div class="frame-corner c-bl"></div><div class="frame-corner c-br"></div></div>
            <div class="deco-tri tri-1"></div><div class="deco-tri tri-2"></div>
            <div class="content-wrapper">
                <div class="header-container">
                    ${emblemSrc ? `<img src="${emblemSrc}" class="oman-logo" />` : ''}
                    <div class="ministry-info">سلطنة عمان<br/>وزارة التربية والتعليم<br/>المديرية العامة للتربية والتعليم لمحافظة ${governorate}<br/>مدرسة ${schoolName}</div>
                </div>
                <div class="main-title">شهادة تفوق دراسي<div class="title-underline"></div></div>
                <div class="cert-text-block">
                    تتشرف إدارة مدرسة <span class="highlight-data">${schoolName}</span> بمنح الطالب<br/>
                    <span class="highlight-name">${student.name}</span><br/>
                    هذه الشهادة نظير تفوقه وتميزه في مادة <span class="highlight-data">${subject}</span><br/>
                    للصف <span class="highlight-data">${student.classes[0] || '....'}</span> للعام الدراسي <span class="highlight-data">${currentYear} / ${currentYear + 1}</span><br/>
                    <span style="font-size: 20px; color: #666;">متمنين له دوام التوفيق والنجاح</span>
                </div>
                <div class="signatures-row">
                    <div class="sig-box">
                        <div class="sig-title">المعلم</div>
                        <div class="sig-line">${teacherName}</div>
                    </div>
                    <div class="sig-box">
                        <div class="sig-title">مدير المدرسة</div>
                        <div class="sig-line">.........................</div>
                    </div>
                </div>
            </div>
        </div>
      `;
      exportPDF(element, `شهادة_تفوق_${student.name}.pdf`, setIsGeneratingPdf, 'landscape');
  };

  const handleSaveReport = () => {
    const element = document.createElement('div');
    element.setAttribute('dir', 'rtl');
    element.style.fontFamily = 'Tajawal, sans-serif';
    element.style.padding = '20px';
    element.style.color = '#000';

    const behaviorRows = behaviors.map(b => `
        <tr>
            <td style="border:1px solid #ccc; padding:6px; font-size:12px;">${b.description}</td>
            <td style="border:1px solid #ccc; padding:6px; font-size:12px; text-align:center;">${new Date(b.date).toLocaleDateString('ar-EG')}</td>
            <td style="border:1px solid #ccc; padding:6px; font-size:12px; text-align:center; color:${b.type === 'positive' ? 'green' : 'red'}; font-weight:bold;">${b.type === 'positive' ? 'إيجابي' : 'سلبي'}</td>
        </tr>
    `).join('');

    // حساب الرموز (أ، ب، ج..) لكل فصل
    const getSymbolStr = (score: number, max: number) => {
        if (!max) return '-';
        const p = (score / max) * 100;
        const s = getGradeSymbol(p);
        return s ? s.symbol : '-';
    };

    const s1Sym = getSymbolStr(sem1Stats.score, sem1Stats.max);
    const s2Sym = getSymbolStr(sem2Stats.score, sem2Stats.max);
    const finalSym = getSymbolStr(finalScore, finalMax);

    element.innerHTML = `
      <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 15px;">
        <h1 style="margin: 0; font-size: 24px;">تقرير الطالب الدراسي والسلوكي</h1>
        <p style="margin: 8px 0 0; font-size: 18px; color: #000; font-weight: bold;">مدرسة  ${teacherInfo?.school || '................'}</p>
        ${teacherInfo?.subject ? `<p style="margin: 5px 0 0; font-size: 14px; color: #555;">المادة: ${teacherInfo.subject}</p>` : ''}
        <p style="margin: 5px 0 0; font-size: 14px; color: #555;">تاريخ التقرير  <span dir="ltr">${new Date().toLocaleDateString('ar-EG')}</span></p>
      </div>
      
      <div style="background: #f9fafb; padding: 15px; border-radius: 12px; margin-bottom: 20px; border: 1px solid #e5e7eb;">
         <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding:6px; font-weight:bold;">اسم الطالب:</td><td style="padding:6px;">${student.name}</td></tr>
            <tr><td style="padding:6px; font-weight:bold;">الصف:</td><td style="padding:6px;">${student.classes[0] || '-'}</td></tr>
         </table>
      </div>

      <div style="margin-bottom: 20px;">
         <h3 style="border-bottom: 1px solid #333; padding-bottom: 5px;">ملخص النتائج</h3>
         <table style="width: 100%; border-collapse: collapse; text-align: center; border: 1px solid #ccc; margin-top: 10px;">
            <tr style="background: #f0f0f0;"><th>الفصل 1</th><th>الفصل 2</th><th>المجموع</th><th>النتيجة النهائية</th></tr>
            <tr>
                <td style="padding:10px; border:1px solid #ccc;">
                    ${sem1Stats.score} <span style="font-size:10px; color:#666">(${s1Sym})</span>
                </td>
                <td style="padding:10px; border:1px solid #ccc;">
                     ${sem2Stats.score} <span style="font-size:10px; color:#666">(${s2Sym})</span>
                </td>
                <td style="padding:10px; border:1px solid #ccc;">${finalScore}</td>
                <td style="padding:10px; border:1px solid #ccc; background:#f0f9ff; font-weight:bold;">
                    ${finalPercentage}% <span style="color:#000">(${finalSym})</span>
                </td>
            </tr>
         </table>
      </div>
      
      <div style="margin-bottom: 20px;">
         <h3 style="border-bottom: 1px solid #333; padding-bottom: 5px;">السلوكيات</h3>
         <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <thead><tr style="background:#e5e7eb;"><th style="border:1px solid #ccc; padding:6px;">الوصف</th><th style="border:1px solid #ccc; padding:6px;">التاريخ</th><th style="border:1px solid #ccc; padding:6px;">النوع</th></tr></thead>
            <tbody>${behaviorRows || '<tr><td colspan="3" style="text-align:center; padding:10px;">لا توجد بيانات</td></tr>'}</tbody>
         </table>
      </div>

      <table style="width: 100%; margin-top: 60px;">
         <tr>
             <!-- في HTML RTL، العمود الأول يظهر على اليمين -->
             <td style="text-align: center; width: 50%; vertical-align: top;">
                 <p style="font-weight: bold; margin-bottom: 40px;">المعلم(ة)</p>
                 <p style="font-weight: bold;">${teacherInfo?.name || '.........................'}</p>
             </td>
             <td style="text-align: center; width: 50%; vertical-align: top;">
                 <p style="font-weight: bold; margin-bottom: 40px;">مدير(ة) المدرسة</p>
                 <p>.........................</p>
             </td>
         </tr>
      </table>
    `;
    exportPDF(element, `تقرير_${student.name}.pdf`, setIsGeneratingPdf);
  };

  const handleGenerateSummons = async (grade: GradeRecord) => {
    setGeneratingSummonsId(grade.id);
    let emblemSrc = await getBase64Image('oman_logo.png') || await getBase64Image('icon.png');
    const todayDate = new Date();

    const element = document.createElement('div');
    element.setAttribute('dir', 'rtl');
    element.style.fontFamily = 'Tajawal, sans-serif';
    element.style.padding = '0';
    element.style.color = '#000';
    element.style.height = '100%';
    element.style.width = '100%';
    element.style.backgroundColor = 'white';
    
    // تصميم مطابق للصورة المرفقة للاستدعاء
    element.innerHTML = `
        <div style="border: 3px solid #000; padding: 25px; margin: 10px; height: 95%; position: relative;">
            
            <!-- Header -->
            <div style="border-bottom: 3px solid #000; padding-bottom: 10px; display: flex; justify-content: space-between; align-items: flex-start;">
                 <div style="text-align: left; font-size: 14px; font-weight: bold; line-height: 1.6;">
                    : اليوم ${new Date().toLocaleDateString('ar-EG', {weekday: 'long'})}<br/>
                    : التاريخ ${todayDate.toLocaleDateString('ar-EG')}
                 </div>
                 
                 <div style="text-align: center; font-size: 14px; font-weight: bold; line-height: 1.5;">
                    سلطنة عمان<br/>
                    وزارة التربية والتعليم<br/>
                    المديرية العامة للتربية والتعليم لمحافظة ${teacherInfo?.governorate}<br/>
                    مدرسة ${teacherInfo?.school}
                 </div>
            </div>

            <div style="text-align: center; margin-top: 25px;">
                <h2 style="text-decoration: underline; font-size: 26px; font-weight: bold; margin-bottom: 30px;">دعوة ولي الأمر لشأن يتعلق بالطالب</h2>
            </div>

            <div style="font-size: 18px; line-height: 1.8; padding: 0 10px; font-weight: 500;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <div><strong>الفاضل ولي أمر الطالب / ${student.name}</strong></div>
                    <div style="font-weight: bold;">المحترم</div>
                </div>

                <div style="margin-bottom: 30px;">
                    <strong>المقيد بالصف / ${student.classes[0]}</strong>
                </div>

                <div style="text-align: center; font-weight: bold; font-size: 20px; margin-bottom: 20px;">
                    السلام عليكم ورحمة الله وبركاته
                </div>

                <p style="margin-bottom: 15px;">نظرا لأهمية التعاون بين المدرسة وولي الأمر فيما يخدم مصلحة الطالب ويحقق له النجاح</p>

                <p style="margin-bottom: 20px;">نأمل حضوركم لبحث بعض الأمور المتعلقة بابنكم ولنا في حضوركم أمل بهدف تعاون البيت والمدرسة لتحقيق الرسالة التربوية الهادفة التي نسعى إليها وتأمل المدرسة حضوركم</p>

                <div style="margin: 30px 0; display: flex; gap: 10px;">
                    <strong>وذلك في يوم ................................ الموافق ................................</strong>
                </div>

                <div style="margin-bottom: 20px;">
                    <strong>ومراجعة الأستاذ / ${teacherInfo?.name}</strong>
                </div>
            </div>

            <!-- Reason Box -->
            <div style="border: 2px solid #000; border-radius: 15px; padding: 20px; margin: 30px 0; position: relative;">
                <div style="position: absolute; top: -15px; right: 20px; background: white; padding: 0 10px; font-weight: bold; font-size: 18px; text-decoration: underline;">
                    سبب الاستدعاء
                </div>
                <div style="padding-top: 10px; font-size: 18px;">
                    <p style="margin-bottom: 10px;">تدني المستوى التحصيلي في مادة ${grade.category}</p>
                    <p>الدرجة الحالية ${grade.score} من ${grade.maxScore}</p>
                </div>
            </div>

            <div style="text-align: center; font-weight: bold; font-size: 20px; margin: 40px 0;">
                شاكرين حسن تعاونكم معنا
            </div>

            <!-- Signatures: Teacher Right, Principal Left (Flex Row RTL) -->
            <div style="display: flex; justify-content: space-between; margin-top: 50px; padding: 0 20px;">
                <div style="text-align: center; width: 200px;">
                    <p style="font-weight: bold; margin-bottom: 60px;">المعلم / ة</p>
                    <p>${teacherInfo?.name}</p>
                </div>
                
                <div style="text-align: center; width: 200px;">
                    <p style="font-weight: bold; margin-bottom: 60px;">مدير / ة المدرسة</p>
                    <p>.........................</p>
                </div>
            </div>
        </div>
    `;
    exportPDF(element, `استدعاء_${student.name}.pdf`, (isLoading) => { if (!isLoading) setGeneratingSummonsId(null); });
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="space-y-6">
          <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col gap-6 relative">
            <div className="absolute top-6 left-6 flex gap-2">
                <button onClick={handleSaveReport} disabled={isGeneratingPdf} className="p-3 bg-gray-50 rounded-full hover:bg-gray-100 text-gray-600 transition-colors shadow-sm border border-gray-100">
                    {isGeneratingPdf ? <Loader2 className="w-5 h-5 animate-spin text-blue-600" /> : <FileText className="w-5 h-5" />}
                </button>
            </div>
            <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-[1.5rem] bg-blue-600 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-blue-100 overflow-hidden relative">
                    {student.avatar ? (
                        <img src={student.avatar} alt={student.name} className="w-full h-full object-cover" />
                    ) : (
                        student.name.charAt(0)
                    )}
                </div>
                <div><h1 className="text-sm font-black text-gray-900 mb-1">{student.name}</h1><span className="text-[9px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-black">الصف: {student.classes[0] || 'غير محدد'}</span></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-3xl flex flex-col items-center justify-center h-32">
                    <span className="text-[9px] font-black text-slate-400 mb-1">النتيجة النهائية</span>
                    <div className="flex items-baseline gap-1 mt-2" dir="ltr"><span className="text-4xl font-black text-slate-800 tracking-tighter">{finalPercentage}</span><span className="text-xs font-bold text-slate-400">%</span></div>
                </div>
                <div className={`${finalSymbol ? finalSymbol.bg : 'bg-gray-50'} border p-4 rounded-3xl flex flex-col items-center justify-center h-32`}>
                    <span className="text-[9px] font-black opacity-50 mb-1">المستوى</span>
                    {finalSymbol ? <><span className={`text-4xl font-black ${finalSymbol.color} mt-2`}>{finalSymbol.symbol}</span><span className={`text-[10px] font-bold ${finalSymbol.color} opacity-80 mt-1`}>{finalSymbol.desc}</span></> : <span className="text-2xl font-black text-gray-300">-</span>}
                </div>
            </div>
            
            {finalPercentage >= 90 && (
                <button onClick={handleGenerateCertificate} disabled={isGeneratingPdf} className="w-full bg-gradient-to-r from-amber-200 to-yellow-400 text-yellow-900 py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-yellow-100 active:scale-95 transition-all">
                    {isGeneratingPdf ? <Loader2 className="w-5 h-5 animate-spin"/> : <Medal className="w-5 h-5" />} إصدار شهادة تفوق
                </button>
            )}

            <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-100 flex flex-col items-center justify-center min-h-[80px]"><div className="flex items-center gap-1 mb-1"><Award className="w-3.5 h-3.5 text-emerald-600" /><span className="text-[9px] font-black text-emerald-800">نقاط إيجابية</span></div><span className="text-2xl font-black text-emerald-600">+{totalPositivePoints}</span></div>
                <div className="bg-rose-50 p-3 rounded-2xl border border-rose-100 flex flex-col items-center justify-center min-h-[80px]"><div className="flex items-center gap-1 mb-1"><AlertCircle className="w-3.5 h-3.5 text-rose-600" /><span className="text-[9px] font-black text-rose-800">نقاط سلبية</span></div><span className="text-2xl font-black text-rose-600">-{totalNegativePoints}</span></div>
            </div>

            {lowGradesForSummons.length > 0 && (
                <div className="bg-amber-50 border-2 border-amber-200 p-4 rounded-[2rem] animate-in slide-in-from-bottom duration-500">
                    <div className="flex items-center gap-2 mb-3"><div className="p-1.5 bg-amber-200 rounded-lg"><Mail className="w-3.5 h-3.5 text-amber-900" /></div><div><h3 className="text-xs font-black text-amber-900">إجراء إداري مطلوب</h3><p className="text-[9px] font-bold text-amber-700">درجة متدنية</p></div></div>
                    <div className="space-y-2">
                        {lowGradesForSummons.map(grade => (
                            <div key={grade.id} className="w-full bg-white p-3 rounded-xl border border-amber-100 flex items-center justify-between shadow-sm">
                                <div className="text-right"><span className="block text-[10px] font-black text-gray-800">{grade.category}</span><span className="text-[9px] font-bold text-rose-500">الدرجة: {grade.score}</span></div>
                                <button onClick={() => handleGenerateSummons(grade)} disabled={generatingSummonsId !== null} className="px-3 py-1.5 rounded-lg flex gap-1 items-center bg-amber-100 text-amber-700 hover:bg-amber-200"><span className="text-[9px] font-black">استدعاء</span><UserCheck className="w-3 h-3" /></button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {student.parentPhone && (
              <div className="flex gap-2 border-t border-gray-50 pt-4">
                <button onClick={handleWhatsAppClick} className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-50 text-emerald-700 rounded-2xl text-[10px] font-black active:scale-95 transition-all"><MessageCircle className="w-4 h-4"/> واتساب</button>
                <a href={`tel:${student.parentPhone}`} className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-50 text-blue-700 rounded-2xl text-[10px] font-black active:scale-95 transition-all"><PhoneCall className="w-4 h-4"/> اتصال</a>
              </div>
            )}
          </div>

          <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm">
            <div className="bg-gray-50/50 p-4 border-b border-gray-100 flex items-center gap-2"><Award className="w-4 h-4 text-blue-600" /><h3 className="font-black text-gray-800 text-[11px]">كشف السلوكيات ({currentSemester === '2' ? 'فصل 2' : 'فصل 1'})</h3></div>
            <div className="divide-y divide-gray-50">
              {behaviors.length > 0 ? behaviors.map(b => (
                <div key={b.id} className="p-4 flex items-center justify-between group hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${b.type === 'positive' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{b.type === 'positive' ? <Award className="w-4 h-4"/> : <AlertCircle className="w-4 h-4"/>}</div>
                    <div><span className="block text-[10px] font-black text-gray-800">{b.description}</span><div className="flex gap-2 mt-1"><span className="text-[9px] text-gray-400 font-bold">{new Date(b.date).toLocaleDateString('ar-EG')}</span><span className={`text-[9px] font-black ${b.type === 'positive' ? 'text-emerald-600' : 'text-rose-600'}`}>({b.points > 0 ? `+${b.points}` : b.points})</span></div></div>
                  </div>
                  {onUpdateStudent && <button onClick={() => handleDeleteBehavior(b.id)} className="p-2 text-gray-200 hover:text-rose-500 transition-colors"><Trash2 className="w-4 h-4" /></button>}
                </div>
              )) : <p className="p-8 text-center text-[10px] text-gray-400 font-bold">سجل السلوك نظيف</p>}
            </div>
          </div>
      </div>
    </div>
  );
};

export default StudentReport;
