import { Button, Description } from "@heroui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, PackageSearch } from "lucide-react";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { notify } from "@/components/feedback";
import { AppAutocomplete } from "@/components/form/AppAutocomplete";
import { AppNumberField } from "@/components/form/AppNumberField";
import { AppSelect } from "@/components/form/AppSelect";
import { AppSwitch } from "@/components/form/AppSwitch";
import { AppTextField } from "@/components/form/AppTextField";
import { PRODUCT_CATEGORY_OPTIONS } from "@/config/categories.config";
import { useAuth } from "@/features/auth/context/AuthProvider";
import type { Actor, ProductInput } from "@/features/inventory/firebase/inventory.writes";
import { addProduct, updateProduct } from "@/features/inventory/firebase/inventory.writes";
import { fromBaseUnit, unitInfo } from "@/lib/units";
import type { Product } from "@/types/inventory";

// ── constants ────────────────────────────────────────────────────────────────

export const UNIT_OPTIONS = [
	{ value: "pcs", label: "pcs" },
	{ value: "g", label: "g" },
	{ value: "kg", label: "kg" },
	{ value: "ml", label: "ml" },
	{ value: "L", label: "L" },
	{ value: "tbsp", label: "tbsp" },
	{ value: "tsp", label: "tsp" },
	{ value: "cup", label: "cup" },
	{ value: "oz", label: "oz" },
];

const USAGE_UNIT_OPTIONS = [
	{ value: "ml", label: "ml - small volume (e.g. soy sauce, vinegar)" },
	{ value: "L", label: "L - large volume (e.g. cooking oil, water)" },
	{ value: "g", label: "g - small weight (e.g. tomato paste, liver spread)" },
	{ value: "kg", label: "kg - large weight (e.g. bulk ingredients)" },
];

// ── helpers ──────────────────────────────────────────────────────────────────

/** Returns auto-derived unitSize + usageUnit for non-pcs display units, or null for pcs. */
function deriveUnitMeta(displayUnit: string | null): { unitSize: number; usageUnit: string } | null {
	if (!displayUnit || displayUnit === "pcs") return null;
	const { base, factor } = unitInfo(displayUnit);
	if (base === "piece") return null;
	return { unitSize: factor, usageUnit: base };
}

// ── schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
	name: z.string().trim().min(1, "Name is required"),
	category: z
		.string()
		.nullable()
		.refine((v) => v !== null && v !== "", "Category is required"),
	displayUnit: z
		.string()
		.nullable()
		.refine((v) => v !== null && v !== "", "Select a unit"),
	minimumThreshold: z.number().nonnegative("Must be 0 or greater"),
	shelfLifeDays: z.number().int("Must be a whole number").nonnegative("Must be 0 or greater"),
	measurable: z.boolean(),
	// Only used when displayUnit = "pcs" and measurable = true
	unitSize: z.number().nullable(),
	usageUnit: z.string().nullable(),
});

type FormValues = z.infer<typeof schema>;

// ── component ────────────────────────────────────────────────────────────────

interface Props {
	editing?: Product;
}

export function ProductFormPage({ editing }: Props) {
	const navigate = useNavigate();
	const { profile } = useAuth();

	const actor: Actor = {
		uid: profile?.uid ?? "",
		name: profile?.fullName || profile?.email || "admin",
		role: profile?.role ?? "admin",
	};

	const { control, handleSubmit, setValue } = useForm<FormValues>({
		resolver: zodResolver(schema),
		mode: "onBlur",
		reValidateMode: "onChange",
		defaultValues: {
			name: editing?.name ?? "",
			category: editing?.category ?? null,
			displayUnit: editing?.displayUnit ?? null,
			minimumThreshold:
				editing?.minimumThreshold != null ? fromBaseUnit(editing.minimumThreshold, editing.displayUnit) : 0,
			shelfLifeDays: editing?.shelfLifeDays ?? 0,
			measurable: editing?.measurable ?? false,
			unitSize: editing?.unitSize ?? null,
			usageUnit: editing?.usageUnit ?? null,
		},
	});

	const watchedUnit = useWatch({ control, name: "displayUnit" });
	const watchedMeasurable = useWatch({ control, name: "measurable" });

	const isPcs = watchedUnit === "pcs";
	const derivedMeta = deriveUnitMeta(watchedUnit);

	// When unit switches to non-pcs, auto-clear manual unitSize/usageUnit.
	useEffect(() => {
		if (derivedMeta) {
			setValue("unitSize", null);
			setValue("usageUnit", null);
		}
	}, [watchedUnit, derivedMeta, setValue]);

	const goBack = () => navigate({ to: "/admin/inventory" });

	const onSubmit = handleSubmit(async (data) => {
		const meta = deriveUnitMeta(data.displayUnit);
		const input: ProductInput = {
			name: data.name,
			category: data.category ?? "",
			displayUnit: data.displayUnit ?? "pcs",
			minimumThresholdDisplay: data.minimumThreshold,
			shelfLifeDays: data.shelfLifeDays,
			measurable: data.measurable,
			unitSize: meta ? meta.unitSize : data.measurable ? data.unitSize : null,
			usageUnit: meta ? meta.usageUnit : data.measurable ? data.usageUnit : "pcs",
		};

		try {
			if (editing) {
				await updateProduct(editing.id, input, actor);
				notify.success({ title: "Product updated", description: "Your changes have been saved." });
			} else {
				await addProduct(input, actor);
				notify.success({ title: "Product added", description: `${data.name} is now in your inventory.` });
			}
			goBack();
		} catch (e) {
			notify.danger({
				title: "Save failed",
				description: e instanceof Error ? e.message : "Could not save the product. Please try again.",
			});
		}
	});

	return (
		<div className="space-y-8">
			{/* ── header ─────────────────────────────────────────────────────── */}
			<div className="flex items-center gap-3">
				<Button
					onPress={goBack}
					size="sm"
					variant="ghost"
				>
					<ArrowLeft className="mr-1 h-4 w-4" />
					Back to Inventory
				</Button>
			</div>

			<div className="flex items-center gap-3">
				<PackageSearch className="h-7 w-7 text-app-brand" />
				<div>
					<h1 className="text-2xl font-bold text-foreground">{editing ? `Edit: ${editing.name}` : "Add Product"}</h1>
					<p className="text-sm text-foreground/60">
						{editing ? "Update the product details below." : "Fill in the details to add a new product to inventory."}
					</p>
				</div>
			</div>

			{/* ── form ───────────────────────────────────────────────────────── */}
			<form
				className="space-y-6"
				onSubmit={onSubmit}
			>
				{/* Section: Basic info */}
				<div className="space-y-1">
					<p className="text-xs font-semibold uppercase tracking-widest text-foreground/40">Basic info</p>
					<div className="rounded-xl border border-foreground/10 p-4 space-y-4">
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
						</div>
					</div>
				</div>

				{/* Section: Unit & thresholds */}
				<div className="space-y-1">
					<p className="text-xs font-semibold uppercase tracking-widest text-foreground/40">Unit & thresholds</p>
					<div className="rounded-xl border border-foreground/10 p-4 space-y-4">
						<div>
							<AppSelect
								control={control}
								isRequired
								items={UNIT_OPTIONS}
								label="Display unit"
								name="displayUnit"
								placeholder="Select a unit"
							/>
							<Description className="text-xs text-foreground/50">
								Stock is stored in the base unit (g / ml / piece). You enter and view quantities in this unit.
							</Description>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<AppNumberField
								control={control}
								label={`Min. threshold${watchedUnit ? ` (${watchedUnit})` : ""}`}
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
					</div>
				</div>

				{/* Section: Measurable */}
				<div className="space-y-1">
					<p className="text-xs font-semibold uppercase tracking-widest text-foreground/40">Measurement</p>
					<div className="rounded-xl border border-foreground/10 p-4 space-y-4">
						<AppSwitch
							control={control}
							description={
								watchedMeasurable
									? "This item can be used in recipes with volume or weight units."
									: "This item is always counted in whole pieces in recipes (e.g. egg, garlic)."
							}
							label="Measurable"
							name="measurable"
						/>

						{/* Non-pcs: auto-derived, just show an info note */}
						{watchedMeasurable && derivedMeta && (
							<div className="rounded-lg bg-foreground/5 px-4 py-3 text-sm text-foreground/60">
								Auto-derived from unit:{" "}
								<span className="font-semibold text-foreground">
									1 {watchedUnit} = {derivedMeta.unitSize} {derivedMeta.usageUnit}
								</span>
								. This will be used by recipes and the used-stock system automatically.
							</div>
						)}

						{/* pcs + measurable: manual entry */}
						{watchedMeasurable && isPcs && (
							<div className="space-y-4">
								<div className="grid grid-cols-2 gap-4">
									<div>
										<AppNumberField
											control={control}
											formatOptions={{ minimumFractionDigits: 0, maximumFractionDigits: 3 }}
											isRequired
											label="Unit size"
											minValue={0.001}
											name="unitSize"
											step={0.001}
										/>
										<Description className="text-xs text-foreground/50">
											Specify how many units (ml or g) are in each piece - e.g. a 750 ml bottle of soy sauce.
										</Description>
									</div>
									<AppSelect
										control={control}
										isRequired
										items={USAGE_UNIT_OPTIONS}
										label="Usage unit"
										name="usageUnit"
										placeholder="Select"
									/>
								</div>
							</div>
						)}
					</div>
				</div>

				{/* ── footer actions ─────────────────────────────────────────── */}
				<div className="flex items-center justify-end gap-3 pt-2">
					<Button
						className="w-full"
						onPress={goBack}
						size="lg"
						type="button"
						variant="ghost"
					>
						Cancel
					</Button>
					<Button
						className="w-full bg-app-brand"
						size="lg"
						type="submit"
						variant="primary"
					>
						{editing ? "Save changes" : "Add product"}
					</Button>
				</div>
			</form>
		</div>
	);
}
