import { createClient, type Session, type User } from "@supabase/supabase-js";
import type { AuthTokens, PublicUser, UpdateProfileInput } from "@/shared/api";
import { setAuthSession } from "@/shared/api";

const url = import.meta.env.VITE_MOBILE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_MOBILE_SUPABASE_KEY as string | undefined;

export const mobileSupabaseEnabled = Boolean(url && key);
export const mobileSupabase = mobileSupabaseEnabled
  ? createClient(url!, key!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: "lyne-mobile-supabase-auth",
      },
    })
  : null;

function toPublicUser(user: User): PublicUser {
  const metadata = user.user_metadata ?? {};
  return {
    id: user.id,
    email: user.email,
    username: typeof metadata.username === "string" ? metadata.username : null,
    displayName:
      typeof metadata.display_name === "string" ? metadata.display_name : null,
    avatarUrl: typeof metadata.avatar_url === "string" ? metadata.avatar_url : null,
    bio: typeof metadata.bio === "string" ? metadata.bio : null,
    isPublic: metadata.is_public !== false,
    showActivity: metadata.show_activity !== false,
    showHistory: metadata.show_history !== false,
    showLikedTracks: metadata.show_liked_tracks !== false,
    participateLeaderboards: metadata.participate_leaderboards !== false,
  };
}

export function toMobileAuthTokens(session: Session): AuthTokens {
  return {
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    accessTokenExpiresAt: new Date((session.expires_at ?? 0) * 1000).toISOString(),
    expiresAt: session.expires_at,
    user: toPublicUser(session.user),
  };
}

export function syncMobileSession(session: Session | null): void {
  setAuthSession(session ? toMobileAuthTokens(session) : null);
}

export async function getMobileSession(): Promise<Session | null> {
  if (!mobileSupabase) return null;
  const { data, error } = await mobileSupabase.auth.getSession();
  if (error) throw error;
  syncMobileSession(data.session);
  return data.session;
}

export async function mobileLogin(email: string, password: string): Promise<PublicUser> {
  if (!mobileSupabase) throw new Error("Mobile account service is not configured.");
  const { data, error } = await mobileSupabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  if (!data.session) throw new Error("No session was returned. Please try again.");
  syncMobileSession(data.session);
  return toPublicUser(data.user);
}

export async function mobileRegister(
  email: string,
  password: string,
  username: string,
  displayName: string,
): Promise<PublicUser> {
  if (!mobileSupabase) throw new Error("Mobile account service is not configured.");
  const { data, error } = await mobileSupabase.auth.signUp({
    email,
    password,
    options: { data: { username, display_name: displayName } },
  });
  if (error) throw error;
  if (!data.session) {
    throw new Error("Account created. Check your email to confirm it, then sign in.");
  }
  syncMobileSession(data.session);
  return toPublicUser(data.user);
}

export async function mobileUpdateProfile(patch: UpdateProfileInput): Promise<PublicUser> {
  if (!mobileSupabase) throw new Error("Mobile account service is not configured.");
  const metadata: Record<string, unknown> = {};
  const fields: Record<keyof UpdateProfileInput, string> = {
    username: "username",
    displayName: "display_name",
    avatarUrl: "avatar_url",
    bio: "bio",
    isPublic: "is_public",
    showActivity: "show_activity",
    showHistory: "show_history",
    showLikedTracks: "show_liked_tracks",
    participateLeaderboards: "participate_leaderboards",
  };
  for (const [key, value] of Object.entries(patch)) {
    metadata[fields[key as keyof UpdateProfileInput]] = value;
  }
  const { data, error } = await mobileSupabase.auth.updateUser({ data: metadata });
  if (error) throw error;
  if (!data.user) throw new Error("Could not update your profile.");
  const { data: sessionData } = await mobileSupabase.auth.getSession();
  syncMobileSession(sessionData.session);
  return toPublicUser(data.user);
}

export async function mobileLogout(): Promise<void> {
  if (!mobileSupabase) return;
  const { error } = await mobileSupabase.auth.signOut();
  if (error) throw error;
  syncMobileSession(null);
}
