// Firebase Auth + Firestore user-doc helpers for the admin web.
// Role is read from the `users` doc - NEVER derived from the email string.

import {
	createUserWithEmailAndPassword,
	signOut as fbSignOut,
	signInWithEmailAndPassword,
	updateProfile,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { type AppUser, DEFAULT_PERMISSIONS, type UserRole } from "@/types/user";

function toAppUser(uid: string, data: Record<string, unknown>): AppUser {
	return {
		uid,
		email: (data.email as string) ?? "",
		fullName: (data.fullName as string) ?? "",
		role: ((data.role as string)?.toLowerCase() === "admin" ? "admin" : "staff") as UserRole,
		phoneNumber: (data.phoneNumber as string) ?? "",
		unitPreference: (data.unitPreference as string) ?? "",
		isActive: (data.isActive as boolean) ?? true,
		shiftOn: (data.shiftOn as boolean) ?? false,
		isArchived: (data.isArchived as boolean) ?? false,
		permissions: (data.permissions as Record<string, boolean>) ?? {},
		photoUrl: (data.photoUrl as string) ?? "",
	};
}

/** Fetch the Firestore user profile for a uid (null if missing). */
export async function getUserDoc(uid: string): Promise<AppUser | null> {
	const snap = await getDoc(doc(db, "users", uid));
	if (!snap.exists()) return null;
	return toAppUser(uid, snap.data() as Record<string, unknown>);
}

/**
 * Sign in with email + password, then load the user profile.
 * Rejects (and signs back out) if no profile exists or the account is inactive/archived.
 */
export async function signIn(email: string, password: string): Promise<AppUser> {
	const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
	const profile = await getUserDoc(cred.user.uid);

	if (!profile) {
		await fbSignOut(auth);
		throw new Error("No user profile found for this account.");
	}
	if (profile.isArchived || !profile.isActive) {
		await fbSignOut(auth);
		throw new Error("This account is inactive. Contact an administrator.");
	}
	if (profile.role !== "admin") {
		await fbSignOut(auth);
		throw new Error("This portal is for administrators only. Staff should use the mobile app.");
	}

	// Best-effort lastActive stamp.
	updateDoc(doc(db, "users", cred.user.uid), { lastActive: serverTimestamp() }).catch(() => {});

	return profile;
}

export interface SignUpInput {
	email: string;
	password: string;
	fullName: string;
	phoneNumber: string;
}

/**
 * Self-service registration: creates the Firebase Auth user, writes the
 * Firestore `users` profile, and leaves the new user signed in.
 *
 * The new account is created as `admin` because this portal is admin-only
 * and login rejects non-admin roles. Only use this on the public sign-up
 * flow - an already-signed-in admin creating OTHER users must go through the
 * backend Admin SDK (client-side creation re-authenticates as the new user).
 */
export async function signUp({ email, password, fullName, phoneNumber }: SignUpInput): Promise<AppUser> {
	const cleanEmail = email.trim();
	const cleanName = fullName.trim();
	const role: UserRole = "admin";

	const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);

	const profileData = {
		email: cleanEmail,
		fullName: cleanName,
		role,
		phoneNumber,
		unitPreference: "",
		isActive: true,
		shiftOn: false,
		isArchived: false,
		permissions: DEFAULT_PERMISSIONS[role],
		photoUrl: "",
		createdAt: serverTimestamp(),
	};

	await setDoc(doc(db, "users", cred.user.uid), profileData);

	if (cleanName) {
		await updateProfile(cred.user, { displayName: cleanName }).catch(() => {});
	}

	return toAppUser(cred.user.uid, profileData);
}

export async function signOutUser(): Promise<void> {
	await fbSignOut(auth);
}
