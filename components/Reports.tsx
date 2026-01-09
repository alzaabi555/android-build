
import React, { useState, useMemo, useEffect } from 'react';
import { Printer, FileSpreadsheet, User, Users, Award, BarChart3, Check, Settings, Image as ImageIcon, FileWarning, Share2, Upload, ChevronDown, X, FileText, Loader2, ListChecks, Eye, Layers } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Student } from '../types';
import StudentReport from './StudentReport';
import Modal from './Modal';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import html2pdf from 'html2pdf.js';

const Reports: React.FC = () => {
  const { students, setStudents, classes, teacherInfo, setTeacherInfo, currentSemester, assessmentTools, certificateSettings, setCertificateSettings } = useApp();
  const [activeTab, setActiveTab] = useState<'student_report' | 'grades_record' | 'certificates' | 'summon'>('student_report');

  // --- Hierarchy Helpers ---
  const availableGrades = useMemo(() => {
      const grades = new Set<string>();
      students.forEach(s => {
          if (s.grade) grades.add(s.grade);
          else if (s.classes[0]) {
              const match = s.classes[0].match(/^(\d+)/);
              if (match) grades.add(match[1]);
          }
      });
      if (grades.size === 0 && classes.length > 0) return ['عام']; 
      return Array.from(grades).sort();
  }, [students, classes]);

  const getClassesForGrade = (grade: string) => {
      if (grade === 'all') return classes;
      return classes.filter(c => c.startsWith(grade));
  };

  // --- States ---
  // Student Report Tab
  const [stGrade, setStGrade] = useState<string>('all');
  const [stClass, setStClass] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);

  // Grades Record Tab
  const [gradesGrade, setGradesGrade] = useState<string>('all');
  const [gradesClass, setGradesClass] = useState<string>('all');
  
  // Certificates Tab
  const [certGrade, setCertGrade] = useState<string>('all');
  const [certClass, setCertClass] = useState<string>('');
  const [selectedCertStudents, setSelectedCertStudents] = useState<string[]>([]);
  const [showCertSettingsModal, setShowCertSettingsModal] = useState(false);
  const [tempCertSettings, setTempCertSettings] = useState(certificateSettings);
  
  // Summon Tab
  const [summonGrade, setSummonGrade] = useState<string>('all');
  const [summonClass, setSummonClass] = useState<string>('');
  const [summonStudentId, setSummonStudentId] = useState<string>('');
  const [summonDate, setSummonDate] = useState(new Date().toISOString().split('T')[0]);
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [summonTime, setSummonTime] = useState('09:00');
  const [reasonType, setReasonType] = useState('absence');
  const [customReason, setCustomReason] = useState('');
  const [showSummonPreview, setShowSummonPreview] = useState(false);
  
  // General
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Procedures Checkboxes
  const [takenProcedures, setTakenProcedures] = useState<string[]>([]);
  const availableProcedures = [
      'تنبيه شفوي للطالب',
      'تعهد خطي على الطالب',
      'إشعار ولي الأمر هاتفياً',
      'إرسال إشعار عبر الواتساب',
      'مناقشة الطالب في المستوى',
      'تحويل للأخصائي الاجتماعي'
  ];

  // --- Filtered Data ---
  const filteredStudentsForStudentTab = useMemo(() => students.filter(s => s.classes.includes(stClass)), [students, stClass]);
  const filteredStudentsForGrades = useMemo(() => students.filter(s => gradesClass === 'all' || s.classes.includes(gradesClass)), [students, gradesClass]);
  const filteredStudentsForCert = useMemo(() => students.filter(s => s.classes.includes(certClass)), [students, certClass]);
  const availableStudentsForSummon = useMemo(() => students.filter(s => s.classes.includes(summonClass)), [summonClass, students]);

  // Reset logic when hierarchy changes
  useEffect(() => { if(getClassesForGrade(stGrade).length > 0) setStClass(getClassesForGrade(stGrade)[0]); }, [stGrade]);
  useEffect(() => { if(getClassesForGrade(certGrade).length > 0) setCertClass(getClassesForGrade(certGrade)[0]); }, [certGrade]);
  useEffect(() => { if(getClassesForGrade(summonGrade).length > 0) setSummonClass(getClassesForGrade(summonGrade)[0]); }, [summonGrade]);

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

  const toggleProcedure = (proc: string) => {
      setTakenProcedures(prev => 
          prev.includes(proc) ? prev.filter(p => p !== proc) : [...prev, proc]
      );
  };

  const getGradeSymbol = (score: number) => {
      if (score >= 90) return 'أ';
      if (score >= 80) return 'ب';
      if (score >= 65) return 'ج';
      if (score >= 50) return 'د';
      return 'هـ';
  };

  // --- PDF GENERATOR ---
  const generateAndSharePDF = async (htmlContent: string, filename: string, landscape = false) => {
      setIsGeneratingPdf(true);
      
      const container = document.createElement('div');
      container.className = 'force-print-style';
      container.innerHTML = htmlContent;
      document.body.appendChild(container);

      const opt = {
          margin: [5, 5, 5, 5],
          filename: filename,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { 
              scale: 2, 
              useCORS: true, 
              logging: false,
              letterRendering: true,
              backgroundColor: '#ffffff'
          },
          jsPDF: { 
              unit: 'mm', 
              format: 'a4', 
              orientation: landscape ? 'landscape' : 'portrait' 
          },
          pagebreak: { mode: ['avoid-all', 'css', 'legacy'] } 
      };

      try {
          const worker = html2pdf().set(opt).from(container).toPdf();
          
          if (Capacitor.isNativePlatform()) {
              const pdfBase64 = await worker.output('datauristring');
              const base64Data = pdfBase64.split(',')[1];
              const result = await Filesystem.writeFile({ path: filename, data: base64Data, directory: Directory.Cache });
              await Share.share({ title: filename, url: result.uri });
          } else { 
              worker.save(); 
          }
      } catch (e) { 
          console.error('PDF Error:', e);
          alert('خطأ في إنشاء PDF'); 
      } finally { 
          if (document.body.contains(container)) document.body.removeChild(container);
          setIsGeneratingPdf(false); 
      }
  };

  // --- 1. PRINT ALL STUDENTS REPORTS (BULK) ---
  const handlePrintClassReports = async () => {
      if (filteredStudentsForStudentTab.length === 0) return alert('لا يوجد طلاب في هذا الفصل');
      
      const finalExamName = "الامتحان النهائي";
      const continuousTools = assessmentTools.filter(t => t.name.trim() !== finalExamName);
      const finalTool = assessmentTools.find(t => t.name.trim() === finalExamName);

      let allPagesHtml = '';

      filteredStudentsForStudentTab.forEach((student) => {
          // Logic from StudentReport.tsx
          const behaviors = (student.behaviors || []).filter(b => !b.semester || b.semester === (currentSemester || '1'));
          const currentSemesterGrades = (student.grades || []).filter(g => !g.semester || g.semester === (currentSemester || '1'));
          
          const totalPositive = behaviors.filter(b => b.type === 'positive').reduce((acc, b) => acc + b.points, 0);
          const totalNegative = behaviors.filter(b => b.type === 'negative').reduce((acc, b) => acc + Math.abs(b.points), 0);
          
          let continuousSum = 0;
          let continuousRows = '';
          
          if (assessmentTools.length > 0) {
              continuousTools.forEach(tool => {
                  const g = currentSemesterGrades.find(r => r.category.trim() === tool.name.trim());
                  const score = g ? Number(g.score) : 0;
                  continuousSum += score;
                  continuousRows += `
                    <tr>
                        <td style="border:1px solid #000; padding:8px; text-align:right;">${teacherInfo.subject || 'المادة'}</td>
                        <td style="border:1px solid #000; padding:8px; text-align:center; background-color:#ffedd5;">${tool.name}</td>
                        <td style="border:1px solid #000; padding:8px; text-align:center; font-weight:bold;">${g ? g.score : '-'}</td>
                    </tr>
                  `;
              });
          } else {
              currentSemesterGrades.forEach(g => {
                  continuousSum += (Number(g.score) || 0);
                  continuousRows += `
                    <tr>
                        <td style="border:1px solid #000; padding:8px; text-align:right;">${g.subject}</td>
                        <td style="border:1px solid #000; padding:8px; text-align:center;">${g.category}</td>
                        <td style="border:1px solid #000; padding:8px; text-align:center; font-weight:bold;">${g.score}</td>
                    </tr>
                  `;
              });
          }

          let finalScore = 0;
          let finalRow = '';
          if (finalTool) {
              const g = currentSemesterGrades.find(r => r.category.trim() === finalTool.name.trim());
              finalScore = g ? Number(g.score) : 0;
              finalRow = `
                <tr>
                    <td style="border:1px solid #000; padding:8px; text-align:right;">${teacherInfo.subject || 'المادة'}</td>
                    <td style="border:1px solid #000; padding:8px; text-align:center; background-color:#fce7f3;">${finalTool.name} (40)</td>
                    <td style="border:1px solid #000; padding:8px; text-align:center; font-weight:bold;">${g ? g.score : '-'}</td>
                </tr>
              `;
          }

          const totalScore = assessmentTools.length > 0 ? (continuousSum + finalScore) : continuousSum;
          const absenceCount = (student.attendance || []).filter(a => a.status === 'absent').length;
          const truantCount = (student.attendance || []).filter(a => a.status === 'truant').length;

          allPagesHtml += `
            <div style="page-break-after: always; padding: 40px; font-family: 'Tajawal', sans-serif; direction: rtl; background: white; color: black; box-sizing: border-box; height: 100vh; position: relative;">
                
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:20px; border-bottom:2px solid #eee; padding-bottom:20px;">
                    <div style="text-align:center; width:33%;">
                        <p style="margin:0; font-weight:bold;">سلطنة عمان</p>
                        <p style="margin:0; font-weight:bold;">وزارة التربية والتعليم</p>
                        <p style="margin:0; font-weight:bold; font-size:10px;">محافظة ${teacherInfo.governorate}</p>
                        <p style="margin:0; font-weight:bold; font-size:10px;">مدرسة ${teacherInfo.school}</p>
                    </div>
                    <div style="text-align:center; width:33%;">
                        ${teacherInfo.ministryLogo ? `<img src="${teacherInfo.ministryLogo}" style="height:60px; object-fit:contain;" />` : ''}
                        <h2 style="font-weight:900; text-decoration:underline; margin-top:10px;">تقرير مستوى طالب</h2>
                    </div>
                    <div style="text-align:left; width:33%; font-size:12px; font-weight:bold;">
                        <p>العام الدراسي: ${teacherInfo.academicYear}</p>
                        <p>الفصل: ${currentSemester === '1' ? 'الأول' : 'الثاني'}</p>
                        <p>التاريخ: ${new Date().toLocaleDateString('en-GB')}</p>
                    </div>
                </div>

                <div style="background:#f8fafc; border:1px solid #cbd5e1; padding:15px; border-radius:10px; margin-bottom:20px; display:flex; justify-content:space-between; align-items:center;">
                    <div style="flex:1;">
                        <div style="display:flex; gap:20px; margin-bottom:10px;">
                            <div><span style="color:#64748b; font-size:10px;">الاسم:</span> <strong style="font-size:16px;">${student.name}</strong></div>
                            <div style="width:1px; background:#cbd5e1;"></div>
                            <div><span style="color:#64748b; font-size:10px;">الصف:</span> <strong style="font-size:16px;">${student.classes[0]}</strong></div>
                        </div>
                        <div style="display:flex; gap:10px;">
                            <span style="background:#dcfce7; color:#15803d; padding:2px 8px; border-radius:4px; font-size:10px; font-weight:bold;">إيجابي: ${totalPositive}</span>
                            <span style="background:#ffe4e6; color:#be123c; padding:2px 8px; border-radius:4px; font-size:10px; font-weight:bold;">سلبي: ${totalNegative}</span>
                        </div>
                    </div>
                </div>

                <h3 style="font-weight:bold; font-size:16px; margin-bottom:10px; border-bottom:1px solid #000; padding-bottom:5px;">التحصيل الدراسي</h3>
                <table style="width:100%; border-collapse:collapse; margin-bottom:20px; font-size:12px;">
                    <thead>
                        <tr style="background:#f1f5f9;">
                            <th style="border:1px solid #000; padding:8px;">المادة</th>
                            <th style="border:1px solid #000; padding:8px;">أداة التقويم</th>
                            <th style="border:1px solid #000; padding:8px;">الدرجة</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${continuousRows}
                        <tr style="background:#eff6ff; font-weight:bold;">
                            <td colspan="2" style="border:1px solid #000; padding:8px; text-align:center;">المجموع (60)</td>
                            <td style="border:1px solid #000; padding:8px; text-align:center;">${continuousSum}</td>
                        </tr>
                        ${finalRow}
                    </tbody>
                    <tfoot>
                        <tr style="background:#f1f5f9;">
                            <td colspan="2" style="border:1px solid #000; padding:8px; font-weight:900; text-align:right;">المجموع الكلي</td>
                            <td style="border:1px solid #000; padding:8px; font-weight:900; text-align:center; font-size:14px;">${totalScore}</td>
                        </tr>
                    </tfoot>
                </table>

                <div style="display:flex; gap:15px; margin-bottom:20px;">
                    <div style="flex:1; border:1px solid #cbd5e1; padding:10px; border-radius:8px; text-align:center;">
                        <span style="display:block; font-size:10px; color:#64748b;">أيام الغياب</span>
                        <span style="font-weight:900; color:#e11d48; font-size:18px;">${absenceCount}</span>
                    </div>
                    <div style="flex:1; border:1px solid #cbd5e1; padding:10px; border-radius:8px; text-align:center;">
                        <span style="display:block; font-size:10px; color:#64748b;">الهروب (التسرب)</span>
                        <span style="font-weight:900; color:#9333ea; font-size:18px;">${truantCount}</span>
                    </div>
                </div>

                <div style="position:absolute; bottom:40px; left:40px; right:40px; display:flex; justify-content:space-between; align-items:flex-end;">
                    <div style="text-align:center;">
                        <p style="font-weight:bold; margin-bottom:30px;">معلم المادة</p>
                        <p>${teacherInfo.name}</p>
                    </div>
                    <div style="text-align:center;">
                        ${teacherInfo.stamp ? `<img src="${teacherInfo.stamp}" style="width:100px; opacity:0.7; mix-blend-mode:multiply; transform:rotate(-5deg);" />` : ''}
                    </div>
                    <div style="text-align:center;">
                        <p style="font-weight:bold; margin-bottom:30px;">مدير المدرسة</p>
                        <p>....................</p>
                    </div>
                </div>
            </div>
          `;
      });

      await generateAndSharePDF(allPagesHtml, `Class_Report_${stClass}.pdf`, false);
  };

  // --- 2. GRADES RECORD PRINT ---
  const handlePrintGradeReport = async () => {
      if (filteredStudentsForGrades.length === 0) return alert('لا يوجد طلاب في هذا الفصل');
      
      const finalExamName = "الامتحان النهائي";
      const continuousTools = assessmentTools.filter(t => t.name.trim() !== finalExamName);
      const finalTool = assessmentTools.find(t => t.name.trim() === finalExamName);

      let headerHtml = `
        <th style="width:30px;">م</th>
        <th>اسم الطالب</th>
      `;
      
      continuousTools.forEach(t => {
          headerHtml += `<th style="background-color:#ffedd5 !important; color:#000 !important;">${t.name}</th>`;
      });

      headerHtml += `
        <th style="width:60px; background-color:#dbeafe !important; color:#000 !important; border-right: 2px solid #000 !important;">المجموع (60)</th>
      `;

      if (finalTool) {
          headerHtml += `<th style="width:70px; background-color:#fce7f3 !important; color:#000 !important;">${finalTool.name} (40)</th>`;
      }

      headerHtml += `
        <th style="width:60px; background-color:#e5e7eb !important; color:#000 !important;">المجموع الكلي</th>
        <th style="width:40px;">التقدير</th>
      `;

      let rowsHtml = '';
      
      filteredStudentsForGrades.forEach((s, i) => {
          const semGrades = (s.grades || []).filter(g => (g.semester || '1') === currentSemester);
          let continuousSum = 0;
          let continuousCells = '';

          continuousTools.forEach(tool => {
              const g = semGrades.find(gr => gr.category.trim() === tool.name.trim());
              const val = g ? Number(g.score) : 0;
              continuousSum += val;
              continuousCells += `<td>${g ? g.score : '-'}</td>`;
          });

          const finalExamGrade = finalTool ? semGrades.find(gr => gr.category.trim() === finalTool.name.trim()) : null;
          const finalExamScore = finalExamGrade ? Number(finalExamGrade.score) : 0;
          const totalScore = continuousSum + finalExamScore;

          rowsHtml += `
            <tr style="page-break-inside: avoid; break-inside: avoid;">
                <td>${i + 1}</td>
                <td style="text-align: right; padding-right: 8px; font-weight:bold;">${s.name}</td>
                ${continuousCells}
                <td style="font-weight:900; background-color:#eff6ff !important; border-right: 2px solid #000 !important;">${continuousSum}</td>
                ${finalTool ? `<td style="font-weight:900; background-color:#fdf2f8 !important;">${finalExamGrade ? finalExamGrade.score : '-'}</td>` : ''}
                <td style="font-weight:900; background-color:#f3f4f6 !important;">${totalScore}</td>
                <td>${getGradeSymbol(totalScore)}</td>
            </tr>
          `;
      });

      const html = `
        <div id="report-content-print" class="force-print-style" style="padding:20px; font-family:'Tajawal', sans-serif; width:100%; color:black !important; background:white !important; direction:rtl;">
            <style>
              .force-print-style table { width: 100%; border-collapse: collapse; margin-top: 10px; border: 2px solid #000; color: #000 !important; font-size: 10px; }
              .force-print-style th { background-color: #e5e7eb; color: #000 !important; font-weight: bold; padding: 6px; border: 1px solid #000; }
              .force-print-style td { padding: 4px; border: 1px solid #000; text-align: center; color: #000 !important; }
              tr { page-break-inside: avoid !important; break-inside: avoid !important; }
              td, th { page-break-inside: avoid !important; break-inside: avoid !important; }
            </style>

            <div style="text-align:center; margin-bottom:15px; border-bottom:2px solid #000; padding-bottom:10px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                    <div style="text-align:right;">
                        <p style="margin:0; font-weight:bold;">سلطنة عمان</p>
                        <p style="margin:0; font-weight:bold;">وزارة التربية والتعليم</p>
                    </div>
                    <div>
                        <h1 style="font-size:18px; font-weight:900; margin:0; text-decoration:underline;">سجل درجات الطلاب</h1>
                    </div>
                    <div style="text-align:left;">
                        <p style="margin:0; font-weight:bold;">المادة: ${teacherInfo.subject}</p>
                        <p style="margin:0; font-weight:bold;">الصف: ${gradesClass === 'all' ? 'الكل' : gradesClass}</p>
                    </div>
                </div>
                <div style="display:flex; justify-content:center; gap:20px; font-size:12px; font-weight:bold;">
                    <span>المعلم: ${teacherInfo.name}</span>
                    <span>|</span>
                    <span>الفصل الدراسي: ${currentSemester === '1' ? 'الأول' : 'الثاني'}</span>
                </div>
            </div>
            
            <table>
                <thead><tr>${headerHtml}</tr></thead>
                <tbody>${rowsHtml}</tbody>
            </table>
            
            <div style="margin-top:30px; display:flex; justify-content:space-between; padding:0 40px; font-weight:bold; color:#000;">
                <p>توقيع المعلم: .................</p>
                <p>يعتمد مدير المدرسة: .................</p>
            </div>
        </div>
      `;

      await generateAndSharePDF(html, `Grades_Record_${gradesClass}.pdf`, true);
  };

  // --- CERTIFICATES PRINT LOGIC ---
  const printCertificates = async () => {
      const targets = filteredStudentsForCert.filter(s => selectedCertStudents.includes(s.id));
      if (targets.length === 0) return;

      let pagesHtml = '';
      
      targets.forEach((s) => {
          const placeholderRegex = /(الطالبة|الطالب)/g;
          const hasPlaceholder = placeholderRegex.test(certificateSettings.bodyText);
          let body = certificateSettings.bodyText.replace(placeholderRegex, `<span style="font-weight:900; color:#000;">${s.name}</span>`);
          
          const bgStyle = certificateSettings.backgroundImage 
            ? `background-image: url('${certificateSettings.backgroundImage}'); background-size: cover; background-position: center;` 
            : `background-color: #ffffff; border: 15px double #059669;`;

          const headerHtml = `
            <div style="width:100%; text-align:center; display:flex; flex-direction:column; align-items:center; margin-bottom:5px; color:#000;">
                ${teacherInfo.ministryLogo ? `<img src="${teacherInfo.ministryLogo}" style="height:60px; width:auto; object-fit:contain; margin-bottom:5px;" />` : ''}
                <h3 style="font-weight:bold; font-size:14px; margin:1px;">سلطنة عمان</h3>
                <h3 style="font-weight:bold; font-size:14px; margin:1px;">وزارة التربية والتعليم</h3>
                <h3 style="font-weight:bold; font-size:14px; margin:1px;">مدرسة ${teacherInfo.school}</h3>
            </div>
          `;

          pagesHtml += `
            <div class="force-print-style" style="width:100%; height:100vh; position:relative; ${bgStyle} padding:20px; box-sizing:border-box; display:flex; flex-direction:column; align-items:center; text-align:center; page-break-after: always; color:#000000 !important; background-color:#fff;">
                ${!certificateSettings.backgroundImage ? `
                    <div style="position:absolute; top:25px; left:25px; right:25px; bottom:25px; border: 2px solid #059669; pointer-events:none;"></div>
                    <div style="position:absolute; top:20px; left:20px; width:50px; height:50px; border-top:5px solid #059669; border-left:5px solid #059669;"></div>
                    <div style="position:absolute; top:20px; right:20px; width:50px; height:50px; border-top:5px solid #059669; border-right:5px solid #059669;"></div>
                    <div style="position:absolute; bottom:20px; left:20px; width:50px; height:50px; border-bottom:5px solid #059669; border-left:5px solid #059669;"></div>
                    <div style="position:absolute; bottom:20px; right:20px; width:50px; height:50px; border-bottom:5px solid #059669; border-right:5px solid #059669;"></div>
                ` : ''}
                
                <div style="z-index:10; width:95%; height:100%; display:flex; flex-direction:column; justify-content:flex-start; background:rgba(255,255,255,0.92); padding:30px; padding-top:10px; border-radius:30px; box-shadow:none; color: #000000 !important;">
                    ${headerHtml}
                    <div style="flex:1; display:flex; flex-direction:column; justify-content:center; align-items:center; margin-top:-20px;">
                        <h1 style="font-size:48px; color:#047857 !important; margin-bottom:15px; font-weight:900; font-family:'Tajawal', serif;">${certificateSettings.title}</h1>
                        
                        ${!hasPlaceholder ? `<h2 style="font-size:42px; color:#000000 !important; margin:10px 0 20px 0; font-weight:900; text-decoration:underline; text-decoration-color:#059669; text-underline-offset: 8px;">${s.name}</h2>` : ''}

                        <p style="font-size:24px; line-height:1.6; margin-bottom:20px; font-weight:bold; color:#374151 !important; max-width:80%;">${body}</p>
                    </div>
                    
                    <div style="margin-top:20px; display:flex; justify-content:space-between; width:100%; padding:0 20px; color: #000000 !important; align-items:flex-end;">
                        <div style="text-align:center; width:30%;">
                            <p style="font-size:18px; color:#000000 !important; margin-bottom:40px; font-weight:bold;">معلم المادة</p>
                            <p style="font-size:20px; font-weight:900; color:#000000 !important;">${teacherInfo.name}</p>
                        </div>
                        <div style="text-align:center; width:40%;">
                            ${teacherInfo.stamp ? `<img src="${teacherInfo.stamp}" style="width:120px; opacity:0.8; mix-blend-mode:multiply; transform: rotate(-10deg);" />` : ''}
                        </div>
                        <div style="text-align:center; width:30%;">
                            <p style="font-size:18px; color:#000000 !important; margin-bottom:40px; font-weight:bold;">مدير المدرسة</p>
                            <p style="font-size:20px; font-weight:900; color:#000000 !important;">....................</p>
                        </div>
                    </div>
                </div>
            </div>
          `;
      });

      await generateAndSharePDF(pagesHtml, `Certificates.pdf`, true);
  };

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

  // --- 3. SUMMON LETTER PRINT LOGIC ---
  const handlePrintSummon = async () => {
      const studentName = availableStudentsForSummon.find(s=>s.id===summonStudentId)?.name || '';
      if (!studentName) { alert('يرجى اختيار الطالب أولاً'); return; }

      const proceduresHtml = takenProcedures.length > 0 
        ? `<div style="margin-top:20px; text-align:right; border:1px dashed #000; padding:15px; border-radius:10px;">
             <p style="font-weight:bold; text-decoration:underline; margin-bottom:10px;">الإجراءات المتخذة مسبقاً مع الطالب:</p>
             <ul style="list-style-type:disc; padding-right:20px; margin:0;">
                ${takenProcedures.map(p => `<li style="margin-bottom:5px;">${p}</li>`).join('')}
             </ul>
           </div>` 
        : '';

      const html = `
        <div class="force-print-style" style="padding:50px; font-family:'Tajawal', serif; color:#000000 !important; background:#ffffff !important; direction:rtl; text-align:right; width:100%; height:100%;">
            <div style="text-align:center; margin-bottom:40px;">
                ${teacherInfo.ministryLogo ? `<img src="${teacherInfo.ministryLogo}" style="width:60px; height:auto; margin:0 auto 15px auto; display:block;" />` : ''}
                <h3 style="font-weight:bold; font-size:16px; margin:5px; color:#000000 !important;">سلطنة عمان</h3>
                <h3 style="font-weight:bold; font-size:16px; margin:5px; color:#000000 !important;">وزارة التربية والتعليم</h3>
                <h3 style="font-weight:bold; font-size:16px; margin:5px; color:#000000 !important;">مدرسة ${teacherInfo.school}</h3>
            </div>
            
            <div style="border-bottom:2px solid #000; padding-bottom:20px; margin-bottom:30px; color: #000000 !important;">
                <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                    <span style="font-weight:bold; font-size:18px; color:#000000 !important;">الفاضل/ ولي أمر الطالب: ${studentName}</span>
                    <span style="font-size:18px; color:#000000 !important;">المحترم</span>
                </div>
                <div style="display:flex; justify-content:space-between;">
                    <span style="font-weight:bold; font-size:16px; color:#000000 !important;">الصف: ${summonClass}</span>
                    <span style="font-size:16px; color:#000000 !important;">التاريخ: ${issueDate}</span>
                </div>
            </div>

            <h2 style="text-align:center; font-weight:900; font-size:24px; text-decoration:underline; margin-bottom:30px; color:#000000 !important;">استدعاء ولي أمر</h2>
            
            <p style="line-height:2.2; font-size:18px; text-align:justify; margin-bottom:20px; color:#000000 !important;">
                السلام عليكم ورحمة الله وبركاته،،،<br/>
                نود إفادتكم بضرورة الحضور إلى المدرسة يوم <strong>${summonDate}</strong> الساعة <strong>${summonTime}</strong>، وذلك لمناقشة الأمر التالي:
            </p>
            
            <div style="background:#f9f9f9; border:1px solid #000; padding:20px; text-align:center; font-size:20px; font-weight:bold; margin-bottom:30px; border-radius:10px; color:#000000 !important;">
                ${getReasonText()}
            </div>

            ${proceduresHtml}
            
            <p style="line-height:2; font-size:18px; text-align:justify; margin-top:30px; margin-bottom:50px; color:#000000 !important;">
                شاكرين لكم حسن تعاونكم واهتمامكم بمصلحة الطالب.
            </p>
            
            <div style="display:flex; justify-content:space-between; margin-top:80px; padding:0 20px; color: #000000 !important; align-items:flex-end; position:relative;">
                <div style="text-align:center; width:30%;">
                    <p style="font-weight:bold; font-size:18px; margin-bottom:40px; color:#000000 !important;">معلم المادة</p>
                    <p style="font-size:18px; color:#000000 !important;">${teacherInfo.name}</p>
                </div>
                <div style="text-align:center; width:40%; display: flex; justify-content: center; align-items: center;">
                    ${teacherInfo.stamp ? `<img src="${teacherInfo.stamp}" style="width:130px; opacity:0.8; mix-blend-mode:multiply; transform: rotate(-10deg);" />` : ''}
                </div>
                <div style="text-align:center; width:30%;">
                    <p style="font-weight:bold; font-size:18px; margin-bottom:40px; color:#000000 !important;">مدير المدرسة</p>
                    <p style="font-size:18px; color:#000000 !important;">.........................</p>
                </div>
            </div>
        </div>
      `;
      
      await generateAndSharePDF(html, `Summon_${studentName}.pdf`, false);
  };

  const handleSendSummonWhatsApp = async () => {
    const student = availableStudentsForSummon.find(s => s.id === summonStudentId);
    if (!student || !student.parentPhone) {
        alert('لا يوجد رقم هاتف مسجل لولي الأمر');
        return;
    }

    let cleanPhone = student.parentPhone.replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length < 5) {
        alert('رقم الهاتف غير صحيح');
        return;
    }
    
    if (cleanPhone.startsWith('00')) cleanPhone = cleanPhone.substring(2);
    if (cleanPhone.length === 8) cleanPhone = '968' + cleanPhone;
    else if (cleanPhone.length === 9 && cleanPhone.startsWith('0')) cleanPhone = '968' + cleanPhone.substring(1);

    const msg = encodeURIComponent(`السلام عليكم، ولي أمر الطالب ${student.name}.\nنود إفادتكم بضرورة الحضور للمدرسة يوم ${summonDate} الساعة ${summonTime}.\nالسبب: ${getReasonText()}`);

    if (window.electron) {
        window.electron.openExternal(`whatsapp://send?phone=${cleanPhone}&text=${msg}`);
    } else {
        const universalUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${msg}`;
        try {
            if (Capacitor.isNativePlatform()) {
                await Browser.open({ url: universalUrl });
            } else {
                window.open(universalUrl, '_blank');
            }
        } catch (e) {
            window.open(universalUrl, '_blank');
        }
    }
  };

  const tabItems = [
    { id: 'student_report', label: 'تقرير طالب', icon: User, color: 'text-indigo-400', bg: 'bg-indigo-900/20', border: 'border-indigo-500/30' },
    { id: 'grades_record', label: 'سجل الدرجات', icon: BarChart3, color: 'text-amber-400', bg: 'bg-amber-900/20', border: 'border-amber-500/30' },
    { id: 'certificates', label: 'الشهادات', icon: Award, color: 'text-emerald-400', bg: 'bg-emerald-900/20', border: 'border-emerald-500/30' },
    { id: 'summon', label: 'استدعاء ولي أمر', icon: FileWarning, color: 'text-rose-400', bg: 'bg-rose-900/20', border: 'border-rose-500/30' },
  ];
  
  if (viewingStudent) {
      return <StudentReport student={viewingStudent} onUpdateStudent={handleUpdateStudent} currentSemester={currentSemester} teacherInfo={teacherInfo} onBack={() => setViewingStudent(null)} />;
  }

  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4 pt-4 px-2 mb-2">
        <div className="w-14 h-14 glass-icon rounded-2xl flex items-center justify-center text-rose-500 shadow-lg border border-rose-500/20"><FileSpreadsheet size={30} /></div>
        <div><h2 className="text-3xl font-black text-white tracking-tight">مركز التقارير</h2><p className="text-gray-400 text-xs font-bold mt-1">طباعة الكشوفات والشهادات والاستدعاءات</p></div>
      </div>

      <div className="grid grid-cols-2 gap-3 px-1">
        {tabItems.map((item) => (
            <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`flex items-center gap-4 p-4 rounded-[1.5rem] transition-all duration-300 border group shimmer-hover ${activeTab === item.id ? 'glass-heavy border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.15)] scale-[1.02]' : 'glass-card border-white/5 hover:bg-white/5 opacity-70 hover:opacity-100'}`}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border backdrop-blur-xl transition-all duration-500 group-hover:scale-110 ${activeTab === item.id ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg' : `${item.bg} ${item.color} ${item.border}`}`}><item.icon size={24} strokeWidth={2} /></div>
                <div className="text-right"><span className={`block font-black text-sm transition-colors ${activeTab === item.id ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>{item.label}</span></div>
            </button>
        ))}
      </div>

      <div className="glass-card p-6 md:p-8 rounded-[2.5rem] border border-white/10 min-h-[400px] shadow-xl relative overflow-hidden transition-all duration-500 bg-[#1f2937]">
        {activeTab === 'student_report' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                 <div className="pb-4 border-b border-white/10 flex items-center gap-3"><div className="p-2 bg-indigo-900/30 rounded-xl text-indigo-400"><User size={20}/></div><div><h3 className="font-black text-lg text-white">تقرير الطالب الشامل</h3><p className="text-gray-400 text-xs font-bold">عرض وطباعة تقرير مفصل</p></div></div>
                
                {/* Hierarchy Filter */}
                <div className="space-y-4">
                    {availableGrades.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                            <button onClick={() => setStGrade('all')} className={`px-4 py-1.5 text-[10px] font-bold whitespace-nowrap rounded-xl transition-all border ${stGrade === 'all' ? 'bg-indigo-600 text-white border-indigo-700' : 'glass-card bg-[#374151] border-gray-600 text-gray-300'}`}>كل المراحل</button>
                            {availableGrades.map(g => (
                                <button key={g} onClick={() => setStGrade(g)} className={`px-4 py-1.5 text-[10px] font-bold whitespace-nowrap rounded-xl transition-all border ${stGrade === g ? 'bg-indigo-600 text-white border-indigo-700' : 'glass-card bg-[#374151] border-gray-600 text-gray-300'}`}>صف {g}</button>
                            ))}
                        </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 mr-2">الفصل الدراسي</label><div className="relative"><select value={stClass} onChange={(e) => setStClass(e.target.value)} className="w-full p-4 glass-input rounded-2xl text-sm font-bold outline-none appearance-none cursor-pointer text-white bg-[#111827]">{getClassesForGrade(stGrade).map(c => <option key={c} value={c}>{c}</option>)}</select><ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" /></div></div>
                        <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 mr-2">الطالب</label><div className="relative"><select value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)} className="w-full p-4 glass-input rounded-2xl text-sm font-bold outline-none appearance-none cursor-pointer text-white bg-[#111827]"><option value="">اختر طالباً...</option>{filteredStudentsForStudentTab.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select><ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" /></div></div>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 pt-6 justify-end border-t border-white/10 mt-4">
                    <button onClick={handlePrintClassReports} disabled={isGeneratingPdf || !stClass} className="bg-[#374151] text-white border border-gray-500 px-6 py-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-lg hover:bg-[#4b5563] active:scale-95 transition-all">
                        {isGeneratingPdf ? <Loader2 className="animate-spin w-4 h-4"/> : <Layers size={18} />} طباعة تقارير الفصل ({stClass})
                    </button>
                    <button onClick={handleViewStudentReport} disabled={!selectedStudentId} className="bg-indigo-600 disabled:opacity-50 text-white px-8 py-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 active:scale-95 transition-all">
                        <FileText size={18} /> معاينة التقرير الفردي
                    </button>
                </div>
            </div>
        )}
        {activeTab === 'grades_record' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="pb-4 border-b border-white/10 flex items-center gap-3"><div className="p-2 bg-amber-900/30 rounded-xl text-amber-400"><BarChart3 size={20}/></div><div><h3 className="font-black text-lg text-white">سجل الدرجات</h3><p className="text-gray-400 text-xs font-bold">طباعة كشف درجات كامل</p></div></div>
                <div className="space-y-4">
                    {availableGrades.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                            <button onClick={() => { setGradesGrade('all'); setGradesClass('all'); }} className={`px-4 py-1.5 text-[10px] font-bold whitespace-nowrap rounded-xl transition-all border ${gradesGrade === 'all' ? 'bg-amber-600 text-white border-amber-700' : 'glass-card bg-[#374151] border-gray-600 text-gray-300'}`}>كل المراحل</button>
                            {availableGrades.map(g => (
                                <button key={g} onClick={() => { setGradesGrade(g); setGradesClass('all'); }} className={`px-4 py-1.5 text-[10px] font-bold whitespace-nowrap rounded-xl transition-all border ${gradesGrade === g ? 'bg-amber-600 text-white border-amber-700' : 'glass-card bg-[#374151] border-gray-600 text-gray-300'}`}>صف {g}</button>
                            ))}
                        </div>
                    )}
                    <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 mr-2">الفصل الدراسي</label><div className="relative"><select value={gradesClass} onChange={(e) => setGradesClass(e.target.value)} className="w-full p-4 glass-input rounded-2xl text-sm font-bold outline-none appearance-none cursor-pointer text-white bg-[#111827]"><option value="all">جميع الفصول</option>{getClassesForGrade(gradesGrade).map(c => <option key={c} value={c}>{c}</option>)}</select><ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" /></div></div>
                </div>
                <div className="flex justify-end pt-6"><button onClick={handlePrintGradeReport} disabled={isGeneratingPdf} className="bg-amber-500 disabled:opacity-50 text-white px-8 py-4 rounded-2xl font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/30 hover:bg-amber-600 active:scale-95 transition-all w-full md:w-auto justify-center">{isGeneratingPdf ? <Loader2 className="animate-spin w-4 h-4"/> : <Printer size={18} />} طباعة السجل</button></div>
            </div>
        )}
        {activeTab === 'certificates' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex justify-between items-start pb-4 border-b border-white/10"><div className="flex items-center gap-3"><div className="p-2 bg-emerald-900/30 rounded-xl text-emerald-400"><Award size={20}/></div><div><h3 className="font-black text-lg text-white">شهادات التفوق</h3><p className="text-gray-400 text-xs font-bold">طباعة شهادات تقدير</p></div></div><button onClick={() => setShowCertSettingsModal(true)} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-white"><Settings className="w-5 h-5" /></button></div>
                <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-4">
                        {availableGrades.length > 0 && (
                            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                                <button onClick={() => setCertGrade('all')} className={`px-4 py-1.5 text-[10px] font-bold whitespace-nowrap rounded-xl transition-all border ${certGrade === 'all' ? 'bg-emerald-600 text-white border-emerald-700' : 'glass-card bg-[#374151] border-gray-600 text-gray-300'}`}>كل المراحل</button>
                                {availableGrades.map(g => (
                                    <button key={g} onClick={() => setCertGrade(g)} className={`px-4 py-1.5 text-[10px] font-bold whitespace-nowrap rounded-xl transition-all border ${certGrade === g ? 'bg-emerald-600 text-white border-emerald-700' : 'glass-card bg-[#374151] border-gray-600 text-gray-300'}`}>صف {g}</button>
                                ))}
                            </div>
                        )}
                        <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 mr-2">الفصل الدراسي</label><div className="relative"><select value={certClass} onChange={(e) => { setCertClass(e.target.value); setSelectedCertStudents([]); }} className="w-full p-4 glass-input rounded-2xl text-sm font-bold outline-none appearance-none cursor-pointer text-white bg-[#111827]">{getClassesForGrade(certGrade).map(c => <option key={c} value={c}>{c}</option>)}</select><ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" /></div></div>
                    </div>
                    <div className="space-y-2"><div className="flex justify-between items-center px-2"><label className="text-[10px] font-black text-gray-400">تحديد الطلاب ({selectedCertStudents.length})</label><button onClick={selectAllCertStudents} className="text-[10px] text-emerald-400 font-bold hover:underline">{selectedCertStudents.length === filteredStudentsForCert.length ? 'إلغاء الكل' : 'تحديد الكل'}</button></div><div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-60 overflow-y-auto custom-scrollbar p-1">{filteredStudentsForCert.map(s => (<button key={s.id} onClick={() => toggleCertStudent(s.id)} className={`p-3 rounded-xl border text-[10px] font-bold transition-all flex items-center justify-between group ${selectedCertStudents.includes(s.id) ? 'bg-emerald-600 text-white border-emerald-500 shadow-md' : 'glass-card text-white/70 border-white/10 hover:bg-white/10'}`}>{s.name}{selectedCertStudents.includes(s.id) && <Check size={14} className="bg-white/20 rounded-full p-0.5" />}</button>))}</div></div>
                </div>
                <div className="flex justify-end pt-6 border-t border-white/10 mt-2"><button onClick={printCertificates} disabled={isGeneratingPdf || selectedCertStudents.length === 0} className="bg-emerald-600 disabled:opacity-50 text-white px-8 py-4 rounded-2xl font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/30 hover:bg-emerald-700 active:scale-95 transition-all w-full md:w-auto justify-center">{isGeneratingPdf ? <Loader2 className="animate-spin w-4 h-4"/> : <Award size={18} />} طباعة الشهادات</button></div>
            </div>
        )}
        {activeTab === 'summon' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="pb-4 border-b border-white/10 flex items-center gap-3"><div className="p-2 bg-rose-900/30 rounded-xl text-rose-400"><FileWarning size={20}/></div><div><h3 className="font-black text-lg text-white">استدعاء ولي أمر</h3><p className="text-gray-400 text-xs font-bold">إنشاء خطاب رسمي</p></div></div>
                <div className="space-y-4">
                    {availableGrades.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                            <button onClick={() => setSummonGrade('all')} className={`px-4 py-1.5 text-[10px] font-bold whitespace-nowrap rounded-xl transition-all border ${summonGrade === 'all' ? 'bg-rose-600 text-white border-rose-700' : 'glass-card bg-[#374151] border-gray-600 text-gray-300'}`}>كل المراحل</button>
                            {availableGrades.map(g => (
                                <button key={g} onClick={() => setSummonGrade(g)} className={`px-4 py-1.5 text-[10px] font-bold whitespace-nowrap rounded-xl transition-all border ${summonGrade === g ? 'bg-rose-600 text-white border-rose-700' : 'glass-card bg-[#374151] border-gray-600 text-gray-300'}`}>صف {g}</button>
                            ))}
                        </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 mr-2">الفصل</label><div className="relative"><select value={summonClass} onChange={(e) => setSummonClass(e.target.value)} className="w-full p-4 glass-input rounded-2xl text-sm font-bold outline-none appearance-none cursor-pointer text-white bg-[#111827]">{getClassesForGrade(summonGrade).map(c => <option key={c} value={c}>{c}</option>)}</select><ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" /></div></div>
                        <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 mr-2">الطالب</label><div className="relative"><select value={summonStudentId} onChange={(e) => setSummonStudentId(e.target.value)} className="w-full p-4 glass-input rounded-2xl text-sm font-bold outline-none appearance-none cursor-pointer text-white bg-[#111827]"><option value="">اختر...</option>{availableStudentsForSummon.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select><ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" /></div></div>
                    </div>
                </div>
                <div className="space-y-2"><label className="text-[10px] font-black text-gray-400 mr-2">سبب الاستدعاء</label><div className="flex flex-wrap gap-2">{[{ id: 'absence', label: 'تكرار الغياب' }, { id: 'truant', label: 'تسرب حصص' }, { id: 'behavior', label: 'سلوكيات' }, { id: 'level', label: 'تدني مستوى' }, { id: 'other', label: 'آخر ..' }].map((reason) => (<button key={reason.id} onClick={() => setReasonType(reason.id)} className={`px-4 py-2.5 rounded-xl text-[10px] font-black transition-all border ${reasonType === reason.id ? 'bg-rose-600 text-white border-rose-600 shadow-md transform scale-105' : 'glass-input text-gray-300 border-transparent hover:bg-white/10'}`}>{reason.label}</button>))}</div>{reasonType === 'other' && (<textarea value={customReason} onChange={(e) => setCustomReason(e.target.value)} placeholder="اكتب السبب هنا..." className="w-full p-4 glass-input rounded-2xl text-sm mt-2 resize-none h-24 outline-none border border-white/10 focus:border-rose-500 transition-colors text-white" />)}</div>
                <div className="space-y-2 border-t border-white/10 pt-4"><label className="text-[10px] font-black text-gray-400 mr-2 flex items-center gap-2"><ListChecks className="w-3 h-3" /> الإجراءات المتخذة مسبقاً</label><div className="grid grid-cols-2 gap-2">{availableProcedures.map((proc) => (<button key={proc} onClick={() => toggleProcedure(proc)} className={`p-3 rounded-xl text-[10px] font-bold text-right transition-all border flex items-center justify-between ${takenProcedures.includes(proc) ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200' : 'glass-card border-white/5 text-gray-400 hover:bg-white/5'}`}>{proc}{takenProcedures.includes(proc) && <Check className="w-3 h-3 text-indigo-400" />}</button>))}</div></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 mr-2">تاريخ الإصدار</label><input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} className="w-full p-3 glass-input rounded-xl text-xs font-bold outline-none text-white bg-[#111827]" /></div>
                     <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 mr-2">تاريخ الحضور</label><input type="date" value={summonDate} onChange={(e) => setSummonDate(e.target.value)} className="w-full p-3 glass-input rounded-xl text-xs font-bold outline-none text-white bg-[#111827]" /></div>
                     <div className="space-y-1"><label className="text-[10px] font-black text-gray-400 mr-2">وقت الحضور</label><input type="time" value={summonTime} onChange={(e) => setSummonTime(e.target.value)} className="w-full p-3 glass-input rounded-xl text-xs font-bold outline-none text-white bg-[#111827]" /></div>
                </div>
                <div className="flex gap-4 pt-6 border-t border-white/10 mt-2"><button onClick={() => setShowSummonPreview(true)} disabled={!summonStudentId} className="flex-1 py-4 bg-[#374151] border border-gray-600 text-white rounded-2xl font-black text-xs shadow-lg hover:bg-[#4b5563] transition-all disabled:opacity-50 flex items-center justify-center gap-2"><Eye size={18} /> معاينة الخطاب</button><button onClick={handleSendSummonWhatsApp} disabled={!summonStudentId} className="flex-1 py-4 bg-[#25D366] text-white rounded-2xl font-black text-xs shadow-lg shadow-green-500/30 hover:bg-[#128C7E] transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95"><Share2 size={18} /> إرسال واتساب</button></div>
            </div>
        )}
      </div>

      {showSummonPreview && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setShowSummonPreview(false)}>
            <div className="bg-white w-full max-w-4xl h-[90vh] rounded-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b flex justify-between items-center text-black bg-gray-50"><h3 className="font-bold">معاينة الخطاب</h3><div className="flex gap-2"><button onClick={handlePrintSummon} className="p-2 bg-indigo-600 text-white rounded-lg flex items-center gap-2 text-xs font-bold shadow-md hover:bg-indigo-700"><Printer size={16} /> طباعة PDF</button><button onClick={() => setShowSummonPreview(false)} className="p-2 hover:bg-gray-200 rounded-full"><X size={24}/></button></div></div>
                <div className="flex-1 overflow-auto bg-gray-200 p-8 flex justify-center">
                    <div id="report-content-print" className="force-print-style text-black" style={{backgroundColor: 'white', color: 'black', width: '210mm', minHeight: '297mm', padding: '20mm', textAlign: 'right', fontFamily: 'serif', position: 'relative', border: '4px solid black', boxSizing: 'border-box'}}>
                       <div style={{textAlign:'center', marginBottom:'40px'}}>{teacherInfo.ministryLogo && <img src={teacherInfo.ministryLogo} style={{width:'60px', height:'auto', margin:'0 auto 15px auto', display:'block'}} alt="Logo" />}<h3 style={{fontWeight:'bold', fontSize:'16px', margin:'5px'}}>سلطنة عمان</h3><h3 style={{fontWeight:'bold', fontSize:'16px', margin:'5px'}}>وزارة التربية والتعليم</h3><h3 style={{fontWeight:'bold', fontSize:'16px', margin:'5px'}}>مدرسة {teacherInfo.school}</h3></div>
                       <div style={{marginBottom: '2rem', borderBottom: '2px solid black', paddingBottom: '1rem'}}><div style={{display:'flex', justifyContent:'space-between', marginBottom:'10px'}}><span style={{fontWeight:'bold', fontSize:'18px'}}>الفاضل/ ولي أمر الطالب: {availableStudentsForSummon.find(s=>s.id===summonStudentId)?.name}</span><span style={{fontSize:'18px'}}>المحترم</span></div><div style={{display:'flex', justifyContent:'space-between'}}><span style={{fontWeight:'bold', fontSize:'16px'}}>الصف: {summonClass}</span><span style={{fontSize:'16px'}}>التاريخ: {issueDate}</span></div></div>
                       <h2 style={{textAlign: 'center', fontWeight: 'bold', fontSize: '1.25rem', textDecoration: 'underline', marginBottom: '2rem'}}>استدعاء ولي أمر</h2>
                       <p style={{lineHeight: '2', fontSize: '1.125rem', marginBottom: '1.5rem', textAlign: 'justify'}}>السلام عليكم ورحمة الله وبركاته...<br/>نود إفادتكم بضرورة الحضور إلى المدرسة يوم <strong>{summonDate}</strong> الساعة <strong>{summonTime}</strong>.</p>
                       <div style={{background: '#f9f9f9', border: '1px solid black', padding: '20px', textAlign: 'center', fontWeight: 'bold', marginBottom: '30px'}}>{getReasonText()}</div>
                       {takenProcedures.length > 0 && (<div style={{marginTop:'20px', textAlign:'right', border:'1px dashed #000', padding:'15px', borderRadius:'10px'}}><p style={{fontWeight:'bold', textDecoration:'underline', marginBottom:'10px'}}>الإجراءات المتخذة مسبقاً:</p><ul style={{listStyleType:'disc', paddingRight:'20px', margin:0}}>{takenProcedures.map(p => <li key={p} style={{marginBottom:'5px'}}>{p}</li>)}</ul></div>)}
                       <div style={{display:'flex', justifyContent:'space-between', marginTop:'80px', padding:'0 20px', position:'relative', alignItems:'flex-end'}}><div style={{textAlign:'center', width:'30%'}}><p style={{fontWeight:'bold', fontSize:'18px', marginBottom:'40px'}}>معلم المادة</p><p style={{fontSize:'18px'}}>{teacherInfo.name}</p></div><div style={{textAlign:'center', width:'40%', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>{teacherInfo.stamp && <img src={teacherInfo.stamp} style={{width:'130px', opacity:0.8, mixBlendMode:'multiply', transform: 'rotate(-10deg)'}} alt="Stamp" />}</div><div style={{textAlign:'center', width:'30%'}}><p style={{fontWeight:'bold', fontSize:'18px', marginBottom:'40px'}}>مدير المدرسة</p><p style={{fontSize:'18px'}}>.........................</p></div></div>
                    </div>
                </div>
            </div>
        </div>
      )}

      <Modal isOpen={showCertSettingsModal} onClose={() => setShowCertSettingsModal(false)} className="max-w-md rounded-[2rem]">
          <div className="text-center"><h3 className="font-black text-lg mb-4 text-white">إعدادات الشهادة</h3><div className="space-y-3"><div><label className="block text-xs font-bold text-gray-400 mb-1 text-right">عنوان الشهادة</label><input type="text" value={tempCertSettings.title} onChange={(e) => setTempCertSettings({...tempCertSettings, title: e.target.value})} className="w-full p-3 glass-input rounded-xl text-sm font-bold outline-none text-white bg-[#111827]" /></div><div><label className="block text-xs font-bold text-gray-400 mb-1 text-right">نص الشهادة</label><textarea value={tempCertSettings.bodyText} onChange={(e) => setTempCertSettings({...tempCertSettings, bodyText: e.target.value})} className="w-full p-3 glass-input rounded-xl text-sm font-bold outline-none h-24 resize-none text-white bg-[#111827]" /></div><div className="flex gap-2 mt-4 pt-2"><button onClick={() => setShowCertSettingsModal(false)} className="flex-1 py-3 text-gray-400 font-bold text-xs hover:bg-white/5 rounded-xl">إلغاء</button><button onClick={handleSaveCertSettings} className="flex-[2] py-3 bg-indigo-600 text-white rounded-xl font-black text-sm shadow-lg">حفظ الإعدادات</button></div></div></div>
      </Modal>
    </div>
  );
};

export default Reports;
