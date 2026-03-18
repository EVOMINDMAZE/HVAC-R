import { Search, Filter, MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  filterOptions?: Array<{ label: string; value: string }>;
  filterValue?: string;
  onFilterChange?: (value: string) => void;
  actions?: Array<{ label: string; onClick: (item: T) => void; icon?: React.ReactNode }>;
  emptyMessage?: string;
  errorMessage?: string;
  onRetry?: () => void;
  emptyIcon?: React.ReactNode;
  loading?: boolean;
  className?: string;
  onRowClick?: (item: T) => void;
  page?: number;
  pageSize?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;
}

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  keyExtractor,
  searchPlaceholder = "Search...",
  searchValue,
  onSearchChange,
  filterOptions,
  filterValue,
  onFilterChange,
  actions,
  emptyMessage = "No records match your filters.",
  errorMessage,
  onRetry,
  emptyIcon,
  loading = false,
  className,
  onRowClick,
  page = 1,
  pageSize = 25,
  totalItems,
  onPageChange,
}: DataTableProps<T>) {
  const effectiveTotalItems = totalItems ?? data.length;
  const totalPages = Math.max(1, Math.ceil(effectiveTotalItems / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const hasPagination = !!onPageChange && (totalItems !== undefined || data.length > pageSize);
  const paginatedData = hasPagination
    ? data
    : data.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const totalColumns = columns.length + (actions ? 1 : 0);

  const handleRowKeyDown = (event: React.KeyboardEvent<HTMLTableRowElement>, item: T) => {
    if (!onRowClick) {
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onRowClick(item);
    }
  };

  return (
    <div className={cn("data-table", className)}>
      {(onSearchChange || filterOptions) && (
        <div className="data-table__toolbar">
          {onSearchChange && (
            <div className="data-table__search">
              <Search className="data-table__search-icon w-4 h-4" />
              <Input
                type="text"
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                className="data-table__search-input"
              />
            </div>
          )}

          {filterOptions && onFilterChange && (
            <div className="data-table__filter">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <select
                value={filterValue}
                onChange={(e) => onFilterChange(e.target.value)}
                className="data-table__filter-select"
              >
                {filterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      <div className="data-table__wrapper">
        <table className="data-table__table">
          <thead className="data-table__head">
            <tr>
              {columns.map((column) => (
                <th key={String(column.key)} className={cn("data-table__th", column.className)}>
                  {column.header}
                </th>
              ))}
              {actions && <th className="data-table__th data-table__th--actions">Actions</th>}
            </tr>
          </thead>

          <tbody className="data-table__body">
            {errorMessage ? (
              <tr>
                <td colSpan={totalColumns} className="data-table__empty">
                  <div className="flex flex-col items-center gap-3 py-6" role="alert" aria-live="assertive">
                    <span className="text-sm font-semibold text-destructive">Unable to load table data.</span>
                    <span className="text-xs text-muted-foreground">{errorMessage}</span>
                    {onRetry ? (
                      <Button variant="outline" size="sm" onClick={onRetry}>
                        Try again
                      </Button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ) : loading ? (
              <tr>
                <td colSpan={totalColumns} className="data-table__loading">
                  Loading...
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={totalColumns} className="data-table__empty">
                  {emptyIcon && <div className="data-table__empty-icon">{emptyIcon}</div>}
                  <span>{emptyMessage}</span>
                </td>
              </tr>
            ) : (
              paginatedData.map((item) => (
                <tr
                  key={keyExtractor(item)}
                  className={cn("data-table__row", onRowClick && "data-table__row--clickable")}
                  onClick={() => onRowClick?.(item)}
                  onKeyDown={(event) => handleRowKeyDown(event, item)}
                  tabIndex={onRowClick ? 0 : undefined}
                >
                  {columns.map((column) => (
                    <td key={String(column.key)} className={cn("data-table__td", column.className)}>
                      {column.render
                        ? column.render(item)
                        : String(item[column.key as keyof T] ?? "")}
                    </td>
                  ))}
                  {actions && (
                    <td className="data-table__td data-table__td--actions">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="data-table__action-btn">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {actions.map((action, index) => (
                            <DropdownMenuItem
                              key={index}
                              onClick={() => action.onClick(item)}
                            >
                              {action.icon && <span className="mr-2">{action.icon}</span>}
                              {action.label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {hasPagination ? (
        <div className="mt-3 flex items-center justify-between gap-2 border-t border-border/60 pt-3">
          <p className="text-xs text-muted-foreground">
            Page {currentPage} of {totalPages} • {effectiveTotalItems} total
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => onPageChange(currentPage - 1)}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange(currentPage + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
