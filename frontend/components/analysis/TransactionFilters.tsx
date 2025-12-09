'use client'

import { memo } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export type ChannelFilter = 'all' | 'direct' | 'marketplace'
export type ExemptFilter = 'all' | 'exempt' | 'taxable'

interface TransactionFiltersProps {
  searchTerm: string
  onSearchChange: (value: string) => void
  channelFilter: ChannelFilter
  onChannelFilterChange: (value: ChannelFilter) => void
  exemptFilter: ExemptFilter
  onExemptFilterChange: (value: ExemptFilter) => void
}

export const TransactionFilters = memo(function TransactionFilters({
  searchTerm,
  onSearchChange,
  channelFilter,
  onChannelFilterChange,
  exemptFilter,
  onExemptFilterChange,
}: TransactionFiltersProps) {
  return (
    <div className="mb-4 flex gap-4 flex-wrap">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by Transaction ID..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      <Select value={channelFilter} onValueChange={(v) => onChannelFilterChange(v as ChannelFilter)}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Channel" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Channels</SelectItem>
          <SelectItem value="direct">Direct</SelectItem>
          <SelectItem value="marketplace">Marketplace</SelectItem>
        </SelectContent>
      </Select>
      <Select value={exemptFilter} onValueChange={(v) => onExemptFilterChange(v as ExemptFilter)}>
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
  )
})
