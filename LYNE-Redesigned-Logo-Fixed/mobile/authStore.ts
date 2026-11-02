import { create } from "zustand";
import {
  clearAuthSession,
  getAuthSession,
  setAuthSession,
  refreshAuthSession,
} from "@/shared/api/auth-session";
import type { AuthUser, PublicUser, UpdateProfileInput } from "@/shared/contracts";
import { queryCache } from "@/shared/cache/queryCache";
import { clearScreenCache } from "@/shared/cache/screenCache";
import {
  mobileSupabaseEnabled,
  getMobileSession,
  mobileLogin,
  mobileRegister,
  mobileUpdateProfile,
  mobileLogout,
} from "./supabaseAuth";

export type AuthStatus = "initializing" | "authenticated" | "anonymous";
export type AuthState = {
  status: AuthStatus;
  user: AuthUser | null;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    username: string,
    displayName: string,
  ) => Promise<void>;
  updateProfile: (patch: UpdateProfileInput) => Promise<PublicUser>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  status: "initializing",
  user: null,
  initialize: async () => {
    if (mobileSupabaseEnabled) {
      try {
        const session = await Promise.race([
          getMobileSession(),
          new Promise<null>((_, reject) =>
            setTimeout(() => reject(new Error("Mobile session restore timed out")), 5000),
          ),
        ]);
        set({ status: session ? "authenticated" : "anonymous", user: session ? (getAuthSession()?.user ?? null) : null });
      } catch (error) {
        console.error("[LYNE Mobile] Supabase session restore failed:", error);
        set({ status: "anonymous", user: null });
      }
      return;
    }
    const stored = getAuthSession();
    if (!stored) {
      set({ status: "anonymous", user: null });
      return;
    }
    // Optimistically authenticate if stored user is present
    if (stored.user) {
      set({ status: "authenticated", user: stored.user });
    }
    try {
      const { api } = await import("@/shared/api/api");
      const getMePromise = api.getMe();
      const timeoutPromise = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error("Auth initialize timeout")), 6000),
      );
      const user = await Promise.race([getMePromise, timeoutPromise]);
      const current = getAuthSession();
      if (current) setAuthSession({ ...current, user: user ?? current.user });
      set({
        status: "authenticated",
        user: user ?? current?.user ?? stored.user,
      });
    } catch (err) {
      if (
        isApiError(err) &&
        (err.status === 401 || err.status === 403)
      ) {
        // Attempt refresh before clearing session in case access token expired between sessions
        const current = getAuthSession();
        if (current?.refreshToken) {
          try {
            const refreshed = await refreshAuthSession();
            if (refreshed) {
              const { api } = await import("@/shared/api/api");
              const retryUser = await api.getMe().catch(() => null);
              const active = getAuthSession();
              if (active)
                setAuthSession({ ...active, user: retryUser ?? active.user });
              set({
                status: "authenticated",
                user:
                  retryUser ?? refreshed.user ?? current.user ?? stored.user,
              });
              return;
            }
          } catch {
            // refresh failed
          }
        }
        // refreshAuthSession already drops the session when the server rejects the refresh token (401/403).
        // still here = the refresh failed for a transient reason (network, 5xx), so keep the user signed in.
        // shortcut: a server answering 400/422 for a dead refresh token keeps a broken session, use logout then
        const remaining = getAuthSession();
        if (remaining?.refreshToken) {
          set({ status: "authenticated", user: remaining.user ?? stored.user });
          return;
        }
        setAuthSession(null);
        set({ status: "anonymous", user: null });
      } else {
        // If it's a network error, timeout, or transient 5xx, preserve authenticated state if we have a stored session
        if (stored.user || stored.accessToken) {
          set({ status: "authenticated", user: stored.user });
        } else {
          setAuthSession(null);
          set({ status: "anonymous", user: null });
        }
      }
    }
  },
  login: async (email, password) => {
    if (mobileSupabaseEnabled) {
      const user = await mobileLogin(email, password);
      set({ status: "authenticated", user });
      if (typeof window !== "undefined") window.dispatchEvent(new Event("library:changed"));
      return;
    }
    const { api } = await import("@/shared/api/api");
    const result = await api.login(email, password);
    set({ status: "authenticated", user: result.user });
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("library:changed"));
    }
  },
  register: async (email, password, username, displayName) => {
    if (mobileSupabaseEnabled) {
      const user = await mobileRegister(email, password, username, displayName);
      set({ status: "authenticated", user });
      if (typeof window !== "undefined") window.dispatchEvent(new Event("library:changed"));
      return;
    }
    const { api } = await import("@/shared/api/api");
    const result = await api.register(email, password, username, displayName);
    set({ status: "authenticated", user: result.user });
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("library:changed"));
    }
  },
  updateProfile: async (patch) => {
    if (mobileSupabaseEnabled) {
      const updated = await mobileUpdateProfile(patch);
      set((prev) => ({ user: prev.user ? { ...prev.user, ...updated } : updated }));
      return updated;
    }
    const { api } = await import("@/shared/api/api");
    const updated = await api.updateProfile(patch);
    const current = getAuthSession();
    if (current) {
      setAuthSession({ ...current, user: { ...current.user, ...updated } });
    }
    set((prev) => ({
      user: prev.user ? { ...prev.user, ...updated } : updated,
    }));
    return updated;
  },
  logout: async () => {
    try {
      window.linerElectron?.closeOverlay?.();
      window.linerElectron?.sendOverlayAction?.({ type: "closeOverlay" });
    } catch {}
    if (
      typeof window !== "undefined" &&
      window.location.hash.includes("/player")
    ) {
      window.location.hash = "#/";
    }
    if (mobileSupabaseEnabled) await mobileLogout();
    else await clearAuthSession();
    queryCache.clear();
    clearScreenCache();
    set({ status: "anonymous", user: null });
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("library:changed"));
    }
  },
}));

function isApiError(error: unknown): error is { status: number; code?: string } {
  return typeof error === "object" && error !== null && "status" in error;
}

export function getAuthErrorCode(error: unknown): string {
  if (error instanceof Error && error.name === "HumanCheckCancelledError") return "human_check_cancelled";
  if (!isApiError(error)) {
    const status = typeof error === "object" && error !== null && "status" in error
      ? Number((error as { status?: unknown }).status)
      : 0;
    if (status >= 500) return "server_error";
    if (status >= 400) return "unknown_error";
    return "server_unavailable";
  }
  if (error.status === 0) return "server_unavailable";
  // 5xx and cloudflare 52x: the server is down, not the user's input or connection
  if (error.status >= 500) return "server_error";
  if (error.code === "INVALID_CREDENTIALS") return "invalid_credentials";
  if (error.code === "EMAIL_ALREADY_USED") return "email_already_used";
  if (error.code === "USERNAME_TAKEN") return "username_taken";
  if (error.code === "INVALID_USERNAME") return "invalid_username";
  if (error.code === "INVALID_INPUT") return "invalid_input";
  if (error.code?.startsWith("TURNSTILE_")) return "human_check_failed";
  return "unknown_error";
}

export function authErrorMessage(error: unknown): string {
  if (!isApiError(error)) {
    if (error instanceof Error && error.message) {
      const message = error.message.toLowerCase();
      if (message.includes("invalid api key") || message.includes("invalid jwt")) {
        return "The mobile account service key is invalid. Please try again after LYNE updates.";
      }
      if (message.includes("email not confirmed")) {
        return "Please confirm your email address before signing in.";
      }
      if (message.includes("user already registered")) {
        return "This email is already in use.";
      }
      if (message.includes("password should be at least")) {
        return "Password must be at least 8 characters.";
      }
      if (message.includes("failed to fetch") || message.includes("network") || message.includes("load failed")) {
        return "Could not connect to LYNE accounts. Check your connection and try again.";
      }
      return error.message;
    }
    return "Could not connect to LYNE accounts. Please try again.";
  }
  if (error.code === "INVALID_CREDENTIALS")
    return "Email or password is incorrect.";
  if (error.code === "EMAIL_ALREADY_USED")
    return "This email is already in use.";
  if (error.code === "USERNAME_TAKEN")
    return "This username is already taken. Please choose another.";
  if (error.code === "INVALID_USERNAME")
    return "Username must be 3-30 lowercase characters (a-z, 0-9, _).";
  // unknown api errors stay generic, never surface raw bodies
  return "Something went wrong. Please try again.";
}
