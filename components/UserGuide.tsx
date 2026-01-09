
import React, { useRef } from 'react';
import { Printer, BookOpen, AlertCircle, CheckCircle2, ChevronRight, Info } from 'lucide-react';

const UserGuide: React.FC = () => {
  const guideRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col h-full overflow-hidden text-gray-900 bg-white">
        {/* Header Action Bar (Hidden on Print) */}
        <div className="bg-[#1f2937] p-4 flex justify-between items-center shadow-md print:hidden">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-indigo-400" />
                دليل المستخدم الشامل
            </h2>
            <button 
                onClick={handlePrint}
                className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-black text-sm flex items-center gap-2 shadow-lg hover:bg-indigo-700 transition-all active:scale-95"
            >
                <Printer className="w-4 h-4" />
                طباعة الدليل
            </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto bg-gray-50 print:bg-white p-4 md:p-8" id="guide-content">
            <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 shadow-xl rounded-[2rem] print:shadow-none print:p-0">
                
                {/* Print Header */}
                <div className="text-center mb-12 border-b-2 border-gray-100 pb-8">
                    <h1 className="text-4xl font-black text-indigo-900 mb-2">تطبيق راصد</h1>
                    <p className="text-xl font-bold text-gray-500">الدليل التعريفي الشامل للمعلم</p>
                    <p className="text-sm font-bold text-gray-400 mt-2">الإصدار 3.6.0</p>
                </div>

                {/* Section 1: Introduction */}
                <section className="mb-12 page-break-avoid">
                    <h2 className="text-2xl font-black text-slate-800 mb-4 flex items-center gap-2">
                        <Info className="w-6 h-6 text-indigo-600" />
                        1. نبذة عن التطبيق
                    </h2>
                    <p className="text-lg leading-relaxed text-gray-700 text-justify">
                        تطبيق "راصد" هو مساعد رقمي متكامل صمم خصيصاً للمعلم العماني، بهدف أتمتة العمليات اليومية الروتينية داخل الغرفة الصفية. يتيح التطبيق للمعلم إدارة سجلات الحضور والغياب، رصد الدرجات، متابعة السلوك، وإصدار التقارير والإحصائيات بضغطة زر واحدة، مما يوفر الوقت والجهد للتركيز على العملية التعليمية.
                    </p>
                    <div className="mt-6 grid grid-cols-2 gap-4">
                        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                            <h4 className="font-bold text-indigo-800 mb-1">العمل بدون إنترنت</h4>
                            <p className="text-sm text-gray-600">يعمل التطبيق بكفاءة تامة دون الحاجة للاتصال بالشبكة.</p>
                        </div>
                        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                            <h4 className="font-bold text-emerald-800 mb-1">حفظ البيانات</h4>
                            <p className="text-sm text-gray-600">يتم حفظ جميع البيانات محلياً على جهازك لضمان الخصوصية والسرعة.</p>
                        </div>
                    </div>
                </section>

                <hr className="my-8 border-gray-100 print:hidden" />

                {/* Section 2: Getting Started */}
                <section className="mb-12 page-break-avoid">
                    <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-2">
                        <CheckCircle2 className="w-6 h-6 text-indigo-600" />
                        2. خطوات البدء السريع
                    </h2>
                    <ol className="space-y-6 list-none p-0">
                        <li className="flex gap-4">
                            <span className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-black shrink-0">1</span>
                            <div>
                                <h3 className="font-bold text-lg text-gray-900 mb-1">إعداد الهوية والجدول</h3>
                                <p className="text-gray-600">من الصفحة الرئيسية، اضغط على زر التعديل (القلم) بجوار صورة الملف الشخصي لإدخال اسمك واسم المدرسة. ثم اضغط على زر الإعدادات (الترس) في بطاقة الجدول لإدخال توقيت الحصص.</p>
                            </div>
                        </li>
                        <li className="flex gap-4">
                            <span className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-black shrink-0">2</span>
                            <div>
                                <h3 className="font-bold text-lg text-gray-900 mb-1">إضافة الفصول والطلاب</h3>
                                <p className="text-gray-600">انتقل لصفحة "الطلاب". يمكنك إضافة الفصول يدوياً، ثم إضافة الطلاب واحداً تلو الآخر، أو استخدام ميزة "استيراد Excel" لإضافة قوائم كاملة دفعة واحدة.</p>
                            </div>
                        </li>
                        <li className="flex gap-4">
                            <span className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-black shrink-0">3</span>
                            <div>
                                <h3 className="font-bold text-lg text-gray-900 mb-1">تجهيز أدوات التقويم</h3>
                                <p className="text-gray-600">من صفحة "الدرجات"، اضغط على زر الإعدادات لإضافة أدوات التقويم الخاصة بمادتك (مثل: اختبار قصير 1، واجبات، مشروع... إلخ).</p>
                            </div>
                        </li>
                    </ol>
                </section>

                <hr className="my-8 border-gray-100 print:hidden" />

                {/* Section 3: Features Detail */}
                <section className="mb-12 page-break-avoid">
                    <h2 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-2">
                        <ChevronRight className="w-6 h-6 text-indigo-600" />
                        3. شرح الخصائص الرئيسية
                    </h2>
                    
                    <div className="space-y-8">
                        <div>
                            <h3 className="font-bold text-xl text-indigo-800 mb-2 border-b pb-2">سجل الحضور والغياب</h3>
                            <p className="text-gray-700 mb-2">يتيح لك هذا القسم رصد الغياب اليومي، التأخير، أو التسرب من الحصة.</p>
                            <ul className="list-disc list-inside text-gray-600 space-y-1 mr-4">
                                <li><strong>تصدير شهري:</strong> قم بتصدير سجل حضور كامل لشهر معين بصيغة Excel.</li>
                                <li><strong>إشعار ولي الأمر:</strong> عند تسجيل حالة غياب أو تأخير، يظهر زر "رسالة" يتيح لك إرسال رسالة واتساب جاهزة لولي الأمر مباشرة.</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-bold text-xl text-indigo-800 mb-2 border-b pb-2">سجل الدرجات</h3>
                            <p className="text-gray-700 mb-2">سجل إلكتروني مرن لحفظ درجات الطلاب.</p>
                            <ul className="list-disc list-inside text-gray-600 space-y-1 mr-4">
                                <li><strong>الرصد الجماعي:</strong> خاصية تتيح لك رصد درجة موحدة لجميع الطلاب (مثل درجة الواجب) بضغطة واحدة.</li>
                                <li><strong>الحساب التلقائي:</strong> يقوم التطبيق بجمع درجات التقويم المستمر (60) والامتحان النهائي (40) تلقائياً.</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-bold text-xl text-indigo-800 mb-2 border-b pb-2">قائمة الطلاب والسلوك</h3>
                            <p className="text-gray-700 mb-2">إدارة شاملة لبيانات الطلاب السلوكية.</p>
                            <ul className="list-disc list-inside text-gray-600 space-y-1 mr-4">
                                <li><strong>تعزيز إيجابي/سلبي:</strong> امنح الطلاب نقاطاً للسلوك الجيد أو خصم نقاط للمخالفات، مع توثيق التاريخ والسبب.</li>
                                <li><strong>الاختيار العشوائي:</strong> أداة لاختيار طالب عشوائياً للمشاركة، تضمن العدالة والمشاركة الفعالة.</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-bold text-xl text-indigo-800 mb-2 border-b pb-2">مركز التقارير</h3>
                            <p className="text-gray-700 mb-2">القلب النابض للتطبيق، حيث يمكنك طباعة المخرجات الورقية.</p>
                            <ul className="list-disc list-inside text-gray-600 space-y-1 mr-4">
                                <li><strong>تقرير الطالب الشامل:</strong> وثيقة PDF تحتوي على بيانات الطالب، درجاته، سلوكه، ورسم بياني لغيابه.</li>
                                <li><strong>شهادات التقدير:</strong> تصميم شهادات احترافية للطلاب المتفوقين وتصديرها للطباعة.</li>
                                <li><strong>استدعاء ولي أمر:</strong> نموذج رسمي جاهز للاستدعاء، يحتوي على سبب الاستدعاء وموعد الحضور.</li>
                            </ul>
                        </div>
                    </div>
                </section>

                <hr className="my-8 border-gray-100 print:hidden" />

                {/* Section 4: Tips */}
                <section className="mb-8 page-break-avoid">
                    <h2 className="text-2xl font-black text-slate-800 mb-4 flex items-center gap-2">
                        <AlertCircle className="w-6 h-6 text-amber-500" />
                        4. نصائح هامة
                    </h2>
                    <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100">
                        <ul className="list-disc list-inside text-gray-700 space-y-2">
                            <li>قم دائماً بعمل <strong>نسخة احتياطية</strong> لبياناتك من صفحة "الإعدادات" بشكل أسبوعي لتجنب فقدان البيانات في حال ضياع الهاتف أو عطل التطبيق.</li>
                            <li>تأكد من إدخال أرقام هواتف أولياء الأمور عند إضافة الطلاب للاستفادة من ميزة المراسلة عبر الواتساب.</li>
                            <li>عند الطباعة، تأكد من اختيار حجم الورق A4 وإلغاء الهوامش (Margins: None) للحصول على أفضل تنسيق للتقارير.</li>
                        </ul>
                    </div>
                </section>

                {/* Print Footer */}
                <div className="text-center mt-12 pt-8 border-t border-gray-200">
                    <p className="font-bold text-gray-500">تم إنشاء هذا الدليل بواسطة تطبيق راصد</p>
                    <p className="text-sm text-gray-400">جميع الحقوق محفوظة للمطور © {new Date().getFullYear()}</p>
                </div>

            </div>
        </div>
    </div>
  );
};

export default UserGuide;
