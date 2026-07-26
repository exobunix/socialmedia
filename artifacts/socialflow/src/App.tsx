import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { Toaster } from 'sonner';
import { ThemeProvider } from 'next-themes';

import { DashboardLayout } from "./components/layout/DashboardLayout";
import { AdminLayout } from "./components/layout/AdminLayout";
import { PublicLayout } from "./components/layout/PublicLayout";

// Public Pages
import { Home } from "./pages/Home";
import { Login } from "./pages/auth/Login";
import { Register } from "./pages/auth/Register";
import { ForgotPassword } from "./pages/auth/ForgotPassword";

// Dashboard Pages
import { Dashboard } from "./pages/dashboard/Dashboard";
import { Accounts } from "./pages/dashboard/Accounts";
import { CreatePost } from "./pages/dashboard/CreatePost";
import { AiStudio } from "./pages/dashboard/AiStudio";
import { Posts } from "./pages/dashboard/Posts";
import { Calendar } from "./pages/dashboard/Calendar";
import { MediaLibrary } from "./pages/dashboard/MediaLibrary";
import { Analytics } from "./pages/dashboard/Analytics";
import { Billing } from "./pages/dashboard/Billing";
import { Team } from "./pages/dashboard/Team";
import { Settings } from "./pages/dashboard/Settings";

// Admin Pages
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminUsers } from "./pages/admin/AdminUsers";
import { AdminPlans } from "./pages/admin/AdminPlans";
import { AdminPlatforms } from "./pages/admin/AdminPlatforms";

// New Public Pages
import { FeaturesPage } from "./pages/FeaturesPage";
import { PricingPage } from "./pages/PricingPage";
import { AboutPage } from "./pages/AboutPage";
import { BlogPage } from "./pages/BlogPage";
import { CareersPage } from "./pages/CareersPage";
import { ContactPage } from "./pages/ContactPage";

// Auth Setup
import "./lib/auth";

const queryClient = new QueryClient();

function NotFound() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-2">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-muted-foreground">Page not found</p>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      {/* Admin Routes */}
      <Route path="/admin" nest>
        <AdminLayout>
          <Switch>
            <Route path="/" component={AdminDashboard} />
            <Route path="/users" component={AdminUsers} />
            <Route path="/plans" component={AdminPlans} />
            <Route path="/platforms" component={AdminPlatforms} />
            <Route component={NotFound} />
          </Switch>
        </AdminLayout>
      </Route>

      {/* Dashboard Routes */}
      <Route path="/dashboard" component={() => <DashboardLayout><Dashboard /></DashboardLayout>} />
      <Route path="/accounts" component={() => <DashboardLayout><Accounts /></DashboardLayout>} />
      <Route path="/create" component={() => <DashboardLayout><CreatePost /></DashboardLayout>} />
      <Route path="/ai/studio" component={() => <DashboardLayout><AiStudio /></DashboardLayout>} />
      <Route path="/posts" component={() => <DashboardLayout><Posts /></DashboardLayout>} />
      <Route path="/calendar" component={() => <DashboardLayout><Calendar /></DashboardLayout>} />
      <Route path="/media" component={() => <DashboardLayout><MediaLibrary /></DashboardLayout>} />
      <Route path="/analytics" component={() => <DashboardLayout><Analytics /></DashboardLayout>} />
      <Route path="/billing" component={() => <DashboardLayout><Billing /></DashboardLayout>} />
      <Route path="/team" component={() => <DashboardLayout><Team /></DashboardLayout>} />
      <Route path="/settings" component={() => <DashboardLayout><Settings /></DashboardLayout>} />

      {/* Public Routes */}
      <Route path="/">
        <PublicLayout><Home /></PublicLayout>
      </Route>
      <Route path="/features">
        <PublicLayout><FeaturesPage /></PublicLayout>
      </Route>
      <Route path="/pricing">
        <PublicLayout><PricingPage /></PublicLayout>
      </Route>
      <Route path="/about">
        <PublicLayout><AboutPage /></PublicLayout>
      </Route>
      <Route path="/blog">
        <PublicLayout><BlogPage /></PublicLayout>
      </Route>
      <Route path="/careers">
        <PublicLayout><CareersPage /></PublicLayout>
      </Route>
      <Route path="/contact">
        <PublicLayout><ContactPage /></PublicLayout>
      </Route>
      <Route path="/login">
        <PublicLayout><Login /></PublicLayout>
      </Route>
      <Route path="/register">
        <PublicLayout><Register /></PublicLayout>
      </Route>
      <Route path="/forgot-password">
        <PublicLayout><ForgotPassword /></PublicLayout>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster theme="dark" position="top-right" />
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
