import { Checkbox, CheckboxGroup, FieldError, Label } from "@heroui/react";
import type { Control, FieldValues, Path } from "react-hook-form";
import { useController } from "react-hook-form";

interface CheckboxGroupItem {
	label: string;
	value: string;
}

interface AppCheckboxGroupProps<T extends FieldValues> {
	name: Path<T>;
	label: string;
	control: Control<T>;
	items: CheckboxGroupItem[];
	isDisabled?: boolean;
	isRequired?: boolean;
	className?: string;
	"data-cy"?: string;
}

export function AppCheckboxGroup<T extends FieldValues>({
	name,
	label,
	control,
	items,
	isDisabled,
	isRequired,
	className,
	"data-cy": dataCy,
}: AppCheckboxGroupProps<T>) {
	const {
		field,
		fieldState: { invalid, error },
	} = useController({ name, control });

	return (
		<CheckboxGroup
			className={className}
			data-cy={dataCy}
			isDisabled={isDisabled}
			isInvalid={invalid}
			isRequired={isRequired}
			name={field.name}
			onChange={(val) => {
				field.onChange(val);
				field.onBlur();
			}}
			value={field.value ?? []}
		>
			<Label>{label}</Label>
			{items.map((item) => (
				<Checkbox
					isInvalid={false}
					key={item.value}
					value={item.value}
				>
					<Checkbox.Control>
						<Checkbox.Indicator />
					</Checkbox.Control>
					<Checkbox.Content>
						<Label className="!text-text-primary">{item.label}</Label>
					</Checkbox.Content>
				</Checkbox>
			))}
			<FieldError>{error?.message}</FieldError>
		</CheckboxGroup>
	);
}
