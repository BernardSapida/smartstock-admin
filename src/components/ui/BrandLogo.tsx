interface BrandLogoProps {
	className?: string;
}

/**
 * SmartStock brand mark — the logo image.
 * Size via className.
 */
export function BrandLogo({ className = "h-5 w-5" }: BrandLogoProps) {
	return (
		<img
			alt="SmartStock"
			className={`${className} object-contain`}
			src="/assets/smartstock.png"
		/>
	);
}
