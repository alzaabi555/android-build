
import React from 'react';
import { Student } from '../types';
import { Printer, Download, Award, AlertCircle } from 'lucide-react';

interface StudentReportProps {
  student: Student;
}

const StudentReport: React.FC<StudentReportProps> = ({ student }) => {
  const behaviors = student.behaviors || [];
  const grades = student.grades || [];
  
  const posCount = behaviors.filter(b => b.type === 'positive').length;
  const negCount = behaviors.filter(b => b.type === 'negative').length;

  const totalScore = grades.reduce((acc, g) => acc + g.score, 0);
  const totalMax = grades.reduce((acc, g) => acc + g.maxScore, 0);
  const percentage = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const BOM = "\uFEFF";
    let csv = BOM + "اسم الطالب,الدرجة,من,التاريخ\n";
    grades.forEach(g => {
      csv += `${student.name},${g.score},${g.maxScore},${new Date(g.date).toLocaleDateString('ar-EG')}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `تقرير_${student.name}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6 pb-20 print:p-0 print:bg-white">
      {/* Header */}
      <div className="bg-white p-5 rounded-3xl border border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-lg">
                {student.avatar ? <img src={student.avatar} className="w-full h-full object-cover rounded-2xl"/> : student.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-xs font-black text-gray-900">{student.name}</h1>
              <p className="text-[9px] text-gray-400 font-black">النسبة الكلية: {percentage}%</p>
            </div>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3 no-print">
          <button onClick={handleExportCSV} className="p-4 bg-white rounded-2xl border font-black text-[10px] text-blue-600 flex items-center justify-center gap-2">
            <Download className="w-4 h-4" /> CSV
          </button>
          <button onClick={handlePrint} className="p-4 bg-blue-600 rounded-2xl font-black text-[10px] text-white shadow-lg flex items-center justify-center gap-2">
            <Printer className="w-4 h-4" /> PDF
          </button>
      </div>

      {/* Behavior History */}
      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="bg-gray-50/50 p-4 border-b border-gray-100"><h3 className="font-black text-gray-800 text-[10px]">سجل السلوك</h3></div>
        <div className="divide-y divide-gray-50">
          {behaviors.length > 0 ? behaviors.map(b => (
            <div key={b.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {b.type === 'positive' ? <Award className="w-3 h-3 text-emerald-500"/> : <AlertCircle className="w-3 h-3 text-rose-500"/>}
                <span className="text-[10px] font-black text-gray-800">{b.description}</span>
              </div>
              <span className="text-[8px] text-gray-400">{new Date(b.date).toLocaleDateString('ar-EG')}</span>
            </div>
          )) : <p className="p-6 text-center text-[10px] text-gray-400 font-bold">لا توجد سجلات</p>}
        </div>
      </div>

      {/* Grade History */}
      <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
        <div className="bg-gray-50/50 p-4 border-b border-gray-100"><h3 className="font-black text-gray-800 text-[10px]">سجل الدرجات</h3></div>
        <div className="divide-y divide-gray-50">
          {grades.length > 0 ? grades.map(g => (
            <div key={g.id} className="p-4 flex items-center justify-between">
              <span className="text-[10px] font-black text-gray-800">{g.category}</span>
              <div className="bg-gray-50 px-3 py-1 rounded-lg text-[10px] font-black">
                <span className="text-blue-600">{g.score}</span> / {g.maxScore}
              </div>
            </div>
          )) : <p className="p-6 text-center text-[10px] text-gray-400 font-bold">لا توجد درجات</p>}
        </div>
      </div>
    </div>
  );
};

export default StudentReport;
