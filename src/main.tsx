import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './views/App.tsx';
import './index.css';
import './i18n';

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
