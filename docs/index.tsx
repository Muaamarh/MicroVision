
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

const rootElement = document.getElementById('root');

if (rootElement) {
  // إخفاء رسالة التحميل فور بدء React
  const fallback = document.getElementById('fallback-message');
  if (fallback) fallback.style.display = 'none';

  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <App />
  );
} else {
  console.error("Critical Error: Root element not found");
}
