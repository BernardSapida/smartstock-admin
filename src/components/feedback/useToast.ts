import { notify } from "./notify";

/**
 * Hook wrapper around the centralized {@link notify} helper.
 *
 * Every toast requires an icon (supplied automatically), a title and a
 * description. Prefer importing `notify` directly outside of components.
 */
export function useToast() {
	return { toast: notify };
}
