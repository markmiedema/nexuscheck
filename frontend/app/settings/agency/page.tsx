'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useOrganization, useUpdateOrganization, useUserRole } from '@/hooks/queries'
import ProtectedRoute from '@/components/ProtectedRoute'
import AppLayout from '@/components/layout/AppLayout'
import { ErrorBoundary } from '@/components/error-boundary'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Building2, Palette, FileText, Save, Loader2 } from 'lucide-react'

export default function AgencySettingsPage() {
  const router = useRouter()
  const { data: organization, isLoading: orgLoading } = useOrganization()
  const { data: roleData, isLoading: roleLoading } = useUserRole()
  const updateOrgMutation = useUpdateOrganization()

  const isAdmin = roleData?.role === 'owner' || roleData?.role === 'admin'
  const isLoading = orgLoading || roleLoading

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    billing_email: '',
    // Portal branding
    portal_company_name: '',
    portal_tagline: '',
    portal_support_email: '',
    portal_support_phone: '',
    portal_primary_color: '#3b82f6',
    // Report branding
    report_company_name: '',
    report_address_block: '',
    report_footer_text: '',
  })

  // Initialize form when org data loads
  useEffect(() => {
    if (organization) {
      const portalBranding = organization.settings?.portal_branding || {}
      const reportBranding = organization.settings?.report_branding || {}

      setFormData({
        name: organization.name || '',
        billing_email: organization.billing_email || '',
        portal_company_name: portalBranding.company_name || '',
        portal_tagline: portalBranding.tagline || '',
        portal_support_email: portalBranding.support_email || '',
        portal_support_phone: portalBranding.support_phone || '',
        portal_primary_color: portalBranding.primary_color || '#3b82f6',
        report_company_name: reportBranding.company_name || '',
        report_address_block: reportBranding.address_block || '',
        report_footer_text: reportBranding.footer_text || '',
      })
    }
  }, [organization])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    updateOrgMutation.mutate({
      name: formData.name,
      billing_email: formData.billing_email || undefined,
      settings: {
        portal_branding: {
          company_name: formData.portal_company_name || undefined,
          tagline: formData.portal_tagline || undefined,
          support_email: formData.portal_support_email || undefined,
          support_phone: formData.portal_support_phone || undefined,
          primary_color: formData.portal_primary_color,
        },
        report_branding: {
          company_name: formData.report_company_name || undefined,
          address_block: formData.report_address_block || undefined,
          footer_text: formData.report_footer_text || undefined,
        },
      },
    })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  return (
    <ProtectedRoute>
      <ErrorBoundary>
        <AppLayout maxWidth="3xl">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="icon" onClick={() => router.push('/settings')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">Agency Profile</h1>
              <p className="text-muted-foreground mt-1">Manage your agency's information and branding</p>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-6">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
          ) : !isAdmin ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">View Only</h3>
                  <p className="text-muted-foreground mt-2">
                    Only organization owners and admins can edit agency settings.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    <CardTitle>Basic Information</CardTitle>
                  </div>
                  <CardDescription>Your agency's core details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Agency Name *</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Your Agency Name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="billing_email">Billing Email</Label>
                      <Input
                        id="billing_email"
                        name="billing_email"
                        type="email"
                        value={formData.billing_email}
                        onChange={handleChange}
                        placeholder="billing@youragency.com"
                      />
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Subscription:{' '}
                    <Badge variant="secondary" className="ml-1">
                      {organization?.subscription_tier || 'Free'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Portal Branding */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Palette className="h-5 w-5 text-primary" />
                    <CardTitle>Client Portal Branding</CardTitle>
                    <Badge variant="outline">Phase 2</Badge>
                  </div>
                  <CardDescription>
                    Customize how your client portal appears to clients
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="portal_company_name">Display Name</Label>
                      <Input
                        id="portal_company_name"
                        name="portal_company_name"
                        value={formData.portal_company_name}
                        onChange={handleChange}
                        placeholder="Your Firm Name"
                      />
                      <p className="text-xs text-muted-foreground">
                        Shown in the portal header
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="portal_tagline">Tagline</Label>
                      <Input
                        id="portal_tagline"
                        name="portal_tagline"
                        value={formData.portal_tagline}
                        onChange={handleChange}
                        placeholder="Your trusted SALT partner"
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="portal_support_email">Support Email</Label>
                      <Input
                        id="portal_support_email"
                        name="portal_support_email"
                        type="email"
                        value={formData.portal_support_email}
                        onChange={handleChange}
                        placeholder="support@youragency.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="portal_support_phone">Support Phone</Label>
                      <Input
                        id="portal_support_phone"
                        name="portal_support_phone"
                        value={formData.portal_support_phone}
                        onChange={handleChange}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="portal_primary_color">Brand Color</Label>
                    <div className="flex items-center gap-3">
                      <Input
                        id="portal_primary_color"
                        name="portal_primary_color"
                        type="color"
                        value={formData.portal_primary_color}
                        onChange={handleChange}
                        className="w-16 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={formData.portal_primary_color}
                        onChange={handleChange}
                        name="portal_primary_color"
                        className="w-28 font-mono"
                        placeholder="#3b82f6"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Report Branding */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <CardTitle>Report Branding</CardTitle>
                  </div>
                  <CardDescription>
                    Customize how your generated reports appear
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="report_company_name">Company Name on Reports</Label>
                    <Input
                      id="report_company_name"
                      name="report_company_name"
                      value={formData.report_company_name}
                      onChange={handleChange}
                      placeholder="Your Agency LLC"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="report_address_block">Address Block</Label>
                    <Textarea
                      id="report_address_block"
                      name="report_address_block"
                      value={formData.report_address_block}
                      onChange={handleChange}
                      placeholder="123 Main Street&#10;Suite 100&#10;City, State 12345"
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="report_footer_text">Report Footer</Label>
                    <Input
                      id="report_footer_text"
                      name="report_footer_text"
                      value={formData.report_footer_text}
                      onChange={handleChange}
                      placeholder="Confidential - For Client Use Only"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Save Button */}
              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => router.push('/settings')}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateOrgMutation.isPending}>
                  {updateOrgMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </AppLayout>
      </ErrorBoundary>
    </ProtectedRoute>
  )
}
