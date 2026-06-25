import { Description, FieldError, Label, Switch } from "@heroui/react";
import type { Control, FieldValues, Path } from "react-hook-form";
import { useController } from "react-hook-form";

interface AppSwitchProps<T extends FieldValues> {
	name: Path<T>;
	label: string;
	control: Control<T>;
	description?: string;
	isDisabled?: boolean;
	isRequired?: boolean;
	className?: string;
	"data-cy"?: string;
}

export function AppSwitch<T extends FieldValues>({
	name,
	label,
	control,
	description,
	isDisabled,
	isRequired,
	className,
	"data-cy": dataCy,
}: AppSwitchProps<T>) {
	const {
		field,
		fieldState: { error },
	} = useController({ name, control });

	return (
		<div
			className={className ?? "flex flex-col gap-1"}
			data-cy={dataCy}
		>
			<Switch
				isDisabled={isDisabled}
				isRequired={isRequired}
				isSelected={Boolean(field.value)}
				onChange={(val) => field.onChange(val)}
			>
				<Switch.Content className="flex flex-row items-center justify-between gap-3 w-full">
					<span className="flex flex-col gap-1">
						<Label>{label}</Label>
						{description && <Description>{description}</Description>}
					</span>
					<Switch.Control>
						<Switch.Thumb />
					</Switch.Control>
				</Switch.Content>
			</Switch>
			{error?.message && <FieldError className="text-sm">{error.message}</FieldError>}
		</div>
	);
}
