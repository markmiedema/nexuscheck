'use client'

import { useState, useEffect } from 'react'
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Phone, Mail, Trash2 } from "lucide-react"
import apiClient from '@/lib/api/client'
import { handleApiError, showSuccess } from '@/lib/utils/errorHandler'

interface Contact {
  id: string
  name: string
  role?: string
  email?: string
  phone?: string
  is_primary: boolean
}

export function ClientContacts({ clientId }: { clientId: string }) {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form State
  const [newName, setNewName] = useState('')
  const [newRole, setNewRole] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [newPhone, setNewPhone] = useState('')

  useEffect(() => {
    loadContacts()
  }, [clientId])

  async function loadContacts() {
    try {
      const res = await apiClient.get(`/api/v1/clients/${clientId}/contacts`)
      setContacts(res.data)
    } catch (err) {
      console.error("Failed to load contacts", err)
    }
  }

  async function handleAddContact() {
    if (!newName) return
    setIsSubmitting(true)
    try {
      const payload = {
        name: newName,
        role: newRole || null,
        email: newEmail || null,
        phone: newPhone || null,
        is_primary: contacts.length === 0 // Auto-set primary if first contact
      }
      await apiClient.post(`/api/v1/clients/${clientId}/contacts`, payload)
      showSuccess("Team member added")
      setIsOpen(false)
      setNewName(''); setNewRole(''); setNewEmail(''); setNewPhone('')
      loadContacts()
    } catch (err) {
      handleApiError(err, { userMessage: "Failed to add contact" })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete(contactId: string) {
    if (!confirm("Remove this contact?")) return
    try {
      await apiClient.delete(`/api/v1/clients/${clientId}/contacts/${contactId}`)
      setContacts(contacts.filter(c => c.id !== contactId))
    } catch (err) {
      handleApiError(err, { userMessage: "Failed to remove contact" })
    }
  }

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-border/60">
        <h2 className="text-lg font-semibold">Team Roster</h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Team Member</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Jane Doe" />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Input value={newRole} onChange={e => setNewRole(e.target.value)} placeholder="e.g. CFO / Tech Lead" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="jane@example.com" />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="(555) 123-4567" />
                </div>
              </div>
              <Button className="w-full mt-2" onClick={handleAddContact} disabled={!newName || isSubmitting}>
                {isSubmitting ? "Adding..." : "Add Person"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {contacts.length === 0 && (
          <div className="text-center py-4 text-sm text-muted-foreground italic">
            No contacts listed.
          </div>
        )}
        {contacts.map((contact) => (
          <div key={contact.id} className="flex items-start gap-3 group">
            <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground shrink-0">
              {contact.name.split(' ').map(n => n.charAt(0).toUpperCase()).slice(0, 2).join('')}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium truncate pr-2">
                  {contact.name}
                </p>
                {contact.is_primary && (
                  <Badge variant="secondary" className="text-[10px] h-4 px-1 shrink-0 bg-blue-50 text-blue-700 border-blue-100">
                    Primary
                  </Badge>
                )}
              </div>

              <p className="text-xs text-muted-foreground truncate">
                {contact.role || 'Team Member'}
              </p>

              <div className="flex items-center gap-3 pt-1.5">
                {contact.email && (
                  <a href={`mailto:${contact.email}`} className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                    <Mail className="h-3 w-3" /> Email
                  </a>
                )}
                {contact.phone && (
                  <a href={`tel:${contact.phone}`} className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                    <Phone className="h-3 w-3" /> Call
                  </a>
                )}
                <button
                  onClick={() => handleDelete(contact.id)}
                  className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
