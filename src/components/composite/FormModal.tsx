import { Button, Modal, Spinner } from "@heroui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import type { Control, DefaultValues, FieldValues, Resolver } from "react-hook-form";
import { useForm } from "react-hook-form";
import type { ZodType } from "zod";

interface FormModalProps<T extends FieldValues> {
	isOpen: boolean;
	onClose: () => void;
	title: string;
	onSubmit: (values: T) => Promise<void>;
	schema: ZodType<T, FieldValues>;
	defaultValues?: DefaultValues<T>;
	children: (control: Control<T>) => React.ReactNode;
	submitLabel?: string;
	size?: "sm" | "md" | "lg" | "xl" | "full";
}

export function FormModal<T extends FieldValues>({
	isOpen,
	onClose,
	title,
	onSubmit,
	schema,
	defaultValues,
	children,
	submitLabel = "Save",
}: FormModalProps<T>) {
	const {
		control,
		handleSubmit,
		reset,
		formState: { isSubmitting },
	} = useForm<T>({
		resolver: zodResolver(schema) as Resolver<T>,
		defaultValues,
		mode: "onTouched",
		reValidateMode: "onChange",
	});

	useEffect(() => {
		if (!isOpen) reset(defaultValues);
	}, [isOpen, defaultValues, reset]);

	const handleFormSubmit = handleSubmit(async (values) => {
		await onSubmit(values);
	});

	return (
		<Modal
			isOpen={isOpen}
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
		>
			<Modal.Backdrop>
				<Modal.Container>
					<Modal.Dialog>
						<form onSubmit={handleFormSubmit}>
							<Modal.Header>
								<Modal.Heading>{title}</Modal.Heading>
							</Modal.Header>
							<Modal.Body className="flex flex-col gap-4 overflow-y-auto">{children(control)}</Modal.Body>
							<Modal.Footer className="flex gap-2 justify-end">
								<Button
									isDisabled={isSubmitting}
									onPress={onClose}
									type="button"
									variant="tertiary"
								>
									Cancel
								</Button>
								<Button
									isPending={isSubmitting}
									type="submit"
									variant="primary"
								>
									{({ isPending }) => (
										<>
											{isPending && (
												<Spinner
													color="current"
													size="sm"
												/>
											)}
											{submitLabel}
										</>
									)}
								</Button>
							</Modal.Footer>
						</form>
					</Modal.Dialog>
				</Modal.Container>
			</Modal.Backdrop>
		</Modal>
	);
}
