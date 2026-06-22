import { create } from "zustand";
import type { SignupStoreState } from "@/features/auth/types/input.types";
import { credentialFormSchema } from "../validations/schema/auth";

export const defaultValues: SignupStoreState = {
	firstName: "",
	middleName: "",
	lastName: "",
	suffix: "",
	phoneNumber: "",
	email: "",
	password: "",
	verificationCode: "",
	currentStep: 1,
};

export const useSignupStore = create<SignupStoreState>()(() => ({
	...defaultValues,
}));

export const resetStore = () => {
	useSignupStore.setState(defaultValues);
};

export const setValue = <K extends keyof SignupStoreState>(key: K, value: SignupStoreState[K]) => {
	useSignupStore.setState((state) => ({ ...state, [key]: value }));
};

// Derived state selector
export const selectCompletedSteps = (state: SignupStoreState): Record<number, boolean> => ({
	1: credentialFormSchema.safeParse(state).success,
	2: true, // Step 2 (OTP) handled by OTPForm internally, but needs a value for Tracker/Buttons
});

// For backward compatibility or direct state access
export const signupStore = {
	get state() {
		return useSignupStore.getState();
	},
	setState: useSignupStore.setState,
};
