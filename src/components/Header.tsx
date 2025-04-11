// src/components/Header.tsx
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-blue-500 text-white p-4 text-center w-full" role="banner">
      <h1 className="text-2xl font-bold">CoinFlip App</h1>
    </header>
  );
};

export default Header;
