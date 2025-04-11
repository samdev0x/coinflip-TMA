export interface UserProfile {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  language_code: string;
  points: number;
  created_at: Date;
  referralCode: string;
  referrals: number;
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  totalVolume: number;
  photo_url: string;
  referred_by?: string;
  completedTasks?: {[key: string]: number};
  dailyPurchases?: number;
  lastBetTimestamp?: number;
  walletAddress?: string;
  lastWalletConnectionTime?: Date;
  lastPurchaseTime?: Date;
}

export interface Task {
  id: string;
  name: string;
  type: 'buy_points' | 'daily_login' | 'daily_bet' | 'daily_story' | 'social_media';
  category: 'daily' | 'social' | 'finished';
  link?: string;
  points: number;
  completed: boolean;
  inProgress: boolean;
  lastClaimed?: number;
  purchaseCount?: number;
  hasBetToday?: boolean;
}
