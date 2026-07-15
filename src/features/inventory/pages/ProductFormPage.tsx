import { Button, Description } from "@heroui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, PackageSearch } from "lucide-react";
import { type FormEvent, useEffect, useMemo } from "react";
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
import { useInventory } from "@/features/inventory/hooks/use-inventory";
import { fromBaseUnit, resolveDensity, SPOON_UNITS, unitInfo } from "@/lib/units";
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
	// Whether this (mass-stocked) item can be measured by spoon in recipes.
	spoonMeasurable: z.boolean(),
	// Weight of ONE level tablespoon, in grams - the cook-friendly way to enter what
	// is stored as a density. density (g/ml) = spoonGrams / (ml per tbsp). Nullable
	// so the field can be blank; required-when-enabled is enforced in onSubmit.
	spoonGrams: z.number().nullable(),
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

	// ml in one tablespoon / teaspoon / cup - from the single unit table, so the
	// grams-per-spoon maths never drifts from the recipe engine.
	const TBSP_ML = unitInfo("tbsp").factor;

	const { control, handleSubmit, setValue, setError } = useForm<FormValues>({
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
			// Editing reflects the product's EFFECTIVE state (explicit density or the
			// legacy name fallback), so an admin doesn't accidentally disable spoons by
			// saving. A NEW product starts off + blank - the admin types the weight.
			spoonMeasurable: editing ? resolveDensity(editing) != null : false,
			spoonGrams: editing
				? (() => {
						const d = resolveDensity(editing);
						return d != null ? Math.round(d * TBSP_ML * 100) / 100 : null;
					})()
				: null,
		},
	});

	const watchedUnit = useWatch({ control, name: "displayUnit" });
	const watchedMeasurable = useWatch({ control, name: "measurable" });
	const watchedSpoon = useWatch({ control, name: "spoonMeasurable" });
	const watchedSpoonGrams = useWatch({ control, name: "spoonGrams" });

	// Existing product names (lower-cased), for the duplicate check below.
	const { rows } = useInventory();
	const takenNames = useMemo(
		() => new Set(rows.map((r) => r.product.name.trim().toLowerCase()).filter(Boolean)),
		[rows],
	);

	const isPcs = watchedUnit === "pcs";
	const derivedMeta = deriveUnitMeta(watchedUnit);

	// Spoon measurement only applies to mass-stocked items -- the ml <-> g crossing.
	// A litre of oil already measures in ml, and pcs items are counted.
	const stocksByMass = watchedUnit != null && unitInfo(watchedUnit).base === "g";

	// When unit switches to non-pcs, auto-clear manual unitSize/usageUnit.
	useEffect(() => {
		if (derivedMeta) {
			setValue("unitSize", null);
			setValue("usageUnit", null);
		}
	}, [watchedUnit, derivedMeta, setValue]);

	const goBack = () => navigate({ to: "/admin/inventory" });

	const submitForm = handleSubmit(async (data) => {
		// Block duplicate names (case-insensitive). When editing, the product's own
		// name is obviously allowed.
		const nameKey = data.name.trim().toLowerCase();
		const isSelf = editing != null && editing.name.trim().toLowerCase() === nameKey;
		if (!isSelf && takenNames.has(nameKey)) {
			setError("name", { type: "manual", message: "A product with this name already exists." });
			return;
		}

		// Spoon toggle on -> a tablespoon weight is required (user types it).
		if (stocksByMass && data.spoonMeasurable && (data.spoonGrams == null || data.spoonGrams <= 0)) {
			setError("spoonGrams", { type: "manual", message: "Enter the weight of 1 tablespoon." });
			return;
		}

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
			// Store density (g/ml), derived from the tablespoon weight the user typed.
			// Toggle on -> spoonGrams / mlPerTbsp; toggle off -> 0, the explicit
			// "no spoons" marker that stops resolveDensity guessing by name; non-mass
			// -> null (never configured, may fall back by name for legacy data).
			density: stocksByMass ? (data.spoonMeasurable ? (data.spoonGrams as number) / TBSP_ML : 0) : null,
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

	// React Aria NumberField only writes its typed value into the form on blur,
	// and pressing "Save" doesn't blur the focused field in time -- so a plain
	// handleSubmit reads the PREVIOUSLY committed value (the save lagged one edit
	// behind). Blur the active element first to force the commit, then submit on
	// the next frame once that value has flushed into react-hook-form.
	const onSubmit = (e: FormEvent) => {
		e.preventDefault();
		(document.activeElement as HTMLElement | null)?.blur();
		requestAnimationFrame(() => void submitForm());
	};

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

						{/* Mass-stocked items: a toggle (like Measurable) lets a recipe use
						    spoons. We ask for the tablespoon WEIGHT - how a cook thinks -
						    and store it as a density under the hood. */}
						{stocksByMass && (
							<div className="space-y-4 border-t border-foreground/10 pt-4">
								<AppSwitch
									control={control}
									description={
										watchedSpoon
											? "Recipes can measure this item in tablespoons / teaspoons / cups."
											: "Turn on for powders and granules a recipe measures by spoon like sugar, salt, flour, baking soda, spices. Leave off for items you only ever weigh (meat, whole vegetables)."
									}
									label="Measurable by spoon (tbsp / tsp)"
									name="spoonMeasurable"
								/>

								{watchedSpoon && (
									<div className="space-y-3">
										<div>
											<AppNumberField
												control={control}
												formatOptions={{ minimumFractionDigits: 0, maximumFractionDigits: 2 }}
												isRequired
												label="Weight of 1 level tablespoon (g)"
												// minValue must be a multiple of step: React Aria snaps typed
												// values to the grid (minValue + k*step) on blur, so a min of
												// 0.01 with step 0.5 turned every entry into x.01 (13 -> 13.01).
												// The submit guard enforces > 0, so a min of 0 is safe here.
												minValue={0}
												name="spoonGrams"
												step={0.1}
											/>
											<Description className="text-xs text-foreground/50">
												Weigh one level tablespoon of this ingredient and enter the grams. We work out teaspoons and
												cups from it. (For reference: sugar ≈ 12.5 g, salt ≈ 18 g, flour ≈ 8 g.)
											</Description>
										</div>

										{watchedSpoonGrams != null && watchedSpoonGrams > 0 && (
											<div className="rounded-lg bg-foreground/5 px-4 py-3 text-sm text-foreground/60">
												Recipes may measure this as:{" "}
												{SPOON_UNITS.map((u, i) => (
													<span key={u}>
														{i > 0 && <span className="text-foreground/30"> · </span>}
														<span className="font-semibold text-foreground">
															1 {u} = {Math.round((unitInfo(u).factor / TBSP_ML) * watchedSpoonGrams * 100) / 100} g
														</span>
													</span>
												))}
											</div>
										)}
									</div>
								)}
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
