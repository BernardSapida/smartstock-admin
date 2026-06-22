import { useCallback, useEffect, useRef, useState } from "react";
import { APP_CONFIG } from "@/utils/config";

interface UseOtpFlowTimerOptions {
	otpExpiryMs?: number;
	resendCooldownMs?: number;
	maxResendAttempts?: number;
	longCooldownMs?: number; // New: 10 min cooldown after max attempts
	autoStart?: boolean;
}

export const useOtpFlowTimer = ({
	otpExpiryMs = APP_CONFIG.SIGNUP_OTP.OTP_EXPIRY_IN, // 3 minutes
	resendCooldownMs = APP_CONFIG.SIGNUP_OTP.OTP_RESEND_COOLDOWN, // 10 seconds
	maxResendAttempts = APP_CONFIG.SIGNUP_OTP.MAX_RESEND_ATTEMPTS, // 3
	longCooldownMs = APP_CONFIG.SIGNUP_OTP.OTP_LONG_COOLDOWN, // 10 minutes in milliseconds
	autoStart = true,
}: UseOtpFlowTimerOptions) => {
	// OTP expiry
	const [otpTimeLeftMs, setOtpTimeLeftMs] = useState(autoStart ? otpExpiryMs : 0);

	// resend logic
	const [resendAttempts, setResendAttempts] = useState(0);
	const [cooldownLeftMs, setCooldownLeftMs] = useState(autoStart ? resendCooldownMs : 0);
	const [isInLongCooldown, setIsInLongCooldown] = useState(false);

	const otpIntervalRef = useRef<NodeJS.Timeout | null>(null);
	const cooldownIntervalRef = useRef<NodeJS.Timeout | null>(null);

	// *** OTP EXPIRY TIMER ***
	useEffect(() => {
		if (otpTimeLeftMs <= 0) return;

		otpIntervalRef.current = setInterval(() => {
			setOtpTimeLeftMs((prev) => {
				if (prev <= 1000) {
					clearInterval(otpIntervalRef.current!);
					return 0;
				}
				return prev - 1000;
			});
		}, 1000);

		return () => clearInterval(otpIntervalRef.current!);
	}, [otpTimeLeftMs]);

	// *** COOLDOWN TIMER ***
	useEffect(() => {
		if (cooldownLeftMs <= 0) return;

		cooldownIntervalRef.current = setInterval(() => {
			setCooldownLeftMs((prev) => {
				if (prev <= 1000) {
					clearInterval(cooldownIntervalRef.current!);
					// If this was the long cooldown, reset attempts
					if (isInLongCooldown) {
						setResendAttempts(0);
						setIsInLongCooldown(false);
					}
					return 0;
				}
				return prev - 1000;
			});
		}, 1000);

		return () => clearInterval(cooldownIntervalRef.current!);
	}, [cooldownLeftMs, isInLongCooldown]);

	// *** ACTIONS ***
	const resendOtp = useCallback(() => {
		// Can't resend if in any cooldown or max attempts reached
		if (cooldownLeftMs > 0 || resendAttempts >= maxResendAttempts) {
			return false;
		}

		setResendAttempts((prev) => {
			const next = prev + 1;

			// If this is the 3rd attempt, trigger long cooldown
			if (next >= maxResendAttempts) {
				setCooldownLeftMs(longCooldownMs);
				setIsInLongCooldown(true);
			} else {
				// Normal 10-second cooldown
				setCooldownLeftMs(resendCooldownMs);
			}

			return next;
		});

		return true;
	}, [cooldownLeftMs, resendAttempts, maxResendAttempts, resendCooldownMs, longCooldownMs]);

	const restartOtpExpiry = useCallback(() => {
		setOtpTimeLeftMs(otpExpiryMs);
	}, [otpExpiryMs]);

	const resetFlow = useCallback(() => {
		setOtpTimeLeftMs(otpExpiryMs);
		setResendAttempts(0);
		setCooldownLeftMs(resendCooldownMs);
		setIsInLongCooldown(false);
	}, [otpExpiryMs, resendCooldownMs]);

	return {
		// limit
		maxResendAttempts,

		// OTP expiry
		otpTimeLeftMs,
		isOtpExpired: otpTimeLeftMs === 0,

		// resend
		resendAttempts,
		canResend: cooldownLeftMs === 0 && resendAttempts < maxResendAttempts && otpTimeLeftMs > 0,

		// cooldown
		cooldownLeftMs,
		isInCooldown: cooldownLeftMs > 0,
		isInLongCooldown,

		// actions
		resendOtp,
		restartOtpExpiry,
		resetFlow,
	};
};
