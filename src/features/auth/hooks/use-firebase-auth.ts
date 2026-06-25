// Firebase-backed auth actions for the UI (login / logout).
// Replaces the template's REST/JWT mutations.

import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { notify } from "@/components/feedback";
import { getDefaultRoute } from "@/config/navigation.config";
import { logClientError } from "@/errors/logger";
import { logAction } from "@/lib/audit";
import { useAuth } from "../context/AuthProvider";
import { signIn, type SignUpInput, signUp } from "../firebase/auth.firebase";

/** Maps Firebase Auth error codes to friendly, user-facing messages. */
function authErrorMessage(error: unknown): string {
	const code = (error as { code?: string })?.code ?? "";
	switch (code) {
		case "auth/email-already-in-use":
			return "An account with this email already exists.";
		case "auth/invalid-email":
			return "Please enter a valid email address.";
		case "auth/weak-password":
			return "Password is too weak. Use at least 6 characters.";
		case "auth/operation-not-allowed":
			return "Email/password sign-up is disabled for this project.";
		default:
			return error instanceof Error ? error.message : "Something went wrong. Please try again.";
	}
}

export function useLogin() {
	const navigate = useNavigate();
	const { setProfile } = useAuth();
	const [isPending, setIsPending] = useState(false);

	const login = async (email: string, password: string) => {
		setIsPending(true);
		try {
			const profile = await signIn(email, password);
			setProfile(profile);
			void logAction({
				uid: profile.uid,
				user: profile.fullName || profile.email,
				role: profile.role,
				action: "LOGIN",
				module: "Auth",
				description: "Signed in to admin web",
			});
			notify.success({
				title: `Welcome back, ${profile.fullName || profile.email}!`,
				description: "You've successfully signed in to the admin console.",
			});
			navigate({ to: getDefaultRoute(profile.role) });
		} catch (error) {
			logClientError(error, "FIREBASE_LOGIN");
			notify.danger({
				title: "Login failed",
				description: error instanceof Error ? error.message : "Unable to sign in.",
			});
		} finally {
			setIsPending(false);
		}
	};

	return { login, isPending };
}

export function useRegister() {
	const navigate = useNavigate();
	const { setProfile } = useAuth();
	const [isPending, setIsPending] = useState(false);

	const register = async (input: SignUpInput) => {
		setIsPending(true);
		try {
			const profile = await signUp(input);
			setProfile(profile);
			void logAction({
				uid: profile.uid,
				user: profile.fullName || profile.email,
				role: profile.role,
				action: "LOGIN",
				module: "Auth",
				description: "Created admin account via sign-up",
			});
			notify.success({
				title: `Welcome, ${profile.fullName || profile.email}! 🎉`,
				description: "Your admin account has been created.",
			});
			navigate({ to: getDefaultRoute(profile.role) });
		} catch (error) {
			logClientError(error, "FIREBASE_REGISTER");
			notify.danger({
				title: "Registration failed",
				description: authErrorMessage(error),
			});
		} finally {
			setIsPending(false);
		}
	};

	return { register, isPending };
}

export function useLogout() {
	const navigate = useNavigate();
	const { profile, logout } = useAuth();

	return async () => {
		const snapshot = profile;
		try {
			if (snapshot) {
				void logAction({
					uid: snapshot.uid,
					user: snapshot.fullName || snapshot.email,
					role: snapshot.role,
					action: "LOGOUT",
					module: "Auth",
					description: "Signed out of admin web",
				});
			}
			await logout();
			notify.success({
				title: "You've been logged out",
				description: "You've been signed out of the admin console.",
			});
		} catch (error) {
			logClientError(error, "FIREBASE_LOGOUT");
		} finally {
			navigate({ to: "/sign-in" });
		}
	};
}
