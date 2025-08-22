import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Subscriptions from '@/components/dashboard/forAdmin/payment/subscriptions';

// Pages
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LoginForm from "./components/auth/LoginForm";
import SuperAdmin from "./components/dashboard/SuperAdminDashboard";
import Admin from "./components/dashboard/AdminDashboard";
import Allocator from "./components/dashboard/AllocatorDashboard";
import Rider from "./components/dashboard/RiderDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<LoginForm />} />

            {/* Protected routes */}
            <Route path="/super-admin" element={<SuperAdmin />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/allocator" element={<Allocator />} />
            <Route path="/rider" element={<Rider />} />
            <Route path="/forAdmin/subscriptions" element={<Subscriptions />} />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
          <Sonner />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
