import { lazy, Suspense, useEffect, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/features/auth/store/authStore";
import { getAuthSession } from "@/shared/api";

const AppFrame = lazy(() => import("@/features/navigation/ui/AppFrame"));

function StartupScreen({ message, timedOut, onReload }: { message: string; timedOut?: boolean; onReload?: () => void }) {
  return (
    <div className="mobile-startup" role="status" aria-live="polite">
      <div className="mobile-startup-mark">LYNE</div>
      <div className="mobile-startup-spinner" />
      <p>{message}</p>
      {timedOut && <button type="button" onClick={onReload}>Reload LYNE</button>}
    </div>
  );
}

export default function MobileAuthGate({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const status = useAuthStore((state) => state.status);
  const initialize = useAuthStore((state) => state.initialize);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => { void initialize(); }, [initialize]);

  useEffect(() => {
    if (status !== "initializing") {
      setTimedOut(false);
      return;
    }
    const timer = window.setTimeout(() => setTimedOut(true), 10000);
    return () => window.clearTimeout(timer);
  }, [status]);

  useEffect(() => {
    const syncSession = () => { if (!getAuthSession()) void initialize(); };
    window.addEventListener("auth:changed", syncSession);
    return () => window.removeEventListener("auth:changed", syncSession);
  }, [initialize]);

  useEffect(() => {
    if (status === "anonymous" && pathname !== "/login") navigate("/login", { replace: true });
    if (status === "authenticated" && pathname === "/login") navigate("/", { replace: true });
  }, [pathname, navigate, status]);

  if (status === "initializing") {
    return <StartupScreen message={timedOut ? "LYNE is taking longer than expected to start." : "Getting things ready..."} timedOut={timedOut} onReload={() => window.location.reload()} />;
  }

  if ((status === "anonymous" && pathname !== "/login") || (status === "authenticated" && pathname === "/login")) {
    return <StartupScreen message="Opening LYNE..." />;
  }

  if (pathname === "/login") return <>{children}</>;

  return (
    <Suspense fallback={<StartupScreen message="Opening your music..." />}>
      <AppFrame>{children}</AppFrame>
    </Suspense>
  );
}
