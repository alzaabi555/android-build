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
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

      if (jsonData.length === 0) throw new Error('الملف فارغ');

      if (isCreatingNew && finalTargetClass) {
          onAddClass(finalTargetClass);
      }

      // مصفوفات الكلمات الدلالية للبحث عن الأعمدة
      const nameHeaders = ['الاسم', 'اسم الطالب', 'اسم', 'Name', 'Student Name', 'Full Name', 'المتعلم', 'اسم المتعلم', 'Student'];
      const phoneHeaders = ['رقم ولي الأمر', 'جوال', 'الهاتف', 'هاتف', 'رقم الجوال', 'رقم الهاتف', 'Phone', 'Mobile', 'Parent Phone', 'Contact'];
      const gradeHeaders = ['الصف', 'صف', 'Grade', 'Level', 'المرحلة'];

      const mappedStudents: Student[] = jsonData
        .map((row, idx) => {
          const rowKeys = Object.keys(row);
          
          const nameKey = rowKeys.find(k => nameHeaders.includes(k.trim()));
          const phoneKey = rowKeys.find(k => phoneHeaders.includes(k.trim()));
          const gradeKey = rowKeys.find(k => gradeHeaders.includes(k.trim()));

          const studentName = String(row[nameKey || ''] || row[rowKeys[0]] || '').trim();
          const parentPhone = phoneKey ? String(row[phoneKey] || '').trim() : '';

          return {
            id: Math.random().toString(36).substr(2, 9),
            name: studentName,
            grade: String(row[gradeKey || ''] || ''),
            classes: [finalTargetClass],
            attendance: [],
            behaviors: [],
            grades: [],
            parentPhone: parentPhone
          };
        })
        .filter(student => {
          return student.name !== '' && !nameHeaders.includes(student.name);
        });

      if (mappedStudents.length === 0) {
        alert('لم يتم العثور على أسماء طلاب صالحة. تأكد من وجود عمود باسم "الاسم".');
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
                  <p>للحصول على أفضل النتائج، تأكد أن ملف الإكسل يحتوي على الأعمدة التالية:</p>
                  <ul className="list-disc list-inside mt-1">
                      <li>عمود لاسم الطالب (مثال: "الاسم")</li>
                      <li>عمود لرقم الجوال (مثال: "جوال")</li>
                  </ul>
              </div>
          </div>
      </div>
    </div>
  );
};

export default ExcelImport;