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
import { createClient, type CreateClientData } from '@/lib/api/clients'
import { handleApiError, showSuccess } from '@/lib/utils/errorHandler'
import {
  Building2,
  User,
  Mail,
  Phone,
  Globe,
  Briefcase,
  FileText,
  Loader2,
  Plus
} from 'lucide-react'
import { Card } from '@/components/ui/card'

// Validation Schema
const newClientSchema = z.object({
  company_name: z.string().min(1, 'Company name is required'),
  contact_name: z.string().optional(),
  contact_email: z.string().email('Invalid email address').optional().or(z.literal('')),
  contact_phone: z.string().optional(),
  industry: z.string().optional(),
  website: z.string().url('Invalid URL (must start with http:// or https://)').optional().or(z.literal('')),
  notes: z.string().optional(),
})

type NewClientForm = z.infer<typeof newClientSchema>

export default function NewClientPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NewClientForm>({
    resolver: zodResolver(newClientSchema),
  })

  const onSubmit = async (data: NewClientForm) => {
    setIsSubmitting(true)
    try {
      // Clean up empty strings to null for backend
      const cleanData: CreateClientData = {
        company_name: data.company_name,
        contact_name: data.contact_name || null,
        contact_email: data.contact_email || null,
        contact_phone: data.contact_phone || null,
        industry: data.industry || null,
        website: data.website || null,
        notes: data.notes || null,
      }

      const newClient = await createClient(cleanData)

      showSuccess(`Client "${newClient.company_name}" added successfully`)
      // Redirect to the new Client Dashboard (which we created in the previous step)
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
        maxWidth="3xl"
        breadcrumbs={[
          { label: 'Clients', href: '/clients' },
          { label: 'New Client' },
        ]}
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Add New Client</h1>
          <p className="text-muted-foreground mt-1">
            Create a profile for a new company to begin managing their nexus compliance.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Card className="p-6 space-y-8 bg-card border-border shadow-sm">

            {/* Section 1: Company Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border/60">
                <Building2 className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Company Details</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="company_name">Company Name <span className="text-destructive">*</span></Label>
                  <Input
                    id="company_name"
                    placeholder="e.g. Acme Corp, Inc."
                    {...register('company_name')}
                    className={errors.company_name ? "border-destructive" : ""}
                  />
                  {errors.company_name && (
                    <p className="text-sm text-destructive">{errors.company_name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="industry" className="flex items-center gap-2">
                    <Briefcase className="h-3.5 w-3.5 text-muted-foreground" /> Industry
                  </Label>
                  <Input
                    id="industry"
                    placeholder="e.g. SaaS, E-commerce, Manufacturing"
                    {...register('industry')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website" className="flex items-center gap-2">
                    <Globe className="h-3.5 w-3.5 text-muted-foreground" /> Website
                  </Label>
                  <Input
                    id="website"
                    placeholder="https://example.com"
                    {...register('website')}
                  />
                  {errors.website && (
                    <p className="text-sm text-destructive">{errors.website.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Section 2: Primary Contact */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border/60">
                <User className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Primary Contact</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 col-span-2 md:col-span-2">
                  <Label htmlFor="contact_name">Contact Name</Label>
                  <Input
                    id="contact_name"
                    placeholder="e.g. Jane Doe"
                    {...register('contact_name')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_email" className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" /> Email
                  </Label>
                  <Input
                    id="contact_email"
                    type="email"
                    placeholder="jane@example.com"
                    {...register('contact_email')}
                  />
                  {errors.contact_email && (
                    <p className="text-sm text-destructive">{errors.contact_email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_phone" className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-muted-foreground" /> Phone
                  </Label>
                  <Input
                    id="contact_phone"
                    placeholder="(555) 123-4567"
                    {...register('contact_phone')}
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Notes */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-border/60">
                <FileText className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Internal Notes</h2>
              </div>

              <Textarea
                placeholder="Add any initial notes about this client, tax situation, or specific requirements..."
                className="min-h-[100px]"
                {...register('notes')}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-4 pt-4 border-t border-border/60">
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="min-w-[140px]">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" /> Create Client
                  </>
                )}
              </Button>
            </div>

          </Card>
        </form>
      </AppLayout>
    </ProtectedRoute>
  )
}
