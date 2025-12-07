'use client'

import { useState, useMemo, useCallback } from 'react'
import { FixedSizeList as List } from 'react-window'
import type { ListChildComponentProps } from 'react-window'
import {
  ChevronDown,
  ChevronUp,
  Download,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  ShieldCheck,
  ShieldX,
  CheckSquare,
  Square,
  Save,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { ExemptionModal, ExemptionData, ExemptionReason } from './ExemptionModal'

interface Transaction {
  transaction_id: string
  transaction_date: string
  sales_amount: number
  taxable_amount: number
  exempt_amount: number
  is_taxable: boolean
  sales_channel: 'direct' | 'marketplace'
  running_total: number
  exemption_reason?: string
  exemption_reason_other?: string
  exemption_note?: string
  exemption_marked_at?: string
}

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

type SortField = 'date' | 'amount'
type SortDirection = 'asc' | 'desc'

export default function TransactionTable({
  transactions,
  threshold,
  initiallyExpanded = false,
  stateCode = 'STATE',
  year, // Can be undefined for "All Years"
  analysisId,
  onExemptionsChanged,
}: TransactionTableProps) {
  const { toast } = useToast()

  // State management
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded)
  const [searchTerm, setSearchTerm] = useState('')
  const [channelFilter, setChannelFilter] = useState<'all' | 'direct' | 'marketplace'>('all')
  const [exemptFilter, setExemptFilter] = useState<'all' | 'exempt' | 'taxable'>('all')
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
  }

  // Exemption handlers
  const handleExemptFilterChange = (value: string) => {
    setExemptFilter(value as 'all' | 'exempt' | 'taxable')
    setCurrentPage(1)
  }

  const handleToggleSelectionMode = () => {
    setSelectionMode(!selectionMode)
    setSelectedIds(new Set())
  }

  const handleToggleSelection = (transactionId: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(transactionId)) {
      newSelected.delete(transactionId)
    } else {
      newSelected.add(transactionId)
    }
    setSelectedIds(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedIds.size === paginatedTransactions.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(paginatedTransactions.map(t => t.transaction_id)))
    }
  }

  const handleOpenExemptionModal = (transaction: Transaction, mode: 'create' | 'edit') => {
    setSelectedTransaction(transaction)
    setExemptionModalMode(mode)
    setExemptionModalOpen(true)
  }

  const handleExemptionSave = (data: ExemptionData) => {
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
  }

  const handleRemoveExemption = (transactionId: string) => {
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
  }

  const handleSaveChanges = async () => {
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
  }

  const handleDiscardChanges = () => {
    setPendingChanges(new Map())
    setSelectedIds(new Set())
    toast({
      title: 'Changes discarded',
      description: 'All pending exemption changes have been discarded.',
    })
  }

  // Calculate pending changes summary
  const pendingChangesSummary = useMemo(() => {
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
      {pendingChanges.size > 0 && (
        <div className="mx-4 mb-4 p-3 bg-warning/10 border border-warning/30 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-warning/20">
              {pendingChangesSummary.total} pending change{pendingChangesSummary.total !== 1 ? 's' : ''}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {pendingChangesSummary.added > 0 && `${pendingChangesSummary.added} added`}
              {pendingChangesSummary.updated > 0 && `, ${pendingChangesSummary.updated} updated`}
              {pendingChangesSummary.removed > 0 && `, ${pendingChangesSummary.removed} removed`}
            </span>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={handleDiscardChanges}>
              Discard
            </Button>
            <Button size="sm" onClick={handleSaveChanges} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save & Recalculate'}
            </Button>
          </div>
        </div>
      )}

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-4 pb-4">
          {/* Filters */}
          <div className="mb-4 flex gap-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by Transaction ID..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={channelFilter} onValueChange={handleChannelFilterChange}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Channel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Channels</SelectItem>
                <SelectItem value="direct">Direct</SelectItem>
                <SelectItem value="marketplace">Marketplace</SelectItem>
              </SelectContent>
            </Select>
            <Select value={exemptFilter} onValueChange={handleExemptFilterChange}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Exempt Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="exempt">Exempt Only</SelectItem>
                <SelectItem value="taxable">Taxable Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border border-border">
            <Table>
              <TableHeader className="bg-muted/80 border-b-2 border-border">
                <TableRow className="hover:bg-muted/80">
                  {selectionMode && (
                    <TableHead className="px-4 py-3 w-[50px]">
                      <Checkbox
                        checked={selectedIds.size === paginatedTransactions.length && paginatedTransactions.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                  )}
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
                  {analysisId && (
                    <TableHead className="px-4 py-3 text-center text-xs font-semibold text-foreground uppercase tracking-wider w-[80px]">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={selectionMode ? 9 : (analysisId ? 8 : 7)} className="h-24 text-center">
                      No transactions found.
                    </TableCell>
                  </TableRow>
                ) : itemsPerPage === -1 && paginatedTransactions.length > 50 ? (
                  // Virtual scrolling for "All" with 50+ transactions
                  <TableRow>
                    <TableCell colSpan={selectionMode ? 9 : (analysisId ? 8 : 7)} className="p-0">
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
                                <span
                                  className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold shadow-sm ${
                                    transaction.sales_channel === 'direct'
                                      ? 'bg-muted text-foreground'
                                      : 'bg-muted text-foreground'
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
                    const isExempt = transaction.exempt_amount > 0
                    const hasPendingChange = pendingChanges.has(transaction.transaction_id)
                    return (
                      <TableRow
                        key={transaction.transaction_id}
                        className={`
                          ${isThresholdCrossing ? 'bg-warning/10 border-l-4 border-l-warning' : ''}
                          ${hasPendingChange ? 'bg-blue-50 dark:bg-blue-950/20' : ''}
                          border-b border-border hover:bg-muted/30 transition-colors
                        `}
                      >
                        {selectionMode && (
                          <TableCell className="px-4 py-3">
                            <Checkbox
                              checked={selectedIds.has(transaction.transaction_id)}
                              onCheckedChange={() => handleToggleSelection(transaction.transaction_id)}
                            />
                          </TableCell>
                        )}
                        <TableCell className="px-4 py-3 text-sm text-foreground">{formatDate(transaction.transaction_date)}</TableCell>
                        <TableCell className="px-4 py-3 text-sm text-foreground font-mono">
                          <div className="flex items-center gap-2">
                            {transaction.transaction_id}
                            {isExempt && (
                              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs">
                                <ShieldCheck className="h-3 w-3 mr-1" />
                                Exempt
                              </Badge>
                            )}
                            {hasPendingChange && (
                              <Badge variant="outline" className="text-xs">
                                Pending
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-sm text-right font-medium text-foreground">
                          {formatCurrency(transaction.sales_amount)}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-sm text-right text-foreground">
                          {transaction.taxable_amount !== 0 ? formatCurrency(transaction.taxable_amount) : <span className="text-muted-foreground">-</span>}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-sm text-right text-foreground">
                          {transaction.exempt_amount !== 0 ? (
                            <span className="text-green-600 dark:text-green-400 font-medium">
                              {formatCurrency(transaction.exempt_amount)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-sm text-center text-foreground">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold shadow-sm ${
                              transaction.sales_channel === 'direct'
                                ? 'bg-muted text-foreground'
                                : 'bg-muted text-foreground'
                            }`}
                          >
                            {transaction.sales_channel === 'direct' ? 'Direct' : 'Marketplace'}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-sm text-right font-semibold text-foreground">
                          {formatCurrency(transaction.running_total)}
                        </TableCell>
                        {analysisId && (
                          <TableCell className="px-4 py-3 text-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {isExempt ? (
                                  <>
                                    <DropdownMenuItem onClick={() => handleOpenExemptionModal(transaction, 'edit')}>
                                      <ShieldCheck className="h-4 w-4 mr-2" />
                                      Edit Exemption
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => handleRemoveExemption(transaction.transaction_id)}
                                      className="text-destructive"
                                    >
                                      <ShieldX className="h-4 w-4 mr-2" />
                                      Remove Exemption
                                    </DropdownMenuItem>
                                  </>
                                ) : (
                                  <DropdownMenuItem onClick={() => handleOpenExemptionModal(transaction, 'create')}>
                                    <ShieldCheck className="h-4 w-4 mr-2" />
                                    Mark as Exempt
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        )}
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
