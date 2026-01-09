
import React, { useState } from 'react';
import { ShieldCheck, Lock, Copy, Key, Smartphone, AlertTriangle, Loader2, CheckCircle2, MessageCircle } from 'lucide-react';
import { Clipboard } from '@capacitor/clipboard';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import BrandLogo from './BrandLogo';

interface ActivationScreenProps {
  deviceId: string;
  onActivate: (code: string) => boolean;
}

const ActivationScreen: React.FC<ActivationScreenProps> = ({ deviceId, onActivate }) => {
  const [inputCode, setInputCode] = useState('');
  const [error, setError] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleCopy = async (text: string) => {
    await Clipboard.write({ string: text });
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSendToDeveloper = async () => {
      const developerPhone = '98344555';
      const msg = encodeURIComponent(`السلام عليكم، أرغب في تفعيل تطبيق راصد.\nمعرف الجهاز الخاص بي هو: *${deviceId}*`);
      const fullPhone = `968${developerPhone}`;

      if (window.electron) {
          window.electron.openExternal(`whatsapp://send?phone=${fullPhone}&text=${msg}`);
      } else {
          const universalUrl = `https://api.whatsapp.com/send?phone=${fullPhone}&text=${msg}`;
          try {
              if (Capacitor.isNativePlatform()) {
                  await Browser.open({ url: universalUrl });
              } else {
                  window.open(universalUrl, '_blank');
              }
          } catch (e) {
              window.open(universalUrl, '_blank');
          }
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    setTimeout(() => {
        const success = onActivate(inputCode);
        if (!success) {
            setError('كود التفعيل غير صحيح.');
            setIsLoading(false);
        }
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-black p-6 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-rose-500/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="glass-heavy w-full max-w-md p-8 rounded-[2.5rem] border border-white/20 shadow-2xl relative z-10 flex flex-col items-center text-center animate-in fade-in zoom-in duration-500">
            
            <div className="mb-6 relative">
                <div className="w-24 h-24 glass-icon rounded-[2rem] flex items-center justify-center shadow-lg border border-white/30">
                    <BrandLogo className="w-14 h-14" showText={false} />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1.5 rounded-xl shadow-md border-2 border-white dark:border-black">
                    <Lock className="w-4 h-4" />
                </div>
            </div>

            <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2">تفعيل النسخة</h1>
            <p className="text-sm font-bold text-slate-500 dark:text-white/60 mb-8 leading-relaxed">
                هذه النسخة محمية بنظام البصمة الذكي. يرجى إدخال كود التفعيل الخاص بهذا الجهاز للمتابعة.
            </p>

            <div className="w-full space-y-6">
                {/* Device ID Box */}
                <div className="text-right space-y-2">
                    <label className="text-xs font-black text-indigo-500 pr-1">معرف الجهاز (Device ID)</label>
                    <div 
                        onClick={() => handleCopy(deviceId)}
                        className="flex items-center justify-between p-4 bg-white/50 dark:bg-white/5 border-2 border-dashed border-indigo-300 dark:border-white/10 rounded-2xl cursor-pointer hover:bg-white/80 dark:hover:bg-white/10 transition-colors group relative"
                    >
                        <div className="flex items-center gap-3 overflow-hidden">
                            <Smartphone className="w-5 h-5 text-slate-400" />
                            <span className="font-mono font-bold text-lg text-slate-700 dark:text-white tracking-wider truncate" dir="ltr">
                                {deviceId}
                            </span>
                        </div>
                        <button className="p-2 text-indigo-500 hover:scale-110 transition-transform">
                            {isCopied ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
                        </button>
                        {isCopied && <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded shadow-lg font-bold">تم النسخ!</span>}
                    </div>
                    
                    <button 
                        onClick={handleSendToDeveloper}
                        className="w-full py-3 bg-[#25D366] hover:bg-[#128C7E] text-white rounded-xl font-black text-xs shadow-lg shadow-green-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 mt-2"
                    >
                        <MessageCircle className="w-4 h-4" />
                        إرسال المعرف للمطور (واتساب)
                    </button>
                </div>

                {/* Input Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                        <Key className="absolute right-4 top-4 w-5 h-5 text-slate-400" />
                        <input 
                            type="text" 
                            dir="ltr"
                            value={inputCode}
                            onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                            placeholder="XXXX-XXXX"
                            className="w-full p-4 pr-12 text-center font-mono text-xl font-black tracking-widest glass-input rounded-2xl outline-none focus:border-indigo-500 transition-all uppercase placeholder:text-slate-300"
                        />
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-rose-500 bg-rose-500/10 p-3 rounded-xl text-xs font-bold justify-center animate-pulse">
                            <AlertTriangle className="w-4 h-4" />
                            {error}
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={!inputCode || isLoading}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-500/30 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                        تفعيل التطبيق
                    </button>
                </form>
            </div>

            <div className="mt-8 pt-6 border-t border-white/10 w-full">
                <p className="text-[10px] font-bold text-slate-400">
                    الحقوق محفوظة © راصد {new Date().getFullYear()}
                </p>
            </div>
        </div>
    </div>
  );
};

export default ActivationScreen;
