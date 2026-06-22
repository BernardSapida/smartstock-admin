import { Button, Modal, Spinner } from "@heroui/react";
import { useState } from "react";

interface AppAlertDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void | Promise<void>;
	title: string;
	description: string;
	confirmLabel?: string;
	cancelLabel?: string;
	variant?: "default" | "danger";
}

export function AppAlertDialog({
	isOpen,
	onClose,
	onConfirm,
	title,
	description,
	confirmLabel = "Confirm",
	cancelLabel = "Cancel",
	variant = "default",
}: AppAlertDialogProps) {
	const [isPending, setIsPending] = useState(false);

	const handleConfirm = async () => {
		setIsPending(true);
		try {
			await onConfirm();
			onClose();
		} finally {
			setIsPending(false);
		}
	};

	return (
		<Modal
			isOpen={isOpen}
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
		>
			<Modal.Backdrop>
				<Modal.Container>
					<Modal.Dialog className="sm:max-w-[400px]">
						<Modal.Header>
							<Modal.Heading>{title}</Modal.Heading>
						</Modal.Header>
						<Modal.Body>
							<p className="text-sm text-muted">{description}</p>
						</Modal.Body>
						<Modal.Footer className="flex gap-2 justify-end">
							<Button
								isDisabled={isPending}
								onPress={onClose}
								variant="tertiary"
							>
								{cancelLabel}
							</Button>
							<Button
								className={variant === "danger" ? "bg-danger text-white hover:bg-danger/90" : ""}
								isPending={isPending}
								onPress={handleConfirm}
								variant="primary"
							>
								{({ isPending: pending }) => (
									<>
										{pending && (
											<Spinner
												color="current"
												size="sm"
											/>
										)}
										{confirmLabel}
									</>
								)}
							</Button>
						</Modal.Footer>
					</Modal.Dialog>
				</Modal.Container>
			</Modal.Backdrop>
		</Modal>
	);
}
