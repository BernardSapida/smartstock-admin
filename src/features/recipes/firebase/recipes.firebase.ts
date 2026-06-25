// Recipe CRUD + preparation logging + (legacy) execution status.

import { addDoc, collection, deleteDoc, doc, onSnapshot, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import type { ConsumedPart } from "@/features/inventory/firebase/consume";
import type { Actor } from "@/features/inventory/firebase/inventory.writes";
import { logAction } from "@/lib/audit";
import { db } from "@/lib/firebase";
import { normalizeRecipe, type Recipe, type RecipeIngredient } from "@/types/recipe";

export function watchRecipes(cb: (recipes: Recipe[]) => void): () => void {
	return onSnapshot(collection(db, "recipes"), (snap) => {
		cb(snap.docs.map((d) => normalizeRecipe(d.id, d.data())).sort((a, b) => a.name.localeCompare(b.name)));
	});
}

export interface RecipeInput {
	name: string;
	category: string;
	servingSize: number;
	instructions: string;
	ingredients: RecipeIngredient[];
}

function recipeDoc(input: RecipeInput) {
	return {
		name: input.name.trim(),
		category: input.category,
		servingSize: input.servingSize,
		instructions: input.instructions,
		ingredients: input.ingredients.map((i) => ({
			name: i.name,
			quantity: i.quantityPerServing,
			unit: i.unit,
			productId: i.legacyRefId ?? null,
		})),
		updatedAt: serverTimestamp(),
	};
}

export async function addRecipe(input: RecipeInput, actor: Actor): Promise<string> {
	// NOTE: creating a recipe NEVER deducts inventory - only preparing does.
	const ref = await addDoc(collection(db, "recipes"), {
		...recipeDoc(input),
		createdBy: actor.uid,
		createdAt: serverTimestamp(),
	});
	void logAction({
		uid: actor.uid,
		user: actor.name,
		role: actor.role,
		action: "CREATE",
		module: "Recipes",
		description: `Added recipe "${input.name}"`,
	});
	return ref.id;
}

export async function updateRecipe(id: string, input: RecipeInput, actor: Actor): Promise<void> {
	await updateDoc(doc(db, "recipes", id), recipeDoc(input));
	void logAction({
		uid: actor.uid,
		user: actor.name,
		role: actor.role,
		action: "UPDATE",
		module: "Recipes",
		description: `Updated recipe "${input.name}"`,
	});
}

export async function deleteRecipe(id: string, name: string, actor: Actor): Promise<void> {
	await deleteDoc(doc(db, "recipes", id));
	void logAction({
		uid: actor.uid,
		user: actor.name,
		role: actor.role,
		action: "DELETE",
		module: "Recipes",
		description: `Deleted recipe "${name}"`,
	});
}

export interface PreparationInput {
	recipeId: string;
	recipeName: string;
	category: string;
	servings: number;
	consumed: { productId: string; productName: string; parts: ConsumedPart[] }[];
}

/** Record a completed preparation (production log) + mark execution done. */
export async function recordPreparation(input: PreparationInput, actor: Actor): Promise<void> {
	await addDoc(collection(db, "preparations"), {
		recipeId: input.recipeId,
		recipeName: input.recipeName,
		category: input.category,
		servings: input.servings,
		preparedBy: actor.uid,
		preparedByName: actor.name,
		preparedByRole: actor.role,
		consumed: input.consumed,
		preparedAt: serverTimestamp(),
		date: new Date().toISOString().slice(0, 10),
	});
	await setDoc(
		doc(db, "recipe_execution", `${input.recipeId}_${actor.uid}`),
		{
			recipeId: input.recipeId,
			userId: actor.uid,
			status: "done",
			servings: input.servings,
			updatedAt: serverTimestamp(),
		},
		{ merge: true },
	);
	void logAction({
		uid: actor.uid,
		user: actor.name,
		role: actor.role,
		action: "UPDATE",
		module: "Recipes",
		description: `Prepared ${input.servings} serving(s) of "${input.recipeName}"`,
	});
}
