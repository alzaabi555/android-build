import React, { useState } from 'react';
import { Student, Group } from '../types';
import { Users, Trophy, Zap, Plus, Minus, Lock, Unlock, RefreshCw, Crown, Settings, Edit2, Check, X, Search, Palette } from 'lucide-react';

interface GroupCompetitionProps {
  students: Student[];
  classes: string[];
  onUpdateStudent: (s: Student) => void;
  groups: Group[];
  onUpdateGroups: (g: Group[]) => void;
  setStudents: React.Dispatch<React.SetStateAction<Student[]>>;
}

const COLORS = [
    { id: 'emerald', bg: 'bg-emerald-500', light: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    { id: 'orange', bg: 'bg-orange-500', light: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
    { id: 'purple', bg: 'bg-purple-500', light: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    { id: 'blue', bg: 'bg-blue-500', light: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    { id: 'rose', bg: 'bg-rose-500', light: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
    { id: 'indigo', bg: 'bg-indigo-500', light: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
];

const GroupCompetition: React.FC<GroupCompetitionProps> = ({ students, classes, onUpdateStudent, groups, onUpdateGroups, setStudents }) => {
  const [selectedClass, setSelectedClass] = useState(classes[0] || 'all');
  const [isSetupMode, setIsSetupMode] = useState(false);
  
  // Manage Group Modal State
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [groupNameInput, setGroupNameInput] = useState('');
  const [groupColorInput, setGroupColorInput] = useState('emerald');
  const [studentSearch, setStudentSearch] = useState('');

  const filteredStudents = students.filter(s => selectedClass === 'all' || s.classes?.includes(selectedClass));

  // حساب نقاط كل فريق (مجموع نقاط الطلاب المنتمين للفريق)
  const calculateTeamScore = (groupId: string) => {
      const teamStudents = filteredStudents.filter(s => s.groupId === groupId);
      return teamStudents.reduce((total, s) => {
          const points = (s.behaviors || []).reduce((acc, b) => acc + b.points, 0);
          return total + points;
      }, 0);
  };

  const getTeamStudents = (groupId: string) => filteredStudents.filter(s => s.groupId === groupId);

  // إضافة نقاط لكل أعضاء الفريق (مكافأة جماعية)
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
                semester: '1' as const // افتراضي
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
      
      // إذا كان الطالب في المجموعة الحالية، قم بإزالته
      if (student.groupId === editingGroup.id) {
          onUpdateStudent({ ...student, groupId: null });
      } 
      // إذا لم يكن في أي مجموعة، أو في مجموعة أخرى، انقله للمجموعة الحالية
      else {
          onUpdateStudent({ ...student, groupId: editingGroup.id });
      }
  };

  // ترتيب الفرق حسب النقاط
  const sortedTeams = [...groups].sort((a, b) => calculateTeamScore(b.id) - calculateTeamScore(a.id));
  const leadingTeamId = sortedTeams[0]?.id;

  const getStyle = (colorId: string) => COLORS.find(c => c.id === colorId) || COLORS[0];

  return (
    <div className="space-y-6 pb-24 md:pb-8 animate-in fade-in duration-500">
        
        {/* Header Area */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-[2rem] shadow-sm border border-gray-100">
             <div className="flex items-center gap-3 w-full md:w-auto">
                 <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600">
                     <Trophy className="w-6 h-6" />
                 </div>
                 <div>
                     <h2 className="text-lg font-black text-gray-900">دوري العباقرة</h2>
                     <p className="text-[10px] font-bold text-gray-400">التنافس الجماعي لتعزيز السلوك الإيجابي</p>
                 </div>
             </div>

             <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 custom-scrollbar">
                 <button 
                    onClick={() => setIsSetupMode(!isSetupMode)}
                    className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all ${isSetupMode ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                 >
                     {isSetupMode ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                     {isSetupMode ? 'إنهاء الإدارة' : 'إدارة الفرق'}
                 </button>
                 
                 <div className="h-6 w-px bg-gray-200 mx-1"></div>

                 {classes.map(c => (
                    <button 
                        key={c}
                        onClick={() => setSelectedClass(c)} 
                        className={`px-3 py-2 rounded-xl text-[10px] font-black whitespace-nowrap transition-all ${selectedClass === c ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-500 border border-gray-100'}`}
                    >
                        {c}
                    </button>
                 ))}
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
                        <div key={group.id} className={`relative bg-white rounded-[1.5rem] md:rounded-[2.5rem] p-3 md:p-5 shadow-sm border-2 transition-all duration-300 ${isLeader ? 'border-amber-400 scale-[1.02] shadow-xl shadow-amber-100' : 'border-gray-100'}`}>
                            
                            {isLeader && (
                                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-amber-400 text-white px-2 py-0.5 rounded-full text-[9px] font-black flex items-center gap-1 shadow-sm z-10 whitespace-nowrap">
                                    <Crown className="w-2.5 h-2.5 fill-white" />
                                    المتصدر
                                </div>
                            )}

                            <div className={`h-16 md:h-24 rounded-2xl md:rounded-[2rem] ${style.light} flex items-center justify-between px-3 md:px-6 mb-3 relative overflow-hidden`}>
                                <div className="z-10">
                                    <h3 className={`font-black text-sm md:text-lg ${style.text}`}>{group.name}</h3>
                                </div>
                                <div className="text-center z-10">
                                    <span className={`block text-xl md:text-3xl font-black ${style.text}`}>{score}</span>
                                    <span className="text-[8px] md:text-[9px] font-bold text-gray-400 opacity-80">نقطة</span>
                                </div>
                                <div className={`absolute -right-4 -bottom-4 w-16 h-16 md:w-24 md:h-24 rounded-full ${style.bg} opacity-10 blur-xl`}></div>
                            </div>

                            <div className="grid grid-cols-2 gap-1 md:gap-2 mb-3">
                                <button onClick={() => awardTeam(group.id, 5, 'هدوء ونظام')} className="py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[9px] font-black transition-colors active:scale-95 flex flex-col items-center gap-0.5">
                                    <Plus className="w-3 h-3 md:w-4 md:h-4" />
                                    <span>نظام</span>
                                </button>
                                <button onClick={() => awardTeam(group.id, 10, 'إجابة جماعية')} className="py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[9px] font-black transition-colors active:scale-95 flex flex-col items-center gap-0.5">
                                    <Zap className="w-3 h-3 md:w-4 md:h-4" />
                                    <span>تفاعل</span>
                                </button>
                                <button onClick={() => awardTeam(group.id, -5, 'إزعاج جماعي')} className="py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[9px] font-black transition-colors active:scale-95 flex flex-col items-center gap-0.5 col-span-2">
                                    <Minus className="w-3 h-3 md:w-4 md:h-4" />
                                    <span>مخالفة</span>
                                </button>
                            </div>

                            <div className="bg-gray-50 rounded-xl p-2 md:p-3 min-h-[60px] md:min-h-[80px]">
                                <div className="flex justify-between items-center mb-1 md:mb-2">
                                    <span className="text-[9px] md:text-[10px] font-bold text-gray-400">الأعضاء ({membersCount})</span>
                                    <Users className="w-3 h-3 text-gray-300" />
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {getTeamStudents(group.id).map(s => (
                                        <span key={s.id} className="text-[8px] md:text-[9px] bg-white border border-gray-100 px-1 py-0.5 rounded text-gray-600 truncate max-w-[50px] md:max-w-[60px]">{s.name.split(' ')[0]}</span>
                                    ))}
                                    {membersCount === 0 && <span className="text-[8px] text-gray-300 mx-auto mt-1">لا يوجد أعضاء</span>}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        )}

        {/* --- SETUP VIEW --- */}
        {isSetupMode && (
            <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-6">
                    <div className="bg-indigo-100 p-2 rounded-xl text-indigo-600"><RefreshCw className="w-5 h-5"/></div>
                    <div>
                        <h3 className="font-black text-gray-900">إدارة الفرق</h3>
                        <p className="text-xs text-gray-400 font-bold">اضغط على الفريق لتعديل الاسم وإضافة الطلاب</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {groups.map(group => {
                        const style = getStyle(group.color);
                        const memberCount = getTeamStudents(group.id).length;
                        return (
                            <button 
                                key={group.id} 
                                onClick={() => openManageGroup(group)}
                                className={`flex flex-col items-center justify-center p-6 rounded-[2rem] border-2 transition-all active:scale-95 hover:shadow-md ${style.light} ${style.border}`}
                            >
                                <div className={`w-12 h-12 rounded-full ${style.bg} text-white flex items-center justify-center mb-3 shadow-md`}>
                                    <Edit2 className="w-5 h-5" />
                                </div>
                                <h3 className={`font-black text-lg ${style.text} mb-1`}>{group.name}</h3>
                                <span className="text-[10px] font-bold text-gray-500 bg-white/50 px-3 py-1 rounded-full">
                                    {memberCount} طالب
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        )}

        {/* Manage Group Modal */}
        {editingGroup && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setEditingGroup(null)}>
                <div className="bg-white w-full max-w-lg h-[85vh] rounded-[2.5rem] shadow-2xl flex flex-col relative overflow-hidden" onClick={e => e.stopPropagation()}>
                    
                    {/* Modal Header */}
                    <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-black text-gray-900 text-lg">تعديل الفريق</h3>
                            <button onClick={() => setEditingGroup(null)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X className="w-5 h-5 text-gray-500"/></button>
                        </div>
                        
                        <div className="flex gap-3 mb-4">
                            <input 
                                type="text" 
                                value={groupNameInput}
                                onChange={e => setGroupNameInput(e.target.value)}
                                className="flex-[2] bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-500"
                                placeholder="اسم الفريق"
                            />
                            <button onClick={handleSaveGroup} className="flex-1 bg-indigo-600 text-white rounded-xl font-black text-xs shadow-lg shadow-indigo-200">
                                حفظ التغييرات
                            </button>
                        </div>

                        <div className="flex gap-2 justify-center">
                            {COLORS.map(c => (
                                <button 
                                    key={c.id}
                                    onClick={() => setGroupColorInput(c.id)}
                                    className={`w-8 h-8 rounded-full border-2 ${c.bg} ${groupColorInput === c.id ? 'border-gray-900 scale-110 shadow-sm' : 'border-transparent opacity-50'}`}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Student Selection List */}
                    <div className="flex-1 flex flex-col min-h-0 bg-white">
                        <div className="p-4 pb-2">
                             <div className="relative">
                                <Search className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
                                <input 
                                    type="text" 
                                    placeholder="ابحث لإضافة طالب..." 
                                    value={studentSearch} 
                                    onChange={e => setStudentSearch(e.target.value)} 
                                    className="w-full bg-gray-50 rounded-xl py-2.5 pr-9 pl-4 text-xs font-bold outline-none border border-gray-100 focus:border-indigo-200" 
                                />
                             </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
                            <p className="text-[10px] font-bold text-gray-400 mb-2">حدد الطلاب للانضمام إلى {groupNameInput}:</p>
                            {filteredStudents
                                .filter(s => s.name.toLowerCase().includes(studentSearch.toLowerCase()))
                                .map(student => {
                                    const inCurrentGroup = student.groupId === editingGroup.id;
                                    const inOtherGroup = student.groupId && student.groupId !== editingGroup.id;
                                    const otherGroupName = inOtherGroup ? groups.find(g => g.id === student.groupId)?.name : '';

                                    return (
                                        <div 
                                            key={student.id} 
                                            onClick={() => toggleStudentGroup(student)}
                                            className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all active:scale-[0.98] ${inCurrentGroup ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-gray-100 hover:bg-gray-50'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-6 h-6 rounded-full border flex items-center justify-center ${inCurrentGroup ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300 bg-white'}`}>
                                                    {inCurrentGroup && <Check className="w-3.5 h-3.5" />}
                                                </div>
                                                <div>
                                                    <p className={`text-xs font-black ${inCurrentGroup ? 'text-gray-900' : 'text-gray-600'}`}>{student.name}</p>
                                                    {inOtherGroup && <p className="text-[9px] text-orange-500 font-bold">منضم لـ {otherGroupName}</p>}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            }
                            {filteredStudents.length === 0 && <p className="text-center text-gray-400 text-xs py-4">لا يوجد طلاب في هذا الفصل</p>}
                        </div>
                    </div>
                </div>
            </div>
        )}

    </div>
  );
};

export default GroupCompetition;