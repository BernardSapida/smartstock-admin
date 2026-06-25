/**
 * AppDateRangePicker - RHF-bound date range picker.
 * Return type: { start: CalendarDate; end: CalendarDate } | null
 * Use `calendarDateRangeSchema` from @/lib/schemas/date.schema for Zod validation.
 */
import { DateField, DateRangePicker, FieldError, Label, RangeCalendar } from "@heroui/react";
import type { CalendarDate } from "@internationalized/date";
import type { Control, FieldValues, Path } from "react-hook-form";
import { useController } from "react-hook-form";

interface AppDateRangePickerProps<T extends FieldValues> {
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

export function AppDateRangePicker<T extends FieldValues>({
	name,
	label,
	control,
	minValue,
	maxValue,
	isDisabled,
	isRequired,
	className,
	"data-cy": dataCy,
}: AppDateRangePickerProps<T>) {
	const {
		field,
		fieldState: { invalid, error },
	} = useController({ name, control });

	return (
		<DateRangePicker
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
			<DateField.Group
				fullWidth
				variant="secondary"
			>
				<DateField.Input slot="start">{(segment) => <DateField.Segment segment={segment} />}</DateField.Input>
				<DateRangePicker.RangeSeparator />
				<DateField.Input slot="end">{(segment) => <DateField.Segment segment={segment} />}</DateField.Input>
				<DateField.Suffix>
					<DateRangePicker.Trigger>
						<DateRangePicker.TriggerIndicator />
					</DateRangePicker.Trigger>
				</DateField.Suffix>
			</DateField.Group>
			<DateRangePicker.Popover>
				<RangeCalendar aria-label={label}>
					<RangeCalendar.Header>
						<RangeCalendar.YearPickerTrigger>
							<RangeCalendar.YearPickerTriggerHeading />
							<RangeCalendar.YearPickerTriggerIndicator />
						</RangeCalendar.YearPickerTrigger>
						<RangeCalendar.NavButton slot="previous" />
						<RangeCalendar.NavButton slot="next" />
					</RangeCalendar.Header>
					<RangeCalendar.Grid>
						<RangeCalendar.GridHeader>
							{(day) => <RangeCalendar.HeaderCell>{day}</RangeCalendar.HeaderCell>}
						</RangeCalendar.GridHeader>
						<RangeCalendar.GridBody>{(date) => <RangeCalendar.Cell date={date} />}</RangeCalendar.GridBody>
					</RangeCalendar.Grid>
					<RangeCalendar.YearPickerGrid>
						<RangeCalendar.YearPickerGridBody>
							{({ year }) => <RangeCalendar.YearPickerCell year={year} />}
						</RangeCalendar.YearPickerGridBody>
					</RangeCalendar.YearPickerGrid>
				</RangeCalendar>
			</DateRangePicker.Popover>
			<FieldError>{error?.message}</FieldError>
		</DateRangePicker>
	);
}
