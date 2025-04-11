// TelegramContext.tsx

import React, { createContext, useState, useEffect, useRef } from 'react';
import { doc, getDoc, writeBatch, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { toast } from 'react-toastify';
import { v4 as uuidv4 } from 'uuid';

interface TelegramContextProps {
  user: UserProfile | null;
  points: number;
  setUser: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  setPoints: React.Dispatch<React.SetStateAction<number>>;
  referralCount: number;
  setReferralCount: React.Dispatch<React.SetStateAction<number>>;
  claimablePoints: number;
  setClaimablePoints: React.Dispatch<React.SetStateAction<number>>;
  totalReferralEarnings: number;
  setTotalReferralEarnings: React.Dispatch<React.SetStateAction<number>>;
  referredUsers: Array<{ username: string; first_name: string; balance: number }>;
  setReferredUsers: React.Dispatch<React.SetStateAction<Array<{ username: string; first_name: string; balance: number }>>>;
}

export interface UserProfile {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  language_code: string;
  points: number;
  claimablePoints: number;
  created_at: Date;
  referralCode: string;
  referrals: number;
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  totalVolume: number;
  photo_url: string;
  referred_by: string;
  walletAddress: string;
  lastWalletConnectionTime: Date | null;
  totalReferralEarnings: number;
  completedTasks?: Record<string, number>;
  dailyPurchases?: number;
  lastPurchaseTime?: number;
  lastBetTimestamp?: number;
}

export const TelegramContext = createContext<TelegramContextProps | undefined>(undefined);

export const TelegramProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [points, setPoints] = useState<number>(0);
  const [referralCount, setReferralCount] = useState<number>(0);
  const [claimablePoints, setClaimablePoints] = useState<number>(0);
  const [totalReferralEarnings, setTotalReferralEarnings] = useState<number>(0);
  const [referredUsers, setReferredUsers] = useState<Array<{ username: string; first_name: string; balance: number }>>([]);
  const fetchedUserData = useRef(false);

  const generateValidReferralCode = (): string => {
    return uuidv4().replace(/-/g, '_');
  };

  const fetchUserData = async () => {
    if (fetchedUserData.current) return;
    fetchedUserData.current = true;

    const tg = window.Telegram?.WebApp;
    const initData = tg?.initDataUnsafe;

    if (initData && initData.user) {
      const telegramUser = initData.user;
      const userRef = doc(db, 'profiles', telegramUser.id.toString());

      try {
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          const startParam = initData.start_param || new URLSearchParams(window.location.search).get('startapp');
          const referralCode = startParam && startParam !== telegramUser.id.toString() ? startParam : null;

          const newReferralCode = await createUserProfile(telegramUser, referralCode);
          console.log('New user created with referral code:', newReferralCode);

          if (referralCode) {
            await handleReferral(referralCode);
          }
        } else {
          const userData = userSnap.data() as UserProfile;
          setUser({ ...userData, id: userSnap.id });
          setPoints(userData.points || 0);
          setReferralCount(userData.referrals || 0);
          setClaimablePoints(userData.claimablePoints || 0);
          setTotalReferralEarnings(userData.totalReferralEarnings || 0);
          fetchReferralData(userData);
        }
      } catch (error) {
        console.error('Error during user data fetching:', error);
        toast('⚠️ There was an issue loading your profile.', {
          className: 'pixel-toast-error',
        });
      }
    } else {
      console.log('No Telegram user data found in initData');
    }
  };

  const createUserProfile = async (telegramUser: any, referralCode: string | null) => {
    const batch = writeBatch(db);
    const userRef = doc(db, 'profiles', telegramUser.id.toString());
    const newReferralCode = generateValidReferralCode();

    const newUserProfile: UserProfile = {
      id: telegramUser.id.toString(),
      username: telegramUser.username || '',
      first_name: telegramUser.first_name,
      last_name: telegramUser.last_name || '',
      language_code: telegramUser.language_code || '',
      points: 200,
      claimablePoints: referralCode ? 500 : 0,
      created_at: new Date(),
      referralCode: newReferralCode,
      referrals: 0,
      gamesPlayed: 0,
      gamesWon: 0,
      gamesLost: 0,
      totalVolume: 0,
      photo_url: '',
      referred_by: referralCode || '',
      walletAddress: '',
      lastWalletConnectionTime: null,
      totalReferralEarnings: 0,
    };

    batch.set(userRef, newUserProfile);

    const referralRef = doc(db, 'referrals', newReferralCode);
    batch.set(referralRef, { userId: telegramUser.id.toString() });

    await batch.commit();

    setUser(newUserProfile);
    setPoints(200);
    setReferralCount(0);
    setClaimablePoints(referralCode ? 500 : 0);
    setTotalReferralEarnings(0);

    toast('🎉 Profile created successfully!', {
      className: 'pixel-toast-success',
    });

    return newReferralCode;
  };

  const handleReferral = async (referralCode: string) => {
    try {
      console.log('Processing referral with code:', referralCode);
      const referralDoc = await getDoc(doc(db, 'referrals', referralCode));

      if (referralDoc.exists()) {
        const referrerId = referralDoc.data().userId;
        const referrerRef = doc(db, 'profiles', referrerId);
        const referrerSnap = await getDoc(referrerRef);

        if (referrerSnap.exists()) {
          const referrerData = referrerSnap.data() as UserProfile;

          await updateDoc(referrerRef, {
            claimablePoints: (referrerData.claimablePoints || 0) + 250,
            referrals: (referrerData.referrals || 0) + 1,
          });

          console.log('Referral processed successfully');
          toast('🎉 Referral bonus applied! Claim your points in the profile.', {
            className: 'pixel-toast-success',
          });
        }
      } else {
        console.log('Invalid referral code:', referralCode);
      }
    } catch (error) {
      console.error('Error during referral handling:', error);
      toast('⚠️ There was an issue processing the referral.', {
        className: 'pixel-toast-error',
      });
    }
  };

  const fetchReferralData = async (userData: UserProfile) => {
    if (!userData.referralCode) return;

    try {
      const profilesRef = collection(db, 'profiles');
      const q = query(profilesRef, where('referred_by', '==', userData.referralCode));
      const querySnapshot = await getDocs(q);

      const referredUsersData = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          username: data.username || '',
          first_name: data.first_name || '',
          balance: data.points || 0,
        };
      });

      setReferredUsers(referredUsersData);
    } catch (error) {
      console.error('Error fetching referral data:', error);
      toast('⚠️ There was an issue fetching your referrals.', {
        className: 'pixel-toast-error',
      });
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  return (
    <TelegramContext.Provider
      value={{
        user,
        points,
        setUser,
        setPoints,
        referralCount,
        setReferralCount,
        claimablePoints,
        setClaimablePoints,
        totalReferralEarnings,
        setTotalReferralEarnings,
        referredUsers,
        setReferredUsers,
      }}
    >
      {children}
    </TelegramContext.Provider>
  );
};
