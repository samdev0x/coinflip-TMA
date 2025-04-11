// Profile.tsx

import React, { useContext, useEffect, useState } from 'react';
import { Button, Card, Input, Popup } from 'pixel-retroui';
import Navbar from './Navbar';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import '../styles/profile.css';
import CustomTonConnectButton from './CustomTonConnectButton';
import { TelegramContext } from './TelegramContext';
import RecentPlays from './RecentPlays';

const Profile: React.FC = () => {
  const {
    user,
    points,
    setPoints,
    referredUsers,
    setReferredUsers,
  } = useContext(TelegramContext)!;

  const [profilePhoto, setProfilePhoto] = useState<string>('/img/coin-static.png');
  const [referralLink, setReferralLink] = useState<string>('');
  const [isReferralPopupOpen, setIsReferralPopupOpen] = useState<boolean>(false);
  const [isPopupOpen, setIsPopupOpen] = useState<boolean>(false);
  const [isClaiming, setIsClaiming] = useState<boolean>(false);

  useEffect(() => {
    if (user) {
      setProfilePhoto(user.photo_url || '/img/coin-static.png');
      setReferralLink(`https://t.me/TONorTAILS_BOT/TONFLIP?startapp=${user.referralCode}`);
      fetchReferredUsers(user.id);
    }
  }, [user]);

  const fetchReferredUsers = async (userId: string) => {
    try {
      const userRef = doc(db, 'profiles', userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        const referralCode = userData.referralCode;

        if (referralCode) {
          const profilesRef = collection(db, 'profiles');
          const q = query(profilesRef, where('referred_by', '==', referralCode));
          const querySnapshot = await getDocs(q);

          const referredUsersData = querySnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              username: data.username || data.first_name || 'Anonymous',
              first_name: data.first_name || 'Anonymous',
              balance: data.points || 0,
            };
          });

          setReferredUsers(referredUsersData);
        }
      }
    } catch (error) {
      console.error('Error fetching referred users:', error);
      toast('⚠️ There was an issue fetching your referrals.', {
        className: 'pixel-toast-error',
      });
    }
  };

  const handleCopyReferralLink = () => {
    navigator.clipboard
      .writeText(referralLink)
      .then(() => {
        toast('🔗 Referral link copied to clipboard!', {
          className: 'pixel-toast-success',
        });
      })
      .catch((err) => {
        console.error('Failed to copy referral link:', err);
        toast('❌ Failed to copy referral link.', {
          className: 'pixel-toast-error',
        });
      });
  };

  const handleClaim = async () => {
    if (!user || isClaiming || !user.claimablePoints || user.claimablePoints <= 0) {
      return;
    }

    const claimAmount = user.claimablePoints;
    setIsClaiming(true);
    const userRef = doc(db, 'profiles', user.id.toString());

    try {
      await updateDoc(userRef, {
        points: points + claimAmount,
        totalReferralEarnings: (user.totalReferralEarnings || 0) + claimAmount,
        claimablePoints: 0,
      });

      setPoints((prevPoints) => prevPoints + claimAmount);
      user.claimablePoints = 0;

      toast(`🎉 ${claimAmount} points claimed successfully!`, {
        className: 'pixel-toast-success',
      });
    } catch (error) {
      console.error('Error claiming points:', error);
      toast('⚠️ Failed to claim points. Please try again.', {
        className: 'pixel-toast-error',
      });
    } finally {
      setIsClaiming(false);
    }
  };

  const openReferralPopup = () => {
    if (!user) {
      toast('⚠️ User data not available.', {
        className: 'pixel-toast-error',
      });
      return;
    }
    setIsReferralPopupOpen(true);
  };

  const closeReferralPopup = () => setIsReferralPopupOpen(false);
  const openPopup = () => setIsPopupOpen(true);
  const closePopup = () => setIsPopupOpen(false);

  const calculateWinRatio = () => {
    if (user && user.gamesPlayed > 0) {
      return ((user.gamesWon / user.gamesPlayed) * 100).toFixed(2);
    }
    return '0.00';
  };
  
  return (
    <div>
      {/* Toast Notifications */}
      <ToastContainer
        position="top-center"
        autoClose={2000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
        draggable
        icon={false}
      />

      {/* Profile Card */}
      <Card
        bg="#fefcd0"
        shadowColor="#c381b5"
        className="m-5 p-4 items-center flex flex-col"
      >
        <div className="w-full flex justify-between mb-4">
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

        {/* Profile Avatar */}
        <img
          src={profilePhoto}
          alt="Profile Avatar"
          className="profile-avatar mb-4"
        />

        {/* Username */}
        <h3 className="text-xl mb-4">{user?.username || user?.first_name}</h3>

        {/* Referral Link */}
        <div className="w-full flex items-center mb-4">
          <Input
            bg="white"
            textColor="black"
            borderColor="black"
            value={referralLink}
            readOnly
            className="flex-grow mr-2"
          />
          <Button
            bg="#1AC9FF"
            textColor="black"
            borderColor="black"
            shadow="#2D83EC"
            onClick={handleCopyReferralLink}
          >
            Copy
          </Button>
        </div>

        {/* Referrals and Claim Button */}
        <div className="w-full flex justify-between mb-4">
          <Button
            bg="#1AC9FF"
            textColor="black"
            borderColor="black"
            shadow="#2D83EC"
            onClick={openReferralPopup}
          >
            Referrals
          </Button>
          <Button
            bg="#1AC9FF"
            textColor="black"
            borderColor="black"
            shadow="#2D83EC"
            onClick={handleClaim}
            disabled={!user?.claimablePoints || user.claimablePoints === 0}
            className="mr-2"
          >
            {user?.claimablePoints} Points
          </Button>
        </div>
      </Card>

      {/* Game Stats Card */}
      <Card
        bg="#fefcd0"
        shadowColor="#c381b5"
        className="m-5 p-4 items-center flex flex-col"
      >
        <h3 className="text-xl mb-5">Game Stats</h3>
        <div className="w-full">
          <div className="flex justify-between">
            <span>
              <strong>Points:</strong>
            </span>
            <span>{points}</span>
          </div>
          <div className="flex justify-between">
            <span>
              <strong>Games Played:</strong>
            </span>
            <span>{user?.gamesPlayed ?? 0}</span>
          </div>
          <div className="flex justify-between">
            <span>
              <strong>Games Won:</strong>
            </span>
            <span>{user?.gamesWon ?? 0}</span>
          </div>
          <div className="flex justify-between">
            <span>
              <strong>Games Lost:</strong>
            </span>
            <span>{user?.gamesLost ?? 0}</span>
          </div>
          <div className="flex justify-between">
            <span>
              <strong>Total Volume:</strong>
            </span>
            <span>{user?.totalVolume ?? 0}</span>
          </div>
          <div className="flex justify-between">
            <span>
              <strong>Win Ratio %:</strong>
            </span>
            <span>{calculateWinRatio()}%</span>
          </div>
        </div>

        {/* Recent Plays */}
        <h3 className="text-xl mt-6 mb-4">Recent Plays</h3>
        <RecentPlays userId={user?.id} /> {/* Pass userId prop */}
      </Card>

      {/* Referral Information Popup */}
      <Popup
        isOpen={isReferralPopupOpen}
        onClose={closeReferralPopup}
        bg="#fefcd0"
        baseBg="#c381b5"
        textColor="black"
        borderColor="black"
      >
        <div className="popup-content">
          <h3 className="popup-title">Referral Information</h3>
          <p>
            <strong>Referral Count:</strong> {user?.referrals ?? 0}
          </p>
          <p>
            <strong>Earnings:</strong> {user?.totalReferralEarnings ?? 0} points
          </p>
          <h4 className="mt-4 mb-2">Referred Users:</h4>
          <div
            className="referred-users-list"
            style={{ maxHeight: '200px', overflowY: 'auto' }}
          >
            {referredUsers.length > 0 ? (
              referredUsers.map((refUser, index) => (
                <div
                  key={index}
                  className="referred-user-item flex justify-between"
                >
                  <span>{refUser.username || refUser.first_name}</span>
                  <span>{refUser.balance} points</span>
                </div>
              ))
            ) : (
              <p>No referrals yet.</p>
            )}
          </div>
        </div>
      </Popup>

      {/* General Help Popup */}
      <Popup
        isOpen={isPopupOpen}
        onClose={closePopup}
        bg="#fefcd0"
        baseBg="#c381b5"
        textColor="black"
        borderColor="black"
      >
        <div className="popup-content">
          <div className="popup-title">Profile Page</div>
          This is where you can view and manage all your profile details.
          <br />
          <br />

          <div className="popup-section-title">Your Information:</div>
          Check your current points balance, view your recent game statistics, and
          update your profile picture.
          <br />
          <br />

          <div className="popup-section-title">Game Statistics:</div>
          Track the number of games you've played, how many you've won, and your
          overall win/loss ratio.
          <br />
          <br />

          <div className="popup-section-title">Referral Info:</div>
          View and manage your referral details.
          <br />
          <br />
          Invite friends and receive 5% of their bets plus a one-time reward for both
          of you.
          <br />
          <br />
          Referral earnings accumulate over time and need to be claimed manually.
          <br />
          <br />

          <strong>Stay updated and enjoy your game journey!</strong>
        </div>
      </Popup>

      {/* Navigation Bar */}
      <Navbar />
    </div>
  );
};

export default Profile;
