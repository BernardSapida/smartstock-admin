import { toast as heroToast } from "@heroui/react";

interface ToastOptions {
	description?: string;
}

function success(message: string, options?: ToastOptions) {
	heroToast.success(message, { description: options?.description });
}

function error(message: string, options?: ToastOptions) {
	heroToast.danger(message, { description: options?.description });
}

function info(message: string, options?: ToastOptions) {
	heroToast.info(message, { description: options?.description });
}

function warning(message: string, options?: ToastOptions) {
	heroToast.warning(message, { description: options?.description });
}

const toastActions = { success, error, info, warning };

export function useToast() {
	return { toast: toastActions };
}
