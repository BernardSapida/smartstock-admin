import { Button, FieldError, Label } from "@heroui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ChefHat, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { type Control, useFieldArray, useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { notify } from "@/components/feedback";
import { AppAutocomplete } from "@/components/form/AppAutocomplete";
import { AppNumberField } from "@/components/form/AppNumberField";
import { AppSelect } from "@/components/form/AppSelect";
import { AppTextArea } from "@/components/form/AppTextArea";
import { AppTextField } from "@/components/form/AppTextField";
import { useAuth } from "@/features/auth/context/AuthProvider";
import type { Actor } from "@/features/inventory/firebase/inventory.writes";
import { addRecipe, updateRecipe } from "@/features/recipes/firebase/recipes.firebase";
import { allowedUnitsForProduct } from "@/lib/units";
import type { Product } from "@/types/inventory";
import { RECIPE_CATEGORIES, type Recipe, type RecipeIngredient } from "@/types/recipe";

// ── constants ────────────────────────────────────────────────────────────────

const RECIPE_CATEGORY_OPTIONS = RECIPE_CATEGORIES.map((c) => ({ value: c, label: c }));

const ALL_UNIT_OPTIONS = [
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

// ── schema ───────────────────────────────────────────────────────────────────

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
	category: z
		.string()
		.nullable()
		.refine((v) => v !== null && v !== "", "Category is required"),
	servingSize: z.number().int("Must be a whole number").positive("Must be at least 1"),
	instructions: z.string().trim().min(1, "Instructions are required"),
	ingredients: z.array(ingredientSchema).min(1, "Add at least one ingredient"),
});

type FormValues = z.infer<typeof schema>;

// ── helpers ──────────────────────────────────────────────────────────────────

const newRow = () => ({ name: null, quantity: 1, unit: null });

// ── component ────────────────────────────────────────────────────────────────

interface Props {
	editing?: Recipe;
	products: Product[];
}

export function RecipeFormPage({ editing, products }: Props) {
	const navigate = useNavigate();
	const { profile } = useAuth();

	const actor: Actor = {
		uid: profile?.uid ?? "",
		name: profile?.fullName || profile?.email || "admin",
		role: profile?.role ?? "admin",
	};

	const {
		control,
		handleSubmit,
		setValue,
		formState: { isSubmitting, errors },
	} = useForm<FormValues>({
		resolver: zodResolver(schema),
		mode: "onBlur",
		reValidateMode: "onChange",
		defaultValues: {
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
		},
	});

	const { fields, append, remove } = useFieldArray({ control, name: "ingredients" });
	const ingredientsError = errors.ingredients?.root?.message ?? errors.ingredients?.message;

	const productByName = useMemo(() => {
		const m = new Map<string, Product>();
		for (const p of products) {
			const key = p.name.trim().toLowerCase();
			const existing = m.get(key);
			if (!existing || (existing.baseUnit === "piece" && p.baseUnit !== "piece")) m.set(key, p);
		}
		return m;
	}, [products]);

	const productOptions = useMemo(() => {
		const names = new Set(products.map((p) => p.name));
		for (const ing of editing?.ingredients ?? []) names.add(ing.name);
		return Array.from(names)
			.sort((a, b) => a.localeCompare(b))
			.map((name) => ({ value: name, label: name }));
	}, [products, editing]);

	const goBack = () => navigate({ to: "/admin/recipes" });

	const onSubmit = handleSubmit(async (data) => {
		const input = {
			name: data.name,
			category: data.category ?? RECIPE_CATEGORIES[1],
			servingSize: data.servingSize,
			instructions: data.instructions,
			ingredients: data.ingredients.map<RecipeIngredient>((r) => ({
				name: (r.name ?? "").trim(),
				quantityPerServing: r.quantity,
				unit: r.unit ?? "",
				legacyRefId: null,
			})),
		};

		try {
			if (editing) {
				await updateRecipe(editing.id, input, actor);
				notify.success({ title: "Recipe updated", description: `Changes to ${data.name} have been saved.` });
			} else {
				await addRecipe(input, actor);
				notify.success({ title: "Recipe created", description: `${data.name} was added to your recipes.` });
			}
			goBack();
		} catch (e) {
			notify.danger({
				title: "Save failed",
				description: e instanceof Error ? e.message : "Could not save the recipe. Please try again.",
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
					Back to Recipes
				</Button>
			</div>

			<div className="flex items-center gap-3">
				<ChefHat className="h-7 w-7 text-app-brand" />
				<div>
					<h1 className="text-2xl font-bold text-foreground">{editing ? `Edit: ${editing.name}` : "New Recipe"}</h1>
					<p className="text-sm text-foreground/60">
						{editing ? "Update the recipe details below." : "Fill in the details to create a new recipe."}
					</p>
				</div>
			</div>

			{/* ── form ───────────────────────────────────────────────────────── */}
			<form onSubmit={onSubmit}>
				<div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
					{/* ── Left column: metadata + ingredients ─────────────────── */}
					<div className="space-y-6 lg:col-span-3">
						{/* Basic info */}
						<div className="space-y-1">
							<p className="text-xs font-semibold uppercase tracking-widest text-foreground/40">Basic info</p>
							<div className="rounded-xl border border-foreground/10 p-4 space-y-4">
								<AppTextField
									control={control}
									isRequired
									label="Recipe name"
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
							</div>
						</div>

						{/* Ingredients */}
						<div className="space-y-1">
							<p className="text-xs font-semibold uppercase tracking-widest text-foreground/40">Ingredients</p>
							<div className="rounded-xl border border-foreground/10 p-4 space-y-3">
								<div className="flex items-center justify-between">
									<Label className="text-sm font-medium">Per serving size</Label>
									<Button
										onPress={() => append(newRow())}
										size="sm"
										type="button"
										variant="ghost"
									>
										<Plus className="mr-1 h-4 w-4" />
										Add ingredient
									</Button>
								</div>
								<p className="text-xs text-foreground/50">
									Pick a product from inventory. Its unit is pre-filled and can be changed within the same family.
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
								{fields.length === 0 && (
									<p className="py-2 text-center text-sm text-foreground/40">
										No ingredients yet - click "Add ingredient" to start.
									</p>
								)}
								{ingredientsError && <FieldError className="mt-1">{ingredientsError}</FieldError>}
							</div>
						</div>
					</div>

					{/* ── Right column: instructions ───────────────────────────── */}
					<div className="space-y-1 lg:col-span-2 h-max">
						<p className="text-xs font-semibold uppercase tracking-widest text-foreground/40">Instructions</p>
						<div className="rounded-xl border border-foreground/10 p-4 h-full">
							<AppTextArea
								control={control}
								isRequired
								label="Step-by-step instructions"
								name="instructions"
								placeholder={"1. Heat oil in a pan...\n2. Add garlic and onion...\n3. ..."}
								rows={18}
							/>
						</div>
					</div>
				</div>

				{/* ── footer actions ─────────────────────────────────────────── */}
				<div className="mt-8 flex items-center justify-end gap-3 pt-6">
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
						isPending={isSubmitting}
						size="lg"
						type="submit"
						variant="primary"
					>
						{editing ? "Save changes" : "Create recipe"}
					</Button>
				</div>
			</form>
		</div>
	);
}

// ── IngredientRow ─────────────────────────────────────────────────────────────

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

	const unitOptions = product ? allowedUnitsForProduct(product).map((u) => ({ value: u, label: u })) : ALL_UNIT_OPTIONS;

	const prevName = useRef(name);
	useEffect(() => {
		if (name === prevName.current) return;
		prevName.current = name;
		if (product) {
			// Snap to the correct usage unit for measurable pcs products, display unit for others.
			const snapUnit =
				product.measurable && product.usageUnit && product.usageUnit !== "pcs"
					? product.usageUnit
					: product.displayUnit;
			setValue(`ingredients.${index}.unit`, snapUnit, { shouldValidate: true, shouldDirty: true });
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
				label="Qty"
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
				aria-label="Remove ingredient"
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
