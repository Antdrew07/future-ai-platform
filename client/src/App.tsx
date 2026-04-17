import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

// Auth pages
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

// Public pages
import Home from "./pages/Home";
import AgentPublic from "./pages/AgentPublic";
import Templates from "./pages/Templates";
import Pricing from "./pages/Pricing";
import AgentGallery from "./pages/AgentGallery";
import Onboarding from "./pages/Onboarding";

// Dashboard pages
import Dashboard from "./pages/Dashboard";
import AgentList from "./pages/AgentList";
import AgentBuilder from "./pages/AgentBuilder";
import TaskView from "./pages/TaskView";
import AgentWorkspace from "./pages/AgentWorkspace";
import Analytics from "./pages/Analytics";
import Billing from "./pages/Billing";
import ApiKeys from "./pages/ApiKeys";
import Teams from "./pages/Teams";
import Settings from "./pages/Settings";

// Admin pages
import AdminPanel from "./pages/AdminPanel";  // role-gated

function Router() {
  return (
    <Switch>
      {/* Auth */}
      <Route path="/signin" component={SignIn} />
      <Route path="/signup" component={SignUp} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/reset-password" component={ResetPassword} />

      {/* Public */}
      <Route path="/" component={Home} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/templates" component={Templates} />
      <Route path="/gallery" component={AgentGallery} />
      <Route path="/agent/:slug" component={AgentPublic} />

      {/* Onboarding */}
      <Route path="/onboarding" component={Onboarding} />

      {/* Dashboard */}
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/dashboard/agents" component={AgentList} />
      <Route path="/dashboard/agents/new" component={AgentBuilder} />
      <Route path="/dashboard/agents/:id" component={AgentBuilder} />
      <Route path="/dashboard/tasks/:id" component={TaskView} />
      <Route path="/workspace/:agentId" component={AgentWorkspace} />
      <Route path="/dashboard/analytics" component={Analytics} />
      <Route path="/dashboard/billing" component={Billing} />
      <Route path="/dashboard/api-keys" component={ApiKeys} />
      <Route path="/dashboard/teams" component={Teams} />
      <Route path="/dashboard/settings" component={Settings} />

      {/* Admin */}
      <Route path="/admin" component={AdminPanel} />

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster richColors position="top-right" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
