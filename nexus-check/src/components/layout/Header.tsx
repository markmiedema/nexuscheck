import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Building2, LogOut, User } from 'lucide-react';
import { CompanySwitcher } from '@/components/features/CompanySwitcher';

export const Header = () => {
  const { user, signOut } = useAuth();
  const { selectedCompany } = useApp();

  const handleSignOut = async () => {
    await signOut();
  };

  // Extract first name from email or use placeholder
  const getFirstName = (email: string | undefined) => {
    if (!email) return 'Mark';
    
    // Try to extract name from email (before @ symbol)
    const emailPrefix = email.split('@')[0];
    
    // If email prefix contains dots or underscores, try to get first part
    const nameParts = emailPrefix.split(/[._]/);
    const firstName = nameParts[0];
    
    // Capitalize first letter
    return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
  };

  const firstName = getFirstName(user?.email);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-sm">
      <div className="flex h-16 items-center px-6">
        {/* Logo and Brand */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-lg shadow-sm">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">SALT Nexus</h1>
              <p className="text-xs text-gray-500 -mt-1">Analysis Platform</p>
            </div>
          </div>
        </div>

        {/* Center - Company Switcher */}
        <div className="flex-1 flex justify-center">
          <CompanySwitcher />
        </div>

        {/* Right Side - User Name and Menu */}
        <div className="flex items-center space-x-4">
          {/* User Name Badge */}
          <div className="flex items-center space-x-3 bg-gray-50 px-4 py-2 rounded-full border border-gray-200">
            <User className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">{firstName}</span>
          </div>

          {/* User Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-gray-100">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-blue-100 text-blue-700 font-medium">
                    {firstName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuItem disabled className="flex-col items-start">
                <div className="font-medium text-gray-900">{firstName}</div>
                <div className="text-xs text-gray-500">{user?.email}</div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleSignOut}
                className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};