import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import DashboardPage from "@/pages/DashboardPage";
import WorkspacePage from "@/pages/WorkspacePage";
import { AlertTriangle } from "lucide-react";

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
  return (
    <div className="fixed bottom-6 right-6 z-[9999] bg-[#0a0a0a]/80 border border-yellow-500/20 backdrop-blur-xl text-yellow-500 px-5 py-4 rounded-xl shadow-2xl flex items-center gap-4 pointer-events-none transition-all duration-300 hover:scale-105">
      <div className="bg-yellow-500/10 p-2.5 rounded-full relative">
        <div className="absolute inset-0 bg-yellow-500/20 animate-ping rounded-full opacity-75"></div>
        <AlertTriangle className="w-5 h-5 text-yellow-500 relative z-10" />
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-bold tracking-wide drop-shadow-sm text-yellow-400">Website Under Development</span>
        <span className="text-xs text-yellow-500/70 font-medium">Some features might be incomplete</span>
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
