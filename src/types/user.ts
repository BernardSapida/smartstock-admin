// Shared user model - MUST match the `users` collection used by
// inventory-native and inventory-backend (one backend, one schema).
// Roles are lowercase: 'admin' | 'staff'.

export type UserRole = "admin" | "staff";

// A brand-new signup starts 'pending' and is blocked from logging in until an
// admin approves it (Settings > Users). isActive/isArchived stay separate -
// they're the admin's post-approval on/off toggle, not the initial gate.
export type UserStatus = "pending" | "active" | "rejected";

export interface AppUser {
	uid: string;
	email: string;
	fullName: string;
	role: UserRole;
	status: UserStatus;
	phoneNumber: string;
	unitPreference: string;
	isActive: boolean;
	shiftOn: boolean;
	isArchived: boolean;
	permissions: Record<string, boolean>;
	photoUrl?: string;
	createdAt?: Date;
	lastActive?: Date;
	archivedAt?: Date;
}

export const DEFAULT_PERMISSIONS: Record<UserRole, Record<string, boolean>> = {
	admin: {
		inventoryView: true,
		inventoryAdjust: true,
		recipePrepare: true,
		inspectionSubmit: true,
		notificationsView: true,
		forecastView: true,
		staffManage: true,
	},
	staff: {
		inventoryView: true,
		inventoryAdjust: true,
		recipePrepare: true,
		inspectionSubmit: true,
		notificationsView: true,
		forecastView: false,
		staffManage: false,
	},
};
