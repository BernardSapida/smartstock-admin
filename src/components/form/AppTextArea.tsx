import { Description, FieldError, InputGroup, Label, TextField } from "@heroui/react";
import type { Control, FieldValues, Path } from "react-hook-form";
import { useController } from "react-hook-form";

interface AppTextAreaProps<T extends FieldValues> {
	name: Path<T>;
	label: string;
	control: Control<T>;
	description?: string;
	placeholder?: string;
	isDisabled?: boolean;
	isReadOnly?: boolean;
	isRequired?: boolean;
	rows?: number;
	className?: string;
	"data-cy"?: string;
}

export function AppTextArea<T extends FieldValues>({
	name,
	label,
	control,
	description,
	placeholder,
	isDisabled,
	isReadOnly,
	isRequired,
	rows,
	className,
	"data-cy": dataCy,
}: AppTextAreaProps<T>) {
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
			validationBehavior="aria"
			value={field.value ?? ""}
		>
			<Label>{label}</Label>
			<InputGroup
				fullWidth
				variant="secondary"
			>
				<InputGroup.TextArea
					placeholder={placeholder}
					rows={rows}
				/>
			</InputGroup>
			{description && <Description>{description}</Description>}
			<FieldError>{error?.message}</FieldError>
		</TextField>
	);
}
