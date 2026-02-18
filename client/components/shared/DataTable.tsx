import React from "react";
import { Search, Filter, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  emptyIcon?: React.ReactNode;
  loading?: boolean;
  className?: string;
  onRowClick?: (item: T) => void;
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
  emptyMessage = "No data found",
  emptyIcon,
  loading = false,
  className,
  onRowClick,
}: DataTableProps<T>) {
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
            {loading ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="data-table__loading">
                  Loading...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="data-table__empty">
                  {emptyIcon && <div className="data-table__empty-icon">{emptyIcon}</div>}
                  <span>{emptyMessage}</span>
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr
                  key={keyExtractor(item)}
                  className={cn("data-table__row", onRowClick && "data-table__row--clickable")}
                  onClick={() => onRowClick?.(item)}
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
    </div>
  );
}