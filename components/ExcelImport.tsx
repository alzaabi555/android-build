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

  // دالة تنظيف مبسطة جداً حسب الطلب
  const cleanPhoneNumber = (raw: any): string => {
      if (!raw) return '';
      const str = String(raw).trim();
      // نبقي فقط على الأرقام وعلامة + (إزالة المسافات والأقواس والشرطات)
      // لا نقوم بإضافة أصفار أو تعديل بداية الرقم نهائياً
      return str.replace(/[^0-9+]/g, '');
  };

  // التحقق العام: هل النص يحتوي على أرقام بطول معقول (7 خانات فأكثر)
  // هذا يدعم الأرقام العمانية (8 أرقام) وأي أرقام دولية أخرى
  const looksLikeAPhoneNumber = (val: string): boolean => {
      const clean = cleanPhoneNumber(val);
      return /^\+?\d{7,15}$/.test(clean);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      // استخدام raw: false مهم لقراءة البيانات كما تظهر في الخلية (كنصوص)
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "", raw: false }) as any[];

      if (jsonData.length === 0) throw new Error('الملف فارغ');

      if (isCreatingNew && finalTargetClass) {
          onAddClass(finalTargetClass);
      }

      // 1. تحديد الأعمدة
      const headers = Object.keys(jsonData[0]);
      
      const nameKeywords = ['الاسم', 'اسم الطالب', 'اسم', 'name', 'student', 'full name', 'المتعلم'];
      const phoneKeywords = ['جوال', 'هاتف', 'phone', 'mobile', 'contact', 'تواصل', 'ولي', 'parent', 'رقم', 'cell'];
      const gradeKeywords = ['الصف', 'صف', 'grade', 'level', 'المرحلة'];

      let nameKey = headers.find(h => nameKeywords.some(kw => cleanHeader(h).includes(kw)));
      let phoneKey = headers.find(h => phoneKeywords.some(kw => cleanHeader(h).includes(kw)));
      const gradeKey = headers.find(h => gradeKeywords.some(kw => cleanHeader(h).includes(kw)));

      // إذا لم نجد عمود الاسم، نعتبر العمود الأول هو الاسم
      if (!nameKey) nameKey = headers[0];

      // --- استراتيجية تحديد عمود الهاتف ---
      if (!phoneKey) {
          // 1. المحاولة الأولى: البحث الذكي في المحتوى عن أي أرقام
          for (const header of headers) {
              if (header === nameKey) continue;
              let matchCount = 0;
              let checkLimit = Math.min(jsonData.length, 10);
              for (let i = 0; i < checkLimit; i++) {
                  if (looksLikeAPhoneNumber(jsonData[i][header])) {
                      matchCount++;
                  }
              }
              if (matchCount >= checkLimit * 0.3) {
                  phoneKey = header;
                  break;
              }
          }

          // 2. المحاولة الثانية (الحل الجذري): إذا فشل البحث، خذ العمود المجاور للاسم مباشرة
          if (!phoneKey && nameKey) {
              const nameIndex = headers.indexOf(nameKey);
              // التحقق من وجود عمود بعد عمود الاسم
              if (nameIndex !== -1 && nameIndex + 1 < headers.length) {
                  phoneKey = headers[nameIndex + 1];
                  console.log(`Using next column for phone: ${phoneKey}`);
              }
          }
      }

      const mappedStudents: Student[] = jsonData
        .map((row, idx): Student | null => {
          const studentName = String(row[nameKey!] || '').trim();
          
          let parentPhone = '';
          if (phoneKey) {
             // نسخ الرقم كما هو مع تنظيف الرموز فقط
             parentPhone = cleanPhoneNumber(row[phoneKey]);
          }

          // تجاهل العناوين المكررة
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
      
      const importedPhones = mappedStudents.filter(s => s.parentPhone).length;
      if (importedPhones === 0) {
          // تنبيه المستخدم لكن لا نوقف العملية
          console.warn('تم استيراد الطلاب لكن لم يتم العثور على أرقام هواتف.');
      }

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
    <div className="space-y-4 pb-20">
      <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 space-y-5">
        <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-gray-900 flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-blue-500" />
                توزيع الطلاب على فصل
            </h3>
            <button 
                onClick={() => {
                    setIsCreatingNew(!isCreatingNew);
                    setTargetClass('');
                    setNewClassInput('');
                }}
                className="text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full active:scale-95 transition-all"
            >
                {isCreatingNew ? 'اختر من القائمة' : 'فصل جديد +'}
            </button>
        </div>

        {isCreatingNew ? (
            <div className="space-y-2 animate-in fade-in zoom-in duration-200">
                <input 
                  type="text" 
                  placeholder="اكتب اسم الفصل الجديد (مثال: 4/ب)" 
                  className="w-full bg-gray-50 border-2 border-blue-100 rounded-2xl py-4 px-4 text-sm font-bold focus:ring-2 focus:ring-blue-500/10 outline-none text-blue-700"
                  value={newClassInput}
                  onChange={(e) => setNewClassInput(e.target.value)}
                  autoFocus
                />
            </div>
        ) : (
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto no-scrollbar p-1 animate-in fade-in slide-in-from-top-2 duration-200">
                {existingClasses.length > 0 ? existingClasses.map(cls => (
                    <button
                        key={cls}
                        onClick={() => setTargetClass(cls)}
                        className={`p-3 rounded-xl text-[10px] font-black transition-all border flex items-center justify-between ${targetClass === cls ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100' : 'bg-gray-50 text-gray-500 border-transparent'}`}
                    >
                        {cls}
                        {targetClass === cls && <Check className="w-3 h-3" />}
                    </button>
                )) : <p className="col-span-2 text-center text-[10px] text-gray-400 py-4">لا توجد فصول حالياً، قم بإنشاء فصل جديد.</p>}
            </div>
        )}
      </div>

      <div className={`bg-white p-8 rounded-[2rem] border-2 border-dashed flex flex-col items-center text-center shadow-sm relative overflow-hidden transition-colors ${ (isCreatingNew ? newClassInput : targetClass) ? 'border-blue-200 bg-blue-50/10' : 'border-gray-100 opacity-60'}`}>
        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 relative z-10 border border-gray-50">
          {isImporting ? <Loader2 className="w-7 h-7 text-blue-600 animate-spin" /> : <FileSpreadsheet className="w-7 h-7 text-blue-600" />}
        </div>
        
        <h3 className="text-sm font-black mb-1 text-gray-900 relative z-10">
            {isImporting ? 'جاري المعالجة...' : 'ارفع ملف الإكسل'}
        </h3>
        <p className="text-[10px] text-gray-400 mb-6 px-4 relative z-10 font-bold">
            {(isCreatingNew ? newClassInput : targetClass) 
                ? `سيتم استيراد الطلاب إلى فصل: ${isCreatingNew ? newClassInput : targetClass}`
                : 'يجب اختيار الفصل أولاً لتفعيل الزر'}
        </p>
        
        <label className={`w-full max-w-[200px] relative z-10 ${!(isCreatingNew ? newClassInput : targetClass) ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
          <input 
            type="file" 
            accept=".xlsx, .xls, .csv" 
            className="hidden" 
            onChange={handleFileChange} 
            disabled={isImporting || !(isCreatingNew ? newClassInput : targetClass)} 
          />
          <div className={`w-full py-4 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2 shadow-lg ${isImporting || !(isCreatingNew ? newClassInput : targetClass) ? 'bg-gray-200 text-gray-400 shadow-none' : 'bg-blue-600 text-white shadow-blue-100 active:scale-95'}`}>
            <FileUp className="w-4 h-4" /> اختر الملف الآن
          </div>
        </label>
      </div>

      {importStatus === 'success' && (
        <div className="bg-emerald-50 text-emerald-700 p-5 rounded-2xl flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2">
          <div className="bg-emerald-500 text-white p-1 rounded-full">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-black block leading-none">تم الاستيراد بنجاح!</span>
          </div>
        </div>
      )}

      <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
          <div className="flex gap-2 items-start">
              <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-[9px] text-amber-700 font-bold leading-relaxed">
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