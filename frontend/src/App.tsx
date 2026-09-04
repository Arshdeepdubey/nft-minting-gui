import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { wagmiConfig } from "./lib/wagmiConfig";
import { isAuthenticated } from "./lib/auth";
import { Login } from "./pages/Login";
import { AuthCallback } from "./pages/AuthCallback";
import { UserDashboard } from "./pages/UserDashboard";
import { AdminDashboard } from "./pages/AdminDashboard";

const queryClient = new QueryClient();

function RequireAuth({ children }: { children: ReactNode }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function App() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route
              path="/"
              element={
                <RequireAuth>
                  <UserDashboard />
                </RequireAuth>
              }
            />
            <Route
              path="/admin"
              element={
                <RequireAuth>
                  <AdminDashboard />
                </RequireAuth>
              }
            />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;
