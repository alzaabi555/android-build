
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const container = document.getElementById('root');

const hideLoader = () => {
  const loader = document.getElementById('initial-loader');
  if (loader) {
    loader.style.opacity = '0';
    setTimeout(() => loader.remove(), 400);
  }
};

if (container) {
  try {
    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    // Hide loader after a short delay to ensure app is visible
    setTimeout(hideLoader, 600);
  } catch (error) {
    console.error("Failed to mount app:", error);
    document.body.innerHTML = '<div style="padding:40px;text-align:center;color:red;font-family:sans-serif;">حدث خطأ في التشغيل.<br/>يرجى إعادة فتح التطبيق.</div>';
  }
}
