
import React, { useState } from 'react';
import { 
    LayoutDashboard, Users, CalendarCheck, GraduationCap, 
    Trophy, FileText, Download, Printer, ChevronLeft, 
    Lightbulb, AlertCircle, CheckCircle2, Settings,
    Smartphone, Globe, Share2, Info, Phone, HelpCircle,
    Edit2, Trash2, Plus, Search, Filter, Save, UploadCloud,
    ThumbsUp, ThumbsDown, Eye, X, FileSpreadsheet, MessageCircle,
    CalendarRange, Sparkles, ShoppingBag, LayoutGrid
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import BrandLogo from './BrandLogo';

// --- Sub-Components ---

const SectionTitle = ({ title, subtitle }: { title: string, subtitle: string }) => (
    <div className="mb-8 border-b border-gray-200 dark:border-white/10 pb-4">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">{title}</h1>
        <p className="text-lg text-slate-500 dark:text-white/60 font-medium">{subtitle}</p>
    </div>
);

const IconDefinition = ({ icon: Icon, label, desc, color = "text-indigo-500" }: { icon: any, label: string, desc: string, color?: string }) => (
    <div className="flex items-start gap-4 p-4 rounded-2xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md transition-all">
        <div className={`w-12 h-12 rounded-xl bg-slate-50 dark:bg-white/10 flex items-center justify-center shrink-0 ${color}`}>
            <Icon className="w-6 h-6" />
        </div>
        <div>
            <h4 className="font-black text-slate-900 dark:text-white text-sm mb-1">{label}</h4>
            <p className="text-xs text-slate-500 dark:text-white/60 leading-relaxed font-medium">{desc}</p>
        </div>
    </div>
);

const FaqItem = ({ question, answer }: { question: string, answer: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden mb-3 bg-white dark:bg-white/5">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 text-right hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
            >
                <span className="font-bold text-slate-900 dark:text-white text-sm">{question}</span>
                <ChevronLeft className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isOpen ? '-rotate-90' : 'rotate-0'}`} />
            </button>
            {isOpen && (
                <div className="p-4 pt-0 text-sm text-slate-600 dark:text-white/70 leading-relaxed bg-slate-50/50 dark:bg-black/20 border-t border-gray-100 dark:border-white/5">
                    {answer}
                </div>
            )}
        </div>
    );
};

const NavButton = ({ id, label, icon: Icon, activeTab, onClick }: { id: string, label: string, icon: any, activeTab: string, onClick: (id: string) => void }) => (
    <button 
        onClick={() => onClick(id)}
        className={`
            w-full text-right p-3.5 rounded-xl flex items-center gap-3 transition-all duration-200 group relative overflow-hidden
            ${activeTab === id 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
            }
        `}
    >
        <Icon className={`w-5 h-5 relative z-10 ${activeTab === id ? 'text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-white'}`} />
        <span className="font-bold text-sm relative z-10">{label}</span>
        {activeTab === id && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] animate-[shimmer_2s_infinite]"></div>
        )}
    </button>
);

const UserGuide: React.FC = () => {
    const { theme } = useTheme(); 
    const [activeTab, setActiveTab] = useState('icons');

    const renderContent = () => {
        switch (activeTab) {
            case 'icons':
                return (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
                        <SectionTitle title="دليل الرموز" subtitle="تعرف على وظيفة كل أيقونة في التطبيق" />
                        
                        <div>
                            <h3 className="text-lg font-black text-indigo-600 dark:text-indigo-400 mb-4 flex items-center gap-2">
                                <Users className="w-5 h-5" /> إدارة الفصل والطلاب
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <IconDefinition icon={Plus} label="إضافة" desc="تسجيل طالب جديد أو عنصر جديد يدوياً." color="text-indigo-500" />
                                <IconDefinition icon={UploadCloud} label="استيراد" desc="رفع ملف Excel لإضافة مجموعة طلاب دفعة واحدة." color="text-emerald-500" />
                                <IconDefinition icon={Sparkles} label="اختيار عشوائي" desc="اختيار طالب عشوائياً للمشاركة مع مؤثرات بصرية." color="text-amber-500" />
                                <IconDefinition icon={Edit2} label="تعديل" desc="تغيير بيانات الطالب أو الفصل أو الدرجة." color="text-blue-500" />
                                <IconDefinition icon={LayoutGrid} label="إدارة الحصص" desc="تعديل جدول الحصص وتوقيت الجرس المدرسي." color="text-purple-500" />
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-black text-rose-600 dark:text-rose-400 mb-4 flex items-center gap-2">
                                <Trophy className="w-5 h-5" /> السلوك والتحفيز
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <IconDefinition icon={ThumbsUp} label="تعزيز" desc="إضافة نقطة إيجابية للسلوك الجيد." color="text-emerald-600" />
                                <IconDefinition icon={ThumbsDown} label="مخالفة" desc="تسجيل سلوك سلبي وخصم نقاط." color="text-rose-600" />
                                <IconDefinition icon={Trophy} label="المنافسة" desc="الدخول لصفحة دوري المجموعات." color="text-amber-500" />
                                <IconDefinition icon={ShoppingBag} label="المتجر" desc="استبدال نقاط الطالب بمكافآت (في دوري المجموعات)." color="text-indigo-500" />
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-black text-blue-600 dark:text-blue-400 mb-4 flex items-center gap-2">
                                <FileText className="w-5 h-5" /> التقارير والسجلات
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <IconDefinition icon={CalendarRange} label="السجل الشامل" desc="طباعة كشف حضور وغياب كامل للفصل (تفريغ)." color="text-amber-600" />
                                <IconDefinition icon={Printer} label="تقرير يومي" desc="طباعة تقرير الحضور لليوم الحالي فقط." color="text-slate-600" />
                                <IconDefinition icon={FileText} label="تقرير طالب" desc="تقرير PDF تفصيلي (درجات + سلوك) لطالب محدد." color="text-red-500" />
                                <IconDefinition icon={FileSpreadsheet} label="Excel" desc="تصدير السجلات كملف إكسل." color="text-emerald-600" />
                                <IconDefinition icon={Settings} label="أدوات التقويم" desc="إضافة وتعديل أدوات التقويم (اختبار، واجب) في سجل الدرجات." color="text-gray-500" />
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-black text-teal-600 dark:text-teal-400 mb-4 flex items-center gap-2">
                                <Globe className="w-5 h-5" /> روابط وتواصل
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <IconDefinition icon={MessageCircle} label="واتساب" desc="إرسال تنبيه (غياب/تسرب) أو تقرير لولي الأمر." color="text-green-500" />
                                <IconDefinition icon={Globe} label="منصة نور" desc="فتح منصة نور التعليمية داخل التطبيق." color="text-blue-500" />
                            </div>
                        </div>
                    </div>
                );

            case 'intro':
                return (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <SectionTitle title="البداية السريعة" subtitle="كيف تبدأ استخدام راصد في 3 خطوات" />
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                            <div className="bg-white dark:bg-white/5 p-6 rounded-3xl border border-indigo-100 dark:border-white/5 shadow-sm relative overflow-hidden group hover:-translate-y-1 transition-all">
                                <div className="absolute -right-6 -top-6 w-24 h-24 bg-indigo-50 dark:bg-indigo-500/10 rounded-full group-hover:scale-125 transition-transform"></div>
                                <span className="relative font-black text-4xl text-indigo-200 dark:text-white/10 mb-2 block">01</span>
                                <h3 className="relative font-black text-xl text-indigo-900 dark:text-white mb-2">إضافة الطلاب</h3>
                                <p className="relative text-sm text-slate-500 dark:text-white/60">ابدأ بإضافة أسماء الطلاب. الأسرع هو استخدام ميزة "استيراد Excel" إذا كان لديك كشف جاهز.</p>
                            </div>

                            <div className="bg-white dark:bg-white/5 p-6 rounded-3xl border border-emerald-100 dark:border-white/5 shadow-sm relative overflow-hidden group hover:-translate-y-1 transition-all">
                                <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-50 dark:bg-emerald-500/10 rounded-full group-hover:scale-125 transition-transform"></div>
                                <span className="relative font-black text-4xl text-emerald-200 dark:text-white/10 mb-2 block">02</span>
                                <h3 className="relative font-black text-xl text-emerald-900 dark:text-white mb-2">ضبط الجدول</h3>
                                <p className="relative text-sm text-slate-500 dark:text-white/60">من الصفحة الرئيسية، اضغط على زر التعديل لضبط الحصص الدراسية وتوقيت الجرس.</p>
                            </div>

                            <div className="bg-white dark:bg-white/5 p-6 rounded-3xl border border-amber-100 dark:border-white/5 shadow-sm relative overflow-hidden group hover:-translate-y-1 transition-all">
                                <div className="absolute -right-6 -top-6 w-24 h-24 bg-amber-50 dark:bg-amber-500/10 rounded-full group-hover:scale-125 transition-transform"></div>
                                <span className="relative font-black text-4xl text-amber-200 dark:text-white/10 mb-2 block">03</span>
                                <h3 className="relative font-black text-xl text-amber-900 dark:text-white mb-2">رصد الدرجات</h3>
                                <p className="relative text-sm text-slate-500 dark:text-white/60">انتقل لصفحة "الدرجات"، أضف أدوات التقويم (اختبار، واجب..) وابدأ الرصد.</p>
                            </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-6 border border-slate-200 dark:border-white/10">
                            <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <HelpCircle className="w-5 h-5 text-indigo-500" /> أسئلة شائعة
                            </h3>
                            <FaqItem question="هل يحتاج التطبيق إلى إنترنت؟" answer="لا، التطبيق يعمل بشكل كامل بدون إنترنت. يتم حفظ جميع البيانات على جهازك." />
                            <FaqItem question="كيف أحفظ بياناتي من الضياع؟" answer="اذهب للإعدادات > حفظ نسخة احتياطية. سيتم تحميل ملف .json احتفظ به في مكان آمن." />
                            <FaqItem question="كيف أطبع سجل الغياب الشهري؟" answer="اذهب لصفحة الحضور، واختر 'طباعة السجل الشامل' (أيقونة التقويم) للحصول على كشف كامل." />
                            <FaqItem question="كيف أضيف درجات الفصل الثاني؟" answer="من صفحة 'الدرجات'، اضغط على زر التبديل بين الفصل الأول والثاني في الأعلى." />
                        </div>
                    </div>
                );

            case 'about':
                return (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col items-center justify-center min-h-[50vh]">
                        <div className="w-32 h-32 bg-white dark:bg-white/10 rounded-full shadow-2xl flex items-center justify-center mb-6 overflow-hidden border-4 border-indigo-50 dark:border-white/10 p-1">
                            <BrandLogo className="w-full h-full" showText={false} />
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-2">تطبيق راصد</h1>
                        <p className="text-slate-500 dark:text-white/60 font-bold mb-8 bg-slate-100 dark:bg-white/10 px-4 py-1 rounded-full text-xs">الإصدار 3.4.0</p>
                        
                        <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-3xl p-8 max-w-md w-full text-center shadow-lg">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6">فريق العمل</h2>
                            
                            <div className="flex flex-col gap-6">
                                <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-black/20 rounded-2xl">
                                    <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-500/20 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                        <Users className="w-6 h-6" />
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-bold text-slate-400 dark:text-white/40">إعداد وتصميم</p>
                                        <h3 className="text-lg font-black text-slate-800 dark:text-white">أ. محمد درويش الزعابي</h3>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-black/20 rounded-2xl">
                                    <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                        <Phone className="w-6 h-6" />
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-bold text-slate-400 dark:text-white/40">للتواصل والدعم الفني</p>
                                        <h3 className="text-lg font-black text-slate-800 dark:text-white" dir="ltr">+968 99834455</h3>
                                    </div>
                                </div>
                            </div>
                            
                            <p className="mt-8 text-xs text-slate-400 dark:text-white/30 font-bold leading-relaxed">
                                تم تطوير هذا التطبيق لخدمة المعلم العماني وتسهيل المهام اليومية داخل الغرفة الصفية.
                            </p>
                        </div>
                    </div>
                );
            default: return null;
        }
    };

    const handleHTMLExport = () => {
        const contentDiv = document.getElementById('user-guide-content');
        const rawHTML = contentDiv ? contentDiv.innerHTML : '<h1>لا يوجد محتوى</h1>';
        const htmlContent = `<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title>دليل راصد</title><style>body { font-family: sans-serif; padding: 40px; line-height: 1.6; } h1, h2, h3 { color: #1e293b; } p { color: #475569; } .bg-slate-50 { background-color: #f8fafc; padding: 20px; border-radius: 10px; margin: 20px 0; }</style></head><body>${rawHTML}</body></html>`;
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'Rased_Guide.html'; document.body.appendChild(a); a.click(); document.body.removeChild(a);
    };

    return (
        <div className="flex h-full bg-gray-50 dark:bg-slate-900 transition-colors duration-300 overflow-hidden" dir="rtl">
            <aside className="w-64 bg-white dark:bg-slate-900 border-l border-gray-200 dark:border-white/5 flex flex-col hidden md:flex print:hidden shrink-0 z-20 shadow-sm relative">
                <div className="p-6 pb-2"><h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">الدليل الشامل</h2><p className="text-xs font-bold text-slate-400 dark:text-white/40 mt-1">شرح مفصل لكافة الخصائص</p></div>
                <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto custom-scrollbar">
                    <NavButton id="icons" label="دليل الرموز" icon={HelpCircle} activeTab={activeTab} onClick={setActiveTab} />
                    <NavButton id="intro" label="كيف أبدأ؟" icon={Lightbulb} activeTab={activeTab} onClick={setActiveTab} />
                    <NavButton id="about" label="حول التطبيق" icon={Info} activeTab={activeTab} onClick={setActiveTab} />
                </nav>
                <div className="p-4 border-t border-gray-100 dark:border-white/5 bg-slate-50 dark:bg-black/20">
                    <button onClick={handleHTMLExport} className="w-full bg-white dark:bg-white/5 text-slate-700 dark:text-white py-2.5 rounded-xl mb-2 hover:bg-slate-100 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 text-xs font-bold flex items-center justify-center gap-2 transition-all"><Download className="w-4 h-4" /> حفظ HTML</button>
                    <button onClick={() => window.print()} className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-2.5 rounded-xl hover:bg-slate-800 dark:hover:bg-white/90 text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg dark:shadow-none"><Printer className="w-4 h-4" /> طباعة</button>
                </div>
            </aside>
            <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 text-gray-800 dark:text-gray-100 custom-scrollbar relative" id="user-guide-content">
                <div className="max-w-4xl mx-auto pb-20">
                    <div className="md:hidden mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-center border border-blue-100 dark:border-blue-500/20 print:hidden"><p className="text-sm font-bold text-blue-800 dark:text-blue-200">للتصفح الكامل، يفضل استخدام جهاز أكبر.</p><div className="flex flex-wrap gap-2 justify-center mt-3">{['icons', 'intro', 'about'].map(tab => (<button key={tab} onClick={() => setActiveTab(tab)} className={`px-3 py-1 rounded-lg text-xs font-bold ${activeTab === tab ? 'bg-blue-600 text-white' : 'bg-white dark:bg-white/10 text-slate-600 dark:text-slate-300'}`}>{tab === 'icons' ? 'الرموز' : tab === 'intro' ? 'البداية' : 'حول'}</button>))}</div></div>
                    {renderContent()}
                    <div className="mt-12 pt-8 border-t border-gray-200 dark:border-white/10 text-center print:hidden"><p className="text-xs font-bold text-slate-400 dark:text-white/30">جميع الحقوق محفوظة © {new Date().getFullYear()}</p></div>
                </div>
            </main>
            <style>{`@media print { aside, .print\\:hidden, .print-hide { display: none !important; } body { background: white !important; color: black !important; overflow: visible !important; height: auto !important; } #user-guide-content { width: 100% !important; padding: 20px !important; overflow: visible !important; height: auto !important; position: static !important; } .flex-1 { overflow: visible !important; } .overflow-y-auto { overflow-y: visible !important; } .overflow-hidden { overflow: visible !important; } }`}</style>
        </div>
    );
};

export default UserGuide;
