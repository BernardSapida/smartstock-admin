// Single Firebase initialization for the admin web app.
// Shares the SAME project as inventory-native and inventory-backend
// (project: smartstock-6fb23) - one backend, one source of truth.
// Do NOT call initializeApp anywhere else.

import { type FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import {
	type Auth,
	browserLocalPersistence,
	getAuth,
	indexedDBLocalPersistence,
	initializeAuth,
} from "firebase/auth";
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

// Pin auth persistence to local storage (IndexedDB, falling back to localStorage)
// so a signed-in session survives a full page reload / hard refresh. Without this
// the app relied on Firebase's default resolution, and a hard refresh could land
// on an unauthenticated state and bounce to sign-in. initializeAuth lets us set
// the persistence order explicitly; getAuth() is the fallback for when auth was
// already initialized (e.g. Vite HMR re-executes this module).
function createAuth(): Auth {
	try {
		return initializeAuth(app, {
			persistence: [indexedDBLocalPersistence, browserLocalPersistence],
		});
	} catch {
		return getAuth(app);
	}
}

export const auth: Auth = createAuth();
export const db: Firestore = getFirestore(app);
