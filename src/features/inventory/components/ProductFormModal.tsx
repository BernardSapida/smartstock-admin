import { Button, Description, Label } from "@heroui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AppAutocomplete } from "@/components/form/AppAutocomplete";
import { AppNumberField } from "@/components/form/AppNumberField";
import { AppTextField } from "@/components/form/AppTextField";
import { AppModal } from "@/components/ui/AppModal";
import { PRODUCT_CATEGORY_OPTIONS } from "@/config/categories.config";
import { fromBaseUnit } from "@/lib/units";
import type { Product } from "@/types/inventory";

export const UNIT_OPTIONS = ["pcs", "g", "kg", "ml", "L", "tbsp", "tsp", "cup", "oz"] as const;

const schema = z.object({
	name: z.string().trim().min(1, "Name is required"),
	category: z.string().trim().min(1, "Category is required"),
	minimumThreshold: z.number().nonnegative("Must be 0 or greater"),
	shelfLifeDays: z.number().int("Must be a whole number").nonnegative("Must be 0 or greater"),
	barcode: z.string().trim(),
});

type FormValues = z.infer<typeof schema>;

export interface ProductFormSubmit {
	name: string;
	category: string;
	displayUnit: string;
	minimumThresholdDisplay: number | null;
	shelfLifeDays: number | null;
	barcode: string;
}

interface Props {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (values: ProductFormSubmit) => Promise<void>;
	editing?: Product | null;
}

export function ProductFormModal({ isOpen, onClose, onSubmit, editing }: Props) {
	const [unit, setUnit] = useState<string>(editing?.displayUnit ?? "pcs");
	const [saving, setSaving] = useState(false);

	const { control, handleSubmit, reset } = useForm<FormValues>({
		resolver: zodResolver(schema),
		mode: "onBlur",
		reValidateMode: "onChange",
		defaultValues: { name: "", category: "", minimumThreshold: 0, shelfLifeDays: 0, barcode: "" },
	});

	// Reset values and clear any stale validation errors each time the modal opens.
	useEffect(() => {
		if (!isOpen) return;
		setUnit(editing?.displayUnit ?? "pcs");
		reset({
			name: editing?.name ?? "",
			category: editing?.category ?? "",
			minimumThreshold:
				editing?.minimumThreshold != null ? fromBaseUnit(editing.minimumThreshold, editing.displayUnit) : 0,
			shelfLifeDays: editing?.shelfLifeDays ?? 0,
			barcode: editing?.barcode ?? "",
		});
	}, [isOpen, editing, reset]);

	const submit = handleSubmit(async (data) => {
		setSaving(true);
		try {
			await onSubmit({
				name: data.name,
				category: data.category,
				displayUnit: unit,
				minimumThresholdDisplay: data.minimumThreshold,
				shelfLifeDays: data.shelfLifeDays,
				barcode: data.barcode,
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
						{editing ? "Save changes" : "Add product"}
					</Button>
				</div>
			}
			isOpen={isOpen}
			onClose={onClose}
			size="lg"
			title={editing ? "Edit product" : "Add product"}
		>
			<form
				className="space-y-4"
				onSubmit={submit}
			>
				<AppTextField
					control={control}
					isRequired
					label="Name"
					name="name"
					placeholder="e.g. Chicken Breast"
				/>

				<AppAutocomplete
					control={control}
					isRequired
					items={PRODUCT_CATEGORY_OPTIONS}
					label="Category"
					name="category"
					placeholder="Select a category"
				/>

				<div>
					<Label className="font-semibold">Unit</Label>
					<div className="mt-1 flex flex-wrap gap-2">
						{UNIT_OPTIONS.map((u) => (
							<Button
								key={u}
								onPress={() => setUnit(u)}
								size="sm"
								type="button"
								variant={u === unit ? "primary" : "ghost"}
							>
								{u}
							</Button>
						))}
					</div>
					<Description className="mt-1 block text-xs text-foreground/50">
						Stock is stored in the base unit; you enter and view in this unit.
					</Description>
				</div>

				<div className="grid grid-cols-2 gap-4">
					<AppNumberField
						control={control}
						label={`Min. threshold (${unit})`}
						minValue={0}
						name="minimumThreshold"
					/>
					<AppNumberField
						control={control}
						label="Shelf life (days)"
						minValue={0}
						name="shelfLifeDays"
						step={1}
					/>
				</div>

				<AppTextField
					control={control}
					label="Barcode"
					name="barcode"
					placeholder="optional"
				/>
			</form>
		</AppModal>
	);
}
