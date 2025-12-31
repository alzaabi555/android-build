
import React, { useState } from 'react';
import { Student, GradeRecord } from '../types';
import { Award, AlertCircle, MessageCircle, PhoneCall, Trash2, Loader2, Mail, UserCheck, FileText, Medal, Calculator, FileWarning, GraduationCap, LayoutList } from 'lucide-react';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { useApp } from '../context/AppContext';

declare var html2pdf: any;

interface StudentReportProps {
  student: Student;
  onUpdateStudent?: (s: Student) => void;
  currentSemester?: '1' | '2';
  teacherInfo?: { name: string; school: string; subject: string; governorate: string };
}

const StudentReport: React.FC<StudentReportProps> = ({ student, onUpdateStudent, currentSemester, teacherInfo }) => {
  const { assessmentTools } = useApp();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  
  const behaviors = (student.behaviors || []).filter(b => !b.semester || b.semester === (currentSemester || '1'));
  const allGrades = student.grades || [];

  const totalPositivePoints = behaviors.filter(b => b.type === 'positive').reduce((acc, b) => acc + b.points, 0);
  const totalNegativePoints = behaviors.filter(b => b.type === 'negative').reduce((acc, b) => acc + Math.abs(b.points), 0);

  const sem1Grades = allGrades.filter(g => !g.semester || g.semester === '1');
  const sem2Grades = allGrades.filter(g => g.semester === '2');

  // Grades for CURRENT selected semester (for display list)
  const currentSemesterGrades = currentSemester === '2' ? sem2Grades : sem1Grades;

  const calcStats = (grades: GradeRecord[]) => {
      let score = 0;
      grades.forEach(g => {
          score += Number(g.score) || 0;
      });
      return { score };
  };

  const sem1Stats = calcStats(sem1Grades);
  const sem2Stats = calcStats(sem2Grades);

  // Cumulative Total
  const finalScore = sem1Stats.score + sem2Stats.score;

  // --- Grade Symbol Logic ---
  const getGradeSymbol = (score: number) => {
      if (score >= 90) return 'أ';
      if (score >= 80) return 'ب';
      if (score >= 65) return 'ج';
      if (score >= 50) return 'د';
      return 'هـ';
  };

  const getSymbolColor = (score: number) => {
      if (score >= 90) return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/20';
      if (score >= 80) return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/20';
      if (score >= 65) return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/20';
      if (score >= 50) return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/20';
      return 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/20';
  };

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

  const handleGenerateSummons = async () => {
      setIsGeneratingPdf(true);
      const schoolName = teacherInfo?.school || '...................';
      const teacherName = teacherInfo?.name || '...................';
      const governorate = teacherInfo?.governorate || '...............';
      let emblemSrc = await getBase64Image('oman_logo.png') || await getBase64Image('icon.png');

      const element = document.createElement('div');
      element.setAttribute('dir', 'rtl');
      element.style.fontFamily = 'Amiri, serif'; 
      element.style.padding = '0';
      element.style.width = '210mm';
      element.style.height = '297mm';
      element.style.backgroundColor = '#fff';
      
      const date = new Date().toLocaleDateString('ar-EG');

      element.innerHTML = `
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700&display=swap');
            @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap');
            .page-container { padding: 20mm; color: #000; font-family: 'Amiri', serif; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 15px; }
            .logo { height: 70px; margin-bottom: 10px; }
            .ministry { font-size: 14px; font-weight: bold; line-height: 1.6; }
            .title { text-align: center; font-size: 24px; font-weight: bold; margin: 30px 0; text-decoration: underline; }
            .content { font-size: 18px; line-height: 2.2; text-align: justify; margin-bottom: 50px; }
            .footer { margin-top: 50px; display: flex; justify-content: space-between; padding: 0 20px; }
            .sign-box { text-align: center; width: 200px; }
            .bold { font-weight: bold; }
            .dashed { border-bottom: 1px dashed #000; display: inline-block; min-width: 150px; text-align: center; }
        </style>
        <div class="page-container">
            <div class="header">
                ${emblemSrc ? `<img src="${emblemSrc}" class="logo" />` : ''}
                <div class="ministry">سلطنة عمان<br/>وزارة التربية والتعليم<br/>المديرية العامة للتربية والتعليم لمحافظة ${governorate}<br/>مدرسة ${schoolName}</div>
            </div>
            
            <div class="title">استدعاء ولي أمر طالب</div>
            
            <div class="content">
                <p>
                    المكرم ولي أمر الطالب / <span class="bold">${student.name}</span> المحترم<br/>
                    بالصف: <span class="bold">${student.classes[0] || '....'}</span>
                </p>
                <p>السلام عليكم ورحمة الله وبركاته،،،</p>
                <p>
                    نرجو تكرمكم بالحضور إلى المدرسة يوم ............... الموافق ...../...../..........م
                    الساعة ............... صباحاً.
                </p>
                <p>
                    وذلك لمقابلة إدارة المدرسة / معلم المادة لمناقشة:
                    <br/>
                    ( &nbsp;&nbsp; ) المستوى التحصيلي للطالب.
                    <br/>
                    ( &nbsp;&nbsp; ) المستوى السلوكي للطالب.
                    <br/>
                    ( &nbsp;&nbsp; ) أسباب غياب الطالب المتكرر.
                    <br/>
                    ( &nbsp;&nbsp; ) أخرى: ............................................................
                </p>
                <p>شاكرين لكم حسن تعاونكم واهتمامكم لما فيه مصلحة الطالب.</p>
            </div>

            <div class="footer">
                <div class="sign-box">
                    <p class="bold">معلم المادة</p>
                    <p>${teacherName}</p>
                </div>
                <div class="sign-box">
                    <p class="bold">إدارة المدرسة</p>
                    <p>.......................</p>
                </div>
            </div>
            
            <div style="margin-top: 80px; border-top: 1px dashed #000; padding-top: 20px; font-size: 14px;">
                <p style="text-align: center; font-weight: bold;">إقرار ولي الأمر</p>
                <p>أنا الموقع أدناه ولي أمر الطالب المذكور أعلاه، أقر بأنني استلمت خطاب الاستدعاء وسأقوم بمراجعة المدرسة في الموعد المحدد.</p>
                <p style="margin-top: 20px;">التوقيع: ........................................... التاريخ: ......................</p>
            </div>
        </div>
      `;
      exportPDF(element, `استدعاء_ولي_أمر_${student.name}.pdf`, setIsGeneratingPdf, 'portrait');
  };

  const handleSaveReport = () => {
    const element = document.createElement('div');
    element.setAttribute('dir', 'rtl');
    element.style.fontFamily = 'Tajawal, sans-serif';
    element.style.padding = '20px';
    element.style.color = '#000000'; // Force strict black
    element.style.backgroundColor = '#ffffff'; // Force white background

    const avatarHtml = student.avatar 
        ? `<img src="${student.avatar}" style="width: 70px; height: 70px; border-radius: 50%; object-fit: cover; border: 2px solid #eee; display: block; margin-left: 15px;" />` 
        : `<div style="width: 70px; height: 70px; border-radius: 50%; background: #eee; display: flex; align-items: center; justify-content: center; margin-left: 15px; font-weight: bold; font-size: 24px; color: #888;">${student.name.charAt(0)}</div>`;

    const cellStyle = "border:1px solid #000000 !important; padding:6px; font-size:12px; color: #000000 !important;";

    // Behavior Rows
    const behaviorRows = behaviors.map(b => `
        <tr>
            <td style="${cellStyle}">${b.description}</td>
            <td style="${cellStyle}; text-align:center;">${new Date(b.date).toLocaleDateString('ar-EG')}</td>
            <td style="${cellStyle}; text-align:center; color:${b.type === 'positive' ? 'green' : 'red'} !important; font-weight:bold;">${b.type === 'positive' ? 'إيجابي' : 'سلبي'}</td>
        </tr>
    `).join('');

    // Grades Rows (Current Semester)
    const gradesRows = currentSemesterGrades.map(g => `
        <tr>
            <td style="${cellStyle}">${g.category}</td>
            <td style="${cellStyle}; text-align:center; font-weight:bold;">${g.score}</td>
            <td style="${cellStyle}; text-align:center;">${new Date(g.date).toLocaleDateString('ar-EG')}</td>
        </tr>
    `).join('');

    const governorateLine = teacherInfo?.governorate ? `المديرية العامة للتربية والتعليم لمحافظة ${teacherInfo.governorate}` : '';

    element.innerHTML = `
      <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000000; padding-bottom: 15px; color: #000000 !important;">
        <div style="font-size:12px; font-weight:bold; margin-bottom:5px;">سلطنة عمان<br/>وزارة التربية والتعليم<br/>${governorateLine}</div>
        <h1 style="margin: 10px 0; font-size: 24px; font-weight: bold;">تقرير الطالب الدراسي والسلوكي</h1>
        <p style="margin: 8px 0 0; font-size: 18px; color: #000000; font-weight: bold;">مدرسة  ${teacherInfo?.school || '................'}</p>
        ${teacherInfo?.subject ? `<p style="margin: 5px 0 0; font-size: 14px; color: #000000;">المادة: ${teacherInfo.subject}</p>` : ''}
        <p style="margin: 5px 0 0; font-size: 14px; color: #000000;">تاريخ التقرير  <span dir="ltr">${new Date().toLocaleDateString('ar-EG')}</span></p>
      </div>
      <div style="background: #f9fafb; padding: 15px; border-radius: 12px; margin-bottom: 20px; border: 1px solid #e5e7eb; display: flex; align-items: center; color: #000000 !important;">
         ${avatarHtml}
         <table style="width: 100%; border-collapse: collapse; color: #000000 !important;">
            <tr><td style="padding:6px; font-weight:bold; width: 100px;">اسم الطالب:</td><td style="padding:6px; font-size: 16px;">${student.name}</td></tr>
            <tr><td style="padding:6px; font-weight:bold;">الصف:</td><td style="padding:6px;">${student.classes[0] || '-'}</td></tr>
         </table>
      </div>
      
      <!-- Academic Summary -->
      <div style="margin-bottom: 20px; color: #000000 !important;">
         <h3 style="border-bottom: 1px solid #000000; padding-bottom: 5px; font-weight: bold;">الملخص الدراسي</h3>
         <table style="width: 100%; border-collapse: collapse; text-align: center; border: 1px solid #000000 !important; margin-top: 10px; color: #000000 !important;">
            <tr style="background: #f0f0f0;">
                <th style="${cellStyle}">الفصل 1</th>
                <th style="${cellStyle}">الفصل 2</th>
                <th style="${cellStyle}">المجموع التراكمي</th>
                <th style="${cellStyle}">الرمز</th>
            </tr>
            <tr>
                <td style="${cellStyle}">${sem1Stats.score}</td>
                <td style="${cellStyle}">${sem2Stats.score}</td>
                <td style="${cellStyle}; background:#f0f9ff; font-weight:bold;">${finalScore}</td>
                <td style="${cellStyle}; font-weight:bold;">${getGradeSymbol(finalScore)}</td>
            </tr>
         </table>
      </div>

      <!-- Detailed Grades Section (New) -->
      <div style="margin-bottom: 20px; color: #000000 !important;">
         <h3 style="border-bottom: 1px solid #000000; padding-bottom: 5px; font-weight: bold;">تفاصيل الدرجات (فصل ${currentSemester || '1'})</h3>
         <table style="width: 100%; border-collapse: collapse; margin-top: 10px; color: #000000 !important;">
            <thead>
                <tr style="background:#e5e7eb;">
                    <th style="${cellStyle}">أداة التقويم</th>
                    <th style="${cellStyle}; width: 80px;">الدرجة</th>
                    <th style="${cellStyle}; width: 100px;">التاريخ</th>
                </tr>
            </thead>
            <tbody>${gradesRows || `<tr><td colspan="3" style="${cellStyle}; text-align:center; padding:10px;">لا توجد درجات مرصودة لهذا الفصل</td></tr>`}</tbody>
         </table>
      </div>

      <!-- Behavior Section -->
      <div style="margin-bottom: 20px; color: #000000 !important;">
         <h3 style="border-bottom: 1px solid #000000; padding-bottom: 5px; font-weight: bold;">سجل السلوك</h3>
         <table style="width: 100%; border-collapse: collapse; margin-top: 10px; color: #000000 !important;">
            <thead>
                <tr style="background:#e5e7eb;">
                    <th style="${cellStyle}">الوصف</th>
                    <th style="${cellStyle}">التاريخ</th>
                    <th style="${cellStyle}">النوع</th>
                </tr>
            </thead>
            <tbody>${behaviorRows || `<tr><td colspan="3" style="${cellStyle}; text-align:center; padding:10px;">سجل السلوك نظيف</td></tr>`}</tbody>
         </table>
      </div>

      <table style="width: 100%; margin-top: 60px; color: #000000 !important;">
         <tr>
             <td style="text-align: center; width: 50%; vertical-align: top;"><p style="font-weight: bold; margin-bottom: 40px;">المعلم(ة)</p><p style="font-weight: bold;">${teacherInfo?.name || '.........................'}</p></td>
             <td style="text-align: center; width: 50%; vertical-align: top;"><p style="font-weight: bold; margin-bottom: 40px;">مدير(ة) المدرسة</p><p>.........................</p></td>
         </tr>
      </table>`;
    exportPDF(element, `تقرير_${student.name}.pdf`, setIsGeneratingPdf);
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
      
      const msg = encodeURIComponent(`السلام عليكم، مرفق لكم تقرير الطالب ${student.name}.`);
      
      const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${msg}`;
      
      if (Capacitor.isNativePlatform()) {
          try {
              await Browser.open({ url: `whatsapp://send?phone=${cleanPhone}&text=${msg}` });
          } catch {
              await Browser.open({ url });
          }
      } else {
          window.open(url, '_blank');
      }
  };

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
                <div className={`p-4 flex flex-col items-center justify-center h-32 col-span-2 ${innerCardStyle}`}>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-white/40 mb-1 flex items-center gap-1"><Calculator className="w-3 h-3"/> المجموع التراكمي</span>
                    <div className="flex items-center gap-3 mt-1">
                        <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{finalScore}</span>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg ${getSymbolColor(finalScore)}`}>
                            {getGradeSymbol(finalScore)}
                        </div>
                    </div>
                </div>

                {/* Sem 1 Breakdown */}
                <div className={`p-3 flex items-center justify-between ${innerCardStyle}`}>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-white/60">الفصل الأول</span>
                    <div className="text-right flex items-center gap-2">
                        <span className="block text-sm font-black text-slate-900 dark:text-white">{sem1Stats.score}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${getSymbolColor(sem1Stats.score)}`}>{getGradeSymbol(sem1Stats.score)}</span>
                    </div>
                </div>

                {/* Sem 2 Breakdown */}
                <div className={`p-3 flex items-center justify-between ${innerCardStyle}`}>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-white/60">الفصل الثاني</span>
                    <div className="text-right flex items-center gap-2">
                        <span className="block text-sm font-black text-slate-900 dark:text-white">{sem2Stats.score}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${getSymbolColor(sem2Stats.score)}`}>{getGradeSymbol(sem2Stats.score)}</span>
                    </div>
                </div>
            </div>
            
            <div className="space-y-2">
                <button onClick={handleGenerateCertificate} disabled={isGeneratingPdf} className="w-full bg-gradient-to-r from-amber-400 to-yellow-500 text-white py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30 active:scale-95 transition-all">
                    {isGeneratingPdf ? <Loader2 className="w-5 h-5 animate-spin"/> : <Medal className="w-5 h-5" />} إصدار شهادة تفوق
                </button>
                <button onClick={handleGenerateSummons} disabled={isGeneratingPdf} className="w-full bg-gradient-to-r from-rose-500 to-red-600 text-white py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-500/30 active:scale-95 transition-all">
                    {isGeneratingPdf ? <Loader2 className="w-5 h-5 animate-spin"/> : <FileWarning className="w-5 h-5" />} استدعاء ولي أمر
                </button>
            </div>

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

          {/* Academic Record List (NEW SECTION) */}
          <div className={`${cardStyle} overflow-hidden`}>
            <div className="bg-gray-50 dark:bg-white/5 p-4 border-b border-gray-100 dark:border-white/10 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-indigo-500" />
                <h3 className="font-black text-slate-800 dark:text-white text-[11px]">السجل الأكاديمي ({currentSemester === '2' ? 'فصل 2' : 'فصل 1'})</h3>
            </div>
            <div className="p-3">
                <div className="grid grid-cols-2 gap-2">
                    {currentSemesterGrades.length > 0 ? currentSemesterGrades.map(g => (
                        <div key={g.id} className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-xl p-3 flex flex-col justify-between relative overflow-hidden group">
                            <span className="text-[10px] font-bold text-slate-500 dark:text-white/60 mb-1">{g.category}</span>
                            <div className="flex items-end justify-between">
                                <span className={`text-lg font-black ${getSymbolColor(g.score)} bg-transparent p-0`}>{g.score}</span>
                                <span className="text-[8px] text-slate-300 dark:text-white/20">{new Date(g.date).toLocaleDateString('en-GB', {day:'numeric', month:'numeric'})}</span>
                            </div>
                            <div className={`absolute bottom-0 left-0 h-1 w-full opacity-20 ${getSymbolColor(g.score).split(' ')[2]}`}></div>
                        </div>
                    )) : (
                        <div className="col-span-2 text-center py-6 text-[10px] text-slate-400 dark:text-white/30 font-bold border-2 border-dashed border-gray-100 dark:border-white/5 rounded-xl">
                            لا توجد درجات مرصودة لهذا الفصل
                        </div>
                    )}
                </div>
            </div>
          </div>

          {/* Behavior List - Standard Card */}
          <div className={`${cardStyle} overflow-hidden`}>
            <div className="bg-gray-50 dark:bg-white/5 p-4 border-b border-gray-100 dark:border-white/10 flex items-center gap-2">
                <LayoutList className="w-4 h-4 text-blue-500" />
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
