import { Button, FieldError, Input, Label, TextField } from "@heroui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRegisterUser } from "../hooks/use-auth-mutations";
import { type RegisterInput, RegisterSchema } from "../validations/schema/register.schema";

export default function RegisterForm() {
	const [showPassword, setShowPassword] = useState(false);
	const registerMutation = useRegisterUser();

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<RegisterInput>({
		resolver: zodResolver(RegisterSchema),
		defaultValues: {
			firstName: "",
			lastName: "",
			email: "",
			phoneNumber: "",
			password: "",
			confirmPassword: "",
		},
	});

	const onSubmit = (data: RegisterInput) => {
		registerMutation.mutate({
			phone: data.phoneNumber,
			password: data.password,
			firstName: data.firstName,
			middleName: "",
			lastName: data.lastName,
			email: data.email,
			suffix: "",
			userType: "USER",
			acceptedTerms: true,
		});
	};

	return (
		<form
			className="space-y-4"
			onSubmit={handleSubmit(onSubmit)}
		>
			<div className="grid grid-cols-2 gap-4">
				<TextField isInvalid={!!errors.firstName}>
					<Label className="text-foreground font-semibold text-sm">First Name</Label>
					<Input
						className="rounded-lg border border-app-brand/20 bg-app-base px-3 py-2 focus:border-app-brand outline-none transition-colors w-full"
						placeholder="John"
						{...register("firstName")}
					/>
					<FieldError className="text-danger text-xs mt-1">{errors.firstName?.message}</FieldError>
				</TextField>
				<TextField isInvalid={!!errors.lastName}>
					<Label className="text-foreground font-semibold text-sm">Last Name</Label>
					<Input
						className="rounded-lg border border-app-brand/20 bg-app-base px-3 py-2 focus:border-app-brand outline-none transition-colors w-full"
						placeholder="Doe"
						{...register("lastName")}
					/>
					<FieldError className="text-danger text-xs mt-1">{errors.lastName?.message}</FieldError>
				</TextField>
			</div>

			<TextField isInvalid={!!errors.email}>
				<Label className="text-foreground font-semibold text-sm">Email</Label>
				<Input
					className="rounded-lg border border-app-brand/20 bg-app-base px-3 py-2 focus:border-app-brand outline-none transition-colors w-full"
					placeholder="john@example.com"
					{...register("email")}
				/>
				<FieldError className="text-danger text-xs mt-1">{errors.email?.message}</FieldError>
			</TextField>

			<TextField isInvalid={!!errors.phoneNumber}>
				<Label className="text-foreground font-semibold text-sm">Phone Number</Label>
				<div className="relative">
					<span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-app-brand/50">+63</span>
					<Input
						className="rounded-lg border border-app-brand/20 bg-app-base pl-12 pr-3 py-2 focus:border-app-brand outline-none transition-colors w-full"
						placeholder="9123456789"
						{...register("phoneNumber")}
					/>
				</div>
				<FieldError className="text-danger text-xs mt-1">{errors.phoneNumber?.message}</FieldError>
			</TextField>

			<TextField isInvalid={!!errors.password}>
				<Label className="text-foreground font-semibold text-sm">Password</Label>
				<div className="relative">
					<Input
						className="rounded-lg border border-app-brand/20 bg-app-base px-3 py-2 focus:border-app-brand outline-none transition-colors w-full pr-10"
						placeholder="Create a password"
						type={showPassword ? "text" : "password"}
						{...register("password")}
					/>
					<button
						className="absolute right-3 top-1/2 -translate-y-1/2 focus:outline-none"
						onClick={() => setShowPassword(!showPassword)}
						type="button"
					>
						{showPassword ? (
							<EyeOff
								className="text-app-brand/50"
								size={20}
							/>
						) : (
							<Eye
								className="text-app-brand/50"
								size={20}
							/>
						)}
					</button>
				</div>
				<FieldError className="text-danger text-xs mt-1">{errors.password?.message}</FieldError>
			</TextField>

			<TextField isInvalid={!!errors.confirmPassword}>
				<Label className="text-foreground font-semibold text-sm">Confirm Password</Label>
				<Input
					className="rounded-lg border border-app-brand/20 bg-app-base px-3 py-2 focus:border-app-brand outline-none transition-colors w-full"
					placeholder="Repeat your password"
					type={showPassword ? "text" : "password"}
					{...register("confirmPassword")}
				/>
				<FieldError className="text-danger text-xs mt-1">{errors.confirmPassword?.message}</FieldError>
			</TextField>

			<Button
				className="w-full bg-app-brand text-app-base font-bold h-12 rounded-xl mt-4 transition-all hover:brightness-110 active:scale-[0.98]"
				isPending={registerMutation.isPending}
				type="submit"
			>
				<UserPlus
					className="mr-2"
					size={20}
				/>
				Create Account
			</Button>
		</form>
	);
}
