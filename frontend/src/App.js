import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/sonner";

// Pages
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import DashboardPage from "@/pages/DashboardPage";
import AssessmentPage from "@/pages/AssessmentPage";
import ScorecardPage from "@/pages/ScorecardPage";
import ManagerPage from "@/pages/ManagerPage";
import ExecutivePage from "@/pages/ExecutivePage";
import AdminPage from "@/pages/AdminPage";

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse text-slate-500">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Public Route - redirect if already logged in
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse text-slate-500">Loading...</div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

      {/* Protected Routes */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/assessment/:cycleId/:poId" element={<ProtectedRoute><AssessmentPage /></ProtectedRoute>} />
      <Route path="/scorecard" element={<ProtectedRoute allowedRoles={['ProductOwner', 'Manager', 'Admin', 'ExecViewer']}><ScorecardPage /></ProtectedRoute>} />
      <Route path="/scorecard/:poId" element={<ProtectedRoute allowedRoles={['Manager', 'Admin', 'ExecViewer']}><ScorecardPage /></ProtectedRoute>} />
      <Route path="/manager" element={<ProtectedRoute allowedRoles={['Manager', 'Admin']}><ManagerPage /></ProtectedRoute>} />
      <Route path="/executive" element={<ProtectedRoute allowedRoles={['ExecViewer', 'Admin']}><ExecutivePage /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute allowedRoles={['Admin']}><AdminPage /></ProtectedRoute>} />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster position="top-right" richColors />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
