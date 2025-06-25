import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Loader2, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CreateCompanyDialogProps {
  trigger?: React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onCompanyCreated?: (company: any) => void;
}

export const CreateCompanyDialog = ({ 
  trigger, 
  isOpen, 
  onOpenChange, 
  onCompanyCreated 
}: CreateCompanyDialogProps) => {
  const { companies, setCompanies } = useApp();
  const [newCompanyName, setNewCompanyName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  // Use controlled or uncontrolled state based on props
  const open = isOpen !== undefined ? isOpen : dialogOpen;
  const setOpen = onOpenChange || setDialogOpen;

  const handleCreateCompany = async () => {
    if (!newCompanyName.trim()) return;

    setIsCreating(true);
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // This would normally create a company via Supabase
      const newCompany = {
        id: `company-${Date.now()}`,
        name: newCompanyName.trim(),
        created_at: new Date().toISOString(),
        user_id: 'demo-user-id',
      };

      setCompanies([...companies, newCompany]);
      setNewCompanyName('');
      setOpen(false);
      
      toast({
        title: 'Company created',
        description: `${newCompany.name} has been added successfully.`,
      });

      // Notify parent component if callback provided
      if (onCompanyCreated) {
        onCompanyCreated(newCompany);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create company. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isCreating && newCompanyName.trim()) {
      handleCreateCompany();
    }
  };

  const dialogContent = (
    <DialogContent className="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle className="flex items-center">
          <Building2 className="mr-2 h-5 w-5 text-blue-600" />
          Create New Company
        </DialogTitle>
      </DialogHeader>
      
      <Card className="border-0 shadow-none">
        <CardHeader className="px-0 pb-4">
          <CardDescription>
            Add a new company to manage their sales data and generate nexus analysis reports.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company-name" className="text-sm font-medium">
              Company Name
            </Label>
            <Input
              id="company-name"
              value={newCompanyName}
              onChange={(e) => setNewCompanyName(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter company name"
              className="h-11"
              disabled={isCreating}
              autoFocus
            />
          </div>
          
          <div className="flex space-x-3 pt-2">
            <Button 
              onClick={handleCreateCompany} 
              disabled={isCreating || !newCompanyName.trim()}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isCreating ? (
                <div className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </div>
              ) : (
                <div className="flex items-center">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Company
                </div>
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </DialogContent>
  );

  if (trigger) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
        {dialogContent}
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {dialogContent}
    </Dialog>
  );
};