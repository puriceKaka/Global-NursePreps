import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import {
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  getAuth,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyARmrkQ7eK3AUHzibLudbZRcZKmQmcfBgI",
  authDomain: "clinic-hub-42171.firebaseapp.com",
  projectId: "clinic-hub-42171",
  storageBucket: "clinic-hub-42171.firebasestorage.app",
  messagingSenderId: "746484881283",
  appId: "1:746484881283:web:9f3a299a4f2729ae6408b6",
  measurementId: "G-VWVTJ2VWRY"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export { collection, getDocs, limit, orderBy, query, where };

const roleByEmail = {
  "admin@cliniccare.com": "admin",
  "doctor@cliniccare.com": "doctor",
  "patient@cliniccare.com": "patient"
};

export async function useSessionPersistence() {
  await setPersistence(auth, browserSessionPersistence);
}

export function getRoleFromEmail(email) {
  return roleByEmail[String(email || "").toLowerCase()] || "patient";
}

export function getPortalRoute(role) {
  return {
    admin: "admin/dashboard.html",
    doctor: "doctor/dashboard.html",
    patient: "patient/dashboard.html"
  }[role] || "login.html";
}

export async function signIn(email, password) {
  await useSessionPersistence();
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signUp(email, password, profile) {
  await useSessionPersistence();
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const name = profile.name || "";
  const role = profile.role || "patient";

  await updateProfile(credential.user, { displayName: name });
  await setDoc(doc(db, "users", credential.user.uid), {
    uid: credential.user.uid,
    name,
    email: credential.user.email || email,
    role,
    route: getPortalRoute(role),
    phone: profile.phone || "",
    departmentId: profile.departmentId || "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }, { merge: true });

  return credential;
}

export async function signOutUser() {
  await signOut(auth);
}

export async function getUserProfile(uid) {
  if (!uid) return null;
  const snapshot = await getDoc(doc(db, "users", uid));
  return snapshot.exists() ? snapshot.data() : null;
}

export async function ensureUserProfile(user) {
  if (!user) return null;
  const existing = await getUserProfile(user.uid);
  if (existing) return existing;

  const role = getRoleFromEmail(user.email);
  const profile = {
    uid: user.uid,
    name: user.displayName || user.email?.split("@")[0] || "User",
    email: user.email || "",
    role,
    route: getPortalRoute(role),
    phone: "",
    departmentId: "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  await setDoc(doc(db, "users", user.uid), profile, { merge: true });
  return profile;
}
