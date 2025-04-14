# 🎲 Coinflip – Telegram Mini App (TMA)

**A fully functional Telegram-based coinflip game** built with React, Firebase, and TON wallet integration.  
Users can log in with Telegram, place bets using virtual points, and earn rewards through referrals and optional blockchain interactions.

---

## ⚙️ Core Features

- 🔁 **Coinflip Game Logic**  
  Win or lose points based on simple 50/50 chance. Instant feedback and balance updates.

- 👥 **Telegram Login**  
  Users authenticate seamlessly using Telegram's `initData`, no signup required.

- 🎁 **Referral Rewards**  
  Invite friends to play and earn bonus points when they place bets.

- 💸 **TON Wallet Integration**  
  Users can top up their point balance by paying **0.15 TON** via wallet connection (limit: 2x per day).  
  Users can connect their wallets.

- 🧠 **Firebase**  
  Handles all user data: profiles, balances, transaction history, referrals, and daily limits.

---

## 🧱 Tech Stack

- **Frontend:** React, Telegram Mini App SDK, Tailwind  
- **Backend:** Firebase Firestore, Firebase Auth  
- **Blockchain:** TON Connect (Web3 Wallet), Smart Contract Payments (optional)

---

## 🚀 How It Works

1. User launches the app via Telegram (WebApp button)
2. Telegram user ID is verified and stored in Firebase
3. Coinflip bets cost 100 points; users start with 200 points balance
4. Points can be earned via:
   - Referral bonuses
   - Daily tasks (including 0.15 TON top-up)
5. All balances and outcomes are synced in real time

---

## 🧪 Known Limitations

- Social media task rewards are granted after a simple interaction (e.g. opening a link) without on-chain or platform-based verification
  → Verifying real user engagement (like actually following or retweeting) is out of scope for this project

- App currently runs without a backend server; all logic is Firebase + frontend based

---

## 📜 License

This project is provided for **educational and demonstration purposes only**.  
It is not designed or recommended for real gambling or token-based profit mechanisms.

---

## 🙌 Credits

Inspired by the intersection of Web3, gaming mechanics, and lightweight onboarding via Telegram.
