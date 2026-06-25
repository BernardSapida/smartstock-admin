import { Button } from "@heroui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { AppInputGroup } from "@/components/form/AppInputGroup";
import { AppTextField } from "@/components/form/AppTextField";
import { formatPhoneNumber } from "@/utils/helpers";
import { useRegister } from "../hooks/use-firebase-auth";
import { type RegisterInput, RegisterSchema } from "../validations/schema/register.schema";

export default function RegisterForm() {
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const { register, isPending } = useRegister();

	const { control, handleSubmit } = useForm<RegisterInput>({
		resolver: zodResolver(RegisterSchema),
		mode: "onBlur",
		reValidateMode: "onChange",
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
		register({
			email: data.email,
			password: data.password,
			fullName: `${data.firstName} ${data.lastName}`.trim(),
			phoneNumber: formatPhoneNumber(data.phoneNumber),
		});
	};

	return (
		<form
			className="space-y-4"
			onSubmit={handleSubmit(onSubmit)}
		>
			<div className="grid grid-cols-2 gap-4">
				<AppTextField
					control={control}
					isRequired
					label="First Name"
					name="firstName"
					placeholder="John"
				/>
				<AppTextField
					control={control}
					isRequired
					label="Last Name"
					name="lastName"
					placeholder="Doe"
				/>
			</div>

			<AppTextField
				control={control}
				isRequired
				label="Email"
				name="email"
				placeholder="john@example.com"
				type="email"
			/>

			<AppInputGroup
				control={control}
				isRequired
				label="Phone Number"
				name="phoneNumber"
				onlyDigits
				placeholder="9123456789"
				startContent={<span className="text-sm text-app-brand/50">+63</span>}
				type="tel"
			/>

			<AppInputGroup
				control={control}
				isRequired
				label="Password"
				name="password"
				placeholder="Create a password"
				type={showPassword ? "text" : "password"}
			/>

			<AppInputGroup
				control={control}
				isRequired
				label="Confirm Password"
				name="confirmPassword"
				placeholder="Repeat your password"
				type={showConfirmPassword ? "text" : "password"}
			/>

			<Button
				className="w-full bg-app-brand text-app-base font-bold h-12 rounded-xl mt-4 transition-all hover:brightness-110 active:scale-[0.98]"
				isPending={isPending}
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
