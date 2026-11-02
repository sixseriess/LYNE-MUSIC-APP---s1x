import { create } from "zustand";
import {
  getAuthSession,
  setAuthSession,
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
    set({ status: "anonymous", user: null });

  },
  login: async (email, password) => {
    if (mobileSupabaseEnabled) {
      const user = await mobileLogin(email, password);
      set({ status: "authenticated", user });
      if (typeof window !== "undefined") window.dispatchEvent(new Event("library:changed"));
      return;
    }
    throw new Error("Mobile account service is not configured. Please try again after LYNE updates.");
  },
  register: async (email, password, username, displayName) => {
    if (mobileSupabaseEnabled) {
      const user = await mobileRegister(email, password, username, displayName);
      set({ status: "authenticated", user });
      if (typeof window !== "undefined") window.dispatchEvent(new Event("library:changed"));
      return;
    }
    throw new Error("Mobile account service is not configured. Please try again after LYNE updates.");
  },
  updateProfile: async (patch) => {
    if (mobileSupabaseEnabled) {
      const updated = await mobileUpdateProfile(patch);
      set((prev) => ({ user: prev.user ? { ...prev.user, ...updated } : updated }));
      return updated;
    }
    throw new Error("Mobile account service is not configured. Please try again after LYNE updates.");
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
    else setAuthSession(null);
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
