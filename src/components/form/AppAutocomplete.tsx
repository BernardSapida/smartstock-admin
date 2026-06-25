import { Autocomplete, EmptyState, FieldError, Label, ListBox, SearchField, useFilter } from "@heroui/react";
import type { Control, FieldValues, Path } from "react-hook-form";
import { useController } from "react-hook-form";

interface AutocompleteItem {
	label: string;
	value: string;
}

interface AppAutocompleteProps<T extends FieldValues> {
	name: Path<T>;
	label: string;
	control: Control<T>;
	items: AutocompleteItem[];
	placeholder?: string;
	description?: string;
	isDisabled?: boolean;
	isRequired?: boolean;
	className?: string;
	"data-cy"?: string;
}

export function AppAutocomplete<T extends FieldValues>({
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
}: AppAutocompleteProps<T>) {
	const {
		field,
		fieldState: { invalid, error },
	} = useController({ name, control });

	const { contains } = useFilter({ sensitivity: "base" });

	return (
		<Autocomplete
			className={className ?? "w-full"}
			data-cy={dataCy}
			isDisabled={isDisabled}
			isInvalid={invalid}
			isRequired={isRequired}
			validationBehavior="aria"
			onChange={(key) => {
				field.onChange(key ? String(key) : null);
				field.onBlur();
			}}
			onOpenChange={(isOpen) => {
				if (!isOpen) field.onBlur();
			}}
			placeholder={placeholder}
			selectionMode="single"
			value={field.value ?? null}
			variant="secondary"
		>
			<Label>{label}</Label>
			<Autocomplete.Trigger>
				<Autocomplete.Value />
				<Autocomplete.ClearButton />
				<Autocomplete.Indicator />
			</Autocomplete.Trigger>
			<Autocomplete.Popover>
				<Autocomplete.Filter filter={contains}>
					<SearchField
						autoFocus
						name={`${name}-search`}
						variant="secondary"
					>
						<SearchField.Group>
							<SearchField.SearchIcon />
							<SearchField.Input placeholder={`Search ${label.toLowerCase()}...`} />
							<SearchField.ClearButton />
						</SearchField.Group>
					</SearchField>
					<ListBox renderEmptyState={() => <EmptyState>No results found</EmptyState>}>
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
				</Autocomplete.Filter>
			</Autocomplete.Popover>
			{description && <p className="text-sm text-text-secondary">{description}</p>}
			<FieldError>{error?.message}</FieldError>
		</Autocomplete>
	);
}
