import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProfileProvider } from "@/contexts/ProfileContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import StudySchedule from "./pages/StudySchedule";
import TopTasks from "./pages/TopTasks";
import FocusTimer from "./pages/FocusTimer";
import MentalHealth from "./pages/MentalHealth";
import Analytics from "./pages/Analytics";
import Bibliotheca from "./pages/Bibliotheca";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ProfileProvider>
            <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/study-schedule" element={<StudySchedule />} />
            <Route path="/top-tasks" element={<TopTasks />} />
            <Route path="/focus-timer" element={<FocusTimer />} />
            <Route path="/mental-health" element={<MentalHealth />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/bibliotheca" element={<Bibliotheca />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
            </Routes>
          </ProfileProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
