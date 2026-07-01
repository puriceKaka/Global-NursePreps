import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyARmrkQ7eK3AUHzibLudbZRcZKmQmcfBgI",
  authDomain: "clinic-hub-42171.firebaseapp.com",
  projectId: "clinic-hub-42171",
  storageBucket: "clinic-hub-42171.firebasestorage.app",
  messagingSenderId: "746484881283",
  appId: "1:746484881283:web:9f3a299a4f2729ae6408b6",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
