import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { DashboardProvider } from "./context/DashboardContext";
import Login from "./pages/Login";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import SkillsPage from "./pages/SkillsPage";
import ProjectsPage from "./pages/ProjectsPage";
import ResourcesPage from "./pages/ResourcesPage";
import GithubPage from "./pages/GithubPage";
import ResumePage from "./pages/ResumePage";
import MainLayout from "./components/MainLayout";
import { Loader2 } from "lucide-react";

// Route wrapper for public routes like Login
function PublicRoute({ children }) {
  const { currentUser, profileData, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex flex-col items-center justify-center text-white">
        <Loader2 className="w-12 h-12 text-[#3B82F6] animate-spin mb-4" />
        <p className="text-gray-400 font-medium">Syncing Traject session...</p>
      </div>
    );
  }

  if (currentUser) {
    if (profileData && !profileData.onboardingComplete) {
      return <Navigate to="/onboarding" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

// Route wrapper for onboarding route
function OnboardingRoute({ children }) {
  const { currentUser, profileData, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex flex-col items-center justify-center text-white">
        <Loader2 className="w-12 h-12 text-[#3B82F6] animate-spin mb-4" />
        <p className="text-gray-400 font-medium">Syncing Traject session...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (profileData && profileData.onboardingComplete) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

// Root redirection element
function RootRedirect() {
  const { currentUser, profileData, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex flex-col items-center justify-center text-white">
        <Loader2 className="w-12 h-12 text-[#3B82F6] animate-spin mb-4" />
        <p className="text-gray-400 font-medium">Syncing Traject session...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (profileData && !profileData.onboardingComplete) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />
          
          {/* Onboarding route */}
          <Route 
            path="/onboarding" 
            element={
              <OnboardingRoute>
                <Onboarding />
              </OnboardingRoute>
            } 
          />

          {/* Protected layout routes under MainLayout and DashboardProvider */}
          <Route 
            element={
              <DashboardProvider>
                <MainLayout />
              </DashboardProvider>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/skills" element={<SkillsPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/resources" element={<ResourcesPage />} />
            <Route path="/github" element={<GithubPage />} />
            <Route path="/resume" element={<ResumePage />} />
          </Route>

          {/* Root redirector */}
          <Route path="/" element={<RootRedirect />} />

          {/* Fallback redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}
