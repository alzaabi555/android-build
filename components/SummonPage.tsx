
import React, { useState, useMemo, useRef } from 'react';
import { MailWarning, Printer, CalendarClock, User, Share2, Eye, X, FileWarning, Settings, Image as ImageIcon, Upload, Trash2, ChevronDown } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const SummonPage: React.FC = () => {
  const { students, classes, teacherInfo, setTeacherInfo } = useApp();
  
  const [selectedClass, setSelectedClass] = useState<string>(classes[0] || '');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  const [summonDate, setSummonDate] = useState(new Date().toISOString().split('T')[0]);
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [summonTime, setSummonTime] = useState('09:00');
  const [reasonType, setReasonType] = useState('absence');
  const [customReason, setCustomReason] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showAssetsSettings, setShowAssetsSettings] = useState(false);

  const letterRef = useRef<HTMLDivElement>(null);

  const availableStudents = useMemo(() => students.filter(s => s.classes.includes(selectedClass)), [selectedClass, students]);

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

  const handleSendWhatsApp = async () => {
    const student = students.find(s => s.id === selectedStudentId);
    if (!student || !student.parentPhone) return alert('لا يوجد رقم هاتف');
    if (!letterRef.current) return alert('Error');

    setIsGeneratingPdf(true);
    await new Promise(r => setTimeout(r, 500)); // Wait for render

    try {
        const canvas = await html2canvas(letterRef.current, { scale: 2, useCORS: true, backgroundColor: '#fff' });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 210;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        
        let pdfDataUri = pdf.output('datauristring');

        // --- PROVEN ROBUST WHATSAPP LOGIC ---
        let cleanPhone = student.parentPhone.replace(/[^0-9]/g, '');
        if (cleanPhone.startsWith('00')) cleanPhone = cleanPhone.substring(2);
        if (cleanPhone.length === 8) cleanPhone = '968' + cleanPhone;
        else if (cleanPhone.length === 9 && cleanPhone.startsWith('0')) cleanPhone = '968' + cleanPhone.substring(1);

        const msg = encodeURIComponent(`السلام عليكم، مرفق خطاب استدعاء للطالب ${student.name}.`);
        
        if (Capacitor.isNativePlatform()) {
             const base64Data = pdfDataUri.split(',')[1];
             const fileName = `Summon_${student.name}.pdf`;
             const result = await Filesystem.writeFile({ path: fileName, data: base64Data, directory: Directory.Cache });
             
             // Share the PDF directly via system share sheet (User picks WhatsApp)
             await Share.share({ 
                 title: 'خطاب استدعاء', 
                 text: `خطاب استدعاء للطالب ${student.name}`,
                 url: result.uri,
                 dialogTitle: 'إرسال عبر واتساب'
             });
        } else {
             // Web/Desktop
             pdf.save(`Summon_${student.name}.pdf`);
             
             if (window.electron) {
                 window.electron.openExternal(`whatsapp://send?phone=${cleanPhone}&text=${msg}`);
             } else {
                 const url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${msg}`;
                 try {
                     window.open(url, '_blank');
                 } catch (e) {
                     window.open(url, '_blank');
                 }
             }
        }

    } catch (e) { console.error(e); alert('Error generating PDF'); } finally { setIsGeneratingPdf(false); }
  };

  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto space-y-6 pb-20">
      {/* ... (Rest of UI Remains Identical) ... */}
      <div className="flex items-center gap-4 pt-4 px-2">
        <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600 shadow-sm border border-rose-200">
            <FileWarning size={28} />
        </div>
        <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">استدعاء ولي أمر</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">إنشاء خطابات استدعاء رسمية ومشاركتها</p>
        </div>
      </div>

      <div className="glass-card p-6 md:p-8 rounded-[2rem] border border-white/20 space-y-8">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 dark:text-gray-400">الفصل</label>
                <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)} className="w-full p-3 glass-input rounded-xl text-sm font-bold outline-none">
                    {classes.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>
            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 dark:text-gray-400">الطالب</label>
                <select value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)} className="w-full p-3 glass-input rounded-xl text-sm font-bold outline-none">
                    <option value="">اختر...</option>
                    {availableStudents.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
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
            <button onClick={() => setShowPreview(true)} disabled={!selectedStudentId} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-indigo-700 transition-all disabled:opacity-50">
                معاينة
            </button>
            <button onClick={handleSendWhatsApp} disabled={!selectedStudentId} className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-green-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                <Share2 size={18} /> واتساب PDF
            </button>
        </div>
      </div>

      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setShowPreview(false)}>
            <div className="bg-white w-full max-w-4xl h-[90vh] rounded-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b flex justify-between items-center text-black">
                    <h3 className="font-bold">معاينة الخطاب</h3>
                    <button onClick={() => setShowPreview(false)}><X size={24}/></button>
                </div>
                <div className="flex-1 overflow-auto bg-gray-100 p-8 flex justify-center">
                    <div className="bg-white shadow-xl w-[210mm] min-h-[297mm] p-[20mm] text-black text-right font-serif relative" ref={letterRef}>
                        <div className="text-center mb-8">
                            <div className="flex justify-center mb-2 h-20">
                                {teacherInfo.ministryLogo ? <img src={teacherInfo.ministryLogo} className="h-full object-contain"/> : <div className="h-full w-20 bg-gray-200 flex items-center justify-center text-xs">شعار</div>}
                            </div>
                            <h2 className="font-bold text-lg">سلطنة عمان</h2>
                            <h3 className="font-bold">وزارة التربية والتعليم</h3>
                            <h3 className="font-bold">مدرسة {teacherInfo.school}</h3>
                        </div>
                        
                        <div className="mb-8 border-b-2 border-black pb-4">
                            <div className="flex justify-between mb-2">
                                <span className="font-bold">الفاضل/ ولي أمر الطالب: {availableStudents.find(s=>s.id===selectedStudentId)?.name}</span>
                                <span>المحترم</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="font-bold">الصف: {selectedClass}</span>
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
                            
                            {/* Centered Stamp */}
                            {teacherInfo.stamp && (
                                <div className="absolute left-1/2 bottom-0 transform -translate-x-1/2 w-32 opacity-80 mix-blend-multiply pointer-events-none">
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
        </div>
      )}
      
      {/* Hidden Render for PDF generation */}
      <div className="fixed left-[-9999px] top-0">
          <div ref={letterRef} className="bg-white w-[210mm] min-h-[297mm] p-[20mm] text-black text-right font-serif relative">
               {/* Same content as preview */}
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
                        <span className="font-bold">الفاضل/ ولي أمر الطالب: {availableStudents.find(s=>s.id===selectedStudentId)?.name}</span>
                        <span>المحترم</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="font-bold">الصف: {selectedClass}</span>
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

export default SummonPage;
