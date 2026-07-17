import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { ThemeProvider } from '@/components/theme-provider';
import { LocationProvider } from '@/contexts/LocationContext';
import { AppLayout } from '@/components/layout/AppLayout';
import React, { Suspense } from 'react';

// Lazy load pages
const Dashboard = React.lazy(() => import('@/pages/Dashboard'));
const Analytics = React.lazy(() => import('@/pages/Analytics'));
const MapPage = React.lazy(() => import('@/pages/MapPage'));
const Compare = React.lazy(() => import('@/pages/Compare'));
const MlPredictions = React.lazy(() => import('@/pages/MlPredictions'));
const Assistant = React.lazy(() => import('@/pages/Assistant'));
const Alerts = React.lazy(() => import('@/pages/Alerts'));

const queryClient = new QueryClient();

function PageLoader() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}

function Router() {
  return (
    <AppLayout>
      <Suspense fallback={<PageLoader />}>
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/map" component={MapPage} />
          <Route path="/compare" component={Compare} />
          <Route path="/ml" component={MlPredictions} />
          <Route path="/assistant" component={Assistant} />
          <Route path="/alerts" component={Alerts} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </AppLayout>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark" attribute="class">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <LocationProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
              <Router />
            </WouterRouter>
          </LocationProvider>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
