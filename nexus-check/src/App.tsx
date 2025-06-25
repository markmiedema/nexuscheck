import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { AppProvider } from '@/contexts/AppContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Layout } from '@/components/layout/Layout';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { CompanyPage } from '@/pages/CompanyPage';
import { UploadPage } from '@/pages/UploadPage';
import { ResultsPage } from '@/pages/ResultsPage';
import { Toaster } from '@/components/ui/sonner';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <Router>
          <div className="min-h-screen bg-background">
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              
              {/* Protected Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <DashboardPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/company/:companyId"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <CompanyPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/company/:companyId/upload"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <UploadPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/company/:companyId/results"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <ResultsPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              
              {/* Default redirect */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              
              {/* Catch all - redirect to dashboard */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
            <Toaster />
          </div>
        </Router>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;