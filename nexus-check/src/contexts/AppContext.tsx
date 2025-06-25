import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface Company {
  id: string;
  name: string;
  created_at: string;
  user_id: string;
}

interface Analysis {
  id: string;
  company_id: string;
  filename: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  results: any;
  created_at: string;
}

interface AppContextType {
  selectedCompany: Company | null;
  setSelectedCompany: (company: Company | null) => void;
  companies: Company[];
  setCompanies: (companies: Company[]) => void;
  analyses: Analysis[];
  setAnalyses: (analyses: Analysis[]) => void;
  refreshAnalyses: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

// Dummy companies for demonstration
const dummyCompanies: Company[] = [
  {
    id: 'company-1',
    name: 'TechFlow Solutions',
    created_at: '2024-01-15T10:30:00Z',
    user_id: 'demo-user-id',
  },
  {
    id: 'company-2',
    name: 'Meridian Retail Group',
    created_at: '2024-02-03T14:22:00Z',
    user_id: 'demo-user-id',
  },
  {
    id: 'company-3',
    name: 'Apex Manufacturing',
    created_at: '2024-02-18T09:15:00Z',
    user_id: 'demo-user-id',
  },
  {
    id: 'company-4',
    name: 'Digital Dynamics LLC',
    created_at: '2024-03-05T16:45:00Z',
    user_id: 'demo-user-id',
  },
  {
    id: 'company-5',
    name: 'Coastal Enterprises',
    created_at: '2024-03-12T11:20:00Z',
    user_id: 'demo-user-id',
  }
];

export const AppProvider = ({ children }: AppProviderProps) => {
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);

  // Initialize with dummy data on mount
  useEffect(() => {
    setCompanies(dummyCompanies);
    // Optionally select the first company by default
    // setSelectedCompany(dummyCompanies[0]);
  }, []);

  const refreshAnalyses = async () => {
    // This will be implemented when we have the Supabase backend set up
    console.log('Refreshing analyses...');
  };

  const value = {
    selectedCompany,
    setSelectedCompany,
    companies,
    setCompanies,
    analyses,
    setAnalyses,
    refreshAnalyses,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};