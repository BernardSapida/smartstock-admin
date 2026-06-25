import { Description, FieldError, Label, NumberField } from "@heroui/react";
import type { Control, FieldValues, Path } from "react-hook-form";
import { useController } from "react-hook-form";

interface AppNumberFieldProps<T extends FieldValues> {
	name: Path<T>;
	label: string;
	control: Control<T>;
	description?: string;
	minValue?: number;
	maxValue?: number;
	step?: number;
	formatOptions?: Intl.NumberFormatOptions;
	isDisabled?: boolean;
	isRequired?: boolean;
	className?: string;
	"data-cy"?: string;
}

export function AppNumberField<T extends FieldValues>({
	name,
	label,
	control,
	description,
	minValue,
	maxValue,
	step,
	formatOptions,
	isDisabled,
	isRequired,
	className,
	"data-cy": dataCy,
}: AppNumberFieldProps<T>) {
	const {
		field,
		fieldState: { invalid, error },
	} = useController({ name, control });

	return (
		<NumberField
			className={className ?? "w-full"}
			data-cy={dataCy}
			formatOptions={formatOptions}
			isDisabled={isDisabled}
			isInvalid={invalid}
			isRequired={isRequired}
			maxValue={maxValue}
			minValue={minValue}
			onBlur={field.onBlur}
			onChange={(val) => {
				field.onChange(Number.isNaN(val) ? 0 : val);
			}}
			step={step}
			validationBehavior="aria"
			value={field.value ?? 0}
			variant="secondary"
		>
			<Label>{label}</Label>
			{description && <Description>{description}</Description>}
			<NumberField.Group>
				<NumberField.DecrementButton />
				<NumberField.Input />
				<NumberField.IncrementButton />
			</NumberField.Group>
			<FieldError>{error?.message}</FieldError>
		</NumberField>
	);
}
