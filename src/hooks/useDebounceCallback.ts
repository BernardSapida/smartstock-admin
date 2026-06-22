import { useCallback, useEffect, useRef } from "react";

export function useDebounceCallback<T extends (...args: Parameters<T>) => void>(
	callback: T,
	delay: number = 500,
): (...args: Parameters<T>) => void {
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const callbackRef = useRef(callback);

	// keep callback updated between renders
	useEffect(() => {
		callbackRef.current = callback;
	}, [callback]);

	const debouncedFn = useCallback(
		(...args: Parameters<T>) => {
			if (timeoutRef.current) clearTimeout(timeoutRef.current);

			timeoutRef.current = setTimeout(() => {
				callbackRef.current(...args);
			}, delay);
		},
		[delay],
	);

	// clear timeout on unmount
	useEffect(() => {
		return () => {
			if (timeoutRef.current) clearTimeout(timeoutRef.current);
		};
	}, []);

	return debouncedFn;
}
