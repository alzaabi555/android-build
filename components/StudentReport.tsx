
import React, { useState } from 'react';
import { Student, GradeRecord } from '../types';
import { Award, AlertCircle, MessageCircle, PhoneCall, Trash2, Loader2, Mail, UserCheck, FileText, Medal, XCircle, Calculator } from 'lucide-react';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';

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

  // --- Statistics Calculation (Fixed Cumulative Logic: Sem 1 + Sem 2) ---
  const sem1Grades = allGrades.filter(g => !g.semester || g.semester === '1');
  const sem2Grades = allGrades.filter(g => g.semester === '2');

  const calcStats = (grades: GradeRecord[]) => {
      const score = grades.reduce((acc, g) => acc + (Number(g.score) || 0), 0);
      const max = grades.reduce((acc, g) => acc + (Number(g.maxScore) || 0), 0);
      return { score, max };
  };

  const sem1Stats = calcStats(sem1Grades);
  const sem2Stats = calcStats(sem2Grades);

  // Cumulative Total (Sem 1 + Sem 2)
  const finalScore = sem1Stats.score + sem2Stats.score;
  const finalMax = sem1Stats.max + sem2Stats.max;
  
  // Calculate Percentage based on Cumulative Total - GUARD AGAINST NaN
  const finalPercentage = finalMax > 0 ? Math.round((finalScore / finalMax) * 100) : 0;

  // --- Official Grading Scale (90, 80, 65, 50) ---
  const getGradeSymbol = (percentage: number, maxScore: number) => {
    if (maxScore === 0) return { symbol: '-', desc: '-', color: 'text-slate-400 dark:text-white/40' };
    
    // Official Scale Logic
    if (percentage >= 90) return { symbol: 'أ', desc: 'ممتاز', color: 'text-emerald-600 dark:text-emerald-400' };
    if (percentage >= 80) return { symbol: 'ب', desc: 'جيد جداً', color: 'text-blue-600 dark:text-blue-400' };
    if (percentage >= 65) return { symbol: 'ج', desc: 'جيد', color: 'text-indigo-600 dark:text-indigo-400' };
    if (percentage >= 50) return { symbol: 'د', desc: 'مقبول', color: 'text-amber-600 dark:text-amber-400' };
    return { symbol: 'هـ', desc: 'يحتاج مساعدة', color: 'text-rose-600 dark:text-rose-400' };
  };

  const finalSymbol = getGradeSymbol(finalPercentage, finalMax);
  
  // Calculate Semester specific symbols for display
  const sem1Percentage = sem1Stats.max > 0 ? Math.round((sem1Stats.score / sem1Stats.max) * 100) : 0;
  const sem1Symbol = getGradeSymbol(sem1Percentage, sem1Stats.max);

  const sem2Percentage = sem2Stats.max > 0 ? Math.round((sem2Stats.score / sem2Stats.max) * 100) : 0;
  const sem2Symbol = getGradeSymbol(sem2Percentage, sem2Stats.max);

  // --- Summons Logic ---
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

      element.innerHTML = `
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;800&display=swap');
            @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap');
            @import url('https://fonts.googleapis.com/css2?family=Aref+Ruqaa:wght@400;700&display=swap');
            .cert-body { width: 100%; height: 100%; position: relative; background: #fff; overflow: hidden; display: flex; flex-direction: column; align-items: center; box-sizing: border-box; padding: 15mm; }
            .frame-border { position: absolute; top: 10mm; left: 10mm; right: 10mm; bottom: 10mm; border: 2px solid #0891b2; border-radius: 10px; z-index: 1; background: transparent; }
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
            .signatures-row { width: 100%; display: flex; justify-content: space-between; align-items: flex-end; padding: 0 40px 20px 40px; margin-top: 20px; }
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
                    <div class="sig-box"><div class="sig-title">المعلم</div><div class="sig-line">${teacherName}</div></div>
                    <div class="sig-box"><div class="sig-title">مدير المدرسة</div><div class="sig-line">.........................</div></div>
                </div>
            </div>
        </div>`;
      exportPDF(element, `شهادة_تفوق_${student.name}.pdf`, setIsGeneratingPdf, 'landscape');
  };

  const handleSaveReport = () => {
    // PDF Report Logic - Ensures Cumulative Data is Shown
    const element = document.createElement('div');
    element.setAttribute('dir', 'rtl');
    element.style.fontFamily = 'Tajawal, sans-serif';
    element.style.padding = '20px';
    element.style.color = '#000';

    const avatarHtml = student.avatar 
        ? `<img src="${student.avatar}" style="width: 70px; height: 70px; border-radius: 50%; object-fit: cover; border: 2px solid #eee; display: block; margin-left: 15px;" />` 
        : `<div style="width: 70px; height: 70px; border-radius: 50%; background: #eee; display: flex; align-items: center; justify-content: center; margin-left: 15px; font-weight: bold; font-size: 24px; color: #888;">${student.name.charAt(0)}</div>`;

    const behaviorRows = behaviors.map(b => `
        <tr>
            <td style="border:1px solid #ccc; padding:6px; font-size:12px;">${b.description}</td>
            <td style="border:1px solid #ccc; padding:6px; font-size:12px; text-align:center;">${new Date(b.date).toLocaleDateString('ar-EG')}</td>
            <td style="border:1px solid #ccc; padding:6px; font-size:12px; text-align:center; color:${b.type === 'positive' ? 'green' : 'red'}; font-weight:bold;">${b.type === 'positive' ? 'إيجابي' : 'سلبي'}</td>
        </tr>
    `).join('');

    // Use shared symbol logic for PDF as well
    const getSym = (p: number, max: number) => {
        const s = getGradeSymbol(p, max);
        return s.symbol === '-' ? '-' : s.symbol;
    };

    const s1Sym = getSym(sem1Percentage, sem1Stats.max);
    const s2Sym = getSym(sem2Percentage, sem2Stats.max);
    const finalSym = getSym(finalPercentage, finalMax);
    const governorateLine = teacherInfo?.governorate ? `المديرية العامة للتربية والتعليم لمحافظة ${teacherInfo.governorate}` : '';

    element.innerHTML = `
      <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 15px;">
        <div style="font-size:12px; font-weight:bold; margin-bottom:5px;">سلطنة عمان<br/>وزارة التربية والتعليم<br/>${governorateLine}</div>
        <h1 style="margin: 10px 0; font-size: 24px;">تقرير الطالب الدراسي والسلوكي</h1>
        <p style="margin: 8px 0 0; font-size: 18px; color: #000; font-weight: bold;">مدرسة  ${teacherInfo?.school || '................'}</p>
        ${teacherInfo?.subject ? `<p style="margin: 5px 0 0; font-size: 14px; color: #555;">المادة: ${teacherInfo.subject}</p>` : ''}
        <p style="margin: 5px 0 0; font-size: 14px; color: #555;">تاريخ التقرير  <span dir="ltr">${new Date().toLocaleDateString('ar-EG')}</span></p>
      </div>
      <div style="background: #f9fafb; padding: 15px; border-radius: 12px; margin-bottom: 20px; border: 1px solid #e5e7eb; display: flex; align-items: center;">
         ${avatarHtml}
         <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding:6px; font-weight:bold; width: 100px;">اسم الطالب:</td><td style="padding:6px; font-size: 16px;">${student.name}</td></tr>
            <tr><td style="padding:6px; font-weight:bold;">الصف:</td><td style="padding:6px;">${student.classes[0] || '-'}</td></tr>
         </table>
      </div>
      <div style="margin-bottom: 20px;">
         <h3 style="border-bottom: 1px solid #333; padding-bottom: 5px;">ملخص النتائج</h3>
         <table style="width: 100%; border-collapse: collapse; text-align: center; border: 1px solid #ccc; margin-top: 10px;">
            <tr style="background: #f0f0f0;"><th>الفصل 1</th><th>الفصل 2</th><th>المجموع التراكمي</th><th>النتيجة النهائية</th></tr>
            <tr>
                <td style="padding:10px; border:1px solid #ccc;">${sem1Stats.score} <span style="font-size:10px; color:#666">(${s1Sym})</span></td>
                <td style="padding:10px; border:1px solid #ccc;">${sem2Stats.score} <span style="font-size:10px; color:#666">(${s2Sym})</span></td>
                <td style="padding:10px; border:1px solid #ccc;">${finalScore} / ${finalMax}</td>
                <td style="padding:10px; border:1px solid #ccc; background:#f0f9ff; font-weight:bold;">${finalPercentage}% <span style="color:#000">(${finalSym})</span></td>
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
             <td style="text-align: center; width: 50%; vertical-align: top;"><p style="font-weight: bold; margin-bottom: 40px;">المعلم(ة)</p><p style="font-weight: bold;">${teacherInfo?.name || '.........................'}</p></td>
             <td style="text-align: center; width: 50%; vertical-align: top;"><p style="font-weight: bold; margin-bottom: 40px;">مدير(ة) المدرسة</p><p>.........................</p></td>
         </tr>
      </table>`;
    exportPDF(element, `تقرير_${student.name}.pdf`, setIsGeneratingPdf);
  };

  const handleGenerateSummons = async (grade: GradeRecord) => {
    setGeneratingSummonsId(grade.id);
    let emblemSrc = await getBase64Image('oman_logo.png') || await getBase64Image('icon.png');
    const todayDate = new Date();
    const governorateLine = teacherInfo?.governorate || '...............';

    const element = document.createElement('div');
    element.setAttribute('dir', 'rtl');
    element.style.fontFamily = 'Tajawal, sans-serif';
    element.style.padding = '0';
    element.style.color = '#000';
    element.style.height = '100%';
    element.style.width = '100%';
    element.style.backgroundColor = 'white';
    
    element.innerHTML = `
        <div style="border: 3px solid #000; padding: 25px; margin: 10px; height: 95%; position: relative;">
            <div style="border-bottom: 3px solid #000; padding-bottom: 10px; display: flex; justify-content: space-between; align-items: flex-start;">
                 <div style="text-align: left; font-size: 14px; font-weight: bold; line-height: 1.6;">: اليوم ${new Date().toLocaleDateString('ar-EG', {weekday: 'long'})}<br/>: التاريخ ${todayDate.toLocaleDateString('ar-EG')}</div>
                 <div style="text-align: center; font-size: 14px; font-weight: bold; line-height: 1.5;">سلطنة عمان<br/>وزارة التربية والتعليم<br/>المديرية العامة للتربية والتعليم لمحافظة ${governorateLine}<br/>مدرسة ${teacherInfo?.school}</div>
            </div>
            <div style="text-align: center; margin-top: 25px;"><h2 style="text-decoration: underline; font-size: 26px; font-weight: bold; margin-bottom: 30px;">دعوة ولي الأمر لشأن يتعلق بالطالب</h2></div>
            <div style="font-size: 18px; line-height: 1.8; padding: 0 10px; font-weight: 500;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;"><div><strong>الفاضل ولي أمر الطالب / ${student.name}</strong></div><div style="font-weight: bold;">المحترم</div></div>
                <div style="margin-bottom: 30px;"><strong>المقيد بالصف / ${student.classes[0]}</strong></div>
                <div style="text-align: center; font-weight: bold; font-size: 20px; margin-bottom: 20px;">السلام عليكم ورحمة الله وبركاته</div>
                <p style="margin-bottom: 15px;">نظرا لأهمية التعاون بين المدرسة وولي الأمر فيما يخدم مصلحة الطالب ويحقق له النجاح</p>
                <p style="margin-bottom: 20px;">نأمل حضوركم لبحث بعض الأمور المتعلقة بابنكم...</p>
                <div style="margin: 30px 0; display: flex; gap: 10px;"><strong>وذلك في يوم ................................ الموافق ................................</strong></div>
                <div style="margin-bottom: 20px;"><strong>ومراجعة الأستاذ / ${teacherInfo?.name}</strong></div>
            </div>
            <div style="border: 2px solid #000; border-radius: 15px; padding: 20px; margin: 30px 0; position: relative;">
                <div style="position: absolute; top: -15px; right: 20px; background: white; padding: 0 10px; font-weight: bold; font-size: 18px; text-decoration: underline;">سبب الاستدعاء</div>
                <div style="padding-top: 10px; font-size: 18px;"><p style="margin-bottom: 10px;">تدني المستوى التحصيلي في مادة ${grade.category}</p><p>الدرجة الحالية ${grade.score} من ${grade.maxScore}</p></div>
            </div>
            <div style="text-align: center; font-weight: bold; font-size: 20px; margin: 40px 0;">شاكرين حسن تعاونكم معنا</div>
            <div style="display: flex; justify-content: space-between; margin-top: 50px; padding: 0 20px;">
                <div style="text-align: center; width: 200px;"><p style="font-weight: bold; margin-bottom: 60px;">المعلم / ة</p><p>${teacherInfo?.name}</p></div>
                <div style="text-align: center; width: 200px;"><p style="font-weight: bold; margin-bottom: 60px;">مدير / ة المدرسة</p><p>.........................</p></div>
            </div>
        </div>`;
    exportPDF(element, `استدعاء_${student.name}.pdf`, (isLoading) => { if (!isLoading) setGeneratingSummonsId(null); });
  };

  const handleWhatsAppWithPDF = async () => {
      if (!student.parentPhone) {
          alert('لا يوجد رقم هاتف مسجل لولي الأمر');
          return;
      }
      let cleanPhone = student.parentPhone.replace(/[^0-9]/g, '');
      if (!cleanPhone || cleanPhone.length < 5) {
           alert('رقم الهاتف غير صحيح');
           return;
      }
      if (cleanPhone.startsWith('00')) cleanPhone = cleanPhone.substring(2);
      if (cleanPhone.length === 8) {
           cleanPhone = '968' + cleanPhone;
      } else if (cleanPhone.length === 9 && cleanPhone.startsWith('0')) {
           cleanPhone = '968' + cleanPhone.substring(1);
      }
      handleSaveReport();
      const msg = encodeURIComponent(`السلام عليكم، مرفق لكم تقرير الطالب ${student.name}.`);
      const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${msg}`;
      setTimeout(async () => {
           try {
              await Browser.open({ url: url });
          } catch (e) {
              window.open(url, '_blank');
          }
      }, 2500); 
  };

  // --- Styles Constants (Clean White UI) ---
  // Pure white/dark backgrounds, no conditional coloring
  const cardStyle = "bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 shadow-sm rounded-[2rem] backdrop-blur-md";
  const innerCardStyle = "bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl";

  return (
    <div className="space-y-6 pb-20 text-slate-900 dark:text-white">
      <div className="space-y-6">
          {/* Main Student Card */}
          <div className={`p-6 flex flex-col gap-6 relative ${cardStyle}`}>
            
            <div className="flex flex-row items-start justify-between w-full">
                {/* Student Info */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-700 dark:text-white font-black text-2xl shadow-inner overflow-hidden relative shrink-0 border border-gray-200 dark:border-white/10">
                        {student.avatar ? (
                            <img src={student.avatar} alt={student.name} className="w-full h-full object-cover" />
                        ) : (
                            student.name.charAt(0)
                        )}
                    </div>
                    <div className="flex flex-col min-w-0">
                        <h1 className="text-lg font-black text-slate-900 dark:text-white mb-1 truncate">{student.name}</h1>
                        <span className="text-[10px] bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-white/70 px-3 py-1 rounded-full font-bold w-fit">الصف: {student.classes[0] || 'غير محدد'}</span>
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex flex-row gap-3 flex-shrink-0 mr-4">
                    <button 
                        onClick={handleSaveReport} 
                        disabled={isGeneratingPdf} 
                        className="p-3 bg-slate-50 dark:bg-white/10 rounded-full hover:bg-slate-100 dark:hover:bg-white/20 text-slate-600 dark:text-white transition-colors shadow-sm border border-gray-200 dark:border-white/10 flex items-center justify-center"
                        title="حفظ كـ PDF"
                    >
                        {isGeneratingPdf ? <Loader2 className="w-5 h-5 animate-spin text-blue-500" /> : <FileText className="w-5 h-5" />}
                    </button>

                    <button 
                        onClick={handleWhatsAppWithPDF}
                        disabled={isGeneratingPdf}
                        className="p-3 bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-500/30 transition-colors shadow-sm border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center"
                        title="إرسال التقرير عبر واتساب"
                    >
                        <MessageCircle className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Stats Grid - Revised for Cumulative Logic & Clean UI */}
            <div className="grid grid-cols-2 gap-3">
                {/* Final Total (Cumulative) */}
                <div className={`p-4 flex flex-col items-center justify-center h-32 col-span-1 ${innerCardStyle}`}>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-white/40 mb-1 flex items-center gap-1"><Calculator className="w-3 h-3"/> المجموع التراكمي</span>
                    <div className="flex flex-col items-center mt-1">
                        <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{finalScore}</span>
                        <span className="text-xs font-bold text-slate-400 dark:text-white/40">من {finalMax}</span>
                    </div>
                </div>

                {/* Final Level */}
                <div className={`p-4 flex flex-col items-center justify-center h-32 col-span-1 ${innerCardStyle}`}>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-white/40 mb-1">المستوى العام</span>
                    {finalSymbol.symbol !== '-' ? (
                        <>
                            <span className={`text-4xl font-black mt-2 ${finalSymbol.color}`}>{finalSymbol.symbol}</span>
                            <span className={`text-[10px] font-bold opacity-80 mt-1 ${finalSymbol.color}`}>{finalSymbol.desc}</span>
                        </>
                    ) : (
                        <span className="text-2xl font-black text-slate-300 dark:text-white/20">-</span>
                    )}
                </div>

                {/* Sem 1 Breakdown */}
                <div className={`p-3 flex items-center justify-between ${innerCardStyle}`}>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-white/60">الفصل الأول</span>
                    <div className="text-right">
                        <span className="block text-sm font-black text-slate-900 dark:text-white">{sem1Stats.score} <span className="text-[10px] text-slate-400">/ {sem1Stats.max}</span></span>
                        <span className={`text-[10px] font-black ${sem1Symbol.color}`}>{sem1Symbol.symbol} - {sem1Symbol.desc}</span>
                    </div>
                </div>

                {/* Sem 2 Breakdown */}
                <div className={`p-3 flex items-center justify-between ${innerCardStyle}`}>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-white/60">الفصل الثاني</span>
                    <div className="text-right">
                        <span className="block text-sm font-black text-slate-900 dark:text-white">{sem2Stats.score} <span className="text-[10px] text-slate-400">/ {sem2Stats.max}</span></span>
                        <span className={`text-[10px] font-black ${sem2Symbol.color}`}>{sem2Symbol.symbol} - {sem2Symbol.desc}</span>
                    </div>
                </div>
            </div>
            
            {finalPercentage >= 90 && (
                <button onClick={handleGenerateCertificate} disabled={isGeneratingPdf} className="w-full bg-gradient-to-r from-amber-400 to-yellow-500 text-white py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30 active:scale-95 transition-all">
                    {isGeneratingPdf ? <Loader2 className="w-5 h-5 animate-spin"/> : <Medal className="w-5 h-5" />} إصدار شهادة تفوق
                </button>
            )}

            <div className="grid grid-cols-2 gap-3">
                <div className={`p-3 flex flex-col items-center justify-center min-h-[80px] ${innerCardStyle}`}>
                    <div className="flex items-center gap-1 mb-1">
                        <Award className="w-4 h-4 text-emerald-500" />
                        <span className="text-[10px] font-bold text-slate-500 dark:text-white/60">نقاط إيجابية</span>
                    </div>
                    <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">+{totalPositivePoints}</span>
                </div>
                <div className={`p-3 flex flex-col items-center justify-center min-h-[80px] ${innerCardStyle}`}>
                    <div className="flex items-center gap-1 mb-1">
                        <AlertCircle className="w-4 h-4 text-rose-500" />
                        <span className="text-[10px] font-bold text-slate-500 dark:text-white/60">نقاط سلبية</span>
                    </div>
                    <span className="text-2xl font-black text-rose-600 dark:text-rose-400">-{totalNegativePoints}</span>
                </div>
            </div>

            {lowGradesForSummons.length > 0 && (
                <div className={`p-4 ${innerCardStyle} border-l-4 border-l-amber-400`}>
                    <div className="flex items-center gap-2 mb-3">
                        <div className="p-1.5 bg-amber-100 dark:bg-amber-500/20 rounded-lg text-amber-600 dark:text-amber-400">
                            <Mail className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="text-xs font-black text-slate-800 dark:text-white">إجراء إداري مطلوب</h3>
                            <p className="text-[10px] font-bold text-slate-500 dark:text-white/60">درجة متدنية</p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        {lowGradesForSummons.map(grade => (
                            <div key={grade.id} className="w-full bg-white dark:bg-white/5 p-3 rounded-xl border border-gray-200 dark:border-white/10 flex items-center justify-between shadow-sm">
                                <div className="text-right">
                                    <span className="block text-[10px] font-black text-slate-800 dark:text-white">{grade.category}</span>
                                    <span className="text-[9px] font-bold text-rose-500">الدرجة: {grade.score}</span>
                                </div>
                                <button onClick={() => handleGenerateSummons(grade)} disabled={generatingSummonsId !== null} className="px-3 py-1.5 rounded-lg flex gap-1 items-center bg-amber-50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-500/30 border border-amber-200 dark:border-amber-500/20 transition-colors">
                                    <span className="text-[9px] font-black">استدعاء</span>
                                    <UserCheck className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {student.parentPhone && (
              <div className="flex gap-2 border-t border-gray-100 dark:border-white/10 pt-4">
                <button onClick={handleWhatsAppWithPDF} className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-500/20 rounded-xl text-[10px] font-black active:scale-95 transition-all hover:bg-emerald-100 dark:hover:bg-emerald-500/20">
                    <MessageCircle className="w-4 h-4"/> إرسال التقرير
                </button>
                <a href={`tel:${student.parentPhone}`} className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-500/20 rounded-xl text-[10px] font-black active:scale-95 transition-all hover:bg-blue-100 dark:hover:bg-blue-500/20">
                    <PhoneCall className="w-4 h-4"/> اتصال
                </a>
              </div>
            )}
          </div>

          {/* Behavior List - Standard Card */}
          <div className={`${cardStyle} overflow-hidden`}>
            <div className="bg-gray-50 dark:bg-white/5 p-4 border-b border-gray-100 dark:border-white/10 flex items-center gap-2">
                <Award className="w-4 h-4 text-blue-500" />
                <h3 className="font-black text-slate-800 dark:text-white text-[11px]">كشف السلوكيات ({currentSemester === '2' ? 'فصل 2' : 'فصل 1'})</h3>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-white/5">
              {behaviors.length > 0 ? behaviors.map(b => (
                <div key={b.id} className="p-4 flex items-center justify-between group hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${b.type === 'positive' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400'}`}>
                        {b.type === 'positive' ? <Award className="w-4 h-4"/> : <AlertCircle className="w-4 h-4"/>}
                    </div>
                    <div>
                        <span className="block text-[10px] font-black text-slate-800 dark:text-white">{b.description}</span>
                        <div className="flex gap-2 mt-1">
                            <span className="text-[9px] text-slate-400 dark:text-white/40 font-bold">{new Date(b.date).toLocaleDateString('ar-EG')}</span>
                            <span className={`text-[9px] font-black ${b.type === 'positive' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>({b.points > 0 ? `+${b.points}` : b.points})</span>
                        </div>
                    </div>
                  </div>
                  {onUpdateStudent && <button onClick={() => handleDeleteBehavior(b.id)} className="p-2 text-slate-300 dark:text-white/20 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"><Trash2 className="w-4 h-4" /></button>}
                </div>
              )) : <p className="p-8 text-center text-[10px] text-slate-400 dark:text-white/30 font-bold">سجل السلوك نظيف</p>}
            </div>
          </div>
      </div>
    </div>
  );
};

export default StudentReport;
