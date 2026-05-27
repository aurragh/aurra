import { Component, useEffect, useState, type ReactNode } from "react";
import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { NovaDrawer } from "@/components/NovaDrawer";
import StyleQuiz from "@/pages/style-quiz";
import Dashboard from "@/pages/dashboard";
import AdminDashboard from "@/pages/admin";
import Trash from "@/pages/trash";
import NovaChat from "@/pages/nova-chat";
import Wardrobe from "@/pages/wardrobe";
import SharedLook from "@/pages/shared-look";
import NotFound from "@/pages/not-found";

// Single marketing surface for unauthenticated visitors lives on the Vercel site;
// the Render app no longer renders its own landing.
const MARKETING_URL = "https://house-of-nova.vercel.app/ask-aurra";

// Explicit colours instead of Tailwind theme tokens — we cannot rely on the
// theme CSS variables being available before the app's CSS bundle paints,
// especially on mobile Safari. The loading screen MUST be visible immediately.
function LoadingScreen({ note }: { note?: string }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, #0F0E14 0%, #1A1825 100%)",
        color: "white",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: "44px",
          height: "44px",
          borderRadius: "9999px",
          border: "3px solid rgba(255,255,255,0.18)",
          borderTopColor: "rgba(196,181,253,0.9)",
          animation: "aurra-spin 0.9s linear infinite",
          marginBottom: "16px",
        }}
      />
      <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", letterSpacing: "0.06em" }}>
        {note || "Loading Aurra…"}
      </p>
      <style>{`
        @keyframes aurra-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function StuckFallback({
  onRetry,
  onSignOut,
}: {
  onRetry: () => void;
  onSignOut: () => void;
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, #0F0E14 0%, #1A1825 100%)",
        color: "white",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        textAlign: "center",
      }}
    >
      <p
        style={{
          fontSize: "20px",
          marginBottom: "8px",
          fontFamily: "'Playfair Display', Georgia, serif",
        }}
      >
        This is taking longer than expected.
      </p>
      <p
        style={{
          color: "rgba(255,255,255,0.65)",
          fontSize: "14px",
          maxWidth: "320px",
          marginBottom: "24px",
          lineHeight: 1.5,
        }}
      >
        Your session might have expired. Try signing in again, or refresh the
        page.
      </p>
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
        <button
          onClick={onRetry}
          style={{
            padding: "10px 20px",
            borderRadius: "9999px",
            background: "rgba(255,255,255,0.06)",
            color: "white",
            border: "1px solid rgba(255,255,255,0.14)",
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          Refresh
        </button>
        <button
          onClick={onSignOut}
          style={{
            padding: "10px 20px",
            borderRadius: "9999px",
            background: "linear-gradient(135deg, #7c3aed, #a855f7)",
            color: "white",
            border: "none",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Sign in again
        </button>
      </div>
    </div>
  );
}

function ErrorScreen({ error, onReset }: { error: Error; onReset: () => void }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(160deg, #0F0E14 0%, #1A1825 100%)",
        color: "white",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        textAlign: "center",
      }}
    >
      <p
        style={{
          fontSize: "22px",
          marginBottom: "10px",
          fontFamily: "'Playfair Display', Georgia, serif",
        }}
      >
        Something went wrong.
      </p>
      <p
        style={{
          color: "rgba(255,255,255,0.65)",
          fontSize: "14px",
          maxWidth: "360px",
          marginBottom: "12px",
          lineHeight: 1.5,
        }}
      >
        Aurra hit an error rendering this page. The details below help
        diagnose it.
      </p>
      <pre
        style={{
          color: "rgba(255,200,200,0.85)",
          fontSize: "12px",
          maxWidth: "90vw",
          maxHeight: "180px",
          overflow: "auto",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          padding: "10px 12px",
          borderRadius: "10px",
          marginBottom: "24px",
          whiteSpace: "pre-wrap",
          textAlign: "left",
        }}
      >
        {error?.message || String(error)}
      </pre>
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
        <button
          onClick={onReset}
          style={{
            padding: "10px 20px",
            borderRadius: "9999px",
            background: "rgba(255,255,255,0.06)",
            color: "white",
            border: "1px solid rgba(255,255,255,0.14)",
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
        <button
          onClick={() => (window.location.href = "/api/logout")}
          style={{
            padding: "10px 20px",
            borderRadius: "9999px",
            background: "linear-gradient(135deg, #7c3aed, #a855f7)",
            color: "white",
            border: "none",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Sign out and reset
        </button>
      </div>
    </div>
  );
}

class AppErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string }) {
    console.error("[AppErrorBoundary]", error, info);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return <ErrorScreen error={this.state.error} onReset={this.reset} />;
    }
    return this.props.children;
  }
}

function ExternalRedirect({ to }: { to: string }) {
  useEffect(() => {
    window.location.replace(to);
  }, [to]);
  return <LoadingScreen note="Taking you to House of Nova…" />;
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();
  const [stuck, setStuck] = useState(false);

  // If the auth query is still running after 8 seconds, surface a "stuck"
  // fallback so the user can recover. Mobile Safari's cookie weirdness can
  // strand the auth fetch indefinitely; an invisible spinner is worse than
  // a visible escape hatch.
  useEffect(() => {
    if (!isLoading) {
      setStuck(false);
      return;
    }
    const t = setTimeout(() => setStuck(true), 8000);
    return () => clearTimeout(t);
  }, [isLoading]);

  if (isLoading) {
    if (stuck) {
      return (
        <StuckFallback
          onRetry={() => window.location.reload()}
          onSignOut={() => (window.location.href = "/api/login")}
        />
      );
    }
    return <LoadingScreen />;
  }

  return (
    <Switch>
      {/* Public routes — always accessible */}
      <Route path="/look/:token" component={SharedLook} />

      {!isAuthenticated ? (
        <>
          <Route path="/">
            <ExternalRedirect to={MARKETING_URL} />
          </Route>
          <Route path="/landing">
            <ExternalRedirect to={MARKETING_URL} />
          </Route>
        </>
      ) : (
        <>
          <Route path="/">
            <Redirect to="/dashboard" />
          </Route>
          <Route path="/landing">
            <Redirect to="/dashboard" />
          </Route>
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
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
          <NovaDrawer />
        </TooltipProvider>
      </QueryClientProvider>
    </AppErrorBoundary>
  );
}

export default App;
