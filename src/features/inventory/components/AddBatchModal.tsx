import { Button } from "@heroui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarDate, getLocalTimeZone, today } from "@internationalized/date";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AppDatePicker } from "@/components/form/AppDatePicker";
import { AppNumberField } from "@/components/form/AppNumberField";
import { AppTextField } from "@/components/form/AppTextField";
import { AppModal } from "@/components/ui/AppModal";
import type { Product } from "@/types/inventory";

interface Props {
	isOpen: boolean;
	onClose: () => void;
	product: Product;
	onSubmit: (values: { quantityDisplay: number; expirationDate: Date | null; location: string }) => Promise<void>;
}

const schema = z.object({
	quantity: z.number().positive("Enter a quantity greater than 0"),
	expirationDate: z.custom<CalendarDate>((v) => v instanceof CalendarDate).nullable(),
	location: z.string().trim(),
});

type FormValues = z.infer<typeof schema>;

/** Suggest an expiry date from the product's shelf life (editable - never auto-final). */
function suggestedExpiry(shelfLifeDays: number | null): CalendarDate | null {
	if (!shelfLifeDays) return null;
	return today(getLocalTimeZone()).add({ days: shelfLifeDays });
}

export function AddBatchModal({ isOpen, onClose, product, onSubmit }: Props) {
	const [saving, setSaving] = useState(false);

	const { control, handleSubmit, reset } = useForm<FormValues>({
		resolver: zodResolver(schema),
		mode: "onBlur",
		reValidateMode: "onChange",
		defaultValues: { quantity: 0, expirationDate: null, location: "" },
	});

	// Reset values and clear any stale validation errors each time the modal opens.
	useEffect(() => {
		if (!isOpen) return;
		reset({ quantity: 0, expirationDate: suggestedExpiry(product.shelfLifeDays), location: "" });
	}, [isOpen, product, reset]);

	const submit = handleSubmit(async (data) => {
		setSaving(true);
		try {
			await onSubmit({
				quantityDisplay: data.quantity,
				expirationDate: data.expirationDate ? data.expirationDate.toDate(getLocalTimeZone()) : null,
				location: data.location,
			});
			reset();
			onClose();
		} finally {
			setSaving(false);
		}
	});

	return (
		<AppModal
			footer={
				<div className="flex justify-end gap-2">
					<Button
						onPress={onClose}
						variant="ghost"
					>
						Cancel
					</Button>
					<Button
						isPending={saving}
						onPress={() => submit()}
						variant="primary"
					>
						Add batch
					</Button>
				</div>
			}
			isOpen={isOpen}
			onClose={onClose}
			title={`Add batch - ${product.name}`}
		>
			<form
				className="space-y-4"
				onSubmit={submit}
			>
				<AppNumberField
					control={control}
					isRequired
					label={`Quantity (${product.displayUnit})`}
					minValue={0}
					name="quantity"
				/>

				<AppDatePicker
					control={control}
					description={
						product.shelfLifeDays
							? "Pre-filled from shelf life - edit if the printed date differs."
							: "Leave blank if non-perishable."
					}
					label="Expiry date"
					name="expirationDate"
				/>

				<AppTextField
					control={control}
					label="Location"
					name="location"
					placeholder="optional - e.g. Fridge A"
				/>
			</form>
		</AppModal>
	);
}
