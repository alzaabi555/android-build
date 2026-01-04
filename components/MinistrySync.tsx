
import React, { useState, useEffect } from 'react';
import { Building2, User, Key, Loader2, ShieldCheck, Wifi, Calendar, LayoutList, UploadCloud, AlertCircle, BarChart3, Settings2, Info, Link as LinkIcon, Check, X, RefreshCw, Activity, ArrowDownCircle, Lock } from 'lucide-react';
import { ministryService } from '../services/MinistryService';
import { MinistrySession, StdsAbsDetail, StdsGradeDetail } from '../types';
import { useApp } from '../context/AppContext';
import { Capacitor } from '@capacitor/core';
import Modal from './Modal';

// القائمة الرسمية فقط
const URL_PRESETS = [
    { name: 'الخادم الأساسي (MTletIt)', url: 'https://mobile.moe.gov.om/Sakhr.Elasip.Portal.Mobility/Services/MTletIt.svc' },
    { name: 'خادم الخدمات (TeacherServices)', url: 'https://mobile.moe.gov.om/Sakhr.Elasip.Portal.Mobility/Services/TeacherServices.svc' },
];

const MinistrySync: React.FC = () => {
  const { students, assessmentTools } = useApp();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [session, setSession] = useState<MinistrySession | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [customApiUrl, setCustomApiUrl] = useState('');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [testMessage, setTestMessage] = useState('');

  // Tabs
  const [activeTab, setActiveTab] = useState<'absence' | 'marks'>('absence');

  // Data
  const [filtersData, setFiltersData] = useState<any[]>([]);
  const [selectedFilterIndex, setSelectedFilterIndex] = useState<number>(-1);
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0]);

  // Marks Config
  const [marksConfig, setMarksConfig] = useState({
      termId: '1',
      subjectId: '', 
      examId: '', 
      examGradeType: 1,
      eduSysId: '1',
      stageId: '0', 
  });
  const [selectedLocalTool, setSelectedLocalTool] = useState<string>('');

  useEffect(() => {
      const saved = localStorage.getItem('ministry_api_url');
      setCustomApiUrl(saved || URL_PRESETS[0].url);
  }, []);

  useEffect(() => {
      setTestStatus('idle');
      setTestMessage('');
  }, [customApiUrl]);

  const handleTestConnection = async () => {
      if (!customApiUrl) return;
      setTestStatus('testing');
      setTestMessage('جاري الاتصال...');
      
      const result = await ministryService.testConnection(customApiUrl);
      
      if (result.success) {
          setTestStatus('success');
          setTestMessage(result.message);
      } else {
          setTestStatus('failed');
          setTestMessage(result.message);
      }
  };

  const handleSaveSettings = () => {
      if (customApiUrl.trim()) {
          localStorage.setItem('ministry_api_url', customApiUrl.trim());
          alert('تم حفظ الإعدادات');
          setShowSettings(false);
      }
  };

  const handleResetSettings = () => {
      const defaultUrl = URL_PRESETS[0].url;
      setCustomApiUrl(defaultUrl);
      localStorage.removeItem('ministry_api_url');
      alert('تم استعادة الرابط الافتراضي');
      setShowSettings(false);
  };

  // --- Auth Logic ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    setIsLoading(true);
    setErrorMessage('');
    
    try {
        const result = await ministryService.login(username, password);
        if (result) {
            setSession(result);
            try {
                const filters = await ministryService.getStudentAbsenceFilter(result);
                if (Array.isArray(filters)) setFiltersData(filters);
                else if (filters && typeof filters === 'object') setFiltersData([filters]);
            } catch (e) { console.warn('Auto-fetch filters failed', e); }
        } else { throw new Error('فشل التحقق من البيانات'); }
    } catch (error: any) { setErrorMessage(error.message); } finally { setIsLoading(false); }
  };

  const handleFetchFilters = async () => {
      if (!session) return;
      setIsLoading(true);
      try {
          const result = await ministryService.getStudentAbsenceFilter(session);
          if (Array.isArray(result)) setFiltersData(result);
          else setFiltersData([]);
      } catch (error: any) { setErrorMessage('فشل جلب الفصول: ' + error.message); } finally { setIsLoading(false); }
  };

  const handleSubmitAbsence = async () => {
      if (!session || selectedFilterIndex === -1) { alert('يرجى اختيار الصف والفصل أولاً'); return; }
      const selectedFilter = filtersData[selectedFilterIndex];
      const classId = selectedFilter.ClassId || selectedFilter.Id || "0";
      const gradeId = selectedFilter.GradeId || "0";
      const className = selectedFilter.ClassName || selectedFilter.Name || "";

      const localStudentsInClass = students.filter(s => s.classes.includes(className) || s.grade === gradeId);
      if (localStudentsInClass.length === 0) {
          if(!confirm(`لم يتم العثور على طلاب محليين في الفصل "${className}". متابعة؟`)) return;
      }

      setIsLoading(true);
      setSuccessMessage('');
      setErrorMessage('');

      try {
          const absDetails: StdsAbsDetail[] = [];
          localStudentsInClass.forEach(student => {
              const attendance = student.attendance.find(a => a.date === targetDate);
              if (attendance && attendance.status !== 'present') {
                  let absType = 0;
                  if (attendance.status === 'absent') absType = 1;
                  else if (attendance.status === 'late') absType = 2;
                  else if (attendance.status === 'truant') absType = 3;
                  absDetails.push({
                      StudentId: student.ministryId || student.id,
                      AbsenceType: absType,
                      Notes: 'عبر راصد'
                  });
              }
          });

          await ministryService.submitStudentAbsenceDetails(session, classId, gradeId, new Date(targetDate), absDetails);
          setSuccessMessage('تم رفع الغياب بنجاح! ✅');
      } catch (error: any) { setErrorMessage('فشل الرفع: ' + error.message); } finally { setIsLoading(false); }
  };

  const handleSubmitMarks = async () => {
      if (!session || selectedFilterIndex === -1) { alert('يرجى اختيار الصف والفصل أولاً'); return; }
      if (!marksConfig.examId || !marksConfig.subjectId) { alert('يرجى إدخال معرف الامتحان والمادة (ExamId, SubjectId)'); return; }
      if (!selectedLocalTool) { alert('يرجى اختيار أداة التقويم المحلية المراد رفع درجاتها'); return; }

      const selectedFilter = filtersData[selectedFilterIndex];
      const classId = selectedFilter.ClassId || selectedFilter.Id || "0";
      const gradeId = selectedFilter.GradeId || "0";
      const className = selectedFilter.ClassName || selectedFilter.Name || "";

      const localStudentsInClass = students.filter(s => s.classes.includes(className) || s.grade === gradeId);
      if (localStudentsInClass.length === 0) { alert('لا يوجد طلاب محليين مطابقين لهذا الفصل'); return; }

      setIsLoading(true);
      setSuccessMessage('');
      setErrorMessage('');

      try {
          const gradeDetails: StdsGradeDetail[] = [];
          const toolName = assessmentTools.find(t => t.id === selectedLocalTool)?.name;

          localStudentsInClass.forEach(student => {
              const gradeRecord = student.grades?.find(g => 
                  g.category.trim() === toolName?.trim() && 
                  (g.semester || '1') === marksConfig.termId
              );

              if (gradeRecord) {
                  gradeDetails.push({
                      StudentId: student.ministryId || student.id,
                      MarkValue: gradeRecord.score.toString(),
                      IsAbsent: false,
                      Notes: 'عبر راصد'
                  });
              }
          });

          if (gradeDetails.length === 0) {
              throw new Error('لا توجد درجات مرصودة محلياً لهذه الأداة في هذا الفصل');
          }

          await ministryService.submitStudentMarksDetails(
              session,
              { classId, gradeId, ...marksConfig },
              gradeDetails
          );

          setSuccessMessage('تم رفع الدرجات بنجاح! ✅');

      } catch (error: any) {
          setErrorMessage('فشل رفع الدرجات: ' + error.message);
      } finally {
          setIsLoading(false);
      }
  };

  return (
    <div className="flex flex-col h-full bg-[#F2F2F7] dark:bg-black rounded-[2.5rem] overflow-hidden shadow-2xl relative border border-white/20">
      
      {/* Header */}
      <div className="pt-8 pb-4 px-6 bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-xl border-b border-black/5 dark:border-white/10 sticky top-0 z-10">
         <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-black dark:text-white tracking-tight">بوابة الوزارة (معلم)</h2>
            <div className="flex items-center gap-3">
                <button onClick={() => setShowSettings(true)} className="p-2 rounded-full bg-gray-200 dark:bg-white/10 hover:bg-gray-300 transition-colors">
                    <Settings2 className="w-4 h-4 text-black dark:text-white" />
                </button>
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <Building2 className="w-4 h-4 text-white" />
                </div>
            </div>
         </div>
         <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 font-medium">
             {session ? `مرحباً، المستخدم (ID: ${session.userId})` : 'الاتصال الآمن (Secure Sync)'}
         </p>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
         
         {!session ? (
             <>
                <div className="flex justify-center mb-8 mt-4">
                    <div className="w-24 h-24 bg-white dark:bg-[#1C1C1E] rounded-[22px] shadow-sm flex items-center justify-center relative border border-gray-100 dark:border-white/5">
                        <img src="oman_logo.png" className="w-16 opacity-90" alt="MOE" onError={(e) => e.currentTarget.style.display='none'} />
                        <div className="absolute -bottom-3 bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
                            <Lock className="w-3 h-3" /> اتصال مشفر
                        </div>
                    </div>
                </div>
                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="bg-white dark:bg-[#1C1C1E] rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-white/5">
                        <div className="flex items-center px-4 py-1 border-b border-gray-100 dark:border-white/5">
                            <User className="w-5 h-5 text-gray-400 shrink-0" />
                            <input type="text" placeholder="اسم المستخدم (USme)" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full py-3.5 px-3 bg-transparent text-sm font-medium text-black dark:text-white placeholder:text-gray-400 outline-none" dir="ltr" />
                        </div>
                        <div className="flex items-center px-4 py-1">
                            <Key className="w-5 h-5 text-gray-400 shrink-0" />
                            <input type="password" placeholder="كلمة المرور (PPPWZ)" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full py-3.5 px-3 bg-transparent text-sm font-medium text-black dark:text-white placeholder:text-gray-400 outline-none" dir="ltr" />
                        </div>
                    </div>
                    
                    {errorMessage && <div className="text-center"><p className="text-xs font-bold text-red-500 bg-red-50 dark:bg-red-500/10 py-2 px-4 rounded-lg inline-block whitespace-pre-line" dir="ltr">{errorMessage}</p></div>}
                    
                    <button type="submit" disabled={isLoading || !username || !password} className="w-full bg-[#007AFF] hover:bg-[#006EDE] disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-xl py-3.5 text-sm font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2">
                        {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> جاري الاتصال...</> : 'تسجيل الدخول'}
                    </button>
                </form>
             </>
         ) : (
             <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                 {/* Session Status */}
                 <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-4">
                     <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
                         <ShieldCheck className="w-6 h-6" />
                     </div>
                     <div>
                         <h3 className="font-bold text-slate-900 dark:text-white text-sm">الجلسة نشطة</h3>
                         <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">تم الاتصال بقاعدة بيانات الوزارة</p>
                     </div>
                 </div>

                 {/* Tab Switcher */}
                 <div className="flex bg-gray-200 dark:bg-white/10 p-1 rounded-xl">
                     <button onClick={() => setActiveTab('absence')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'absence' ? 'bg-white dark:bg-gray-800 shadow text-black dark:text-white' : 'text-gray-500'}`}>رصد الغياب</button>
                     <button onClick={() => setActiveTab('marks')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'marks' ? 'bg-white dark:bg-gray-800 shadow text-black dark:text-white' : 'text-gray-500'}`}>رصد الدرجات</button>
                 </div>

                 {/* Filters Selection */}
                 <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-white/5">
                     <div className="flex items-center justify-between mb-4">
                         <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                             <LayoutList className="w-4 h-4 text-purple-500" />
                             الفصول الدراسية
                         </h3>
                         <button onClick={handleFetchFilters} disabled={isLoading} className="text-[10px] font-bold text-blue-500 bg-blue-50 dark:bg-blue-500/10 px-3 py-1 rounded-full">تحديث</button>
                     </div>
                     {filtersData.length > 0 ? (
                         <div className="grid grid-cols-2 gap-2 mb-4">
                             {filtersData.map((item, idx) => (
                                 <button key={idx} onClick={() => setSelectedFilterIndex(idx)} className={`p-3 rounded-xl border text-right transition-all ${selectedFilterIndex === idx ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10'}`}>
                                     <span className="block text-xs font-bold">{item.ClassName || item.Name || `فصل ${idx+1}`}</span>
                                     <span className="text-[9px] opacity-70">{item.GradeName || ''}</span>
                                 </button>
                             ))}
                         </div>
                     ) : (
                         <div className="text-center py-4 text-gray-400 text-xs font-bold border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl mb-4">لم يتم جلب الفصول بعد</div>
                     )}
                 </div>

                 {/* --- ABSENCE MODE --- */}
                 {activeTab === 'absence' && (
                     <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-white/5 animate-in fade-in">
                         <h3 className="text-sm font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                             <UploadCloud className="w-4 h-4 text-blue-500" />
                             رفع الغياب (SubmitStudentAbsence)
                         </h3>
                         <div className="space-y-3">
                             <div className="relative">
                                 <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-blue-500" />
                                 <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                             </div>
                             {selectedFilterIndex === -1 && <p className="text-[10px] text-amber-500 font-bold flex items-center gap-1"><AlertCircle className="w-3 h-3" /> يرجى اختيار فصل من القائمة أعلاه</p>}
                             <button onClick={handleSubmitAbsence} disabled={isLoading || selectedFilterIndex === -1} className="w-full bg-slate-900 dark:bg-white text-white dark:text-black py-3 rounded-xl font-black text-xs hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg">
                                 {isLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : 'رفع الغياب للسيرفر'}
                             </button>
                         </div>
                     </div>
                 )}

                 {/* --- MARKS MODE --- */}
                 {activeTab === 'marks' && (
                     <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-white/5 animate-in fade-in">
                         <h3 className="text-sm font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                             <BarChart3 className="w-4 h-4 text-emerald-500" />
                             رفع الدرجات (SubmitMarks)
                         </h3>
                         
                         {/* Configuration Inputs */}
                         <div className="space-y-3 mb-4">
                             <div className="flex gap-2">
                                 <div className="flex-1">
                                     <label className="text-[9px] font-bold text-gray-400 mb-1 block">Subject ID (المادة)</label>
                                     <input type="text" placeholder="مثال: 101" value={marksConfig.subjectId} onChange={e => setMarksConfig({...marksConfig, subjectId: e.target.value})} className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-bold outline-none" />
                                 </div>
                                 <div className="flex-1">
                                     <label className="text-[9px] font-bold text-gray-400 mb-1 block">Exam ID (الاختبار)</label>
                                     <input type="text" placeholder="مثال: 5543" value={marksConfig.examId} onChange={e => setMarksConfig({...marksConfig, examId: e.target.value})} className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-bold outline-none" />
                                 </div>
                             </div>
                             
                             <div className="flex gap-2">
                                 <div className="flex-1">
                                     <label className="text-[9px] font-bold text-gray-400 mb-1 block">الفصل الدراسي</label>
                                     <select value={marksConfig.termId} onChange={e => setMarksConfig({...marksConfig, termId: e.target.value})} className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-2 py-2 text-xs font-bold outline-none">
                                         <option value="1">فصل 1</option>
                                         <option value="2">فصل 2</option>
                                     </select>
                                 </div>
                                 <div className="flex-[2]">
                                     <label className="text-[9px] font-bold text-gray-400 mb-1 block">الأداة المحلية</label>
                                     <select value={selectedLocalTool} onChange={e => setSelectedLocalTool(e.target.value)} className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-2 py-2 text-xs font-bold outline-none">
                                         <option value="">اختر الأداة...</option>
                                         {assessmentTools.map(tool => (
                                             <option key={tool.id} value={tool.id}>{tool.name}</option>
                                         ))}
                                     </select>
                                 </div>
                             </div>
                         </div>

                         {selectedFilterIndex === -1 && <p className="text-[10px] text-amber-500 font-bold flex items-center gap-1 mb-2"><AlertCircle className="w-3 h-3" /> يرجى اختيار فصل من القائمة أعلاه</p>}
                         
                         <button onClick={handleSubmitMarks} disabled={isLoading || selectedFilterIndex === -1 || !selectedLocalTool} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-black text-xs hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg">
                             {isLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : 'رفع الدرجات للسيرفر'}
                         </button>
                     </div>
                 )}

                 {successMessage && <div className="mt-4 p-3 bg-emerald-500/10 text-emerald-600 rounded-xl text-xs font-bold text-center border border-emerald-500/20">{successMessage}</div>}
                 {errorMessage && <div className="mt-4 p-3 bg-red-500/10 text-red-600 rounded-xl text-xs font-bold text-center border border-red-500/20">{errorMessage}</div>}

                 <button onClick={() => setSession(null)} className="w-full py-3 text-red-500 font-bold text-xs hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors">تسجيل الخروج</button>
             </div>
         )}

      </div>

      {/* Settings Modal */}
      <Modal isOpen={showSettings} onClose={() => setShowSettings(false)} className="max-w-sm rounded-[2rem]">
          <div className="text-center">
              <h3 className="font-black text-lg text-slate-900 dark:text-white mb-2">إعدادات الخادم</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">يمكنك تغيير السيرفر إذا واجهت مشاكل في الاتصال.</p>
              
              <div className="space-y-3 mb-6">
                  {URL_PRESETS.map((preset, idx) => (
                      <button 
                        key={idx}
                        onClick={() => { setCustomApiUrl(preset.url); }}
                        className={`w-full p-3 rounded-xl border text-xs font-bold flex items-center justify-between group transition-all ${customApiUrl === preset.url ? 'bg-blue-600 text-white border-blue-500 shadow-md' : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-slate-700 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10'}`}
                      >
                          <span>{preset.name}</span>
                          {customApiUrl === preset.url && <Check className="w-4 h-4" />}
                      </button>
                  ))}
              </div>

              <div className="relative mb-4">
                  <LinkIcon className="absolute top-3 right-3 w-4 h-4 text-gray-400" />
                  <input 
                    type="text" 
                    dir="ltr"
                    value={customApiUrl} 
                    onChange={e => setCustomApiUrl(e.target.value)}
                    className="w-full bg-gray-100 dark:bg-white/10 rounded-xl py-3 pr-9 pl-3 text-xs font-bold text-left outline-none border border-transparent focus:border-blue-500 transition-colors"
                    placeholder="https://..."
                  />
              </div>

              <button 
                onClick={handleTestConnection}
                disabled={testStatus === 'testing'}
                className="w-full mb-4 py-2 px-3 rounded-xl border border-gray-200 dark:border-white/10 flex items-center justify-center gap-2 text-xs font-bold hover:bg-gray-50 dark:hover:bg-white/5 transition-all active:scale-95"
              >
                  {testStatus === 'testing' ? <Loader2 className="w-3 h-3 animate-spin"/> : <Activity className="w-3 h-3 text-indigo-500"/>}
                  فحص الاتصال (Ping)
              </button>

              {testMessage && (
                  <div className={`text-[10px] font-bold py-2 mb-4 rounded-lg px-2 break-all ${testStatus === 'success' || (testStatus === 'idle' && testMessage.includes('200')) ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}`}>
                      {testMessage}
                  </div>
              )}

              <div className="flex gap-2">
                  <button onClick={handleResetSettings} className="flex-1 py-3 text-xs font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-colors">افتراضي</button>
                  <button onClick={handleSaveSettings} className="flex-[2] py-3 text-xs font-black text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-500/30 transition-colors">حفظ التغييرات</button>
              </div>
          </div>
      </Modal>

    </div>
  );
};

export default MinistrySync;
