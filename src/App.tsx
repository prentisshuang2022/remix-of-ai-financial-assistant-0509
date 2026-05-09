import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "./pages/NotFound.tsx";
import AppShell from "./components/AppShell";
import Dashboard from "./pages/Dashboard";
import Expense from "./pages/Expense";
import ExpenseDetail from "./pages/ExpenseDetail";
import Payable from "./pages/Payable";
import Receivable from "./pages/Receivable";
import Risk from "./pages/Risk";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/expense" element={<Expense />} />
            <Route path="/expense/:id" element={<ExpenseDetail />} />
            <Route path="/payable" element={<Payable />} />
            <Route path="/receivable" element={<Receivable />} />
            <Route path="/risk" element={<Risk />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
