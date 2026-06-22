import { Description, FieldError, Input, Label, TextField } from "@heroui/react";
import type { Control, FieldValues, Path } from "react-hook-form";
import { useController } from "react-hook-form";

interface AppTextFieldProps<T extends FieldValues> {
	name: Path<T>;
	label: string;
	control: Control<T>;
	description?: string;
	placeholder?: string;
	isDisabled?: boolean;
	isReadOnly?: boolean;
	isRequired?: boolean;
	type?: "text" | "email" | "password" | "url";
	className?: string;
	"data-cy"?: string;
}

export function AppTextField<T extends FieldValues>({
	name,
	label,
	control,
	description,
	placeholder,
	isDisabled,
	isReadOnly,
	isRequired,
	type = "text",
	className,
	"data-cy": dataCy,
}: AppTextFieldProps<T>) {
	const {
		field,
		fieldState: { invalid, error },
	} = useController({ name, control });

	return (
		<TextField
			className={className ?? "w-full"}
			data-cy={dataCy}
			isDisabled={isDisabled}
			isInvalid={invalid}
			isReadOnly={isReadOnly}
			isRequired={isRequired}
			name={field.name}
			onBlur={field.onBlur}
			onChange={field.onChange}
			type={type}
			validationBehavior="aria"
			value={field.value ?? ""}
		>
			<Label>{label}</Label>
			<Input placeholder={placeholder} />
			{description && <Description>{description}</Description>}
			<FieldError>{error?.message}</FieldError>
		</TextField>
	);
}
