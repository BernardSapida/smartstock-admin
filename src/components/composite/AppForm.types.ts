import type { CalendarDate } from "@internationalized/date";

interface BaseField {
	col?: "full";
	showIf?: (values: Record<string, unknown>) => boolean;
}

interface TextField extends BaseField {
	type: "text" | "email" | "password" | "url";
	name: string;
	label: string;
	placeholder?: string;
	description?: string;
	isDisabled?: boolean;
}

interface NumberFieldDef extends BaseField {
	type: "number";
	name: string;
	label: string;
	placeholder?: string;
	description?: string;
	isDisabled?: boolean;
	minValue?: number;
	maxValue?: number;
	step?: number;
}

interface TextareaField extends BaseField {
	type: "textarea";
	name: string;
	label: string;
	placeholder?: string;
	description?: string;
	isDisabled?: boolean;
	minRows?: number;
	maxRows?: number;
}

interface SelectField extends BaseField {
	type: "select";
	name: string;
	label: string;
	items: { label: string; value: string }[];
	placeholder?: string;
	isDisabled?: boolean;
}

interface SwitchField extends BaseField {
	type: "switch";
	name: string;
	label: string;
	description?: string;
	isDisabled?: boolean;
}

interface DateField extends BaseField {
	type: "date";
	name: string;
	label: string;
	minValue?: CalendarDate;
	maxValue?: CalendarDate;
	isDisabled?: boolean;
}

interface SectionField {
	type: "section";
	label: string;
	col?: "full";
	showIf?: never;
}

export type AppFormField =
	| TextField
	| NumberFieldDef
	| TextareaField
	| SelectField
	| SwitchField
	| DateField
	| SectionField;
