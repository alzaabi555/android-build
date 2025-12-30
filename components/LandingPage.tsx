
import React, { useState } from 'react';
import { Download, Globe, Smartphone, Shield, Zap, Users, BarChart3, CalendarCheck, BookOpen, ChevronDown, Check, Star, FileText } from 'lucide-react';
import BrandLogo from './BrandLogo';

interface LandingPageProps {
  onLaunchApp: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLaunchApp }) => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const features = [
    { title: 'رصد الغياب بذكاء', desc: 'تسجيل الحضور والغياب والتأخير بضغطة زر مع إمكانية إرسال رسائل واتساب تلقائية لأولياء الأمور.', icon: CalendarCheck, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { title: 'سجلات الدرجات', desc: 'سجل درجات إلكتروني مرن يدعم أدوات التقويم المختلفة وحساب النسب المئوية تلقائياً.', icon: BarChart3, color: 'text-amber-500', bg: 'bg-amber-50' },
    { title: 'إدارة السلوك', desc: 'نظام نقاط تحفيزي (إيجابي وسلبي) مع تقارير فورية ودوري للمنافسة بين المجموعات.', icon: Star, color: 'text-purple-500', bg: 'bg-purple-50' },
    { title: 'التقارير والشهادات', desc: 'إصدار تقارير PDF تفصيلية وشهادات تفوق واستدعاءات ولي أمر جاهزة للطباعة.', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50' },
  ];

  // دليل الاستخدام المختصر للموقع
  const guideSteps = [
    { title: "إعداد الجدول", desc: "ابدأ بإدخال جدول الحصص وتوقيت كل حصة لتفعيل التنبيهات." },
    { title: "إضافة الطلاب", desc: "يمكنك إضافة الطلاب يدوياً أو استيراد قائمة كاملة من ملف Excel." },
    { title: "رصد اليوم", desc: "استخدم واجهة الحضور لتسجيل الغياب، ثم انتقل لسجل الدرجات أو السلوك." },
    { title: "التصدير", desc: "في نهاية الفصل، قم بتصدير السجلات والتقارير بضغطة زر." }
  ];

  const downloads = [
    { platform: 'Android', ext: '.apk', icon: Smartphone, color: 'bg-emerald-600', link: '/downloads/rased-app.apk' },
    { platform: 'iPhone (iOS)', ext: '.ipa', icon: AppleIcon, color: 'bg-slate-800', link: '/downloads/rased-ios.ipa' },
    { platform: 'Windows', ext: '.exe', icon: Monitor, color: 'bg-blue-600', link: '/downloads/rased-setup.exe' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800" dir="rtl">
      
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10"><BrandLogo className="w-full h-full" showText={false} /></div>
              <span className="text-xl font-black text-slate-800 tracking-tight">راصد</span>
            </div>
            <div className="hidden md:flex gap-8">
              <a href="#features" className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors">المميزات</a>
              <a href="#guide" className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors">الدليل</a>
              <a href="#download" className="text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors">التحميل</a>
            </div>
            <button 
                onClick={onLaunchApp}
                className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-xs font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-95"
            >
                تجربة التطبيق ويب
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative overflow-hidden pt-20 pb-32 lg:pt-32 lg:pb-40">
        <div className="absolute top-0 left-1/2 w-full -translate-x-1/2 h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100 via-slate-50 to-slate-50 opacity-60 -z-10"></div>
        <div className="max-w-7xl mx-auto px-4 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-[10px] font-black mb-6 animate-in fade-in slide-in-from-bottom-4">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
                الإصدار الجديد 3.3 متاح الآن
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-slate-900 mb-6 tracking-tight leading-tight animate-in slide-in-from-bottom-8 duration-700">
                إدارة فصلك الدراسي <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">أصبحت أذكى</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto mb-10 font-medium leading-relaxed animate-in slide-in-from-bottom-10 duration-1000">
                تطبيق "راصد" هو رفيقك اليومي لإدارة الحضور، السلوك، والدرجات. صمم خصيصاً للمعلم العصري لتوفير الوقت والجهد.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 animate-in slide-in-from-bottom-12 duration-1000">
                <a href="#download" className="flex items-center justify-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-slate-800 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1">
                    <Download className="w-5 h-5" />
                    تحميل التطبيق
                </a>
                <button onClick={onLaunchApp} className="flex items-center justify-center gap-2 px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-2xl font-black text-sm hover:bg-gray-50 transition-all">
                    <Globe className="w-5 h-5" />
                    تشغيل في المتصفح
                </button>
            </div>
        </div>
      </header>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4">
              <div className="text-center mb-16">
                  <h2 className="text-3xl font-black text-slate-900 mb-4">كل ما تحتاجه في مكان واحد</h2>
                  <p className="text-slate-500">أدوات متكاملة تغنيك عن السجلات الورقية تماماً</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {features.map((f, i) => (
                      <div key={i} className="group p-8 rounded-[2.5rem] bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-2 transition-all duration-300">
                          <div className={`w-14 h-14 ${f.bg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                              <f.icon className={`w-7 h-7 ${f.color}`} />
                          </div>
                          <h3 className="text-xl font-black text-slate-900 mb-3">{f.title}</h3>
                          <p className="text-sm text-slate-500 leading-relaxed font-medium">{f.desc}</p>
                      </div>
                  ))}
              </div>
          </div>
      </section>

      {/* Guide Section (Simplified) */}
      <section id="guide" className="py-24 bg-slate-50 relative overflow-hidden">
          <div className="max-w-5xl mx-auto px-4 relative z-10">
              <div className="bg-indigo-900 rounded-[3rem] p-8 md:p-16 text-white text-center shadow-2xl overflow-hidden relative">
                  <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                  <div className="relative z-10">
                      <h2 className="text-3xl md:text-4xl font-black mb-6">كيف تبدأ مع راصد؟</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-right">
                          {guideSteps.map((step, idx) => (
                              <div key={idx} className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10">
                                  <div className="flex items-center gap-3 mb-2">
                                      <span className="w-8 h-8 bg-white text-indigo-900 rounded-full flex items-center justify-center font-black text-sm">{idx + 1}</span>
                                      <h4 className="font-bold text-lg">{step.title}</h4>
                                  </div>
                                  <p className="text-indigo-100 text-sm leading-relaxed mr-11">{step.desc}</p>
                              </div>
                          ))}
                      </div>
                      <div className="mt-10">
                          <button onClick={onLaunchApp} className="px-8 py-3 bg-white text-indigo-900 rounded-xl font-black text-sm hover:bg-indigo-50 transition-colors">
                              فتح التطبيق وقراءة الدليل الكامل
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      </section>

      {/* Download Section */}
      <section id="download" className="py-24 bg-white">
          <div className="max-w-4xl mx-auto px-4 text-center">
              <h2 className="text-3xl font-black text-slate-900 mb-4">تحميل التطبيق</h2>
              <p className="text-slate-500 mb-12">اختر النسخة المناسبة لجهازك. التطبيق يعمل بدون إنترنت.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {downloads.map((d, i) => (
                      <a href={d.link} key={i} className={`flex flex-col items-center p-6 rounded-3xl transition-all hover:scale-105 active:scale-95 group text-white ${d.color} shadow-lg shadow-${d.color.replace('bg-', '')}/30`}>
                          <d.icon className="w-12 h-12 mb-4 opacity-90 group-hover:scale-110 transition-transform" />
                          <span className="text-lg font-black">{d.platform}</span>
                          <span className="text-xs font-bold opacity-70 mt-1">{d.ext}</span>
                          <div className="mt-6 w-full py-3 bg-white/20 rounded-xl text-xs font-bold backdrop-blur-sm flex items-center justify-center gap-2">
                              <Download className="w-4 h-4" /> تحميل
                          </div>
                      </a>
                  ))}
              </div>
              <p className="mt-8 text-xs text-gray-400 font-bold">
                  * ملاحظة: لتحميل نسخة الآيفون، قد تحتاج لاستخدام متجر AltStore أو التثبيت اليدوي إذا لم يكن متوفراً على App Store.
              </p>
          </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
          <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-3">
                  <div className="w-8 h-8"><BrandLogo className="w-full h-full" variant="light" showText={false} /></div>
                  <span className="text-white font-black text-lg">راصد</span>
              </div>
              <p className="text-xs font-bold">جميع الحقوق محفوظة © {new Date().getFullYear()} - تم التطوير بواسطة محمد الزعابي</p>
          </div>
      </footer>
    </div>
  );
};

// Icons components for the download section
const AppleIcon = (props: any) => (
  <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.78 1.18-.19 2.31-.89 3.51-.84 1.54.06 2.7.74 3.55 1.91-2.9 1.67-2.4 5.29.6 6.42-.32.97-1.43 3.09-2.74 4.7zM15.02 5.37c-.73 1.04-1.92 1.57-3.07 1.48-.15-1.42.74-2.85 1.77-3.69.96-.8 2.38-1.29 3.16-.62.24 1.02-.15 2.06-1.86 2.83z"/></svg>
);

const Monitor = (props: any) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>
);

export default LandingPage;
