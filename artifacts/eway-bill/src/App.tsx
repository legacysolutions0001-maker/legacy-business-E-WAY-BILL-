import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { Layout } from "@/components/layout";

import LoginPage from "@/pages/login";
import DashboardPage from "@/pages/dashboard";
import CompaniesPage from "@/pages/companies";
import UsersPage from "@/pages/users";
import EwaybillsPage from "@/pages/ewaybills/index";
import EwaybillNewPage from "@/pages/ewaybills/new";
import EwaybillDetailPage from "@/pages/ewaybills/[id]";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component, adminOnly = false, ...rest }: any) {
  const { user, isLoading, isSuperAdmin } = useAuth();
  const [location, setLocation] = useLocation();

  if (isLoading) return null;

  if (!user) {
    setLocation("/login");
    return null;
  }

  if (adminOnly && !isSuperAdmin) {
    setLocation("/dashboard");
    return null;
  }

  return (
    <Layout>
      <Component {...rest} />
    </Layout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/">
        <ProtectedRoute component={DashboardPage} />
      </Route>
      <Route path="/dashboard">
        <ProtectedRoute component={DashboardPage} />
      </Route>
      <Route path="/companies">
        <ProtectedRoute component={CompaniesPage} adminOnly={true} />
      </Route>
      <Route path="/users">
        <ProtectedRoute component={UsersPage} adminOnly={true} />
      </Route>
      <Route path="/ewaybills">
        <ProtectedRoute component={EwaybillsPage} />
      </Route>
      <Route path="/ewaybills/new">
        <ProtectedRoute component={EwaybillNewPage} />
      </Route>
      <Route path="/ewaybills/:id">
        {params => <ProtectedRoute component={EwaybillDetailPage} id={params.id} />}
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
