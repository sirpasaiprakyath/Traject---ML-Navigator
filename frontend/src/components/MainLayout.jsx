import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useDashboard } from "../context/DashboardContext";
import Sidebar from "./Sidebar";
import ModalsContainer from "./ModalsContainer";
import { Loader2 } from "lucide-react";

export default function MainLayout() {
  const { currentUser, profileData, loading } = useAuth();
  const { report, loading: dashboardLoading, toastMessage } = useDashboard();

  // If loading auth state, show spinner
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0F0F] flex flex-col items-center justify-center text-white">
        <Loader2 className="w-12 h-12 text-[#3B82F6] animate-spin mb-4" />
        <p className="text-gray-400 font-medium">Syncing Traject session...</p>
      </div>
    );
  }

  // Redirect to login if not logged in
  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  // Redirect to onboarding if not completed onboarding
  if (profileData && !profileData.onboardingComplete) {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-[#E5E7EB] font-sans pb-16 md:pb-6 relative overflow-x-hidden">
      {/* Background radial glow */}
      <div className="absolute top-[-25%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-500/5 blur-[150px] pointer-events-none" />

      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="md:pl-[240px] transition-all duration-300">
        <main className="max-w-7xl mx-auto px-6 pt-8 space-y-8">
          <Outlet />
        </main>
      </div>

      {/* Modals & Wizards */}
      <ModalsContainer />

      {/* Success Toast */}
      {toastMessage && (
        <div className="fixed bottom-20 md:bottom-6 right-6 z-50 bg-[#111827] border border-green-500/30 text-white rounded-xl shadow-2xl p-4 flex items-center gap-3 animate-fade-in transition-all duration-300">
          <div className="w-8 h-8 rounded-full bg-green-500/10 border border-green-500/20 text-green-500 flex items-center justify-center font-bold">
            ✓
          </div>
          <div>
            <p className="text-xs text-gray-400 font-semibold">Success</p>
            <p className="text-sm font-bold text-white">{toastMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
}
