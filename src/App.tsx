
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import DashboardPage from "./pages/DashboardPage";
import InboxPage from "./pages/InboxPage";
import CreateRfxPage from "./pages/CreateRfxPage";
import MyRfxPage from "./pages/MyRfxPage";
import ComparisonTables from "./pages/ComparisonTables";
import NegotiationTrackingPage from "./pages/NegotiationTrackingPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/inbox" element={<InboxPage />} />
          <Route path="/create-rfx" element={<CreateRfxPage />} />
          <Route path="/my-rfx" element={<MyRfxPage />} />
          <Route path="/comparison-tables" element={<ComparisonTables />} />
          <Route path="/negotiations" element={<NegotiationTrackingPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
