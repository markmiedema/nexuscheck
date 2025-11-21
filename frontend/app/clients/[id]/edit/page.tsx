'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { getClient, updateClient, type CreateClientData } from '@/lib/api/clients'
import { handleApiError, showSuccess } from '@/lib/utils/errorHandler'
import ProtectedRoute from '@/components/ProtectedRoute'
import AppLayout from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { Loader2, Save, ArrowLeft } from 'lucide-react'

// Validation Schema (Similar to Create, but simplified for Edit)
const editClientSchema = z.object({
  company_name: z.string().min(1, 'Company name is required'),
  contact_name: z.string().optional(),
  contact_email: z.string().email('Invalid email').optional().or(z.literal('')),
  contact_phone: z.string().optional(),
  industry: z.string().optional(),
  website: z.string().optional().or(z.literal('')),
  status: z.string().optional(), // <--- The Key Field
  notes: z.string().optional(),
})

type EditClientForm = z.infer<typeof editClientSchema>

export default function EditClientPage() {
  const router = useRouter()
  const params = useParams()
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentStatus, setCurrentStatus] = useState<string>('prospect')

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<EditClientForm>({
    resolver: zodResolver(editClientSchema),
  })

  // 1. Load Existing Data
  useEffect(() => {
    async function loadData() {
      try {
        const client = await getClient(params.id as string)

        const status = client.status || 'prospect'
        setCurrentStatus(status)

        // Populate Form
        reset({
          company_name: client.company_name,
          contact_name: client.contact_name || '',
          contact_email: client.contact_email || '',
          contact_phone: client.contact_phone || '',
          industry: client.industry || '',
          website: client.website || '',
          status: status,
          notes: client.notes || '',
        })
      } catch (error) {
        handleApiError(error, { userMessage: 'Failed to load client details' })
        router.push('/clients')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [params.id, reset, router])

  // 2. Handle Updates
  const onSubmit = async (data: EditClientForm) => {
    setIsSubmitting(true)
    try {
      // Map form data to API payload
      const updateData: Partial<CreateClientData> = {
        company_name: data.company_name,
        contact_name: data.contact_name || null,
        contact_email: data.contact_email || null,
        contact_phone: data.contact_phone || null,
        industry: data.industry || null,
        website: data.website || null,
        status: data.status,
        notes: data.notes || null,
        // Note: Nested profile updates require a backend update to support PATCH.
        // For now, we focus on the status change.
      }

      await updateClient(params.id as string, updateData)
      showSuccess('Client profile updated')
      router.push(`/clients/${params.id}`)
    } catch (error) {
      handleApiError(error, { userMessage: 'Failed to update client' })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <AppLayout maxWidth="3xl">
          <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>
        </AppLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <AppLayout maxWidth="3xl" breadcrumbs={[
          { label: 'Clients', href: '/clients' },
          { label: 'Edit Profile' }
        ]}>

        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <h1 className="text-2xl font-bold">Edit Client Profile</h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Card className="p-6 space-y-6">

            {/* STATUS SELECTOR - THE MOST IMPORTANT PART */}
            <div className="bg-muted/30 p-4 rounded-lg border border-border/60">
              <Label className="mb-2 block font-semibold">Engagement Status</Label>
              <Select
                onValueChange={(val) => setValue('status', val)}
                defaultValue={currentStatus}
              >
                <SelectTrigger className="bg-background w-full md:w-[50%]">
                  <SelectValue placeholder="Select status..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prospect">Prospect (In Pipeline)</SelectItem>
                  <SelectItem value="active">Active (Paying Client)</SelectItem>
                  <SelectItem value="paused">Paused (On Hold)</SelectItem>
                  <SelectItem value="churned">Churned / Archived</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-2">
                Moving to <strong>Active</strong> will move this client to your main compliance dashboard.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Company Name</Label>
                <Input {...register('company_name')} />
                {errors.company_name && <p className="text-red-500 text-sm">{errors.company_name.message}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Contact Name</Label>
                  <Input {...register('contact_name')} />
                </div>
                <div className="space-y-2">
                  <Label>Contact Email</Label>
                  <Input {...register('contact_email')} />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input {...register('contact_phone')} />
                </div>
                <div className="space-y-2">
                  <Label>Industry</Label>
                  <Input {...register('industry')} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Website</Label>
                <Input {...register('website')} />
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea {...register('notes')} className="min-h-[100px]" />
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t">
              <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                Save Changes
              </Button>
            </div>
          </Card>
        </form>
      </AppLayout>
    </ProtectedRoute>
  )
}
