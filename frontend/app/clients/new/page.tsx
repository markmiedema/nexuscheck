'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import ProtectedRoute from '@/components/ProtectedRoute'
import AppLayout from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient, createClientNote, type CreateClientData } from '@/lib/api/clients'
import { handleApiError, showSuccess } from '@/lib/utils/errorHandler'
import {
  Building2,
  User,
  Globe,
  Briefcase,
  Loader2,
  Plus,
  Database,
  ShoppingCart,
  FileText
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

// --- Enhanced Validation Schema ---
const newClientSchema = z.object({
  // Core Identity
  company_name: z.string().min(1, 'Company name is required'),
  contact_name: z.string().optional(),
  contact_email: z.string().email('Invalid email address').optional().or(z.literal('')),
  contact_phone: z.string().optional(),
  industry: z.string().optional(),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  notes: z.string().optional(),

  // Business DNA (Booleans)
  is_marketplace_seller: z.boolean().default(false),
  percent_marketplace_revenue: z.coerce.number().min(0).max(100).optional(),
  sells_tpp: z.boolean().default(false),
  sells_saas: z.boolean().default(false),
  sells_digital_goods: z.boolean().default(false),
  has_inventory_3pl: z.boolean().default(false),

  // Tech Stack
  erp_system: z.string().optional(),
  tax_engine: z.string().optional(),
  ecommerce_platform: z.string().optional(),
})

type NewClientForm = z.infer<typeof newClientSchema>

export default function NewClientPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<NewClientForm>({
    resolver: zodResolver(newClientSchema),
    defaultValues: {
      sells_tpp: false,
      is_marketplace_seller: false,
      sells_saas: false,
      has_inventory_3pl: false,
      sells_digital_goods: false
    }
  })

  // Watch this field to conditionally show the "% Revenue" input
  const isMarketplace = watch('is_marketplace_seller')

  const onSubmit = async (data: NewClientForm) => {
    setIsSubmitting(true)
    try {
      // Construct the nested payload matching our new Backend API
      const payload: CreateClientData = {
        company_name: data.company_name,
        contact_name: data.contact_name || null,
        contact_email: data.contact_email || null,
        contact_phone: data.contact_phone || null,
        industry: data.industry || null,
        website: data.website || null,
        notes: data.notes || null,
        status: 'prospect',

        // Map flat form fields to nested Business Profile object
        business_profile: {
          is_marketplace_seller: data.is_marketplace_seller,
          percent_marketplace_revenue: data.percent_marketplace_revenue || 0,
          sells_tpp: data.sells_tpp,
          sells_saas: data.sells_saas,
          sells_digital_goods: data.sells_digital_goods,
          has_inventory_3pl: data.has_inventory_3pl,
          uses_fba: false, // Default for now
          marketplace_channels: []
        },

        // Map flat form fields to nested Tech Stack object
        tech_stack: {
          erp_system: data.erp_system || undefined,
          tax_engine: data.tax_engine || undefined,
          ecommerce_platform: data.ecommerce_platform || undefined
        }
      }

      const newClient = await createClient(payload)

      // Log activity note for client creation
      try {
        const noteContent = data.notes
          ? `New client onboarded. Discovery notes: ${data.notes}`
          : 'New client onboarded'
        await createClientNote(newClient.id, {
          content: noteContent,
          note_type: 'discovery'
        })
      } catch {
        // Silently fail - note creation is not critical
        console.warn('Failed to create onboarding activity note')
      }

      showSuccess(`Client "${newClient.company_name}" added successfully`)
      router.push(`/clients/${newClient.id}`)
    } catch (error) {
      handleApiError(error, { userMessage: 'Failed to create client' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ProtectedRoute>
      <AppLayout
        maxWidth="4xl"
        breadcrumbs={[
          { label: 'Clients', href: '/clients' },
          { label: 'New Client' },
        ]}
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Strategic Onboarding</h1>
          <p className="text-muted-foreground mt-1">
            Create a detailed profile to automate nexus analysis and compliance scoping.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* --- LEFT COLUMN: Identity & Tech --- */}
            <div className="space-y-6">
              {/* 1. Identity Card */}
              <Card className="p-6 space-y-4 bg-card border-border shadow-sm">
                <div className="flex items-center gap-2 pb-2 border-b border-border/60">
                  <Building2 className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">Company Identity</h2>
                </div>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="company_name">Company Name <span className="text-destructive">*</span></Label>
                    <Input
                      id="company_name"
                      placeholder="e.g. Acme Corp"
                      {...register('company_name')}
                      className={errors.company_name ? "border-destructive" : ""}
                    />
                    {errors.company_name && (
                      <p className="text-sm text-destructive">{errors.company_name.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Row 1: Name (Full Width) */}
                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="contact_name">Contact Name</Label>
                      <Input id="contact_name" {...register('contact_name')} />
                    </div>

                    {/* Row 2: Email & Phone (Split 50/50) */}
                    <div className="space-y-2">
                      <Label htmlFor="contact_email">Email</Label>
                      <Input id="contact_email" {...register('contact_email')} />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="contact_phone">Phone</Label>
                      <Input
                        id="contact_phone"
                        placeholder="(555) 123-4567"
                        {...register('contact_phone')}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input id="website" placeholder="https://" {...register('website')} />
                  </div>
                </div>
              </Card>

              {/* 2. Tech Stack Card */}
              <Card className="p-6 space-y-4 bg-card border-border shadow-sm">
                <div className="flex items-center gap-2 pb-2 border-b border-border/60">
                  <Database className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">Technical Stack</h2>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>ERP / Accounting</Label>
                    <Input placeholder="e.g. NetSuite" {...register('erp_system')} />
                  </div>
                  <div className="space-y-2">
                    <Label>Ecommerce</Label>
                    <Input placeholder="e.g. Shopify" {...register('ecommerce_platform')} />
                  </div>

                  <div className="space-y-2 col-span-2">
                    <Label>Current Tax Engine</Label>
                    <Select onValueChange={(val) => setValue('tax_engine', val)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select engine (if any)..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="avalara">Avalara AvaTax</SelectItem>
                        <SelectItem value="vertex">Vertex O Series</SelectItem>
                        <SelectItem value="taxjar">Stripe Tax / TaxJar</SelectItem>
                        <SelectItem value="anrok">Anrok</SelectItem>
                        <SelectItem value="none">None / Manual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </Card>
            </div>

            {/* --- RIGHT COLUMN: Business DNA (Scope) --- */}
            <div className="space-y-6">
              <Card className="p-6 space-y-4 bg-card border-border shadow-sm border-l-4 border-l-primary">
                <div className="flex items-center gap-2 pb-2 border-b border-border/60">
                  <Briefcase className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">Business DNA (Scope)</h2>
                </div>

                <div className="space-y-4">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Product Taxonomy
                  </Label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center space-x-3 border p-3 rounded-md hover:bg-muted/50 transition-colors">
                      <Checkbox
                        id="sells_tpp"
                        onCheckedChange={(c) => setValue('sells_tpp', !!c)}
                        defaultChecked={true}
                      />
                      <Label htmlFor="sells_tpp" className="cursor-pointer font-normal">Tangible Goods</Label>
                    </div>

                    <div className="flex items-center space-x-3 border p-3 rounded-md hover:bg-muted/50 transition-colors">
                      <Checkbox
                        id="sells_saas"
                        onCheckedChange={(c) => setValue('sells_saas', !!c)}
                      />
                      <Label htmlFor="sells_saas" className="cursor-pointer font-normal">SaaS / Software</Label>
                    </div>

                    <div className="flex items-center space-x-3 border p-3 rounded-md hover:bg-muted/50 transition-colors">
                      <Checkbox
                        id="sells_digital"
                        onCheckedChange={(c) => setValue('sells_digital_goods', !!c)}
                      />
                      <Label htmlFor="sells_digital" className="cursor-pointer font-normal">Digital Goods</Label>
                    </div>

                    <div className="flex items-center space-x-3 border p-3 rounded-md hover:bg-muted/50 transition-colors">
                      <Checkbox
                        id="has_3pl"
                        onCheckedChange={(c) => setValue('has_inventory_3pl', !!c)}
                      />
                      <Label htmlFor="has_3pl" className="cursor-pointer font-normal">Has 3PL / Inventory</Label>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="is_marketplace"
                        onCheckedChange={(c) => setValue('is_marketplace_seller', !!c)}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <Label htmlFor="is_marketplace" className="cursor-pointer font-medium flex items-center gap-2">
                          <ShoppingCart className="h-3.5 w-3.5" /> Sells on Marketplaces?
                        </Label>
                        <p className="text-[11px] text-muted-foreground">
                          Amazon, Walmart, Etsy, etc.
                        </p>
                      </div>
                    </div>

                    {/* Conditional Input for Marketplace % */}
                    {isMarketplace && (
                       <div className="pl-7 pt-2 animate-in slide-in-from-top-2 fade-in duration-300">
                          <Label className="text-xs">Est. % of Revenue via Marketplace</Label>
                          <div className="flex items-center gap-2 mt-1.5">
                            <Input
                              type="number"
                              className="w-24 h-8"
                              {...register('percent_marketplace_revenue')}
                              placeholder="0"
                            />
                            <span className="text-sm text-muted-foreground">%</span>
                          </div>
                       </div>
                    )}
                  </div>
                </div>
              </Card>

              <Card className="p-6 space-y-4 bg-card border-border shadow-sm">
                 <div className="flex items-center gap-2 pb-2 border-b border-border/60">
                    <FileText className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold text-foreground">Notes</h2>
                 </div>
                 <Textarea
                    placeholder="Initial discovery notes..."
                    className="min-h-[100px]"
                    {...register('notes')}
                 />
              </Card>
            </div>
          </div>

          {/* --- ACTIONS --- */}
          <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="min-w-[160px]">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" /> Create Client Profile
                </>
              )}
            </Button>
          </div>
        </form>
      </AppLayout>
    </ProtectedRoute>
  )
}
