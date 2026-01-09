
import React, { useState } from 'react';
import { Copy, RefreshCw, Fingerprint, CheckCircle2 } from 'lucide-react';
import { Clipboard } from '@capacitor/clipboard';

// خوارزمية التشفير (مدمجة لضمان العمل المستقل)
const SECRET_SALT = "RASED_APP_SECURE_2025_OMAN";

const simpleHash = (str: string): string => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(16).toUpperCase();
};

const generateValidCode = (id: string): string => {
    if (!id) return '';
    const cleanId = id.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if(!cleanId) return '';
    const raw = cleanId.split('').reverse().join('') + SECRET_SALT;
    const hash = simpleHash(raw);
    const codePart = hash.padEnd(8, 'X').substring(0, 8); 
    return `${codePart.substring(0, 4)}-${codePart.substring(4, 8)}`;
};

interface AdminGeneratorProps {
    onClose?: () => void;
}

const AdminGenerator: React.FC<AdminGeneratorProps> = () => {
    const [targetDeviceId, setTargetDeviceId] = useState('');
    const [generatedKey, setGeneratedKey] = useState('');
    const [isCopied, setIsCopied] = useState(false);

    const handleGenerate = () => {
        if (targetDeviceId.length < 2) return;
        setGeneratedKey(generateValidCode(targetDeviceId));
        setIsCopied(false);
    };

    const handleCopy = async () => {
        if (!generatedKey) return;
        await Clipboard.write({ string: generatedKey });
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-indigo-600/20">
                <Fingerprint className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-1">مولد المفاتيح</h2>
            <p className="text-xs font-bold text-indigo-500 mb-6">وضع المطور (Admin Mode)</p>

            <div className="w-full space-y-4">
                <div className="text-right">
                    <label className="text-[10px] font-bold text-slate-400 block mb-2 mr-2">معرف جهاز العميل (Device ID)</label>
                    <input 
                        type="text" 
                        dir="ltr"
                        value={targetDeviceId}
                        onChange={(e) => { setTargetDeviceId(e.target.value.toUpperCase()); setGeneratedKey(''); }}
                        placeholder="A1B2-C3D4"
                        className="w-full p-3 text-center font-mono text-lg font-black tracking-widest bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl outline-none focus:border-indigo-500 transition-all uppercase text-slate-900 dark:text-white"
                    />
                </div>

                <button 
                    onClick={handleGenerate}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-sm shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                    <RefreshCw className="w-4 h-4" />
                    توليد الكود
                </button>

                {generatedKey && (
                    <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl animate-in fade-in slide-in-from-bottom-2 w-full">
                        <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mb-2">كود التفعيل</p>
                        <div 
                            onClick={handleCopy}
                            className="flex items-center justify-center gap-3 cursor-pointer group bg-white/50 dark:bg-black/20 p-2 rounded-lg border border-emerald-500/10"
                        >
                            <h2 className="text-2xl font-black font-mono text-slate-800 dark:text-white tracking-widest">{generatedKey}</h2>
                            <div className="p-2 bg-white dark:bg-white/10 rounded-lg group-hover:scale-110 transition-transform shadow-sm">
                                {isCopied ? <CheckCircle2 className="w-4 h-4 text-emerald-500"/> : <Copy className="w-4 h-4 text-slate-400"/>}
                            </div>
                        </div>
                        {isCopied && <p className="text-[9px] font-bold text-emerald-500 mt-2">تم النسخ!</p>}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminGenerator;
