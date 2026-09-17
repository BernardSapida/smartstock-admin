// Firebase Auth + Firestore user-doc helpers for the admin web.
// Role is read from the `users` doc - NEVER derived from the email string.

import {
	createUserWithEmailAndPassword,
	signOut as fbSignOut,
	sendEmailVerification,
	signInWithEmailAndPassword,
	updateProfile,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { createNotification } from "@/features/notifications/notifications";
import { auth, db } from "@/lib/firebase";
import { type AppUser, DEFAULT_PERMISSIONS, type UserRole } from "@/types/user";

function toAppUser(uid: string, data: Record<string, unknown>): AppUser {
	return {
		uid,
		email: (data.email as string) ?? "",
		fullName: (data.fullName as string) ?? "",
		role: ((data.role as string)?.toLowerCase() === "admin" ? "admin" : "staff") as UserRole,
		// Docs created before this field existed are treated as already-approved
		// (see scripts/backfill_user_status.py, which sets this explicitly).
		status: ((data.status as string) ?? "active") as AppUser["status"],
		phoneNumber: (data.phoneNumber as string) ?? "",
		unitPreference: (data.unitPreference as string) ?? "",
		isActive: (data.isActive as boolean) ?? true,
		shiftOn: (data.shiftOn as boolean) ?? false,
		isArchived: (data.isArchived as boolean) ?? false,
		mustChangePassword: (data.mustChangePassword as boolean) ?? false,
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
 *
 * Rejects (and signs back out) if no profile exists or the role isn't valid
 * for this portal. A pending/rejected/deactivated account is NOT rejected
 * here - it's allowed to sign in so the router can send it to /account-status
 * with a proper explanation instead of a generic toast, matching the mobile
 * app's flow. Callers must check `profile.status`/`isActive` before treating
 * a successful signIn() as "let them into the dashboard".
 */
export async function signIn(email: string, password: string): Promise<AppUser> {
	const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
	const profile = await getUserDoc(cred.user.uid);

	if (!profile) {
		await fbSignOut(auth);
		throw new Error("No user profile found for this account.");
	}
	if (profile.role !== "admin") {
		await fbSignOut(auth);
		throw new Error("This portal is for administrators only. Staff should use the mobile app.");
	}

	// Best-effort lastActive stamp - only meaningful once the account is
	// actually approved and active.
	if (profile.status === "active" && profile.isActive && !profile.isArchived) {
		updateDoc(doc(db, "users", cred.user.uid), { lastActive: serverTimestamp() }).catch(() => {});
	}

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
 * Firestore `users` profile as `status: 'pending'`, and leaves the new user
 * signed in (so they land on /account-status rather than needing to log in
 * again). An existing admin must approve the account from Settings > Users
 * before it can access the dashboard - see signIn().
 *
 * The new account is created as `admin` because this portal is admin-only
 * and login rejects non-admin roles; approval is what stops that from being
 * a free pass. Only use this on the public sign-up flow - an already-signed-in
 * admin creating OTHER users must go through the backend Admin SDK
 * (client-side creation re-authenticates as the new user).
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
		status: "pending" as const,
		phoneNumber,
		unitPreference: "",
		isActive: true,
		shiftOn: false,
		isArchived: false,
		mustChangePassword: false,
		permissions: DEFAULT_PERMISSIONS[role],
		photoUrl: "",
		createdAt: serverTimestamp(),
	};

	await setDoc(doc(db, "users", cred.user.uid), profileData);

	if (cleanName) {
		await updateProfile(cred.user, { displayName: cleanName }).catch(() => {});
	}
	await sendEmailVerification(cred.user).catch(() => {});

	void createNotification({
		title: "New signup pending approval",
		message: `${cleanName || cleanEmail} registered and is waiting for approval.`,
		targetRole: "admin",
		type: "signup_pending",
		itemId: cred.user.uid,
	}).catch(() => {
		/* best-effort: a failed notification must never block sign-up */
	});

	return toAppUser(cred.user.uid, profileData);
}

export async function signOutUser(): Promise<void> {
	await fbSignOut(auth);
}
