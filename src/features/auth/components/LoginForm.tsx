import { Button, FieldError, Input, Label, TextField } from "@heroui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useLogin } from "../hooks/use-auth-mutations";
import { type LoginInput, LoginSchema } from "../validations/schema/login.schema";

export default function LoginForm() {
	const [showPassword, setShowPassword] = useState(false);
	const loginMutation = useLogin();

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<LoginInput>({
		resolver: zodResolver(LoginSchema),
		defaultValues: {
			identifier: "",
			password: "",
		},
	});

	const onSubmit = (data: LoginInput) => {
		loginMutation.mutate(data);
	};

	return (
		<form
			className="space-y-6"
			onSubmit={handleSubmit(onSubmit)}
		>
			<TextField isInvalid={!!errors.identifier}>
				<Label className="text-foreground font-semibold">Email or Phone</Label>
				<Input
					className="rounded-lg border border-app-brand/20 bg-app-base px-3 py-3 focus:border-app-brand outline-none transition-colors w-full"
					placeholder="Enter your email or phone"
					{...register("identifier")}
				/>
				<FieldError className="text-danger text-xs mt-1">{errors.identifier?.message}</FieldError>
			</TextField>

			<TextField isInvalid={!!errors.password}>
				<Label className="text-foreground font-semibold">Password</Label>
				<div className="relative">
					<Input
						className="rounded-lg border border-app-brand/20 bg-app-base px-3 py-3 focus:border-app-brand outline-none transition-colors w-full pr-10"
						placeholder="Enter your password"
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

			<div className="flex justify-end">
				<button
					className="text-xs font-semibold text-app-brand hover:underline cursor-pointer"
					type="button"
				>
					Forgot password?
				</button>
			</div>

			<Button
				className="w-full bg-app-brand text-app-base font-bold h-12 rounded-xl transition-all hover:brightness-110 active:scale-[0.98]"
				isPending={loginMutation.isPending}
				type="submit"
			>
				<LogIn
					className="mr-2"
					size={20}
				/>
				Sign In
			</Button>
		</form>
	);
}
