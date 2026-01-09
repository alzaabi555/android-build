
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Student, BehaviorType } from '../types';
import { Search, ThumbsUp, ThumbsDown, Edit2, Sparkles, Trash2, Plus, Loader2, MessageCircle, DoorOpen, LayoutGrid, FileSpreadsheet, X, UserPlus, Upload, MoreHorizontal, Settings, PartyPopper, Trophy, Frown, CloudRain, PenTool } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from './Modal';
import ExcelImport from './ExcelImport';
import { useApp } from '../context/AppContext';

// روابط أصوات خفيفة ومناسبة
const SOUNDS = {
    positive: 'https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3', // صوت نجاح/جرس
    negative: 'https://assets.mixkit.co/active_storage/sfx/2955/2955-preview.mp3'  // صوت خطأ/تنبيه منخفض
};

interface StudentListProps {
  students: Student[];
  classes: string[];
  onAddClass: (name: string) => void;
  onAddStudentManually: (name: string, className: string, phone?: string, avatar?: string) => void;
  onBatchAddStudents: (students: Student[]) => void;
  onUpdateStudent: (s: Student) => void;
  onDeleteStudent: (id: string) => void;
  onViewReport: (s: Student) => void;
  currentSemester: '1' | '2';
  onSemesterChange: (sem: '1' | '2') => void;
  onEditClass: (oldName: string, newName: string) => void;
  onDeleteClass: (className: string) => void;
}

const StudentItem = React.memo(({ student, onAction, currentSemester }: { 
    student: Student, onAction: (s: Student, type: 'positive' | 'negative' | 'edit' | 'delete' | 'truant') => void, currentSemester: '1' | '2'
}) => {
    const totalScore = useMemo(() => (student.grades || []).filter(g => !g.semester || g.semester === currentSemester).reduce((sum, g) => sum + (Number(g.score) || 0), 0), [student.grades, currentSemester]);
    const gradeSymbol = useMemo(() => { if (totalScore >= 90) return 'أ'; if (totalScore >= 80) return 'ب'; if (totalScore >= 65) return 'ج'; if (totalScore >= 50) return 'د'; return 'هـ'; }, [totalScore]);
    
    const gradeColor = useMemo(() => { 
        if (totalScore >= 90) return 'text-emerald-400 bg-emerald-900/30 border-emerald-500/50'; 
        if (totalScore >= 80) return 'text-blue-400 bg-blue-900/30 border-blue-500/50'; 
        if (totalScore >= 65) return 'text-amber-400 bg-amber-900/30 border-amber-500/50'; 
        return 'text-rose-400 bg-rose-900/30 border-rose-500/50'; 
    }, [totalScore]);

    return (
        <motion.div 
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
            className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 mb-3 rounded-[1.5rem] gap-4 sm:gap-0 relative overflow-hidden transition-all duration-300
            glass-card bg-[#1f2937] hover:bg-[#374151] shadow-sm hover:shadow-md border border-indigo-500/40 shimmer-hover"
        >
            {/* Cleaner visual separation - Left Border Accent based on grade */}
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${totalScore >= 90 ? 'bg-emerald-500' : totalScore >= 50 ? 'bg-indigo-500' : 'bg-rose-500'}`}></div>

            <div className="flex items-center gap-4 flex-1 min-w-0 relative z-10 pl-3">
                <div className="w-12 h-12 rounded-xl bg-[#111827] flex items-center justify-center text-gray-400 text-lg font-bold overflow-hidden shrink-0 shadow-sm border border-gray-600">
                    {student.avatar ? <img src={student.avatar} className="w-full h-full object-cover" /> : student.name.charAt(0)}
                </div>
                <div className="min-w-0">
                    <h3 className="font-black text-white text-sm truncate group-hover:text-indigo-400 transition-colors">{student.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] bg-[#111827] text-gray-400 px-2 py-0.5 rounded-md font-bold border border-gray-600">{student.classes[0]}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold border ${gradeColor}`}>{gradeSymbol} ({totalScore})</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-2 pl-1 relative z-10">
                <div className="flex items-center gap-1 bg-[#111827] p-1 rounded-xl border border-gray-600">
                    <button onClick={(e) => { e.stopPropagation(); onAction(student, 'positive'); }} className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#1f2937] text-emerald-500 hover:text-emerald-400 shadow-sm border border-gray-600 active:scale-95 transition-transform">
                        <ThumbsUp className="w-4 h-4" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onAction(student, 'negative'); }} className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#1f2937] text-rose-500 hover:text-rose-400 shadow-sm border border-gray-600 active:scale-95 transition-transform">
                        <ThumbsDown className="w-4 h-4" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onAction(student, 'truant'); }} className="w-9 h-9 rounded-lg flex items-center justify-center bg-[#1f2937] text-purple-500 hover:text-purple-400 shadow-sm border border-gray-600 active:scale-95 transition-transform" title="تسرب">
                        <DoorOpen className="w-4 h-4" />
                    </button>
                </div>
                
                <div className="w-px h-6 bg-gray-600 mx-1 hidden sm:block"></div>
                
                <div className="flex items-center gap-1">
                    <button onClick={(e) => { e.stopPropagation(); onAction(student, 'edit'); }} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-indigo-400 hover:bg-[#111827] transition-colors">
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onAction(student, 'delete'); }} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-rose-500 hover:bg-[#111827] transition-colors">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}, (prev, next) => prev.student === next.student && prev.currentSemester === next.currentSemester);

const StudentList: React.FC<StudentListProps> = ({ students, classes, onAddClass, onAddStudentManually, onBatchAddStudents, onUpdateStudent, onDeleteStudent, onViewReport, currentSemester }) => {
  const { teacherInfo } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  
  // Modals State
  const [showManualAddModal, setShowManualAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  
  // Inputs State
  const [newClassInput, setNewClassInput] = useState('');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editClass, setEditClass] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  
  // Behavior Logic State
  const [showNegativeReasons, setShowNegativeReasons] = useState<{student: Student} | null>(null);
  const [showPositiveReasons, setShowPositiveReasons] = useState<{student: Student} | null>(null);
  const [customBehaviorReason, setCustomBehaviorReason] = useState('');
  const [customBehaviorPoints, setCustomBehaviorPoints] = useState<string>('1');

  // Animation Feedback State
  const [feedbackAnimation, setFeedbackAnimation] = useState<{ type: BehaviorType, text: string } | null>(null);

  // Random Picker State
  const [randomStudent, setRandomStudent] = useState<Student | null>(null);
  const [isRandomPicking, setIsRandomPicking] = useState(false);
  
  // Logic: Extract unique Grades from students
  const availableGrades = useMemo(() => {
      const grades = new Set<string>();
      students.forEach(s => {
          if (s.grade) grades.add(s.grade);
          else if (s.classes[0]) {
              // Attempt to parse grade from class (e.g. "5/1" -> "5")
              const match = s.classes[0].match(/^(\d+)/);
              if (match) grades.add(match[1]);
          }
      });
      // Fallback if no specific grades found
      if (grades.size === 0 && classes.length > 0) return ['عام']; 
      return Array.from(grades).sort();
  }, [students, classes]);

  // Logic: Filter classes based on selected grade
  const visibleClasses = useMemo(() => {
      if (selectedGrade === 'all') return classes;
      return classes.filter(c => c.startsWith(selectedGrade));
  }, [classes, selectedGrade]);

  const filteredStudents = useMemo(() => students.filter(s => {
      const matchName = s.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchClass = selectedClass === 'all' || s.classes?.includes(selectedClass);
      
      let matchGrade = true;
      if (selectedGrade !== 'all') {
          // Strict grade check or fuzzy class check
          matchGrade = s.grade === selectedGrade || (s.classes[0] && s.classes[0].startsWith(selectedGrade));
      }

      return matchName && matchClass && matchGrade;
  }), [students, searchTerm, selectedClass, selectedGrade]);

  // Clear animation after delay
  useEffect(() => {
      if (feedbackAnimation) {
          const timer = setTimeout(() => setFeedbackAnimation(null), 1800);
          return () => clearTimeout(timer);
      }
  }, [feedbackAnimation]);

  const playBehaviorSound = (type: BehaviorType) => {
      try {
          const audio = new Audio(type === 'positive' ? SOUNDS.positive : SOUNDS.negative);
          audio.volume = 0.6; 
          audio.play().catch(e => console.warn('Audio play blocked', e));
      } catch (e) {
          console.error('Failed to play sound', e);
      }
  };

  const handleAction = (student: Student, type: 'positive' | 'negative' | 'edit' | 'delete' | 'truant') => {
      if (type === 'positive') setShowPositiveReasons({ student });
      else if (type === 'negative') setShowNegativeReasons({ student });
      else if (type === 'edit') {
          setEditingStudent(student);
          setEditName(student.name);
          setEditClass(student.classes[0]);
          setEditPhone(student.parentPhone || '');
          setEditAvatar(student.avatar || '');
          setShowManualAddModal(true);
      }
      else if (type === 'delete') {
          if(confirm(`حذف الطالب ${student.name}؟`)) onDeleteStudent(student.id);
      }
      else if (type === 'truant') {
          if(confirm('تسجيل هروب (تسرب) لهذا الطالب؟')) {
             handleAddBehavior(student, 'negative', 'تسرب من الحصة', 3);
          }
      }
  };

  const handleSaveStudent = () => {
      if (editName.trim() && editClass.trim()) {
          // infer grade from class input for new students
          const inferredGrade = editClass.trim().match(/^(\d+)/)?.[1] || '';
          
          if (editingStudent) {
              onUpdateStudent({ ...editingStudent, name: editName, classes: [editClass], parentPhone: editPhone, avatar: editAvatar, grade: inferredGrade });
          } else {
              // onAddStudentManually is a wrapper, we might need to update the actual function to accept grade or calc it inside
              // For now, let's update state directly or rely on the wrapper to be smart.
              // Assuming wrapper just creates obj. We can update it via `onBatch` or just use the wrapper.
              onAddStudentManually(editName, editClass, editPhone, editAvatar);
          }
          setShowManualAddModal(false);
          setEditingStudent(null);
          setEditName(''); setEditPhone(''); setEditClass(''); setEditAvatar('');
      }
  };

  const pickRandomStudent = () => {
      if (filteredStudents.length === 0) return;
      setIsRandomPicking(true);
      let count = 0;
      const interval = setInterval(() => {
          const random = filteredStudents[Math.floor(Math.random() * filteredStudents.length)];
          setRandomStudent(random);
          count++;
          if (count > 10) {
              clearInterval(interval);
              setIsRandomPicking(false);
          }
      }, 100);
  };

  const handleAddBehavior = (student: Student, type: BehaviorType, reason: string, points: number) => {
      playBehaviorSound(type);
      setFeedbackAnimation({ 
          type, 
          text: type === 'positive' ? 'أحسنت!' : 'انتبه!' 
      });
      const newBehavior = {
          id: Math.random().toString(36).substr(2, 9),
          date: new Date().toISOString(),
          type,
          description: reason,
          points: Math.abs(points),
          semester: currentSemester
      };
      const updatedStudent = { ...student, behaviors: [newBehavior, ...(student.behaviors || [])] };
      onUpdateStudent(updatedStudent);
      setShowPositiveReasons(null);
      setShowNegativeReasons(null);
  };

  const handleManualBehaviorSubmit = (type: BehaviorType, student: Student) => {
      if (customBehaviorReason.trim()) {
          handleAddBehavior(student, type, customBehaviorReason, parseInt(customBehaviorPoints) || 1);
          setCustomBehaviorReason('');
      }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] text-white pb-20 relative">
        
        {/* --- FEEDBACK ANIMATION OVERLAY --- */}
        <AnimatePresence>
            {feedbackAnimation && (
                <motion.div 
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ type: 'spring', damping: 15 }}
                    className="fixed inset-0 z-[10000] flex items-center justify-center pointer-events-none"
                >
                    <div className={`
                        p-8 rounded-[3rem] shadow-2xl flex flex-col items-center gap-4 border-4
                        backdrop-blur-xl
                        ${feedbackAnimation.type === 'positive' 
                            ? 'bg-emerald-900/90 border-emerald-600 text-white shadow-emerald-500/50' 
                            : 'bg-rose-900/90 border-rose-600 text-white shadow-rose-500/50'}
                    `}>
                        <div className="bg-white/20 p-6 rounded-full shadow-inner">
                            {feedbackAnimation.type === 'positive' ? (
                                <div className="relative">
                                    <Trophy className="w-20 h-20 text-yellow-300 drop-shadow-md" />
                                    <PartyPopper className="w-12 h-12 text-white absolute -top-4 -right-4 animate-bounce" />
                                </div>
                            ) : (
                                <div className="relative">
                                    <Frown className="w-20 h-20 text-white drop-shadow-md" />
                                    <CloudRain className="w-12 h-12 text-slate-200 absolute -top-4 -right-4 animate-pulse" />
                                </div>
                            )}
                        </div>
                        <h2 className="text-4xl font-black tracking-tight drop-shadow-sm">{feedbackAnimation.text}</h2>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* Sticky Header - Adjusted Layout */}
        <div className="sticky top-0 z-30 pb-2 glass-heavy bg-[#1f2937] border-b border-gray-700 shadow-md -mx-4 px-4 -mt-4">
            <div className="flex justify-between items-center mb-4 pt-safe mt-4">
                <h1 className="text-2xl font-black text-white tracking-tight drop-shadow-sm">قائمة الطلاب</h1>
                <div className="flex gap-2">
                    <button onClick={() => setShowManualAddModal(true)} className="w-10 h-10 rounded-2xl glass-icon bg-[#374151] text-indigo-400 active:scale-95 transition-all shadow-md border border-gray-600 shimmer-hover" title="إضافة طالب">
                        <UserPlus className="w-5 h-5"/>
                    </button>
                    <button onClick={() => setShowImportModal(true)} className="w-10 h-10 rounded-2xl glass-icon bg-[#374151] text-emerald-500 active:scale-95 transition-all shadow-md border border-gray-600 shimmer-hover" title="استيراد Excel">
                        <Upload className="w-5 h-5"/>
                    </button>
                    <button onClick={pickRandomStudent} className="w-10 h-10 rounded-2xl glass-icon bg-[#374151] text-purple-500 active:scale-95 transition-all shadow-md border border-gray-600 shimmer-hover" title="اختيار عشوائي">
                        <Sparkles className="w-5 h-5"/>
                    </button>
                </div>
            </div>

            {/* Hierarchy Filters */}
            <div className="space-y-2 mb-2">
                {/* 1. Grades (Level) */}
                {availableGrades.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                        <button onClick={() => { setSelectedGrade('all'); setSelectedClass('all'); }} className={`px-4 py-1.5 text-[10px] font-black whitespace-nowrap transition-all rounded-lg border ${selectedGrade === 'all' ? 'bg-indigo-600 text-white border-indigo-700' : 'glass-card bg-[#374151] border-gray-600 text-gray-300'}`}>كل المراحل</button>
                        {availableGrades.map(g => (
                            <button key={g} onClick={() => { setSelectedGrade(g); setSelectedClass('all'); }} className={`px-4 py-1.5 text-[10px] font-black whitespace-nowrap transition-all rounded-lg border ${selectedGrade === g ? 'bg-indigo-600 text-white border-indigo-700' : 'glass-card bg-[#374151] border-gray-600 text-gray-300'}`}>صف {g}</button>
                        ))}
                    </div>
                )}

                {/* 2. Classes (Sub-level) + Search */}
                <div className="flex items-center gap-3">
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 max-w-[65%]">
                        {visibleClasses.map(c => (
                            <button key={c} onClick={() => setSelectedClass(c)} className={`px-4 py-2 text-xs font-black whitespace-nowrap transition-all rounded-xl border shadow-sm ${selectedClass === c ? 'bg-indigo-600 text-white border-indigo-700 shadow-indigo-500/30' : 'glass-card bg-[#374151] border-gray-600 hover:bg-[#111827] text-gray-300'}`}>{c}</button>
                        ))}
                        <button onClick={() => setShowAddClassModal(true)} className="px-3 py-2 rounded-xl glass-card bg-[#374151] border border-gray-600 hover:bg-[#111827] active:scale-95 text-gray-400"><Plus className="w-4 h-4"/></button>
                    </div>
                    <div className="relative flex-1">
                        <Search className="absolute right-3 top-3 w-4 h-4 text-gray-500" />
                        <input 
                            type="text" 
                            placeholder="بحث..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full glass-input bg-[#374151] rounded-xl py-2.5 pr-9 pl-3 text-xs font-bold outline-none border border-gray-600 focus:border-indigo-500 shadow-inner text-white" 
                        />
                    </div>
                </div>
            </div>
        </div>

        {/* Student List Content */}
        <div className="flex-1 overflow-y-auto px-4 custom-scrollbar">
            {filteredStudents.length > 0 ? (
                <div className="flex flex-col gap-3 pb-20 pt-2">
                    {filteredStudents.map(student => (
                        <StudentItem 
                            key={student.id} 
                            student={student} 
                            onAction={handleAction} 
                            currentSemester={currentSemester}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 opacity-50">
                    <LayoutGrid className="w-16 h-16 text-gray-600 mb-4" />
                    <p className="text-sm font-bold text-gray-500">لا يوجد طلاب مطابقين</p>
                </div>
            )}
        </div>

        {/* --- MODALS (Updated for Dark Mode) --- */}

        {/* 1. Add Student Modal */}
        <Modal isOpen={showManualAddModal} onClose={() => { setShowManualAddModal(false); setEditingStudent(null); setEditName(''); setEditPhone(''); setEditClass(''); }}>
            <div className="text-center">
                <h3 className="font-black text-xl mb-4 text-white">{editingStudent ? 'تعديل بيانات الطالب' : 'إضافة طالب جديد'}</h3>
                <div className="space-y-3">
                    <input className="w-full p-3 glass-input bg-[#111827] rounded-xl font-bold text-sm outline-none border-gray-600 focus:border-indigo-500 text-white" placeholder="اسم الطالب" value={editName} onChange={e => setEditName(e.target.value)} />
                    <input className="w-full p-3 glass-input bg-[#111827] rounded-xl font-bold text-sm outline-none border-gray-600 focus:border-indigo-500 text-white" placeholder="الصف (مثال: 5/1)" value={editClass} onChange={e => setEditClass(e.target.value)} />
                    <input className="w-full p-3 glass-input bg-[#111827] rounded-xl font-bold text-sm outline-none border-gray-600 focus:border-indigo-500 text-white" placeholder="رقم ولي الأمر (اختياري)" value={editPhone} onChange={e => setEditPhone(e.target.value)} type="tel" />
                    <button onClick={handleSaveStudent} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-sm shadow-lg">حفظ</button>
                </div>
            </div>
        </Modal>

        {/* 2. Import Excel Modal */}
        <Modal isOpen={showImportModal} onClose={() => setShowImportModal(false)} className="max-w-md rounded-[2rem]">
            <ExcelImport existingClasses={classes} onImport={(s) => { onBatchAddStudents(s); setShowImportModal(false); }} onAddClass={onAddClass} />
        </Modal>

        {/* 3. Add Class Modal */}
        <Modal isOpen={showAddClassModal} onClose={() => setShowAddClassModal(false)} className="max-w-xs rounded-[2rem]">
            <div className="text-center">
                <h3 className="font-black text-lg mb-4 text-white">إضافة فصل جديد</h3>
                <input autoFocus className="w-full p-3 glass-input bg-[#111827] rounded-xl font-bold text-sm mb-4 outline-none border-gray-600 focus:border-indigo-500 text-white" placeholder="اسم الفصل" value={newClassInput} onChange={e => setNewClassInput(e.target.value)} />
                <button onClick={() => { if(newClassInput.trim()) { onAddClass(newClassInput.trim()); setNewClassInput(''); setShowAddClassModal(false); } }} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black text-sm">إضافة</button>
            </div>
        </Modal>

        {/* 4. Random Picker Modal */}
        <Modal isOpen={isRandomPicking || !!randomStudent} onClose={() => { setRandomStudent(null); setIsRandomPicking(false); }} className="max-w-xs rounded-[2.5rem]">
            <div className="text-center py-6">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full glass-icon border-4 border-indigo-600 shadow-xl overflow-hidden relative bg-[#1f2937]">
                    {randomStudent ? (
                        randomStudent.avatar ? <img src={randomStudent.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-4xl font-black text-indigo-400">{randomStudent.name.charAt(0)}</div>
                    ) : (
                        <Sparkles className="w-10 h-10 text-indigo-400 animate-spin" />
                    )}
                </div>
                <h3 className="text-xl font-black text-white mb-2 min-h-[2rem]">
                    {randomStudent ? randomStudent.name : 'جاري الاختيار...'}
                </h3>
                {randomStudent && <p className="text-sm font-bold text-gray-400 mb-6">{randomStudent.classes[0]}</p>}
                
                {randomStudent && (
                    <button onClick={() => { setRandomStudent(null); pickRandomStudent(); }} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-sm shadow-lg w-full">
                        اختيار آخر
                    </button>
                )}
            </div>
        </Modal>

        {/* 5. Behavior Reasons Modals */}
        <Modal isOpen={!!showPositiveReasons} onClose={() => setShowPositiveReasons(null)} className="max-w-xs rounded-[2rem]">
            <div className="text-center">
                <h3 className="font-black text-lg mb-4 text-emerald-400">سلوك إيجابي</h3>
                <div className="grid grid-cols-2 gap-2 mb-4">
                    {['مشاركة مميزة', 'واجب منزلي', 'نظافة', 'تعاون', 'إجابة نموذجية', 'هدوء'].map(r => (
                        <button key={r} onClick={() => { if(showPositiveReasons) handleAddBehavior(showPositiveReasons.student, 'positive', r, 1); }} className="p-2 glass-card bg-[#374151] text-xs font-bold hover:bg-emerald-900/30 text-gray-300 transition-colors border border-gray-600">{r}</button>
                    ))}
                </div>
                <div className="flex gap-2">
                    <input placeholder="سبب آخر..." value={customBehaviorReason} onChange={e => setCustomBehaviorReason(e.target.value)} className="flex-1 p-2 glass-input bg-[#111827] rounded-lg text-xs font-bold border-gray-600 text-white" />
                    <button onClick={() => { if(showPositiveReasons) handleManualBehaviorSubmit('positive', showPositiveReasons.student); }} className="p-2 bg-emerald-600 text-white rounded-lg"><Plus className="w-4 h-4"/></button>
                </div>
            </div>
        </Modal>

        <Modal isOpen={!!showNegativeReasons} onClose={() => setShowNegativeReasons(null)} className="max-w-xs rounded-[2rem]">
            <div className="text-center">
                <h3 className="font-black text-lg mb-4 text-rose-400">سلوك سلبي</h3>
                <div className="grid grid-cols-2 gap-2 mb-4">
                    {['إزعاج', 'نسيان كتاب', 'نوم', 'تأخر', 'ألفاظ', 'شجار'].map(r => (
                        <button key={r} onClick={() => { if(showNegativeReasons) handleAddBehavior(showNegativeReasons.student, 'negative', r, -1); }} className="p-2 glass-card bg-[#374151] text-xs font-bold hover:bg-rose-900/30 text-gray-300 transition-colors border border-gray-600">{r}</button>
                    ))}
                </div>
                <div className="flex gap-2">
                    <input placeholder="سبب آخر..." value={customBehaviorReason} onChange={e => setCustomBehaviorReason(e.target.value)} className="flex-1 p-2 glass-input bg-[#111827] rounded-lg text-xs font-bold border-gray-600 text-white" />
                    <button onClick={() => { if(showNegativeReasons) handleManualBehaviorSubmit('negative', showNegativeReasons.student); }} className="p-2 bg-rose-600 text-white rounded-lg"><Plus className="w-4 h-4"/></button>
                </div>
            </div>
        </Modal>

    </div>
  );
};

export default StudentList;
