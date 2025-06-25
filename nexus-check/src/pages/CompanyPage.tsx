import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Upload, 
  BarChart3, 
  Calendar, 
  FileText, 
  TrendingUp,
  ArrowLeft,
  Plus,
  Activity
} from 'lucide-react';

export const CompanyPage = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const { companies, selectedCompany, setSelectedCompany } = useApp();

  // Find and set the company based on URL parameter
  useEffect(() => {
    if (companyId) {
      const company = companies.find(c => c.id === companyId);
      if (company) {
        setSelectedCompany(company);
      } else {
        // Company not found, redirect to dashboard
        navigate('/dashboard');
      }
    }
  }, [companyId, companies, setSelectedCompany, navigate]);

  if (!selectedCompany) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Company not found</h3>
          <p className="text-gray-500 mb-4">The requested company could not be found.</p>
          <Button onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const quickActions = [
    {
      title: 'Upload Sales Data',
      description: 'Upload CSV files for nexus analysis',
      icon: Upload,
      action: () => navigate(`/company/${companyId}/upload`),
      color: 'blue',
      count: 0
    },
    {
      title: 'View Analysis Results',
      description: 'Review nexus analysis reports',
      icon: BarChart3,
      action: () => navigate(`/company/${companyId}/results`),
      color: 'green',
      count: 0
    }
  ];

  const stats = [
    {
      title: 'Files Uploaded',
      value: 0,
      description: 'CSV files processed',
      icon: FileText,
      color: 'blue'
    },
    {
      title: 'Analyses Complete',
      value: 0,
      description: 'nexus reports generated',
      icon: TrendingUp,
      color: 'green'
    },
    {
      title: 'States Identified',
      value: 0,
      description: 'potential nexus obligations',
      icon: Activity,
      color: 'purple'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <div>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{selectedCompany.name}</h1>
                <p className="text-gray-600">
                  Created {new Date(selectedCompany.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
        <Badge variant="secondary" className="bg-green-100 text-green-700">
          Active
        </Badge>
      </div>

      {/* Company Stats */}
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

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickActions.map((action) => {
            const IconComponent = action.icon;
            const colorClasses = {
              blue: 'border-blue-200 hover:border-blue-300 hover:bg-blue-50',
              green: 'border-green-200 hover:border-green-300 hover:bg-green-50'
            };
            
            return (
              <Card 
                key={action.title}
                className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${colorClasses[action.color as keyof typeof colorClasses]}`}
                onClick={action.action}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-lg ${
                      action.color === 'blue' ? 'bg-blue-100' : 'bg-green-100'
                    }`}>
                      <IconComponent className={`h-6 w-6 ${
                        action.color === 'blue' ? 'text-blue-600' : 'text-green-600'
                      }`} />
                    </div>
                    {action.count > 0 && (
                      <Badge variant="secondary">{action.count}</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <CardTitle className="text-lg mb-2">{action.title}</CardTitle>
                  <CardDescription className="text-gray-600">
                    {action.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="mr-2 h-5 w-5 text-blue-600" />
            Recent Activity
          </CardTitle>
          <CardDescription>
            Latest uploads and analysis results for {selectedCompany.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="p-4 bg-gray-100 rounded-full mx-auto mb-4 w-fit">
              <FileText className="h-16 w-16 text-gray-300" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No activity yet</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Upload your first sales data file to see activity here. Once uploaded, you'll be able to track processing status and view analysis results.
            </p>
            <Button 
              onClick={() => navigate(`/company/${companyId}/upload`)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Upload First File
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Company Information */}
      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Basic Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Company Name:</span>
                  <span className="font-medium">{selectedCompany.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Created:</span>
                  <span className="font-medium">
                    {new Date(selectedCompany.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status:</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    Active
                  </Badge>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Analysis Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Uploads:</span>
                  <span className="font-medium">0 files</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Completed Analyses:</span>
                  <span className="font-medium">0 reports</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Last Activity:</span>
                  <span className="font-medium text-gray-400">Never</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};