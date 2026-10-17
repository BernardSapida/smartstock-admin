// Single Firebase initialization for the admin web app.
// Shares the SAME project as inventory-native and inventory-backend
// (project: pinnochiotagaytay-63d26) - one backend, one source of truth.
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
	apiKey: "AIzaSyBmVyf1FkEQbSHRSL2ZQ3Ydo-frrqq7ats",
	authDomain: "pinnochiotagaytay-63d26.firebaseapp.com",
	projectId: "pinnochiotagaytay-63d26",
	storageBucket: "pinnochiotagaytay-63d26.firebasestorage.app",
	messagingSenderId: "643486155467",
	appId: "1:643486155467:web:87cc23bb80e5a95b08914e",
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
