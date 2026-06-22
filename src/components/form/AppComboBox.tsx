import { ComboBox, Description, FieldError, Input, Label, ListBox } from "@heroui/react";
import type { Control, FieldValues, Path } from "react-hook-form";
import { useController } from "react-hook-form";

interface ComboBoxItem {
	label: string;
	value: string;
}

interface AppComboBoxProps<T extends FieldValues> {
	name: Path<T>;
	label: string;
	control: Control<T>;
	items: ComboBoxItem[];
	placeholder?: string;
	description?: string;
	isDisabled?: boolean;
	isRequired?: boolean;
	className?: string;
	"data-cy"?: string;
}

export function AppComboBox<T extends FieldValues>({
	name,
	label,
	control,
	items,
	placeholder,
	description,
	isDisabled,
	isRequired,
	className,
	"data-cy": dataCy,
}: AppComboBoxProps<T>) {
	const {
		field,
		fieldState: { invalid, error },
	} = useController({ name, control });

	return (
		<ComboBox
			className={className ?? "w-full"}
			data-cy={dataCy}
			isDisabled={isDisabled}
			isInvalid={invalid}
			isRequired={isRequired}
			onBlur={field.onBlur}
			onSelectionChange={(key) => {
				field.onChange(key ? String(key) : null);
				field.onBlur();
			}}
			selectedKey={field.value ?? null}
		>
			<Label>{label}</Label>
			<ComboBox.InputGroup>
				<Input placeholder={placeholder} />
				<ComboBox.Trigger />
			</ComboBox.InputGroup>
			<ComboBox.Popover>
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
			</ComboBox.Popover>
			{description && <Description>{description}</Description>}
			<FieldError>{error?.message}</FieldError>
		</ComboBox>
	);
}
