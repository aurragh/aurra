import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { NovaDrawer } from "@/components/NovaDrawer";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import StyleQuiz from "@/pages/style-quiz";
import Dashboard from "@/pages/dashboard";
import Subscribe from "@/pages/subscribe";
import AdminDashboard from "@/pages/admin";
import Trash from "@/pages/trash";
import Upgrade from "@/pages/upgrade";
import NovaChat from "@/pages/nova-chat";
import Wardrobe from "@/pages/wardrobe";
import SharedLook from "@/pages/shared-look";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  // Hold a neutral surface while the auth query resolves so the post-OAuth
  // redirect doesn't briefly flash Landing or 404 before /dashboard mounts.
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-foreground/20 border-t-foreground/70 animate-spin" />
      </div>
    );
  }

  return (
    <Switch>
      {/* Public routes — always accessible */}
      <Route path="/look/:token" component={SharedLook} />

      {!isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/landing" component={Landing} />
        </>
      ) : (
        <>
          <Route path="/">
            <Redirect to="/dashboard" />
          </Route>
          <Route path="/landing" component={Landing} />
          <Route path="/quiz" component={StyleQuiz} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/trash" component={Trash} />
          <Route path="/chat" component={NovaChat} />
          <Route path="/wardrobe" component={Wardrobe} />
          <Route path="/subscribe">
            <Redirect to="/dashboard" />
          </Route>
          <Route path="/upgrade">
            <Redirect to="/dashboard" />
          </Route>
          <Route path="/admin" component={AdminDashboard} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
        <NovaDrawer />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
