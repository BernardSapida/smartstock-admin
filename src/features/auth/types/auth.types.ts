import type { UserStatus, UserType } from "@/types/enums";

export interface IUser {
	userId: string;
	phone: string;
	email: string | null;
	firstName: string;
	lastName: string;
	middleName: string | null;
	suffix: string | null;
	userType: UserType;
	status: UserStatus;
	isPhoneVerified: boolean;
	isEmailVerified: boolean;
	createdAt: string;
	updatedAt: string;
}

// *** REGISTER REQUEST / RESPOSE ***
export interface IRegisterRequest {
	phone: string;
	password: string;
	firstName: string;
	middleName: string;
	lastName: string;
	email: string;
	suffix: string;
	userType: string;
	acceptedTerms: boolean;
}

export interface IRegisterResponse {
	success: boolean;
	message: string;
	expiresIn: number;
	attemptRemaining: number;
}

// *** LOGIN REQUEST / RESPONSE ***
export interface ILoginRequest {
	identifier: string;
	password: string;
}

export interface ILoginResponse extends IAuthTokens {
	tokenType: string;
	user: IUser;
}

// *** LOGIN REQUEST / RESPONSE ***
export interface IAuthTokens {
	accessToken: string;
	refreshToken: string;
	expiresIn: number;
}

export interface IRefreshTokenResponse extends IAuthTokens {}

export interface ILogoutResponse {
	success: string;
	message: string;
	sessionsRevoked: number;
}

// TODO: Determine the decoded payload
export interface IJWTPayload extends IUser {
	sessionId: string;
	iat: number;
	exp: number;
}

// *** VERIFY OTP REQUEST / RESPONSE ***
export interface IVerifyOTPRequest {
	identifier: string;
	otp: string;
	purpose: "registration";
}

export interface IVerifyOTPResponse {
	success: boolean;
	message: string;
	accessToken: string;
	refreshToken: string;
	expiresIn: number;
	user: IUser;
}

// *** REQUEST OTP REQUEST / RESPONSE ***
export interface IRequestOTPRequest {
	identifier: string;
	purpose: string;
}

export interface IRequestOTPResponse {
	success: boolean;
	message: string;
	expiresIn: number;
}
