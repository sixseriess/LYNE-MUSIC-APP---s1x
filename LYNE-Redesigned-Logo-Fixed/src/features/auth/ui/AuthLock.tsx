import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { getAuthSession } from "@/shared/api";
import AppFrame from "@/features/navigation/ui/AppFrame";
import { useWindowState } from "@/features/navigation/hooks/useWindowState";

export function AuthLock({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const status = useAuthStore((state) => state.status);
  const initialize = useAuthStore((state) => state.initialize);
  const { isEdgeToEdge } = useWindowState();
  const [startupTimedOut, setStartupTimedOut] = useState(false);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    if (status !== "initializing") {
      setStartupTimedOut(false);
      return;
    }
    const timer = window.setTimeout(() => setStartupTimedOut(true), 10_000);
    return () => window.clearTimeout(timer);
  }, [status]);

  useEffect(() => {
    const syncExpiredSession = () => {
      if (!getAuthSession()) void initialize();
    };
    window.addEventListener("auth:changed", syncExpiredSession);
    return () => window.removeEventListener("auth:changed", syncExpiredSession);
  }, [initialize]);

  useEffect(() => {
    if (status === "anonymous" && pathname !== "/login") {
      navigate("/login", { replace: true });
    }
    if (status === "authenticated" && pathname === "/login") {
      navigate("/", { replace: true });
    }
  }, [pathname, navigate, status]);

  if (status === "initializing") {
    return (
      <div
        className={`flex h-full w-full flex-col items-center justify-center gap-4 bg-bg-canvas text-white ${isEdgeToEdge ? "rounded-none" : "rounded-[12px]"}`}
        role="status"
        aria-live="polite"
      >
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/15 border-t-[#c8f56a]" />
        <div className="text-center">
          <p className="text-sm font-semibold tracking-wide">LYNE</p>
          <p className="mt-1 text-xs text-white/50">
            {startupTimedOut
              ? "LYNE is taking longer than expected to start."
              : "Getting things ready..."}
          </p>
          {startupTimedOut ? (
            <button
              type="button"
              className="mt-4 rounded-lg bg-[#c8f56a] px-4 py-2 text-xs font-semibold text-black"
              onClick={() => window.location.reload()}
            >
              Reload LYNE
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  if (
    (status === "anonymous" && pathname !== "/login") ||
    (status === "authenticated" && pathname === "/login")
  ) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-bg-canvas text-xs text-white/50">
        Opening LYNE...
      </div>
    );
  }

  return pathname === "/login" ? children : <AppFrame>{children}</AppFrame>;
}

export default AuthLock;
