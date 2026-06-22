import { InputGroup, Label, TextField } from "@heroui/react";
import type { ReactNode } from "react";

interface AppInputGroupProps {
	label?: string;
	name?: string;
	placeholder?: string;
	startContent?: ReactNode;
	endContent?: ReactNode;
	value?: string;
	onChange?: (value: string) => void;
	isDisabled?: boolean;
	type?: "text" | "email" | "password" | "url" | "tel";
	className?: string;
}

export function AppInputGroup({
	label,
	name,
	placeholder,
	startContent,
	endContent,
	value,
	onChange,
	isDisabled,
	type = "text",
	className,
}: AppInputGroupProps) {
	return (
		<TextField
			className={className}
			isDisabled={isDisabled}
			name={name}
			onChange={onChange}
			type={type}
			value={value}
		>
			{label && <Label>{label}</Label>}
			<InputGroup>
				{startContent && <InputGroup.Prefix>{startContent}</InputGroup.Prefix>}
				<InputGroup.Input placeholder={placeholder} />
				{endContent && <InputGroup.Suffix>{endContent}</InputGroup.Suffix>}
			</InputGroup>
		</TextField>
	);
}
