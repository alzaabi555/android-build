const { app, BrowserWindow, shell } = require('electron');
const path = require('path');

// إيقاف التسريع المادي قد يحل بعض مشاكل العرض في كروت شاشة معينة
// app.disableHardwareAcceleration();

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, '../icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      devTools: false, // اجعلها true إذا كنت بحاجة لفحص الأخطاء
      sandbox: false 
    }
  });

  // مسح الكاش لضمان تحميل التحديثات الجديدة في الواجهة
  mainWindow.webContents.session.clearCache().then(() => {
     console.log('Cache cleared successfully');
  });

  mainWindow.loadFile(path.join(__dirname, '../www/index.html'));
  mainWindow.setMenuBarVisibility(false);

  // التعامل مع فتح الروابط الخارجية (واتساب، مواقع، الخ)
  // هذا الجزء ضروري جداً لنسخة الويندوز لفتح الروابط في المتصفح الافتراضي
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // السماح بفتح البروتوكولات الخارجية المعروفة
    if (url.startsWith('https:') || url.startsWith('http:') || url.startsWith('mailto:') || url.startsWith('tel:') || url.startsWith('sms:') || url.startsWith('whatsapp:')) {
      shell.openExternal(url).catch(err => console.error('Failed to open external url:', err));
    }
    // منع إنشاء نافذة Electron فرعية، والاكتفاء بفتح الرابط خارجياً
    return { action: 'deny' };
  });

  // حماية إضافية لمنع التنقل داخل النافذة الرئيسية إلى مواقع خارجية عن طريق الخطأ
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const isLocal = url.startsWith('file://');
    if (!isLocal) {
        event.preventDefault();
        shell.openExternal(url);
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});