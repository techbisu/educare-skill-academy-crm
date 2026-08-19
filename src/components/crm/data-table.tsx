'use client';

import { ReactNode, useState, useMemo } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown, ArrowUp, ArrowDown, Search, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

export type Column<T> = {
  key: string;
  header: string;
  cell?: (row: T) => ReactNode;
  sortable?: boolean;
  sortKey?: string;
  className?: string;
  headerClassName?: string;
};

export type DataTableProps<T> = {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
  };
  search?: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
  };
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  onSortChange?: (sortBy: string, sortDir: 'asc' | 'desc') => void;
  filters?: ReactNode;
  actions?: ReactNode;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  getRowId?: (row: T) => string;
  dense?: boolean;
};

export function DataTable<T extends Record<string, any>>({
  data, columns, loading, pagination, search, sortBy, sortDir, onSortChange, filters, actions, onRowClick, emptyMessage, selectedIds, onSelectionChange, getRowId, dense,
}: DataTableProps<T>) {
  const [internalSearch, setInternalSearch] = useState('');
  const searchValue = search?.value ?? internalSearch;
  const onSearchChange = search?.onChange ?? setInternalSearch;

  const toggleSort = (col: Column<T>) => {
    if (!col.sortable || !onSortChange) return;
    const key = col.sortKey || col.key;
    if (sortBy === key) {
      onSortChange(key, sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      onSortChange(key, 'asc');
    }
  };

  const allSelected = data.length > 0 && selectedIds && getRowId && data.every(r => selectedIds.includes(getRowId(r)));
  const toggleAll = () => {
    if (!onSelectionChange || !getRowId) return;
    if (allSelected) onSelectionChange([]);
    else onSelectionChange(data.map(r => getRowId(r)));
  };
  const toggleRow = (row: T) => {
    if (!onSelectionChange || !getRowId || !selectedIds) return;
    const id = getRowId(row);
    if (selectedIds.includes(id)) onSelectionChange(selectedIds.filter(x => x !== id));
    else onSelectionChange([...selectedIds, id]);
  };

  return (
    <div className="space-y-3">
      {(search || filters || actions) && (
        <div className="flex flex-wrap items-center gap-2">
          {search && (
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={search.placeholder || 'Search...'}
                value={searchValue}
                onChange={e => onSearchChange(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
          )}
          {filters}
          <div className="ml-auto flex items-center gap-2">{actions}</div>
        </div>
      )}

      <div className="rounded-md border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                {onSelectionChange && (
                  <TableHead className="w-10">
                    <input type="checkbox" checked={!!allSelected} onChange={toggleAll} className="accent-primary" />
                  </TableHead>
                )}
                {columns.map(col => (
                  <TableHead key={col.key} className={cn('text-xs font-semibold uppercase tracking-wide', col.headerClassName)}>
                    {col.sortable && onSortChange ? (
                      <button
                        className="inline-flex items-center gap-1 hover:text-foreground"
                        onClick={() => toggleSort(col)}
                      >
                        {col.header}
                        {sortBy === (col.sortKey || col.key) ? (
                          sortDir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-50" />
                        )}
                      </button>
                    ) : (
                      col.header
                    )}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    {onSelectionChange && <TableCell><Skeleton className="h-4 w-4" /></TableCell>}
                    {columns.map((col, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full max-w-[120px]" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length + (onSelectionChange ? 1 : 0)} className="text-center py-12 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Inbox className="h-8 w-8 opacity-40" />
                      <span>{emptyMessage || 'No records found'}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row, i) => {
                  const rowId = getRowId?.(row) || String(i);
                  const isSelected = selectedIds?.includes(rowId);
                  return (
                    <TableRow
                      key={rowId}
                      className={cn(
                        'hover:bg-muted/30 transition-colors',
                        onRowClick && 'cursor-pointer',
                        isSelected && 'bg-blue-50/50',
                        dense && 'py-0',
                      )}
                      onClick={() => onRowClick?.(row)}
                    >
                      {onSelectionChange && (
                        <TableCell onClick={e => { e.stopPropagation(); toggleRow(row); }} className="w-10">
                          <input type="checkbox" checked={!!isSelected} readOnly className="accent-primary" />
                        </TableCell>
                      )}
                      {columns.map(col => (
                        <TableCell key={col.key} className={cn(dense && 'py-2', col.className)}>
                          {col.cell ? col.cell(row) : (row as any)[col.key]}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {pagination && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <div className="text-muted-foreground">
            Showing <span className="font-medium text-foreground">{(pagination.page - 1) * pagination.pageSize + 1}</span>
            {' '}-{' '}
            <span className="font-medium text-foreground">{Math.min(pagination.page * pagination.pageSize, pagination.total)}</span>
            {' '}of{' '}
            <span className="font-medium text-foreground">{pagination.total}</span>
          </div>
          <div className="flex items-center gap-1">
            {pagination.onPageSizeChange && (
              <select
                className="h-8 rounded border bg-background px-2 text-xs"
                value={pagination.pageSize}
                onChange={e => pagination.onPageSizeChange?.(Number(e.target.value))}
              >
                {[10, 20, 50, 100].map(n => <option key={n} value={n}>{n} / page</option>)}
              </select>
            )}
            <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={pagination.page <= 1} onClick={() => pagination.onPageChange(1)}>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={pagination.page <= 1} onClick={() => pagination.onPageChange(pagination.page - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-2">Page {pagination.page} of {Math.max(pagination.totalPages, 1)}</span>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={pagination.page >= pagination.totalPages} onClick={() => pagination.onPageChange(pagination.page + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={pagination.page >= pagination.totalPages} onClick={() => pagination.onPageChange(pagination.totalPages)}>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper hook for managing server-side pagination/sorting/search state
export function useTableState(initial?: { pageSize?: number; sortBy?: string; sortDir?: 'asc' | 'desc' }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initial?.pageSize ?? 20);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState(initial?.sortBy ?? 'createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(initial?.sortDir ?? 'desc');
  const [filters, setFilters] = useState<Record<string, string>>({});
  return {
    page, pageSize, search, sortBy, sortDir, filters,
    setPage, setPageSize, setSearch, setSortBy, setSortDir, setFilters,
    reset: () => { setPage(1); },
  };
}
