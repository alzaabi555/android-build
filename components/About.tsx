
import React, { useState, useRef } from 'react';
import { Users, Phone } from 'lucide-react';
import BrandLogo from './BrandLogo';
import Modal from './Modal';
import AdminGenerator from './AdminGenerator';

const About: React.FC = () => {
  const [clickCount, setClickCount] = useState(0);
  const [showAdmin, setShowAdmin] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLogoClick = () => {
      // Clear existing timeout to allow rapid clicking
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      
      setClickCount(prev => {
          const newCount = prev + 1;
          if (newCount >= 5) {
              setShowAdmin(true);
              return 0;
          }
          return newCount;
      });

      // Reset count if user stops clicking for 1 second
      timeoutRef.current = setTimeout(() => {
          setClickCount(0);
      }, 1000);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-full p-6 text-slate-900 dark:text-white animate-in fade-in zoom-in duration-500">
      
      {/* Clickable Logo Container with Secret Trigger */}
      <div 
        onClick={handleLogoClick}
        className="w-40 h-40 glass-heavy rounded-[3rem] shadow-2xl flex items-center justify-center mb-8 border border-white/20 p-4 relative group cursor-pointer active:scale-95 transition-transform select-none shimmer-hover"
      >
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 rounded-[3rem] blur-xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
          <BrandLogo className="w-full h-full relative z-10" showText={false} />
          
          {/* Visual feedback for developer clicks (Countdown) */}
          {clickCount > 0 && clickCount < 5 && (
              <div className="absolute -top-2 -right-2 bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shadow-lg animate-bounce z-20 border-2 border-white dark:border-black">
                  {5 - clickCount}
              </div>
          )}
      </div>
      
      <h1 className="text-5xl font-black mb-2 tracking-tighter text-glow">تطبيق راصد</h1>
      <p className="glass-card px-6 py-2 rounded-full text-slate-500 dark:text-white/60 font-black text-xs mb-10 border-none shadow-sm">V 3.6.0 • الإصدار الملكي</p>
      
      <div className="glass-heavy border border-white/10 rounded-[3rem] p-10 max-w-md w-full text-center shadow-2xl backdrop-blur-xl">
          <h2 className="text-xl font-black text-slate-800 dark:text-white mb-8 relative inline-block">
              فريق العمل
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-8 h-1.5 bg-indigo-500 rounded-full opacity-80"></div>
          </h2>
          
          <div className="flex flex-col gap-4">
              <div className="flex items-center gap-5 p-5 glass-card rounded-[2rem] hover:bg-white/10 transition-transform duration-300 hover:-translate-y-1 border border-white/5 shimmer-hover">
                  <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500 dark:text-indigo-300 shadow-sm shrink-0 border border-indigo-500/20">
                      <Users className="w-8 h-8" />
                  </div>
                  <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 dark:text-white/40 mb-1 uppercase tracking-wider">إعداد وتصميم</p>
                      <h3 className="text-lg font-black text-slate-800 dark:text-white">أ. محمد درويش الزعابي</h3>
                  </div>
              </div>

              <div className="flex items-center gap-5 p-5 glass-card rounded-[2rem] hover:bg-white/10 transition-transform duration-300 hover:-translate-y-1 border border-white/5 shimmer-hover">
                  <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 dark:text-emerald-300 shadow-sm shrink-0 border border-emerald-500/20">
                      <Phone className="w-8 h-8" />
                  </div>
                  <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 dark:text-white/40 mb-1 uppercase tracking-wider">للتواصل والدعم الفني</p>
                      <h3 className="text-lg font-black text-slate-800 dark:text-white" dir="ltr">98344555</h3>
                  </div>
              </div>
          </div>
          
          <div className="mt-10 pt-6 border-t border-white/5">
            <p className="text-[10px] text-slate-400 dark:text-white/30 font-bold leading-relaxed">
                تم تطوير هذا التطبيق لخدمة المعلم العماني وتسهيل المهام اليومية داخل الغرفة الصفية.
            </p>
          </div>
      </div>
      
      <p className="mt-12 text-[10px] font-bold text-slate-300 dark:text-white/20">
          جميع الحقوق محفوظة © {new Date().getFullYear()}
      </p>

      {/* Admin Mode Modal */}
      <Modal isOpen={showAdmin} onClose={() => setShowAdmin(false)} className="max-w-xs rounded-[2rem]">
          <AdminGenerator onClose={() => setShowAdmin(false)} />
      </Modal>
    </div>
  );
};

export default About;
