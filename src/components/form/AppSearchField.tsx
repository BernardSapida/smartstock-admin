import { SearchField } from "@heroui/react";
import { useEffect, useRef, useState } from "react";
import { useDebounce } from "@/hooks/use-debounce";

interface AppSearchFieldProps {
	value: string;
	onValueChange: (value: string) => void;
	debounceMs?: number;
	placeholder?: string;
	isDisabled?: boolean;
	className?: string;
}

export function AppSearchField({
	value,
	onValueChange,
	debounceMs = 300,
	placeholder = "Search...",
	isDisabled,
	className,
}: AppSearchFieldProps) {
	const [internalValue, setInternalValue] = useState(value);
	const debouncedValue = useDebounce(internalValue, debounceMs);
	const isFirstRender = useRef(true);

	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false;
			return;
		}
		onValueChange(debouncedValue);
	}, [debouncedValue]);

	useEffect(() => {
		if (value !== internalValue) setInternalValue(value);
	}, [value]);

	const handleClear = () => {
		setInternalValue("");
		onValueChange("");
	};

	return (
		<SearchField
			className={className ?? "w-full"}
			isDisabled={isDisabled}
			onChange={setInternalValue}
			onClear={handleClear}
			value={internalValue}
		>
			<SearchField.Group>
				<SearchField.SearchIcon />
				<SearchField.Input placeholder={placeholder} />
				<SearchField.ClearButton />
			</SearchField.Group>
		</SearchField>
	);
}
