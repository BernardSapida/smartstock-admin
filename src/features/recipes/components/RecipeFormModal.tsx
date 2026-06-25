import { Button, FieldError, Label } from "@heroui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { type Control, useFieldArray, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { AppAutocomplete } from "@/components/form/AppAutocomplete";
import { AppNumberField } from "@/components/form/AppNumberField";
import { AppSelect } from "@/components/form/AppSelect";
import { AppTextArea } from "@/components/form/AppTextArea";
import { AppTextField } from "@/components/form/AppTextField";
import { AppModal } from "@/components/ui/AppModal";
import { UNIT_OPTIONS } from "@/features/inventory/components/ProductFormModal";
import { allowedUnitsForProduct } from "@/lib/units";
import type { Product } from "@/types/inventory";
import { RECIPE_CATEGORIES, type Recipe, type RecipeIngredient } from "@/types/recipe";

const ingredientSchema = z.object({
	name: z
		.string()
		.nullable()
		.refine((v) => v !== null && v !== "", "Select an ingredient"),
	quantity: z.number({ error: "Quantity is required" }).positive("Must be greater than 0"),
	unit: z
		.string()
		.nullable()
		.refine((v) => v !== null && v !== "", "Select a unit"),
});

const schema = z.object({
	name: z.string().trim().min(1, "Recipe name is required"),
	category: z.string().trim().min(1, "Category is required"),
	servingSize: z.number().int("Must be a whole number").positive("Must be at least 1"),
	instructions: z.string().trim().min(1, "Instructions are required"),
	ingredients: z.array(ingredientSchema).min(1, "Add at least one ingredient"),
});

const RECIPE_CATEGORY_OPTIONS = RECIPE_CATEGORIES.map((c) => ({ value: c, label: c }));

type FormValues = z.infer<typeof schema>;

interface Props {
	isOpen: boolean;
	onClose: () => void;
	editing?: Recipe | null;
	/** Inventory products used to power the ingredient autocomplete + unit options. */
	products: Product[];
	onSubmit: (values: {
		name: string;
		category: string;
		servingSize: number;
		instructions: string;
		ingredients: RecipeIngredient[];
	}) => Promise<void>;
}

const UNIT_FALLBACK_OPTIONS = UNIT_OPTIONS.map((u) => ({ value: u, label: u }));

const newRow = () => ({ name: null, quantity: 1, unit: null });

export function RecipeFormModal({ isOpen, onClose, editing, products, onSubmit }: Props) {
	const {
		control,
		handleSubmit,
		reset,
		setValue,
		formState: { isSubmitting, errors },
	} = useForm<FormValues>({
		resolver: zodResolver(schema),
		mode: "onBlur",
		reValidateMode: "onChange",
		defaultValues: { name: "", category: RECIPE_CATEGORIES[1], servingSize: 1, instructions: "", ingredients: [] },
	});

	const { fields, append, remove } = useFieldArray({ control, name: "ingredients" });

	// Array-level error (e.g. "Add at least one ingredient") lives on the root.
	const ingredientsError = errors.ingredients?.root?.message ?? errors.ingredients?.message;

	// Map a product name (lowercased) -> product, for unit lookups by row.
	// The migration can split one item into two products that share a name (a real
	// measured one + a "piece/pcs" default from a source row that had no unit), so
	// on a name collision prefer the measured product to autofill the correct unit.
	const productByName = useMemo(() => {
		const m = new Map<string, Product>();
		for (const p of products) {
			const key = p.name.trim().toLowerCase();
			const existing = m.get(key);
			if (!existing || (existing.baseUnit === "piece" && p.baseUnit !== "piece")) m.set(key, p);
		}
		return m;
	}, [products]);

	// Autocomplete options: all products, plus any legacy ingredient names on the
	// recipe being edited that no longer match a product (so they still display).
	const productOptions = useMemo(() => {
		const names = new Set(products.map((p) => p.name));
		for (const ing of editing?.ingredients ?? []) names.add(ing.name);
		return Array.from(names)
			.sort((a, b) => a.localeCompare(b))
			.map((name) => ({ value: name, label: name }));
	}, [products, editing]);

	useEffect(() => {
		if (!isOpen) return;
		reset({
			name: editing?.name ?? "",
			category:
				editing && RECIPE_CATEGORIES.includes(editing.category as (typeof RECIPE_CATEGORIES)[number])
					? editing.category
					: RECIPE_CATEGORIES[1],
			servingSize: editing?.servingSize ?? 1,
			instructions: editing?.instructions ?? "",
			ingredients: editing
				? editing.ingredients.map((i) => ({
						name: i.name,
						quantity: i.quantityPerServing > 0 ? i.quantityPerServing : 1,
						unit: i.unit,
					}))
				: [],
		});
	}, [isOpen, editing, reset]);

	const submit = handleSubmit(async (data) => {
		await onSubmit({
			name: data.name,
			category: data.category,
			servingSize: data.servingSize,
			instructions: data.instructions,
			ingredients: data.ingredients.map<RecipeIngredient>((r) => ({
				name: (r.name ?? "").trim(),
				quantityPerServing: r.quantity,
				unit: r.unit ?? "",
				legacyRefId: null,
			})),
		});
		onClose();
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
						isPending={isSubmitting}
						onPress={() => submit()}
						variant="primary"
					>
						{editing ? "Save changes" : "Create recipe"}
					</Button>
				</div>
			}
			isOpen={isOpen}
			onClose={onClose}
			size="cover"
			title={editing ? "Edit recipe" : "New recipe"}
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
					placeholder="e.g. Chicken Adobo"
				/>

				<div className="grid grid-cols-2 gap-4">
					<AppAutocomplete
						control={control}
						isRequired
						items={RECIPE_CATEGORY_OPTIONS}
						label="Category"
						name="category"
						placeholder="Select a category"
					/>
					<AppNumberField
						control={control}
						isRequired
						label="Serving size (yields)"
						minValue={1}
						name="servingSize"
						step={1}
					/>
				</div>

				<div>
					<div className="flex items-center justify-between">
						<Label className="font-semibold">Ingredients (per serving)</Label>
						<Button
							onPress={() => append(newRow())}
							size="sm"
							type="button"
							variant="ghost"
						>
							<Plus className="mr-1 h-4 w-4" />
							Add
						</Button>
					</div>
					<p className="mb-2 text-xs text-foreground/50">
						Pick a product from inventory. Its unit is pre-filled and can be changed within the same measure.
					</p>
					<div className="space-y-3">
						{fields.map((f, i) => (
							<IngredientRow
								control={control}
								index={i}
								key={f.id}
								onRemove={() => remove(i)}
								options={productOptions}
								productByName={productByName}
								setValue={setValue}
							/>
						))}
					</div>
					{ingredientsError && <FieldError className="mt-2">{ingredientsError}</FieldError>}
				</div>

				<AppTextArea
					control={control}
					isRequired
					label="Instructions"
					name="instructions"
					placeholder="Step-by-step instructions..."
					rows={4}
				/>
			</form>
		</AppModal>
	);
}

interface IngredientRowProps {
	control: Control<FormValues>;
	index: number;
	options: { value: string; label: string }[];
	productByName: Map<string, Product>;
	setValue: ReturnType<typeof useForm<FormValues>>["setValue"];
	onRemove: () => void;
}

function IngredientRow({ control, index, options, productByName, setValue, onRemove }: IngredientRowProps) {
	const name = useWatch({ control, name: `ingredients.${index}.name` });
	const product = name ? productByName.get(name.trim().toLowerCase()) : undefined;

	const unitOptions = product
		? allowedUnitsForProduct(product).map((u) => ({ value: u, label: u }))
		: UNIT_FALLBACK_OPTIONS;

	// When the selected product changes, snap the unit to its display unit.
	const prevName = useRef(name);
	useEffect(() => {
		if (name === prevName.current) return;
		prevName.current = name;
		if (product) {
			setValue(`ingredients.${index}.unit`, product.displayUnit, { shouldValidate: true, shouldDirty: true });
		}
	}, [name, product, index, setValue]);

	return (
		<div className="grid grid-cols-[1fr_1fr_1fr_auto] items-start gap-2">
			<AppAutocomplete
				control={control}
				isRequired
				items={options}
				label="Ingredient"
				name={`ingredients.${index}.name`}
				placeholder="Select a product"
			/>
			<AppNumberField
				control={control}
				isRequired
				label="Quantity"
				minValue={0}
				name={`ingredients.${index}.quantity`}
			/>
			<AppSelect
				control={control}
				isRequired
				items={unitOptions}
				label="Unit"
				name={`ingredients.${index}.unit`}
				placeholder="Unit"
			/>
			<Button
				aria-label="Remove"
				className="mt-6"
				isIconOnly
				onPress={onRemove}
				size="sm"
				type="button"
				variant="ghost"
			>
				<Trash2 className="h-4 w-4 text-danger" />
			</Button>
		</div>
	);
}
