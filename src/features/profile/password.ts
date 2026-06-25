// Change the signed-in user's password via Firebase Auth (reauth + update).

import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
	const user = auth.currentUser;
	if (!user || !user.email) throw new Error("Not signed in.");
	const cred = EmailAuthProvider.credential(user.email, currentPassword);
	await reauthenticateWithCredential(user, cred);
	await updatePassword(user, newPassword);
}
