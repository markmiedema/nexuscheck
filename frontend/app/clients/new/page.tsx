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
import { createClient, createClientNote, type CreateClientData } from '@/lib/api/clients'
import apiClient from '@/lib/api/client'
import { handleApiError, showSuccess } from '@/lib/utils/errorHandler'
import {
  Building2,
  Loader2,
  Plus,
  FileText,
  ArrowRight
} from 'lucide-react'
import { Card } from '@/components/ui/card'

// Simplified validation schema - just the essentials
const newClientSchema = z.object({
  company_name: z.string().min(1, 'Company name is required'),
  contact_name: z.string().optional(),
  contact_email: z.string().email('Invalid email address').optional().or(z.literal('')),
  contact_phone: z.string().optional(),
  industry: z.string().optional(),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
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
      // Simple payload - no business profile or tech stack
      // Those details are captured during Discovery
      const payload: CreateClientData = {
        company_name: data.company_name,
        contact_name: data.contact_name || null,
        contact_email: data.contact_email || null,
        contact_phone: data.contact_phone || null,
        industry: data.industry || null,
        website: data.website || null,
        notes: data.notes || null,
        status: 'prospect',
        lifecycle_status: 'prospect',
      }

      const newClient = await createClient(payload)

      // Create primary contact in Team Roster if contact info was provided
      if (data.contact_name) {
        try {
          await apiClient.post(`/api/v1/clients/${newClient.id}/contacts`, {
            name: data.contact_name,
            role: 'Primary Contact',
            email: data.contact_email || null,
            phone: data.contact_phone || null,
            is_primary: true
          })
        } catch {
          // Silently fail - contact creation is not critical
          console.warn('Failed to create primary contact')
        }
      }

      // Log activity note for client creation
      try {
        const noteContent = data.notes
          ? `Initial contact - client record created. Notes: ${data.notes}`
          : 'Initial contact - client record created'
        await createClientNote(newClient.id, {
          content: noteContent,
          note_type: 'call'
        })
      } catch {
        // Silently fail - note creation is not critical
        console.warn('Failed to create activity note')
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
        maxWidth="2xl"
        breadcrumbs={[
          { label: 'Clients', href: '/clients' },
          { label: 'New Client' },
        ]}
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Add New Client</h1>
          <p className="text-muted-foreground mt-1">
            Start with the basics. Business details are captured during the Discovery meeting.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-6 max-w-2xl">

            {/* Company Identity Card */}
            <Card className="p-6 space-y-4 bg-card border-border shadow-sm">
              <div className="flex items-center gap-2 pb-2 border-b border-border/60">
                <Building2 className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Company Information</h2>
              </div>

              <div className="space-y-4">
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry</Label>
                    <Input id="industry" placeholder="e.g. E-commerce, Manufacturing" {...register('industry')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input id="website" placeholder="https://" {...register('website')} />
                  </div>
                </div>
              </div>
            </Card>

            {/* Primary Contact Card */}
            <Card className="p-6 space-y-4 bg-card border-border shadow-sm">
              <div className="flex items-center gap-2 pb-2 border-b border-border/60">
                <Building2 className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Primary Contact</h2>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_name">Contact Name</Label>
                  <Input id="contact_name" placeholder="e.g. Jane Smith" {...register('contact_name')} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact_email">Email</Label>
                    <Input id="contact_email" type="email" placeholder="jane@acme.com" {...register('contact_email')} />
                    {errors.contact_email && (
                      <p className="text-sm text-destructive">{errors.contact_email.message}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact_phone">Phone</Label>
                    <Input id="contact_phone" placeholder="(555) 123-4567" {...register('contact_phone')} />
                  </div>
                </div>
              </div>
            </Card>

            {/* Notes Card */}
            <Card className="p-6 space-y-4 bg-card border-border shadow-sm">
              <div className="flex items-center gap-2 pb-2 border-b border-border/60">
                <FileText className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Notes</h2>
              </div>
              <Textarea
                placeholder="How did they find us? Any initial context..."
                className="min-h-[100px]"
                {...register('notes')}
              />
            </Card>

            {/* Next Steps Info */}
            <div className="p-4 bg-muted/50 rounded-lg border border-border">
              <div className="flex items-start gap-3">
                <ArrowRight className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">Next: Schedule Discovery Meeting</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    After creating the client, complete the Discovery Profile to capture business details,
                    sales channels, and physical presence indicators needed for nexus analysis.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-4 pt-4 border-t border-border">
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
                    <Plus className="mr-2 h-4 w-4" /> Add Client
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </AppLayout>
    </ProtectedRoute>
  )
}
