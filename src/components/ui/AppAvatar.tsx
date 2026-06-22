import { Avatar, Badge } from "@heroui/react";
import type { ComponentProps, ReactNode } from "react";

type AvatarSize = ComponentProps<typeof Avatar>["size"];
type BadgeColor = ComponentProps<typeof Badge>["color"];

interface AppAvatarProps {
	name: string;
	src?: string;
	badge?: { color?: BadgeColor; content?: ReactNode };
	size?: AvatarSize;
	className?: string;
}

function getInitials(name: string): string {
	const words = name.trim().split(/\s+/);
	if (words.length === 1) return words[0].charAt(0).toUpperCase();
	return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
}

export function AppAvatar({ name, src, badge, size, className }: AppAvatarProps) {
	const avatar = (
		<Avatar
			className={className}
			size={size}
		>
			{src && (
				<Avatar.Image
					alt={name}
					src={src}
				/>
			)}
			<Avatar.Fallback>{getInitials(name)}</Avatar.Fallback>
		</Avatar>
	);

	if (!badge) return avatar;

	return (
		<Badge.Anchor>
			{avatar}
			<Badge
				color={badge.color ?? "success"}
				placement="bottom-right"
			>
				{badge.content}
			</Badge>
		</Badge.Anchor>
	);
}
