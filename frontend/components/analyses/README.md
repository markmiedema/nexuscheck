# Analyses Components

## Optional Enhancement: Delete Confirmation Dialog

The analyses list page currently uses browser `confirm()` for delete confirmation. This works but could be enhanced with a custom dialog.

### To add the enhanced dialog:

1. **Install AlertDialog component:**
   ```bash
   cd frontend
   npx shadcn@latest add alert-dialog
   ```

2. **Create DeleteConfirmationDialog component:**
   ```typescript
   // components/analyses/DeleteConfirmationDialog.tsx
   'use client'

   import {
     AlertDialog,
     AlertDialogAction,
     AlertDialogCancel,
     AlertDialogContent,
     AlertDialogDescription,
     AlertDialogFooter,
     AlertDialogHeader,
     AlertDialogTitle,
   } from '@/components/ui/alert-dialog'

   interface DeleteConfirmationDialogProps {
     open: boolean
     onOpenChange: (open: boolean) => void
     onConfirm: () => void
     clientName: string
     loading?: boolean
   }

   export function DeleteConfirmationDialog({
     open,
     onOpenChange,
     onConfirm,
     clientName,
     loading = false,
   }: DeleteConfirmationDialogProps) {
     return (
       <AlertDialog open={open} onOpenChange={onOpenChange}>
         <AlertDialogContent>
           <AlertDialogHeader>
             <AlertDialogTitle>Delete Analysis?</AlertDialogTitle>
             <AlertDialogDescription className="space-y-2">
               <p>
                 Are you sure you want to delete the analysis for{' '}
                 <span className="font-semibold">{clientName}</span>?
               </p>
               <p className="text-sm text-gray-500">
                 This will move the analysis to trash. You'll have 30 days to recover it
                 before permanent deletion.
               </p>
             </AlertDialogDescription>
           </AlertDialogHeader>
           <AlertDialogFooter>
             <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
             <AlertDialogAction
               onClick={(e) => {
                 e.preventDefault()
                 onConfirm()
               }}
               disabled={loading}
               className="bg-red-600 hover:bg-red-700"
             >
               {loading ? 'Deleting...' : 'Delete Analysis'}
             </AlertDialogAction>
           </AlertDialogFooter>
         </AlertDialogContent>
       </AlertDialog>
     )
   }
   ```

3. **Update app/analyses/page.tsx:**
   - Import the dialog component
   - Add state for dialog management
   - Replace browser confirm() with dialog

This is a nice-to-have enhancement. The current implementation works fine for MVP.
