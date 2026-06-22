import { Skeleton, Table } from "@heroui/react";
import type { ReactNode } from "react";

interface ColumnDef<T> {
	key: string;
	label: string;
	render?: (row: T) => ReactNode;
}

interface AppTableProps<T extends { id: string | number }> {
	columns: ColumnDef<T>[];
	rows: T[];
	isLoading?: boolean;
	emptyContent?: string | ReactNode;
	onRowAction?: (id: string | number) => void;
	selectionMode?: "none" | "single" | "multiple";
	selectedKeys?: "all" | Set<string | number>;
	onSelectionChange?: (keys: "all" | Set<string | number>) => void;
	className?: string;
}

export function AppTable<T extends { id: string | number }>({
	columns,
	rows,
	isLoading = false,
	emptyContent = "No data available.",
	onRowAction,
	selectionMode = "none",
	selectedKeys,
	onSelectionChange,
	className,
}: AppTableProps<T>) {
	const skeletonRows = Array.from({ length: 5 }, (_, i) => i);

	return (
		<Table className={className}>
			<Table.Content
				aria-label="Data table"
				onRowAction={onRowAction ? (key) => onRowAction(key as string | number) : undefined}
				onSelectionChange={
					onSelectionChange
						? (keys) => onSelectionChange(keys === "all" ? "all" : new Set(keys as Set<string | number>))
						: undefined
				}
				selectedKeys={selectedKeys}
				selectionMode={selectionMode}
			>
				<Table.Header>
					{columns.map((col, i) => (
						<Table.Column
							isRowHeader={i === 0}
							key={col.key}
						>
							{col.label}
						</Table.Column>
					))}
				</Table.Header>
				<Table.Body>
					{isLoading ? (
						skeletonRows.map((i) => (
							<Table.Row
								id={`skeleton-${i}`}
								key={`skeleton-${i}`}
							>
								{columns.map((col) => (
									<Table.Cell key={col.key}>
										<Skeleton className="h-4 w-full rounded" />
									</Table.Cell>
								))}
							</Table.Row>
						))
					) : rows.length === 0 ? (
						<Table.Row id="empty">
							{columns.map((col, i) => (
								<Table.Cell key={col.key}>{i === 0 ? emptyContent : null}</Table.Cell>
							))}
						</Table.Row>
					) : (
						rows.map((row) => (
							<Table.Row
								id={row.id}
								key={row.id}
							>
								{columns.map((col) => (
									<Table.Cell key={col.key}>
										{col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? "")}
									</Table.Cell>
								))}
							</Table.Row>
						))
					)}
				</Table.Body>
			</Table.Content>
		</Table>
	);
}
