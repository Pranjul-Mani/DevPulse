import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.error || "Login failed");
    }
  };

  return (
    <div className="min-h-screen bg-devpulse-bg flex items-center justify-center px-4 relative">
      <Link to="/" className="absolute top-8 left-8 flex items-center gap-2 text-sm font-mono text-devpulse-muted hover:text-devpulse-text transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </Link>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 font-heading font-extrabold text-2xl text-devpulse-text">
            <div className="w-2.5 h-2.5 bg-devpulse-accent rounded-full animate-pulse-scale" />
            DevPulse
          </Link>
          <p className="text-devpulse-muted text-sm mt-2">
            Sign in to your account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-mono text-devpulse-muted block mb-1.5">
              Email
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="bg-devpulse-surface border-devpulse-border text-devpulse-text"
            />
          </div>
          <div>
            <label className="text-xs font-mono text-devpulse-muted block mb-1.5">
              Password
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="bg-devpulse-surface border-devpulse-border text-devpulse-text"
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-devpulse-accent text-black font-bold hover:bg-devpulse-accent/80"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            Sign In
          </Button>
        </form>

        <p className="text-center text-devpulse-muted text-sm mt-6">
          Don't have an account?{" "}
          <Link to="/register" className="text-devpulse-accent hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
