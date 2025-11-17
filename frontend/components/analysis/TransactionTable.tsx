'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { FixedSizeList as List } from 'react-window'
import {
  ChevronDown,
  ChevronUp,
  Download,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card } from '@/components/ui/card'

interface Transaction {
  transaction_id: string
  transaction_date: string
  sales_amount: number
  taxable_amount: number
  exempt_amount: number
  is_taxable: boolean
  sales_channel: 'direct' | 'marketplace'
  running_total: number
}

interface TransactionTableProps {
  transactions: Transaction[]
  threshold?: number
  initiallyExpanded?: boolean
  stateCode?: string
  year?: number // undefined = "All Years"
}

type SortField = 'date' | 'amount'
type SortDirection = 'asc' | 'desc'

export default function TransactionTable({
  transactions,
  threshold,
  initiallyExpanded = false,
  stateCode = 'STATE',
  year, // Can be undefined for "All Years"
}: TransactionTableProps) {
  // State management
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded)
  const [searchTerm, setSearchTerm] = useState('')
  const [channelFilter, setChannelFilter] = useState<'all' | 'direct' | 'marketplace'>('all')
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)

  // Filter and sort logic
  const filteredAndSortedTransactions = useMemo(() => {
    let filtered = [...transactions]

    // Apply search filter (transaction_id)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter((t) =>
        t.transaction_id.toLowerCase().includes(searchLower)
      )
    }

    // Apply channel filter
    if (channelFilter !== 'all') {
      filtered = filtered.filter((t) => t.sales_channel === channelFilter)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0
      if (sortField === 'date') {
        comparison = new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime()
      } else {
        comparison = a.sales_amount - b.sales_amount
      }
      return sortDirection === 'asc' ? comparison : -comparison
    })

    return filtered
  }, [transactions, searchTerm, channelFilter, sortField, sortDirection])

  // Pagination logic
  const totalPages = Math.ceil(filteredAndSortedTransactions.length / itemsPerPage)
  const paginatedTransactions = useMemo(() => {
    if (itemsPerPage === -1) {
      return filteredAndSortedTransactions
    }
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    return filteredAndSortedTransactions.slice(startIndex, endIndex)
  }, [filteredAndSortedTransactions, currentPage, itemsPerPage])

  // Reset to page 1 when filters change
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const handleChannelFilterChange = (value: string) => {
    setChannelFilter(value as 'all' | 'direct' | 'marketplace')
    setCurrentPage(1)
  }

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(value === 'all' ? -1 : parseInt(value))
    setCurrentPage(1)
  }

  // Toggle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  // Get sort icon
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    )
  }

  // CSV export functionality
  const handleExportCSV = () => {
    const headers = ['Date', 'Transaction ID', 'Gross Sales', 'Taxable', 'Exempt', 'Channel', 'Running Total']
    const rows = filteredAndSortedTransactions.map((t) => [
      t.transaction_date,
      t.transaction_id,
      t.sales_amount.toFixed(2),
      t.taxable_amount.toFixed(2),
      t.exempt_amount.toFixed(2),
      t.sales_channel,
      t.running_total.toFixed(2),
    ])

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    const filename = year ? `${stateCode}_${year}_transactions.csv` : `${stateCode}_all_years_transactions.csv`
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Find threshold crossing row
  const thresholdCrossingIndex = useMemo(() => {
    if (!threshold) return -1
    return paginatedTransactions.findIndex((t) => t.running_total >= threshold)
  }, [paginatedTransactions, threshold])

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (transactions.length === 0) {
    return null
  }

  return (
    <Card className="mt-6 shadow-md hover:shadow-lg transition-all">
      {/* Collapsible header */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-lg font-semibold"
          >
            {isExpanded ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
            {isExpanded ? 'Hide Transactions' : `View All Transactions (${transactions.length})`}
          </Button>

          {isExpanded && (
            <Button onClick={handleExportCSV} variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          )}
        </div>
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-4 pb-4">
          {/* Filters */}
          <div className="mb-4 flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by Transaction ID..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={channelFilter} onValueChange={handleChannelFilterChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Channel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Channels</SelectItem>
                <SelectItem value="direct">Direct</SelectItem>
                <SelectItem value="marketplace">Marketplace</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border border-border">
            <Table>
              <TableHeader className="bg-muted/80 border-b-2 border-border">
                <TableRow className="hover:bg-muted/80">
                  <TableHead
                    className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider cursor-pointer select-none"
                    onClick={() => handleSort('date')}
                  >
                    <div className="flex items-center">
                      Date
                      {getSortIcon('date')}
                    </div>
                  </TableHead>
                  <TableHead className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider">Transaction ID</TableHead>
                  <TableHead
                    className="px-4 py-3 text-right text-xs font-semibold text-foreground uppercase tracking-wider cursor-pointer select-none"
                    onClick={() => handleSort('amount')}
                  >
                    <div className="flex items-center justify-end">
                      Gross Sales
                      {getSortIcon('amount')}
                    </div>
                  </TableHead>
                  <TableHead className="px-4 py-3 text-right text-xs font-semibold text-foreground uppercase tracking-wider">Taxable Sales</TableHead>
                  <TableHead className="px-4 py-3 text-right text-xs font-semibold text-foreground uppercase tracking-wider">Exempt</TableHead>
                  <TableHead className="px-4 py-3 text-center text-xs font-semibold text-foreground uppercase tracking-wider">Channel</TableHead>
                  <TableHead className="px-4 py-3 text-right text-xs font-semibold text-foreground uppercase tracking-wider">Running Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No transactions found.
                    </TableCell>
                  </TableRow>
                ) : itemsPerPage === -1 && paginatedTransactions.length > 50 ? (
                  // Virtual scrolling for "All" with 50+ transactions
                  <TableRow>
                    <TableCell colSpan={7} className="p-0">
                      <List
                        height={600}
                        itemCount={paginatedTransactions.length}
                        itemSize={53}
                        width="100%"
                      >
                        {({ index, style }) => {
                          const transaction = paginatedTransactions[index]
                          const isThresholdCrossing = index === thresholdCrossingIndex
                          return (
                            <div
                              style={style}
                              className={
                                isThresholdCrossing
                                  ? 'bg-warning/10 border-l-4 border-l-warning border-b border-border hover:bg-warning/20 transition-colors flex items-center'
                                  : 'border-b border-border hover:bg-muted/30 transition-colors flex items-center'
                              }
                            >
                              <div className="px-4 py-3 text-sm text-foreground w-[12%]">{formatDate(transaction.transaction_date)}</div>
                              <div className="px-4 py-3 text-sm text-foreground font-mono w-[18%]">
                                {transaction.transaction_id}
                              </div>
                              <div className="px-4 py-3 text-sm text-right font-medium text-foreground w-[14%]">
                                {formatCurrency(transaction.sales_amount)}
                              </div>
                              <div className="px-4 py-3 text-sm text-right text-foreground w-[14%]">
                                {transaction.taxable_amount !== 0 ? formatCurrency(transaction.taxable_amount) : <span className="text-muted-foreground">-</span>}
                              </div>
                              <div className="px-4 py-3 text-sm text-right text-foreground w-[14%]">
                                {transaction.exempt_amount !== 0 ? formatCurrency(transaction.exempt_amount) : <span className="text-muted-foreground">-</span>}
                              </div>
                              <div className="px-4 py-3 text-sm text-center text-foreground w-[14%]">
                                <span
                                  className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                                    transaction.sales_channel === 'direct'
                                      ? 'bg-muted text-foreground'
                                      : 'bg-accent text-foreground'
                                  }`}
                                >
                                  {transaction.sales_channel === 'direct' ? 'Direct' : 'Marketplace'}
                                </span>
                              </div>
                              <div className="px-4 py-3 text-sm text-right font-semibold text-foreground w-[14%]">
                                {formatCurrency(transaction.running_total)}
                              </div>
                            </div>
                          )
                        }}
                      </List>
                    </TableCell>
                  </TableRow>
                ) : (
                  // Regular rendering for paginated views or small "All" lists
                  paginatedTransactions.map((transaction, index) => {
                    const isThresholdCrossing = index === thresholdCrossingIndex
                    return (
                      <TableRow
                        key={transaction.transaction_id}
                        className={
                          isThresholdCrossing
                            ? 'bg-warning/10 border-l-4 border-l-warning border-b border-border hover:bg-warning/20 transition-colors'
                            : 'border-b border-border hover:bg-muted/30 transition-colors'
                        }
                      >
                        <TableCell className="px-4 py-3 text-sm text-foreground">{formatDate(transaction.transaction_date)}</TableCell>
                        <TableCell className="px-4 py-3 text-sm text-foreground font-mono">
                          {transaction.transaction_id}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-sm text-right font-medium text-foreground">
                          {formatCurrency(transaction.sales_amount)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-sm text-right text-foreground">
                          {transaction.taxable_amount !== 0 ? formatCurrency(transaction.taxable_amount) : <span className="text-muted-foreground">-</span>}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-sm text-right text-foreground">
                          {transaction.exempt_amount !== 0 ? formatCurrency(transaction.exempt_amount) : <span className="text-muted-foreground">-</span>}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-sm text-center text-foreground">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                              transaction.sales_channel === 'direct'
                                ? 'bg-muted text-foreground'
                                : 'bg-accent text-foreground'
                            }`}
                          >
                            {transaction.sales_channel === 'direct' ? 'Direct' : 'Marketplace'}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-sm text-right font-semibold text-foreground">
                          {formatCurrency(transaction.running_total)}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {paginatedTransactions.length === 0 ? 0 : (currentPage - 1) * (itemsPerPage === -1 ? filteredAndSortedTransactions.length : itemsPerPage) + 1} to{' '}
              {itemsPerPage === -1
                ? filteredAndSortedTransactions.length
                : Math.min(currentPage * itemsPerPage, filteredAndSortedTransactions.length)}{' '}
              of {filteredAndSortedTransactions.length} transactions
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
                      onClick={() => handleItemsPerPageChange(value.toString())}
                    >
                      {value}
                    </Button>
                  ))}
                  <Button
                    variant={itemsPerPage === -1 ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleItemsPerPageChange('all')}
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
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
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
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
