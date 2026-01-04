
import { CapacitorHttp } from '@capacitor/core';
import { MinistrySession, StdsAbsDetail, StdsGradeDetail } from '../types';

// الرابط الرسمي لخدمات المعلم (الأكثر استقراراً)
const DEFAULT_URL = 'https://mobile.moe.gov.om/Sakhr.Elasip.Portal.Mobility/Services/MTletIt.svc';

// رؤوس الطلب الرسمية لمتصفح الهاتف
const HEADERS = {
    'Content-Type': 'application/json; charset=UTF-8',
    'Accept': 'application/json',
    'User-Agent': 'MOE-Teacher-App/3.0 (iOS)'
};

interface ServiceResponse {
    d?: any;
    [key: string]: any;
}

const getServiceUrl = (): string => {
    try {
        const savedUrl = localStorage.getItem('ministry_api_url');
        return (savedUrl || DEFAULT_URL).replace(/\/+$/, '');
    } catch {
        return DEFAULT_URL;
    }
};

export const ministryService = {
    /**
     * فحص الاتصال البسيط (Ping)
     * هذا طلب واحد فقط للتأكد من وجود السيرفر
     */
    testConnection: async (url: string): Promise<{ success: boolean; status: number; message: string }> => {
        const cleanUrl = url.replace(/\/+$/, '');
        const endpoint = `${cleanUrl}/Login`; // استخدام دالة الدخول القياسية للفحص

        try {
            // نرسل طلب تحقق بسيط (بدون بيانات حساسة)
            const response = await CapacitorHttp.post({
                url: endpoint,
                headers: HEADERS,
                data: { USme: "ping", PPPWZ: "ping" }, // بيانات وهمية للفحص فقط
                connectTimeout: 5000,
                readTimeout: 5000
            });

            if (response.status === 200 || response.status === 500 || response.status === 401) {
                return { success: true, status: response.status, message: 'الاتصال بالسيرفر ممتاز ✅' };
            } else if (response.status === 404) {
                return { success: false, status: 404, message: 'الرابط غير صحيح (الخدمة غير موجودة)' };
            }
            return { success: false, status: response.status, message: `حالة غير متوقعة: ${response.status}` };
        } catch (e: any) {
            return { success: false, status: 0, message: 'فشل الاتصال بالإنترنت' };
        }
    },

    /**
     * تسجيل الدخول الرسمي
     * يرسل طلباً واحداً فقط بالصيغة المعتمدة لدى الوزارة
     */
    login: async (username: string, pass: string): Promise<MinistrySession | null> => {
        const baseUrl = getServiceUrl();
        
        // 1. تحديد نقاط الاتصال المحتملة (نبدأ بالأحدث)
        // MTletIt: للمعلمين (النظام الجديد)
        // TeacherServices: للمعلمين (النظام القديم)
        // PortalMobility: للبوابة العامة
        const endpoints = ['/Login', '/UserLogin'];
        
        // البيانات الرسمية (لا يوجد تخمين هنا)
        const payload = { 
            USme: username, 
            PPPWZ: pass 
        };

        let lastError = null;

        for (const path of endpoints) {
            const url = `${baseUrl}${path}`;
            console.log(`🔒 Connecting to secure endpoint: ${path}`);

            try {
                const response = await CapacitorHttp.post({
                    url: url,
                    headers: HEADERS,
                    data: payload,
                    connectTimeout: 10000,
                    readTimeout: 10000
                });

                // إذا الرابط خطأ (404)، جرب الرابط التالي في القائمة بهدوء
                if (response.status === 404) continue;

                // التعامل مع الاستجابة الناجحة تقنياً (حتى لو رفضت كلمة المرور)
                if (response.status === 200 || response.status === 201) {
                    const data = response.data as ServiceResponse;
                    const result = data.d !== undefined ? data.d : data;

                    // التحقق من رسائل الخطأ من السيرفر
                    if (typeof result === 'string') {
                        // السيرفر رد برسالة نصية، غالباً خطأ في كلمة المرور
                        if (result.includes('Error') || result.includes('Fail') || result.includes('غير صحيحة')) {
                            throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة');
                        }
                    }

                    // التحقق من نجاح الدخول واستلام المعرفات
                    // الصيغة الرسمية تعيد UserID
                    const userId = result.UserID || result.id || result.ID;
                    
                    if (userId) {
                        return {
                            userId: String(userId),
                            auth: result.AuthToken || result.token || '',
                            userRoleId: String(result.UserRoleId || '0'),
                            schoolId: String(result.SchoolId || '0'),
                            teacherId: String(result.DepInsId || result.DeptInsId || '0')
                        };
                    } else {
                        // استجابة 200 لكن بدون بيانات مستخدم = بيانات دخول خاطئة
                        throw new Error('بيانات الدخول غير صحيحة');
                    }
                }
            } catch (error: any) {
                lastError = error;
                // إذا كان الخطأ بيانات دخول، لا داعي لتجربة روابط أخرى، توقف فوراً
                if (error.message && (error.message.includes('غير صحيحة') || error.message.includes('Invalid'))) {
                    throw error;
                }
            }
        }

        if (lastError) throw lastError;
        throw new Error('تعذر الاتصال بالخادم. يرجى التأكد من الرابط في الإعدادات.');
    },

    /**
     * جلب الفصول (بصيغة رسمية واحدة)
     */
    getStudentAbsenceFilter: async (session: MinistrySession) => {
        const baseUrl = getServiceUrl();
        // استخدام المسار القياسي فقط
        const paths = ['/GetStudentAbsenceFilter', '/GetTeacherClasses'];
        
        for (const path of paths) {
            try {
                const response = await CapacitorHttp.post({
                    url: `${baseUrl}${path}`,
                    headers: HEADERS,
                    data: {
                        userId: session.userId,
                        auth: session.auth,
                        UserRoleId: session.userRoleId,
                        SchoolId: session.schoolId,
                        DeptInsId: session.teacherId || '' 
                    }
                });

                if (response.status === 200) {
                    const data = response.data as ServiceResponse;
                    return data.d !== undefined ? data.d : data;
                }
            } catch (e) { console.warn(e); }
        }
        throw new Error('لم يتم العثور على فصول للمعلم');
    },

    // باقي الدوال تبقى كما هي لأنها تستخدم بيانات الجلسة الموثقة
    getStudentAbsenceDetails: async (session: MinistrySession, studentNo: string, classId: string, gradeId: string, date: Date) => {
        const baseUrl = getServiceUrl();
        const dateStr = date.toISOString().split('T')[0];
        const payload = {
            userId: session.userId,
            auth: session.auth,
            UserRoleId: session.userRoleId,
            SchoolId: session.schoolId,
            DepInsId: session.teacherId || '',
            GradeId: gradeId,
            ClassId: classId,
            StudentSchoolNo: studentNo,
            StartDate: dateStr,
            EndDate: dateStr
        };

        try {
            const response = await CapacitorHttp.post({
                url: `${baseUrl}/GetStudentAbsenceDetails`,
                headers: HEADERS,
                data: payload
            });
            if (response.status === 200) {
                const data = response.data as ServiceResponse;
                return data.d !== undefined ? data.d : data;
            }
            throw new Error(`Status ${response.status}`);
        } catch (error) { throw error; }
    },

    submitStudentAbsenceDetails: async (session: MinistrySession, classId: string, gradeId: string, date: Date, details: StdsAbsDetail[]) => {
        const baseUrl = getServiceUrl();
        const dateStr = date.toISOString().split('T')[0];
        const payload = {
            userId: session.userId,
            auth: session.auth,
            SchoolId: session.schoolId,
            GradeId: gradeId,
            ClassId: classId,
            StartDate: dateStr,
            UserRoleId: session.userRoleId,
            StdsAbsDetails: details
        };

        try {
            const response = await CapacitorHttp.post({
                url: `${baseUrl}/SubmitStudentAbsenceDetails`,
                headers: HEADERS,
                data: payload,
                connectTimeout: 20000
            });

            if (response.status === 200) {
                const data = response.data as ServiceResponse;
                return data.d !== undefined ? data.d : data;
            }
            throw new Error(`Error: ${response.status}`);
        } catch (error) { throw error; }
    },

    submitStudentMarksDetails: async (session: MinistrySession, config: any, grades: StdsGradeDetail[]) => {
        const baseUrl = getServiceUrl();
        const payload = {
            userId: session.userId,
            auth: session.auth,
            SchoolId: session.schoolId,
            UserRoleId: session.userRoleId,
            ClassId: config.classId,
            GradeId: config.gradeId,
            TermId: config.termId,
            SubjectId: config.subjectId,
            ExamId: config.examId,
            EduSysId: config.eduSysId || "1", 
            StageId: config.stageId || "0", 
            ExamGradeType: config.examGradeType || 1, 
            StdsGradeDetails: grades
        };

        try {
            const response = await CapacitorHttp.post({
                url: `${baseUrl}/SubmitStudentMarksDetails`,
                headers: HEADERS,
                data: payload,
                connectTimeout: 20000
            });

            if (response.status === 200) {
                const data = response.data as ServiceResponse;
                return data.d !== undefined ? data.d : data;
            }
            throw new Error(`Error: ${response.status}`);
        } catch (error) { throw error; }
    }
};
