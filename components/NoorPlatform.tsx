
import React from 'react';
import { ExternalLink, Globe, Lock, ShieldCheck, ChevronRight, Smartphone } from 'lucide-react';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';

const NoorPlatform: React.FC = () => {
  const url = "https://lms.moe.gov.om/student/users/login";

  const handleOpenPlatform = async () => {
    if (Capacitor.isNativePlatform()) {
        await Browser.open({ url: url, presentationStyle: 'fullscreen' });
    } else {
        window.open(url, '_blank');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white/80 dark:bg-white/5 rounded-2xl overflow-hidden shadow-sm dark:shadow-lg border border-gray-200 dark:border-white/10 relative animate-in fade-in duration-500 backdrop-blur-xl transition-colors">
      
      {/* Decorative Header */}
      <div className="bg-gradient-to-b from-blue-50 to-transparent dark:from-blue-500/10 p-6 flex flex-col items-center justify-center text-center border-b border-gray-100 dark:border-white/5">
         <div className="w-24 h-24 bg-white dark:bg-white/10 rounded-2xl flex items-center justify-center relative shadow-sm dark:shadow-[0_0_30px_rgba(59,130,246,0.2)] mb-4 border border-gray-100 dark:border-white/10 p-3 backdrop-blur-md">
            <img 
                src="noor_logo.png" 
                className="w-full h-full object-contain drop-shadow-md opacity-90 hover:opacity-100 transition-opacity" 
                alt="شعار نور" 
                onError={(e) => {
                    e.currentTarget.style.display='none'; 
                    const icon = document.getElementById('fallback-globe');
                    if(icon) icon.classList.remove('hidden');
                }} 
            />
            <Globe id="fallback-globe" className="w-10 h-10 text-blue-500 dark:text-blue-400 hidden" />
            <div className="absolute -bottom-2 -right-2 bg-emerald-500 p-1.5 rounded-lg border-2 border-white dark:border-black/20 shadow-lg">
                <Lock className="w-3 h-3 text-white" />
            </div>
         </div>
         
         <h2 className="text-lg font-black text-slate-900 dark:text-white mb-1">منصة نور التعليمية</h2>
         <p className="text-[10px] font-bold text-slate-500 dark:text-white/40 max-w-[250px] leading-relaxed">
            الوصول المباشر للمنصة عبر المتصفح الآمن
         </p>
      </div>

      {/* Action Section */}
      <div className="flex-1 p-5 flex flex-col items-center justify-center space-y-4">
         
         <div className="bg-amber-50 dark:bg-amber-500/10 p-3 rounded-2xl border border-amber-200 dark:border-amber-500/20 w-full backdrop-blur-sm">
            <div className="flex gap-2 items-start">
               <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
               <p className="text-[9px] font-bold text-amber-800 dark:text-amber-100/80 leading-relaxed text-right">
                  سيتم فتح المنصة في نافذة مخصصة. 
                  <br/>
                  للعودة للتطبيق، استخدم زر <strong>"Done"</strong> أو <strong>"إغلاق"</strong>.
               </p>
            </div>
         </div>

         <button 
            onClick={handleOpenPlatform}
            className="group w-full bg-blue-600 hover:bg-blue-500 text-white rounded-2xl p-2 pl-3 flex items-center transition-all shadow-lg shadow-blue-500/30 dark:shadow-[0_0_20px_rgba(37,99,235,0.4)] active:scale-95 border border-blue-500/50"
         >
            <div className="bg-white/20 w-10 h-10 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-colors">
                <ExternalLink className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 text-right pr-3">
                <span className="block text-xs font-black">فتح موقع نور</span>
                <span className="block text-[8px] font-bold text-blue-100">فتح في متصفح التطبيق</span>
            </div>
            <ChevronRight className="w-4 h-4 text-blue-200" />
         </button>

      </div>
      
      {/* Footer */}
      <div className="p-3 text-center border-t border-gray-100 dark:border-white/5">
         <p className="text-[8px] font-bold text-slate-400 dark:text-white/30 flex items-center justify-center gap-1">
            <Smartphone className="w-3 h-3" />
            متوافق مع الوضع الأفقي والكمبيوتر اللوحي
         </p>
      </div>

    </div>
  );
};

export default NoorPlatform;
