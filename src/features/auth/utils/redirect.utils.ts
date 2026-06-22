import { notFound, redirect } from "@tanstack/react-router";

/**
 * Redirect helper for authentication failures
 */
export function redirectToNotfound(): never {
	throw notFound();
}

/**
 * Redirect helper for authentication failures
 */
export function redirectToLogin(): never {
	throw redirect({
		href: "/login",
		code: 302,
	});
}

/**
 * Redirect helper for authorization failures
 */
export function redirectToUnauthorized(): never {
	throw redirect({
		href: "/unauthorized",
		code: 403,
	});
}

/**
 * Redirect helper for authenticated users accessing public pages
 */
export function redirectToDashboard(): never {
	throw redirect({
		href: "/dashboard",
		code: 302,
	});
}
