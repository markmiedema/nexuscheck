'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
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
import { US_STATE_CODES } from '@/lib/constants/states'

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

// ERP/Accounting options
const ERP_OPTIONS = [
  { value: 'netsuite', label: 'NetSuite' },
  { value: 'quickbooks', label: 'QuickBooks' },
  { value: 'xero', label: 'Xero' },
  { value: 'sage', label: 'Sage' },
  { value: 'freshbooks', label: 'FreshBooks' },
  { value: 'other', label: 'Other' },
  { value: 'none', label: 'None / Manual' },
]

// E-commerce platform options
const ECOMMERCE_OPTIONS = [
  { value: 'shopify', label: 'Shopify' },
  { value: 'woocommerce', label: 'WooCommerce' },
  { value: 'bigcommerce', label: 'BigCommerce' },
  { value: 'magento', label: 'Magento' },
  { value: 'amazon', label: 'Amazon Seller Central' },
  { value: 'squarespace', label: 'Squarespace' },
  { value: 'custom', label: 'Custom Build' },
  { value: 'none', label: 'None / N/A' },
]

// Tax engine options
const TAX_ENGINE_OPTIONS = [
  { value: 'avalara', label: 'Avalara AvaTax' },
  { value: 'vertex', label: 'Vertex O Series' },
  { value: 'taxjar', label: 'Stripe Tax / TaxJar' },
  { value: 'anrok', label: 'Anrok' },
  { value: 'sovos', label: 'Sovos' },
  { value: 'other', label: 'Other' },
  { value: 'none', label: 'None / Manual' },
]

interface DiscoveryProfileProps {
  clientId: string
  initialData?: {
    channels?: string[]
    product_types?: string[]
    systems?: string[]
    has_remote_employees?: boolean
    remote_employee_states?: string[]
    remote_employee_state_dates?: Record<string, string>  // State code -> date
    has_inventory_3pl?: boolean
    inventory_3pl_states?: string[]
    inventory_3pl_state_dates?: Record<string, string>  // State code -> date
    has_office?: boolean
    office_states?: string[]
    office_state_dates?: Record<string, string>  // State code -> date
    estimated_annual_revenue?: string
    transaction_volume?: string
    current_registration_count?: number
    registered_states?: string[]
    registered_state_dates?: Record<string, string>  // State code -> registration date
    discovery_completed_at?: string
    discovery_notes?: string
    // Tech integration fields
    erp_system?: string
    ecommerce_platform?: string
    tax_engine?: string
  }
  onUpdate?: () => void
  onComplete?: () => void  // Called when discovery is marked complete
}

export function DiscoveryProfile({ clientId, initialData, onUpdate, onComplete }: DiscoveryProfileProps) {
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // Form state
  const [channels, setChannels] = useState<string[]>(initialData?.channels || [])
  const [productTypes, setProductTypes] = useState<string[]>(initialData?.product_types || [])
  const [techStack, setTechStack] = useState<string[]>(initialData?.systems || [])
  const [hasRemoteEmployees, setHasRemoteEmployees] = useState(initialData?.has_remote_employees || false)
  const [remoteEmployeeStates, setRemoteEmployeeStates] = useState<string[]>(initialData?.remote_employee_states || [])
  const [remoteEmployeeStateDates, setRemoteEmployeeStateDates] = useState<Record<string, string>>(initialData?.remote_employee_state_dates || {})
  const [hasInventory3pl, setHasInventory3pl] = useState(initialData?.has_inventory_3pl || false)
  const [inventory3plStates, setInventory3plStates] = useState<string[]>(initialData?.inventory_3pl_states || [])
  const [inventory3plStateDates, setInventory3plStateDates] = useState<Record<string, string>>(initialData?.inventory_3pl_state_dates || {})
  const [hasOffice, setHasOffice] = useState(initialData?.has_office || false)
  const [officeStates, setOfficeStates] = useState<string[]>(initialData?.office_states || [])
  const [officeStateDates, setOfficeStateDates] = useState<Record<string, string>>(initialData?.office_state_dates || {})
  const [estimatedRevenue, setEstimatedRevenue] = useState(initialData?.estimated_annual_revenue || '')
  const [transactionVolume, setTransactionVolume] = useState(initialData?.transaction_volume || '')
  const [registrationCount, setRegistrationCount] = useState(initialData?.current_registration_count || 0)
  // Defensive: ensure registered_states is an array
  const [registeredStates, setRegisteredStates] = useState<string[]>(
    Array.isArray(initialData?.registered_states) ? initialData.registered_states : []
  )
  const [registeredStateDates, setRegisteredStateDates] = useState<Record<string, string>>(initialData?.registered_state_dates || {})
  const [discoveryNotes, setDiscoveryNotes] = useState(initialData?.discovery_notes || '')
  // Tech integration fields
  const [erpSystem, setErpSystem] = useState(initialData?.erp_system || '')
  const [ecommercePlatform, setEcommercePlatform] = useState(initialData?.ecommerce_platform || '')
  const [taxEngine, setTaxEngine] = useState(initialData?.tax_engine || '')

  // Sync state when initialData changes (e.g., after save and refetch)
  useEffect(() => {
    console.log('[DiscoveryProfile] useEffect triggered with initialData:', initialData)
    setChannels(initialData?.channels || [])
    setProductTypes(initialData?.product_types || [])
    setTechStack(initialData?.systems || [])
    setHasRemoteEmployees(initialData?.has_remote_employees || false)
    setRemoteEmployeeStates(initialData?.remote_employee_states || [])
    setRemoteEmployeeStateDates(initialData?.remote_employee_state_dates || {})
    setHasInventory3pl(initialData?.has_inventory_3pl || false)
    setInventory3plStates(initialData?.inventory_3pl_states || [])
    setInventory3plStateDates(initialData?.inventory_3pl_state_dates || {})
    setHasOffice(initialData?.has_office || false)
    setOfficeStates(initialData?.office_states || [])
    setOfficeStateDates(initialData?.office_state_dates || {})
    setEstimatedRevenue(initialData?.estimated_annual_revenue || '')
    setTransactionVolume(initialData?.transaction_volume || '')
    setRegistrationCount(initialData?.current_registration_count || 0)
    setRegisteredStates(initialData?.registered_states || [])
    setRegisteredStateDates(initialData?.registered_state_dates || {})
    setDiscoveryNotes(initialData?.discovery_notes || '')
    setErpSystem(initialData?.erp_system || '')
    setEcommercePlatform(initialData?.ecommerce_platform || '')
    setTaxEngine(initialData?.tax_engine || '')
    setHasChanges(false)
  }, [initialData])

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

  // Helper to detect changes for update notes
  const detectChanges = (): string[] => {
    const changes: string[] = []

    const channelLabels: Record<string, string> = {
      dtc: 'DTC', amazon_fba: 'Amazon FBA', amazon_fbm: 'Amazon FBM',
      wholesale: 'Wholesale', retail: 'Retail', marketplace_other: 'Other Marketplaces'
    }
    const typeLabels: Record<string, string> = {
      physical_goods: 'Tangible Goods', saas: 'SaaS', digital_goods: 'Digital Goods',
      services: 'Services', mixed: 'Mixed'
    }
    const revenueLabels: Record<string, string> = {
      under_100k: 'Under $100K', '100k_500k': '$100K-$500K', '500k_1m': '$500K-$1M',
      '1m_5m': '$1M-$5M', '5m_10m': '$5M-$10M', over_10m: 'Over $10M'
    }
    const volumeLabels: Record<string, string> = {
      low: 'Low', medium: 'Medium', high: 'High'
    }

    // Check channels
    const prevChannels = initialData?.channels || []
    if (JSON.stringify([...channels].sort()) !== JSON.stringify([...prevChannels].sort())) {
      const added = channels.filter(c => !prevChannels.includes(c))
      const removed = prevChannels.filter(c => !channels.includes(c))
      if (added.length) changes.push(`Added sales channels: ${added.map(c => channelLabels[c] || c).join(', ')}`)
      if (removed.length) changes.push(`Removed sales channels: ${removed.map(c => channelLabels[c] || c).join(', ')}`)
    }

    // Check product types
    const prevTypes = initialData?.product_types || []
    if (JSON.stringify([...productTypes].sort()) !== JSON.stringify([...prevTypes].sort())) {
      const added = productTypes.filter(t => !prevTypes.includes(t))
      const removed = prevTypes.filter(t => !productTypes.includes(t))
      if (added.length) changes.push(`Added product types: ${added.map(t => typeLabels[t] || t).join(', ')}`)
      if (removed.length) changes.push(`Removed product types: ${removed.map(t => typeLabels[t] || t).join(', ')}`)
    }

    // Check tech stack
    const prevTech = initialData?.systems || []
    if (JSON.stringify([...techStack].sort()) !== JSON.stringify([...prevTech].sort())) {
      const added = techStack.filter(t => !prevTech.includes(t))
      const removed = prevTech.filter(t => !techStack.includes(t))
      if (added.length) changes.push(`Added systems: ${added.join(', ')}`)
      if (removed.length) changes.push(`Removed systems: ${removed.join(', ')}`)
    }

    // Check ERP
    if (erpSystem !== (initialData?.erp_system || '')) {
      changes.push(`Changed ERP from "${initialData?.erp_system || 'none'}" to "${erpSystem || 'none'}"`)
    }

    // Check E-commerce
    if (ecommercePlatform !== (initialData?.ecommerce_platform || '')) {
      changes.push(`Changed E-commerce from "${initialData?.ecommerce_platform || 'none'}" to "${ecommercePlatform || 'none'}"`)
    }

    // Check Tax Engine
    if (taxEngine !== (initialData?.tax_engine || '')) {
      changes.push(`Changed Tax Engine from "${initialData?.tax_engine || 'none'}" to "${taxEngine || 'none'}"`)
    }

    // Check revenue
    if (estimatedRevenue !== (initialData?.estimated_annual_revenue || '')) {
      changes.push(`Changed revenue from "${revenueLabels[initialData?.estimated_annual_revenue || ''] || 'not set'}" to "${revenueLabels[estimatedRevenue] || 'not set'}"`)
    }

    // Check volume
    if (transactionVolume !== (initialData?.transaction_volume || '')) {
      changes.push(`Changed transaction volume from "${volumeLabels[initialData?.transaction_volume || ''] || 'not set'}" to "${volumeLabels[transactionVolume] || 'not set'}"`)
    }

    // Check remote employees
    if (hasRemoteEmployees !== (initialData?.has_remote_employees || false)) {
      changes.push(hasRemoteEmployees ? 'Enabled remote employees' : 'Disabled remote employees')
    }
    const prevRemoteStates = initialData?.remote_employee_states || []
    if (JSON.stringify([...remoteEmployeeStates].sort()) !== JSON.stringify([...prevRemoteStates].sort())) {
      const added = remoteEmployeeStates.filter(s => !prevRemoteStates.includes(s))
      const removed = prevRemoteStates.filter(s => !remoteEmployeeStates.includes(s))
      if (added.length) changes.push(`Added remote employee states: ${added.join(', ')}`)
      if (removed.length) changes.push(`Removed remote employee states: ${removed.join(', ')}`)
    }

    // Check 3PL/inventory
    if (hasInventory3pl !== (initialData?.has_inventory_3pl || false)) {
      changes.push(hasInventory3pl ? 'Enabled 3PL/FBA inventory' : 'Disabled 3PL/FBA inventory')
    }
    const prevInventoryStates = initialData?.inventory_3pl_states || []
    if (JSON.stringify([...inventory3plStates].sort()) !== JSON.stringify([...prevInventoryStates].sort())) {
      const added = inventory3plStates.filter(s => !prevInventoryStates.includes(s))
      const removed = prevInventoryStates.filter(s => !inventory3plStates.includes(s))
      if (added.length) changes.push(`Added inventory states: ${added.join(', ')}`)
      if (removed.length) changes.push(`Removed inventory states: ${removed.join(', ')}`)
    }

    // Check office locations
    if (hasOffice !== (initialData?.has_office || false)) {
      changes.push(hasOffice ? 'Enabled office/physical locations' : 'Disabled office/physical locations')
    }
    const prevOfficeStates = initialData?.office_states || []
    if (JSON.stringify([...officeStates].sort()) !== JSON.stringify([...prevOfficeStates].sort())) {
      const added = officeStates.filter(s => !prevOfficeStates.includes(s))
      const removed = prevOfficeStates.filter(s => !officeStates.includes(s))
      if (added.length) changes.push(`Added office states: ${added.join(', ')}`)
      if (removed.length) changes.push(`Removed office states: ${removed.join(', ')}`)
    }

    // Check registered states
    const prevRegistered = initialData?.registered_states || []
    if (JSON.stringify([...registeredStates].sort()) !== JSON.stringify([...prevRegistered].sort())) {
      const added = registeredStates.filter(s => !prevRegistered.includes(s))
      const removed = prevRegistered.filter(s => !registeredStates.includes(s))
      if (added.length) changes.push(`Added registered states: ${added.join(', ')}`)
      if (removed.length) changes.push(`Removed registered states: ${removed.join(', ')}`)
    }

    // Check notes
    if (discoveryNotes !== (initialData?.discovery_notes || '')) {
      changes.push('Updated discovery notes')
    }

    return changes
  }

  // Save discovery profile
  const handleSave = async (markComplete: boolean = false) => {
    setSaving(true)

    // Detect changes before saving (for update notes)
    const changes = detectChanges()

    try {
      const payload: any = {
        channels,
        product_types: productTypes,
        systems: techStack,
        has_remote_employees: hasRemoteEmployees,
        remote_employee_states: remoteEmployeeStates,
        remote_employee_state_dates: remoteEmployeeStateDates,
        has_inventory_3pl: hasInventory3pl,
        inventory_3pl_states: inventory3plStates,
        inventory_3pl_state_dates: inventory3plStateDates,
        has_office: hasOffice,
        office_states: officeStates,
        office_state_dates: officeStateDates,
        estimated_annual_revenue: estimatedRevenue || null,
        transaction_volume: transactionVolume || null,
        current_registration_count: registrationCount,
        registered_states: registeredStates,
        registered_state_dates: registeredStateDates,
        discovery_notes: discoveryNotes || null,
        // Tech integration fields
        erp_system: erpSystem || null,
        ecommerce_platform: ecommercePlatform || null,
        tax_engine: taxEngine || null,
      }

      if (markComplete) {
        payload.discovery_completed_at = new Date().toISOString()
      }

      console.log('[DiscoveryProfile] Saving payload:', JSON.stringify(payload, null, 2))
      const response = await apiClient.patch(`/api/v1/clients/${clientId}`, payload)
      console.log('[DiscoveryProfile] Save response:', response.data)

      // If marking complete, create an activity note summarizing the discovery
      if (markComplete) {
        const summaryParts: string[] = []

        // Product types
        if (productTypes.length > 0) {
          const typeLabels: Record<string, string> = {
            physical_goods: 'Tangible Goods',
            saas: 'SaaS',
            digital_goods: 'Digital Goods',
            services: 'Services',
            mixed: 'Mixed'
          }
          summaryParts.push(`Product Types: ${productTypes.map(t => typeLabels[t] || t).join(', ')}`)
        }

        // Sales channels
        if (channels.length > 0) {
          const channelLabels: Record<string, string> = {
            dtc: 'DTC',
            amazon_fba: 'Amazon FBA',
            amazon_fbm: 'Amazon FBM',
            wholesale: 'Wholesale',
            retail: 'Retail',
            marketplace_other: 'Other Marketplaces'
          }
          summaryParts.push(`Sales Channels: ${channels.map(c => channelLabels[c] || c).join(', ')}`)
        }

        // Tech stack
        const techParts: string[] = []
        if (erpSystem) techParts.push(`ERP: ${erpSystem}`)
        if (ecommercePlatform) techParts.push(`E-Comm: ${ecommercePlatform}`)
        if (taxEngine) techParts.push(`Tax Engine: ${taxEngine}`)
        if (techParts.length > 0) summaryParts.push(techParts.join(' | '))

        // Revenue
        if (estimatedRevenue) {
          const revenueLabels: Record<string, string> = {
            under_100k: 'Under $100K',
            '100k_500k': '$100K-$500K',
            '500k_1m': '$500K-$1M',
            '1m_5m': '$1M-$5M',
            '5m_10m': '$5M-$10M',
            over_10m: 'Over $10M'
          }
          summaryParts.push(`Est. Revenue: ${revenueLabels[estimatedRevenue] || estimatedRevenue}`)
        }

        // Physical nexus warnings
        const nexusWarnings: string[] = []
        if (hasRemoteEmployees && remoteEmployeeStates.length > 0) {
          nexusWarnings.push(`Remote employees in: ${remoteEmployeeStates.join(', ')}`)
        }
        if (hasInventory3pl && inventory3plStates.length > 0) {
          nexusWarnings.push(`3PL/FBA inventory in: ${inventory3plStates.join(', ')}`)
        }
        if (hasOffice && officeStates.length > 0) {
          nexusWarnings.push(`Office/physical locations in: ${officeStates.join(', ')}`)
        }
        if (nexusWarnings.length > 0) {
          summaryParts.push(`⚠️ Physical Nexus: ${nexusWarnings.join('; ')}`)
        }

        // Registered states
        if (registeredStates.length > 0) {
          summaryParts.push(`Currently registered in ${registeredStates.length} states: ${registeredStates.join(', ')}`)
        }

        const noteContent = `Discovery meeting completed.\n\n${summaryParts.join('\n')}`

        try {
          await apiClient.post(`/api/v1/clients/${clientId}/notes`, {
            content: noteContent,
            note_type: 'discovery'
          })
        } catch (noteError) {
          console.error('[DiscoveryProfile] Failed to create discovery note:', noteError)
          // Don't fail the whole operation if note creation fails
        }
      } else if (changes.length > 0) {
        // Create an update note when changes are saved (not completing)
        const noteContent = `Discovery profile updated:\n\n${changes.map(c => `• ${c}`).join('\n')}`

        try {
          await apiClient.post(`/api/v1/clients/${clientId}/notes`, {
            content: noteContent,
            note_type: 'discovery_update'
          })
        } catch (noteError) {
          console.error('[DiscoveryProfile] Failed to create update note:', noteError)
          // Don't fail the whole operation if note creation fails
        }
      }

      showSuccess(markComplete ? 'Discovery profile completed!' : 'Discovery profile saved')
      setHasChanges(false)

      if (markComplete) {
        onComplete?.()  // Switch to Activity tab after completing
      } else {
        onUpdate?.()
      }
    } catch (error) {
      console.error('[DiscoveryProfile] Save error:', error)
      handleApiError(error, { userMessage: 'Failed to save discovery profile' })
    } finally {
      setSaving(false)
    }
  }

  // Calculate physical nexus risk indicators
  const hasPhysicalNexusRisk = hasRemoteEmployees || hasInventory3pl || hasOffice || channels.includes('amazon_fba')

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
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Laptop className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold">Technology Stack</h3>
          </div>

          {/* Primary Systems - Specific selections for integrations */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="space-y-2">
              <Label>ERP / Accounting</Label>
              <Select value={erpSystem} onValueChange={(v) => { setErpSystem(v); setHasChanges(true) }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select ERP..." />
                </SelectTrigger>
                <SelectContent>
                  {ERP_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>E-commerce Platform</Label>
              <Select value={ecommercePlatform} onValueChange={(v) => { setEcommercePlatform(v); setHasChanges(true) }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select platform..." />
                </SelectTrigger>
                <SelectContent>
                  {ECOMMERCE_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Current Tax Engine</Label>
              <Select value={taxEngine} onValueChange={(v) => { setTaxEngine(v); setHasChanges(true) }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select tax engine..." />
                </SelectTrigger>
                <SelectContent>
                  {TAX_ENGINE_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Additional Systems - Badge multi-select */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Additional Systems (select all that apply)</Label>
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                <div className="ml-7 space-y-3">
                  <Label className="text-xs text-muted-foreground">Select states with employees:</Label>
                  <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto p-2 border rounded-md">
                    {US_STATE_CODES.map(state => (
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
                  {/* Date inputs for selected states */}
                  {remoteEmployeeStates.length > 0 && (
                    <div className="space-y-2 pt-2 border-t">
                      <Label className="text-xs text-muted-foreground">When was nexus established?</Label>
                      {remoteEmployeeStates.map(state => (
                        <div key={state} className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300 w-10 justify-center">{state}</Badge>
                          <Input
                            type="date"
                            className="h-8 text-sm w-36"
                            value={remoteEmployeeStateDates[state] || ''}
                            onChange={(e) => {
                              setRemoteEmployeeStateDates(prev => ({ ...prev, [state]: e.target.value }))
                              setHasChanges(true)
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
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
                <div className="ml-7 space-y-3">
                  <Label className="text-xs text-muted-foreground">Select states with inventory:</Label>
                  <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto p-2 border rounded-md">
                    {US_STATE_CODES.map(state => (
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
                  {/* Date inputs for selected states */}
                  {inventory3plStates.length > 0 && (
                    <div className="space-y-2 pt-2 border-t">
                      <Label className="text-xs text-muted-foreground">When was nexus established?</Label>
                      {inventory3plStates.map(state => (
                        <div key={state} className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300 w-10 justify-center">{state}</Badge>
                          <Input
                            type="date"
                            className="h-8 text-sm w-36"
                            value={inventory3plStateDates[state] || ''}
                            onChange={(e) => {
                              setInventory3plStateDates(prev => ({ ...prev, [state]: e.target.value }))
                              setHasChanges(true)
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Office / Physical Location */}
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <Checkbox
                  checked={hasOffice}
                  onCheckedChange={(checked) => { setHasOffice(!!checked); setHasChanges(true) }}
                />
                <span className="font-medium">Has Office / Physical Location</span>
              </label>
              {hasOffice && (
                <div className="ml-7 space-y-3">
                  <Label className="text-xs text-muted-foreground">Select states with offices:</Label>
                  <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto p-2 border rounded-md">
                    {US_STATE_CODES.map(state => (
                      <Badge
                        key={state}
                        variant="outline"
                        className={`cursor-pointer text-xs ${
                          officeStates.includes(state)
                            ? 'bg-red-100 border-red-300 text-red-700 dark:bg-red-900/30 dark:border-red-700 dark:text-red-300'
                            : 'hover:bg-muted'
                        }`}
                        onClick={() => toggleState(state, officeStates, setOfficeStates)}
                      >
                        {state}
                      </Badge>
                    ))}
                  </div>
                  {/* Date inputs for selected states */}
                  {officeStates.length > 0 && (
                    <div className="space-y-2 pt-2 border-t">
                      <Label className="text-xs text-muted-foreground">When was nexus established?</Label>
                      {officeStates.map(state => (
                        <div key={state} className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300 w-10 justify-center">{state}</Badge>
                          <Input
                            type="date"
                            className="h-8 text-sm w-36"
                            value={officeStateDates[state] || ''}
                            onChange={(e) => {
                              setOfficeStateDates(prev => ({ ...prev, [state]: e.target.value }))
                              setHasChanges(true)
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
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
            {US_STATE_CODES.map(state => (
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
          {/* Registration date inputs for selected states */}
          {registeredStates.length > 0 && (
            <div className="space-y-2 pt-3 mt-3 border-t">
              <Label className="text-xs text-muted-foreground">When was registration effective?</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {registeredStates.map(state => (
                  <div key={state} className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-300 w-10 justify-center shrink-0">{state}</Badge>
                    <Input
                      type="date"
                      className="h-8 text-sm flex-1"
                      value={registeredStateDates[state] || ''}
                      onChange={(e) => {
                        setRegisteredStateDates(prev => ({ ...prev, [state]: e.target.value }))
                        setHasChanges(true)
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
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
