import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/components/protected-route";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Upload from "@/pages/upload";
import ApiKeys from "@/pages/api-keys";
import History from "@/pages/history";
import Sidebar from "@/components/sidebar";

function Router() {
  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Switch>
          <Route path="/">
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          </Route>
          <Route path="/upload" component={Upload} />
          <Route path="/api-keys">
            <ProtectedRoute>
              <ApiKeys />
            </ProtectedRoute>
          </Route>
          <Route path="/history">
            <ProtectedRoute>
              <History />
            </ProtectedRoute>
          </Route>
          <Route path="/settings">
            <ProtectedRoute>
              <div className="p-6">
                <h2 className="text-2xl font-semibold mb-4">Settings</h2>
                <p className="text-muted-foreground">Settings page coming soon...</p>
              </div>
            </ProtectedRoute>
          </Route>
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
