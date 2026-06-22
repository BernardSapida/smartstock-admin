import { FieldError, Label, ListBox, Select } from "@heroui/react";
import type { Control, FieldValues, Path } from "react-hook-form";
import { useController } from "react-hook-form";

interface SelectItem {
	label: string;
	value: string;
}

interface AppSelectProps<T extends FieldValues> {
	name: Path<T>;
	label: string;
	control: Control<T>;
	items: SelectItem[];
	placeholder?: string;
	isDisabled?: boolean;
	isLoading?: boolean;
	isRequired?: boolean;
	className?: string;
	selectionMode?: "single" | "multiple";
	"data-cy"?: string;
}

export function AppSelect<T extends FieldValues>({
	name,
	label,
	control,
	items,
	placeholder,
	isDisabled,
	isLoading,
	isRequired,
	className,
	selectionMode = "single",
	"data-cy": dataCy,
}: AppSelectProps<T>) {
	const {
		field,
		fieldState: { invalid, error },
	} = useController({ name, control });

	return (
		<div data-cy={dataCy}>
			<Select
				className={className ?? "w-full"}
				isDisabled={isDisabled || isLoading}
				isInvalid={invalid}
				isRequired={isRequired}
				onChange={(val) => {
					field.onChange(val ?? null);
					field.onBlur();
				}}
				onOpenChange={(isOpen) => {
					if (!isOpen) field.onBlur();
				}}
				placeholder={placeholder}
				selectionMode={selectionMode}
				value={field.value ?? null}
			>
				<Label>{label}</Label>
				<Select.Trigger>
					<Select.Value />
					<Select.Indicator />
				</Select.Trigger>
				<Select.Popover>
					<ListBox>
						{items.map((item) => (
							<ListBox.Item
								id={item.value}
								key={item.value}
								textValue={item.label}
							>
								{item.label}
								<ListBox.ItemIndicator />
							</ListBox.Item>
						))}
					</ListBox>
				</Select.Popover>
				<FieldError>{error?.message}</FieldError>
			</Select>
		</div>
	);
}
