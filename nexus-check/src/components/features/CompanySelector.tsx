import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const CompanySelector = () => {
  const { companies, selectedCompany, setSelectedCompany, setCompanies } = useApp();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleCreateCompany = async () => {
    if (!newCompanyName.trim()) return;

    setIsLoading(true);
    try {
      // This would normally create a company via Supabase
      const newCompany = {
        id: Date.now().toString(),
        name: newCompanyName,
        created_at: new Date().toISOString(),
        user_id: 'current-user-id',
      };

      setCompanies([...companies, newCompany]);
      setNewCompanyName('');
      setIsDialogOpen(false);
      toast({
        title: 'Company created',
        description: `${newCompanyName} has been added successfully.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create company. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectCompany = (company: any) => {
    setSelectedCompany(company);
    toast({
      title: 'Company selected',
      description: `Now working with ${company.name}`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Companies</h2>
          <p className="text-muted-foreground">
            Select a company to manage or create a new one.
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Company
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Company</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="company-name">Company Name</Label>
                <Input
                  id="company-name"
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  placeholder="Enter company name"
                />
              </div>
              <Button 
                onClick={handleCreateCompany} 
                disabled={isLoading || !newCompanyName.trim()}
                className="w-full"
              >
                {isLoading ? 'Creating...' : 'Create Company'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {companies.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No companies yet</h3>
            <p className="text-gray-500 text-center mb-6">
              Get started by creating your first company to manage.
            </p>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Company
                </Button>
              </DialogTrigger>
            </Dialog>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.map((company) => (
            <Card 
              key={company.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedCompany?.id === company.id ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => handleSelectCompany(company)}
            >
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building2 className="mr-2 h-5 w-5 text-blue-600" />
                  {company.name}
                </CardTitle>
                <CardDescription>
                  Created {new Date(company.created_at).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedCompany?.id === company.id && (
                  <div className="text-sm text-blue-600 font-medium">
                    Currently selected
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};