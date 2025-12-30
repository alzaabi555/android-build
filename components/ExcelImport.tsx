
import React, { useState } from 'react';
import { Student } from '../types';
import { FileUp, CheckCircle2, FileSpreadsheet, Loader2, Info, LayoutGrid, Check } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ExcelImportProps {
  existingClasses: string[];
  onImport: (students: Student[]) => void;
  onAddClass: (name: string) => void;
}

const ExcelImport: React.FC<ExcelImportProps> = ({ existingClasses, onImport, onAddClass }) => {
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [targetClass, setTargetClass] = useState<string>('');
  const [newClassInput, setNewClassInput] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  const cleanHeader = (header: string): string => {
      if (!header) return '';
      return String(header).trim().replace(/[\u200B-\u200D\uFEFF]/g, '').toLowerCase();
  };

  const cleanPhoneNumber = (raw: any): string => {
      if (!raw) return '';
      const str = String(raw).trim();
      return str.replace(/[^0-9+]/g, '');
  };

  const looksLikeAPhoneNumber = (val: string): boolean => {
      const clean = cleanPhoneNumber(val);
      return /^\+?\d{7,15}$/.test(clean);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // File handling logic preserved ...
    const file = e.target.files?.[0];
    if (!file) return;

    const finalTargetClass = isCreatingNew ? newClassInput.trim() : targetClass;
    if (!finalTargetClass) {
        alert('الرجاء اختيار فصل أو كتابة اسم فصل جديد قبل استيراد الملف');
        if (e.target) e.target.value = '';
        return;
    }
    
    setIsImporting(true);
    setImportStatus('idle');
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "", raw: false }) as any[];

      if (jsonData.length === 0) throw new Error('الملف فارغ');

      if (isCreatingNew && finalTargetClass) {
          onAddClass(finalTargetClass);
      }

      const headers = Object.keys(jsonData[0]);
      
      const nameKeywords = ['الاسم', 'اسم الطالب', 'اسم', 'name', 'student', 'full name', 'المتعلم'];
      const phoneKeywords = ['جوال', 'هاتف', 'phone', 'mobile', 'contact', 'تواصل', 'ولي', 'parent', 'رقم', 'cell'];
      const gradeKeywords = ['الصف', 'صف', 'grade', 'level', 'المرحلة'];

      let nameKey = headers.find(h => nameKeywords.some(kw => cleanHeader(h).includes(kw)));
      let phoneKey = headers.find(h => phoneKeywords.some(kw => cleanHeader(h).includes(kw)));
      const gradeKey = headers.find(h => gradeKeywords.some(kw => cleanHeader(h).includes(kw)));

      if (!nameKey) nameKey = headers[0];

      if (!phoneKey) {
          for (const header of headers) {
              if (header === nameKey) continue;
              let matchCount = 0;
              let checkLimit = Math.min(jsonData.length, 10);
              for (let i = 0; i < checkLimit; i++) {
                  if (looksLikeAPhoneNumber(jsonData[i][header])) matchCount++;
              }
              if (matchCount >= checkLimit * 0.3) {
                  phoneKey = header;
                  break;
              }
          }
          if (!phoneKey && nameKey) {
              const nameIndex = headers.indexOf(nameKey);
              if (nameIndex !== -1 && nameIndex + 1 < headers.length) {
                  phoneKey = headers[nameIndex + 1];
              }
          }
      }

      const mappedStudents: Student[] = jsonData
        .map((row, idx): Student | null => {
          const studentName = String(row[nameKey!] || '').trim();
          let parentPhone = '';
          if (phoneKey) parentPhone = cleanPhoneNumber(row[phoneKey]);
          if (!studentName || nameKeywords.includes(cleanHeader(studentName))) return null;

          return {
            id: Math.random().toString(36).substr(2, 9),
            name: studentName,
            grade: gradeKey ? String(row[gradeKey]).trim() : '',
            classes: [finalTargetClass],
            attendance: [],
            behaviors: [],
            grades: [],
            parentPhone: parentPhone
          };
        })
        .filter((student): student is Student => student !== null);

      if (mappedStudents.length === 0) {
        alert('لم يتم العثور على بيانات صالحة. تأكد من صحة الملف.');
        setImportStatus('error');
        return;
      }

      onImport(mappedStudents);
      setImportStatus('success');
      setTimeout(() => setImportStatus('idle'), 3000);
      setNewClassInput('');
      setTargetClass('');
    } catch (error) {
      console.error(error);
      setImportStatus('error');
      alert('حدث خطأ أثناء قراءة الملف. تأكد من أن الملف سليم.');
    } finally {
      setIsImporting(false);
      if (e.target) e.target.value = '';
    }
  };

  return (
    <div className="space-y-4 pb-20 text-slate-900 dark:text-white">
      <div className="bg-white dark:bg-white/5 p-6 rounded-[2rem] shadow-sm border border-gray-200 dark:border-white/10 space-y-5 backdrop-blur-xl">
        <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-blue-500" />
                توزيع الطلاب على فصل
            </h3>
            <button 
                onClick={() => {
                    setIsCreatingNew(!isCreatingNew);
                    setTargetClass('');
                    setNewClassInput('');
                }}
                className="text-[10px] font-bold text-blue-600 dark:text-blue-200 bg-blue-50 dark:bg-blue-500/20 border border-blue-200 dark:border-blue-500/30 px-3 py-1 rounded-full active:scale-95 transition-all hover:bg-blue-100 dark:hover:bg-blue-500/30"
            >
                {isCreatingNew ? 'اختر من القائمة' : 'فصل جديد +'}
            </button>
        </div>

        {isCreatingNew ? (
            <div className="space-y-2 animate-in fade-in zoom-in duration-200">
                <input 
                  type="text" 
                  placeholder="اكتب اسم الفصل الجديد (مثال: 4/ب)" 
                  className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-2xl py-4 px-4 text-sm font-bold focus:border-blue-500/50 outline-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30"
                  value={newClassInput}
                  onChange={(e) => setNewClassInput(e.target.value)}
                  autoFocus
                />
            </div>
        ) : (
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto custom-scrollbar p-1 animate-in fade-in slide-in-from-top-2 duration-200">
                {existingClasses.length > 0 ? existingClasses.map(cls => (
                    <button
                        key={cls}
                        onClick={() => setTargetClass(cls)}
                        className={`p-3 rounded-xl text-[10px] font-black transition-all border flex items-center justify-between ${targetClass === cls ? 'bg-blue-600 text-white border-blue-500 shadow-md' : 'bg-gray-50 dark:bg-white/5 text-slate-600 dark:text-white/50 border-gray-100 dark:border-white/5 hover:bg-gray-100 dark:hover:bg-white/10'}`}
                    >
                        {cls}
                        {targetClass === cls && <Check className="w-3 h-3" />}
                    </button>
                )) : <p className="col-span-2 text-center text-[10px] text-slate-400 dark:text-white/30 py-4">لا توجد فصول حالياً، قم بإنشاء فصل جديد.</p>}
            </div>
        )}
      </div>

      <div className={`bg-white dark:bg-white/5 p-8 rounded-[2rem] border-2 border-dashed flex flex-col items-center text-center shadow-sm relative overflow-hidden transition-all backdrop-blur-md ${ (isCreatingNew ? newClassInput : targetClass) ? 'border-blue-400/50 bg-blue-50/50 dark:bg-blue-500/10' : 'border-gray-200 dark:border-white/10'}`}>
        <div className="w-16 h-16 bg-blue-50 dark:bg-white/10 rounded-2xl shadow-inner flex items-center justify-center mb-4 relative z-10 border border-blue-100 dark:border-white/5">
          {isImporting ? <Loader2 className="w-7 h-7 text-blue-500 animate-spin" /> : <FileSpreadsheet className="w-7 h-7 text-blue-500" />}
        </div>
        
        <h3 className="text-sm font-black mb-1 text-slate-900 dark:text-white relative z-10">
            {isImporting ? 'جاري المعالجة...' : 'ارفع ملف الإكسل'}
        </h3>
        <p className="text-[10px] text-slate-500 dark:text-white/40 mb-6 px-4 relative z-10 font-bold">
            {(isCreatingNew ? newClassInput : targetClass) 
                ? `سيتم استيراد الطلاب إلى فصل: ${isCreatingNew ? newClassInput : targetClass}`
                : 'يجب اختيار الفصل أولاً لتفعيل الزر'}
        </p>
        
        <label className={`w-full max-w-[200px] relative z-10 ${!(isCreatingNew ? newClassInput : targetClass) ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
          <input 
            type="file" 
            accept=".xlsx, .xls, .csv" 
            className="hidden" 
            onChange={handleFileChange} 
            disabled={isImporting || !(isCreatingNew ? newClassInput : targetClass)} 
          />
          <div className={`w-full py-4 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 shadow-lg ${isImporting || !(isCreatingNew ? newClassInput : targetClass) ? 'bg-gray-100 text-gray-400 shadow-none border border-gray-200' : 'bg-blue-600 text-white shadow-blue-500/30 active:scale-95'}`}>
            <FileUp className="w-4 h-4" /> اختر الملف الآن
          </div>
        </label>
      </div>

      {importStatus === 'success' && (
        <div className="bg-emerald-500/20 text-emerald-200 p-5 rounded-2xl flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2 border border-emerald-500/20 backdrop-blur-md">
          <div className="bg-emerald-500 text-white p-1 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-black block leading-none">تم الاستيراد بنجاح!</span>
          </div>
        </div>
      )}

      <div className="p-4 bg-amber-50 dark:bg-amber-500/10 rounded-2xl border border-amber-200 dark:border-amber-500/20 backdrop-blur-sm">
          <div className="flex gap-2 items-start">
              <Info className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-[9px] text-amber-800 dark:text-amber-100/80 font-bold leading-relaxed">
                  <p>تم تحديث النظام ليدعم الأرقام العمانية والدولية.</p>
                  <ul className="list-disc list-inside mt-1">
                      <li>يتم نسخ الرقم كما هو دون تعديل.</li>
                      <li>إذا لم يتم العثور على عمود "هاتف"، سيتم قراءة العمود المجاور لاسم الطالب مباشرة.</li>
                  </ul>
              </div>
          </div>
      </div>
    </div>
  );
};

export default ExcelImport;
