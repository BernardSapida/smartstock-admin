import { InputOTP } from "@heroui/react";

interface AppInputOTPProps {
	value: string;
	onChange: (value: string) => void;
	length?: number;
	isDisabled?: boolean;
	isInvalid?: boolean;
	errorMessage?: string;
	className?: string;
}

export function AppInputOTP({
	value,
	onChange,
	length = 6,
	isDisabled,
	isInvalid,
	errorMessage,
	className,
}: AppInputOTPProps) {
	const half = Math.ceil(length / 2);

	return (
		<div className={className ?? "flex flex-col gap-1"}>
			<InputOTP
				isDisabled={isDisabled}
				isInvalid={isInvalid}
				maxLength={length}
				onChange={onChange}
				value={value}
			>
				<InputOTP.Group>
					{Array.from({ length: half }, (_, i) => (
						<InputOTP.Slot
							index={i}
							key={i}
						/>
					))}
				</InputOTP.Group>
				<InputOTP.Separator />
				<InputOTP.Group>
					{Array.from({ length: length - half }, (_, i) => (
						<InputOTP.Slot
							index={half + i}
							key={half + i}
						/>
					))}
				</InputOTP.Group>
			</InputOTP>
			{isInvalid && errorMessage && <p className="text-xs text-danger mt-1">{errorMessage}</p>}
		</div>
	);
}
