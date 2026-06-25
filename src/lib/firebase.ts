// Single Firebase initialization for the admin web app.
// Shares the SAME project as inventory-native and inventory-backend
// (project: smartstock-6fb23) - one backend, one source of truth.
// Do NOT call initializeApp anywhere else.

import { type FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import { type Auth, getAuth } from "firebase/auth";
import { type Firestore, getFirestore } from "firebase/firestore";

const firebaseConfig = {
	apiKey: "AIzaSyCuDx2u6ismS9sDuXHCG8RVtYQUyxtVMdU",
	authDomain: "smartstock-6fb23.firebaseapp.com",
	projectId: "smartstock-6fb23",
	storageBucket: "smartstock-6fb23.firebasestorage.app",
	messagingSenderId: "34425306401",
	appId: "1:34425306401:web:0aaff54be62a28af251260",
	measurementId: "G-GC1R46FWWD",
};

export const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
