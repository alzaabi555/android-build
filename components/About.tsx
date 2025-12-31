
import React from 'react';
import { Users, Phone } from 'lucide-react';
import BrandLogo from './BrandLogo';

const About: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-full p-6 text-slate-900 dark:text-white animate-in fade-in zoom-in duration-500">
      <div className="w-32 h-32 bg-white dark:bg-white/10 rounded-full shadow-2xl flex items-center justify-center mb-6 overflow-hidden border-4 border-indigo-50 dark:border-white/10 p-1">
          <BrandLogo className="w-full h-full" showText={false} />
      </div>
      <h1 className="text-4xl font-black mb-2 tracking-tight">تطبيق راصد</h1>
      <p className="text-slate-500 dark:text-white/60 font-bold mb-8">الإصدار 3.3.0</p>
      
      <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-[2.5rem] p-8 max-w-md w-full text-center shadow-xl backdrop-blur-sm">
          <h2 className="text-xl font-black text-slate-800 dark:text-white mb-8 relative inline-block">
              فريق العمل
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-indigo-500 rounded-full opacity-50"></div>
          </h2>
          
          <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-black/20 rounded-2xl border border-gray-100 dark:border-white/5 hover:scale-105 transition-transform duration-300">
                  <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm shrink-0">
                      <Users className="w-7 h-7" />
                  </div>
                  <div className="text-right">
                      <p className="text-xs font-bold text-slate-400 dark:text-white/40 mb-1">إعداد وتصميم</p>
                      <h3 className="text-lg font-black text-slate-800 dark:text-white">أ. محمد درويش الزعابي</h3>
                  </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-black/20 rounded-2xl border border-gray-100 dark:border-white/5 hover:scale-105 transition-transform duration-300">
                  <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm shrink-0">
                      <Phone className="w-7 h-7" />
                  </div>
                  <div className="text-right">
                      <p className="text-xs font-bold text-slate-400 dark:text-white/40 mb-1">للتواصل والدعم الفني</p>
                      <h3 className="text-lg font-black text-slate-800 dark:text-white" dir="ltr">+968 99834455</h3>
                  </div>
              </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-white/10">
            <p className="text-xs text-slate-400 dark:text-white/30 font-bold leading-relaxed">
                تم تطوير هذا التطبيق لخدمة المعلم العماني وتسهيل المهام اليومية داخل الغرفة الصفية.
            </p>
          </div>
      </div>
      
      <p className="mt-8 text-[10px] font-bold text-slate-300 dark:text-white/20">
          جميع الحقوق محفوظة © {new Date().getFullYear()}
      </p>
    </div>
  );
};

export default About;
