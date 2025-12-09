'use client'

import { memo } from 'react'
import { Button } from '@/components/ui/button'

interface TransactionPaginationProps {
  currentPage: number
  totalPages: number
  itemsPerPage: number
  totalFiltered: number
  paginatedCount: number
  onPageChange: (page: number) => void
  onItemsPerPageChange: (value: number) => void
}

export const TransactionPagination = memo(function TransactionPagination({
  currentPage,
  totalPages,
  itemsPerPage,
  totalFiltered,
  paginatedCount,
  onPageChange,
  onItemsPerPageChange,
}: TransactionPaginationProps) {
  const startItem = paginatedCount === 0 ? 0 : (currentPage - 1) * (itemsPerPage === -1 ? totalFiltered : itemsPerPage) + 1
  const endItem = itemsPerPage === -1
    ? totalFiltered
    : Math.min(currentPage * itemsPerPage, totalFiltered)

  return (
    <div className="mt-4 flex items-center justify-between">
      <div className="text-sm text-muted-foreground">
        Showing {startItem} to {endItem} of {totalFiltered} transactions
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Items per page:</span>
          <div className="flex gap-1">
            {[10, 25, 50].map((value) => (
              <Button
                key={value}
                variant={itemsPerPage === value ? 'default' : 'outline'}
                size="sm"
                onClick={() => onItemsPerPageChange(value)}
              >
                {value}
              </Button>
            ))}
            <Button
              variant={itemsPerPage === -1 ? 'default' : 'outline'}
              size="sm"
              onClick={() => onItemsPerPageChange(-1)}
            >
              All
            </Button>
          </div>
        </div>

        {itemsPerPage !== -1 && totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  )
})
