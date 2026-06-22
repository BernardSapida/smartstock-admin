export type UserType = "ADMIN" | "USER";

export enum UserStatus {
	ACTIVE = "active",
	SUSPENDED = "suspended",
	DELETED = "deleted",
	PENDING_VERIFICATION = "pending_verification",
}
