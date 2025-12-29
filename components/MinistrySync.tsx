import React from 'react';
import { ExternalLink, Building2, Lock, ShieldCheck, ChevronRight, Smartphone } from 'lucide-react';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';

const MinistrySync: React.FC = () => {
  const url = "https://certificate.moe.gov.om/Portal/Services/UserLoginnew.aspx";

  const handleOpenPlatform = async () => {
    if (Capacitor.isNativePlatform()) {
        // Use Capacitor Browser for mobile to keep user "in-app" but with a full browser UI
        await Browser.open({ url: url, presentationStyle: 'fullscreen' });
    } else {
        // Fallback for Desktop/Web
        // In Electron, main.js intercepts this and opens the system browser
        window.open(url, '_blank');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-[2rem] overflow-hidden shadow-sm border border-gray-100 relative animate-in fade-in duration-500">
      
      {/* Decorative Header */}
      <div className="bg-gradient-to-b from-emerald-50 to-white p-8 flex flex-col items-center justify-center text-center border-b border-gray-50">
         <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center relative shadow-lg shadow-emerald-100 mb-6 border border-emerald-50">
            <Building2 className="w-10 h-10 text-emerald-600" />
            <div className="absolute -bottom-2 -right-2 bg-blue-500 p-2 rounded-xl border-4 border-white">
                <Lock className="w-4 h-4 text-white" />
            </div>
         </div>
         
         <h2 className="text-xl font-black text-gray-900 mb-2">البوابة التعليمية</h2>
         <p className="text-xs font-bold text-gray-400 max-w-[280px] leading-relaxed">
            تسجيل الدخول - وزارة التربية والتعليم
         </p>
      </div>

      {/* Action Section */}
      <div className="flex-1 p-6 flex flex-col items-center justify-center space-y-6">
         
         <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 w-full">
            <div className="flex gap-3 items-start">
               <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
               <p className="text-[10px] font-bold text-amber-800 leading-relaxed text-right">
                  سيتم فتح صفحة تسجيل الدخول في نافذة آمنة. 
                  <br/>
                  للعودة للتطبيق، استخدم زر <strong>"Done"</strong> أو <strong>"إغلاق"</strong>.
               </p>
            </div>
         </div>

         <button 
            onClick={handleOpenPlatform}
            className="group w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl p-2 pl-3 flex items-center transition-all shadow-xl shadow-emerald-200 active:scale-95"
         >
            <div className="bg-white/10 w-12 h-12 rounded-xl flex items-center justify-center group-hover:bg-white/20 transition-colors">
                <ExternalLink className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 text-right pr-4">
                <span className="block text-sm font-black">الدخول للبوابة</span>
                <span className="block text-[9px] font-bold text-emerald-200">certificate.moe.gov.om</span>
            </div>
            <ChevronRight className="w-5 h-5 text-emerald-200" />
         </button>

      </div>
      
      {/* Footer */}
      <div className="p-4 text-center">
         <p className="text-[9px] font-bold text-gray-300 flex items-center justify-center gap-1">
            <Smartphone className="w-3 h-3" />
            متصفح داخلي محسن
         </p>
      </div>

    </div>
  );
};

export default MinistrySync;