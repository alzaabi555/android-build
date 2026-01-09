
import React, { useState } from 'react';
import { 
  Printer, BookOpen, LayoutDashboard, Users, CalendarCheck, 
  BarChart3, Award, Globe, Database, Settings, ShieldCheck, 
  Menu, X, ChevronLeft, Lightbulb, MousePointerClick, FileText, 
  Download, Code, Smartphone, Monitor, Apple
} from 'lucide-react';
import html2pdf from 'html2pdf.js';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

const UserGuide: React.FC = () => {
  const [activeSection, setActiveSection] = useState('intro');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const sections = [
    { id: 'intro', title: 'مقدمة وفلسفة التطبيق', icon: BookOpen },
    { id: 'downloads', title: 'تحميل التطبيق (النسخ)', icon: Download }, // Added Download Section
    { id: 'dashboard', title: 'لوحة التحكم والجدول', icon: LayoutDashboard },
    { id: 'students', title: 'إدارة الطلاب والبيانات', icon: Users },
    { id: 'attendance', title: 'نظام الحضور الذكي', icon: CalendarCheck },
    { id: 'grades', title: 'سجل الدرجات المتطور', icon: BarChart3 },
    { id: 'gamification', title: 'التحفيز ودوري العباقرة', icon: Award },
    { id: 'ministry', title: 'الربط الوزاري الآمن', icon: Globe },
    { id: 'data', title: 'البيانات والأمان', icon: Database },
  ];

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    if (window.innerWidth < 768) {
        setSidebarOpen(false);
    }
  };

  const handleDownloadPDF = async () => {
      setIsExporting(true);
      const element = document.getElementById('guide-content-inner');
      if (!element) return;

      const opt = {
          margin: [10, 10, 10, 10],
          filename: 'Rased_User_Manual.pdf',
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      try {
          const worker = html2pdf().set(opt).from(element).toPdf();
          
          if (Capacitor.isNativePlatform()) {
              const pdfBase64 = await worker.output('datauristring');
              const base64Data = pdfBase64.split(',')[1];
              const result = await Filesystem.writeFile({
                  path: 'Rased_User_Manual.pdf',
                  data: base64Data,
                  directory: Directory.Cache
              });
              await Share.share({
                  title: 'دليل مستخدم راصد',
                  url: result.uri
              });
          } else {
              worker.save();
          }
      } catch (e) {
          console.error('PDF Export Error:', e);
          alert('حدث خطأ أثناء تصدير الدليل.');
      } finally {
          setIsExporting(false);
      }
  };

  const handleDownloadHTML = async () => {
      const content = document.getElementById('guide-content-inner')?.innerHTML;
      if (!content) return;

      const fullHtml = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>دليل مستخدم تطبيق راصد</title>
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; background: #f8fafc; color: #0f172a; padding: 40px; line-height: 1.6; }
        h1, h2, h3 { color: #1e293b; font-weight: 900; }
        h1 { border-bottom: 4px solid #4f46e5; padding-bottom: 10px; margin-bottom: 30px; }
        section { background: white; padding: 30px; border-radius: 16px; margin-bottom: 30px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        ul { padding-right: 20px; }
        li { margin-bottom: 8px; }
        .highlight { background: #e0e7ff; color: #3730a3; padding: 2px 6px; border-radius: 4px; font-weight: bold; }
        .download-btn { display: inline-block; padding: 10px 20px; background: #4f46e5; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 10px; }
        @media print { body { background: white; padding: 0; } section { box-shadow: none; border: none; padding: 0; margin-bottom: 20px; } .no-print { display: none; } }
    </style>
</head>
<body>
    <div style="max-width: 800px; margin: 0 auto;">
        ${content}
        <div style="text-align: center; margin-top: 50px; color: #64748b; font-size: 12px;">
            <p>تم استخراج هذا الدليل من تطبيق راصد - الإصدار 3.6.0</p>
        </div>
    </div>
</body>
</html>`;

      if (Capacitor.isNativePlatform()) {
          try {
              const result = await Filesystem.writeFile({
                  path: 'Rased_Guide.html',
                  data: fullHtml,
                  directory: Directory.Cache,
                  encoding: Encoding.UTF8
              });
              await Share.share({
                  title: 'دليل مستخدم راصد (HTML)',
                  url: result.uri
              });
          } catch(e) { console.error(e); }
      } else {
          const blob = new Blob([fullHtml], { type: 'text/html' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'Rased_Manual.html';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
      }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-900 font-sans relative overflow-hidden user-guide-wrapper">
        
        {/* Header */}
        <div className="bg-white border-b border-slate-200 p-4 flex justify-between items-center shadow-sm z-20 shrink-0">
            <div className="flex items-center gap-3">
                <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-100 rounded-lg lg:hidden text-slate-600">
                    <Menu className="w-6 h-6" />
                </button>
                <div className="flex flex-col">
                    <h1 className="text-xl font-black text-indigo-900 flex items-center gap-2">
                        <BookOpen className="w-6 h-6 text-indigo-600" />
                        دليل المعلم المحترف
                    </h1>
                    <span className="text-xs font-bold text-slate-500">راصد V3.6.0 - الدليل الرسمي</span>
                </div>
            </div>
            
            <div className="flex gap-2">
                <button 
                    onClick={handleDownloadPDF}
                    disabled={isExporting}
                    className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 shadow-lg hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
                >
                    <Download className="w-4 h-4" />
                    {isExporting ? 'جاري التحضير...' : 'PDF'}
                </button>
                <button 
                    onClick={handleDownloadHTML}
                    className="bg-slate-800 text-white px-4 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 shadow-lg hover:bg-slate-700 transition-all active:scale-95 hidden md:flex"
                >
                    <Code className="w-4 h-4" />
                    HTML
                </button>
            </div>
        </div>

        <div className="flex flex-1 overflow-hidden relative">
            
            {/* Sidebar Navigation */}
            <aside className={`
                absolute lg:relative z-10 h-full w-64 bg-white border-l border-slate-200 shadow-xl lg:shadow-none transition-transform duration-300 transform 
                ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
            `}>
                <div className="p-4 space-y-1 h-full overflow-y-auto custom-scrollbar">
                    <p className="text-xs font-black text-slate-400 mb-3 px-2">فهرس المحتويات</p>
                    {sections.map(section => (
                        <button
                            key={section.id}
                            onClick={() => scrollToSection(section.id)}
                            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all font-bold text-sm text-right ${activeSection === section.id ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            <section.icon className={`w-4 h-4 ${activeSection === section.id ? 'text-indigo-600' : 'text-slate-400'}`} />
                            {section.title}
                        </button>
                    ))}
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50 p-4 md:p-8 scroll-smooth" id="guide-content">
                <div id="guide-content-inner" className="max-w-4xl mx-auto space-y-8 pb-20">

                    {/* Section 1: Intro */}
                    <section id="intro" className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 scroll-mt-4">
                        <div className="flex items-center gap-4 mb-6 border-b border-slate-100 pb-4">
                            <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600"><Lightbulb className="w-6 h-6" /></div>
                            <h2 className="text-2xl font-black text-slate-800">1. فلسفة راصد</h2>
                        </div>
                        <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed font-medium">
                            <p className="mb-4">
                                تم تصميم تطبيق <strong>راصد</strong> (Rased App) ليكون المساعد الرقمي الشخصي للمعلم العماني. الفكرة الأساسية هي "الأتمتة الكاملة" لمهام المعلم الروتينية (الغياب، الدرجات، السلوك) داخل الغرفة الصفية دون الحاجة للإنترنت.
                            </p>
                            <div className="grid md:grid-cols-2 gap-4 mt-6">
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <h4 className="font-black text-indigo-700 mb-2">لماذا راصد؟</h4>
                                    <ul className="list-disc list-inside space-y-1 text-sm">
                                        <li>بديل ذكي للسجلات الورقية المعرضة للتلف.</li>
                                        <li>حساب النسب المئوية للدرجات تلقائياً (60/40).</li>
                                        <li>توليد تقارير PDF فورية وارسالها لولي الأمر.</li>
                                        <li>يعمل بكفاءة عالية على جميع الأجهزة (Offline).</li>
                                    </ul>
                                </div>
                                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                                    <h4 className="font-black text-emerald-700 mb-2">الأمان والخصوصية</h4>
                                    <ul className="list-disc list-inside space-y-1 text-sm">
                                        <li>جميع البيانات مخزنة محلياً في جهازك فقط.</li>
                                        <li>لا يتم رفع أي بيانات للسحابة إلا بطلبك (الربط الوزاري).</li>
                                        <li>إمكانية عمل نسخ احتياطية واستعادتها بسهولة.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* NEW SECTION: Downloads */}
                    <section id="downloads" className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 scroll-mt-4 no-print">
                        <div className="flex items-center gap-4 mb-6 border-b border-slate-100 pb-4">
                            <div className="w-12 h-12 bg-sky-100 rounded-2xl flex items-center justify-center text-sky-600"><Download className="w-6 h-6" /></div>
                            <h2 className="text-2xl font-black text-slate-800">تحميل التطبيق</h2>
                        </div>
                        <p className="text-slate-600 font-medium mb-6">
                            يمكنك تثبيت تطبيق راصد على مختلف أجهزتك. جميع النسخ تعمل بنفس الكفاءة وتدعم نقل البيانات بينها (عبر النسخ الاحتياطي).
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Android */}
                            <div className="border border-slate-200 rounded-2xl p-5 flex flex-col items-center text-center hover:shadow-lg transition-all hover:border-emerald-200 bg-emerald-50/30">
                                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-3">
                                    <Smartphone className="w-7 h-7" />
                                </div>
                                <h3 className="font-black text-lg text-slate-900">نسخة الأندرويد</h3>
                                <p className="text-xs text-slate-500 font-bold mb-4">Android 10+ (APK)</p>
                                <a href="#" target="_blank" rel="noopener noreferrer" className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2">
                                    <Download className="w-4 h-4" /> تحميل APK
                                </a>
                            </div>

                            {/* iOS */}
                            <div className="border border-slate-200 rounded-2xl p-5 flex flex-col items-center text-center hover:shadow-lg transition-all hover:border-slate-300 bg-slate-50">
                                <div className="w-14 h-14 bg-slate-200 rounded-full flex items-center justify-center text-slate-700 mb-3">
                                    {/* Using Smartphone as generic icon for iOS */}
                                    <Smartphone className="w-7 h-7" />
                                </div>
                                <h3 className="font-black text-lg text-slate-900">نسخة الآيفون</h3>
                                <p className="text-xs text-slate-500 font-bold mb-4">iOS 15+ (IPA)</p>
                                <a href="#" target="_blank" rel="noopener noreferrer" className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-sm shadow-lg shadow-slate-500/20 transition-all flex items-center justify-center gap-2">
                                    <Download className="w-4 h-4" /> تحميل IPA
                                </a>
                                <p className="text-[9px] text-slate-400 mt-2 font-bold">* يتطلب التثبيت عبر AltStore</p>
                            </div>

                            {/* Windows */}
                            <div className="border border-slate-200 rounded-2xl p-5 flex flex-col items-center text-center hover:shadow-lg transition-all hover:border-blue-200 bg-blue-50/30">
                                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-3">
                                    <Monitor className="w-7 h-7" />
                                </div>
                                <h3 className="font-black text-lg text-slate-900">نسخة الكمبيوتر</h3>
                                <p className="text-xs text-slate-500 font-bold mb-4">Windows 10/11 (EXE)</p>
                                <a href="#" target="_blank" rel="noopener noreferrer" className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2">
                                    <Download className="w-4 h-4" /> تحميل EXE
                                </a>
                            </div>
                        </div>
                    </section>

                    {/* Section 2: Dashboard */}
                    <section id="dashboard" className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 scroll-mt-4">
                        <div className="flex items-center gap-4 mb-6 border-b border-slate-100 pb-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600"><LayoutDashboard className="w-6 h-6" /></div>
                            <h2 className="text-2xl font-black text-slate-800">2. لوحة التحكم والجدول</h2>
                        </div>
                        <div className="space-y-6 text-slate-600 font-medium">
                            <p>الصفحة الرئيسية هي لوحة القيادة التي تبدأ منها يومك الدراسي.</p>
                            
                            <div className="border-r-4 border-blue-500 pr-4 py-1 bg-blue-50/50 rounded-r-lg">
                                <h3 className="text-lg font-black text-slate-900">إعداد الهوية (Setup)</h3>
                                <p className="text-sm mt-1">
                                    اضغط على زر <strong>القلم</strong> في أعلى الشاشة لضبط بياناتك:
                                    <br/>- الاسم، المدرسة، المادة.
                                    <br/>- صورة الملف الشخصي وختم المدرسة (سيظهران في التقارير).
                                    <br/>- تحديد الفصل الدراسي الحالي (الأول/الثاني) ليقوم التطبيق بفلترة الدرجات تلقائياً.
                                </p>
                            </div>

                            <div className="border-r-4 border-amber-500 pr-4 py-1 bg-amber-50/50 rounded-r-lg">
                                <h3 className="text-lg font-black text-slate-900">الجدول الدراسي</h3>
                                <p className="text-sm mt-1">
                                    اضغط على <strong>زر الترس (Settings)</strong> في بطاقة الجدول لإدخال الحصص.
                                    <br/>- يمكنك تحديد توقيت بداية ونهاية كل حصة.
                                    <br/>- <strong>ميزة الجرس الذكي:</strong> عند تفعيل الجرس، سيرسل التطبيق إشعاراً عند بداية ونهاية كل حصة تلقائياً.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Section 3: Students */}
                    <section id="students" className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 scroll-mt-4">
                        <div className="flex items-center gap-4 mb-6 border-b border-slate-100 pb-4">
                            <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600"><Users className="w-6 h-6" /></div>
                            <h2 className="text-2xl font-black text-slate-800">3. إدارة الطلاب</h2>
                        </div>
                        <div className="space-y-4 text-slate-600 font-medium">
                            <p>إدارة قوائم الطلاب بمرونة عالية.</p>
                            <h4 className="font-black text-slate-900 mt-4">إضافة الطلاب:</h4>
                            <ul className="list-disc list-inside space-y-2 text-sm">
                                <li><strong>يدوياً:</strong> عبر زر (+) لإضافة طالب واحد بسرعة.</li>
                                <li><strong>استيراد Excel:</strong> الطريقة الأفضل. قم بإعداد ملف إكسل يحتوي على عمود "الاسم" وعمود "الهاتف"، وارفع الملف ليقوم التطبيق بقراءته وتوزيع الطلاب.</li>
                            </ul>
                            
                            <h4 className="font-black text-slate-900 mt-4">الاختيار العشوائي:</h4>
                            <p className="text-sm">استخدم زر "العصا السحرية" لاختيار طالب عشوائي للمشاركة، مما يضفي حماساً وعدالة في الفصل.</p>
                        </div>
                    </section>

                    {/* Section 4: Attendance */}
                    <section id="attendance" className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 scroll-mt-4">
                        <div className="flex items-center gap-4 mb-6 border-b border-slate-100 pb-4">
                            <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center text-rose-600"><CalendarCheck className="w-6 h-6" /></div>
                            <h2 className="text-2xl font-black text-slate-800">4. سجل الحضور والغياب</h2>
                        </div>
                        <div className="space-y-4 text-slate-600 font-medium">
                            <p>نظام سريع لتسجيل الحضور بلمسة واحدة.</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center text-xs font-black text-white mb-4">
                                <div className="bg-emerald-500 p-2 rounded-lg">حضور (✓)</div>
                                <div className="bg-rose-500 p-2 rounded-lg">غياب (X)</div>
                                <div className="bg-amber-500 p-2 rounded-lg">تأخر (Clock)</div>
                                <div className="bg-purple-600 p-2 rounded-lg">تسرب/هروب (Door)</div>
                            </div>
                            
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                <h4 className="font-black text-slate-900 mb-2">إشعارات الواتساب الذكية:</h4>
                                <p className="text-sm">عند تسجيل غياب أو تأخير أو تسرب لطالب، يظهر زر "رسالة" صغير بجانب اسمه. الضغط عليه يفتح الواتساب مباشرة مع رسالة جاهزة لولي الأمر تتضمن اسم الطالب والتاريخ والحالة.</p>
                            </div>
                        </div>
                    </section>

                    {/* Section 5: Grades */}
                    <section id="grades" className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 scroll-mt-4">
                        <div className="flex items-center gap-4 mb-6 border-b border-slate-100 pb-4">
                            <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600"><BarChart3 className="w-6 h-6" /></div>
                            <h2 className="text-2xl font-black text-slate-800">5. سجل الدرجات</h2>
                        </div>
                        <div className="prose prose-slate max-w-none text-slate-600">
                            <p className="font-medium">وداعاً للحسابات اليدوية المعقدة.</p>
                            
                            <h4 className="font-black text-slate-900 mt-4">1. إعداد الأدوات:</h4>
                            <p className="text-sm">من زر الإعدادات، أضف أدوات التقويم (مثال: اختبار قصير 1، واجبات، مشروع). </p>
                            
                            <h4 className="font-black text-slate-900 mt-4">2. طريقة الحساب (Algorithm):</h4>
                            <div className="bg-slate-100 p-4 rounded-xl border border-slate-200 text-sm font-mono">
                                المجموع الكلي = (مجموع أدوات التقويم المستمر من 60) + (الامتحان النهائي من 40)
                            </div>
                            <p className="text-xs text-slate-500 mt-1">* تأكد من تسمية الأداة بـ "الامتحان النهائي" ليقوم التطبيق بتمييزها في الحساب.</p>

                            <h4 className="font-black text-slate-900 mt-4">3. الرصد الجماعي:</h4>
                            <p className="text-sm">يمكنك رصد درجة موحدة لجميع الطلاب (مثال: درجة المشاركة الكاملة) بضغطة واحدة من الشريط العلوي للأدوات.</p>
                        </div>
                    </section>

                    {/* Section 6: Gamification */}
                    <section id="gamification" className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 scroll-mt-4">
                        <div className="flex items-center gap-4 mb-6 border-b border-slate-100 pb-4">
                            <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600"><Award className="w-6 h-6" /></div>
                            <h2 className="text-2xl font-black text-slate-800">6. التحفيز (Gamification)</h2>
                        </div>
                        <div className="text-slate-600 font-medium space-y-4">
                            <p>تحويل الفصل الدراسي إلى بيئة تنافسية ممتعة.</p>
                            
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="border border-indigo-100 bg-indigo-50/50 rounded-xl p-4">
                                    <h4 className="font-black text-indigo-900 mb-2">المتجر الافتراضي</h4>
                                    <p className="text-sm">يجمع الطلاب "عملات ذهبية" مقابل كل سلوك إيجابي. يمكنهم استبدال هذه العملات بمكافآت (تغيير مكان الجلوس، قائد، إعفاء واجب). هذا يعزز السلوك الإيجابي بشكل مذهل.</p>
                                </div>
                                <div className="border border-purple-100 bg-purple-50/50 rounded-xl p-4">
                                    <h4 className="font-black text-purple-900 mb-2">دوري المجموعات</h4>
                                    <p className="text-sm">قسم طلابك إلى فرق (الصقور، النمور...). امنح نقاطاً للفريق بالكامل عند الهدوء أو الإجابة الجماعية. روح الفريق ترفع مستوى الانضباط.</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Section 7: Ministry */}
                    <section id="ministry" className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 scroll-mt-4">
                        <div className="flex items-center gap-4 mb-6 border-b border-slate-100 pb-4">
                            <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600"><Globe className="w-6 h-6" /></div>
                            <h2 className="text-2xl font-black text-slate-800">7. الربط الوزاري (تزامن)</h2>
                        </div>
                        <div className="text-slate-600 font-medium">
                            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg text-xs font-bold text-yellow-800 mb-4 flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4" />
                                تنويه: الاتصال بخوادم الوزارة يتم عبر بروتوكول آمن. التطبيق لا يحفظ كلمات المرور أبداً.
                            </div>
                            <p className="mb-2">خطوات الرفع للبوابة التعليمية:</p>
                            <ol className="list-decimal list-inside space-y-2 text-sm bg-slate-50 p-4 rounded-xl">
                                <li>سجل الدخول باستخدام بيانات البوابة (اسم المستخدم وكلمة المرور).</li>
                                <li>اختر "رصد الغياب" لرفع الغياب اليومي بضغطة زر.</li>
                                <li>اختر "رصد الدرجات"، حدد الأداة المحلية في التطبيق، وقم بمطابقتها مع معرف الامتحان في البوابة لرفع الدرجات.</li>
                            </ol>
                        </div>
                    </section>

                    {/* Section 8: Data */}
                    <section id="data" className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200 scroll-mt-4">
                        <div className="flex items-center gap-4 mb-6 border-b border-slate-100 pb-4">
                            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600"><Database className="w-6 h-6" /></div>
                            <h2 className="text-2xl font-black text-slate-800">8. إدارة البيانات</h2>
                        </div>
                        <div className="text-slate-600 font-medium">
                            <p className="mb-4">بياناتك هي أثمن ما تملك. يوفر التطبيق أدوات للحفاظ عليها.</p>
                            <div className="bg-rose-50 border border-rose-100 p-4 rounded-xl">
                                <h4 className="font-black text-rose-800 mb-2">النسخ الاحتياطي (Backup):</h4>
                                <p className="text-sm text-rose-700 leading-relaxed">
                                    من صفحة الإعدادات، اضغط "حفظ نسخة احتياطية". سيقوم التطبيق بتوليد ملف JSON يحتوي على كل شيء (طلاب، درجات، جداول). احفظ هذا الملف في مكان آمن (Google Drive أو بريدك الإلكتروني). يمكنك استعادته في أي وقت أو نقله لجهاز آخر.
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Footer */}
                    <div className="text-center pt-8 border-t border-slate-200">
                        <p className="text-sm font-bold text-slate-400">تم التطوير بكل حب لخدمة المعلم العماني ❤️</p>
                    </div>

                </div>
            </main>
        </div>
    </div>
  );
};

export default UserGuide;
