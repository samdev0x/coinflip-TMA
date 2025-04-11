// Leaderboard.tsx

import React, { useState, useEffect, useContext } from 'react';
import { Button, Card, Popup } from 'pixel-retroui';
import Navbar from './Navbar';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/leaderboard.css';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from './firebaseConfig';
import CustomTonConnectButton from './CustomTonConnectButton';
import { TelegramContext } from './TelegramContext';

interface LeaderboardUser {
  id: string;
  username: string;
  points: number;
  totalVolume: number;
  gamesWon: number;
  photo_url: string;
}

type LeaderboardType = 'points' | 'totalVolume' | 'gamesWon';

const Leaderboard: React.FC = () => {
  const [isPopupOpen, setIsPopupOpen] = useState<boolean>(false);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([]);
  const [leaderboardType, setLeaderboardType] = useState<LeaderboardType>('points');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const telegramContext = useContext(TelegramContext);

  if (!telegramContext) {
    // Handle the case where context is not available
    return <div>Loading...</div>;
  }

  const { user /* Removed unused 'points' */ } = telegramContext;

  const openPopup = () => setIsPopupOpen(true);
  const closePopup = () => setIsPopupOpen(false);

  useEffect(() => {
    fetchLeaderboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaderboardType]); // Refetch data when leaderboardType changes

  const fetchLeaderboardData = async () => {
    setIsLoading(true);
    const profilesRef = collection(db, 'profiles');
    let q;

    switch (leaderboardType) {
      case 'points':
        q = query(profilesRef, orderBy('points', 'desc'), limit(300));
        break;
      case 'totalVolume':
        q = query(profilesRef, orderBy('totalVolume', 'desc'), limit(300));
        break;
      case 'gamesWon':
        q = query(profilesRef, orderBy('gamesWon', 'desc'), limit(300));
        break;
      default:
        q = query(profilesRef, orderBy('points', 'desc'), limit(300));
    }

    try {
      const querySnapshot = await getDocs(q);
      const leaders: LeaderboardUser[] = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          username: data.username || data.first_name || 'Anonymous',
          points: data.points || 0,
          totalVolume: data.totalVolume || 0,
          gamesWon: data.gamesWon || 0,
          photo_url: data.photo_url || '/img/coin-static.png'
        };
      });
      setLeaderboardData(leaders);
    } catch (error) {
      console.error('Error fetching leaderboard data:', error);
      toast('⚠️ Failed to load leaderboard data.', { className: 'pixel-toast-error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLeaderboardTypeChange = (type: LeaderboardType) => {
    setLeaderboardType(type);
  };

  const isCurrentUser = (player: LeaderboardUser) => {
    return user && (player.id === user.id);
  };

  return (
    <div>
      <ToastContainer
        position="top-center"
        autoClose={2000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        draggable
        icon={false}
      />
      <Card bg="#fefcd0" shadowColor='#c381b5' className="m-5 p-4 items-center flex flex-col">
        <div className="w-full flex justify-between">
          <Button 
            bg="#1AC9FF" 
            textColor="black" 
            borderColor="black" 
            shadow="#2D83EC" 
            onClick={openPopup}
          >
            Help
          </Button>
          <CustomTonConnectButton />
        </div>
        <h3 className="text-xl mt-10 mb-8">Leaderboard</h3>
        <div className="w-full flex justify-between mb-4">
          <Button 
            bg={leaderboardType === 'points' ? "#1AC9FF" : "#2D83EC"} 
            textColor="white" 
            borderColor="black" 
            shadow="#2D83EC" 
            onClick={() => handleLeaderboardTypeChange('points')}
          >
            Points
          </Button>
          <Button 
            bg={leaderboardType === 'totalVolume' ? "#1AC9FF" : "#2D83EC"} 
            textColor="white" 
            borderColor="black" 
            shadow="#2D83EC" 
            onClick={() => handleLeaderboardTypeChange('totalVolume')}
          >
            Volume
          </Button>
          <Button 
            bg={leaderboardType === 'gamesWon' ? "#1AC9FF" : "#2D83EC"} 
            textColor="white" 
            borderColor="black" 
            shadow="#2D83EC" 
            onClick={() => handleLeaderboardTypeChange('gamesWon')}
          >
            Wins
          </Button>
        </div>
        {isLoading ? (
          <p>Loading...</p>
        ) : (
          <ul className="leaderboard-list">
            {leaderboardData.map((player, index) => (
              <li key={player.id} className={`leaderboard-item ${isCurrentUser(player) ? 'current-user' : ''}`}>
                <span className="leaderboard-rank">{index + 1}</span>
                <img src={player.photo_url} alt={player.username} className="leaderboard-avatar" />
                <span className="leaderboard-username">{player.username}</span>
                <span className="leaderboard-points">
                  {leaderboardType === 'points' && `${player.points} pts`}
                  {leaderboardType === 'totalVolume' && `${player.totalVolume} pts`}
                  {leaderboardType === 'gamesWon' && `${player.gamesWon} wins`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Popup
        isOpen={isPopupOpen}
        onClose={closePopup}
        bg="#fefcd0"
        baseBg="#c381b5"
        textColor="black"
        borderColor="black"
      >
        <div className="popup-content">
          <div className="popup-title">Rank Page</div>
          See where you stand among the top players.<br /><br />

          <div className="popup-section-title">Rank:</div>
          The top 300 players are displayed on the leaderboard.<br />
          You can view rankings by Points, Volume, or Wins.<br />
          Advancing on the leaderboard might be a challenge, but it's worth the effort!<br /><br />

          <strong>Keep playing and climbing the ranks!</strong>
        </div>
      </Popup>

      <Navbar />
    </div>
  );
};

export default Leaderboard;
