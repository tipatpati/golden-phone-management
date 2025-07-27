import * as React from "react"
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DataTablePagination } from "@/components/ui/data-table-pagination"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface Column<T> {
  key: keyof T
  header: string
  align?: 'left' | 'center' | 'right'
  sortable?: boolean
  width?: string
  render?: (value: any, item: T) => React.ReactNode
}

interface MaterialDataTableProps<T> {
  data: T[]
  columns: Column<T>[]
  pageIndex?: number
  pageSize?: number
  totalItems?: number
  isLoading?: boolean
  sortColumn?: keyof T | null
  sortDirection?: 'asc' | 'desc' | null
  onSort?: (column: keyof T) => void
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  className?: string
  getRowKey?: (item: T) => string | number
  onRowClick?: (item: T) => void
}

export function MaterialDataTable<T>({
  data,
  columns,
  pageIndex = 0,
  pageSize = 10,
  totalItems,
  isLoading = false,
  sortColumn = null,
  sortDirection = null,
  onSort,
  onPageChange,
  onPageSizeChange,
  className,
  getRowKey,
  onRowClick,
}: MaterialDataTableProps<T>) {
  const pageCount = Math.ceil((totalItems || data.length) / pageSize)
  const canPreviousPage = pageIndex > 0
  const canNextPage = pageIndex < pageCount - 1

  const handleSort = (column: keyof T) => {
    if (onSort) {
      onSort(column)
    }
  }

  const getSortDirection = (column: keyof T) => {
    if (sortColumn === column) {
      return sortDirection
    }
    return null
  }

  if (isLoading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <div className="text-on-surface-variant">Loading...</div>
        </div>
      </Card>
    )
  }

  return (
    <Card className={cn("overflow-hidden md-elevation-1 md-elevation-smooth hover:md-elevation-2", className)}>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow interactive={false}>
              {columns.map((column) => (
                <TableHead
                  key={String(column.key)}
                  align={column.align}
                  sortable={column.sortable}
                  sortDirection={getSortDirection(column.key)}
                  onClick={column.sortable ? () => handleSort(column.key) : undefined}
                  style={{ width: column.width }}
                  className="md-focus-smooth"
                >
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow interactive={false}>
                <td colSpan={columns.length} className="text-center py-8">
                  <div className="text-on-surface-variant">No data available</div>
                </td>
              </TableRow>
            ) : (
              data.map((item, index) => (
                <TableRow
                  key={getRowKey ? getRowKey(item) : index}
                  onClick={onRowClick ? () => onRowClick(item) : undefined}
                  interactive={!!onRowClick}
                  className="md-interactive-smooth md-focus-smooth"
                >
                  {columns.map((column) => (
                    <td
                      key={String(column.key)}
                      className={cn(
                        "px-2 sm:px-4 py-2 sm:py-3 align-middle text-xs sm:text-sm text-on-surface",
                        column.align === 'center' && "text-center",
                        column.align === 'right' && "text-right",
                        !column.align && "text-left"
                      )}
                    >
                      {column.render 
                        ? column.render(item[column.key], item)
                        : String(item[column.key] || '-')
                      }
                    </td>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {(onPageChange && onPageSizeChange && totalItems) && (
        <DataTablePagination
          pageIndex={pageIndex}
          pageSize={pageSize}
          pageCount={pageCount}
          canPreviousPage={canPreviousPage}
          canNextPage={canNextPage}
          totalItems={totalItems}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      )}
    </Card>
  )
}

// Usage example:
/*
const columns: Column<User>[] = [
  {
    key: 'name',
    header: 'Name',
    sortable: true,
    render: (value, user) => (
      <div className="font-medium">{value}</div>
    )
  },
  {
    key: 'email',
    header: 'Email',
    sortable: true,
  },
  {
    key: 'createdAt',
    header: 'Created',
    align: 'right',
    sortable: true,
    render: (value) => new Date(value).toLocaleDateString()
  },
  {
    key: 'actions',
    header: 'Actions',
    align: 'right',
    render: (_, user) => (
      <div className="flex justify-end gap-2">
        <Button size="sm">Edit</Button>
        <Button size="sm" variant="destructive">Delete</Button>
      </div>
    )
  }
]

<MaterialDataTable
  data={users}
  columns={columns}
  totalItems={totalUsers}
  pageIndex={pageIndex}
  pageSize={pageSize}
  sortColumn={sortColumn}
  sortDirection={sortDirection}
  onSort={handleSort}
  onPageChange={setPageIndex}
  onPageSizeChange={setPageSize}
  onRowClick={handleRowClick}
/>
*/