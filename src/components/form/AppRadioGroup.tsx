import { Description, FieldError, Label, Radio, RadioGroup } from "@heroui/react";
import type { Control, FieldValues, Path } from "react-hook-form";
import { useController } from "react-hook-form";

interface RadioItem {
	label: string;
	value: string;
	description?: string;
}

interface AppRadioGroupProps<T extends FieldValues> {
	name: Path<T>;
	label: string;
	control: Control<T>;
	items: RadioItem[];
	orientation?: "horizontal" | "vertical";
	description?: string;
	isDisabled?: boolean;
	isRequired?: boolean;
	className?: string;
	"data-cy"?: string;
}

export function AppRadioGroup<T extends FieldValues>({
	name,
	label,
	control,
	items,
	orientation = "vertical",
	description,
	isDisabled,
	isRequired,
	className,
	"data-cy": dataCy,
}: AppRadioGroupProps<T>) {
	const {
		field,
		fieldState: { invalid, error },
	} = useController({ name, control });

	return (
		<RadioGroup
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
			orientation={orientation}
			value={field.value ?? ""}
		>
			<Label>{label}</Label>
			{description && <Description>{description}</Description>}
			{items.map((item) => (
				<Radio
					key={item.value}
					value={item.value}
				>
					<Radio.Control>
						<Radio.Indicator />
					</Radio.Control>
					<Radio.Content>
						<Label className="!text-text-primary">{item.label}</Label>
						{item.description && <Description className="!text-text-secondary">{item.description}</Description>}
					</Radio.Content>
				</Radio>
			))}
			<FieldError>{error?.message}</FieldError>
		</RadioGroup>
	);
}
