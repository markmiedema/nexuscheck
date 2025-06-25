import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, ChevronDown, Plus, Check, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CreateCompanyDialog } from './CreateCompanyDialog';

export const CompanySwitcher = () => {
  const { companies, selectedCompany, setSelectedCompany } = useApp();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSelecting, setIsSelecting] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSelectCompany = async (company: any) => {
    setIsSelecting(company.id);
    
    try {
      // Simulate API call delay for switch_company edge function
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setSelectedCompany(company);
      setIsDialogOpen(false);
      
      toast({
        title: 'Company selected',
        description: `Now working with ${company.name}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to switch company. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSelecting(null);
    }
  };

  const handleCompanyCreated = (newCompany: any) => {
    // Optionally auto-select the newly created company
    setSelectedCompany(newCompany);
    setIsDialogOpen(false);
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="min-w-[200px] justify-between bg-white hover:bg-gray-50 border-gray-300 shadow-sm"
        >
          <div className="flex items-center">
            <Building2 className="mr-2 h-4 w-4 text-gray-600" />
            <span className="font-medium">
              {selectedCompany ? selectedCompany.name : 'Select Company'}
            </span>
          </div>
          <ChevronDown className="ml-2 h-4 w-4 text-gray-500" />
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px] max-h-[600px] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Building2 className="mr-2 h-5 w-5 text-blue-600" />
            Company Management
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Create New Company Section */}
          <Card className="border-dashed border-2 border-gray-200 hover:border-blue-300 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <Plus className="mr-2 h-4 w-4 text-blue-600" />
                Add New Company
              </CardTitle>
              <CardDescription>
                Create a new company to manage their sales data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CreateCompanyDialog
                trigger={
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Company
                  </Button>
                }
                onCompanyCreated={handleCompanyCreated}
              />
            </CardContent>
          </Card>

          {/* Existing Companies Section */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <Building2 className="mr-2 h-4 w-4 text-gray-600" />
              Your Companies ({companies.length})
            </h3>
            
            {companies.length === 0 ? (
              <Card className="border-gray-200">
                <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                  <Building2 className="h-12 w-12 text-gray-300 mb-3" />
                  <h4 className="text-lg font-medium text-gray-900 mb-1">No companies yet</h4>
                  <p className="text-gray-500 text-sm">
                    Create your first company to get started with sales analysis.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {companies.map((company) => {
                  const isSelected = selectedCompany?.id === company.id;
                  const isLoading = isSelecting === company.id;
                  
                  return (
                    <Card 
                      key={company.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        isSelected 
                          ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-200' 
                          : 'hover:border-gray-300'
                      }`}
                      onClick={() => !isLoading && handleSelectCompany(company)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${
                              isSelected ? 'bg-blue-100' : 'bg-gray-100'
                            }`}>
                              <Building2 className={`h-4 w-4 ${
                                isSelected ? 'text-blue-600' : 'text-gray-600'
                              }`} />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{company.name}</h4>
                              <p className="text-sm text-gray-500">
                                Created {new Date(company.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {isSelected && (
                              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                                <Check className="mr-1 h-3 w-3" />
                                Selected
                              </Badge>
                            )}
                            {isLoading && (
                              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};