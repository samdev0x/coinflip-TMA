// Main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { TelegramProvider } from '../src/components/TelegramContext';

window.history.replaceState(null, '', window.location.pathname + window.location.search);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TonConnectUIProvider manifestUrl="https://tonflip.vercel.app/tonconnect-manifest.json">
      <TelegramProvider>
        <App />
      </TelegramProvider>
    </TonConnectUIProvider>
  </React.StrictMode>,
);
