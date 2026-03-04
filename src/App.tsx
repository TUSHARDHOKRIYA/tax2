import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import { ProtectedRoute } from "./components/ProtectedRoute";
import ItemsStep from "./pages/ItemsStep";
import CustomerStep from "./pages/CustomerStep";
import ReviewStep from "./pages/ReviewStep";
import SalesReport from "./pages/SalesReport";
import History from "./pages/History";
import AddItem from "./pages/AddItem";
import Dashboard from "./pages/Dashboard";
import EditInvoice from "./pages/EditInvoice";
import JunkCustomers from "./pages/JunkCustomers";
import CompanySettings from "./pages/CompanySettings";
import ManagePayments from "./pages/ManagePayments";
import DashboardLayout from "./components/layout/DashboardLayout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Dashboard Routes */}
          <Route element={<DashboardLayout />}>
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/items"
              element={
                <ProtectedRoute>
                  <ItemsStep />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/company"
              element={
                <ProtectedRoute>
                  <CustomerStep />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/sales-report"
              element={
                <ProtectedRoute>
                  <SalesReport />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/payments"
              element={
                <ProtectedRoute>
                  <ManagePayments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/history"
              element={
                <ProtectedRoute>
                  <History />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/add-item"
              element={
                <ProtectedRoute>
                  <AddItem />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/junk"
              element={
                <ProtectedRoute>
                  <JunkCustomers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/review"
              element={
                <ProtectedRoute>
                  <ReviewStep />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/edit-invoice"
              element={
                <ProtectedRoute>
                  <EditInvoice />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/settings"
              element={
                <ProtectedRoute>
                  <CompanySettings />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Root redirects to Create Invoice (company step) */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Navigate to="/dashboard/company" replace />
              </ProtectedRoute>
            }
          />
          {/* Redirect old wizard paths if needed, or just let them 404/redirect */}
          <Route path="/wizard/*" element={<Navigate to="/dashboard/company" replace />} />

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
