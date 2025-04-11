// EarnPoints.tsx

import React, { useState, useEffect, useContext } from 'react';
import { Button, Card, Popup } from 'pixel-retroui';
import Navbar from './Navbar';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { doc, getDoc, updateDoc, increment, writeBatch } from 'firebase/firestore';
import { db } from './firebaseConfig';
import '../styles/earn-points.css';
import { useTonConnectUI } from '@tonconnect/ui-react';
import { Task, UserProfile } from '../types';
import axios from 'axios';
import CustomTonConnectButton from './CustomTonConnectButton';
import { Address } from 'ton-core';
import { TelegramContext } from './TelegramContext';

const RECIPIENT_ADDRESS = 'UQB1tZNtifeLxqQmWUfI9AHVtjvrt3x85Jv6XmkvMiDIt0mS';

const EarnPoints: React.FC = () => {
  const {
    user,
    points,
    setPoints,
  } = useContext(TelegramContext)!;

  const [isPopupOpen, setIsPopupOpen] = useState<boolean>(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tonConnectUI] = useTonConnectUI();
  const [buyPointsState, setBuyPointsState] = useState({
    purchaseCount: 0,
    firstPurchaseTime: 0,
    isProcessing: false,
    transactionTime: 0,
    pendingPurchases: 0,
  });
  const [countdown, setCountdown] = useState<number | null>(null);
  const [canVerify, setCanVerify] = useState<boolean>(false);
  
  // **State for Social Media Tasks**
  const [socialTasksState, setSocialTasksState] = useState<{
    [taskId: string]: {
      countdown: number | null;
      canClaim: boolean;
      isProcessing: boolean;
    };
  }>({});

  const openPopup = () => setIsPopupOpen(true);
  const closePopup = () => setIsPopupOpen(false);

  const fetchTasks = async () => {
    if (!user) return;

    const userRef = doc(db, 'profiles', user.id);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data() as UserProfile;
      const now = Date.now();
      const lastPurchaseTime = userData.lastPurchaseTime ? Number(userData.lastPurchaseTime) : 0;

      // Calculate time difference since last purchase
      const timeSinceLastPurchase = now - lastPurchaseTime;
      const isNewDay = timeSinceLastPurchase >= 24 * 60 * 60 * 1000;

      // Reset dailyPurchases if it's a new day
      let dailyPurchases = userData.dailyPurchases ?? 0;
      if (isNewDay) {
        dailyPurchases = 0;

        // Update Firestore with reset dailyPurchases
        const batch = writeBatch(db);
        batch.update(userRef, {
          dailyPurchases: 0,
        });
        await batch.commit();
      }

      const taskList: Task[] = [
        {
          id: 'buy_points',
          name: 'Buy Points',
          type: 'buy_points',
          category: 'daily',
          points: 500,
          completed: dailyPurchases >= 2,
          inProgress: false,
          purchaseCount: dailyPurchases,
        },
        {
          id: 'daily_login',
          name: 'Daily Login',
          type: 'daily_login',
          category: 'daily',
          points: 100,
          completed: false,
          inProgress: false,
        },
        {
          id: 'daily_bet',
          name: 'Place a Bet',
          type: 'daily_bet',
          category: 'daily',
          points: 150,
          completed: false,
          inProgress: false,
          hasBetToday: userData.lastBetTimestamp
            ? now - userData.lastBetTimestamp < 24 * 60 * 60 * 1000
            : false,
        },
        // **Social Media Tasks**
        {
          id: 'follow_x',
          name: 'Follow on X',
          type: 'social_media',
          category: 'social',
          link: 'https://x.com/TONorTAILS',
          points: 200,
          completed: false,
          inProgress: false,
        },
        {
          id: 'retweet',
          name: 'Retweet this Tweet',
          type: 'social_media',
          category: 'social',
          link: 'https://x.com/TONorTAILS/',
          points: 100,
          completed: false,
          inProgress: false,
        },
        {
          id: 'join_telegram',
          name: 'Join Telegram Group',
          type: 'social_media',
          category: 'social',
          link: 'https://t.me/TONorTAILS',
          points: 200,
          completed: false,
          inProgress: false,
        },
        {
          id: 'follow_tiktok',
          name: 'Follow on TikTok',
          type: 'social_media',
          category: 'social',
          link: 'https://www.tiktok.com/@TONorTAILS',
          points: 200,
          completed: false,
          inProgress: false,
        },
        {
          id: 'watch_tiktok',
          name: 'Watch TikTok Video',
          type: 'social_media',
          category: 'social',
          link: 'https://www.tiktok.com/@TONorTAILS/video/1234567890',
          points: 100,
          completed: false,
          inProgress: false,
        },
      ];

      // Check completed tasks based on lastClaimedTime
      taskList.forEach((task) => {
        const lastClaimedTime = userData.completedTasks?.[task.id];
        if (lastClaimedTime) {
          const timeSinceClaim = now - lastClaimedTime;
          if (timeSinceClaim < 24 * 60 * 60 * 1000) {
            task.completed = true;
          } else {
            task.completed = false;
          }
        }
      });

      setTasks(taskList);
      setBuyPointsState((prev) => ({
        ...prev,
        purchaseCount: dailyPurchases,
        firstPurchaseTime: lastPurchaseTime,
      }));

      // **Initialize Social Tasks State**
      const initialSocialTasksState: { [key: string]: { countdown: number | null; canClaim: boolean; isProcessing: boolean; } } = {};

      taskList.forEach(task => {
        if (task.category === 'social') {
          initialSocialTasksState[task.id] = {
            countdown: null,
            canClaim: false,
            isProcessing: false,
          };
        }
      });

      setSocialTasksState(initialSocialTasksState);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [user]);

  const handleBuyPoints = async () => {
    if (!tonConnectUI.connected || !tonConnectUI.account) {
      toast('Please Connect Wallet', { className: 'pixel-toast-error' });
      return;
    }

    const now = Date.now();
    const timeSinceFirstPurchase = now - buyPointsState.firstPurchaseTime;
    const isNewDay = timeSinceFirstPurchase >= 24 * 60 * 60 * 1000;

    let purchaseCount = buyPointsState.purchaseCount;
    if (isNewDay) {
      purchaseCount = 0;
    }

    const totalAttempts = purchaseCount + buyPointsState.pendingPurchases;
    if (totalAttempts >= 2) {
      toast('Daily purchase limit reached', { className: 'pixel-toast-error' });
      return;
    }

    setBuyPointsState((prev) => ({
      ...prev,
      isProcessing: true,
      pendingPurchases: prev.pendingPurchases + 1,
    }));

    try {
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 60 * 20,
        messages: [
          {
            address: RECIPIENT_ADDRESS,
            amount: '150000000',
          },
        ],
      };

      const transactionTime = Date.now();
      await tonConnectUI.sendTransaction(transaction);
      setBuyPointsState((prev) => ({
        ...prev,
        transactionTime,
        isProcessing: false,
      }));
      startCountdown(15);
    } catch (error) {
      console.error('Transaction error:', error);
      toast('Transaction failed', { className: 'pixel-toast-error' });
      setBuyPointsState((prev) => ({
        ...prev,
        isProcessing: false,
        pendingPurchases: Math.max(0, prev.pendingPurchases - 1),
      }));
    }
  };

  const startCountdown = (seconds: number) => {
    setCountdown(seconds);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev && prev > 1) {
          return prev - 1;
        } else {
          clearInterval(interval);
          setCountdown(null);
          setCanVerify(true);
          return null;
        }
      });
    }, 1000);
  };

  const handleVerify = async (task: Task) => {
    setBuyPointsState((prev) => ({ ...prev, isProcessing: true }));
    setCanVerify(false);

    if (!tonConnectUI.account) {
      toast('Wallet not connected', { className: 'pixel-toast-error' });
      setBuyPointsState((prev) => ({ ...prev, isProcessing: false }));
      return;
    }

    try {
      const isVerified = await verifyTransaction(
        tonConnectUI.account.address,
        '150000000',
        RECIPIENT_ADDRESS,
        buyPointsState.transactionTime
      );

      if (isVerified) {
        const now = Date.now();
        const userRef = doc(db, 'profiles', user!.id);
        let purchaseCount = buyPointsState.purchaseCount + 1;
        await updateDoc(userRef, {
          dailyPurchases: purchaseCount,
          lastPurchaseTime: now,
          points: increment(task.points),
        });

        setBuyPointsState((prev) => ({
          ...prev,
          purchaseCount,
          firstPurchaseTime: now,
          isProcessing: false,
          pendingPurchases: Math.max(0, prev.pendingPurchases - 1),
        }));

        await fetchTasks();
        setPoints(points + task.points);

        toast(`🎉 You earned ${task.points} points!`, { className: 'pixel-toast-success' });
      } else {
        toast('Transaction verification failed. Please try again.', {
          className: 'pixel-toast-error',
        });
        setBuyPointsState((prev) => ({
          ...prev,
          isProcessing: false,
          pendingPurchases: Math.max(0, prev.pendingPurchases - 1),
        }));
        setCanVerify(true);
      }
    } catch (error) {
      console.error('Error verifying transaction:', error);
      toast('Error verifying transaction.', { className: 'pixel-toast-error' });
      setBuyPointsState((prev) => ({
        ...prev,
        isProcessing: false,
        pendingPurchases: Math.max(0, prev.pendingPurchases - 1),
      }));
      setCanVerify(true);
    }
  };

  const verifyTransaction = async (
    walletAddress: string,
    amount: string,
    recipientAddress: string,
    transactionTime: number
  ) => {
    const apiKey = import.meta.env.VITE_TONCENTER_API_KEY;
    const tonCenterUrl = 'https://toncenter.com/api/v2';

    try {
      console.log('Fetching transactions from toncenter:', {
        walletAddress,
      });

      const response = await axios.get(`${tonCenterUrl}/getTransactions`, {
        params: {
          address: walletAddress,
          limit: 3,
          api_key: apiKey,
        },
      });

      const transactions = response.data.result;

      console.log('Transactions:', transactions);

      const amountNumber = Number(amount);
      const recipientAddr = Address.parse(recipientAddress);

      const amountTolerance = 1000000; // Allow minor discrepancies

      // Find the transaction with the matching amount and recipient
      const matchingTx = transactions.find((tx: any) => {
        // Check if transaction timestamp is after the transactionTime
        const txTime = Number(tx.utime) * 1000; // Convert to milliseconds
        if (txTime < transactionTime) {
          return false;
        }

        return tx.out_msgs.some((msg: any) => {
          const msgAmount = Number(msg.value);
          const msgDestination = msg.destination ? Address.parse(msg.destination) : null;

          console.log('Message:', {
            msgAmount,
            msgDestination: msgDestination?.toString(),
          });

          return (
            msgDestination &&
            msgDestination.equals(recipientAddr) &&
            Math.abs(msgAmount - amountNumber) <= amountTolerance
          );
        });
      });

      console.log('Matching Transaction:', matchingTx);

      return !!matchingTx;
    } catch (error) {
      console.error('Error verifying transaction:', error);
      return false;
    }
  };

  // **Handle Social Media Task Action**
  const handleSocialMediaTaskAction = (task: Task) => {
    const taskState = socialTasksState[task.id] ?? { countdown: null, canClaim: false, isProcessing: false };

    if (taskState.canClaim) {
      // Proceed to Claim
      handleSocialClaim(task);
    } else if (taskState.countdown === null && !taskState.isProcessing) {
      // Proceed to Go
      handleGo(task);
    }
  };

  // **Handle 'Go' for Social Media Tasks**
  const handleGo = (task: Task) => {
    // Open the link in a new tab without closing the app
    window.open(task.link, '_blank');

    // Start the countdown
    setSocialTasksState((prev) => ({
      ...prev,
      [task.id]: {
        countdown: 15,
        canClaim: false,
        isProcessing: false,
      },
    }));

    // Start a 15-second countdown
    const interval = setInterval(() => {
      setSocialTasksState((prev) => {
        const currentCountdown = prev[task.id]?.countdown;
        if (currentCountdown && currentCountdown > 1) {
          return {
            ...prev,
            [task.id]: {
              ...prev[task.id],
              countdown: currentCountdown - 1,
            },
          };
        } else if (currentCountdown === 1) {
          clearInterval(interval);
          return {
            ...prev,
            [task.id]: {
              countdown: null,
              canClaim: true,
              isProcessing: false,
            },
          };
        } else {
          return prev;
        }
      });
    }, 1000);
  };

  // **Handle 'Claim' for Social Media Tasks**
  const handleSocialClaim = async (task: Task) => {
    setSocialTasksState((prev) => ({
      ...prev,
      [task.id]: {
        ...prev[task.id],
        isProcessing: true,
      },
    }));

    try {
      // **No Verification Needed**
      // Directly reward the user as verification is not implemented

      await claimTask(task);
    } catch (error) {
      console.error('Error claiming social task:', error);
      toast('Error claiming task.', { className: 'pixel-toast-error' });
      setSocialTasksState((prev) => ({
        ...prev,
        [task.id]: {
          ...prev[task.id],
          isProcessing: false,
          canClaim: false, // Allow retry
        },
      }));
    }
  };

  // **Handle Claiming a Task**
  const claimTask = async (task: Task) => {
    if (!user) return;

    const userRef = doc(db, 'profiles', user.id);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      await updateDoc(userRef, {
        [`completedTasks.${task.id}`]: Date.now(),
        points: increment(task.points),
      });

      setTasks((prevTasks) =>
        prevTasks.map((t) =>
          t.id === task.id ? { ...t, completed: true, lastClaimed: Date.now() } : t
        )
      );

      setPoints(points + task.points);

      toast(`🎉 You earned ${task.points} points!`, {
        className: 'pixel-toast-success',
      });

      // **Reset socialTasksState for the task to prevent multiple claims**
      setSocialTasksState((prev) => ({
        ...prev,
        [task.id]: {
          countdown: null,
          canClaim: false,
          isProcessing: false,
        },
      }));
    }
  };

  // **Handle Daily Login Task**
  const handleDailyLogin = async (task: Task) => {
    if (user) {
      await claimTask(task);
    }
  };

  // **Handle Daily Bet Task**
  const handleDailyBet = async (task: Task) => {
    if (!task.hasBetToday) {
      window.location.href = '/';
    } else {
      await claimTask(task);
    }
  };

  // **Handle Task Action (Generic)**
  const handleTaskAction = async (task: Task) => {
    if (task.completed) return;

    switch (task.type) {
      case 'buy_points':
        if (buyPointsState.isProcessing || countdown !== null) {
          // Do nothing
        } else if (canVerify) {
          await handleVerify(task);
        } else {
          await handleBuyPoints();
        }
        break;
      case 'daily_login':
        await handleDailyLogin(task);
        break;
      case 'daily_bet':
        await handleDailyBet(task);
        break;
      case 'social_media':
        await handleSocialMediaTaskAction(task);
        break;
      default:
        break;
    }
  };

  const renderTaskSection = (category: 'daily' | 'social') => {
    const categoryTasks = tasks.filter((task) => task.category === category);
    return (
      <div>
        <h4 className="task-section">
          {category.charAt(0).toUpperCase() + category.slice(1)} Tasks
        </h4>
        {categoryTasks.map((task) => {
          // Define taskState with default values
          const taskState = socialTasksState[task.id] ?? { countdown: null, canClaim: false, isProcessing: false };

          // **Check if Task is Completed**
          if (task.completed) {
            return (
              <div key={task.id} className="task-item">
                <div className="task-main">
                  <div className="task-info">
                    <span className="task-name">{task.name}</span>
                    {task.type === 'buy_points' && (
                      <span className="task-points">({task.purchaseCount}/2 today)</span>
                    )}
                    <span className="task-points">+{task.points} points</span>
                  </div>
                  <span className="completed-task">✔️</span>
                </div>
              </div>
            );
          }

          return (
            <div key={task.id} className="task-item">
              <div className="task-main">
                <div className="task-info">
                  <span className="task-name">{task.name}</span>
                  {task.type === 'buy_points' && (
                    <span className="task-points">({task.purchaseCount}/2 today)</span>
                  )}
                  <span className="task-points">+{task.points} points</span>
                </div>
                {category === 'social' ? (
                  // **Buttons for Social Media Tasks**
                  <Button
                    bg="#1AC9FF"
                    textColor="white"
                    borderColor="black"
                    shadow="#2D83EC"
                    onClick={() => handleSocialMediaTaskAction(task)}
                    disabled={
                      taskState.isProcessing ||
                      (taskState.countdown !== null && taskState.countdown > 0)
                    }
                    className="task-button"
                  >
                    {taskState.isProcessing ? (
                      'Processing...'
                    ) : taskState.countdown !== null ? (
                      `Wait ${taskState.countdown}s`
                    ) : taskState.canClaim ? (
                      'Claim'
                    ) : (
                      'Go'
                    )}
                  </Button>
                ) : (
                  // **Buttons for Non-Social Tasks**
                  ((task.type === 'buy_points' &&
                    (task.purchaseCount ?? 0) < 2) ||
                    (!task.completed && task.type !== 'buy_points')) && (
                    <Button
                      bg="#1AC9FF"
                      textColor="white"
                      borderColor="black"
                      shadow="#2D83EC"
                      onClick={() => handleTaskAction(task)}
                      disabled={
                        task.inProgress ||
                        (task.type === 'buy_points' &&
                          (buyPointsState.isProcessing || countdown !== null))
                      }
                      className="task-button"
                    >
                      {task.type === 'buy_points' ? (
                        buyPointsState.isProcessing ? (
                          'Processing...'
                        ) : countdown !== null ? (
                          `Wait ${countdown}s`
                        ) : canVerify ? (
                          'Verify'
                        ) : (
                          'Buy'
                        )
                      ) : task.type === 'daily_bet' ? (
                        task.hasBetToday ? 'Claim' : 'Go'
                      ) : (
                        'Claim'
                      )}
                    </Button>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
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
      <Card
        bg="#fefcd0"
        shadowColor="#c381b5"
        className="m-5 p-4 items-center flex flex-col"
      >
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
        <div className="tasks-list w-full my-4">
          {renderTaskSection('daily')}
          {renderTaskSection('social')}
        </div>
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
          <div className="popup-title">Points Page</div>
          Earn points by completing simple tasks and increase your balance.
          <br />
          <br />
          <div className="popup-section-title">Tasks:</div>
          Engage in various tasks such as following on social media, joining groups, or inviting
          friends to earn points.
          <br />
          <br />
          <div className="popup-section-title">Boost Your Balance:</div>
          The more tasks you complete, the more points you earn, giving you an edge in the game!
          <br />
          <br />
          <strong>Complete tasks and grow your balance today!</strong>
        </div>
      </Popup>

      <Navbar />
    </div>
  );
};

export default EarnPoints;
