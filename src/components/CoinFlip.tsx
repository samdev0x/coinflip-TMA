// CoinFlip.tsx

import React, { useState, useEffect, useRef, useContext } from 'react';
import { motion } from 'framer-motion';
import { Button, Card, Input, Popup } from 'pixel-retroui';
import Fireworks from 'react-canvas-confetti/dist/presets/fireworks';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { doc, getDoc, updateDoc, addDoc, collection } from 'firebase/firestore';
import { db } from './firebaseConfig';
import RecentPlays from './RecentPlays';
import CustomTonConnectButton from './CustomTonConnectButton';
import Navbar from './Navbar';
import { UserProfile, TelegramContext } from './TelegramContext';

const frames: string[] = [
  '/img/coin-frame-1.png', // Head
  '/img/coin-frame-2.png',
  '/img/coin-frame-3.png',
  '/img/coin-frame-4.png',
  '/img/coin-frame-5.png',
  '/img/coin-frame-6.png',
  '/img/coin-frame-7.png',
  '/img/coin-frame-8.png',
  '/img/coin-frame-9.png', // Tail
  '/img/coin-frame-10.png',
  '/img/coin-frame-11.png',
  '/img/coin-frame-12.png',
  '/img/coin-frame-13.png',
  '/img/coin-frame-14.png',
  '/img/coin-frame-15.png',
  '/img/coin-frame-16.png',
];

const CoinFlip: React.FC = () => {
  // Consume context
  const {
    user,
    points,
    setPoints,
  } = useContext(TelegramContext)!; // Non-null assertion

  // Local state management
  const [result, setResult] = useState<string | null>(null);
  const [isFlipping, setIsFlipping] = useState<boolean>(false);
  const [currentFrame, setCurrentFrame] = useState<number>(0);
  const [amount, setAmount] = useState<string>('');
  const [choice, setChoice] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isButtonDisabled, setIsButtonDisabled] = useState<boolean>(false);
  const [showConfetti, setShowConfetti] = useState<boolean>(false);
  const [isPopupOpen, setIsPopupOpen] = useState<boolean>(false);

  // Preload coin frames on mount
  useEffect(() => {
    frames.forEach((frame) => {
      const img = new Image();
      img.src = frame;
    });
  }, []);

  // Handle coin flipping animation
  useEffect(() => {
    if (isFlipping) {
      let frame = 0;
      const totalDuration = 2500; // Total flip duration in ms
      const startTime = performance.now();
      const outcomeFrame = result === 'Heads' ? [0] : [8]; // Index for Heads and Tails frames

      const animateFlip = () => {
        const elapsed = performance.now() - startTime;
        if (elapsed < totalDuration) {
          const progress = elapsed / totalDuration;
          const currentInterval = 10 + progress * 50;

          setCurrentFrame(frame % frames.length);
          frame++;

          if (intervalRef.current) clearTimeout(intervalRef.current);
          intervalRef.current = setTimeout(animateFlip, currentInterval);
        } else {
          const nearestOutcomeFrame = outcomeFrame.reduce((prev, curr) =>
            Math.abs(curr - (frame % frames.length)) < Math.abs(prev - (frame % frames.length)) ? curr : prev
          );

          const finishAnimation = () => {
            setCurrentFrame(nearestOutcomeFrame);
            setIsFlipping(false);
            setIsButtonDisabled(false);
            handleResult(result);
          };

          const slowDownInterval = setInterval(() => {
            setCurrentFrame((prevFrame) => (prevFrame + 1) % frames.length);
            frame++;
            if (frame % frames.length === nearestOutcomeFrame) {
              clearInterval(slowDownInterval);
              finishAnimation();
            }
          }, 60);
          intervalRef.current = slowDownInterval;
        }
      };

      animateFlip();
    } else {
      setCurrentFrame(0);
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [isFlipping, result]);

  // Handle flipping the coin
  const flipCoin = () => {
    if (!amount.trim()) {
      toast('❌ Please enter a bet amount', {
        className: 'pixel-toast-error',
      });
      return;
    }

    // Parse the amount as an integer
    const parsedAmount = parseInt(amount, 10);

    // Validate the parsed amount
    if (
      isNaN(parsedAmount) ||
      parsedAmount < 100 ||
      parsedAmount > 5000 ||
      !choice ||
      parsedAmount > points
    ) {
      toast('❌ Please enter a valid whole number within your balance and choose Heads or Tails', {
        className: 'pixel-toast-error',
      });
      return;
    }

    const outcomes = ['Heads', 'Tails'];
    const randomOutcome = outcomes[Math.floor(Math.random() * outcomes.length)];
    setResult(randomOutcome);
    setIsFlipping(true);
    setIsButtonDisabled(true);
    setCurrentFrame(0);
  };

  // Handle the result of the flip
  const handleResult = async (result: string | null) => {
    if (result && choice && user) {
      const userRef = doc(db, 'profiles', user.id);

      try {
        const userSnap = await getDoc(userRef);
        const userData = userSnap.data() as UserProfile;

        if (userSnap.exists() && userData) {
          const currentPoints = userData.points || 0;
          const gamesPlayed = userData.gamesPlayed || 0;
          const gamesWon = userData.gamesWon || 0;
          const gamesLost = userData.gamesLost || 0;
          const totalVolume = userData.totalVolume || 0;

          const parsedAmount = parseInt(amount, 10); // Ensure integer

          const pointsEarned = result === choice ? parsedAmount : -parsedAmount;
          const newPoints = Math.max(currentPoints + pointsEarned, 0);

          const updatedStats = {
            points: newPoints,
            gamesPlayed: gamesPlayed + 1,
            gamesWon: result === choice ? gamesWon + 1 : gamesWon,
            gamesLost: result !== choice ? gamesLost + 1 : gamesLost,
            totalVolume: totalVolume + parsedAmount,
            lastBetTimestamp: Date.now(),
          };

          await updateDoc(userRef, updatedStats);
          setPoints(newPoints);

          // Handle referral bonus
          if (userData.referred_by) {
            console.log('User has a referrer:', userData.referred_by);
            const referralsRef = doc(db, 'referrals', userData.referred_by);
            try {
              const referralSnap = await getDoc(referralsRef);
              if (referralSnap.exists()) {
                const referrerId = referralSnap.data().userId;
                const referrerRef = doc(db, 'profiles', referrerId);
                const referrerSnap = await getDoc(referrerRef);

                if (referrerSnap.exists()) {
                  const referrerData = referrerSnap.data() as UserProfile;
                  const referralBonus = parsedAmount * 0.05; // 5% of the bet amount
                  console.log('Referral bonus calculated:', referralBonus);

                  await updateDoc(referrerRef, {
                    claimablePoints: (referrerData.claimablePoints || 0) + referralBonus,
                  });
                  console.log('Referrer document updated successfully');
                } else {
                  console.log('Referrer profile does not exist');
                }
              } else {
                console.log('Referral code not found');
              }
            } catch (error) {
              console.error('Error updating referrer document:', error);
            }
          } else {
            console.log('User does not have a referrer');
          }

          // Add bet to recent plays
          await addDoc(collection(db, 'bets'), {
            userId: user.id,
            username: user.username || user.first_name,
            amount: parsedAmount,
            outcome: result === choice ? 'doubled' : 'rugged',
            timestamp: new Date(),
            avatar: user.photo_url || '/img/coin-static.png',
          });

          if (pointsEarned > 0) {
            setShowConfetti(true);
            toast(`💰 You won! It landed on ${result}. You earned ${parsedAmount} points!`, {
              className: 'pixel-toast-success',
            });
          } else {
            toast(`❌ You lost! It landed on ${result}. You lost ${parsedAmount} points.`, {
              className: 'pixel-toast-error',
            });
          }
        } else {
          toast('⚠️ Could not retrieve user data.', {
            className: 'pixel-toast-error',
          });
        }
      } catch (error) {
        console.error('Error handling result:', error);
        toast('⚠️ There was an issue processing the result.', {
          className: 'pixel-toast-error',
        });
      }
    }
  };

  // Handle amount input change
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const regex = /^\d*$/; // Only digits allowed

    if (regex.test(value)) {
      setAmount(value);
    } else {
      toast('❌ Please enter a whole number without decimals', {
        className: 'pixel-toast-error',
      });
    }
  };

  // Get the appropriate image based on the result
  const getResultImage = () => {
    if (result === 'Heads') {
      return frames[0];
    } else if (result === 'Tails') {
      return frames[8];
    }
    return frames[0];
  };

  // Handle user's choice
  const handleChoice = (choice: string) => {
    setChoice(choice);
  };

  // **Handler to Double the Bet Amount**
  const handleDoubleAmount = () => {
    console.log('Double button clicked');
    const parsedAmount = parseInt(amount, 10) || 0;
    let newAmount = parsedAmount * 2;

    // Determine the maximum allowed amount
    const maxAllowed = Math.min(5000, points);
    
    if (newAmount > maxAllowed) {
      if (maxAllowed >= 100) {
        newAmount = maxAllowed;
      } else {
        newAmount = 100;
      }
    }

    // Ensure the new amount does not exceed the user's points
    newAmount = Math.min(newAmount, points);

    console.log(`Doubling amount: ${parsedAmount} -> ${newAmount}`);
    setAmount(newAmount.toString());
  };

  // **Handler to Halve the Bet Amount**
  const handleHalveAmount = () => {
    console.log('Halve button clicked');
    const parsedAmount = parseInt(amount, 10) || 0;
    let newAmount = Math.floor(parsedAmount / 2);

    // Ensure the new amount is not below the minimum limit
    if (newAmount < 100) {
      newAmount = 100;
    }

    console.log(`Halving amount: ${parsedAmount} -> ${newAmount}`);
    setAmount(newAmount.toString());
  };

  // **Handler to Set the Bet Amount to MAX**
  const handleMaxAmount = () => {
    console.log('Max button clicked');
    // Set the amount to the lesser of the user's points or the max limit
    const newAmount = Math.min(points, 5000);
    console.log(`Setting amount to MAX: ${newAmount}`);
    setAmount(newAmount.toString());
  };

  // Manage confetti display
  useEffect(() => {
    if (showConfetti) {
      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showConfetti]);

  // Popup handlers
  const openPopup = () => setIsPopupOpen(true);
  const closePopup = () => setIsPopupOpen(false);

  return (
    <div>
      {/* Confetti Effect */}
      {showConfetti && <Fireworks autorun={{ speed: 2 }} />}

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

      {/* CoinFlip Card */}
      <Card bg="#fefcd0" shadowColor="#c381b5" className="m-5 p-4 items-center flex flex-col">
        {/* Header with Help and Connect Button */}
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

        {/* Coin Image */}
        <div className="mt-10 w-32 h-32 mb-4">
          <motion.img
            src={isFlipping ? frames[currentFrame] : getResultImage()}
            alt={result || 'Coin'}
            whileHover={{ rotate: 10 }}
            whileTap={{ scale: 0.9 }}
          />
        </div>

        {/* Bet Amount Input and Adjustment Buttons */}
        <div className="w-60 flex flex-col items-center mb-4">
          <label className="text-xl mb-2">Select Amount</label>
          <Input
            bg="white"
            textColor="black"
            borderColor="black"
            type="number"
            min="100"
            max="5000"
            step="1"
            placeholder="Min 100 - Max 5000"
            value={amount} // Controlled component
            onChange={handleAmountChange}
            onKeyDown={(e) => {
              if (e.key === '.' || e.key === ',') {
                e.preventDefault(); // Prevent decimal point entry
              }
            }}
            className="w-full"
            pattern="\d+"
          />

          {/* **Adjustment Buttons** */}
          <div className="flex justify-between w-full mt-2">
            <Button
              bg="#1AC9FF"
              textColor="white"
              borderColor="black"
              shadow="#2D83EC"
              onClick={handleHalveAmount}
              className="w-1/3 mx-1"
              disabled={points < 100} // Disable if balance < 100
            >
              1/2
            </Button>
            <Button
              bg="#1AC9FF"
              textColor="white"
              borderColor="black"
              shadow="#2D83EC"
              onClick={handleDoubleAmount}
              className="w-1/3 mx-1"
              disabled={points < 100} // Disable if balance < 100
            >
              x2
            </Button>
            <Button
              bg="#1AC9FF"
              textColor="white"
              borderColor="black"
              shadow="#2D83EC"
              onClick={handleMaxAmount}
              className="w-1/3 mx-1"
              disabled={points < 100} // Disable if balance < 100
            >
              MAX
            </Button>
          </div>

          <label className="text-xl mt-2 mb-2">Balance: {points}</label>
        </div>

        {/* Choice Buttons */}
        <div className="w-full flex flex-col items-center mb-4">
          <label className="text-xl mb-2">I choose</label>
          <div className="flex justify-center w-full">
            <Button
              bg={choice === 'Heads' ? '#1AC9FF' : '#2D83EC'}
              textColor="white"
              borderColor="black"
              shadow="#2D83EC"
              onClick={() => handleChoice('Heads')}
            >
              HEADS
            </Button>
            <Button
              bg={choice === 'Tails' ? '#1AC9FF' : '#2D83EC'}
              textColor="white"
              borderColor="black"
              shadow="#2D83EC"
              onClick={() => handleChoice('Tails')}
            >
              TAILS
            </Button>
          </div>
        </div>

        {/* Flip Button */}
        <Button
          bg="#1AC9FF"
          textColor="white"
          borderColor="black"
          shadow="#2D83EC"
          onClick={flipCoin}
          disabled={isButtonDisabled}
          className="py-2 px-6 mt-4"
        >
          DOUBLE OR NOTHING
        </Button>

        {/* Recent Plays */}
        <h3 className="text-xl mb-4 recent-plays">Recent Plays</h3>
        <RecentPlays />
      </Card>

      {/* Help Popup */}
      <Popup
        isOpen={isPopupOpen}
        onClose={closePopup}
        bg="#fefcd0"
        baseBg="#c381b5"
        textColor="black"
        borderColor="black"
        className="responsive-popup"
      >
        <div className="popup-content">
          <div className="popup-title">
            Welcome to <strong>TONFLIP!</strong>
          </div>
          The interactive CoinFlip game on Telegram where you can play with Points.
          <br />
          <br />

          <div className="popup-section-title">How to Play:</div>
          Take a bet by choosing Heads or Tails and the amount.
          <br />
          The coin will be flipped, and the result will be revealed.
          <br />
          <br />

          If you win, you'll earn <strong>DOUBLE</strong> the amount you bet.
          <br />
          If you lose, you'll lose the amount you bet.
          <br />
          <br />

          <div className="popup-section-title">Points:</div>
          Points are the currency used in this game.
          <br />
          You can earn points by winning games or doing easy tasks.
          <br />
          <br />

          <strong>Enjoy the Game!</strong>
        </div>
      </Popup>

      {/* Navigation Bar */}
      <Navbar />
    </div>
  );
};

export default CoinFlip;
