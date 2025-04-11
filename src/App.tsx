import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CoinFlip from './components/CoinFlip';
import Profile from './components/Profile';
import EarnPoints from './components/EarnPoints';
import Leaderboard from './components/Leaderboard';
import './styles/App.css';

declare global {
  interface Window {
    Telegram: any;
    TelegramWebApp: any;
  }
}

const useTelegramWebApp = () => {
  useEffect(() => {
    const tg = window.Telegram?.WebApp;

    if (tg) {
      tg.ready();
      tg.expand();

      console.log('App launched via:', tg.initDataUnsafe);

      const handleViewportChanged = () => {
        tg.expand();
      };

      tg.onEvent('viewportChanged', handleViewportChanged);

      return () => {
        tg.offEvent('viewportChanged', handleViewportChanged);
      };
    } else {
      console.log('Telegram WebApp not available');
    }
  }, []);
};

const App: React.FC = () => {
  useTelegramWebApp();

  const [theme, setTheme] = useState<string>(window.Telegram?.WebApp?.colorScheme || 'light');
  const [themeParams, setThemeParams] = useState<any>(window.Telegram?.WebApp?.themeParams || {});

  useEffect(() => {
    const tg = window.Telegram?.WebApp;

    if (tg) {
      const handleThemeChange = () => {
        setTheme(tg.colorScheme);
        setThemeParams(tg.themeParams);
      };

      tg.onEvent('themeChanged', handleThemeChange);

      return () => {
        tg.offEvent('themeChanged', handleThemeChange);
      };
    }
  }, []);

  const themeClasses = theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-black';

  const appStyles = {
    background: 'linear-gradient(135deg, #2D83EC, #1AC9FF)',
    color: themeParams.text_color || (theme === 'dark' ? '#ffffff' : '#000000'),
  };

  return (
    <div className={`min-h-screen flex flex-col ${themeClasses}`} style={appStyles}>
      <Router>
        <Routes>
          <Route path="/" element={<CoinFlip />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/earnpoints" element={<EarnPoints />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
        </Routes>
      </Router>
    </div>
  );
};

export default App;
