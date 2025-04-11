// RecentPlays.tsx

import React, { useState, useEffect } from 'react';
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  where,
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import '../styles/recent-plays.css';
import { toast } from 'react-toastify';

interface Bet {
  id: string;
  username: string;
  amount: number;
  outcome: 'doubled' | 'rugged';
  timestamp: Date;
  avatar: string;
}

interface RecentPlaysProps {
  userId?: string; // Optional prop to filter plays by user
}

const RecentPlays: React.FC<RecentPlaysProps> = ({ userId }) => {
  const [recentPlays, setRecentPlays] = useState<Bet[]>([]);

  useEffect(() => {
    const betsRef = collection(db, 'bets');
    let qRef;

    if (userId) {
      // Fetch plays for the specific user
      qRef = query(
        betsRef,
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(10)
      );
    } else {
      // Fetch global recent plays
      qRef = query(betsRef, orderBy('timestamp', 'desc'), limit(10));
    }

    const unsubscribe = onSnapshot(
      qRef,
      (querySnapshot) => {
        const bets: Bet[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const timestamp =
            data.timestamp.toDate instanceof Function
              ? data.timestamp.toDate()
              : new Date(data.timestamp);
          bets.push({
            id: doc.id,
            username: data.username || 'Anonymous',
            amount: data.amount || 0,
            outcome: data.outcome || 'rugged',
            timestamp: timestamp,
            avatar: data.avatar || '/img/coin-static.png',
          });
        });
        setRecentPlays(bets);
      },
      (error) => {
        console.error('Error fetching recent plays:', error);
        toast('⚠️ Failed to load recent plays.', {
          className: 'pixel-toast-error',
        });
      }
    );

    return () => unsubscribe();
  }, [userId]);

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - timestamp.getTime()) / 1000);
    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  return (
    <ul className="recent-plays-list">
      {recentPlays.length > 0 ? (
        recentPlays.map((play) => (
          <li key={play.id} className="recent-play-item">
            <img src={play.avatar} alt="Profile" className="recent-play-avatar" />
            <div className="recent-play-details">
              <span className="recent-play-username">
                {play.username} flipped {play.amount} and{' '}
                <span className={`outcome ${play.outcome}`}>
                  {play.outcome === 'doubled' ? 'doubled it' : 'got rugged'}
                </span>.
              </span>
              <small className="recent-play-time">{formatTimestamp(play.timestamp)}</small>
            </div>
          </li>
        ))
      ) : (
        <p>No recent plays.</p>
      )}
    </ul>
  );
};

export default RecentPlays;
