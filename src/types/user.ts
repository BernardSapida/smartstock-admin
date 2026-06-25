// Shared user model - MUST match the `users` collection used by
// inventory-native and inventory-backend (one backend, one schema).
// Roles are lowercase: 'admin' | 'staff'.

export type UserRole = "admin" | "staff";

export interface AppUser {
	uid: string;
	email: string;
	fullName: string;
	role: UserRole;
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
