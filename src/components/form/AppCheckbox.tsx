import { Checkbox, FieldError, Label } from "@heroui/react";
import type { Control, FieldValues, Path } from "react-hook-form";
import { useController } from "react-hook-form";

interface AppCheckboxProps<T extends FieldValues> {
	name: Path<T>;
	label: string;
	control: Control<T>;
	isDisabled?: boolean;
	isRequired?: boolean;
	className?: string;
	"data-cy"?: string;
}

export function AppCheckbox<T extends FieldValues>({
	name,
	label,
	control,
	isDisabled,
	isRequired,
	className,
	"data-cy": dataCy,
}: AppCheckboxProps<T>) {
	const {
		field,
		fieldState: { error },
	} = useController({ name, control });

	return (
		<div
			className={className ?? "flex flex-col gap-1"}
			data-cy={dataCy}
		>
			<Checkbox
				isDisabled={isDisabled}
				isRequired={isRequired}
				isSelected={Boolean(field.value)}
				onChange={(checked) => field.onChange(checked)}
			>
				<Checkbox.Control>
					<Checkbox.Indicator />
				</Checkbox.Control>
				<Checkbox.Content>
					<Label>{label}</Label>
				</Checkbox.Content>
			</Checkbox>
			{error?.message && <FieldError className="text-sm">{error.message}</FieldError>}
		</div>
	);
}
