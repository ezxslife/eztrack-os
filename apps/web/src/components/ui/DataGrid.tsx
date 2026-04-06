"use client";

import { type ReactNode } from "react";
import clsx from "clsx";
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (row: T) => ReactNode;
}

interface DataGridProps<T> {
  columns: Column<T>[];
  data: T[];
  onSort?: (key: string, direction: "asc" | "desc") => void;
  sortKey?: string;
  sortDirection?: "asc" | "desc";
  onRowClick?: (row: T) => void;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
  loading?: boolean;
  emptyMessage?: string;
  totalCount?: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  className?: string;
}

/* ── Skeleton row with shimmer ── */
function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 h-11">
          <div className="h-3.5 rounded bg-[var(--surface-secondary)] animate-pulse w-3/4" />
        </td>
      ))}
    </tr>
  );
}

export function DataGrid<T extends Record<string, unknown>>({
  columns,
  data,
  onSort,
  sortKey,
  sortDirection,
  onRowClick,
  selectedIds,
  onSelectionChange,
  loading = false,
  emptyMessage = "No results found",
  totalCount,
  page = 1,
  pageSize = 10,
  onPageChange,
  className,
}: DataGridProps<T>) {
  const handleSort = (key: string) => {
    if (!onSort) return;
    const newDir =
      sortKey === key && sortDirection === "asc" ? "desc" : "asc";
    onSort(key, newDir);
  };

  const showCheckbox = !!onSelectionChange;
  const allSelected =
    data.length > 0 && selectedIds?.size === data.length;

  const toggleAll = () => {
    if (!onSelectionChange) return;
    if (allSelected) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(data.map((r) => r.id as string)));
    }
  };

  const toggleRow = (id: string) => {
    if (!onSelectionChange || !selectedIds) return;
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange(next);
  };

  /* Pagination math */
  const total = totalCount ?? data.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const rangeStart = (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  return (
    <div className={clsx("w-full overflow-x-auto", className)}>
      <table className="w-full">
        {/* ── Header ── */}
        <thead>
          <tr className="bg-[var(--surface-secondary)] border-b border-[var(--border-default)]">
            {showCheckbox && (
              <th className="w-10 px-3 h-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label="Select all rows"
                  className="h-3.5 w-3.5 rounded border-[var(--border-default)] text-[var(--action-primary)] focus:ring-[var(--focus-ring)]"
                />
              </th>
            )}
            {columns.map((col) => (
              <th
                key={col.key}
                className={clsx(
                  "px-4 h-10 text-left text-[11px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider",
                  col.sortable &&
                    "cursor-pointer select-none hover:text-[var(--text-secondary)] transition-colors duration-150"
                )}
                onClick={col.sortable ? () => handleSort(col.key) : undefined}
                aria-sort={col.sortable ? (sortKey === col.key ? (sortDirection === "asc" ? "ascending" : "descending") : "none") : undefined}
              >
                <span className="inline-flex items-center gap-1">
                  {col.label}
                  {col.sortable && sortKey === col.key && (
                    sortDirection === "asc" ? (
                      <ChevronUp
                        className="h-3 w-3 text-[var(--action-primary)]"
                      />
                    ) : (
                      <ChevronDown
                        className="h-3 w-3 text-[var(--action-primary)]"
                      />
                    )
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>

        {/* ── Body ── */}
        <tbody>
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <SkeletonRow key={i} cols={columns.length + (showCheckbox ? 1 : 0)} />
              ))
            : data.length === 0
              ? (
                <tr>
                  <td
                    colSpan={columns.length + (showCheckbox ? 1 : 0)}
                    className="px-4 py-12 text-center text-[13px] text-[var(--text-tertiary)]"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              )
              : data.map((row, idx) => {
                  const rowId = (row.id as string) ?? String(idx);
                  const isSelected = selectedIds?.has(rowId);
                  return (
                    <tr
                      key={rowId}
                      onClick={onRowClick ? () => onRowClick(row) : undefined}
                      className={clsx(
                        "border-b border-[var(--border-subdued,var(--border-default))] transition-colors duration-100",
                        isSelected
                          ? "bg-[var(--surface-selected,rgba(0,188,212,0.06))]"
                          : onRowClick
                            ? "cursor-pointer hover:bg-[var(--surface-hover)]"
                            : "hover:bg-[var(--surface-hover)]"
                      )}
                    >
                      {showCheckbox && (
                        <td className="w-10 px-3 h-11">
                          <input
                            type="checkbox"
                            checked={isSelected ?? false}
                            onChange={(e) => {
                              e.stopPropagation();
                              toggleRow(rowId);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            aria-label={`Select row ${idx + 1}`}
                            className="h-3.5 w-3.5 rounded border-[var(--border-default)] text-[var(--action-primary)] focus:ring-[var(--focus-ring)]"
                          />
                        </td>
                      )}
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          className="px-4 h-11 text-[13px] text-[var(--text-primary)] whitespace-nowrap"
                        >
                          {col.render
                            ? col.render(row)
                            : (row[col.key] as ReactNode) ?? "-"}
                        </td>
                      ))}
                    </tr>
                  );
                })}
        </tbody>
      </table>

      {/* ── Pagination ── */}
      {!loading && total > 0 && (
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-[var(--border-default)] text-[12px] text-[var(--text-tertiary)]">
          <span>
            {rangeStart}&ndash;{rangeEnd} of {total}
          </span>
          {onPageChange && totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => onPageChange(page - 1)}
                className="inline-flex items-center justify-center h-7 w-7 rounded-md hover:bg-[var(--surface-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => onPageChange(page + 1)}
                className="inline-flex items-center justify-center h-7 w-7 rounded-md hover:bg-[var(--surface-hover)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
