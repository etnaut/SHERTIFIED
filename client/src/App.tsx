import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/AppLayout";
import Dashboard from "@/pages/Superadmin/Dashboard";
import Providers from "@/pages/Superadmin/Providers";
import Registration from "@/pages/Superadmin/Registration";
import DataRequests from "@/pages/Superadmin/DataRequests";
import InfoTracker from "@/pages/Superadmin/InfoTracker";
import NotFound from "@/pages/NotFound";
import Login from "@/pages/Login";
import SystemRegister from "@/pages/SystemRegister";
import Landing from "@/pages/Landing";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/system-register" element={<SystemRegister />} />
          <Route element={<AppLayout />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="providers" element={<Providers />} />
            <Route path="registration" element={<Registration />} />
            <Route path="data-requests" element={<DataRequests />} />
            <Route path="tracker" element={<InfoTracker />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
