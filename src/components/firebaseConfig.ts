import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB2oKacDljwVnCs19YnGFhc9Zhx4KfTT50",
  authDomain: "tonflip-a5f96.firebaseapp.com",
  projectId: "tonflip-a5f96",
  storageBucket: "tonflip-a5f96.appspot.com",
  messagingSenderId: "4377866544",
  appId: "1:4377866544:web:f0026aba9d7f721a2318f5"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);