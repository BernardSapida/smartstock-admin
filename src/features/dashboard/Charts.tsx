// Dashboard charts (recharts). Rendered inside the client-guarded layout, so
// they mount client-side (no SSR sizing issues).

import { Surface } from "@heroui/react";
import { useMemo } from "react";
import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Legend,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import type { PreparationRecord } from "@/features/recipes/hooks/use-recipes";
import type { ProductWithBatches } from "@/types/inventory";

const BRAND = "#4FB8B2";
const SUCCESS = "#22c55e";
const WARNING = "#f59e0b";
const DANGER = "#ef4444";
const GRID = "rgba(255,255,255,0.08)";
const AXIS = "rgba(255,255,255,0.5)";

const tooltipStyle = {
	backgroundColor: "#161616",
	border: "1px solid rgba(255,255,255,0.1)",
	borderRadius: 12,
	color: "#fff",
};

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
	return (
		<Surface
			className="rounded-2xl p-5"
			variant="secondary"
		>
			<h2 className="mb-4 font-semibold text-foreground">{title}</h2>
			<div className="h-64 w-full">{children}</div>
		</Surface>
	);
}

export function CategoryChart({ rows }: { rows: ProductWithBatches[] }) {
	const data = useMemo(() => {
		const m = new Map<string, number>();
		for (const r of rows) m.set(r.product.category, (m.get(r.product.category) ?? 0) + 1);
		return [...m.entries()].map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count);
	}, [rows]);

	return (
		<ChartCard title="Products by category">
			<ResponsiveContainer
				height="100%"
				width="100%"
			>
				<BarChart
					data={data}
					margin={{ top: 8, right: 8, bottom: 8, left: -16 }}
				>
					<CartesianGrid
						stroke={GRID}
						vertical={false}
					/>
					<XAxis
						dataKey="category"
						hide={data.length > 6}
						stroke={AXIS}
						tick={{ fontSize: 11 }}
					/>
					<YAxis
						allowDecimals={false}
						stroke={AXIS}
						tick={{ fontSize: 11 }}
					/>
					<Tooltip
						contentStyle={tooltipStyle}
						cursor={{ fill: "rgba(255,255,255,0.04)" }}
					/>
					<Bar
						dataKey="count"
						fill={BRAND}
						radius={[6, 6, 0, 0]}
					/>
				</BarChart>
			</ResponsiveContainer>
		</ChartCard>
	);
}

export function StatusChart({ rows }: { rows: ProductWithBatches[] }) {
	const data = useMemo(() => {
		const inCount = rows.filter((r) => r.status === "in").length;
		const low = rows.filter((r) => r.status === "low").length;
		const out = rows.filter((r) => r.status === "out").length;
		return [
			{ name: "In stock", value: inCount, color: SUCCESS },
			{ name: "Low", value: low, color: WARNING },
			{ name: "Out", value: out, color: DANGER },
		].filter((d) => d.value > 0);
	}, [rows]);

	return (
		<ChartCard title="Stock status">
			<ResponsiveContainer
				height="100%"
				width="100%"
			>
				<PieChart>
					<Pie
						cx="50%"
						cy="50%"
						data={data}
						dataKey="value"
						innerRadius={50}
						nameKey="name"
						outerRadius={80}
						paddingAngle={2}
					>
						{data.map((d) => (
							<Cell
								fill={d.color}
								key={d.name}
							/>
						))}
					</Pie>
					<Tooltip contentStyle={tooltipStyle} />
					<Legend wrapperStyle={{ fontSize: 12, color: AXIS }} />
				</PieChart>
			</ResponsiveContainer>
		</ChartCard>
	);
}

export function ProductionChart({ preparations }: { preparations: PreparationRecord[] }) {
	const data = useMemo(() => {
		const days: { date: string; servings: number }[] = [];
		for (let i = 6; i >= 0; i--) {
			const d = new Date();
			d.setDate(d.getDate() - i);
			const key = d.toISOString().slice(0, 10);
			days.push({ date: key.slice(5), servings: 0 });
		}
		const byDate = new Map(days.map((d) => [d.date, d]));
		for (const p of preparations) {
			const key = (p.date ?? "").slice(5);
			const slot = byDate.get(key);
			if (slot) slot.servings += p.servings;
		}
		return days;
	}, [preparations]);

	return (
		<ChartCard title="Servings prepared (last 7 days)">
			<ResponsiveContainer
				height="100%"
				width="100%"
			>
				<BarChart
					data={data}
					margin={{ top: 8, right: 8, bottom: 8, left: -16 }}
				>
					<CartesianGrid
						stroke={GRID}
						vertical={false}
					/>
					<XAxis
						dataKey="date"
						stroke={AXIS}
						tick={{ fontSize: 11 }}
					/>
					<YAxis
						allowDecimals={false}
						stroke={AXIS}
						tick={{ fontSize: 11 }}
					/>
					<Tooltip
						contentStyle={tooltipStyle}
						cursor={{ fill: "rgba(255,255,255,0.04)" }}
					/>
					<Bar
						dataKey="servings"
						fill={BRAND}
						radius={[6, 6, 0, 0]}
					/>
				</BarChart>
			</ResponsiveContainer>
		</ChartCard>
	);
}
