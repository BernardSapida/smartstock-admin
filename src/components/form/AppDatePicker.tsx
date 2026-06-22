import { Calendar, DateField, DatePicker, FieldError, Label } from "@heroui/react";
import type { CalendarDate } from "@internationalized/date";
import type { Control, FieldValues, Path } from "react-hook-form";
import { useController } from "react-hook-form";

interface AppDatePickerProps<T extends FieldValues> {
	name: Path<T>;
	label: string;
	control: Control<T>;
	minValue?: CalendarDate;
	maxValue?: CalendarDate;
	isDisabled?: boolean;
	isRequired?: boolean;
	className?: string;
	"data-cy"?: string;
}

export function AppDatePicker<T extends FieldValues>({
	name,
	label,
	control,
	minValue,
	maxValue,
	isDisabled,
	isRequired,
	className,
	"data-cy": dataCy,
}: AppDatePickerProps<T>) {
	const {
		field,
		fieldState: { invalid, error },
	} = useController({ name, control });

	return (
		<DatePicker
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
				field.onBlur();
			}}
			value={field.value ?? null}
		>
			<Label>{label}</Label>
			<DateField.Group fullWidth>
				<DateField.Input>{(segment) => <DateField.Segment segment={segment} />}</DateField.Input>
				<DateField.Suffix>
					<DatePicker.Trigger>
						<DatePicker.TriggerIndicator />
					</DatePicker.Trigger>
				</DateField.Suffix>
			</DateField.Group>
			<DatePicker.Popover>
				<Calendar aria-label={label}>
					<Calendar.Header>
						<Calendar.YearPickerTrigger>
							<Calendar.YearPickerTriggerHeading />
							<Calendar.YearPickerTriggerIndicator />
						</Calendar.YearPickerTrigger>
						<Calendar.NavButton slot="previous" />
						<Calendar.NavButton slot="next" />
					</Calendar.Header>
					<Calendar.Grid>
						<Calendar.GridHeader>{(day) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}</Calendar.GridHeader>
						<Calendar.GridBody>{(date) => <Calendar.Cell date={date} />}</Calendar.GridBody>
					</Calendar.Grid>
				</Calendar>
			</DatePicker.Popover>
			<FieldError>{error?.message}</FieldError>
		</DatePicker>
	);
}
