// Client-side auth context. Subscribes to Firebase auth state and loads the
// Firestore `users` profile (role + permissions). Single source for the app.

import { onAuthStateChanged } from "firebase/auth";
import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { auth } from "@/lib/firebase";
import type { AppUser } from "@/types/user";
import { getUserDoc, signOutUser } from "../firebase/auth.firebase";

interface AuthContextValue {
	profile: AppUser | null;
	uid: string | null;
	loading: boolean;
	isAuthenticated: boolean;
	setProfile: (p: AppUser | null) => void;
	logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [profile, setProfile] = useState<AppUser | null>(null);
	const [uid, setUid] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const unsub = onAuthStateChanged(auth, async (fbUser) => {
			if (!fbUser) {
				setUid(null);
				setProfile(null);
				setLoading(false);
				return;
			}
			setUid(fbUser.uid);
			try {
				setProfile(await getUserDoc(fbUser.uid));
			} catch {
				setProfile(null);
			} finally {
				setLoading(false);
			}
		});
		return unsub;
	}, []);

	const value = useMemo<AuthContextValue>(
		() => ({
			profile,
			uid,
			loading,
			isAuthenticated: !!uid && !!profile,
			setProfile,
			logout: async () => {
				await signOutUser();
				setUid(null);
				setProfile(null);
			},
		}),
		[profile, uid, loading],
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
	return ctx;
}
