import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { debouncedStorage } from "@/shared/utils/storage";
import type { Track } from "@/shared/types";

export type ListeningPeriod = "today" | "week" | "month" | "year";

export interface ListeningTrackSummary {
  id: string;
  title: string;
  artists: string;
  artistList: { id?: string; name: string }[];
  coverUrl: string;
  listenedMs: number;
}

export interface YearlyWrapped {
  year: number;
  totalMs: number;
  topSongs: ListeningTrackSummary[];
  topArtists: { id: string; name: string; listenedMs: number }[];
}

export interface ListeningStatsState {
  /** Total milliseconds listened, keyed by the listener's local calendar date. */
  listenedMsByDay: Record<string, number>;
  /** Per-track listening time, keyed by local date and then track ID. */
  trackListeningByDay: Record<string, Record<string, ListeningTrackSummary>>;
  addListeningTime: (milliseconds: number, timestamp?: number) => void;
  addTrackListeningTime: (track: Track, milliseconds: number, timestamp?: number) => void;
}

export function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getListeningTotalMs(
  listenedMsByDay: Record<string, number>,
  period: ListeningPeriod,
  now = new Date(),
): number {
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const start = new Date(end);

  if (period === "week") {
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  } else if (period === "month") {
    start.setDate(1);
  } else if (period === "year") {
    start.setMonth(0, 1);
  }

  let total = 0;
  for (const [date, milliseconds] of Object.entries(listenedMsByDay)) {
    if (date >= localDateKey(start) && date <= localDateKey(end)) {
      total += Number.isFinite(milliseconds) ? Math.max(0, milliseconds) : 0;
    }
  }
  return total;
}

export function getYearlyWrapped(
  listenedMsByDay: Record<string, number>,
  trackListeningByDay: Record<string, Record<string, ListeningTrackSummary>>,
  year: number,
): YearlyWrapped {
  const prefix = `${year}-`;
  let totalMs = 0;
  const songs = new Map<string, ListeningTrackSummary>();

  for (const [date, milliseconds] of Object.entries(listenedMsByDay)) {
    if (date.startsWith(prefix) && Number.isFinite(milliseconds)) {
      totalMs += Math.max(0, milliseconds);
    }
  }

  for (const [date, tracks] of Object.entries(trackListeningByDay)) {
    if (!date.startsWith(prefix)) continue;
    for (const track of Object.values(tracks)) {
      const current = songs.get(track.id);
      if (current) current.listenedMs += Math.max(0, track.listenedMs);
      else songs.set(track.id, { ...track, artistList: [...track.artistList] });
    }
  }

  const topSongs = [...songs.values()]
    .sort((a, b) => b.listenedMs - a.listenedMs)
    .slice(0, 10);
  const artists = new Map<string, { id: string; name: string; listenedMs: number }>();

  for (const song of songs.values()) {
    const credits = song.artistList.length
      ? song.artistList
      : song.artists.split(/,| feat\\.? | ft\\.? /i).map((name) => ({ name: name.trim() }));
    for (const artist of credits) {
      const name = artist.name?.trim();
      if (!name) continue;
      const id = artist.id || name.toLocaleLowerCase();
      const current = artists.get(id);
      if (current) current.listenedMs += song.listenedMs;
      else artists.set(id, { id, name, listenedMs: song.listenedMs });
    }
  }

  return {
    year,
    totalMs,
    topSongs,
    topArtists: [...artists.values()].sort((a, b) => b.listenedMs - a.listenedMs).slice(0, 10),
  };
}

export const useListeningStatsStore = create<ListeningStatsState>()(
  persist(
    (set) => ({
      listenedMsByDay: {},
      trackListeningByDay: {},
      addListeningTime: (milliseconds, timestamp = Date.now()) => {
        if (!Number.isFinite(milliseconds) || milliseconds <= 0) return;
        const day = localDateKey(new Date(timestamp));
        set((state) => ({
          listenedMsByDay: {
            ...state.listenedMsByDay,
            [day]: (state.listenedMsByDay[day] ?? 0) + milliseconds,
          },
        }));
      },
      addTrackListeningTime: (track, milliseconds, timestamp = Date.now()) => {
        if (!Number.isFinite(milliseconds) || milliseconds <= 0 || !track?.id) return;
        const day = localDateKey(new Date(timestamp));
        set((state) => {
          const dayTracks = state.trackListeningByDay[day] ?? {};
          const previous = dayTracks[track.id];
          return {
            trackListeningByDay: {
              ...state.trackListeningByDay,
              [day]: {
                ...dayTracks,
                [track.id]: {
                  id: track.id,
                  title: track.title,
                  artists: track.artists,
                  artistList: (track.artistList ?? []).map((artist) => ({
                    id: artist.id,
                    name: artist.name,
                  })),
                  coverUrl: track.coverUrl,
                  listenedMs: (previous?.listenedMs ?? 0) + milliseconds,
                },
              },
            },
          };
        });
      },
    }),
    {
      name: "lyne_listening_stats_v1",
      storage: createJSONStorage(() => debouncedStorage),
      partialize: (state) => ({
        listenedMsByDay: state.listenedMsByDay,
        trackListeningByDay: state.trackListeningByDay,
      }),
    },
  ),
);
