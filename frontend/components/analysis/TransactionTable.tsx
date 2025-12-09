'use client'

import { useState, useMemo, useCallback } from 'react'
import { FixedSizeList as List } from 'react-window'
import type { ListChildComponentProps } from 'react-window'
import {
  ChevronDown,
  ChevronUp,
  Download,
  CheckSquare,
  Square,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@/components/ui/table'
import { Card } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { ExemptionModal, ExemptionData } from './ExemptionModal'
import { TransactionTableRow, Transaction } from './TransactionTableRow'
import { TransactionTableHeader, SortField, SortDirection } from './TransactionTableHeader'
import { TransactionFilters, ChannelFilter, ExemptFilter } from './TransactionFilters'
import { TransactionPagination } from './TransactionPagination'
import { PendingChangesBanner, PendingChangesSummary } from './PendingChangesBanner'

// Re-export Transaction type for consumers
export type { Transaction } from './TransactionTableRow'

// Pending change to be saved
interface PendingExemptionChange {
  transactionId: string
  action: 'created' | 'updated' | 'removed'
  exemptAmount: number
  reason?: string
  reasonOther?: string
  note?: string
}

interface TransactionTableProps {
  transactions: Transaction[]
  threshold?: number
  initiallyExpanded?: boolean
  stateCode?: string
  year?: number // undefined = "All Years"
  analysisId?: string
  onExemptionsChanged?: () => void // Callback when exemptions are saved
}

// Format helpers for virtual scrolling
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default function TransactionTable({
  transactions,
  threshold,
  initiallyExpanded = false,
  stateCode = 'STATE',
  year,
  analysisId,
  onExemptionsChanged,
}: TransactionTableProps) {
  const { toast } = useToast()

  // State management
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded)
  const [searchTerm, setSearchTerm] = useState('')
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>('all')
  const [exemptFilter, setExemptFilter] = useState<ExemptFilter>('all')
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)

  // Exemption management state
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [pendingChanges, setPendingChanges] = useState<Map<string, PendingExemptionChange>>(new Map())
  const [exemptionModalOpen, setExemptionModalOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [exemptionModalMode, setExemptionModalMode] = useState<'create' | 'edit'>('create')
  const [isSaving, setIsSaving] = useState(false)

  // Get transaction with pending changes applied
  const getEffectiveTransaction = useCallback((txn: Transaction): Transaction => {
    const pending = pendingChanges.get(txn.transaction_id)
    if (!pending) return txn

    if (pending.action === 'removed') {
      return { ...txn, exempt_amount: 0, taxable_amount: txn.sales_amount }
    }

    return {
      ...txn,
      exempt_amount: pending.exemptAmount,
      taxable_amount: txn.sales_amount - pending.exemptAmount,
      exemption_reason: pending.reason,
      exemption_reason_other: pending.reasonOther,
      exemption_note: pending.note,
    }
  }, [pendingChanges])

  // Filter and sort logic
  const filteredAndSortedTransactions = useMemo(() => {
    let filtered = transactions.map(t => getEffectiveTransaction(t))

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

    // Apply exempt filter
    if (exemptFilter !== 'all') {
      if (exemptFilter === 'exempt') {
        filtered = filtered.filter((t) => t.exempt_amount > 0)
      } else {
        filtered = filtered.filter((t) => t.exempt_amount === 0)
      }
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
  }, [transactions, searchTerm, channelFilter, exemptFilter, sortField, sortDirection, getEffectiveTransaction])

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

  // Find threshold crossing row
  const thresholdCrossingIndex = useMemo(() => {
    if (!threshold) return -1
    return paginatedTransactions.findIndex((t) => t.running_total >= threshold)
  }, [paginatedTransactions, threshold])

  // Calculate pending changes summary
  const pendingChangesSummary = useMemo<PendingChangesSummary>(() => {
    let added = 0
    let updated = 0
    let removed = 0
    let totalAmount = 0

    pendingChanges.forEach(change => {
      if (change.action === 'created') added++
      else if (change.action === 'updated') updated++
      else if (change.action === 'removed') removed++
      totalAmount += change.exemptAmount
    })

    return { added, updated, removed, total: pendingChanges.size, totalAmount }
  }, [pendingChanges])

  // Handlers
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }, [])

  const handleChannelFilterChange = useCallback((value: ChannelFilter) => {
    setChannelFilter(value)
    setCurrentPage(1)
  }, [])

  const handleExemptFilterChange = useCallback((value: ExemptFilter) => {
    setExemptFilter(value)
    setCurrentPage(1)
  }, [])

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }, [sortField])

  const handleItemsPerPageChange = useCallback((value: number) => {
    setItemsPerPage(value)
    setCurrentPage(1)
  }, [])

  const handleToggleSelectionMode = useCallback(() => {
    setSelectionMode(prev => !prev)
    setSelectedIds(new Set())
  }, [])

  const handleToggleSelection = useCallback((transactionId: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(transactionId)) {
        newSet.delete(transactionId)
      } else {
        newSet.add(transactionId)
      }
      return newSet
    })
  }, [])

  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === paginatedTransactions.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(paginatedTransactions.map(t => t.transaction_id)))
    }
  }, [selectedIds.size, paginatedTransactions])

  const handleOpenExemptionModal = useCallback((transaction: Transaction, mode: 'create' | 'edit') => {
    setSelectedTransaction(transaction)
    setExemptionModalMode(mode)
    setExemptionModalOpen(true)
  }, [])

  const handleExemptionSave = useCallback((data: ExemptionData) => {
    const wasExempt = data.currentExemptAmount > 0
    const change: PendingExemptionChange = {
      transactionId: data.transactionId,
      action: wasExempt ? 'updated' : 'created',
      exemptAmount: data.exemptAmount,
      reason: data.reason || undefined,
      reasonOther: data.reasonOther || undefined,
      note: data.note || undefined,
    }

    setPendingChanges(prev => {
      const newMap = new Map(prev)
      newMap.set(data.transactionId, change)
      return newMap
    })

    toast({
      title: 'Exemption added',
      description: `Transaction ${data.transactionId} marked as exempt. Click "Save Changes" to apply.`,
    })
  }, [toast])

  const handleRemoveExemption = useCallback((transactionId: string) => {
    const change: PendingExemptionChange = {
      transactionId,
      action: 'removed',
      exemptAmount: 0,
    }

    setPendingChanges(prev => {
      const newMap = new Map(prev)
      newMap.set(transactionId, change)
      return newMap
    })

    toast({
      title: 'Exemption removed',
      description: `Transaction ${transactionId} will be taxable. Click "Save Changes" to apply.`,
    })
  }, [toast])

  const handleSaveChanges = useCallback(async () => {
    if (!analysisId || pendingChanges.size === 0) return

    setIsSaving(true)
    try {
      const changes = Array.from(pendingChanges.values()).map(change => ({
        transaction_id: change.transactionId,
        action: change.action,
        exempt_amount: change.exemptAmount,
        reason: change.reason,
        reason_other: change.reasonOther,
        note: change.note,
      }))

      const response = await fetch(`/api/v1/analyses/${analysisId}/exemptions/save-and-recalculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          changes,
          trigger_recalculation: true,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save exemptions')
      }

      const result = await response.json()

      setPendingChanges(new Map())
      setSelectedIds(new Set())
      setSelectionMode(false)

      toast({
        title: 'Changes saved',
        description: `${result.saved_count} exemption(s) saved. ${result.recalculation_status === 'completed' ? 'Liability recalculated.' : ''}`,
      })

      onExemptionsChanged?.()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save exemption changes. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }, [analysisId, pendingChanges, toast, onExemptionsChanged])

  const handleDiscardChanges = useCallback(() => {
    setPendingChanges(new Map())
    setSelectedIds(new Set())
    toast({
      title: 'Changes discarded',
      description: 'All pending exemption changes have been discarded.',
    })
  }, [toast])

  // CSV export functionality
  const handleExportCSV = useCallback(() => {
    const headers = ['Date', 'Transaction ID', 'Gross Sales', 'Taxable', 'Exempt', 'Channel', 'Running Total', 'Exemption Reason']
    const rows = filteredAndSortedTransactions.map((t) => [
      t.transaction_date,
      t.transaction_id,
      t.sales_amount.toFixed(2),
      t.taxable_amount.toFixed(2),
      t.exempt_amount.toFixed(2),
      t.sales_channel,
      t.running_total.toFixed(2),
      t.exemption_reason || '',
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
  }, [filteredAndSortedTransactions, year, stateCode])

  if (transactions.length === 0) {
    return null
  }

  const showActions = !!analysisId
  const columnCount = selectionMode ? 9 : (showActions ? 8 : 7)

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
            <div className="flex gap-2">
              <Button onClick={handleExportCSV} variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
              {analysisId && (
                <Button
                  variant={selectionMode ? 'secondary' : 'outline'}
                  onClick={handleToggleSelectionMode}
                  className="flex items-center gap-2"
                >
                  {selectionMode ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                  {selectionMode ? 'Exit Selection' : 'Select'}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Pending changes banner */}
      <PendingChangesBanner
        summary={pendingChangesSummary}
        isSaving={isSaving}
        onSave={handleSaveChanges}
        onDiscard={handleDiscardChanges}
      />

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-4 pb-4">
          {/* Filters */}
          <TransactionFilters
            searchTerm={searchTerm}
            onSearchChange={handleSearchChange}
            channelFilter={channelFilter}
            onChannelFilterChange={handleChannelFilterChange}
            exemptFilter={exemptFilter}
            onExemptFilterChange={handleExemptFilterChange}
          />

          {/* Table */}
          <div className="rounded-md border border-border">
            <Table>
              <TransactionTableHeader
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
                selectionMode={selectionMode}
                allSelected={selectedIds.size === paginatedTransactions.length && paginatedTransactions.length > 0}
                onSelectAll={handleSelectAll}
                showActions={showActions}
              />
              <TableBody>
                {paginatedTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={columnCount} className="h-24 text-center">
                      No transactions found.
                    </TableCell>
                  </TableRow>
                ) : itemsPerPage === -1 && paginatedTransactions.length > 50 ? (
                  // Virtual scrolling for "All" with 50+ transactions
                  <TableRow>
                    <TableCell colSpan={columnCount} className="p-0">
                      <List
                        height={600}
                        itemCount={paginatedTransactions.length}
                        itemSize={53}
                        width="100%"
                      >
                        {({ index, style }: ListChildComponentProps) => {
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
                                <span className="inline-flex rounded-full px-2 py-1 text-xs font-semibold shadow-sm bg-muted text-foreground">
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
                  paginatedTransactions.map((transaction, index) => (
                    <TransactionTableRow
                      key={transaction.transaction_id}
                      transaction={transaction}
                      isThresholdCrossing={index === thresholdCrossingIndex}
                      hasPendingChange={pendingChanges.has(transaction.transaction_id)}
                      selectionMode={selectionMode}
                      isSelected={selectedIds.has(transaction.transaction_id)}
                      showActions={showActions}
                      onToggleSelection={handleToggleSelection}
                      onOpenExemptionModal={handleOpenExemptionModal}
                      onRemoveExemption={handleRemoveExemption}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <TransactionPagination
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            totalFiltered={filteredAndSortedTransactions.length}
            paginatedCount={paginatedTransactions.length}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        </div>
      )}

      {/* Exemption Modal */}
      <ExemptionModal
        open={exemptionModalOpen}
        onOpenChange={setExemptionModalOpen}
        transaction={selectedTransaction}
        onSave={handleExemptionSave}
        mode={exemptionModalMode}
      />
    </Card>
  )
}
