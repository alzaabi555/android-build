
import React, { useState } from 'react';
import { 
    LayoutDashboard, Users, CalendarCheck, GraduationCap, 
    Trophy, FileText, Download, Printer, ChevronLeft, 
    Lightbulb, AlertCircle, CheckCircle2, Settings,
    Smartphone, Globe, Share2
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

// --- Content Components moved to module scope to fix typing issues ---

const SectionTitle = ({ title, subtitle }: { title: string, subtitle: string }) => (
    <div className="mb-8 border-b border-gray-200 dark:border-white/10 pb-4">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">{title}</h1>
        <p className="text-lg text-slate-500 dark:text-white/60 font-medium">{subtitle}</p>
    </div>
);

const FeatureCard = ({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) => (
    <div className="p-5 rounded-2xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md transition-all">
        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-300 mb-4">
            <Icon className="w-5 h-5" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{title}</h3>
        <p className="text-sm text-slate-500 dark:text-white/60 leading-relaxed">{desc}</p>
    </div>
);

const InfoBox = ({ children, type = 'info' }: { children?: React.ReactNode, type?: 'info' | 'warning' | 'tip' }) => {
    const styles = {
        info: 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20 text-blue-800 dark:text-blue-200',
        warning: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-200',
        tip: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-800 dark:text-emerald-200'
    };
    const icons = { info: Lightbulb, warning: AlertCircle, tip: CheckCircle2 };
    const Icon = icons[type];

    return (
        <div className={`p-4 rounded-xl border flex gap-3 ${styles[type]} my-4`}>
            <Icon className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-sm font-bold leading-relaxed">{children}</div>
        </div>
    );
};

// Sidebar Button Component
const NavButton = ({ id, label, icon: Icon, activeTab, onClick }: { id: string, label: string, icon: any, activeTab: string, onClick: (id: string) => void }) => (
    <button 
        onClick={() => onClick(id)}
        className={`
            w-full text-right p-3.5 rounded-xl flex items-center gap-3 transition-all duration-200 group
            ${activeTab === id 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
            }
        `}
    >
        <Icon className={`w-5 h-5 ${activeTab === id ? 'text-white' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-white'}`} />
        <span className="font-bold text-sm">{label}</span>
        {activeTab === id && <ChevronLeft className="w-4 h-4 mr-auto opacity-50" />}
    </button>
);

const UserGuide: React.FC = () => {
    const { theme } = useTheme(); 
    const [activeTab, setActiveTab] = useState('intro');

    // --- Content Data ---
    const renderContent = () => {
        switch (activeTab) {
            case 'intro':
                return (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <SectionTitle title="نظرة عامة" subtitle="مرحباً بك في نظام راصد الذكي لإدارة الفصول" />
                        
                        <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl p-8 text-white shadow-xl mb-8 relative overflow-hidden">
                            <div className="relative z-10 max-w-2xl">
                                <h2 className="text-2xl font-black mb-4">نظام متكامل، محلي، وسريع.</h2>
                                <p className="text-indigo-100 text-lg leading-relaxed mb-6">
                                    تم تصميم راصد ليحل محل السجلات الورقية التقليدية. يتم تخزين جميع البيانات محلياً على جهازك لضمان السرعة والخصوصية التامة، مع إمكانية تصدير التقارير ومشاركتها في أي وقت.
                                </p>
                                <div className="flex gap-4">
                                    <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg text-sm font-bold">نسخة 3.3</div>
                                    <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg text-sm font-bold">دعم iOS / Android</div>
                                </div>
                            </div>
                            <Globe className="absolute -bottom-10 -left-10 w-64 h-64 text-white opacity-5 rotate-12" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <FeatureCard icon={Smartphone} title="تصميم عصري" desc="واجهة مستخدم مستوحاة من أحدث أنظمة التشغيل، تدعم الوضع الليلي والنهاري." />
                            <FeatureCard icon={Settings} title="تخصيص كامل" desc="تحكم كامل في أسماء الفصول، المواد، أدوات التقويم، وتوزيع الدرجات." />
                            <FeatureCard icon={Share2} title="مشاركة ذكية" desc="توليد تقارير PDF وإرسال رسائل واتساب مباشرة لأولياء الأمور." />
                        </div>
                    </div>
                );

            case 'students':
                return (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <SectionTitle title="إدارة الطلاب" subtitle="إضافة، تعديل، واستيراد البيانات" />
                        
                        <div className="space-y-8">
                            <section>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">طرق إضافة الطلاب</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-5 border border-gray-200 dark:border-white/10 rounded-2xl">
                                        <h4 className="font-bold text-indigo-600 dark:text-indigo-400 mb-2">1. الإضافة اليدوية</h4>
                                        <p className="text-sm text-slate-500 dark:text-white/60">
                                            عبر زر "إضافة طالب"، يمكنك إدخال الاسم، الفصل، ورقم ولي الأمر، وصورة الطالب يدوياً.
                                        </p>
                                    </div>
                                    <div className="p-5 border border-gray-200 dark:border-white/10 rounded-2xl">
                                        <h4 className="font-bold text-emerald-600 dark:text-emerald-400 mb-2">2. استيراد Excel (موصى به)</h4>
                                        <p className="text-sm text-slate-500 dark:text-white/60">
                                            قم برفع ملف Excel يحتوي على الأعمدة التالية: <code>الاسم</code>، <code>الهاتف</code>، <code>الفصل</code>. النظام ذكي وسيكتشف الأعمدة تلقائياً.
                                        </p>
                                    </div>
                                </div>
                            </section>

                            <InfoBox type="tip">
                                <strong>نصيحة ذكية:</strong> عند استيراد ملف Excel، تأكد من أن الصف الأول يحتوي على عناوين الأعمدة. إذا لم يوجد عمود للهاتف، سيحاول النظام البحث عن أي عمود يحتوي على أرقام هواتف وتعيينه تلقائياً.
                            </InfoBox>
                        </div>
                    </div>
                );

            case 'attendance':
                return (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <SectionTitle title="الحضور والغياب" subtitle="رصد يومي وتنبيهات تلقائية" />
                        
                        <div className="space-y-6">
                            <p className="text-slate-600 dark:text-white/70 leading-relaxed">
                                تتيح لك شاشة الحضور تسجيل حالة الطالب (حاضر، غائب، متأخر) بلمسة واحدة. البيانات تحفظ تلقائياً بالتاريخ والوقت.
                            </p>

                            <div className="bg-slate-50 dark:bg-black/20 p-6 rounded-2xl border border-gray-200 dark:border-white/10">
                                <h4 className="font-bold text-slate-900 dark:text-white mb-4">ميزات التنبيه الذكي</h4>
                                <ul className="space-y-3">
                                    <li className="flex items-start gap-3">
                                        <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-xs font-bold shrink-0">1</span>
                                        <span className="text-sm text-slate-600 dark:text-white/70">عند اختيار "غياب" أو "تأخير"، يظهر زر الواتساب بجانب اسم الطالب.</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-xs font-bold shrink-0">2</span>
                                        <span className="text-sm text-slate-600 dark:text-white/70">يقوم النظام بصياغة رسالة رسمية تلقائياً: "السلام عليكم، نود إبلاغكم بأن الطالب [الاسم] تغيب اليوم [التاريخ]".</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                );

            case 'grades':
                return (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <SectionTitle title="سجل الدرجات" subtitle="أدوات تقويم مرنة وحسابات دقيقة" />
                        
                        <div className="space-y-6">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                 <div>
                                     <h3 className="font-bold text-lg mb-2 text-slate-800 dark:text-white">أدوات التقويم</h3>
                                     <p className="text-sm text-slate-500 dark:text-white/60 mb-4">
                                         يمكنك إنشاء أدوات تقويم مخصصة (مثلاً: اختبار قصير، واجب منزلي، مشروع) وتحديد الدرجة العظمى لكل أداة.
                                     </p>
                                     <ul className="text-sm space-y-2 text-slate-600 dark:text-white/70 list-disc list-inside">
                                         <li>إضافة أداة جديدة من زر "إعدادات"</li>
                                         <li>تحديد الدرجة العظمى (Max Score)</li>
                                         <li>تعديل أو حذف الأدوات في أي وقت</li>
                                     </ul>
                                 </div>
                                 <div className="bg-indigo-50 dark:bg-indigo-900/20 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-500/20">
                                     <h4 className="font-bold text-indigo-700 dark:text-indigo-300 mb-2">حساب النسب</h4>
                                     <p className="text-xs font-bold text-indigo-600 dark:text-indigo-200/70 leading-relaxed">
                                         يقوم النظام تلقائياً بجمع درجات الفصل الأول والفصل الثاني، وحساب المجموع الكلي والنسبة المئوية، وتحويلها إلى تقدير لفظي (ممتاز، جيد جداً...) ورمزي (أ، ب...).
                                     </p>
                                 </div>
                             </div>
                             
                             <InfoBox type="warning">
                                 <strong>تنبيه:</strong> عند حذف أداة تقويم، لا يتم حذف الدرجات المرتبطة بها تلقائياً للحفاظ على البيانات، بل تصبح "درجات عامة".
                             </InfoBox>
                        </div>
                    </div>
                );

            case 'gamification':
                return (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <SectionTitle title="دوري العباقرة" subtitle="التحفيز والمنافسة الصفية" />
                        
                        <div className="space-y-8">
                             <p className="text-slate-600 dark:text-white/70">
                                 نظام تقسيم الطلاب إلى مجموعات (فرق) للتنافس على النقاط. يتم جمع نقاط سلوك الطلاب الفردية لتشكل مجموع نقاط الفريق.
                             </p>
                             
                             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                 <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl border border-emerald-100 dark:border-emerald-500/20 text-center">
                                     <span className="block font-bold text-emerald-700 dark:text-emerald-300 mb-1">الصقور</span>
                                     <span className="text-xs text-emerald-600/70">مثال لفريق</span>
                                 </div>
                                 <div className="p-4 bg-orange-50 dark:bg-orange-500/10 rounded-xl border border-orange-100 dark:border-orange-500/20 text-center">
                                     <span className="block font-bold text-orange-700 dark:text-orange-300 mb-1">النمور</span>
                                     <span className="text-xs text-orange-600/70">مثال لفريق</span>
                                 </div>
                                 <div className="p-4 bg-purple-50 dark:bg-purple-500/10 rounded-xl border border-purple-100 dark:border-purple-500/20 text-center">
                                     <span className="block font-bold text-purple-700 dark:text-purple-300 mb-1">النجوم</span>
                                     <span className="text-xs text-purple-600/70">مثال لفريق</span>
                                 </div>
                                 <div className="p-4 bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-100 dark:border-blue-500/20 text-center">
                                     <span className="block font-bold text-blue-700 dark:text-blue-300 mb-1">الرواد</span>
                                     <span className="text-xs text-blue-600/70">مثال لفريق</span>
                                 </div>
                             </div>

                             <h3 className="font-bold text-lg text-slate-800 dark:text-white mt-6">المتجر الطلابي</h3>
                             <p className="text-sm text-slate-500 dark:text-white/60">
                                 يمكن للطلاب استبدال نقاطهم الفردية بمكافآت (مثل: قائد الطابور، تغيير المكان). النظام يقوم بخصم النقاط المستهلكة من "رصيد الطالب" فقط، ولا يؤثر على "مجموع نقاط الفريق" للحفاظ على عدالة المنافسة.
                             </p>
                        </div>
                    </div>
                );

            case 'reports':
                return (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <SectionTitle title="التقارير والطباعة" subtitle="تصدير البيانات والمستندات" />
                        
                        <div className="space-y-6">
                            <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-6">
                                <h4 className="font-bold text-slate-900 dark:text-white mb-4">أنواع التقارير المتاحة</h4>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-red-50 text-red-600 rounded-lg"><FileText className="w-5 h-5"/></div>
                                        <div>
                                            <h5 className="font-bold text-sm text-slate-800 dark:text-white">تقرير الطالب الشامل (PDF)</h5>
                                            <p className="text-xs text-slate-500">يشمل الحضور، السلوك، والدرجات للفصلين الدراسيين.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-yellow-50 text-yellow-600 rounded-lg"><Trophy className="w-5 h-5"/></div>
                                        <div>
                                            <h5 className="font-bold text-sm text-slate-800 dark:text-white">شهادات التفوق</h5>
                                            <p className="text-xs text-slate-500">تولد تلقائياً للطلاب الحاصلين على نسبة 90% فأكثر.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-slate-100 text-slate-600 rounded-lg"><AlertCircle className="w-5 h-5"/></div>
                                        <div>
                                            <h5 className="font-bold text-sm text-slate-800 dark:text-white">استدعاء ولي الأمر</h5>
                                            <p className="text-xs text-slate-500">نموذج رسمي جاهز للطباعة عند تدني الدرجات أو السلوك.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    // --- Main HTML Export ---
    const handleHTMLExport = () => {
        const htmlContent = `
            <!DOCTYPE html>
            <html dir="rtl">
            <head><title>دليل مستخدم راصد</title><style>body{font-family:sans-serif;padding:40px;line-height:1.6}</style></head>
            <body>
                <h1>دليل مستخدم راصد</h1>
                <p>هذا الملف تم تصديره من داخل التطبيق.</p>
                <!-- محتوى بسيط -->
            </body>
            </html>
        `;
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Rased_User_Guide.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex h-full bg-gray-50 dark:bg-slate-900 transition-colors duration-300 overflow-hidden" dir="rtl">
            
            {/* 1. القائمة الجانبية: عمودية وثابتة */}
            <aside className="w-64 bg-white dark:bg-slate-900 border-l border-gray-200 dark:border-white/5 flex flex-col hidden md:flex print:hidden shrink-0 z-20 shadow-sm relative">
                <div className="p-6 pb-2">
                    <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">الدليل الشامل</h2>
                    <p className="text-xs font-bold text-slate-400 dark:text-white/40 mt-1">شرح مفصل لكافة الخصائص</p>
                </div>
                
                {/* روابط التنقل العمودية */}
                <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar">
                    <NavButton id="intro" label="الرئيسية" icon={LayoutDashboard} activeTab={activeTab} onClick={setActiveTab} />
                    <NavButton id="students" label="الطلاب" icon={Users} activeTab={activeTab} onClick={setActiveTab} />
                    <NavButton id="attendance" label="الحضور" icon={CalendarCheck} activeTab={activeTab} onClick={setActiveTab} />
                    <NavButton id="grades" label="الدرجات" icon={GraduationCap} activeTab={activeTab} onClick={setActiveTab} />
                    <NavButton id="gamification" label="المنافسة" icon={Trophy} activeTab={activeTab} onClick={setActiveTab} />
                    <NavButton id="reports" label="التقارير" icon={FileText} activeTab={activeTab} onClick={setActiveTab} />
                </nav>

                {/* أزرار التصدير */}
                <div className="p-4 border-t border-gray-100 dark:border-white/5 bg-slate-50 dark:bg-black/20">
                    <button onClick={handleHTMLExport} className="w-full bg-white dark:bg-white/5 text-slate-700 dark:text-white py-2.5 rounded-xl mb-2 hover:bg-slate-100 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 text-xs font-bold flex items-center justify-center gap-2 transition-all">
                        <Download className="w-4 h-4" /> حفظ نسخة HTML
                    </button>
                    <button onClick={() => window.print()} className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-2.5 rounded-xl hover:bg-slate-800 dark:hover:bg-white/90 text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg dark:shadow-none">
                        <Printer className="w-4 h-4" /> طباعة الدليل
                    </button>
                </div>
            </aside>

            {/* 2. منطقة المحتوى */}
            <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 text-gray-800 dark:text-gray-100 custom-scrollbar relative">
                <div className="max-w-4xl mx-auto pb-20">
                    {/* Mobile Navigation Hint (Only visible on small screens) */}
                    <div className="md:hidden mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-center border border-blue-100 dark:border-blue-500/20">
                        <p className="text-sm font-bold text-blue-800 dark:text-blue-200">
                            للتصفح الكامل للدليل، يفضل استخدام جهاز كمبيوتر أو جهاز لوحي.
                        </p>
                        {/* Simple Mobile Menu */}
                        <div className="flex flex-wrap gap-2 justify-center mt-3">
                            {['intro', 'students', 'attendance', 'grades', 'gamification', 'reports'].map(tab => (
                                <button 
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-3 py-1 rounded-lg text-xs font-bold ${activeTab === tab ? 'bg-blue-600 text-white' : 'bg-white dark:bg-white/10 text-slate-600 dark:text-slate-300'}`}
                                >
                                    {tab === 'intro' ? 'الرئيسية' : tab === 'students' ? 'الطلاب' : tab === 'attendance' ? 'الحضور' : tab === 'grades' ? 'الدرجات' : tab === 'gamification' ? 'المنافسة' : 'التقارير'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Dynamic Content */}
                    {renderContent()}

                    {/* Footer Signature */}
                    <div className="mt-12 pt-8 border-t border-gray-200 dark:border-white/10 text-center">
                         <p className="text-xs font-bold text-slate-400 dark:text-white/30">
                             تم التطوير بواسطة: محمد درويش الزعابي © {new Date().getFullYear()}
                         </p>
                    </div>
                </div>
            </main>

            {/* Print Styles */}
            <style>{`
                @media print {
                    aside { display: none !important; }
                    main { overflow: visible !important; height: auto !important; padding: 0 !important; }
                    body { background: white !important; color: black !important; }
                    .dark main { color: black !important; }
                    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                }
            `}</style>
        </div>
    );
};

export default UserGuide;
