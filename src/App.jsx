import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Home from './pages/Home.jsx';
import PortalLayout from './components/portal/PortalLayout';
import InvestorDashboard from './pages/InvestorDashboard';
import BrowseDeals from './pages/BrowseDeals';
import Watchlist from './pages/Watchlist';
import MyOffers from './pages/MyOffers';
import PropertyDetail from './pages/PropertyDetail';
import InventoryCleaner from './pages/InventoryCleaner';
import AISearch from './pages/AISearch';
import DealAnalysis from './pages/DealAnalysis';
import Coach from './pages/Coach';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/portal" element={<PortalLayout />}>
        <Route index element={<InvestorDashboard />} />
        <Route path="browse" element={<BrowseDeals />} />
        <Route path="watchlist" element={<Watchlist />} />
        <Route path="offers" element={<MyOffers />} />
        <Route path="property/:id" element={<PropertyDetail />} />
        <Route path="cleaner" element={<InventoryCleaner />} />
        <Route path="ai-search" element={<AISearch />} />
        <Route path="analysis" element={<DealAnalysis />} />
        <Route path="coach" element={<Coach />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App