import { Button } from "@heroui/react";
import { Check, Minus, Plus, X } from "lucide-react";
import { useMemo, useState } from "react";
import { AppChip } from "@/components/ui/AppChip";
import { AppModal } from "@/components/ui/AppModal";
import { consumeProduct } from "@/features/inventory/firebase/consume";
import type { Actor } from "@/features/inventory/firebase/inventory.writes";
import { recordPreparation } from "@/features/recipes/firebase/recipes.firebase";
import { type ProductIndex, recipeAvailability } from "@/features/recipes/logic/availability";
import { formatQuantity } from "@/lib/units";
import type { Recipe } from "@/types/recipe";

interface Props {
	recipe: Recipe;
	index: ProductIndex;
	actor: Actor;
	isOpen: boolean;
	onClose: () => void;
	onDone: () => void;
}

export function PrepareModal({ recipe, index, actor, isOpen, onClose, onDone }: Props) {
	const [servings, setServings] = useState(1);
	const [busy, setBusy] = useState(false);

	const avail = useMemo(() => recipeAvailability(recipe, index, servings), [recipe, index, servings]);
	const maxServings = avail.maxServings;

	const prepare = async () => {
		setBusy(true);
		try {
			const consumed: { productId: string; productName: string; parts: { batchId: string; quantity: number }[] }[] = [];
			for (const s of avail.statuses) {
				if (!s.matched || s.requiredPerServingBase <= 0 || s.unitMismatch) continue;
				const match = index.get(s.ingredient.name.trim().toLowerCase());
				if (!match) continue;
				const need = s.requiredPerServingBase * servings;
				const res = await consumeProduct(match.product.id, need);
				consumed.push({ productId: match.product.id, productName: match.product.name, parts: res.consumed });
			}
			await recordPreparation(
				{ recipeId: recipe.id, recipeName: recipe.name, category: recipe.category, servings, consumed },
				actor,
			);
			onDone();
			onClose();
		} finally {
			setBusy(false);
		}
	};

	return (
		<AppModal
			footer={
				<div className="flex w-full items-center justify-between gap-2">
					<div className="flex items-center gap-2">
						<Button
							aria-label="Fewer"
							isIconOnly
							onPress={() => setServings((s) => Math.max(1, s - 1))}
							size="sm"
							variant="ghost"
						>
							<Minus className="h-4 w-4" />
						</Button>
						<span className="w-16 text-center font-semibold">{servings} serv.</span>
						<Button
							aria-label="More"
							isIconOnly
							onPress={() => setServings((s) => s + 1)}
							size="sm"
							variant="ghost"
						>
							<Plus className="h-4 w-4" />
						</Button>
						{maxServings !== null && <span className="text-xs text-foreground/50">max {maxServings}</span>}
					</div>
					<Button
						isDisabled={!avail.canCookRequested}
						isPending={busy}
						onPress={prepare}
						variant="primary"
					>
						Prepare
					</Button>
				</div>
			}
			isOpen={isOpen}
			onClose={onClose}
			size="lg"
			title={`Prepare - ${recipe.name}`}
		>
			<div className="space-y-2">
				<p className="text-sm text-foreground/60">
					Confirm is enabled only when every ingredient has enough stock for {servings} serving(s).
				</p>
				{avail.statuses.length === 0 && (
					<p className="text-sm text-foreground/60">This recipe has no ingredients listed.</p>
				)}
				{avail.statuses.map((s, i) => {
					const need = s.requiredPerServingBase * servings;
					return (
						// biome-ignore lint/suspicious/noArrayIndexKey: static list
						<div
							className="flex items-center justify-between rounded-xl border border-foreground/10 p-3"
							key={i}
						>
							<div className="flex items-center gap-2">
								{s.enough ? <Check className="h-4 w-4 text-success" /> : <X className="h-4 w-4 text-danger" />}
								<span className="font-medium">{s.ingredient.name}</span>
							</div>
							<div className="flex items-center gap-2 text-sm">
								{!s.matched ? (
									<AppChip
										color="warning"
										label="Not in inventory"
										size="sm"
										variant="soft"
									/>
								) : s.unitMismatch ? (
									<AppChip
										color="warning"
										label="Unit mismatch"
										size="sm"
										variant="soft"
									/>
								) : s.requiredPerServingBase <= 0 ? (
									<AppChip
										color="default"
										label="Not tracked"
										size="sm"
										variant="soft"
									/>
								) : (
									<span className={s.enough ? "text-foreground/70" : "text-danger"}>
										{formatQuantity(s.haveBase, s.displayUnit)} / {formatQuantity(need, s.displayUnit)}
									</span>
								)}
							</div>
						</div>
					);
				})}
			</div>
		</AppModal>
	);
}
