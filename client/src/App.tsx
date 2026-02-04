import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import StyleQuiz from "@/pages/style-quiz";
import Dashboard from "@/pages/dashboard";
import Subscribe from "@/pages/subscribe";
import AdminDashboard from "@/pages/admin";
import Trash from "@/pages/trash";
import Upgrade from "@/pages/upgrade";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
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
          <Route path="/subscribe" component={Subscribe} />
          <Route path="/upgrade" component={Upgrade} />
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
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
