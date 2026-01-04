
// سر الخلطة - يجب أن يتطابق مع النسخة الموجودة لدى العميل
const SECRET_SALT = "RASED_APP_SECURE_2025_OMAN";

// دالة توليد رقم بسيط من نص (Simple Hash)
const simpleHash = (str: string): string => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16).toUpperCase();
};

// دالة توليد كود التفعيل الصحيح بناءً على معرف الجهاز
export const generateValidCode = (id: string): string => {
    if (!id) return '';
    // تنظيف المعرف
    const cleanId = id.trim();
    // الخوارزمية: دمج المعرف مع الملح السري + عكس النص + هاش بسيط
    const raw = cleanId.split('').reverse().join('') + SECRET_SALT;
    const hash = simpleHash(raw);
    // نأخذ جزء من الهاش ونضيف فواصل ليصبح شكله مثل XXXX-XXXX
    const codePart = hash.padEnd(8, 'X').substring(0, 8); 
    return `${codePart.substring(0, 4)}-${codePart.substring(4, 8)}`;
};
