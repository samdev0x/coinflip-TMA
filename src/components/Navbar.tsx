import React, { useContext } from 'react';
import { Button, Card } from 'pixel-retroui';
import { NavLink } from 'react-router-dom';
import '../styles/navbar.css';
import { TelegramContext } from './TelegramContext';

const Navbar: React.FC = () => {
  const telegramContext = useContext(TelegramContext);

  if (!telegramContext) {
    // Handle the case where context is not available
    return null;
  }

  return (
    <div className="half-card-container">
      <Card
        bg="#fefcd0"
        shadowColor="#c381b5"
        className="m-5 items-center flex justify-center"
      >
        <NavLink to="/" end>
          {({ isActive }) => (
            <Button
              bg={isActive ? "#1AC9FF" : "#2D83EC"}
              textColor="white"
              borderColor="black"
              shadow="#2D83EC"
            >
              Home
            </Button>
          )}
        </NavLink>
        <NavLink to="/profile">
          {({ isActive }) => (
            <Button
              bg={isActive ? "#1AC9FF" : "#2D83EC"}
              textColor="white"
              borderColor="black"
              shadow="#2D83EC"
            >
              Profile
            </Button>
          )}
        </NavLink>
        <NavLink to="/leaderboard">
          {({ isActive }) => (
            <Button
              bg={isActive ? "#1AC9FF" : "#2D83EC"}
              textColor="white"
              borderColor="black"
              shadow="#2D83EC"
            >
              Rank
            </Button>
          )}
        </NavLink>
        <NavLink to="/earnpoints">
          {({ isActive }) => (
            <Button
              bg={isActive ? "#1AC9FF" : "#2D83EC"}
              textColor="white"
              borderColor="black"
              shadow="#2D83EC"
            >
              Points
            </Button>
          )}
        </NavLink>
      </Card>
    </div>
  );
};

export default Navbar;
