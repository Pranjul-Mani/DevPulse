import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import DashboardPage from "@/pages/DashboardPage";
import WorkspacePage from "@/pages/WorkspacePage";
import { Wrench } from "lucide-react";

function ProtectedRoute({ children }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  if (!accessToken) return <Navigate to="/login" replace />;
  return children;
}

function GuestRoute({ children }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  if (accessToken) return <Navigate to="/dashboard" replace />;
  return children;
}

function DevelopmentBanner() {
  const location = useLocation();
  if (location.pathname.startsWith('/workspace')) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] bg-[#0d1117]/90 border border-blue-500/20 backdrop-blur-xl text-slate-300 px-5 py-3 rounded-full shadow-2xl flex items-center gap-3 pointer-events-none transition-all duration-300 hover:scale-105">
      <div className="bg-blue-500/10 p-2 rounded-full relative">
        <div className="absolute inset-0 bg-blue-500/15 animate-ping rounded-full opacity-60"></div>
        <Wrench className="w-4 h-4 text-blue-400 relative z-10" />
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-semibold tracking-wide text-slate-200">Product in Active Development</span>
        <span className="text-[10px] text-slate-400 font-medium">Some features are still being refined.</span>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <>
      <DevelopmentBanner />
      <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/workspace/:id" element={<ProtectedRoute><WorkspacePage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
}
