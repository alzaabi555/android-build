
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Printer, FileSpreadsheet, User, Users, CalendarRange, Calendar, FileText, Award, BarChart3, Check, Settings, Trash2, Image as ImageIcon, FileWarning, Share2, Upload, ChevronDown, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Student } from '../types';
import StudentReport from './StudentReport';
import Modal from './Modal';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

declare var html2pdf: any;

const Reports: React.FC = () => {
  const { students, setStudents, classes, teacherInfo, setTeacherInfo, currentSemester, assessmentTools, certificateSettings, setCertificateSettings } = useApp();
  const [activeTab, setActiveTab] = useState<'student_report' | 'grades_record' | 'certificates' | 'summon'>('student_report');

  // --- Student Report State ---
  const [stClass, setStClass] = useState<string>(classes[0] || '');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);

  // --- Grades Record State ---
  const [gradesClass, setGradesClass] = useState<string>('all');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // --- Certificates State ---
  const [certClass, setCertClass] = useState<string>(classes[0] || '');
  const [selectedCertStudents, setSelectedCertStudents] = useState<string[]>([]);
  const [showCertSettingsModal, setShowCertSettingsModal] = useState(false);
  const [tempCertSettings, setTempCertSettings] = useState(certificateSettings);

  // --- Summon State ---
  const [summonClass, setSummonClass] = useState<string>(classes[0] || '');
  const [summonStudentId, setSummonStudentId] = useState<string>('');
  const [summonDate, setSummonDate] = useState(new Date().toISOString().split('T')[0]);
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [summonTime, setSummonTime] = useState('09:00');
  const [reasonType, setReasonType] = useState('absence');
  const [customReason, setCustomReason] = useState('');
  const [showSummonPreview, setShowSummonPreview] = useState(false);
  const [showAssetsSettings, setShowAssetsSettings] = useState(false);
  const letterRef = useRef<HTMLDivElement>(null);

  // Helpers
  const filteredStudentsForStudentTab = useMemo(() => students.filter(s => s.classes.includes(stClass)), [students, stClass]);
  const filteredStudentsForGrades = useMemo(() => students.filter(s => gradesClass === 'all' || s.classes.includes(gradesClass)), [students, gradesClass]);
  const filteredStudentsForCert = useMemo(() => students.filter(s => s.classes.includes(certClass)), [students, certClass]);
  const availableStudentsForSummon = useMemo(() => students.filter(s => s.classes.includes(summonClass)), [summonClass, students]);

  useEffect(() => {
      if(showCertSettingsModal) setTempCertSettings(certificateSettings);
  }, [showCertSettingsModal, certificateSettings]);

  const handleUpdateStudent = (updatedStudent: Student) => {
      setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
      setViewingStudent(updatedStudent);
  };

  const handleViewStudentReport = () => {
      const student = students.find(s => s.id === selectedStudentId);
      if (student) setViewingStudent(student);
  };

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setTempCertSettings(prev => ({ ...prev, backgroundImage: reader.result as string, showDefaultDesign: false }));
          };
          reader.readAsDataURL(file);
      }
  };

  const handleSaveCertSettings = () => {
      setCertificateSettings(tempCertSettings);
      setShowCertSettingsModal(false);
  };

  const selectAllCertStudents = () => {
      if (selectedCertStudents.length === filteredStudentsForCert.length) {
          setSelectedCertStudents([]);
      } else {
          setSelectedCertStudents(filteredStudentsForCert.map(s => s.id));
      }
  };

  const toggleCertStudent = (id: string) => {
      setSelectedCertStudents(prev => 
          prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
      );
  };

  // --- Grade Book Logic ---
  const getGradeSymbol = (score: number) => {
      if (score >= 90) return 'أ';
      if (score >= 80) return 'ب';
      if (score >= 65) return 'ج';
      if (score >= 50) return 'د';
      return 'هـ';
  };

  const getActiveColumns = () => {
    const columns = new Set<string>();
    assessmentTools.forEach(t => columns.add(t.name.trim()));
    filteredStudentsForGrades.forEach(s => {
        (s.grades || []).filter(g => (g.semester || '1') === currentSemester).forEach(g => {
            if (g.category) columns.add(g.category.trim());
        });
    });
    return Array.from(columns).sort();
  };

  const getBase64Image = async (url: string): Promise<string> => {
      try {
          const response = await fetch(url);
          const blob = await response.blob();
          return new Promise((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
          });
      } catch (e) { return ''; }
  };

  // Helper function for reliable PDF generation across all platforms
  const generateAndSharePDF = async (element: HTMLElement, filename: string, landscape = false) => {
      setIsGeneratingPdf(true);
      
      if (typeof html2pdf !== 'undefined') {
          const opt = { 
              margin: 0, 
              filename: filename, 
              image: { type: 'jpeg', quality: 0.98 }, 
              html2canvas: { scale: 2, useCORS: true }, 
              jsPDF: { unit: 'mm', format: 'a4', orientation: landscape ? 'landscape' : 'portrait' } 
          };
          try {
              const worker = html2pdf().set(opt).from(element).toPdf();
              if (Capacitor.isNativePlatform()) {
                  // For Mobile (iOS/Android): Save to Filesystem then Share
                  const pdfBase64 = await worker.output('datauristring');
                  const base64Data = pdfBase64.split(',')[1];
                  const result = await Filesystem.writeFile({ path: filename, data: base64Data, directory: Directory.Cache });
                  await Share.share({ title: filename, url: result.uri });
              } else { 
                  // For Web/Electron: Download directly
                  worker.save(); 
              }
          } catch (e) { 
              console.error(e);
              alert('خطأ في إنشاء ملف PDF'); 
          } finally { 
              setIsGeneratingPdf(false); 
          }
      } else { 
          alert('مكتبة PDF غير متوفرة'); 
          setIsGeneratingPdf(false); 
      }
  };

  const handlePrintGradeReport = async () => {
      if (filteredStudentsForGrades.length === 0) return alert('لا يوجد طلاب');
      const logoBase64 = await getBase64Image('icon.png'); 
      const activeColumns = getActiveColumns();

      const element = document.createElement('div');
      element.setAttribute('dir', 'rtl');
      element.style.fontFamily = 'Tajawal, sans-serif';
      element.style.padding = '20px';
      element.style.backgroundColor = '#fff';
      element.style.color = '#000';

      const toolHeaders = activeColumns.map(name => `<th style="border:1px solid #000; padding:5px; font-size:10px;">${name}</th>`).join('');
      
      const rows = filteredStudentsForGrades.map((s, i) => {
          const semGrades = (s.grades || []).filter(g => (g.semester || '1') === currentSemester);
          const toolCells = activeColumns.map(name => {
              const g = semGrades.find(grade => grade.category.trim() === name);
              return `<td style="border:1px solid #000; padding:5px; text-align:center;">${g ? g.score : '-'}</td>`;
          }).join('');
          
          const total = semGrades.reduce((acc, g) => acc + (Number(g.score) || 0), 0);
          const symbol = getGradeSymbol(total);

          return `
            <tr>
                <td style="border:1px solid #000; padding:5px; text-align:center;">${i + 1}</td>
                <td style="border:1px solid #000; padding:5px; font-weight:bold;">${s.name}</td>
                ${toolCells}
                <td style="border:1px solid #000; padding:5px; text-align:center; font-weight:bold; background:#f0f0f0;">${total}</td>
                <td style="border:1px solid #000; padding:5px; text-align:center;">${symbol}</td>
            </tr>
          `;
      }).join('');

      element.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
            <img src="${logoBase64}" style="width: 80px; height: auto; margin-bottom: 10px; display: block; margin-left: auto; margin-right: auto;" />
            <h3 style="margin: 5px 0; font-size: 16px; font-weight: bold;">سلطنة عمان</h3>
            <h3 style="margin: 2px 0; font-size: 16px; font-weight: bold;">وزارة التربية والتعليم</h3>
            <h3 style="margin: 2px 0; font-size: 16px; font-weight: bold;">المديرية العامة للتربية والتعليم لمحافظة ${teacherInfo?.governorate || '.........'}</h3>
            <h3 style="margin: 2px 0; font-size: 16px; font-weight: bold;">مدرسة ${teacherInfo?.school || '..................'}</h3>
            <div style="margin-top: 15px; border-top: 1px solid #000; width: 100%;"></div>
            <h2 style="margin: 15px 0 5px 0; font-size: 20px; font-weight: bold;">سجل الدرجات - الفصل الدراسي ${currentSemester}</h2>
            <p style="margin: 0; font-size: 14px;">المادة: ${teacherInfo?.subject || '.....'} | الصف: ${gradesClass === 'all' ? 'جميع الفصول' : gradesClass}</p>
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px; border: 1px solid #000;">
            <thead>
                <tr style="background-color: #eee;">
                    <th style="border:1px solid #000; padding:5px; width:40px;">#</th>
                    <th style="border:1px solid #000; padding:5px;">اسم الطالب</th>
                    ${toolHeaders}
                    <th style="border:1px solid #000; padding:5px; width:60px;">المجموع</th>
                    <th style="border:1px solid #000; padding:5px; width:50px;">التقدير</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
        </table>
        <div style="margin-top: 40px; display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; padding: 0 50px;">
            <div style="text-align: center;">معلم المادة<br/>${teacherInfo?.name || ''}</div>
            <div style="text-align: center;">يعتمد،، مدير المدرسة<br/>....................</div>
        </div>
      `;

      await generateAndSharePDF(element, `GradeReport_Sem${currentSemester}.pdf`, true);
  };

  const handlePrintClassReports = async () => {
      const studentsToPrint = filteredStudentsForStudentTab;
      if (studentsToPrint.length === 0) return alert('لا يوجد طلاب في الفصل المحدد');
      
      const ministryLogo = teacherInfo.ministryLogo || await getBase64Image('oman_logo.png') || await getBase64Image('icon.png');
      const stamp = teacherInfo.stamp || '';

      const element = document.createElement('div');
      element.innerHTML = studentsToPrint.map(student => {
          const behaviors = (student.behaviors || []).filter(b => !b.semester || b.semester === currentSemester);
          const totalPos = behaviors.filter(b => b.type === 'positive').reduce((acc, b) => acc + b.points, 0);
          const totalNeg = behaviors.filter(b => b.type === 'negative').reduce((acc, b) => acc + Math.abs(b.points), 0);
          
          const grades = (student.grades || []).filter(g => (g.semester || '1') === currentSemester);
          const totalScore = grades.reduce((acc, g) => acc + (Number(g.score) || 0), 0);
          
          const absRecs = (student.attendance || []).filter(a => a.status === 'absent');
          const truantRecs = (student.attendance || []).filter(a => a.status === 'truant');

          const gradesRows = grades.length > 0 ? grades.map(g => `
            <tr>
                <td style="border:1px solid #ccc; padding:8px;">${g.subject}</td>
                <td style="border:1px solid #ccc; padding:8px; text-align:center;">${g.category}</td>
                <td style="border:1px solid #ccc; padding:8px; text-align:center;"><b>${g.score}</b></td>
            </tr>
          `).join('') : `<tr><td colspan="3" style="border:1px solid #ccc; padding:10px; text-align:center;">لا توجد درجات</td></tr>`;

          const behaviorRows = behaviors.length > 0 ? behaviors.map(b => `
            <div style="display:flex; justify-content:space-between; padding:5px; border-bottom:1px solid #eee;">
                <span>${b.description} (${new Date(b.date).toLocaleDateString('en-GB')})</span>
                <span style="font-weight:bold; color:${b.type === 'positive' ? 'green' : 'red'};">${b.type === 'positive' ? '+' : '-'}${Math.abs(b.points)}</span>
            </div>
          `).join('') : '<div style="padding:10px; text-align:center; color:#777;">لا توجد ملاحظات</div>';

          return `
            <div class="report-page" style="page-break-after: always; padding: 40px; font-family: 'Tajawal', sans-serif; direction: rtl; position: relative;">
                <div style="display:flex; justify-content:space-between; border-bottom:2px solid #eee; padding-bottom:20px; margin-bottom:30px;">
                    <div style="text-align:center; width:33%;">
                        <p style="margin:2px; font-weight:bold;">سلطنة عمان</p>
                        <p style="margin:2px; font-weight:bold;">وزارة التربية والتعليم</p>
                        <p style="margin:2px; font-weight:bold;">مدرسة ${teacherInfo.school || '......'}</p>
                    </div>
                    <div style="text-align:center; width:33%;">
                        <img src="${ministryLogo}" style="height:80px; object-fit:contain;" />
                        <h2 style="margin-top:10px; text-decoration:underline;">تقرير مستوى طالب</h2>
                    </div>
                    <div style="text-align:right; width:33%;">
                        <p style="margin:2px;">العام الدراسي: ${teacherInfo.academicYear}</p>
                        <p style="margin:2px;">الفصل الدراسي: ${currentSemester === '1' ? 'الأول' : 'الثاني'}</p>
                    </div>
                </div>

                <div style="background:#f9fafb; border:1px solid #e5e7eb; padding:20px; border-radius:15px; margin-bottom:30px; display:flex; justify-content:space-between;">
                    <div>
                        <h3 style="margin:0 0 10px 0;">الطالب: ${student.name}</h3>
                        <p style="margin:0;">الصف: ${student.classes[0]} | ولي الأمر: ${student.parentPhone || '-'}</p>
                    </div>
                    <div style="text-align:left;">
                        <span style="background:#dcfce7; color:#15803d; padding:5px 10px; border-radius:5px; font-weight:bold;">إيجابي: ${totalPos}</span>
                        <span style="background:#ffe4e6; color:#be123c; padding:5px 10px; border-radius:5px; font-weight:bold; margin-right:5px;">سلبي: ${totalNeg}</span>
                    </div>
                </div>

                <h3 style="border-bottom:1px solid #ccc; padding-bottom:5px;">التحصيل الدراسي (المجموع: ${totalScore})</h3>
                <table style="width:100%; border-collapse:collapse; margin-bottom:30px;">
                    <thead>
                        <tr style="background:#f3f4f6;">
                            <th style="border:1px solid #ccc; padding:8px;">المادة</th>
                            <th style="border:1px solid #ccc; padding:8px;">الأداة</th>
                            <th style="border:1px solid #ccc; padding:8px;">الدرجة</th>
                        </tr>
                    </thead>
                    <tbody>${gradesRows}</tbody>
                </table>

                <h3 style="border-bottom:1px solid #ccc; padding-bottom:5px;">الحضور والغياب</h3>
                <div style="display:flex; gap:20px; margin-bottom:20px;">
                    <div style="flex:1; border:1px solid #ccc; padding:10px; text-align:center; border-radius:10px;">غياب: <b style="color:red;">${absRecs.length}</b></div>
                    <div style="flex:1; border:1px solid #ccc; padding:10px; text-align:center; border-radius:10px;">تسرب: <b style="color:purple;">${truantRecs.length}</b></div>
                </div>

                <h3 style="border-bottom:1px solid #ccc; padding-bottom:5px;">السلوك والملاحظات</h3>
                <div style="border:1px solid #eee; padding:10px; border-radius:10px; margin-bottom:40px;">
                    ${behaviorRows}
                </div>

                <div style="display:flex; justify-content:space-between; margin-top:50px;">
                    <div style="text-align:center;">
                        <p style="font-weight:bold;">معلم المادة</p>
                        <p>${teacherInfo.name}</p>
                    </div>
                    ${stamp ? `<img src="${stamp}" style="width:120px; opacity:0.7; mix-blend-mode:multiply;" />` : ''}
                    <div style="text-align:center;">
                        <p style="font-weight:bold;">مدير المدرسة</p>
                        <p>....................</p>
                    </div>
                </div>
            </div>
          `;
      }).join('');

      await generateAndSharePDF(element, `ClassReports_${stClass}.pdf`);
  };

  // --- Certificate Logic ---
  const printCertificates = async () => {
      const targetStudents = students.filter(s => selectedCertStudents.includes(s.id));
      if (targetStudents.length === 0) return alert('الرجاء اختيار طلاب');
      
      const schoolName = teacherInfo?.school || '...................';
      const teacherName = teacherInfo?.name || '...................';
      const academicYearText = teacherInfo?.academicYear || `${new Date().getFullYear()} / ${new Date().getFullYear() + 1}`;
      const governorate = teacherInfo?.governorate || '.........';
      
      const emblemSrc = teacherInfo?.ministryLogo || await getBase64Image('oman_logo.png') || await getBase64Image('icon.png');
      const stampSrc = teacherInfo?.stamp || ''; 
      
      const certTitle = certificateSettings.title;
      const certBody = certificateSettings.bodyText;
      const useCustomBg = !!certificateSettings.backgroundImage;
      const bgImage = certificateSettings.backgroundImage || '';
      const showShapes = certificateSettings.showDefaultDesign && !useCustomBg;

      const element = document.createElement('div');
      element.innerHTML = targetStudents.map(student => `
        <div class="cert-body" style="${useCustomBg ? `background-image: url('${bgImage}'); background-size: 100% 100%; border: none;` : ''}">
            ${showShapes ? `
            <div class="frame-border"><div class="frame-corner c-tl"></div><div class="frame-corner c-tr"></div><div class="frame-corner c-bl"></div><div class="frame-corner c-br"></div></div>
            <div class="deco-tri tri-1"></div><div class="deco-tri tri-2"></div>
            ` : ''}

            <div class="content-wrapper">
                <div class="header-container">
                    ${emblemSrc ? `<img src="${emblemSrc}" class="oman-logo" />` : ''}
                    <div class="ministry-info">
                        سلطنة عمان<br/>
                        وزارة التربية والتعليم<br/>
                        المديرية العامة للتربية والتعليم لمحافظة ${governorate}<br/>
                        مدرسة ${schoolName}
                    </div>
                </div>
                
                <div class="main-title">${certTitle}<div class="title-underline"></div></div>
                
                <div class="cert-text-block">
                    ${certBody.replace(/ الطالب /g, ` <span class="highlight-name">${student.name}</span> `)} <br/>
                    للصف <span class="highlight-data">${student.classes[0] || '....'}</span> للعام الدراسي <span class="highlight-data">${academicYearText}</span><br/>
                    <span style="font-size: 18px; color: #666;">متمنين له دوام التوفيق والنجاح</span>
                </div>
                
                <div class="signatures-row">
                    <div class="sig-box">
                        <div class="sig-title">معلم المادة</div>
                        <div class="sig-line">${teacherName}</div>
                    </div>
                    ${stampSrc ? `<img src="${stampSrc}" class="stamp-img" />` : ''}
                    <div class="sig-box">
                        <div class="sig-title">مدير المدرسة</div>
                        <div class="sig-line">.........................</div>
                    </div>
                </div>
            </div>
        </div>
      `).join('');

      // Add Styles to element for PDF generation
      const style = document.createElement('style');
      style.innerHTML = `
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;800&family=Amiri:wght@400;700&family=Aref+Ruqaa:wght@400;700&display=swap');
        .cert-body { width: 297mm; height: 210mm; position: relative; background: #fff; overflow: hidden; display: flex; flex-direction: column; align-items: center; box-sizing: border-box; padding: 10mm; justify-content: space-between; page-break-after: always; font-family: 'Tajawal', sans-serif; direction: rtl; }
        .cert-body:last-child { page-break-after: auto; }
        .frame-border { position: absolute; top: 8mm; left: 8mm; right: 8mm; bottom: 8mm; border: 2px solid #0891b2; border-radius: 10px; z-index: 1; background: transparent; }
        .frame-corner { position: absolute; width: 40px; height: 40px; z-index: 2; border: 6px solid #f59e0b; }
        .c-tl { top: -2px; left: -2px; border-right: none; border-bottom: none; border-radius: 10px 0 0 0; }
        .c-tr { top: -2px; right: -2px; border-left: none; border-bottom: none; border-radius: 0 10px 0 0; }
        .c-bl { bottom: -2px; left: -2px; border-right: none; border-top: none; border-radius: 0 0 0 10px; }
        .c-br { bottom: -2px; right: -2px; border-left: none; border-top: none; border-radius: 0 0 10px 0; }
        .deco-tri { position: absolute; width: 0; height: 0; opacity: 0.1; z-index: 0; }
        .tri-1 { top: 0; left: 0; border-top: 180px solid #0891b2; border-right: 180px solid transparent; }
        .tri-2 { bottom: 0; right: 0; border-bottom: 180px solid #0891b2; border-left: 180px solid transparent; }
        .content-wrapper { position: relative; width: 100%; height: 100%; z-index: 10; display: flex; flex-direction: column; align-items: center; }
        .header-container { text-align: center; margin-bottom: 5px; width: 100%; }
        .oman-logo { height: 70px; width: auto; margin-bottom: 5px; object-fit: contain; }
        .ministry-info { font-family: 'Tajawal', sans-serif; font-size: 14px; color: #444; line-height: 1.4; font-weight: bold; }
        .main-title { font-family: 'Aref Ruqaa', serif; font-size: 50px; color: #1e293b; margin: 5px 0 20px 0; position: relative; }
        .title-underline { width: 120px; height: 3px; background: #f59e0b; margin: 0 auto; border-radius: 2px; }
        .cert-text-block { font-family: 'Amiri', serif; font-size: 24px; text-align: center; line-height: 2; color: #1f2937; width: 90%; margin-top: 10px; flex-grow: 1; }
        .highlight-name { color: #0e7490; font-weight: bold; font-size: 34px; padding: 0 10px; display: inline-block; }
        .highlight-data { color: #b45309; font-weight: bold; padding: 0 5px; }
        .signatures-row { width: 100%; display: flex; justify-content: space-between; align-items: flex-end; padding: 0 60px 20px 60px; margin-top: auto; position: relative; }
        .sig-box { text-align: center; width: 250px; position: relative; z-index: 2; }
        .sig-title { font-family: 'Tajawal', sans-serif; font-size: 18px; font-weight: bold; color: #64748b; margin-bottom: 30px; }
        .sig-line { font-family: 'Amiri', serif; font-size: 20px; font-weight: bold; color: #000; border-top: 1px solid #cbd5e1; padding-top: 5px; display: block; }
        .stamp-img { position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%) rotate(-10deg); width: 110px; height: auto; opacity: 0.85; mix-blend-mode: multiply; z-index: 1; }
      `;
      element.appendChild(style);

      await generateAndSharePDF(element, `Certificates_${certClass}.pdf`, true);
  };

  // --- Summon Logic ---
  const getReasonText = () => {
    switch (reasonType) {
        case 'absence': return 'تكرار الغياب عن المدرسة وتأثيره على المستوى الدراسي';
        case 'truant': return 'التسرب المتكرر من الحصص الدراسية';
        case 'behavior': return 'مناقشة بعض السلوكيات الصادرة من الطالب';
        case 'level': return 'مناقشة تدني المستوى التحصيلي للطالب';
        case 'other': return customReason;
        default: return '';
    }
  };

  const handleAssetUpload = (key: 'stamp' | 'ministryLogo', e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setTeacherInfo(prev => ({ ...prev, [key]: reader.result as string }));
          };
          reader.readAsDataURL(file);
      }
  };

  const handleSendSummonWhatsApp = async () => {
    const student = students.find(s => s.id === summonStudentId);
    if (!student || !student.parentPhone) return alert('لا يوجد رقم هاتف');
    if (!letterRef.current) return alert('Error');

    setIsGeneratingPdf(true);
    await new Promise(r => setTimeout(r, 500)); 

    try {
        const canvas = await html2canvas(letterRef.current, { scale: 2, useCORS: true, backgroundColor: '#fff' });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 210;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        
        let pdfDataUri = pdf.output('datauristring');
        
        // --- PROVEN WHATSAPP LOGIC ---
        // تنظيف وتنسيق رقم الهاتف
        let cleanPhone = student.parentPhone.replace(/[^0-9]/g, '');
        if (cleanPhone.startsWith('00')) cleanPhone = cleanPhone.substring(2);
        if (cleanPhone.length === 8) cleanPhone = '968' + cleanPhone;
        else if (cleanPhone.length === 9 && cleanPhone.startsWith('0')) cleanPhone = '968' + cleanPhone.substring(1);

        const msg = encodeURIComponent(`السلام عليكم، مرفق خطاب استدعاء للطالب ${student.name}.`);
        
        // Mobile: Share PDF
        if (Capacitor.isNativePlatform()) {
             const base64Data = pdfDataUri.split(',')[1];
             const fileName = `Summon_${student.name}.pdf`;
             const result = await Filesystem.writeFile({ path: fileName, data: base64Data, directory: Directory.Cache });
             
             await Share.share({ 
                 title: 'خطاب استدعاء', 
                 text: `خطاب استدعاء للطالب ${student.name}`,
                 url: result.uri,
                 dialogTitle: 'إرسال عبر واتساب'
             });
        } else {
             // Web/Desktop: Download PDF and open WhatsApp
             pdf.save(`Summon_${student.name}.pdf`);
             
             // استخدام نفس المنطق القوي الموجود في التفعيل
             if (window.electron) {
                 window.electron.openExternal(`whatsapp://send?phone=${cleanPhone}&text=${msg}`);
             } else {
                 const universalUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${msg}`;
                 try {
                     window.open(universalUrl, '_blank');
                 } catch (e) {
                     window.open(universalUrl, '_blank');
                 }
             }
        }

    } catch (e) { console.error(e); alert('Error generating PDF'); } finally { setIsGeneratingPdf(false); }
  };

  if (viewingStudent) {
      return (
          <StudentReport 
              student={viewingStudent}
              onUpdateStudent={handleUpdateStudent}
              currentSemester={currentSemester}
              teacherInfo={teacherInfo}
              onBack={() => setViewingStudent(null)}
          />
      );
  }

  return (
    // ... UI Code remains mostly the same, ensuring buttons call the updated functions ...
    <div className="flex flex-col w-full max-w-5xl mx-auto space-y-6 pb-20">
      
      <div className="flex items-center gap-4 pt-4 px-2">
        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 shadow-sm border border-blue-200">
            <FileSpreadsheet size={28} />
        </div>
        <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">مركز التقارير</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">طباعة الكشوفات والتقارير والشهادات والاستدعاءات</p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
        <button onClick={() => setActiveTab('student_report')} className={`flex-1 min-w-[120px] py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'student_report' ? 'bg-indigo-600 text-white shadow-lg' : 'glass-card text-slate-600 dark:text-white/60'}`}>
            <User size={18} /> تقرير طالب
        </button>
        <button onClick={() => setActiveTab('grades_record')} className={`flex-1 min-w-[120px] py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'grades_record' ? 'bg-indigo-600 text-white shadow-lg' : 'glass-card text-slate-600 dark:text-white/60'}`}>
            <BarChart3 size={18} /> سجل الدرجات
        </button>
        <button onClick={() => setActiveTab('certificates')} className={`flex-1 min-w-[120px] py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'certificates' ? 'bg-indigo-600 text-white shadow-lg' : 'glass-card text-slate-600 dark:text-white/60'}`}>
            <Award size={18} /> شهادات التفوق
        </button>
        <button onClick={() => setActiveTab('summon')} className={`flex-1 min-w-[120px] py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'summon' ? 'bg-indigo-600 text-white shadow-lg' : 'glass-card text-slate-600 dark:text-white/60'}`}>
            <FileWarning size={18} /> استدعاء ولي أمر
        </button>
      </div>

      <div className="glass-card p-6 md:p-8 rounded-[2rem] border border-white/20 min-h-[400px]">
        
        {/* --- STUDENT REPORT TAB --- */}
        {activeTab === 'student_report' && (
            <div className="space-y-6">
                 <div className="pb-4 border-b border-white/10">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white">تقرير الطالب الشامل</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">عرض وطباعة تقرير مفصل للطالب (درجات، سلوك، غياب)</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-600 dark:text-gray-400">الفصل</label>
                        <select value={stClass} onChange={(e) => setStClass(e.target.value)} className="w-full p-3 glass-input rounded-xl text-sm font-bold outline-none">
                            {classes.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-600 dark:text-gray-400">اختر الطالب (للتقرير الفردي)</label>
                         <select value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)} className="w-full p-3 glass-input rounded-xl text-sm font-bold outline-none">
                            <option value="">اختر...</option>
                            {filteredStudentsForStudentTab.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                </div>
                
                <div className="flex flex-col md:flex-row gap-4 pt-6 justify-end">
                    <button 
                        onClick={handlePrintClassReports} 
                        disabled={isGeneratingPdf || filteredStudentsForStudentTab.length === 0} 
                        className="bg-indigo-600/10 text-indigo-600 dark:text-indigo-300 border border-indigo-500/20 disabled:opacity-50 px-6 py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 hover:bg-indigo-600/20 active:scale-95 transition-all"
                    >
                        {isGeneratingPdf ? <Printer className="animate-pulse" size={18}/> : <Users size={18} />} طباعة تقارير الفصل بالكامل
                    </button>

                    <button 
                        onClick={handleViewStudentReport}
                        disabled={!selectedStudentId} 
                        className="bg-indigo-600 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 active:scale-95 transition-all"
                    >
                        <FileText size={18} /> معاينة وطباعة التقرير الفردي
                    </button>
                </div>
            </div>
        )}

        {/* --- GRADES RECORD TAB --- */}
        {activeTab === 'grades_record' && (
            <div className="space-y-6">
                <div className="pb-4 border-b border-white/10">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white">سجل الدرجات (الفصل {currentSemester})</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">طباعة كشف درجات كامل للفصل المختار</p>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 dark:text-gray-400">الفصل الدراسي المراد طباعته</label>
                    <select value={gradesClass} onChange={(e) => setGradesClass(e.target.value)} className="w-full p-3 glass-input rounded-xl text-sm font-bold outline-none">
                        <option value="all">جميع الفصول</option>
                        {classes.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>

                <div className="flex justify-end pt-6">
                    <button 
                        onClick={handlePrintGradeReport} 
                        disabled={isGeneratingPdf} 
                        className="bg-indigo-600 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-black text-sm flex items-center gap-2 shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 active:scale-95 transition-all"
                    >
                        {isGeneratingPdf ? <Printer className="animate-pulse" size={18}/> : <Printer size={18} />} طباعة سجل الدرجات
                    </button>
                </div>
            </div>
        )}

        {/* --- CERTIFICATES TAB --- */}
        {activeTab === 'certificates' && (
            <div className="space-y-6">
                <div className="flex justify-between items-start pb-4 border-b border-white/10">
                    <div>
                        <h3 className="font-bold text-lg text-slate-800 dark:text-white">طباعة شهادات التفوق</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">اختر الطلاب لطباعة شهادات التقدير لهم دفعة واحدة</p>
                    </div>
                    <button onClick={() => setShowCertSettingsModal(true)} className="p-2 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 rounded-xl transition-colors" title="إعدادات الشهادة">
                        <Settings className="w-5 h-5" />
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-600 dark:text-gray-400">الفصل</label>
                        <select value={certClass} onChange={(e) => { setCertClass(e.target.value); setSelectedCertStudents([]); }} className="w-full p-3 glass-input rounded-xl text-sm font-bold outline-none">
                            {classes.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <label className="text-xs font-bold text-slate-600 dark:text-gray-400">تحديد الطلاب ({selectedCertStudents.length})</label>
                            <button onClick={selectAllCertStudents} className="text-[10px] text-blue-500 font-bold hover:underline">
                                {selectedCertStudents.length === filteredStudentsForCert.length ? 'إلغاء تحديد الكل' : 'تحديد الكل'}
                            </button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-60 overflow-y-auto custom-scrollbar p-1">
                            {filteredStudentsForCert.map(s => (
                                <button 
                                    key={s.id} 
                                    onClick={() => toggleCertStudent(s.id)}
                                    className={`p-2 rounded-lg border text-xs font-bold transition-all flex items-center justify-between ${selectedCertStudents.includes(s.id) ? 'bg-indigo-600 text-white border-indigo-600' : 'glass-card text-slate-600 dark:text-white/60 border-white/10'}`}
                                >
                                    {s.name}
                                    {selectedCertStudents.includes(s.id) && <Check size={14} />}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-6">
                    <button 
                        onClick={printCertificates} 
                        disabled={isGeneratingPdf || selectedCertStudents.length === 0} 
                        className="bg-amber-500 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-black text-sm flex items-center gap-2 shadow-lg shadow-amber-500/30 hover:bg-amber-600 active:scale-95 transition-all"
                    >
                        {isGeneratingPdf ? <Printer className="animate-pulse" size={18}/> : <Award size={18} />} طباعة الشهادات
                    </button>
                </div>
            </div>
        )}

        {/* --- SUMMON TAB --- */}
        {activeTab === 'summon' && (
            <div className="space-y-6">
                <div className="pb-4 border-b border-white/10">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white">استدعاء ولي أمر</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">إنشاء خطابات استدعاء رسمية ومشاركتها عبر واتساب</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-600 dark:text-gray-400">الفصل</label>
                        <select value={summonClass} onChange={(e) => setSummonClass(e.target.value)} className="w-full p-3 glass-input rounded-xl text-sm font-bold outline-none">
                            {classes.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-600 dark:text-gray-400">الطالب</label>
                        <select value={summonStudentId} onChange={(e) => setSummonStudentId(e.target.value)} className="w-full p-3 glass-input rounded-xl text-sm font-bold outline-none">
                            <option value="">اختر...</option>
                            {availableStudentsForSummon.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600 dark:text-gray-400">سبب الاستدعاء</label>
                    <div className="flex flex-wrap gap-2">
                        {[
                            { id: 'absence', label: 'تكرار الغياب' },
                            { id: 'truant', label: 'تسرب حصص' },
                            { id: 'behavior', label: 'سلوكيات' },
                            { id: 'level', label: 'تدني مستوى' },
                            { id: 'other', label: 'آخر ..' },
                        ].map((reason) => (
                            <button key={reason.id} onClick={() => setReasonType(reason.id)} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border ${reasonType === reason.id ? 'bg-rose-600 text-white border-rose-600 shadow-md' : 'glass-input text-slate-600 dark:text-gray-300'}`}>{reason.label}</button>
                        ))}
                    </div>
                    {reasonType === 'other' && (
                        <textarea value={customReason} onChange={(e) => setCustomReason(e.target.value)} placeholder="اكتب السبب..." className="w-full p-3 glass-input rounded-xl text-sm mt-2 resize-none h-20 outline-none" />
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     <div className="space-y-2"><label className="text-xs font-bold text-slate-600 dark:text-gray-400">تاريخ الإصدار</label><input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} className="w-full p-3 glass-input rounded-xl text-sm font-bold outline-none" /></div>
                     <div className="space-y-2"><label className="text-xs font-bold text-slate-600 dark:text-gray-400">تاريخ الحضور</label><input type="date" value={summonDate} onChange={(e) => setSummonDate(e.target.value)} className="w-full p-3 glass-input rounded-xl text-sm font-bold outline-none" /></div>
                     <div className="space-y-2"><label className="text-xs font-bold text-slate-600 dark:text-gray-400">وقت الحضور</label><input type="time" value={summonTime} onChange={(e) => setSummonTime(e.target.value)} className="w-full p-3 glass-input rounded-xl text-sm font-bold outline-none" /></div>
                </div>

                <div className="pt-2">
                   <button onClick={() => setShowAssetsSettings(!showAssetsSettings)} className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-indigo-600 transition-colors">
                      <Settings size={14} /> <span>إعدادات الشعار والختم</span> <ChevronDown size={12} />
                   </button>
                   {showAssetsSettings && (
                     <div className="p-4 glass-card border border-white/10 rounded-xl mt-2 grid grid-cols-2 gap-4">
                        <div className="text-center">
                            <p className="text-[10px] font-bold mb-2">شعار الوزارة</p>
                            <div className="relative h-16 glass-input rounded-lg flex items-center justify-center cursor-pointer overflow-hidden group">
                                <input type="file" accept="image/*" onChange={(e) => handleAssetUpload('ministryLogo', e)} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                                {teacherInfo.ministryLogo ? <img src={teacherInfo.ministryLogo} className="h-full object-contain"/> : <ImageIcon className="text-gray-400"/>}
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Upload className="text-white w-4 h-4"/></div>
                            </div>
                        </div>
                        <div className="text-center">
                            <p className="text-[10px] font-bold mb-2">الختم المدرسي</p>
                            <div className="relative h-16 glass-input rounded-lg flex items-center justify-center cursor-pointer overflow-hidden group">
                                <input type="file" accept="image/*" onChange={(e) => handleAssetUpload('stamp', e)} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                                {teacherInfo.stamp ? <img src={teacherInfo.stamp} className="h-full object-contain"/> : <ImageIcon className="text-gray-400"/>}
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Upload className="text-white w-4 h-4"/></div>
                            </div>
                        </div>
                     </div>
                   )}
                </div>

                <div className="flex gap-4 pt-4 border-t border-white/10">
                    <button onClick={() => setShowSummonPreview(true)} disabled={!summonStudentId} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-indigo-700 transition-all disabled:opacity-50">
                        معاينة
                    </button>
                    <button onClick={handleSendSummonWhatsApp} disabled={!summonStudentId} className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-green-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                        <Share2 size={18} /> واتساب PDF
                    </button>
                </div>
            </div>
        )}

      </div>

      {/* ... (Modals remain unchanged) ... */}
      
      {/* Hidden Render for PDF generation */}
      <div className="fixed left-[-9999px] top-0">
          <div ref={letterRef} className="bg-white w-[210mm] min-h-[297mm] p-[20mm] text-black text-right font-serif relative">
               <div className="text-center mb-8">
                    <div className="flex justify-center mb-2 h-20">
                        {teacherInfo.ministryLogo ? <img src={teacherInfo.ministryLogo} className="h-full object-contain"/> : null}
                    </div>
                    <h2 className="font-bold text-lg">سلطنة عمان</h2>
                    <h3 className="font-bold">وزارة التربية والتعليم</h3>
                    <h3 className="font-bold">مدرسة {teacherInfo.school}</h3>
                </div>
                <div className="mb-8 border-b-2 border-black pb-4">
                    <div className="flex justify-between mb-2">
                        <span className="font-bold">الفاضل/ ولي أمر الطالب: {availableStudentsForSummon.find(s=>s.id===summonStudentId)?.name}</span>
                        <span>المحترم</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-bold">الصف: {summonClass}</span>
                        <span>بتاريخ: {issueDate}</span>
                    </div>
                </div>
                <h2 className="text-center font-bold text-xl underline mb-8">استدعاء ولي أمر</h2>
                <p className="leading-loose text-lg mb-6 text-justify">
                    السلام عليكم ورحمة الله وبركاته،،،<br/>
                    نود إفادتكم بضرورة الحضور إلى المدرسة يوم <strong>{summonDate}</strong> الساعة <strong>{summonTime}</strong>، وذلك لمناقشة الأمر التالي:
                </p>
                <div className="bg-gray-50 border p-4 text-center text-xl font-bold mb-8 rounded-lg">
                    {getReasonText()}
                </div>
                <p className="leading-loose text-lg mb-12 text-justify">
                    شاكرين لكم حسن تعاونكم واهتمامكم بمصلحة الطالب.
                </p>
                <div className="flex justify-between items-end mt-20 relative">
                    <div className="text-center w-1/3">
                        <p className="font-bold mb-8">معلم المادة</p>
                        <p>{teacherInfo.name}</p>
                    </div>
                    {teacherInfo.stamp && (
                        <div className="absolute left-1/2 bottom-0 transform -translate-x-1/2 w-32 opacity-80 mix-blend-multiply">
                            <img src={teacherInfo.stamp} className="w-full" />
                        </div>
                    )}
                    <div className="text-center w-1/3">
                        <p className="font-bold mb-8">مدير المدرسة</p>
                        <p>.........................</p>
                    </div>
                </div>
          </div>
      </div>

    </div>
  );
};

export default Reports;
