import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Plus, ArrowRight, BarChart3, FileText, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CreateCompanyDialog } from '@/components/features/CreateCompanyDialog';

export const DashboardPage = () => {
  const { companies } = useApp();
  const navigate = useNavigate();

  const stats = [
    {
      title: 'Total Companies',
      value: companies.length,
      description: companies.length === 1 ? 'company managed' : 'companies managed',
      icon: Building2,
      color: 'blue'
    },
    {
      title: 'Active Projects',
      value: 0,
      description: 'ongoing analyses',
      icon: BarChart3,
      color: 'green'
    },
    {
      title: 'Files Processed',
      value: 0,
      description: 'CSV files uploaded',
      icon: FileText,
      color: 'purple'
    }
  ];

  const handleCompanyClick = (companyId: string) => {
    navigate(`/company/${companyId}`);
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome to SALT Nexus
        </h1>
        <p className="text-gray-600 text-lg">
          Professional sales data analysis platform for accountants
        </p>
      </div>

      {/* Getting Started Section */}
      {companies.length === 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Building2 className="h-8 w-8 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-blue-800 mb-2">
                  Get Started with Your First Company
                </h3>
                <p className="text-blue-700 mb-4 text-base">
                  Create your first company profile to begin managing sales data and generating nexus analysis reports. Each company will have its own dedicated workspace for uploads and results.
                </p>
                <CreateCompanyDialog
                  trigger={
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Your First Company
                    </Button>
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Platform Overview Stats */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Platform Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.map((stat) => {
            const IconComponent = stat.icon;
            const colorClasses = {
              blue: 'text-blue-600 bg-blue-100',
              green: 'text-green-600 bg-green-100',
              purple: 'text-purple-600 bg-purple-100'
            };
            
            return (
              <Card key={stat.title} className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${colorClasses[stat.color as keyof typeof colorClasses]}`}>
                    <IconComponent className="h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <p className="text-xs text-gray-500 mt-1">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Recent Activity / Companies Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-gray-900">Your Companies</h2>
          {companies.length > 0 && (
            <CreateCompanyDialog
              trigger={
                <Button variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Company
                </Button>
              }
            />
          )}
        </div>

        {companies.length === 0 ? (
          <Card className="border-dashed border-2 border-gray-200">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <div className="p-4 bg-gray-100 rounded-full mb-4">
                <Building2 className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No companies yet</h3>
              <p className="text-gray-500 text-center mb-6 max-w-md">
                Create your first company to start managing sales data and generating nexus analysis reports.
              </p>
              <CreateCompanyDialog
                trigger={
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Your First Company
                  </Button>
                }
              />
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {companies.slice(0, 6).map((company) => (
              <Card 
                key={company.id}
                className="cursor-pointer transition-all hover:shadow-lg hover:border-blue-300 group"
                onClick={() => handleCompanyClick(company.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                        <Building2 className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{company.name}</CardTitle>
                        <CardDescription>
                          Created {new Date(company.created_at).toLocaleDateString()}
                        </CardDescription>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center">
                      <FileText className="mr-1 h-3 w-3" />
                      <span>0 files uploaded</span>
                    </div>
                    <div className="flex items-center">
                      <BarChart3 className="mr-1 h-3 w-3" />
                      <span>0 analyses</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {companies.length > 6 && (
          <div className="mt-4 text-center">
            <Button variant="outline">
              View All Companies ({companies.length})
            </Button>
          </div>
        )}
      </div>

      {/* Help Section */}
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-4">
            <div className="p-2 bg-gray-200 rounded-lg">
              <Users className="h-6 w-6 text-gray-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Need Help Getting Started?
              </h3>
              <p className="text-gray-600 mb-4">
                Our platform helps you analyze sales data for tax nexus obligations. Create companies, upload their sales data, and generate comprehensive analysis reports.
              </p>
              <div className="flex space-x-4">
                <Button variant="outline" size="sm">
                  View Documentation
                </Button>
                <Button variant="outline" size="sm">
                  Contact Support
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};