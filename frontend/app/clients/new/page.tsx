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
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient, type CreateClientData } from '@/lib/api/clients'
import { handleApiError, showSuccess } from '@/lib/utils/errorHandler'
import {
  Building2,
  Loader2,
  Plus,
  Database,
  Briefcase
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

// --- Enhanced Validation Schema ---
const newClientSchema = z.object({
  // Core Identity
  company_name: z.string().min(1, 'Company name is required'),
  contact_name: z.string().optional(),
  contact_email: z.string().email('Invalid email').optional().or(z.literal('')),
  industry: z.string().optional(),
  website: z.string().optional().or(z.literal('')),

  // Business DNA (Booleans)
  is_marketplace_seller: z.boolean().default(false),
  percent_marketplace_revenue: z.coerce.number().min(0).max(100).optional(),
  sells_tpp: z.boolean().default(true),
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

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<NewClientForm>({
    resolver: zodResolver(newClientSchema),
    defaultValues: {
      sells_tpp: true,
      is_marketplace_seller: false,
      sells_saas: false,
      sells_digital_goods: false,
      has_inventory_3pl: false
    }
  })

  // Watch for conditional rendering
  const isMarketplace = watch('is_marketplace_seller')

  const onSubmit = async (data: NewClientForm) => {
    setIsSubmitting(true)
    try {
      // Construct the nested payload
      const payload: CreateClientData = {
        company_name: data.company_name,
        contact_name: data.contact_name || null,
        contact_email: data.contact_email || null,
        industry: data.industry || null,
        website: data.website || null,
        status: 'prospect',

        // Map flat form to nested Business Profile
        business_profile: {
          is_marketplace_seller: data.is_marketplace_seller,
          percent_marketplace_revenue: data.percent_marketplace_revenue,
          sells_tpp: data.sells_tpp,
          sells_saas: data.sells_saas,
          sells_digital_goods: data.sells_digital_goods,
          has_inventory_3pl: data.has_inventory_3pl,
          marketplace_channels: [], // We can add a specific field for this later
          uses_fba: false
        },

        // Map flat form to nested Tech Stack
        tech_stack: {
          erp_system: data.erp_system || undefined,
          tax_engine: data.tax_engine || undefined,
          ecommerce_platform: data.ecommerce_platform || undefined
        }
      }

      const newClient = await createClient(payload)
      showSuccess(`Client "${newClient.company_name}" profile created`)
      router.push(`/clients/${newClient.id}`)
    } catch (error) {
      handleApiError(error, { userMessage: 'Failed to create client' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ProtectedRoute>
      <AppLayout maxWidth="4xl" breadcrumbs={[{ label: 'Clients', href: '/clients' }, { label: 'New Client' }]}>

        <div className="mb-6">
          <h1 className="text-3xl font-bold">Strategic Onboarding</h1>
          <p className="text-muted-foreground">Initialize a new client engagement with discovery data.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* LEFT COL: Core Details */}
            <div className="space-y-6">
              <Card className="p-6 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <Building2 className="h-5 w-5 text-primary" />
                  <h2 className="font-semibold">Identity</h2>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label>Company Name *</Label>
                    <Input {...register('company_name')} className={errors.company_name ? "border-destructive" : ""} />
                    {errors.company_name && <p className="text-xs text-destructive mt-1">{errors.company_name.message}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Contact Name</Label>
                      <Input {...register('contact_name')} />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input {...register('contact_email')} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Industry</Label>
                      <Input {...register('industry')} placeholder="e.g. SaaS, Retail" />
                    </div>
                    <div>
                      <Label>Website</Label>
                      <Input {...register('website')} placeholder="https://" />
                    </div>
                  </div>
                </div>
              </Card>

              {/* Tech Stack Section */}
              <Card className="p-6 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <Database className="h-5 w-5 text-primary" />
                  <h2 className="font-semibold">Technical Landscape</h2>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>ERP / Accounting</Label>
                    <Input {...register('erp_system')} placeholder="e.g. NetSuite, QBO" />
                  </div>
                  <div className="space-y-2">
                    <Label>Ecommerce Platform</Label>
                    <Input {...register('ecommerce_platform')} placeholder="e.g. Shopify" />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>Existing Tax Engine</Label>
                    <Select onValueChange={(val) => setValue('tax_engine', val)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select current engine..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="avalara">Avalara AvaTax</SelectItem>
                        <SelectItem value="vertex">Vertex</SelectItem>
                        <SelectItem value="taxjar">TaxJar</SelectItem>
                        <SelectItem value="anrok">Anrok</SelectItem>
                        <SelectItem value="none">None / Manual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </Card>
            </div>

            {/* RIGHT COL: Business DNA */}
            <div className="space-y-6">
              <Card className="p-6 space-y-4 border-l-4 border-l-primary">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <Briefcase className="h-5 w-5 text-primary" />
                  <h2 className="font-semibold">Business DNA (The "Scope")</h2>
                </div>

                <div className="space-y-4">
                  <Label className="text-muted-foreground text-xs uppercase tracking-wider font-bold">Product Taxonomy</Label>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2 border p-3 rounded hover:bg-muted/50">
                      <Checkbox id="sells_tpp" onCheckedChange={(c) => setValue('sells_tpp', !!c)} defaultChecked={true} />
                      <Label htmlFor="sells_tpp" className="cursor-pointer">Tangible Goods</Label>
                    </div>
                    <div className="flex items-center space-x-2 border p-3 rounded hover:bg-muted/50">
                      <Checkbox id="sells_saas" onCheckedChange={(c) => setValue('sells_saas', !!c)} />
                      <Label htmlFor="sells_saas" className="cursor-pointer">SaaS / Software</Label>
                    </div>
                    <div className="flex items-center space-x-2 border p-3 rounded hover:bg-muted/50">
                      <Checkbox id="sells_digital" onCheckedChange={(c) => setValue('sells_digital_goods', !!c)} />
                      <Label htmlFor="sells_digital" className="cursor-pointer">Digital Goods</Label>
                    </div>
                    <div className="flex items-center space-x-2 border p-3 rounded hover:bg-muted/50">
                      <Checkbox id="has_3pl" onCheckedChange={(c) => setValue('has_inventory_3pl', !!c)} />
                      <Label htmlFor="has_3pl" className="cursor-pointer">Has 3PL Inventory</Label>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="is_marketplace" onCheckedChange={(c) => setValue('is_marketplace_seller', !!c)} />
                      <Label htmlFor="is_marketplace" className="font-medium">Sells on Marketplaces (Amazon/Walmart)?</Label>
                    </div>

                    {isMarketplace && (
                      <div className="pl-6 pt-2 animate-in slide-in-from-top-2">
                        <Label className="text-xs">Est. % of Revenue via Marketplace</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Input
                            type="number"
                            className="w-24"
                            {...register('percent_marketplace_revenue')}
                            placeholder="0"
                          />
                          <span className="text-muted-foreground">%</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          High % reduces compliance risk due to facilitator laws.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </div>

          </div>

          <div className="flex justify-end gap-4 mt-8">
            <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting} className="min-w-[150px]">
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Create Profile
            </Button>
          </div>
        </form>
      </AppLayout>
    </ProtectedRoute>
  )
}
