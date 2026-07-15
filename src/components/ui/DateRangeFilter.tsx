/**
 * DateRangeFilter - standalone (non-RHF) start/end date filter for tables.
 *
 * The existing AppDateRangePicker is bound to react-hook-form, which a filter bar
 * has no use for. This one is a plain controlled component over `Date | null`, so
 * pages can hand the value straight to a Firestore range query.
 *
 * Shared by the Audit Logs and Reports pages so the two behave identically.
 */
import { Button, DateField, DateRangePicker, Label, RangeCalendar } from "@heroui/react";
import { CalendarDate, getLocalTimeZone, today } from "@internationalized/date";
import { X } from "lucide-react";

export interface DateRange {
	start: Date | null;
	end: Date | null;
}

/** All-time / empty range. */
export const EMPTY_RANGE: DateRange = { start: null, end: null };

export function isEmptyRange(r: DateRange): boolean {
	return r.start == null && r.end == null;
}

function toCalendarDate(d: Date | null): CalendarDate | null {
	if (!d) return null;
	return new CalendarDate(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

function toDate(c: CalendarDate | null | undefined): Date | null {
	if (!c) return null;
	return c.toDate(getLocalTimeZone());
}

/** Presets cover the ranges people actually ask for; the calendar covers the rest. */
function presets(): { label: string; range: DateRange }[] {
	const tz = getLocalTimeZone();
	const t = today(tz);
	const end = t.toDate(tz);
	return [
		{ label: "Today", range: { start: t.toDate(tz), end } },
		{ label: "Last 7 days", range: { start: t.subtract({ days: 6 }).toDate(tz), end } },
		{ label: "Last 30 days", range: { start: t.subtract({ days: 29 }).toDate(tz), end } },
		{
			label: "This month",
			range: { start: new CalendarDate(t.year, t.month, 1).toDate(tz), end },
		},
	];
}

interface Props {
	value: DateRange;
	onChange: (r: DateRange) => void;
	label?: string;
	className?: string;
}

export function DateRangeFilter({ value, onChange, label = "Date range", className }: Props) {
	const start = toCalendarDate(value.start);
	const end = toCalendarDate(value.end);
	const rangeValue = start && end ? { start, end } : null;

	return (
		<div className={className ?? "flex flex-col gap-2"}>
			<div className="flex items-end gap-2">
				<DateRangePicker
					aria-label={label}
					// A half-open range (start but no end, or vice versa) isn't
					// expressible in this control, so commit only complete ranges and
					// let "Clear" handle the empty case.
					onChange={(val) => onChange({ start: toDate(val?.start), end: toDate(val?.end) })}
					value={rangeValue}
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
				</DateRangePicker>

				{!isEmptyRange(value) && (
					<Button
						aria-label="Clear date range"
						className="mb-0.5"
						onPress={() => onChange(EMPTY_RANGE)}
						size="sm"
						variant="ghost"
					>
						<X className="mr-1 h-3.5 w-3.5" />
						Clear
					</Button>
				)}
			</div>

			<div className="flex flex-wrap gap-1.5">
				{presets().map((p) => (
					<Button
						key={p.label}
						onPress={() => onChange(p.range)}
						size="sm"
						variant="outline"
					>
						{p.label}
					</Button>
				))}
			</div>
		</div>
	);
}
