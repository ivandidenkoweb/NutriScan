import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Suppress benign development environment WebSocket / HMR disconnection warnings
if (typeof window !== 'undefined') {
  const isWebsocketNoise = (str: string) => {
    const s = String(str).toLowerCase();
    return s.includes('websocket') || s.includes('vite') || s.includes('hmr') || s.includes('web socket');
  };

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason?.message || String(event.reason || '');
    if (isWebsocketNoise(reason)) {
      event.preventDefault();
      event.stopPropagation();
    }
  });

  window.addEventListener('error', (event) => {
    const msg = event.message || '';
    if (isWebsocketNoise(msg)) {
      event.preventDefault();
      event.stopPropagation();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
