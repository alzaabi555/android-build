
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Student, BehaviorType } from '../types';
import { Search, ThumbsUp, ThumbsDown, Edit2, Sparkles, Trash2, Plus, Loader2, MessageCircle, DoorOpen, LayoutGrid, FileSpreadsheet, X, UserPlus, Upload, MoreHorizontal, Settings, PartyPopper, Trophy, Frown, CloudRain, PenTool } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Modal from './Modal';
import ExcelImport from './ExcelImport';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import * as XLSX from 'xlsx';
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
        if (totalScore >= 90) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'; 
        if (totalScore >= 80) return 'text-blue-400 bg-blue-500/10 border-blue-500/20'; 
        if (totalScore >= 65) return 'text-amber-400 bg-amber-500/10 border-amber-500/20'; 
        return 'text-rose-400 bg-rose-500/10 border-rose-500/20'; 
    }, [totalScore]);

    return (
        <motion.div 
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
            className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 mb-3 rounded-[1.8rem] gap-4 sm:gap-0 relative overflow-hidden transition-all duration-300
            bg-gradient-to-br from-white/10 via-white/5 to-transparent dark:from-white/5 dark:via-white/[0.02] dark:to-transparent
            border border-white/20 hover:border-indigo-400/30 dark:hover:border-indigo-400/20
            shadow-lg shadow-black/5 hover:shadow-indigo-500/10 hover:-translate-y-1 backdrop-blur-md"
        >
            {/* Glossy highlight effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none"></div>

            <div className="flex items-center gap-4 flex-1 min-w-0 relative z-10">
                <div className="w-14 h-14 rounded-2xl glass-icon flex items-center justify-center text-slate-600 dark:text-white/70 text-lg font-bold overflow-hidden shrink-0 shadow-lg group-hover:scale-105 transition-transform border border-white/30 group-hover:border-indigo-300/50">
                    {student.avatar ? <img src={student.avatar} className="w-full h-full object-cover" /> : student.name.charAt(0)}
                </div>
                <div className="min-w-0">
                    <h3 className="font-black text-slate-900 dark:text-white text-base truncate group-hover:text-indigo-500 dark:group-hover:text-indigo-300 transition-colors">{student.name}</h3>
                    <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] glass-icon text-slate-500 dark:text-white/60 px-2.5 py-1 rounded-lg font-bold shadow-sm">{student.classes[0]}</span>
                        <span className={`text-[10px] px-2.5 py-1 rounded-lg font-bold border shadow-sm ${gradeColor}`}>{gradeSymbol} ({totalScore})</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-2 pl-1 relative z-10">
                <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/10 shadow-inner">
                    <button onClick={(e) => { e.stopPropagation(); onAction(student, 'positive'); }} className="w-10 h-10 rounded-xl flex items-center justify-center glass-icon text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/20 transition-all active:scale-90 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                        <ThumbsUp className="w-5 h-5" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onAction(student, 'negative'); }} className="w-10 h-10 rounded-xl flex items-center justify-center glass-icon text-rose-500 hover:text-rose-400 hover:bg-rose-500/20 transition-all active:scale-90 hover:shadow-[0_0_15px_rgba(244,63,94,0.3)]">
                        <ThumbsDown className="w-5 h-5" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onAction(student, 'truant'); }} className="w-10 h-10 rounded-xl flex items-center justify-center glass-icon text-purple-500 hover:text-purple-400 hover:bg-purple-500/20 transition-all active:scale-90 hover:shadow-[0_0_15px_rgba(168,85,247,0.3)]" title="تسرب">
                        <DoorOpen className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="w-px h-8 bg-white/10 mx-1 hidden sm:block"></div>
                
                <div className="flex items-center gap-1">
                    <button onClick={(e) => { e.stopPropagation(); onAction(student, 'edit'); }} className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 dark:text-white/40 hover:text-indigo-500 hover:bg-white/10 transition-colors">
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onAction(student, 'delete'); }} className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 dark:text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition-colors">
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
  
  const filteredStudents = useMemo(() => students.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) && (selectedClass === 'all' || s.classes?.includes(selectedClass))), [students, searchTerm, selectedClass]);

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
          if (editingStudent) {
              onUpdateStudent({ ...editingStudent, name: editName, classes: [editClass], parentPhone: editPhone, avatar: editAvatar });
          } else {
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
      // 1. Play Sound
      playBehaviorSound(type);

      // 2. Trigger Visual Animation
      setFeedbackAnimation({ 
          type, 
          text: type === 'positive' ? 'أحسنت!' : 'انتبه!' 
      });

      // 3. Update Data
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
    <div className="flex flex-col h-[calc(100vh-80px)] text-slate-900 dark:text-white pb-20 relative">
        
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
                            ? 'bg-emerald-500/90 border-emerald-300 text-white shadow-emerald-500/50' 
                            : 'bg-rose-500/90 border-rose-300 text-white shadow-rose-500/50'}
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

        {/* Header */}
        <div className="glass-heavy border-b border-white/20 shadow-lg backdrop-blur-xl rounded-[0_0_2.5rem_2.5rem] mb-6 shrink-0 z-20">
            <div className="p-4 pt-6">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight drop-shadow-sm">قائمة الطلاب</h1>
                    <div className="flex gap-2">
                        <button onClick={() => setShowManualAddModal(true)} className="w-10 h-10 rounded-2xl glass-icon text-indigo-600 dark:text-indigo-400 active:scale-95 transition-all shadow-md hover:shadow-indigo-500/20 hover:scale-105 border border-white/20" title="إضافة طالب">
                            <UserPlus className="w-5 h-5"/>
                        </button>
                        <button onClick={() => setShowImportModal(true)} className="w-10 h-10 rounded-2xl glass-icon text-emerald-600 dark:text-emerald-400 active:scale-95 transition-all shadow-md hover:shadow-emerald-500/20 hover:scale-105 border border-white/20" title="استيراد Excel">
                            <Upload className="w-5 h-5"/>
                        </button>
                        
                        <button onClick={pickRandomStudent} className="w-10 h-10 rounded-2xl glass-icon text-purple-600 dark:text-purple-400 active:scale-95 transition-all shadow-md hover:shadow-purple-500/20 hover:scale-105 border border-white/20" title="اختيار عشوائي">
                            <Sparkles className="w-5 h-5"/>
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 max-w-[65%]">
                        <button onClick={() => setSelectedClass('all')} className={`px-4 py-2.5 text-xs font-black whitespace-nowrap transition-all rounded-xl border shadow-sm ${selectedClass === 'all' ? 'bg-indigo-600 text-white border-indigo-500 shadow-indigo-500/30' : 'glass-card border-white/20 hover:bg-white/10'}`}>الكل</button>
                        {classes.map(c => (
                            <button key={c} onClick={() => setSelectedClass(c)} className={`px-4 py-2.5 text-xs font-black whitespace-nowrap transition-all rounded-xl border shadow-sm ${selectedClass === c ? 'bg-indigo-600 text-white border-indigo-500 shadow-indigo-500/30' : 'glass-card border-white/20 hover:bg-white/10'}`}>{c}</button>
                        ))}
                        <button onClick={() => setShowAddClassModal(true)} className="px-3 py-2 rounded-xl glass-card border border-white/20 hover:bg-white/10 active:scale-95"><Plus className="w-4 h-4"/></button>
                    </div>
                    <div className="relative flex-1">
                        <Search className="absolute right-3 top-3 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="بحث..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full glass-input rounded-xl py-2.5 pr-9 pl-3 text-xs font-bold outline-none border border-white/10 focus:border-indigo-500 shadow-inner" 
                        />
                    </div>
                </div>
            </div>
        </div>

        {/* Student List Content */}
        <div className="flex-1 overflow-y-auto px-4 custom-scrollbar">
            {filteredStudents.length > 0 ? (
                <div className="flex flex-col gap-4 pb-20">
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
                    <LayoutGrid className="w-16 h-16 text-slate-400 mb-4" />
                    <p className="text-sm font-bold text-slate-500 dark:text-white/60">لا يوجد طلاب مطابقين</p>
                </div>
            )}
        </div>

        {/* --- MODALS --- */}

        {/* 1. Add Student Modal */}
        <Modal isOpen={showManualAddModal} onClose={() => { setShowManualAddModal(false); setEditingStudent(null); setEditName(''); setEditPhone(''); setEditClass(''); }}>
            <div className="text-center">
                <h3 className="font-black text-xl mb-4 text-slate-900 dark:text-white">{editingStudent ? 'تعديل بيانات الطالب' : 'إضافة طالب جديد'}</h3>
                <div className="space-y-3">
                    <input className="w-full p-3 glass-input rounded-xl font-bold text-sm outline-none" placeholder="اسم الطالب" value={editName} onChange={e => setEditName(e.target.value)} />
                    <input className="w-full p-3 glass-input rounded-xl font-bold text-sm outline-none" placeholder="الصف (مثال: 5/1)" value={editClass} onChange={e => setEditClass(e.target.value)} />
                    <input className="w-full p-3 glass-input rounded-xl font-bold text-sm outline-none" placeholder="رقم ولي الأمر (اختياري)" value={editPhone} onChange={e => setEditPhone(e.target.value)} type="tel" />
                    <button onClick={handleSaveStudent} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-sm shadow-lg shadow-indigo-500/30">حفظ</button>
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
                <h3 className="font-black text-lg mb-4 text-slate-900 dark:text-white">إضافة فصل جديد</h3>
                <input autoFocus className="w-full p-3 glass-input rounded-xl font-bold text-sm mb-4 outline-none" placeholder="اسم الفصل" value={newClassInput} onChange={e => setNewClassInput(e.target.value)} />
                <button onClick={() => { if(newClassInput.trim()) { onAddClass(newClassInput.trim()); setNewClassInput(''); setShowAddClassModal(false); } }} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black text-sm">إضافة</button>
            </div>
        </Modal>

        {/* 4. Random Picker Modal */}
        <Modal isOpen={isRandomPicking || !!randomStudent} onClose={() => { setRandomStudent(null); setIsRandomPicking(false); }} className="max-w-xs rounded-[2.5rem]">
            <div className="text-center py-6">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full glass-icon border-4 border-indigo-500 shadow-xl overflow-hidden relative">
                    {randomStudent ? (
                        randomStudent.avatar ? <img src={randomStudent.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-4xl font-black text-indigo-500">{randomStudent.name.charAt(0)}</div>
                    ) : (
                        <Sparkles className="w-10 h-10 text-indigo-400 animate-spin" />
                    )}
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 min-h-[2rem]">
                    {randomStudent ? randomStudent.name : 'جاري الاختيار...'}
                </h3>
                {randomStudent && <p className="text-sm font-bold text-slate-500 dark:text-white/60 mb-6">{randomStudent.classes[0]}</p>}
                
                {randomStudent && (
                    <button onClick={() => { setRandomStudent(null); pickRandomStudent(); }} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-sm shadow-lg shadow-indigo-500/30 w-full">
                        اختيار آخر
                    </button>
                )}
            </div>
        </Modal>

        {/* 5. Behavior Reasons Modals */}
        <Modal isOpen={!!showPositiveReasons} onClose={() => setShowPositiveReasons(null)} className="max-w-xs rounded-[2rem]">
            <div className="text-center">
                <h3 className="font-black text-lg mb-4 text-emerald-600 dark:text-emerald-400">سلوك إيجابي</h3>
                <div className="grid grid-cols-2 gap-2 mb-4">
                    {['مشاركة مميزة', 'واجب منزلي', 'نظافة', 'تعاون', 'إجابة نموذجية', 'هدوء'].map(r => (
                        <button key={r} onClick={() => { if(showPositiveReasons) handleAddBehavior(showPositiveReasons.student, 'positive', r, 1); }} className="p-2 glass-card text-xs font-bold hover:bg-emerald-500/20 transition-colors border border-emerald-500/20">{r}</button>
                    ))}
                </div>
                <div className="flex gap-2">
                    <input placeholder="سبب آخر..." value={customBehaviorReason} onChange={e => setCustomBehaviorReason(e.target.value)} className="flex-1 p-2 glass-input rounded-lg text-xs font-bold" />
                    <button onClick={() => { if(showPositiveReasons) handleManualBehaviorSubmit('positive', showPositiveReasons.student); }} className="p-2 bg-emerald-600 text-white rounded-lg"><Plus className="w-4 h-4"/></button>
                </div>
            </div>
        </Modal>

        <Modal isOpen={!!showNegativeReasons} onClose={() => setShowNegativeReasons(null)} className="max-w-xs rounded-[2rem]">
            <div className="text-center">
                <h3 className="font-black text-lg mb-4 text-rose-600 dark:text-rose-400">سلوك سلبي</h3>
                <div className="grid grid-cols-2 gap-2 mb-4">
                    {['إزعاج', 'نسيان كتاب', 'نوم', 'تأخر', 'ألفاظ', 'شجار'].map(r => (
                        <button key={r} onClick={() => { if(showNegativeReasons) handleAddBehavior(showNegativeReasons.student, 'negative', r, -1); }} className="p-2 glass-card text-xs font-bold hover:bg-rose-500/20 transition-colors border border-rose-500/20">{r}</button>
                    ))}
                </div>
                <div className="flex gap-2">
                    <input placeholder="سبب آخر..." value={customBehaviorReason} onChange={e => setCustomBehaviorReason(e.target.value)} className="flex-1 p-2 glass-input rounded-lg text-xs font-bold" />
                    <button onClick={() => { if(showNegativeReasons) handleManualBehaviorSubmit('negative', showNegativeReasons.student); }} className="p-2 bg-rose-600 text-white rounded-lg"><Plus className="w-4 h-4"/></button>
                </div>
            </div>
        </Modal>

    </div>
  );
};

export default StudentList;
