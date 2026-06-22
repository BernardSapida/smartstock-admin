import { Modal } from "@heroui/react";
import type { ComponentProps, ReactNode } from "react";

type ModalSize = ComponentProps<typeof Modal.Container>["size"];

interface AppModalProps {
	isOpen: boolean;
	onClose: () => void;
	title: string;
	children: ReactNode;
	footer?: ReactNode;
	size?: ModalSize;
	isDismissable?: boolean;
	className?: string;
}

export function AppModal({
	isOpen,
	onClose,
	title,
	children,
	footer,
	size,
	isDismissable = true,
	className,
}: AppModalProps) {
	return (
		<Modal
			isOpen={isOpen}
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
		>
			<Modal.Backdrop isDismissable={isDismissable}>
				<Modal.Container size={size}>
					<Modal.Dialog className={className}>
						<Modal.CloseTrigger />
						<Modal.Header>
							<Modal.Heading>{title}</Modal.Heading>
						</Modal.Header>
						<Modal.Body className="overflow-y-auto">{children}</Modal.Body>
						{footer && <Modal.Footer>{footer}</Modal.Footer>}
					</Modal.Dialog>
				</Modal.Container>
			</Modal.Backdrop>
		</Modal>
	);
}
