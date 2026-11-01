import { describe, expect, it } from "vitest";
import {
  getListeningRankings,
  getListeningTotalMs,
  getYearlyWrapped,
  localDateKey,
  type ListeningTrackSummary,
} from "./listeningStatsStore";

describe("listening statistics ranges", () => {
  const totals = {
    "2026-10-30": 60_000,
    "2026-10-31": 120_000,
    "2026-10-01": 180_000,
    "2026-01-01": 240_000,
    "2025-12-31": 300_000,
  };
  const now = new Date(2026, 9, 31, 12, 0, 0);

  it("uses local date keys", () => {
    expect(localDateKey(new Date(2026, 9, 31))).toBe("2026-10-31");
  });

  it("totals today only", () => {
    expect(getListeningTotalMs(totals, "today", now)).toBe(120_000);
  });

  it("totals the current Monday-to-Sunday week", () => {
    expect(getListeningTotalMs(totals, "week", now)).toBe(180_000);
  });

  it("totals the current calendar month", () => {
    expect(getListeningTotalMs(totals, "month", now)).toBe(360_000);
  });

  it("totals the current calendar year", () => {
    expect(getListeningTotalMs(totals, "year", now)).toBe(600_000);
  });

  it("keeps the previous year's Wrapped totals and rankings", () => {
    const tracks = {
      "2026-10-30": {
        songA: { id: "songA", title: "A", artists: "Artist A", artistList: [{ id: "artistA", name: "Artist A" }], coverUrl: "", listenedMs: 120_000 },
      },
      "2025-12-31": {
        oldSong: { id: "oldSong", title: "Old", artists: "Old Artist", artistList: [{ name: "Old Artist" }], coverUrl: "", listenedMs: 900_000 },
      },
    };
    const wrapped = getYearlyWrapped(totals, tracks, 2025);
    expect(wrapped.year).toBe(2025);
    expect(wrapped.totalMs).toBe(300_000);
    expect(wrapped.topSongs.map((song) => song.id)).toEqual(["oldSong"]);
    expect(wrapped.topArtists.map((artist) => artist.name)).toEqual(["Old Artist"]);
  });

  it("uses the selected period for song and artist rankings", () => {
    const tracks: Record<string, Record<string, ListeningTrackSummary>> = {
      "2026-10-31": {
        songA: { id: "songA", title: "A", artists: "Artist A", artistList: [{ id: "artistA", name: "Artist A" }], coverUrl: "", listenedMs: 120_000 },
        songB: { id: "songB", title: "B", artists: "Artist B", artistList: [{ id: "artistB", name: "Artist B" }], coverUrl: "", listenedMs: 240_000 },
      },
      "2026-10-30": {
        songA: { id: "songA", title: "A", artists: "Artist A", artistList: [{ id: "artistA", name: "Artist A" }], coverUrl: "", listenedMs: 60_000 },
      },
      "2026-10-01": {
        songC: { id: "songC", title: "C", artists: "Artist A", artistList: [{ id: "artistA", name: "Artist A" }], coverUrl: "", listenedMs: 300_000 },
      },
      "2026-01-01": {
        songD: { id: "songD", title: "D", artists: "Artist D", artistList: [{ id: "artistD", name: "Artist D" }], coverUrl: "", listenedMs: 400_000 },
      },
      "2025-12-31": {
        oldSong: { id: "oldSong", title: "Old", artists: "Old Artist", artistList: [{ name: "Old Artist" }], coverUrl: "", listenedMs: 900_000 },
      },
    };

    expect(getListeningRankings(tracks, "today", now).topSongs.map((song) => song.id))
      .toEqual(["songB", "songA"]);
    expect(getListeningRankings(tracks, "week", now).topSongs.map((song) => song.id))
      .toEqual(["songB", "songA"]);
    expect(getListeningRankings(tracks, "month", now).topSongs.map((song) => song.id))
      .toEqual(["songC", "songB", "songA"]);
    expect(getListeningRankings(tracks, "year", now).topSongs.map((song) => song.id))
      .toEqual(["songD", "songC", "songB", "songA"]);

    const monthArtists = getListeningRankings(tracks, "month", now).topArtists;
    expect(monthArtists[0]).toMatchObject({ id: "artistA", name: "Artist A", listenedMs: 480_000 });
    expect(monthArtists.some((artist) => artist.name === "Old Artist")).toBe(false);
  });

  it("limits song and artist rankings to ten entries", () => {
    const tracks: Record<string, Record<string, ListeningTrackSummary>> = {
      "2026-10-31": Object.fromEntries(
        Array.from({ length: 12 }, (_, index) => {
          const id = `song-${index}`;
          return [id, {
            id,
            title: `Song ${index}`,
            artists: `Artist ${index}`,
            artistList: [{ id: `artist-${index}`, name: `Artist ${index}` }],
            coverUrl: "",
            listenedMs: (12 - index) * 60_000,
          }];
        }),
      ),
    };

    const rankings = getListeningRankings(tracks, "today", now);
    expect(rankings.topSongs).toHaveLength(10);
    expect(rankings.topArtists).toHaveLength(10);
  });
});
