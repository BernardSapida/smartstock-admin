// Generic reusable bar chart for the reports page.

import { Surface } from "@heroui/react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const BRAND = "#4FB8B2";
const GRID = "rgba(255,255,255,0.08)";
const AXIS = "rgba(255,255,255,0.5)";
const tooltipStyle = {
	backgroundColor: "#161616",
	border: "1px solid rgba(255,255,255,0.1)",
	borderRadius: 12,
	color: "#fff",
};

export interface BarDatum {
	label: string;
	value: number;
}

export function SimpleBarChart({ title, data }: { title: string; data: BarDatum[] }) {
	if (data.length === 0) return null;
	return (
		<Surface
			className="mb-4 rounded-2xl p-5"
			variant="secondary"
		>
			<h2 className="mb-4 font-semibold text-foreground">{title}</h2>
			<div className="h-64 w-full">
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
							dataKey="label"
							hide={data.length > 8}
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
							dataKey="value"
							fill={BRAND}
							radius={[6, 6, 0, 0]}
						/>
					</BarChart>
				</ResponsiveContainer>
			</div>
		</Surface>
	);
}
