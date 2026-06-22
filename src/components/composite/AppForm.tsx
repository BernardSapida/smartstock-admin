import type { Control, FieldValues, Path } from "react-hook-form";
import { useWatch } from "react-hook-form";
import { AppDatePicker } from "@/components/form/AppDatePicker";
import { AppNumberField } from "@/components/form/AppNumberField";
import { AppSelect } from "@/components/form/AppSelect";
import { AppSwitch } from "@/components/form/AppSwitch";
import { AppTextArea } from "@/components/form/AppTextArea";
import { AppTextField } from "@/components/form/AppTextField";
import type { AppFormField } from "./AppForm.types";

interface AppFormProps<T extends FieldValues> {
	control: Control<T>;
	fields: AppFormField[];
	cols?: 1 | 2 | 3;
}

export function AppForm<T extends FieldValues>({ control, fields, cols = 1 }: AppFormProps<T>) {
	const values = useWatch({ control }) as Record<string, unknown>;

	const colClass = {
		1: "grid-cols-1",
		2: "grid-cols-1 sm:grid-cols-2",
		3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
	}[cols];

	return (
		<div className={`grid ${colClass} gap-4`}>
			{fields.map((field, index) => {
				if (field.type === "section") {
					return (
						<div
							className={`col-span-full flex items-center gap-3 ${index > 0 ? "mt-2" : ""}`}
							key={`section-${index}`}
						>
							<span className="text-xs font-bold uppercase tracking-widest text-muted">{field.label}</span>
							<div className="flex-1 border-t border-muted/20" />
						</div>
					);
				}

				const shouldShow = field.showIf ? field.showIf(values) : true;
				if (!shouldShow) return null;

				const isFullCol = field.col === "full";
				const wrapperClass = isFullCol ? "col-span-full" : "";

				if (field.type === "text" || field.type === "email" || field.type === "password" || field.type === "url") {
					return (
						<div
							className={wrapperClass}
							key={field.name}
						>
							<AppTextField
								control={control as Control<Record<string, unknown>>}
								description={field.description}
								isDisabled={field.isDisabled}
								label={field.label}
								name={field.name as Path<Record<string, unknown>>}
								placeholder={field.placeholder}
								type={field.type}
							/>
						</div>
					);
				}

				if (field.type === "number") {
					return (
						<div
							className={wrapperClass}
							key={field.name}
						>
							<AppNumberField
								control={control as Control<Record<string, unknown>>}
								isDisabled={field.isDisabled}
								label={field.label}
								maxValue={field.maxValue}
								minValue={field.minValue}
								name={field.name as Path<Record<string, unknown>>}
								step={field.step}
							/>
						</div>
					);
				}

				if (field.type === "textarea") {
					return (
						<div
							className={wrapperClass}
							key={field.name}
						>
							<AppTextArea
								control={control as Control<Record<string, unknown>>}
								description={field.description}
								isDisabled={field.isDisabled}
								label={field.label}
								name={field.name as Path<Record<string, unknown>>}
								placeholder={field.placeholder}
							/>
						</div>
					);
				}

				if (field.type === "select") {
					return (
						<div
							className={wrapperClass}
							key={field.name}
						>
							<AppSelect
								control={control as Control<Record<string, unknown>>}
								isDisabled={field.isDisabled}
								items={field.items}
								label={field.label}
								name={field.name as Path<Record<string, unknown>>}
								placeholder={field.placeholder}
							/>
						</div>
					);
				}

				if (field.type === "switch") {
					return (
						<div
							className={wrapperClass}
							key={field.name}
						>
							<AppSwitch
								control={control as Control<Record<string, unknown>>}
								description={field.description}
								isDisabled={field.isDisabled}
								label={field.label}
								name={field.name as Path<Record<string, unknown>>}
							/>
						</div>
					);
				}

				if (field.type === "date") {
					return (
						<div
							className={wrapperClass}
							key={field.name}
						>
							<AppDatePicker
								control={control as Control<Record<string, unknown>>}
								isDisabled={field.isDisabled}
								label={field.label}
								maxValue={field.maxValue}
								minValue={field.minValue}
								name={field.name as Path<Record<string, unknown>>}
							/>
						</div>
					);
				}

				return null;
			})}
		</div>
	);
}
