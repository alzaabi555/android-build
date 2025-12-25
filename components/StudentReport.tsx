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
  const finalPercentage = finalMax > 0 ? Math.round((finalScore / finalMax) * 100) : 0;

  const getGradeSymbol = (percentage: number) => {
    if (finalMax === 0) return null;
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

  const getBase64Image = async (url: string): Promise<string> => {
      try {
          const response = await fetch(url);
          if (!response.ok) return ""; 
          
          const blob = await response.blob();
          return new Promise((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => {
                  const result = reader.result as string;
                  if (result && result.startsWith('data:')) {
                      resolve(result);
                  } else {
                      resolve("");
                  }
              };
              reader.onerror = () => resolve("");
              reader.readAsDataURL(blob);
          });
      } catch (error) {
          console.warn("Failed to load image:", url);
          return "";
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
                 const result = await Filesystem.writeFile({
                    path: filename,
                    data: base64Data,
                    directory: Directory.Cache, 
                 });
                 await Share.share({
                    title: filename,
                    url: result.uri,
                    dialogTitle: 'مشاركة/حفظ'
                 });
            } else {
                 const pdfBlob = await worker.output('blob');
                 const url = URL.createObjectURL(pdfBlob);
                 const link = document.createElement('a');
                 link.href = url;
                 link.download = filename; 
                 link.target = "_blank";
                 document.body.appendChild(link);
                 link.click();
                 setTimeout(() => {
                     document.body.removeChild(link);
                     URL.revokeObjectURL(url);
                 }, 2000);
            }

        } catch (err) {
            console.error('PDF Error:', err);
        } finally {
            setLoader(false);
        }
    } else {
        alert('مكتبة PDF غير جاهزة');
        setLoader(false);
    }
  };

  const handleGenerateCertificate = async () => {
      setIsGeneratingPdf(true);
      
      let emblemSrc = '';
      try {
           emblemSrc = await getBase64Image('National_emblem_of_Oman.svg');
           // إذا لم يجد الشعار الرسمي، يحاول استخدام أيقونة التطبيق كبديل مؤقت
           if (!emblemSrc) {
              emblemSrc = await getBase64Image('icon.png');
           }
      } catch (e) {
          console.warn("Logo load failed", e);
      }
      
      const governorate = teacherInfo?.governorate || '...............';
      const schoolName = teacherInfo?.school || '...............';
      const teacherName = teacherInfo?.name || '...............';
      const subject = teacherInfo?.subject || '...............';
      const semesterText = currentSemester === '1' ? 'الأول' : 'الثاني';
      
      const element = document.createElement('div');
      element.setAttribute('dir', 'rtl');
      element.style.fontFamily = 'Tajawal, sans-serif';
      element.style.padding = '0';
      element.style.margin = '0';
      element.style.width = '297mm'; 
      element.style.height = '210mm';
      element.style.backgroundColor = '#fff';
      element.style.position = 'relative';

      // تصميم الشهادة "الماسي" الرسمي
      element.innerHTML = `
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;800&display=swap');
            @import url('https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap');
            @import url('https://fonts.googleapis.com/css2?family=Aref+Ruqaa:wght@400;700&display=swap');

            .cert-container {
                width: 100%; height: 100%;
                padding: 10mm;
                box-sizing: border-box;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                background-color: #fff;
                /* خلفية مائية خفيفة جداً لإضفاء فخامة */
                background-image: radial-gradient(circle at center, #fff 50%, #f9f9f9 100%);
            }

            /* الإطار المزدوج الفاخر */
            .border-outer {
                width: 100%;
                height: 100%;
                border: 2px solid #1A237E; /* أزرق ملكي */
                border-radius: 20px;
                padding: 5px;
                box-sizing: border-box;
                position: relative;
                box-shadow: inset 0 0 20px rgba(0,0,0,0.02);
            }
            .border-inner {
                width: 100%;
                height: 100%;
                border: 4px solid #C5A059; /* ذهبي */
                border-radius: 16px;
                position: relative;
                display: flex;
                flex-direction: column;
                align-items: center;
            }

            /* الزخارف الجانبية */
            .corner-decor-tl {
                position: absolute; top: 18px; right: 18px;
                width: 100px; height: 100px;
                border-top: 4px solid #1A237E;
                border-right: 4px solid #1A237E;
                border-radius: 0 25px 0 0;
            }
            .corner-decor-br {
                position: absolute; bottom: 18px; left: 18px;
                width: 100px; height: 100px;
                border-bottom: 4px solid #1A237E;
                border-left: 4px solid #1A237E;
                border-radius: 0 0 0 25px;
            }
            /* نقاط ذهبية للزينة */
            .gold-dot-tl {
                position: absolute; top: 110px; right: 14px;
                width: 8px; height: 8px; background: #C5A059; border-radius: 50%;
            }
             .gold-dot-tl-2 {
                position: absolute; top: 14px; right: 110px;
                width: 8px; height: 8px; background: #C5A059; border-radius: 50%;
            }

            .gold-dot-br {
                position: absolute; bottom: 110px; left: 14px;
                width: 8px; height: 8px; background: #C5A059; border-radius: 50%;
            }
             .gold-dot-br-2 {
                position: absolute; bottom: 14px; left: 110px;
                width: 8px; height: 8px; background: #C5A059; border-radius: 50%;
            }

            /* الشعار (الخنجر) */
            .logo-container {
                height: 100px; /* مساحة محجوزة للشعار */
                display: flex;
                align-items: center;
                justify-content: center;
                margin-top: 15px;
                margin-bottom: 5px;
            }
            .khanjar-logo {
                height: 100%;
                width: auto;
                object-fit: contain;
                filter: drop-shadow(0 2px 4px rgba(197, 160, 89, 0.4));
            }

            /* الترويسة */
            .header-text {
                text-align: center;
                font-family: 'Tajawal', sans-serif;
                color: #444;
                font-weight: 700;
                font-size: 15px;
                line-height: 1.5;
            }

            /* عنوان الشهادة */
            .cert-title {
                font-family: 'Aref Ruqaa', serif;
                font-size: 85px;
                color: #C5A059; /* ذهبي */
                text-align: center;
                margin-top: 5px;
                margin-bottom: 5px;
                text-shadow: 2px 2px 0px #f3f4f6, 3px 3px 0px rgba(0,0,0,0.1);
                position: relative;
                z-index: 10;
            }

            /* نص المقدمة */
            .intro-text {
                font-family: 'Amiri', serif;
                font-size: 20px;
                color: #333;
                margin-bottom: 5px;
            }

            /* اسم الطالب - تم تصغيره ورفعه */
            .student-name {
                font-family: 'Amiri', serif;
                font-size: 45px; /* تم التصغير من 60 */
                font-weight: 700;
                color: #1A237E; /* أزرق غامق */
                margin: 5px 0 15px 0; /* تم تقليل الهوامش لرفعه */
                text-align: center;
                line-height: 1.2;
            }

            /* تفاصيل التميز */
            .details-text {
                font-family: 'Amiri', serif;
                font-size: 22px;
                color: #333;
                text-align: center;
                margin-bottom: 5px;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
            }

            /* كبسولة التقدير */
            .grade-box {
                background: linear-gradient(135deg, #C5A059 0%, #D4AF37 100%);
                color: white;
                padding: 3px 25px;
                border-radius: 20px;
                font-family: 'Tajawal', sans-serif;
                font-weight: bold;
                font-size: 18px;
                margin: 0 5px;
                box-shadow: 0 2px 5px rgba(197, 160, 89, 0.3);
            }

            /* العام الدراسي */
            .year-text {
                font-family: 'Amiri', serif;
                font-size: 18px;
                color: #555;
                font-weight: bold;
                margin-top: 5px;
                margin-bottom: 25px;
                border-bottom: 1px solid #eee;
                padding-bottom: 10px;
                width: 60%;
                text-align: center;
            }

            /* التواقيع - تم عكس الترتيب */
            .footer-section {
                width: 85%;
                display: flex;
                justify-content: space-between; /* يوزع العناصر على الأطراف */
                align-items: flex-start;
                margin-top: auto;
                margin-bottom: 40px;
                padding: 0 20px;
            }

            /* في وضع RTL: العنصر الأول يكون يمين، العنصر الأخير يكون يسار */
            
            .signature-block {
                text-align: center;
                min-width: 220px;
            }

            .signature-title {
                font-family: 'Tajawal', sans-serif;
                font-weight: 800;
                font-size: 16px;
                color: #555;
                margin-bottom: 35px;
            }
            
            .signature-line {
                width: 100%;
                height: 2px;
                background: linear-gradient(90deg, transparent, #C5A059, transparent);
                margin-bottom: 8px;
            }

            .signature-name {
                font-family: 'Amiri', serif;
                font-size: 18px;
                color: #1A237E;
                font-weight: bold;
            }
            
            .date-stamp {
                position: absolute;
                bottom: 8px;
                left: 50%;
                transform: translateX(-50%);
                font-size: 10px;
                color: #ccc;
                font-family: Arial;
            }
        </style>

        <div class="cert-container">
            <div class="border-outer">
                <div class="border-inner">
                    <!-- زخارف الزوايا الذهبية والزرقاء -->
                    <div class="corner-decor-tl"></div>
                    <div class="gold-dot-tl"></div> <div class="gold-dot-tl-2"></div>
                    
                    <div class="corner-decor-br"></div>
                    <div class="gold-dot-br"></div> <div class="gold-dot-br-2"></div>

                    <!-- الشعار (الخنجر) - مساحة مخصصة في الأعلى -->
                    <div class="logo-container">
                        ${emblemSrc ? `<img src="${emblemSrc}" class="khanjar-logo" alt="الخنجر العماني" />` : ''}
                    </div>

                    <!-- الترويسة -->
                    <div class="header-text">
                        سلطنة عمان<br/>
                        وزارة التربية والتعليم<br/>
                        المديرية العامة للتربية والتعليم بمحافظة ${governorate}<br/>
                        مدرسة ${schoolName}
                    </div>

                    <!-- العنوان -->
                    <div class="cert-title">شهادة شكر وتقدير</div>

                    <!-- المقدمة -->
                    <div class="intro-text">
                        تتشرف إدارة المدرسة ومعلم المادة بمنح هذه الشهادة للطالب المتفوق:
                    </div>

                    <!-- اسم الطالب (حجم أصغر ومرفوع للأعلى) -->
                    <div class="student-name">${student.name}</div>

                    <!-- التفاصيل -->
                    <div class="details-text">
                        وذلك لتميزه الدراسي وحصوله على تقدير <span class="grade-box">ممتاز</span> في مادة <span style="font-weight:bold; color:#1A237E; font-size:24px;">${subject}</span>
                    </div>

                    <!-- العام الدراسي -->
                    <div class="year-text">
                        خلال الفصل الدراسي ${semesterText} للعام الدراسي 2025 / 2026 م
                    </div>
                    
                    <div style="font-family:'Amiri'; font-size:16px; color:#777; margin-bottom: 10px;">
                        راجين له دوام التقدم والنجاح في مسيرته العلمية والعملية
                    </div>

                    <!-- التذييل والتواقيع -->
                    <div class="footer-section">
                        <!-- اليمين (الأول في RTL): معلم المادة -->
                        <div class="signature-block">
                            <div class="signature-title">معلم المادة</div>
                            <div class="signature-line"></div>
                            <div class="signature-name">${teacherName}</div>
                        </div>

                        <!-- اليسار (الأخير في RTL): مدير المدرسة -->
                         <div class="signature-block">
                            <div class="signature-title">مدير المدرسة</div>
                            <div class="signature-line"></div>
                            <div class="signature-name">.........................</div>
                        </div>
                    </div>
                    
                    <div class="date-stamp">حررت بتاريخ: ${new Date().toLocaleDateString('ar-EG')}</div>

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

    element.innerHTML = `
      <div style="text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 15px;">
        <h1 style="margin: 0; font-size: 24px;">تقرير الطالب الدراسي والسلوكي</h1>
        <p style="margin: 8px 0 0; font-size: 18px; color: #000; font-weight: bold;">مدرسة  ${teacherInfo?.school || '................'}</p>
        ${teacherInfo?.subject ? `<p style="margin: 5px 0 0; font-size: 14px; color: #555;">المادة: ${teacherInfo.subject}</p>` : ''}
        <p style="margin: 5px 0 0; font-size: 14px; color: #555;">تاريخ التقرير  <span dir="ltr">${new Date().toLocaleDateString('ar-EG')}</span></p>
      </div>
      
      <div style="background: #f9fafb; padding: 15px; border-radius: 12px; margin-bottom: 20px; border: 1px solid #e5e7eb;">
         <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px; font-weight: bold; width: 120px;">اسم الطالب </td>
              <td style="padding: 6px;">${student.name}</td>
            </tr>
            <tr>
              <td style="padding: 6px; font-weight: bold;">المقيد بالصف </td>
              <td style="padding: 6px;">${student.classes[0] || '-'}</td>
            </tr>
         </table>
      </div>

      <div style="margin-bottom: 20px;">
         <h3 style="border-bottom: 1px solid #333; padding-bottom: 5px; margin-bottom: 10px;">ملخص النتائج</h3>
         <table style="width: 100%; border-collapse: collapse; text-align: center; border: 1px solid #ccc;">
            <tr style="background: #f0f0f0;">
                <th style="padding: 8px; border: 1px solid #ccc;">الفصل الأول</th>
                <th style="padding: 8px; border: 1px solid #ccc;">الفصل الثاني</th>
                <th style="padding: 8px; border: 1px solid #ccc; background: #e0f2fe;">المجموع النهائي</th>
            </tr>
            <tr>
                <td style="padding: 10px; border: 1px solid #ccc;">
                    <div style="font-weight: bold; font-size: 16px; direction: ltr;">${sem1Stats.score}</div>
                </td>
                <td style="padding: 10px; border: 1px solid #ccc;">
                     <div style="font-weight: bold; font-size: 16px; direction: ltr;">${sem2Stats.score}</div>
                </td>
                <td style="padding: 10px; border: 1px solid #ccc; background: #f0f9ff;">
                     <div style="font-weight: bold; font-size: 18px; color: #0284c7; direction: ltr;">${finalScore} / ${finalMax}</div>
                     <div style="font-weight: bold; font-size: 14px; margin-top: 4px;">التقدير: ${finalSymbol?.desc || '-'}</div>
                </td>
            </tr>
         </table>
      </div>
      
      <div style="margin-bottom: 20px;">
         <h3 style="border-bottom: 1px solid #333; padding-bottom: 5px;">السلوكيات المرصودة</h3>
         <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <thead>
               <tr style="background: #e5e7eb;">
                   <th style="border:1px solid #ccc; padding:6px;">الوصف</th>
                   <th style="border:1px solid #ccc; padding:6px;">التاريخ</th>
                   <th style="border:1px solid #ccc; padding:6px;">النوع</th>
               </tr>
            </thead>
            <tbody>
                ${behaviorRows || '<tr><td colspan="3" style="text-align:center; padding:10px;">لا توجد سلوكيات مسجلة</td></tr>'}
            </tbody>
         </table>
      </div>

      <div>
         <h3 style="border-bottom: 1px solid #333; padding-bottom: 5px;">تفاصيل الدرجات</h3>
         <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px;">
            <thead>
               <tr style="background: #e5e7eb;">
                  <th style="border: 1px solid #9ca3af; padding: 8px;">الأداة</th>
                  <th style="border: 1px solid #9ca3af; padding: 8px;">الدرجة</th>
                  <th style="border: 1px solid #9ca3af; padding: 8px;">العظمى</th>
                  <th style="border: 1px solid #9ca3af; padding: 8px;">الفصل</th>
               </tr>
            </thead>
            <tbody>
               ${allGrades.length > 0 ? allGrades.map(g => `
                  <tr>
                     <td style="border: 1px solid #9ca3af; padding: 8px;">${g.category}</td>
                     <td style="border: 1px solid #9ca3af; padding: 8px; text-align: center; font-weight: bold;">${g.score}</td>
                     <td style="border: 1px solid #9ca3af; padding: 8px; text-align: center;">${g.maxScore}</td>
                     <td style="border: 1px solid #9ca3af; padding: 8px; text-align: center;">${g.semester === '1' ? 'الأول' : 'الثاني'}</td>
                  </tr>
               `).join('') : '<tr><td colspan="4" style="text-align:center; padding: 8px; border: 1px solid #9ca3af;">لا توجد درجات</td></tr>'}
            </tbody>
         </table>
      </div>
      
      <div style="margin-top: 30px; text-align: left; padding-left: 20px;">
         <p>يعتمد،،</p>
         <p style="font-weight: bold;">مدير المدرسة</p>
      </div>
    `;
    exportPDF(element, `تقرير_${student.name}.pdf`, setIsGeneratingPdf);
  };

  const handleGenerateSummons = async (grade: GradeRecord) => {
    setGeneratingSummonsId(grade.id);
    
    // تحميل الشعار بنفس الطريقة لضمان الظهور
    let emblemSrc = '';
    try {
        emblemSrc = await getBase64Image('National_emblem_of_Oman.svg');
        if (!emblemSrc) {
           emblemSrc = await getBase64Image('icon.png');
        }
    } catch (e) {
        console.error('Error converting emblem:', e);
    }

    const teacherName = teacherInfo?.name || '';
    const schoolName = teacherInfo?.school || '';
    const governorate = teacherInfo?.governorate || '...............';
    const todayDate = new Date();

    const element = document.createElement('div');
    element.setAttribute('dir', 'rtl');
    element.style.fontFamily = 'Tajawal, sans-serif';
    element.style.padding = '0';
    element.style.color = '#000';
    element.style.width = '100%';
    
    element.innerHTML = `
      <style>
        .slash { margin: 0 3px; font-family: arial; }
      </style>
      <div style="border: 3px double #000; padding: 15px; margin: 10px; height: 95%;">
        
        <table style="width: 100%; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px;">
            <tr>
                <td style="width: 33%; text-align: center; font-size: 11px; line-height: 1.5; vertical-align: top; font-weight: bold;">
                    سلطنة عمان<br/>
                    وزارة التربية والتعليم<br/>
                    المديرية العامة للتربية والتعليم بمحافظة ${governorate}<br/>
                    مدرسة ${schoolName}
                </td>
                <td style="width: 34%; text-align: center; vertical-align: top;">
                    ${emblemSrc ? `<img src="${emblemSrc}" style="width: 70px; height: auto; object-fit: contain;" />` : ''}
                </td>
                <td style="width: 33%; text-align: left; font-size: 11px; line-height: 1.8; vertical-align: middle; padding-left: 5px;">
                    اليوم : <span style="font-weight:bold">${todayDate.toLocaleDateString('ar-EG', { weekday: 'long' })}</span><br/>
                    التاريخ : <span style="font-weight:bold" dir="ltr">${todayDate.toLocaleDateString('ar-EG')}</span>
                </td>
            </tr>
        </table>

        <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="font-size: 22px; font-weight: bold; text-decoration: underline;">دعوة ولي الأمر لشأن يتعلق بالطالب</h2>
        </div>

        <div style="font-size: 16px; line-height: 2.2; text-align: justify; padding: 0 10px;">
            <div style="margin-bottom: 15px;">
                <span style="font-weight: bold;">الفاضل ولي أمر الطالب </span> &nbsp; ${student.name} &nbsp; <span style="float: left; font-weight: bold;">المحترم</span>
            </div>
            
            <div style="margin-bottom: 15px;">
                <span style="font-weight: bold;">المقيد بالصف </span> &nbsp; ${student.classes[0] || '...'}
            </div>

            <div style="margin-bottom: 20px; text-align: center; font-weight: bold;">
                السلام عليكم ورحمة الله وبركاته
            </div>

            <p style="margin-bottom: 20px;">
                نظرا لأهمية التعاون بين المدرسة وولي الأمر فيما يخدم مصلحة الطالب ويحقق له النجاح.
            </p>
            
            <p style="margin-bottom: 20px;">
                نأمل حضوركم لبحث بعض الأمور المتعلقة بابنكم ولنا في حضوركم أمل بهدف تعاون البيت والمدرسة لتحقيق الرسالة التربوية الهادفة التي نسعى إليها وتأمل المدرسة حضوركم.
            </p>

            <div style="margin-top: 30px;">
               <span style="font-weight: bold;">وذلك في يوم </span> ..................... &nbsp;&nbsp;&nbsp; 
               <span style="font-weight: bold;">الموافق </span> .....................
            </div>

            <div style="margin-top: 20px;">
                <span style="font-weight: bold;">ومراجعة الأستاذ </span> &nbsp; ${teacherName}
            </div>
            
            <div style="margin-top: 25px; padding: 15px; border: 1px solid #333; border-radius: 8px;">
               <div style="font-weight: bold; margin-bottom: 5px; text-decoration: underline;">سبب الاستدعاء </div>
               <div>تدني المستوى التحصيلي في مادة ${grade.category}</div>
               <div style="margin-top: 5px;">الدرجة الحالية ${grade.score} من ${grade.maxScore}</div>
            </div>
        </div>

        <div style="margin-top: 40px; text-align: center; font-weight: bold; font-size: 16px;">
            شاكرين حسن تعاونكم معنا
        </div>

        <div style="margin-top: 50px; display: flex; justify-content: space-between;">
            <div style="text-align: center; width: 45%;">
                <p style="font-weight: bold; margin-bottom: 40px;"><span style="unicode-bidi: embed;">المعلم<span class="slash">/</span>ـة</span></p>
                <p>${teacherName}</p>
            </div>
             <div style="text-align: center; width: 45%;">
                <p style="font-weight: bold; margin-bottom: 40px;"><span style="unicode-bidi: embed;">مدير<span class="slash">/</span>ة</span> المدرسة</p>
                <p>.........................</p>
            </div>
        </div>

      </div>
    `;

    exportPDF(element, `استدعاء_${student.name}.pdf`, (isLoading) => {
        if (!isLoading) setGeneratingSummonsId(null);
    });
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="space-y-6">
          <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col gap-6 relative">
            
            <div className="absolute top-6 left-6 flex gap-2">
                <button 
                    onClick={handleSaveReport} 
                    disabled={isGeneratingPdf}
                    className="p-3 bg-gray-50 rounded-full hover:bg-gray-100 text-gray-600 transition-colors disabled:opacity-50 shadow-sm border border-gray-100" 
                    title="حفظ التقرير PDF"
                >
                    {isGeneratingPdf ? <Loader2 className="w-5 h-5 animate-spin text-blue-600" /> : <FileText className="w-5 h-5" />}
                </button>
            </div>

            <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-[1.5rem] bg-blue-600 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-blue-100">{student.name.charAt(0)}</div>
                <div>
                  <h1 className="text-sm font-black text-gray-900 mb-1">{student.name}</h1>
                  <span className="text-[9px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-black">الصف: {student.classes[0] || 'غير محدد'}</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-3xl flex flex-col items-center justify-center h-32 relative overflow-hidden">
                    <span className="text-[9px] font-black text-slate-400 mb-1 absolute top-3">المجموع النهائي</span>
                    <div className="flex items-baseline gap-1 mt-2" dir="ltr">
                        <span className="text-4xl font-black text-slate-800 tracking-tighter">{finalScore}</span>
                        <span className="text-xs font-bold text-slate-400">&nbsp;/&nbsp;{finalMax}</span>
                    </div>
                    <div className="flex gap-2 mt-2 border-t border-slate-200 pt-2 w-full justify-center">
                         <div className="text-center">
                             <span className="block text-[8px] text-slate-400 font-bold">فصل 1</span>
                             <span className="block text-[9px] font-black text-slate-600">{sem1Stats.score}</span>
                         </div>
                         <div className="w-px bg-slate-200"></div>
                         <div className="text-center">
                             <span className="block text-[8px] text-slate-400 font-bold">فصل 2</span>
                             <span className="block text-[9px] font-black text-slate-600">{sem2Stats.score}</span>
                         </div>
                    </div>
                </div>

                <div className={`${finalSymbol ? finalSymbol.bg : 'bg-gray-50'} ${finalSymbol ? finalSymbol.border : 'border-gray-100'} border p-4 rounded-3xl flex flex-col items-center justify-center h-32 relative overflow-hidden transition-all`}>
                    <span className="text-[9px] font-black opacity-50 mb-1 absolute top-3">المستوى</span>
                    {finalSymbol ? (
                        <>
                            <span className={`text-6xl font-black ${finalSymbol.color} leading-none mt-2`}>{finalSymbol.symbol}</span>
                            <span className={`text-[10px] font-bold ${finalSymbol.color} opacity-80 mt-1`}>{finalSymbol.desc}</span>
                        </>
                    ) : (
                        <span className="text-2xl font-black text-gray-300">-</span>
                    )}
                </div>
            </div>
            
            {/* زر شهادة التفوق يظهر فقط إذا كان التقدير ممتاز (أ) */}
            {finalPercentage >= 90 && (
                <button 
                    onClick={handleGenerateCertificate}
                    disabled={isGeneratingPdf}
                    className="w-full bg-gradient-to-r from-amber-200 to-yellow-400 text-yellow-900 py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-yellow-100 active:scale-95 transition-all"
                >
                    {isGeneratingPdf ? <Loader2 className="w-5 h-5 animate-spin"/> : <Medal className="w-5 h-5" />}
                    إصدار شهادة تفوق
                </button>
            )}

            <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-100 flex flex-col items-center justify-center min-h-[80px]">
                    <div className="flex items-center gap-1 mb-1">
                        <Award className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-[9px] font-black text-emerald-800">نقاط إيجابية</span>
                    </div>
                    <span className="text-2xl font-black text-emerald-600">+{totalPositivePoints}</span>
                </div>
                <div className="bg-rose-50 p-3 rounded-2xl border border-rose-100 flex flex-col items-center justify-center min-h-[80px]">
                    <div className="flex items-center gap-1 mb-1">
                         <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                        <span className="text-[9px] font-black text-rose-800">نقاط سلبية</span>
                    </div>
                    <span className="text-2xl font-black text-rose-600">-{totalNegativePoints}</span>
                </div>
            </div>

            {lowGradesForSummons.length > 0 && (
                <div className="bg-amber-50 border-2 border-amber-200 p-4 rounded-[2rem] animate-in slide-in-from-bottom duration-500">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="p-1.5 bg-amber-200 rounded-lg">
                            <Mail className="w-3.5 h-3.5 text-amber-900" />
                        </div>
                        <div>
                            <h3 className="text-xs font-black text-amber-900">إجراء إداري مطلوب</h3>
                            <p className="text-[9px] font-bold text-amber-700">درجة متدنية في الاختبارات القصيرة</p>
                        </div>
                    </div>
                    <div className="space-y-2">
                        {lowGradesForSummons.map(grade => (
                            <div key={grade.id} className="w-full bg-white p-3 rounded-xl border border-amber-100 flex items-center justify-between shadow-sm">
                                <div className="text-right">
                                    <span className="block text-[10px] font-black text-gray-800">{grade.category}</span>
                                    <span className="text-[9px] font-bold text-rose-500">الدرجة: {grade.score} من {grade.maxScore}</span>
                                </div>
                                <button 
                                    onClick={() => handleGenerateSummons(grade)}
                                    disabled={generatingSummonsId !== null}
                                    className={`px-3 py-1.5 rounded-lg flex gap-1 items-center transition-all ${generatingSummonsId === grade.id ? 'bg-amber-200 text-amber-800' : 'bg-amber-100 text-amber-700 hover:bg-amber-200 active:scale-95'}`}
                                >
                                    {generatingSummonsId === grade.id ? (
                                        <>
                                           <Loader2 className="w-3 h-3 animate-spin" />
                                           <span className="text-[9px] font-black">جاري...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="text-[9px] font-black">استدعاء</span>
                                            <UserCheck className="w-3 h-3" />
                                        </>
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {student.parentPhone && (
              <div className="flex gap-2 border-t border-gray-50 pt-4">
                <button 
                  onClick={() => window.open(`https://wa.me/${student.parentPhone}`, '_system')}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-50 text-emerald-700 rounded-2xl text-[10px] font-black active:scale-95 transition-all"
                >
                    <MessageCircle className="w-4 h-4"/> واتساب
                </button>
                <a href={`tel:${student.parentPhone}`} className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-50 text-blue-700 rounded-2xl text-[10px] font-black active:scale-95 transition-all"><PhoneCall className="w-4 h-4"/> اتصال</a>
              </div>
            )}
          </div>

          <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm">
            <div className="bg-gray-50/50 p-4 border-b border-gray-100 flex items-center gap-2">
                <Award className="w-4 h-4 text-blue-600" />
                <h3 className="font-black text-gray-800 text-[11px]">كشف السلوكيات التفصيلي ({currentSemester === '2' ? 'الفصل الثاني' : 'الفصل الأول'})</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {behaviors.length > 0 ? behaviors.map(b => (
                <div key={b.id} className="p-4 flex items-center justify-between group hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${b.type === 'positive' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {b.type === 'positive' ? <Award className="w-4 h-4"/> : <AlertCircle className="w-4 h-4"/>}
                    </div>
                    <div>
                        <span className="block text-[10px] font-black text-gray-800">{b.description}</span>
                        <div className="flex gap-2 mt-1">
                            <span className="text-[9px] text-gray-400 font-bold">{new Date(b.date).toLocaleDateString('ar-EG')}</span>
                            <span className={`text-[9px] font-black ${b.type === 'positive' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                ({b.points > 0 ? `+${b.points}` : b.points} نقطة)
                            </span>
                        </div>
                    </div>
                  </div>
                  {onUpdateStudent && (
                      <button onClick={() => handleDeleteBehavior(b.id)} className="p-2 text-gray-200 hover:text-rose-500 transition-colors">
                          <Trash2 className="w-4 h-4" />
                      </button>
                  )}
                </div>
              )) : <p className="p-8 text-center text-[10px] text-gray-400 font-bold">سجل السلوك نظيف لهذا الفصل</p>}
            </div>
          </div>
      </div>
    </div>
  );
};

export default StudentReport;