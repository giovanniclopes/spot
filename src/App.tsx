import { HelpCircle } from "lucide-react";
import { useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Timeline } from "./components/bookings/Timeline";
import { BackButton } from "./components/layout/BackButton";
import { Navbar } from "./components/layout/Navbar";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import { SupportModal } from "./components/layout/SupportModal";
import { TermsModal } from "./components/layout/TermsModal";
import { Button } from "./components/ui/button";
import { useAuth } from "./context/AuthContext";
import { AccountSettings } from "./pages/AccountSettings";
import { Dashboard } from "./pages/Dashboard";
import { Login } from "./pages/Login";
import { MyBookings } from "./pages/MyBookings";
import { Analytics } from "./pages/admin/Analytics";
import { RoomsManagement } from "./pages/admin/RoomsManagement";
import { SystemSettings } from "./pages/admin/SystemSettings";
import { UserManagement } from "./pages/admin/UserManagement";

function App() {
  const { user, profile, loading } = useAuth();
  const [supportModalOpen, setSupportModalOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-canvas">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-2xl flex items-center justify-center shadow-medium">
            <span className="text-white font-bold text-2xl">S</span>
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-primary border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/dashboard" replace /> : <Login />}
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/timeline"
          element={
            <ProtectedRoute>
              <div className="min-h-screen bg-gradient-canvas">
                <Navbar />
                <div className="container mx-auto px-4 pt-24 pb-12">
                  <BackButton to="/dashboard" />
                  <h1 className="text-heading-1 font-semibold mb-6">
                    Timeline de Agendamentos
                  </h1>
                  <Timeline />
                </div>
              </div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-bookings"
          element={
            <ProtectedRoute>
              <MyBookings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <AccountSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute requireAdmin>
              <UserManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/rooms"
          element={
            <ProtectedRoute requireAdmin>
              <RoomsManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute requireAdmin>
              <SystemSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <ProtectedRoute requireAdmin>
              <Analytics />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      {user && profile && !profile.terms_accepted && <TermsModal />}
      <div className="fixed bottom-4 right-4">
        <Button
          variant="outline"
          size="icon"
          className="rounded-full shadow-lg"
          onClick={() => setSupportModalOpen(true)}
        >
          <HelpCircle className="h-5 w-5" />
        </Button>
      </div>
      <SupportModal
        open={supportModalOpen}
        onClose={() => setSupportModalOpen(false)}
      />
    </>
  );
}

export default App;
