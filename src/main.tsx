import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './views/App.tsx';
import './index.css';
import './i18n';
import { bocFetch } from './lib/phien';

// Gắn phiên vào mọi lời gọi API. Phải chạy TRƯỚC khi dựng React, không thì mấy lời gọi
// sớm nhất đi ra mà không mang phiên và bị 401.
bocFetch();

// Suppress Vite websocket connection errors in AI Studio
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  if (typeof args[0] === 'string' && args[0].includes('[vite] failed to connect to websocket')) {
    return;
  }
  originalConsoleError.apply(console, args);
};

window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && event.reason.message && event.reason.message.includes('WebSocket closed without opened')) {
    event.preventDefault();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
