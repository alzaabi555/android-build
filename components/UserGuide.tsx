
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
    <div className="mb-8 border-b border-white/10 pb-4">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2 text-glow">{title}</h1>
        <p className="text-lg text-slate-500 dark:text-white/60 font-bold">{subtitle}</p>
    </div>
);

const IconDefinition = ({ icon: Icon, label, desc, color = "text-indigo-500" }: { icon: any, label: string, desc: string, color?: string }) => (
    <div className="flex items-start gap-4 p-4 rounded-2xl glass-card hover:bg-white/10 transition-all border border-white/10 group">
        <div className={`w-12 h-12 rounded-xl glass-icon flex items-center justify-center shrink-0 ${color} shadow-sm group-hover:scale-110 transition-transform`}>
            <Icon className="w-6 h-6" />
        </div>
        <div>
            <h4 className="font-black text-slate-900 dark:text-white text-sm mb-1">{label}</h4>
            <p className="text-xs text-slate-600 dark:text-white/60 leading-relaxed font-bold">{desc}</p>
        </div>
    </div>
);

const FaqItem = ({ question, answer }: { question: string, answer: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="glass-card border border-white/10 rounded-2xl overflow-hidden mb-3 transition-colors hover:bg-white/5">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 text-right"
            >
                <span className="font-bold text-slate-900 dark:text-white text-sm">{question}</span>
                <ChevronLeft className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isOpen ? '-rotate-90' : 'rotate-0'}`} />
            </button>
            {isOpen && (
                <div className="p-4 pt-0 text-xs font-bold text-slate-600 dark:text-white/70 leading-relaxed border-t border-white/5 bg-black/5 dark:bg-white/5">
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
            w-full text-right p-3.5 rounded-2xl flex items-center gap-3 transition-all duration-200 group relative overflow-hidden mb-2
            ${activeTab === id 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 border border-indigo-500' 
                : 'glass-card border-transparent hover:bg-white/10 text-slate-600 dark:text-white/60 hover:text-white'
            }
        `}
    >
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${activeTab === id ? 'bg-white/20' : 'glass-icon'}`}>
             <Icon className={`w-4 h-4 ${activeTab === id ? 'text-white' : 'text-slate-500 dark:text-white/70'}`} />
        </div>
        <span className="font-black text-sm relative z-10">{label}</span>
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
                            <h3 className="text-lg font-black text-indigo-500 dark:text-indigo-300 mb-4 flex items-center gap-2">
                                <Users className="w-5 h-5" /> إدارة الفصل والطلاب
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <IconDefinition icon={Plus} label="إضافة" desc="تسجيل طالب جديد أو عنصر جديد يدوياً." color="text-indigo-400" />
                                <IconDefinition icon={UploadCloud} label="استيراد" desc="رفع ملف Excel لإضافة مجموعة طلاب دفعة واحدة." color="text-emerald-400" />
                                <IconDefinition icon={Sparkles} label="اختيار عشوائي" desc="اختيار طالب عشوائياً للمشاركة مع مؤثرات بصرية." color="text-amber-400" />
                                <IconDefinition icon={Edit2} label="تعديل" desc="تغيير بيانات الطالب أو الفصل أو الدرجة." color="text-blue-400" />
                                <IconDefinition icon={LayoutGrid} label="إدارة الحصص" desc="تعديل جدول الحصص وتوقيت الجرس المدرسي." color="text-purple-400" />
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-black text-rose-500 dark:text-rose-300 mb-4 flex items-center gap-2">
                                <Trophy className="w-5 h-5" /> السلوك والتحفيز
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <IconDefinition icon={ThumbsUp} label="تعزيز" desc="إضافة نقطة إيجابية للسلوك الجيد." color="text-emerald-500" />
                                <IconDefinition icon={ThumbsDown} label="مخالفة" desc="تسجيل سلوك سلبي وخصم نقاط." color="text-rose-500" />
                                <IconDefinition icon={Trophy} label="المنافسة" desc="الدخول لصفحة دوري المجموعات." color="text-amber-500" />
                                <IconDefinition icon={ShoppingBag} label="المتجر" desc="استبدال نقاط الطالب بمكافآت (في دوري المجموعات)." color="text-indigo-400" />
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-black text-blue-500 dark:text-blue-300 mb-4 flex items-center gap-2">
                                <FileText className="w-5 h-5" /> التقارير والسجلات
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <IconDefinition icon={CalendarRange} label="السجل الشامل" desc="طباعة كشف حضور وغياب كامل للفصل (تفريغ)." color="text-amber-500" />
                                <IconDefinition icon={Printer} label="تقرير يومي" desc="طباعة تقرير الحضور لليوم الحالي فقط." color="text-slate-400" />
                                <IconDefinition icon={FileText} label="تقرير طالب" desc="تقرير PDF تفصيلي (درجات + سلوك) لطالب محدد." color="text-red-400" />
                                <IconDefinition icon={FileSpreadsheet} label="Excel" desc="تصدير السجلات كملف إكسل." color="text-emerald-500" />
                                <IconDefinition icon={Settings} label="أدوات التقويم" desc="إضافة وتعديل أدوات التقويم (اختبار، واجب) في سجل الدرجات." color="text-gray-400" />
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-black text-teal-500 dark:text-teal-300 mb-4 flex items-center gap-2">
                                <Globe className="w-5 h-5" /> روابط وتواصل
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <IconDefinition icon={MessageCircle} label="واتساب" desc="إرسال تنبيه (غياب/تسرب) أو تقرير لولي الأمر." color="text-green-500" />
                                <IconDefinition icon={Globe} label="منصة نور" desc="فتح منصة نور التعليمية داخل التطبيق." color="text-blue-400" />
                            </div>
                        </div>
                    </div>
                );

            case 'intro':
                return (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <SectionTitle title="البداية السريعة" subtitle="كيف تبدأ استخدام راصد في 3 خطوات" />
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                            <div className="glass-card p-6 rounded-[2rem] border border-indigo-500/20 relative overflow-hidden group hover:-translate-y-2 transition-all">
                                <div className="absolute -right-6 -top-6 w-24 h-24 bg-indigo-500/20 rounded-full group-hover:scale-125 transition-transform blur-xl"></div>
                                <span className="relative font-black text-5xl text-indigo-500/30 mb-2 block">01</span>
                                <h3 className="relative font-black text-xl text-slate-900 dark:text-white mb-2">إضافة الطلاب</h3>
                                <p className="relative text-xs font-bold text-slate-500 dark:text-white/60">ابدأ بإضافة أسماء الطلاب. الأسرع هو استخدام ميزة "استيراد Excel" إذا كان لديك كشف جاهز.</p>
                            </div>

                            <div className="glass-card p-6 rounded-[2rem] border border-emerald-500/20 relative overflow-hidden group hover:-translate-y-2 transition-all">
                                <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/20 rounded-full group-hover:scale-125 transition-transform blur-xl"></div>
                                <span className="relative font-black text-5xl text-emerald-500/30 mb-2 block">02</span>
                                <h3 className="relative font-black text-xl text-slate-900 dark:text-white mb-2">ضبط الجدول</h3>
                                <p className="relative text-xs font-bold text-slate-500 dark:text-white/60">من الصفحة الرئيسية، اضغط على زر التعديل لضبط الحصص الدراسية وتوقيت الجرس.</p>
                            </div>

                            <div className="glass-card p-6 rounded-[2rem] border border-amber-500/20 relative overflow-hidden group hover:-translate-y-2 transition-all">
                                <div className="absolute -right-6 -top-6 w-24 h-24 bg-amber-500/20 rounded-full group-hover:scale-125 transition-transform blur-xl"></div>
                                <span className="relative font-black text-5xl text-amber-500/30 mb-2 block">03</span>
                                <h3 className="relative font-black text-xl text-slate-900 dark:text-white mb-2">رصد الدرجات</h3>
                                <p className="relative text-xs font-bold text-slate-500 dark:text-white/60">انتقل لصفحة "الدرجات"، أضف أدوات التقويم (اختبار، واجب..) وابدأ الرصد.</p>
                            </div>
                        </div>

                        <div className="glass-card rounded-[2rem] p-6 border border-white/10">
                            <h3 className="font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                <HelpCircle className="w-5 h-5 text-indigo-500" /> أسئلة شائعة
                            </h3>
                            <FaqItem question="هل يحتاج التطبيق إلى إنترنت؟" answer="لا، التطبيق يعمل بشكل كامل بدون إنترنت. يتم حفظ جميع البيانات على جهازك." />
                            <FaqItem question="كيف أحفظ بياناتي من الضياع؟" answer="البيانات محفوظة تلقائياً في المتصفح. لنسخ احتياطي، يمكنك تصدير ملفات الإكسل بشكل دوري." />
                            <FaqItem question="كيف أطبع سجل الغياب الشهري؟" answer="اذهب لصفحة الحضور، واختر 'طباعة السجل الشامل' (أيقونة التقويم) للحصول على كشف كامل." />
                            <FaqItem question="كيف أضيف درجات الفصل الثاني؟" answer="من صفحة 'الدرجات'، اضغط على زر التبديل بين الفصل الأول والثاني في الأعلى." />
                        </div>
                    </div>
                );

            case 'about':
                return (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col items-center justify-center min-h-[50vh]">
                        <div className="w-32 h-32 glass-icon rounded-[2.5rem] shadow-2xl flex items-center justify-center mb-6 overflow-hidden border border-white/20 p-2">
                            <BrandLogo className="w-full h-full" showText={false} />
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-2 text-glow">تطبيق راصد</h1>
                        <p className="text-slate-500 dark:text-white/60 font-bold mb-8 glass-card px-4 py-1 rounded-full text-xs border-none">الإصدار 3.4.0</p>
                        
                        <div className="glass-heavy border border-white/10 rounded-[2.5rem] p-8 max-w-md w-full text-center shadow-2xl">
                            <h2 className="text-xl font-black text-slate-800 dark:text-white mb-6">فريق العمل</h2>
                            
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-4 p-4 glass-card rounded-2xl hover:bg-white/10 transition-colors">
                                    <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400">
                                        <Users className="w-6 h-6" />
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-slate-400 dark:text-white/40 mb-1">إعداد وتصميم</p>
                                        <h3 className="text-lg font-black text-slate-800 dark:text-white">أ. محمد درويش الزعابي</h3>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 p-4 glass-card rounded-2xl hover:bg-white/10 transition-colors">
                                    <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400">
                                        <Phone className="w-6 h-6" />
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-slate-400 dark:text-white/40 mb-1">للتواصل والدعم الفني</p>
                                        <h3 className="text-lg font-black text-slate-800 dark:text-white" dir="ltr">+968 99834455</h3>
                                    </div>
                                </div>
                            </div>
                            
                            <p className="mt-8 text-[10px] text-slate-400 dark:text-white/30 font-bold leading-relaxed border-t border-white/5 pt-4">
                                تم تطوير هذا التطبيق لخدمة المعلم العماني وتسهيل المهام اليومية داخل الغرفة الصفية.
                            </p>
                        </div>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <div className="flex flex-col md:flex-row h-full rounded-[2.5rem] overflow-hidden glass-heavy border border-white/10 shadow-2xl relative" dir="rtl">
            {/* Glass Sidebar */}
            <aside className="w-full md:w-64 glass-heavy border-b md:border-b-0 md:border-l border-white/10 flex flex-col shrink-0 z-20 backdrop-blur-xl">
                <div className="p-6 pb-4">
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight text-glow">الدليل الشامل</h2>
                    <p className="text-xs font-bold text-slate-400 dark:text-white/40 mt-1">شرح مفصل لكافة الخصائص</p>
                </div>
                <nav className="flex-1 px-4 py-2 space-y-1 overflow-x-auto md:overflow-y-auto custom-scrollbar flex md:block gap-2 md:gap-0">
                    <NavButton id="icons" label="دليل الرموز" icon={HelpCircle} activeTab={activeTab} onClick={setActiveTab} />
                    <NavButton id="intro" label="كيف أبدأ؟" icon={Lightbulb} activeTab={activeTab} onClick={setActiveTab} />
                    <NavButton id="about" label="حول التطبيق" icon={Info} activeTab={activeTab} onClick={setActiveTab} />
                </nav>
                <div className="p-4 border-t border-white/10 bg-black/5 dark:bg-white/5 hidden md:block">
                    <button onClick={() => window.print()} className="w-full glass-card hover:bg-white/20 text-slate-800 dark:text-white py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-all"><Printer className="w-4 h-4" /> طباعة الدليل</button>
                </div>
            </aside>
            
            {/* Content Area */}
            <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10 custom-scrollbar relative">
                <div className="max-w-4xl mx-auto pb-20">
                    {renderContent()}
                    <div className="mt-12 pt-8 border-t border-white/10 text-center"><p className="text-[10px] font-bold text-slate-400 dark:text-white/20">جميع الحقوق محفوظة © {new Date().getFullYear()}</p></div>
                </div>
            </main>
        </div>
    );
};

export default UserGuide;
