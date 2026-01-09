
import React, { useState } from 'react';
import { Student } from '../types';
import { Trophy, Crown, ShoppingBag, Star, Shield, Zap, X, Filter, Search, Coins, Sparkles, CheckCircle2 } from 'lucide-react';
import Modal from './Modal';

interface GamificationHubProps {
  students: Student[];
  classes: string[];
  onUpdateStudent: (s: Student) => void;
}

interface RewardItem {
    id: string;
    title: string;
    cost: number;
    icon: string;
    bg: string;
}

const REWARDS: RewardItem[] = [
    { id: '1', title: 'تغيير المكان', cost: 15, icon: '🪑', bg: 'bg-blue-500/20 text-blue-200' },
    { id: '2', title: 'قائد الطابور', cost: 10, icon: '🚩', bg: 'bg-emerald-500/20 text-emerald-200' },
    { id: '3', title: 'إعفاء واجب', cost: 50, icon: '📝', bg: 'bg-purple-500/20 text-purple-200' },
    { id: '4', title: 'مساعد المعلم', cost: 25, icon: '👨‍🏫', bg: 'bg-amber-500/20 text-amber-200' },
    { id: '5', title: 'قلم مميز', cost: 30, icon: '✏️', bg: 'bg-rose-500/20 text-rose-200' },
    { id: '6', title: 'نجمة الفصل', cost: 40, icon: '⭐', bg: 'bg-yellow-500/20 text-yellow-200' },
];

const LEVELS = [
    { name: 'مبتدئ', min: 0, color: 'text-gray-400', bg: 'bg-gray-500/20' },
    { name: 'مغامر', min: 10, color: 'text-blue-400', bg: 'bg-blue-500/20' },
    { name: 'فارس', min: 30, color: 'text-indigo-400', bg: 'bg-indigo-500/20' },
    { name: 'بطل', min: 60, color: 'text-purple-400', bg: 'bg-purple-500/20' },
    { name: 'أسطورة', min: 100, color: 'text-amber-400', bg: 'bg-amber-500/20' },
];

const GamificationHub: React.FC<GamificationHubProps> = ({ students, classes, onUpdateStudent }) => {
  const [selectedClass, setSelectedClass] = useState(classes[0] || 'all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showStore, setShowStore] = useState(false);

  const getBalance = (student: Student) => {
      const positivePoints = (student.behaviors || [])
        .filter(b => b.type === 'positive')
        .reduce((acc, b) => acc + b.points, 0);
      const spent = student.spentCoins || 0;
      return Math.max(0, positivePoints - spent);
  };

  const getTotalPoints = (student: Student) => {
      return (student.behaviors || [])
        .filter(b => b.type === 'positive')
        .reduce((acc, b) => acc + b.points, 0);
  };

  const getLevel = (points: number) => {
      return LEVELS.slice().reverse().find(l => points >= l.min) || LEVELS[0];
  };

  const getAvatarUrl = (id: string) => {
      return `https://api.dicebear.com/7.x/adventurer/svg?seed=${id}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = selectedClass === 'all' || s.classes?.includes(selectedClass);
    return matchesSearch && matchesClass;
  });

  const sortedStudents = [...filteredStudents].sort((a, b) => getBalance(b) - getBalance(a));

  const handlePurchase = (reward: RewardItem) => {
      if (!selectedStudent) return;
      const balance = getBalance(selectedStudent);
      
      if (balance >= reward.cost) {
          if (confirm(`هل يريد ${selectedStudent.name} شراء "${reward.title}" مقابل ${reward.cost} عملة؟`)) {
              const currentSpent = selectedStudent.spentCoins || 0;
              const updatedStudent = { 
                  ...selectedStudent, 
                  spentCoins: currentSpent + reward.cost 
              };
              onUpdateStudent(updatedStudent);
              setSelectedStudent(updatedStudent);
              alert('تم الشراء بنجاح! 🎉');
          }
      } else {
          alert('عذراً، رصيد العملات لا يكفي! 😔');
      }
  };

  return (
    <div className="space-y-4 pb-24 md:pb-8 animate-in fade-in duration-500 text-slate-900 dark:text-white">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600/80 to-indigo-600/80 backdrop-blur-xl rounded-[2rem] p-6 text-white shadow-lg relative overflow-hidden border border-white/10 shimmer-hover">
          <div className="relative z-10">
              <h2 className="text-2xl font-black flex items-center gap-2 mb-1">
                  <Crown className="w-8 h-8 text-yellow-300" />
                  فرسان الفصل
              </h2>
              <p className="text-indigo-200 text-xs font-bold max-w-xs">
                  نظام التحفيز والتكريم. جمع العملات الذهبية واستبدلها بمكافآت رائعة!
              </p>
          </div>
          <Sparkles className="absolute top-0 right-0 w-32 h-32 text-white opacity-10 rotate-45" />
          <Trophy className="absolute bottom-[-10px] left-4 w-24 h-24 text-yellow-400 opacity-20 rotate-[-12deg]" />
      </div>

      {/* Filters */}
      <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
         <button 
            onClick={() => setSelectedClass('all')} 
            className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all border ${selectedClass === 'all' ? 'bg-indigo-600 text-white shadow-md border-indigo-600' : 'glass-card text-slate-600 dark:text-white/60 border-white/20'}`}
         >
            الكل
         </button>
         {classes.map(c => (
            <button 
                key={c}
                onClick={() => setSelectedClass(c)} 
                className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all border ${selectedClass === c ? 'bg-indigo-600 text-white shadow-md border-indigo-600' : 'glass-card text-slate-600 dark:text-white/60 border-white/20'}`}
            >
                {c}
            </button>
         ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {sortedStudents.map((student, idx) => {
              const balance = getBalance(student);
              const total = getTotalPoints(student);
              const level = getLevel(total);
              
              return (
                  <div 
                    key={student.id} 
                    onClick={() => { setSelectedStudent(student); setShowStore(true); }}
                    className="glass-card rounded-3xl p-4 border border-white/20 shadow-sm relative overflow-hidden group cursor-pointer active:scale-95 transition-all shimmer-hover"
                  >
                      {/* Rank Badge */}
                      <div className="absolute top-3 left-3 w-6 h-6 glass-icon rounded-full flex items-center justify-center text-[10px] font-black text-slate-600 dark:text-white z-10">
                          #{idx + 1}
                      </div>

                      <div className="flex flex-col items-center">
                          <div className="w-20 h-20 rounded-full glass-icon border-4 border-white/20 shadow-md mb-3 overflow-hidden">
                              <img src={getAvatarUrl(student.id)} alt="avatar" className="w-full h-full object-cover" />
                          </div>
                          <h3 className="font-black text-slate-800 dark:text-white text-sm text-center mb-1 truncate w-full">{student.name}</h3>
                          
                          <div className={`px-2 py-0.5 rounded-md text-[9px] font-black mb-3 ${level.bg} ${level.color}`}>
                              {level.name}
                          </div>

                          <div className="w-full glass-input rounded-xl p-2 flex items-center justify-between border border-white/10">
                              <span className="text-[9px] font-bold text-slate-400 dark:text-white/40">الرصيد</span>
                              <div className="flex items-center gap-1">
                                  <span className="text-sm font-black text-amber-500">{balance}</span>
                                  <Coins className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                              </div>
                          </div>
                      </div>
                  </div>
              );
          })}
      </div>

      {sortedStudents.length === 0 && (
          <div className="text-center py-20 opacity-50">
              <Search className="w-12 h-12 mx-auto text-gray-300 mb-2" />
              <p className="text-sm font-bold text-gray-400">لا يوجد فرسان في هذا الفصل</p>
          </div>
      )}

      {/* Student Store Modal */}
      <Modal 
        isOpen={showStore && !!selectedStudent} 
        onClose={() => setShowStore(false)}
        className="w-full max-w-lg h-[85vh] overflow-hidden p-0 rounded-[2rem]"
      >
          {selectedStudent && (
            <>
              {/* Modal Header */}
              <div className="glass-heavy p-6 pb-2 shrink-0">
                  <div className="flex justify-between items-start mb-4">
                      <button onClick={() => setShowStore(false)} className="p-2 glass-icon rounded-full hover:bg-white/20 shadow-sm"><X className="w-5 h-5 text-slate-500 dark:text-white"/></button>
                      <div className="bg-amber-500/20 text-amber-700 dark:text-amber-300 px-4 py-1.5 rounded-full flex items-center gap-2 font-black text-sm shadow-sm border border-amber-500/30">
                          <span>{getBalance(selectedStudent)}</span>
                          <Coins className="w-4 h-4 fill-amber-600 dark:fill-amber-400" />
                      </div>
                  </div>
                  
                  <div className="flex items-center gap-4 mb-4">
                      <div className="w-20 h-20 rounded-full glass-icon border-4 border-indigo-500/30 shadow-md overflow-hidden shrink-0">
                            <img src={getAvatarUrl(selectedStudent.id)} alt="avatar" className="w-full h-full object-cover" />
                      </div>
                      <div>
                          <h2 className="text-xl font-black text-slate-900 dark:text-white leading-tight mb-1">{selectedStudent.name}</h2>
                          <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${getLevel(getTotalPoints(selectedStudent)).bg} ${getLevel(getTotalPoints(selectedStudent)).color}`}>
                                  {getLevel(getTotalPoints(selectedStudent)).name}
                              </span>
                              <span className="text-[10px] text-slate-400 dark:text-white/40 font-bold">مجموع النقاط: {getTotalPoints(selectedStudent)}</span>
                          </div>
                      </div>
                  </div>

                  <div className="w-full h-1.5 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full" 
                        style={{ width: `${Math.min(100, (getTotalPoints(selectedStudent) % 30) / 30 * 100)}%` }}
                      ></div>
                  </div>
                  <p className="text-[9px] text-slate-400 dark:text-white/40 text-left mt-1 font-bold">التقدم للمستوى التالي</p>
              </div>

              {/* Store Content */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pt-2 glass-card rounded-none border-0">
                  <h3 className="font-black text-slate-800 dark:text-white text-sm mb-4 flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      متجر المكافآت
                  </h3>

                  <div className="grid grid-cols-2 gap-3">
                      {REWARDS.map(reward => (
                          <button 
                            key={reward.id}
                            onClick={() => handlePurchase(reward)}
                            className={`relative p-4 rounded-2xl border-2 transition-all group flex flex-col items-center text-center ${reward.bg} border-transparent hover:border-indigo-200 dark:hover:border-white/20 active:scale-95 shimmer-hover`}
                          >
                              <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">{reward.icon}</div>
                              <h4 className="font-black text-slate-800 dark:text-slate-900 text-xs mb-1">{reward.title}</h4>
                              <div className="flex items-center gap-1 bg-white/30 px-2 py-1 rounded-lg">
                                  <span className="font-black text-amber-600 text-xs">{reward.cost}</span>
                                  <Coins className="w-3 h-3 text-amber-500 fill-amber-500" />
                              </div>
                              
                              {getBalance(selectedStudent) >= reward.cost && (
                                  <div className="absolute top-2 left-2 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-md">
                                      <CheckCircle2 className="w-3 h-3" />
                                  </div>
                              )}
                          </button>
                      ))}
                  </div>
              </div>
            </>
          )}
      </Modal>

    </div>
  );
};

export default GamificationHub;
