/**
 * AppInputGroup - RHF-bound TextField with InputGroup prefix/suffix slots.
 * Use for inputs that need an icon or text adornment (e.g. URL, currency, search).
 * For a plain text input without adornments, use AppTextField instead.
 */
import { Description, FieldError, InputGroup, Label, TextField } from "@heroui/react";
import type { ReactNode } from "react";
import type { Control, FieldValues, Path } from "react-hook-form";
import { useController } from "react-hook-form";

interface AppInputGroupProps<T extends FieldValues> {
	name: Path<T>;
	label: string;
	control: Control<T>;
	startContent?: ReactNode;
	endContent?: ReactNode;
	description?: string;
	placeholder?: string;
	isDisabled?: boolean;
	isReadOnly?: boolean;
	isRequired?: boolean;
	type?: "email" | "password" | "tel" | "text" | "url";
	/** When true, strips any non-digit characters as the user types. */
	onlyDigits?: boolean;
	className?: string;
	"data-cy"?: string;
}

export function AppInputGroup<T extends FieldValues>({
	name,
	label,
	control,
	startContent,
	endContent,
	description,
	placeholder,
	isDisabled,
	isReadOnly,
	isRequired,
	type = "text",
	onlyDigits,
	className,
	"data-cy": dataCy,
}: AppInputGroupProps<T>) {
	const {
		field,
		fieldState: { invalid, error },
	} = useController({ name, control });

	const handleChange = (value: string) => {
		field.onChange(onlyDigits ? value.replace(/\D/g, "") : value);
	};

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
			onChange={handleChange}
			type={type}
			validationBehavior="aria"
			value={field.value ?? ""}
		>
			<Label>{label}</Label>
			<InputGroup variant="secondary">
				{startContent && <InputGroup.Prefix>{startContent}</InputGroup.Prefix>}
				<InputGroup.Input
					inputMode={onlyDigits ? "numeric" : undefined}
					onBlur={field.onBlur}
					placeholder={placeholder}
				/>
				{endContent && <InputGroup.Suffix>{endContent}</InputGroup.Suffix>}
			</InputGroup>
			{description && <Description>{description}</Description>}
			<FieldError>{error?.message}</FieldError>
		</TextField>
	);
}
