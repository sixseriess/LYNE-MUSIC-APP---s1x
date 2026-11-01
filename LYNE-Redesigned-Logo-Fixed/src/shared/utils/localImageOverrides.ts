import { useCallback, useSyncExternalStore } from "react";

const PROFILE_PICTURE_KEY_PREFIX = "liner_profile_picture_v1:";
const PLAYLIST_COVERS_KEY = "liner_custom_playlist_covers_v1";

type PlaylistCoverMap = Record<string, string>;
const listeners = new Set<() => void>();

function profilePictureKey(accountId: string | null) {
  return `${PROFILE_PICTURE_KEY_PREFIX}${encodeURIComponent(accountId || "guest")}`;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (typeof window !== "undefined") {
    window.addEventListener("storage", listener);
  }
  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", listener);
    }
  };
}

function notifyChanged() {
  listeners.forEach((listener) => listener());
}

export function getLocalProfilePicture(accountId: string | null): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(profilePictureKey(accountId));
  } catch {
    return null;
  }
}

export function setLocalProfilePicture(accountId: string | null, image: string) {
  if (typeof window === "undefined") {
    throw new Error("Local storage is unavailable.");
  }
  window.localStorage.setItem(profilePictureKey(accountId), image);
  notifyChanged();
}

export function clearLocalProfilePicture(accountId: string | null) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(profilePictureKey(accountId));
  notifyChanged();
}

function readPlaylistCoverMap(): PlaylistCoverMap {
  if (typeof window === "undefined") return {};
  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(PLAYLIST_COVERS_KEY) ?? "{}",
    ) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    const covers: PlaylistCoverMap = {};
    for (const [id, value] of Object.entries(parsed)) {
      if (typeof value === "string" && value.startsWith("data:image/")) {
        covers[id] = value;
      }
    }
    return covers;
  } catch {
    return {};
  }
}

export function getLocalPlaylistCover(id: string | null): string | null {
  if (!id) return null;
  return readPlaylistCoverMap()[id] ?? null;
}

export function setLocalPlaylistCover(id: string, image: string | null) {
  if (!id) return;
  if (typeof window === "undefined") {
    throw new Error("Local storage is unavailable.");
  }
  const covers = readPlaylistCoverMap();
  if (image) covers[id] = image;
  else delete covers[id];
  window.localStorage.setItem(PLAYLIST_COVERS_KEY, JSON.stringify(covers));
  notifyChanged();
}

export function useLocalProfilePicture(accountId: string | null) {
  const getSnapshot = useCallback(
    () => getLocalProfilePicture(accountId),
    [accountId],
  );
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}

export function useLocalPlaylistCover(id: string | null) {
  const getSnapshot = useCallback(() => getLocalPlaylistCover(id), [id]);
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}
