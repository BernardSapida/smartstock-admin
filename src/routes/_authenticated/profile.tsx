import { Avatar, Input, Label, Separator, Surface, TextField } from "@heroui/react";
import { createFileRoute } from "@tanstack/react-router";
import { Mail, Shield, User } from "lucide-react";
import { seo } from "@/config/seo.config";
import { useUser } from "@/features/auth/hooks/use-auth-queries";

export const Route = createFileRoute("/_authenticated/profile")({
	head: () => ({
		meta: [{ title: seo.title("Profile") }, { name: "robots", content: "noindex" }],
	}),
	staticData: {
		breadcrumb: "Profile",
	},
	component: ProfilePage,
});

function ProfilePage() {
	const { data: user } = useUser();

	if (!user) return null;

	return (
		<div className="flex flex-col gap-8">
			<div>
				<h1 className="text-3xl font-bold text-foreground">Personal Profile</h1>
				<p className="text-foreground/60">Your account information and verification status.</p>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
				{/* Profile Info Sidebar */}
				<Surface className="p-6 h-fit rounded-[2rem] border border-app-brand/10 shadow-xl flex flex-col items-center text-center">
					<Avatar className="size-24 mb-4 ring-4 ring-app-brand/20 ring-offset-2">
						<Avatar.Image
							src={`https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=4fb8b2&color=fbfff8`}
						/>
						<Avatar.Fallback>
							{user.firstName?.charAt(0)}
							{user.lastName?.charAt(0)}
						</Avatar.Fallback>
					</Avatar>
					<h2 className="text-xl font-bold text-foreground capitalize">
						{user.firstName} {user.lastName}
					</h2>
					<div className="flex items-center gap-1 mt-1 px-3 py-1 bg-app-brand/10 text-app-brand rounded-full text-xs font-bold uppercase tracking-wider">
						<Shield size={12} />
						{user.userType}
					</div>
					<div className="mt-3 px-3 py-1 bg-amber-500/10 text-amber-600 rounded-full text-[10px] font-bold uppercase tracking-tight">
						{user.status?.replace("_", " ")}
					</div>
				</Surface>

				{/* Profile Settings Form */}
				<Surface className="md:col-span-2 p-8 rounded-[2rem] border border-app-brand/10 shadow-xl">
					<div className="flex justify-between items-center mb-6">
						<h3 className="text-lg font-bold text-foreground flex items-center gap-2">
							<User
								className="text-app-brand"
								size={18}
							/>
							About You
						</h3>
					</div>

					<Separator className="mb-8 bg-app-brand/10" />

					<div className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<TextField isReadOnly>
								<Label className="text-foreground/60 text-sm">First Name</Label>
								<Input
									className="bg-app-brand/5 border-none rounded-lg px-3 py-2 text-foreground font-medium w-full capitalize"
									readOnly
									value={user.firstName}
								/>
							</TextField>
							<TextField isReadOnly>
								<Label className="text-foreground/60 text-sm">Last Name</Label>
								<Input
									className="bg-app-brand/5 border-none rounded-lg px-3 py-2 text-foreground font-medium w-full capitalize"
									readOnly
									value={user.lastName}
								/>
							</TextField>
						</div>

						<TextField isReadOnly>
							<Label className="text-foreground/60 text-sm">Email Address</Label>
							<div className="relative">
								<Mail
									className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40"
									size={16}
								/>
								<Input
									className="bg-app-brand/5 border-none rounded-lg pl-10 pr-3 py-2 text-foreground font-medium w-full"
									readOnly
									value={user.email ?? ""}
								/>
							</div>
						</TextField>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<TextField isReadOnly>
								<Label className="text-foreground/60 text-sm">Account Status</Label>
								<Input
									className="bg-app-brand/5 border-none rounded-lg px-3 py-2 text-foreground font-medium w-full capitalize"
									readOnly
									value={user.status?.replace("_", " ")}
								/>
							</TextField>
							<TextField isReadOnly>
								<Label className="text-foreground/60 text-sm">User Type</Label>
								<Input
									className="bg-app-brand/5 border-none rounded-lg px-3 py-2 text-foreground font-medium w-full capitalize"
									readOnly
									value={user.userType}
								/>
							</TextField>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<TextField isReadOnly>
								<Label className="text-foreground/60 text-sm">Email Verification</Label>
								<Input
									className="bg-app-brand/5 border-none rounded-lg px-3 py-2 text-foreground font-medium w-full"
									readOnly
									value={user.isEmailVerified ? "Verified" : "Not Verified"}
								/>
							</TextField>
							<TextField isReadOnly>
								<Label className="text-foreground/60 text-sm">Phone Verification</Label>
								<Input
									className="bg-app-brand/5 border-none rounded-lg px-3 py-2 text-foreground font-medium w-full"
									readOnly
									value={user.isPhoneVerified ? "Verified" : "Not Verified"}
								/>
							</TextField>
						</div>
					</div>
				</Surface>
			</div>
		</div>
	);
}
