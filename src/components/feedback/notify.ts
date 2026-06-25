import { toast } from "@heroui/react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { createElement, type ReactNode } from "react";

/**
 * Centralized toast helper.
 *
 * Every toast in the admin app must have an icon, a title and a description -
 * all three are required. This wrapper enforces that at the type level
 * (`title` + `description` are mandatory) and always supplies a
 * variant-appropriate icon, so call sites cannot accidentally fire a bare,
 * icon-less or description-less toast.
 */

type Variant = "success" | "danger" | "info" | "warning";

/** Options accepted by HeroUI's `toast.<variant>` (description, actionProps, isLoading, timeout, onClose ...). */
type HeroUIOptions = NonNullable<Parameters<typeof toast.success>[1]>;

const defaultIndicator: Record<Variant, ReactNode> = {
	success: createElement(CheckCircle2, { className: "h-5 w-5" }),
	danger: createElement(XCircle, { className: "h-5 w-5" }),
	info: createElement(Info, { className: "h-5 w-5" }),
	warning: createElement(AlertTriangle, { className: "h-5 w-5" }),
};

export interface NotifyOptions extends Omit<HeroUIOptions, "description" | "indicator"> {
	/** Bold headline shown on the toast. Required. */
	title: ReactNode;
	/** Supporting line shown under the title. Required. */
	description: ReactNode;
	/** Optional icon override; defaults to a variant-appropriate icon. */
	indicator?: ReactNode;
}

function show(variant: Variant, { title, description, indicator, ...rest }: NotifyOptions): string {
	return toast[variant](title, {
		description,
		indicator: indicator ?? defaultIndicator[variant],
		...rest,
	});
}

export const notify = {
	success: (options: NotifyOptions) => show("success", options),
	danger: (options: NotifyOptions) => show("danger", options),
	/** Alias for `danger`. */
	error: (options: NotifyOptions) => show("danger", options),
	info: (options: NotifyOptions) => show("info", options),
	warning: (options: NotifyOptions) => show("warning", options),
};
