import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Building2 } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '@/contexts/AppContext';

export const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { companyId } = useParams<{ companyId: string }>();
  const { selectedCompany } = useApp();

  const isDashboard = location.pathname === '/dashboard';
  const isCompanyPage = location.pathname.startsWith('/company/');

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <div className="flex h-full w-64 flex-col bg-white border-r border-gray-200">
      <div className="flex-1 flex flex-col pt-4 pb-4 overflow-y-auto">
        <nav className="flex-1 px-3 space-y-1">
          {/* Dashboard Link */}
          <Button
            variant="ghost"
            className={cn(
              'w-full justify-start h-auto p-3 text-left transition-all duration-200',
              isDashboard
                ? 'bg-blue-50 text-blue-700 hover:bg-blue-50 border border-blue-200'
                : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 cursor-pointer bg-transparent'
            )}
            onClick={() => handleNavigation('/dashboard')}
          >
            <div className="flex items-center w-full">
              <Building2 className={cn(
                "mr-3 h-5 w-5 flex-shrink-0 transition-colors duration-200",
                isDashboard ? "text-blue-600" : "text-gray-500"
              )} />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">Dashboard</div>
                <div className={cn(
                  "text-xs mt-0.5 transition-colors duration-200",
                  isDashboard ? "text-blue-600" : "text-gray-500"
                )}>
                  Overview and companies
                </div>
              </div>
            </div>
          </Button>

          {/* Company-Specific Navigation */}
          {selectedCompany && companyId && (
            <>
              <div className="px-3 py-3 mt-4 border-t border-gray-100">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {selectedCompany.name}
                </h3>
              </div>

              {/* Company Overview */}
              <Button
                variant="ghost"
                className={cn(
                  'w-full justify-start h-auto p-3 text-left transition-all duration-200',
                  location.pathname === `/company/${companyId}`
                    ? 'bg-blue-50 text-blue-700 hover:bg-blue-50 border border-blue-200'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 cursor-pointer bg-transparent'
                )}
                onClick={() => handleNavigation(`/company/${companyId}`)}
              >
                <div className="flex items-center w-full">
                  <div className={cn(
                    "mr-3 h-5 w-5 flex-shrink-0 rounded p-1 transition-colors duration-200",
                    location.pathname === `/company/${companyId}` 
                      ? "bg-blue-100" 
                      : "bg-gray-100"
                  )}>
                    <Building2 className={cn(
                      "h-3 w-3",
                      location.pathname === `/company/${companyId}` 
                        ? "text-blue-600" 
                        : "text-gray-600"
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">Company Overview</div>
                    <div className={cn(
                      "text-xs mt-0.5 transition-colors duration-200",
                      location.pathname === `/company/${companyId}` 
                        ? "text-blue-600" 
                        : "text-gray-500"
                    )}>
                      Dashboard and stats
                    </div>
                  </div>
                </div>
              </Button>
            </>
          )}
        </nav>

        {/* Company Selection Prompt */}
        {!selectedCompany && !isDashboard && (
          <div className="mx-3 mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <Building2 className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-blue-800">Select a Company</p>
                <p className="text-xs text-blue-700 mt-1">
                  Choose a company from the header to access company features.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};