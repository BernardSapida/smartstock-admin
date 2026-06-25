import { DateField, Description, FieldError, Label } from "@heroui/react";
import type { CalendarDate } from "@internationalized/date";
import type { Control, FieldValues, Path } from "react-hook-form";
import { useController } from "react-hook-form";

interface AppDateFieldProps<T extends FieldValues> {
	name: Path<T>;
	label: string;
	control: Control<T>;
	description?: string;
	minValue?: CalendarDate;
	maxValue?: CalendarDate;
	isDisabled?: boolean;
	isRequired?: boolean;
	className?: string;
	"data-cy"?: string;
}

export function AppDateField<T extends FieldValues>({
	name,
	label,
	control,
	description,
	minValue,
	maxValue,
	isDisabled,
	isRequired,
	className,
	"data-cy": dataCy,
}: AppDateFieldProps<T>) {
	const {
		field,
		fieldState: { invalid, error },
	} = useController({ name, control });

	return (
		<DateField
			className={className ?? "w-full"}
			data-cy={dataCy}
			isDisabled={isDisabled}
			isInvalid={invalid}
			isRequired={isRequired}
			maxValue={maxValue}
			minValue={minValue}
			onBlur={field.onBlur}
			onChange={(val) => {
				field.onChange(val);
			}}
			value={field.value ?? null}
		>
			<Label>{label}</Label>
			<DateField.Group variant="secondary">
				<DateField.Input>{(segment) => <DateField.Segment segment={segment} />}</DateField.Input>
			</DateField.Group>
			{description && <Description>{description}</Description>}
			<FieldError>{error?.message}</FieldError>
		</DateField>
	);
}
