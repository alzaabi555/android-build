
const { contextBridge, shell } = require('electron');

// نحن نكشف فقط وظيفة 'openExternal' للواجهة الأمامية
// هذا يحمي التطبيق من الوصول الكامل للنظام مع السماح بفتح الروابط
contextBridge.exposeInMainWorld('electron', {
  openExternal: (url) => shell.openExternal(url)
});
