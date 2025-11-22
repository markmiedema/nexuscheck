'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ShoppingCart, Package, Laptop, Users, Warehouse,
  DollarSign, FileCheck, CheckCircle2, AlertTriangle, Save
} from 'lucide-react'
import apiClient from '@/lib/api/client'
import { handleApiError, showSuccess } from '@/lib/utils/errorHandler'

// US States for multi-select
const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
]

// Channel options
const CHANNEL_OPTIONS = [
  { id: 'dtc', label: 'Direct to Consumer (DTC)', icon: ShoppingCart },
  { id: 'amazon_fba', label: 'Amazon FBA', icon: Package },
  { id: 'amazon_fbm', label: 'Amazon FBM', icon: Package },
  { id: 'wholesale', label: 'Wholesale / B2B', icon: Warehouse },
  { id: 'retail', label: 'Brick & Mortar Retail', icon: ShoppingCart },
  { id: 'marketplace_other', label: 'Other Marketplaces', icon: ShoppingCart },
]

// Product type options
const PRODUCT_TYPE_OPTIONS = [
  { id: 'physical_goods', label: 'Physical / Tangible Goods' },
  { id: 'digital_goods', label: 'Digital Goods' },
  { id: 'saas', label: 'SaaS / Software' },
  { id: 'services', label: 'Services' },
  { id: 'mixed', label: 'Mixed Products' },
]

// Tech stack options
const TECH_STACK_OPTIONS = [
  { id: 'shopify', label: 'Shopify' },
  { id: 'woocommerce', label: 'WooCommerce' },
  { id: 'bigcommerce', label: 'BigCommerce' },
  { id: 'magento', label: 'Magento' },
  { id: 'amazon', label: 'Amazon Seller Central' },
  { id: 'netsuite', label: 'NetSuite' },
  { id: 'quickbooks', label: 'QuickBooks' },
  { id: 'xero', label: 'Xero' },
  { id: 'stripe', label: 'Stripe' },
  { id: 'square', label: 'Square' },
  { id: 'other', label: 'Other' },
]

// Revenue range options
const REVENUE_OPTIONS = [
  { value: 'under_100k', label: 'Under $100K' },
  { value: '100k_500k', label: '$100K - $500K' },
  { value: '500k_1m', label: '$500K - $1M' },
  { value: '1m_5m', label: '$1M - $5M' },
  { value: '5m_10m', label: '$5M - $10M' },
  { value: 'over_10m', label: 'Over $10M' },
]

// Transaction volume options
const VOLUME_OPTIONS = [
  { value: 'low', label: 'Low (<1,000/year)' },
  { value: 'medium', label: 'Medium (1,000-10,000/year)' },
  { value: 'high', label: 'High (>10,000/year)' },
]

interface DiscoveryProfileProps {
  clientId: string
  initialData?: {
    channels?: string[]
    product_types?: string[]
    tech_stack?: string[]
    has_remote_employees?: boolean
    remote_employee_states?: string[]
    has_inventory_3pl?: boolean
    inventory_3pl_states?: string[]
    estimated_annual_revenue?: string
    transaction_volume?: string
    current_registration_count?: number
    registered_states?: string[]
    discovery_completed_at?: string
    discovery_notes?: string
  }
  onUpdate?: () => void
}

export function DiscoveryProfile({ clientId, initialData, onUpdate }: DiscoveryProfileProps) {
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Form state
  const [channels, setChannels] = useState<string[]>(initialData?.channels || [])
  const [productTypes, setProductTypes] = useState<string[]>(initialData?.product_types || [])
  const [techStack, setTechStack] = useState<string[]>(initialData?.tech_stack || [])
  const [hasRemoteEmployees, setHasRemoteEmployees] = useState(initialData?.has_remote_employees || false)
  const [remoteEmployeeStates, setRemoteEmployeeStates] = useState<string[]>(initialData?.remote_employee_states || [])
  const [hasInventory3pl, setHasInventory3pl] = useState(initialData?.has_inventory_3pl || false)
  const [inventory3plStates, setInventory3plStates] = useState<string[]>(initialData?.inventory_3pl_states || [])
  const [estimatedRevenue, setEstimatedRevenue] = useState(initialData?.estimated_annual_revenue || '')
  const [transactionVolume, setTransactionVolume] = useState(initialData?.transaction_volume || '')
  const [registrationCount, setRegistrationCount] = useState(initialData?.current_registration_count || 0)
  const [registeredStates, setRegisteredStates] = useState<string[]>(initialData?.registered_states || [])
  const [discoveryNotes, setDiscoveryNotes] = useState(initialData?.discovery_notes || '')

  const isCompleted = !!initialData?.discovery_completed_at

  // Toggle functions for multi-selects
  const toggleChannel = (id: string) => {
    setChannels(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id])
    setHasChanges(true)
  }

  const toggleProductType = (id: string) => {
    setProductTypes(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id])
    setHasChanges(true)
  }

  const toggleTechStack = (id: string) => {
    setTechStack(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id])
    setHasChanges(true)
  }

  const toggleState = (state: string, current: string[], setter: (val: string[]) => void) => {
    setter(current.includes(state) ? current.filter(s => s !== state) : [...current, state])
    setHasChanges(true)
  }

  // Save discovery profile
  const handleSave = async (markComplete: boolean = false) => {
    setSaving(true)
    try {
      const payload: any = {
        channels,
        product_types: productTypes,
        tech_stack: techStack,
        has_remote_employees: hasRemoteEmployees,
        remote_employee_states: remoteEmployeeStates,
        has_inventory_3pl: hasInventory3pl,
        inventory_3pl_states: inventory3plStates,
        estimated_annual_revenue: estimatedRevenue || null,
        transaction_volume: transactionVolume || null,
        current_registration_count: registrationCount,
        registered_states: registeredStates,
        discovery_notes: discoveryNotes || null,
      }

      if (markComplete) {
        payload.discovery_completed_at = new Date().toISOString()
      }

      await apiClient.patch(`/api/v1/clients/${clientId}`, payload)

      showSuccess(markComplete ? 'Discovery profile completed!' : 'Discovery profile saved')
      setHasChanges(false)
      onUpdate?.()
    } catch (error) {
      handleApiError(error, { userMessage: 'Failed to save discovery profile' })
    } finally {
      setSaving(false)
    }
  }

  // Calculate physical nexus risk indicators
  const hasPhysicalNexusRisk = hasRemoteEmployees || hasInventory3pl || channels.includes('amazon_fba')

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      {isCompleted ? (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
            Discovery completed on {new Date(initialData?.discovery_completed_at!).toLocaleDateString()}
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
            Discovery profile incomplete - Complete to unlock engagement creation
          </span>
        </div>
      )}

      {/* Physical Nexus Warning */}
      {hasPhysicalNexusRisk && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <span className="text-sm font-medium text-red-700 dark:text-red-300">
            Physical Nexus Indicators Detected - May have immediate filing obligations
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Channels */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingCart className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold">Sales Channels</h3>
          </div>
          <div className="space-y-3">
            {CHANNEL_OPTIONS.map(channel => (
              <label
                key={channel.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
              >
                <Checkbox
                  checked={channels.includes(channel.id)}
                  onCheckedChange={() => toggleChannel(channel.id)}
                />
                <channel.icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{channel.label}</span>
              </label>
            ))}
          </div>
        </Card>

        {/* Product Types */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Package className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold">Product Types</h3>
          </div>
          <div className="space-y-3">
            {PRODUCT_TYPE_OPTIONS.map(product => (
              <label
                key={product.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
              >
                <Checkbox
                  checked={productTypes.includes(product.id)}
                  onCheckedChange={() => toggleProductType(product.id)}
                />
                <span className="text-sm">{product.label}</span>
              </label>
            ))}
          </div>
        </Card>

        {/* Tech Stack */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Laptop className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold">Technology Stack</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {TECH_STACK_OPTIONS.map(tech => (
              <Badge
                key={tech.id}
                variant="outline"
                className={`cursor-pointer transition-all ${
                  techStack.includes(tech.id)
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'hover:bg-muted'
                }`}
                onClick={() => toggleTechStack(tech.id)}
              >
                {tech.label}
              </Badge>
            ))}
          </div>
        </Card>

        {/* Volume Indicators */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold">Business Volume</h3>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Estimated Annual Revenue</Label>
              <Select value={estimatedRevenue} onValueChange={(v) => { setEstimatedRevenue(v); setHasChanges(true) }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  {REVENUE_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Transaction Volume</Label>
              <Select value={transactionVolume} onValueChange={(v) => { setTransactionVolume(v); setHasChanges(true) }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select volume" />
                </SelectTrigger>
                <SelectContent>
                  {VOLUME_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Physical Presence - Critical Section */}
        <Card className="p-6 lg:col-span-2 border-red-200 dark:border-red-800">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-red-500" />
            <h3 className="font-semibold text-red-700 dark:text-red-400">Physical Presence (Nexus Triggers)</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            These factors create immediate physical nexus obligations regardless of sales thresholds.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Remote Employees */}
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <Checkbox
                  checked={hasRemoteEmployees}
                  onCheckedChange={(checked) => { setHasRemoteEmployees(!!checked); setHasChanges(true) }}
                />
                <span className="font-medium">Has Remote Employees</span>
              </label>
              {hasRemoteEmployees && (
                <div className="ml-7 space-y-2">
                  <Label className="text-xs text-muted-foreground">Select states with employees:</Label>
                  <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto p-2 border rounded-md">
                    {US_STATES.map(state => (
                      <Badge
                        key={state}
                        variant="outline"
                        className={`cursor-pointer text-xs ${
                          remoteEmployeeStates.includes(state)
                            ? 'bg-red-100 border-red-300 text-red-700 dark:bg-red-900/30 dark:border-red-700 dark:text-red-300'
                            : 'hover:bg-muted'
                        }`}
                        onClick={() => toggleState(state, remoteEmployeeStates, setRemoteEmployeeStates)}
                      >
                        {state}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 3PL Inventory */}
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <Checkbox
                  checked={hasInventory3pl}
                  onCheckedChange={(checked) => { setHasInventory3pl(!!checked); setHasChanges(true) }}
                />
                <span className="font-medium">Has 3PL / FBA Inventory</span>
              </label>
              {hasInventory3pl && (
                <div className="ml-7 space-y-2">
                  <Label className="text-xs text-muted-foreground">Select states with inventory:</Label>
                  <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto p-2 border rounded-md">
                    {US_STATES.map(state => (
                      <Badge
                        key={state}
                        variant="outline"
                        className={`cursor-pointer text-xs ${
                          inventory3plStates.includes(state)
                            ? 'bg-red-100 border-red-300 text-red-700 dark:bg-red-900/30 dark:border-red-700 dark:text-red-300'
                            : 'hover:bg-muted'
                        }`}
                        onClick={() => toggleState(state, inventory3plStates, setInventory3plStates)}
                      >
                        {state}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Current Registrations */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileCheck className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold">Current Registrations</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            States where the client is already registered to collect sales tax.
          </p>
          <div className="flex flex-wrap gap-1 max-h-40 overflow-y-auto p-2 border rounded-md">
            {US_STATES.map(state => (
              <Badge
                key={state}
                variant="outline"
                className={`cursor-pointer text-xs ${
                  registeredStates.includes(state)
                    ? 'bg-emerald-100 border-emerald-300 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-700 dark:text-emerald-300'
                    : 'hover:bg-muted'
                }`}
                onClick={() => {
                  toggleState(state, registeredStates, setRegisteredStates)
                  setRegistrationCount(registeredStates.includes(state) ? registrationCount - 1 : registrationCount + 1)
                }}
              >
                {state}
              </Badge>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {registeredStates.length} states selected
          </p>
        </Card>

        {/* Discovery Notes */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileCheck className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold">Discovery Notes</h3>
          </div>
          <Textarea
            placeholder="Additional notes from discovery meeting..."
            className="min-h-[120px]"
            value={discoveryNotes}
            onChange={(e) => { setDiscoveryNotes(e.target.value); setHasChanges(true) }}
          />
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button
          variant="outline"
          onClick={() => handleSave(false)}
          disabled={saving || !hasChanges}
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Draft'}
        </Button>
        {!isCompleted && (
          <Button
            onClick={() => handleSave(true)}
            disabled={saving}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Mark Discovery Complete'}
          </Button>
        )}
      </div>
    </div>
  )
}
