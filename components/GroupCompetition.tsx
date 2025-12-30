
import React, { useState, useEffect } from 'react';
import { Student, Group } from '../types';
import { Users, Trophy, Zap, Plus, Minus, Lock, Unlock, RefreshCw, Crown, Settings, Edit2, Check, X, Search, Palette } from 'lucide-react';
import Modal from './Modal';
import { useTheme } from '../context/ThemeContext';

interface GroupCompetitionProps {
  students: Student[];
  classes: string[];
  onUpdateStudent: (s: Student) => void;
  groups: Group[];
  onUpdateGroups: (g: Group[]) => void;
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
}

const COLORS = [
    { id: 'emerald', bg: 'bg-emerald-500', light: 'bg-emerald-100 dark:bg-emerald-500/20', text: 'text-emerald-700 dark:text-emerald-200', border: 'border-emerald-200 dark:border-emerald-500/30' },
    { id: 'orange', bg: 'bg-orange-500', light: 'bg-orange-100 dark:bg-orange-500/20', text: 'text-orange-700 dark:text-orange-200', border: 'border-orange-200 dark:border-orange-500/30' },
    { id: 'purple', bg: 'bg-purple-500', light: 'bg-purple-100 dark:bg-purple-500/20', text: 'text-purple-700 dark:text-purple-200', border: 'border-purple-200 dark:border-purple-500/30' },
    { id: 'blue', bg: 'bg-blue-500', light: 'bg-blue-100 dark:bg-blue-500/20', text: 'text-blue-700 dark:text-blue-200', border: 'border-blue-200 dark:border-blue-500/30' },
    { id: 'rose', bg: 'bg-rose-500', light: 'bg-rose-100 dark:bg-rose-500/20', text: 'text-rose-700 dark:text-rose-200', border: 'border-rose-200 dark:border-rose-500/30' },
    { id: 'indigo', bg: 'bg-indigo-500', light: 'bg-indigo-100 dark:bg-indigo-500/20', text: 'text-indigo-700 dark:text-indigo-200', border: 'border-indigo-200 dark:border-indigo-500/30' },
];

const GroupCompetition: React.FC<GroupCompetitionProps> = ({ students, classes, onUpdateStudent, groups, onUpdateGroups, setStudents }) => {
  const { theme } = useTheme();
  const [selectedClass, setSelectedClass] = useState(classes[0] || 'all');
  const [isSetupMode, setIsSetupMode] = useState(false);
  
  // Manage Group Modal State
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [groupNameInput, setGroupNameInput] = useState('');
  const [groupColorInput, setGroupColorInput] = useState('emerald');
  const [studentSearch, setStudentSearch] = useState('');

  const styles = {
      card: 'bg-white dark:bg-white/5 shadow-sm border border-gray-100 dark:border-white/5 backdrop-blur-md rounded-[1.5rem] md:rounded-[2.5rem]',
      header: 'bg-white/80 dark:bg-white/5 shadow-sm border border-gray-200 dark:border-white/10 backdrop-blur-xl',
      pill: 'rounded-xl border border-gray-200 dark:border-white/10',
  };

  const filteredStudents = students.filter(s => selectedClass === 'all' || s.classes?.includes(selectedClass));

  const calculateTeamScore = (groupId: string) => {
      const teamStudents = filteredStudents.filter(s => s.groupId === groupId);
      return teamStudents.reduce((total, s) => {
          const points = (s.behaviors || []).reduce((acc, b) => acc + b.points, 0);
          return total + points;
      }, 0);
  };

  const getTeamStudents = (groupId: string) => filteredStudents.filter(s => s.groupId === groupId);

  const awardTeam = (groupId: string, points: number, reason: string) => {
      const teamMembers = getTeamStudents(groupId);
      if (teamMembers.length === 0) return;

      const team = groups.find(g => g.id === groupId);
      const groupName = team ? team.name : 'الفريق';

      const updatedStudents = students.map(s => {
          if (s.groupId === groupId && (selectedClass === 'all' || s.classes.includes(selectedClass))) {
             const newBehavior = {
                id: Math.random().toString(36).substr(2, 9),
                date: new Date().toISOString(),
                type: points > 0 ? 'positive' : 'negative' as any,
                description: `${reason} (${groupName})`,
                points: points,
                semester: '1' as const
            };
            return {
                ...s,
                behaviors: [newBehavior, ...(s.behaviors || [])]
            };
          }
          return s;
      });
      setStudents(updatedStudents);
  };

  const openManageGroup = (group: Group) => {
      setEditingGroup(group);
      setGroupNameInput(group.name);
      setGroupColorInput(group.color);
      setStudentSearch('');
  };

  const handleSaveGroup = () => {
      if (editingGroup && groupNameInput.trim()) {
          const updatedGroups = groups.map(g => g.id === editingGroup.id ? { ...g, name: groupNameInput, color: groupColorInput } : g);
          onUpdateGroups(updatedGroups);
          setEditingGroup(null);
      }
  };

  const toggleStudentGroup = (student: Student) => {
      if (!editingGroup) return;
      if (student.groupId === editingGroup.id) {
          onUpdateStudent({ ...student, groupId: null });
      } 
      else {
          onUpdateStudent({ ...student, groupId: editingGroup.id });
      }
  };

  const sortedTeams = [...groups].sort((a, b) => calculateTeamScore(b.id) - calculateTeamScore(a.id));
  const leadingTeamId = sortedTeams[0]?.id;

  const getStyle = (colorId: string) => COLORS.find(c => c.id === colorId) || COLORS[0];

  return (
    <div className="space-y-6 pb-24 md:pb-8 text-slate-900 dark:text-white">
        
        {/* Header Area */}
        <div className={`flex flex-col md:flex-row justify-between items-center gap-4 p-4 rounded-[2rem] ${styles.header}`}>
             <div className="flex items-center gap-3 w-full md:w-auto">
                 <div className="w-12 h-12 bg-amber-100 dark:bg-amber-500/20 rounded-2xl flex items-center justify-center text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
                     <Trophy className="w-6 h-6" />
                 </div>
                 <div>
                     <h2 className="text-lg font-black text-slate-900 dark:text-white">دوري العباقرة</h2>
                     <p className="text-[10px] font-bold text-slate-500 dark:text-white/50">التنافس الجماعي لتعزيز السلوك الإيجابي</p>
                 </div>
             </div>

             <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 custom-scrollbar">
                 <button onClick={() => setIsSetupMode(!isSetupMode)} className={`px-4 py-2 text-xs font-black flex items-center gap-2 transition-all ${isSetupMode ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 rounded-xl' : `bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-white/60 hover:bg-slate-200 dark:hover:bg-white/20 ${styles.pill}`}`}>
                     {isSetupMode ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                     {isSetupMode ? 'إنهاء الإدارة' : 'إدارة الفرق'}
                 </button>
                 <div className="h-6 w-px bg-gray-200 dark:bg-white/10 mx-1"></div>
                 {classes.map(c => (<button key={c} onClick={() => setSelectedClass(c)} className={`px-3 py-2 text-[10px] font-black whitespace-nowrap transition-all ${selectedClass === c ? 'bg-indigo-600 dark:bg-white text-white dark:text-black shadow-md rounded-xl' : `bg-white dark:bg-white/5 text-slate-600 dark:text-white/60 hover:bg-gray-50 dark:hover:bg-white/10 ${styles.pill}`}`}>{c}</button>))}
             </div>
        </div>

        {/* --- GAME VIEW --- */}
        {!isSetupMode && (
            <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-4 gap-2 md:gap-4">
                {groups.map((group) => {
                    const style = getStyle(group.color);
                    const score = calculateTeamScore(group.id);
                    const isLeader = group.id === leadingTeamId && score > 0;
                    const membersCount = getTeamStudents(group.id).length;

                    return (
                        <div key={group.id} className={`relative p-3 md:p-5 transition-all duration-300 ${styles.card} ${isLeader ? 'border-amber-400 scale-[1.02] shadow-[0_0_30px_rgba(251,191,36,0.3)]' : ''}`}>
                            {isLeader && (<div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-amber-400 text-black px-2 py-0.5 rounded-full text-[9px] font-black flex items-center gap-1 shadow-sm z-10 whitespace-nowrap"><Crown className="w-2.5 h-2.5 fill-black" /> المتصدر</div>)}
                            <div className={`h-16 md:h-24 rounded-2xl md:rounded-[2rem] ${style.light} flex items-center justify-between px-3 md:px-6 mb-3 relative overflow-hidden border ${style.border}`}>
                                <div className="z-10"><h3 className={`font-black text-sm md:text-lg ${style.text}`}>{group.name}</h3></div>
                                <div className="text-center z-10"><span className={`block text-xl md:text-3xl font-black ${style.text}`}>{score}</span><span className="text-[8px] md:text-[9px] font-bold text-slate-500 dark:text-white/40">نقطة</span></div>
                                <div className={`absolute -right-4 -bottom-4 w-16 h-16 md:w-24 md:h-24 rounded-full ${style.bg} opacity-10 dark:opacity-20 blur-xl`}></div>
                            </div>
                            <div className="grid grid-cols-2 gap-1 md:gap-2 mb-3">
                                <button onClick={() => awardTeam(group.id, 5, 'هدوء ونظام')} className="py-2 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-500/20 rounded-lg text-[9px] font-black transition-colors active:scale-95 flex flex-col items-center gap-0.5"><Plus className="w-3 h-3 md:w-4 md:h-4" /><span>نظام</span></button>
                                <button onClick={() => awardTeam(group.id, 10, 'إجابة جماعية')} className="py-2 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-300 border border-blue-100 dark:border-blue-500/20 rounded-lg text-[9px] font-black transition-colors active:scale-95 flex flex-col items-center gap-0.5"><Zap className="w-3 h-3 md:w-4 md:h-4" /><span>تفاعل</span></button>
                                <button onClick={() => awardTeam(group.id, -5, 'إزعاج جماعي')} className="py-2 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-100 dark:border-rose-500/20 rounded-lg text-[9px] font-black transition-colors active:scale-95 flex flex-col items-center gap-0.5 col-span-2"><Minus className="w-3 h-3 md:w-4 md:h-4" /><span>مخالفة</span></button>
                            </div>
                            <div className="bg-gray-50 dark:bg-black/20 border-gray-100 dark:border-white/5 rounded-xl p-2 md:p-3 min-h-[60px] md:min-h-[80px] border"><div className="flex justify-between items-center mb-1 md:mb-2"><span className="text-[9px] md:text-[10px] font-bold text-slate-400 dark:text-white/40">الأعضاء ({membersCount})</span><Users className="w-3 h-3 text-slate-400 dark:text-white/30" /></div><div className="flex flex-wrap gap-1">{getTeamStudents(group.id).map(s => (<span key={s.id} className="text-[8px] md:text-[9px] bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 px-1 py-0.5 rounded text-slate-600 dark:text-white/70 truncate max-w-[50px] md:max-w-[60px]">{s.name.split(' ')[0]}</span>))}{membersCount === 0 && <span className="text-[8px] text-slate-300 dark:text-white/20 mx-auto mt-1">لا يوجد أعضاء</span>}</div></div>
                        </div>
                    );
                })}
            </div>
        )}

        {/* --- SETUP VIEW --- */}
        {isSetupMode && (
            <div className={`p-6 ${styles.header} rounded-[2.5rem]`}>
                <div className="flex items-center gap-2 mb-6"><div className="bg-indigo-50 dark:bg-indigo-500/20 p-2 rounded-xl text-indigo-600 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-500/20"><RefreshCw className="w-5 h-5"/></div><div><h3 className="font-black text-slate-900 dark:text-white">إدارة الفرق</h3><p className="text-xs text-slate-500 dark:text-white/50 font-bold">اضغط على الفريق لتعديل الاسم وإضافة الطلاب</p></div></div>
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {groups.map(group => {
                        const style = getStyle(group.color);
                        const memberCount = getTeamStudents(group.id).length;
                        return (
                            <button key={group.id} onClick={() => openManageGroup(group)} className={`flex flex-col items-center justify-center p-6 rounded-[2rem] border-2 transition-all active:scale-95 hover:bg-gray-50 dark:hover:bg-white/5 ${style.light} ${style.border}`}>
                                <div className={`w-12 h-12 rounded-full ${style.bg} text-white flex items-center justify-center mb-3 shadow-md`}><Edit2 className="w-5 h-5" /></div>
                                <h3 className={`font-black text-lg ${style.text} mb-1`}>{group.name}</h3>
                                <span className="text-[10px] font-bold text-slate-500 dark:text-white/60 bg-white dark:bg-black/20 px-3 py-1 rounded-full">{memberCount} طالب</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        )}

        {/* Manage Group Modal */}
        <Modal isOpen={!!editingGroup} onClose={() => setEditingGroup(null)} className="rounded-[28px]">
            <div className="flex justify-between items-center mb-4 shrink-0">
                <h3 className="font-black text-slate-900 dark:text-white text-lg">تعديل الفريق</h3>
                <button onClick={() => setEditingGroup(null)} className="p-2 bg-slate-100 dark:bg-white/10 rounded-full hover:bg-slate-200 dark:hover:bg-white/20"><X className="w-5 h-5 text-slate-500 dark:text-white/70"/></button>
            </div>
            
            <div className="flex gap-2 mb-2 shrink-0">
                <input type="text" value={groupNameInput} onChange={e => setGroupNameInput(e.target.value)} className="flex-[2] bg-slate-100 dark:bg-black/20 border border-transparent dark:border-white/10 text-slate-900 dark:text-white rounded-xl px-3 py-3 text-sm font-bold outline-none focus:border-indigo-500" placeholder="اسم الفريق" />
                <button onClick={handleSaveGroup} className="flex-1 bg-indigo-600 text-white rounded-xl font-black text-xs shadow-lg shadow-indigo-500/30">حفظ</button>
            </div>

            <div className="flex gap-2 justify-center mb-2 shrink-0">{COLORS.map(c => (<button key={c.id} onClick={() => setGroupColorInput(c.id)} className={`w-8 h-8 rounded-full border-2 ${c.bg} ${groupColorInput === c.id ? 'border-slate-800 dark:border-white scale-110 shadow-md' : 'border-transparent opacity-50'}`} />))}</div>

            <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50 dark:bg-black/20 rounded-2xl p-2 border border-gray-100 dark:border-white/5">
                <div className="p-2 pb-2"><div className="relative"><Search className="absolute right-3 top-3 w-4 h-4 text-slate-400 dark:text-white/40" /><input type="text" placeholder="ابحث لإضافة طالب..." value={studentSearch} onChange={e => setStudentSearch(e.target.value)} className="w-full bg-white dark:bg-white/5 rounded-xl py-2.5 pr-9 pl-4 text-xs font-bold outline-none border border-gray-200 dark:border-white/10 focus:bg-white dark:focus:bg-white/10 text-slate-900 dark:text-white" /></div></div>
                <div className="space-y-1 p-1">
                    {filteredStudents.filter(s => s.name.toLowerCase().includes(studentSearch.toLowerCase())).map(student => {
                            const inCurrentGroup = student.groupId === editingGroup?.id;
                            return (
                                <div key={student.id} onClick={() => toggleStudentGroup(student)} className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${inCurrentGroup ? 'bg-emerald-100 dark:bg-emerald-500/20 border-emerald-300 dark:border-emerald-500/40' : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/10'}`}>
                                    <div className="flex items-center gap-3"><div className={`w-5 h-5 rounded-full border flex items-center justify-center ${inCurrentGroup ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300 dark:border-white/20 bg-transparent'}`}>{inCurrentGroup && <Check className="w-3 h-3" />}</div><p className={`text-xs font-black ${inCurrentGroup ? 'text-emerald-800 dark:text-emerald-100' : 'text-slate-600 dark:text-white/70'}`}>{student.name}</p></div>
                                </div>
                            );
                        })
                    }
                </div>
            </div>
        </Modal>
    </div>
  );
};

export default GroupCompetition;
