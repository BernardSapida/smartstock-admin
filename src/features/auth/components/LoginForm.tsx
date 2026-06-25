import { Button } from "@heroui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { AppInputGroup } from "@/components/form/AppInputGroup";
import { AppTextField } from "@/components/form/AppTextField";
import { useLogin } from "../hooks/use-firebase-auth";
import { type LoginInput, LoginSchema } from "../validations/schema/login.schema";

export default function LoginForm() {
	const [showPassword, setShowPassword] = useState(false);
	const { login, isPending } = useLogin();

	const { control, handleSubmit } = useForm<LoginInput>({
		resolver: zodResolver(LoginSchema),
		mode: "onBlur",
		reValidateMode: "onChange",
		defaultValues: {
			email: "",
			password: "",
		},
	});

	const onSubmit = (data: LoginInput) => {
		void login(data.email, data.password);
	};

	return (
		<form
			className="space-y-6"
			onSubmit={handleSubmit(onSubmit)}
		>
			<AppTextField
				control={control}
				isRequired
				label="Email"
				name="email"
				placeholder="Enter your email"
				type="email"
			/>

			<AppInputGroup
				control={control}
				endContent={
					<button
						aria-label={showPassword ? "Hide password" : "Show password"}
						className="focus:outline-none"
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
				}
				isRequired
				label="Password"
				name="password"
				placeholder="Enter your password"
				type={showPassword ? "text" : "password"}
			/>

			<Button
				className="w-full bg-app-brand text-app-base font-bold h-12 rounded-xl transition-all hover:brightness-110 active:scale-[0.98]"
				isPending={isPending}
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
