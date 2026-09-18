import { Button } from "@heroui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { KeyRound } from "lucide-react";
import { useForm } from "react-hook-form";
import { notify } from "@/components/feedback";
import { AppInputGroup } from "@/components/form/AppInputGroup";
import { getDefaultRoute } from "@/config/navigation.config";
import { seo } from "@/config/seo.config";
import { logClientError } from "@/errors/logger";
import AuthCard from "@/features/auth/components/AuthCard";
import { useAuth } from "@/features/auth/context/AuthProvider";
import { useLogout } from "@/features/auth/hooks/use-firebase-auth";
import { authErrorMessage } from "@/features/auth/utils/auth-error-message";
import {
	type ChangePasswordInput,
	ChangePasswordSchema,
} from "@/features/auth/validations/schema/change-password.schema";
import { changePassword } from "@/features/profile/password";
import { clearMustChangePassword } from "@/features/users/users";

export const Route = createFileRoute("/change-password")({
	head: () => ({
		meta: [{ title: seo.title("Change Password") }, { name: "robots", content: "noindex" }],
	}),
	component: ChangePasswordPage,
});

function ChangePasswordPage() {
	const { profile, setProfile } = useAuth();
	const navigate = useNavigate();
	const onLogout = useLogout();

	const { control, handleSubmit, formState } = useForm<ChangePasswordInput>({
		resolver: zodResolver(ChangePasswordSchema),
		mode: "onBlur",
		reValidateMode: "onChange",
		defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
	});

	const onSubmit = handleSubmit(async (data) => {
		if (!profile) return;
		try {
			await changePassword(data.currentPassword, data.newPassword);
			await clearMustChangePassword(profile.uid);
			setProfile({ ...profile, mustChangePassword: false });
			notify.success({
				title: "Password updated",
				description: "Your password has been changed. Welcome in!",
			});
			navigate({ to: getDefaultRoute(profile.role) });
		} catch (error) {
			logClientError(error, "CHANGE_PASSWORD");
			const code = (error as { code?: string })?.code ?? "";
			notify.danger({
				title: "Couldn't change password",
				description:
					code === "auth/invalid-credential" || code === "auth/wrong-password"
						? "Your current password is incorrect."
						: authErrorMessage(error),
			});
		}
	});

	return (
		<AuthCard
			subtitle="You're signing in with a temporary password. Set your own before continuing."
			title="Set a new password"
		>
			<form
				className="space-y-4"
				onSubmit={onSubmit}
			>
				<AppInputGroup
					control={control}
					isRequired
					label="Current (temporary) password"
					name="currentPassword"
					placeholder="Enter your temporary password"
					type="password"
				/>
				<AppInputGroup
					control={control}
					isRequired
					label="New password"
					name="newPassword"
					placeholder="Create a new password"
					type="password"
				/>
				<AppInputGroup
					control={control}
					isRequired
					label="Confirm new password"
					name="confirmPassword"
					placeholder="Repeat your new password"
					type="password"
				/>

				<Button
					className="w-full bg-app-brand text-app-base font-bold h-12 rounded-xl mt-4 transition-all hover:brightness-110 active:scale-[0.98]"
					isPending={formState.isSubmitting}
					type="submit"
				>
					<KeyRound
						className="mr-2"
						size={20}
					/>
					Set new password
				</Button>

				<button
					className="w-full text-center text-sm text-foreground/50 hover:text-foreground/80 transition-colors"
					onClick={onLogout}
					type="button"
				>
					Sign out instead
				</button>
			</form>
		</AuthCard>
	);
}
