import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const container = document.getElementById('root');

const hideLoader = () => {
  const loader = document.getElementById('initial-loader');
  if (loader) {
    loader.style.opacity = '0';
    setTimeout(() => {
      loader.remove();
    }, 400);
  }
};

if (container) {
  try {
    const root = ReactDOM.createRoot(container);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    // الانتظار قليلاً للتأكد من تحميل الواجهة قبل إخفاء اللودر
    setTimeout(hideLoader, 800);
  } catch (error) {
    console.error("Failed to mount app:", error);
    hideLoader(); // إخفاء اللودر لرؤية الخطأ إن وجد
    document.body.innerHTML = '<div style="padding:20px;text-align:center;color:red">حدث خطأ أثناء تشغيل التطبيق. يرجى إعادة التشغيل.</div>';
  }
}