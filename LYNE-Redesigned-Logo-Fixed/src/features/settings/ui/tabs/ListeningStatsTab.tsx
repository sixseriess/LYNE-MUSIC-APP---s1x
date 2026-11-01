import { useMemo, useState } from "react";
import {
  getListeningRankings,
  getListeningTotalMs,
  getYearlyWrapped,
  useListeningStatsStore,
  type ListeningPeriod,
} from "@/features/player/store/listeningStatsStore";
import { SegmentedControl, SettingSection } from "../controls";

const PERIOD_OPTIONS: { value: ListeningPeriod; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "year", label: "This Year" },
];

const PERIOD_DESCRIPTIONS: Record<ListeningPeriod, string> = {
  today: "Your listening time so far today.",
  week: "Your listening time from Monday through today.",
  month: "Your listening time so far this calendar month.",
  year: "Your listening time so far this calendar year.",
};

function formatMinutes(milliseconds: number) {
  return Math.floor(milliseconds / 60_000).toLocaleString();
}

export function ListeningStatsTab() {
  const [period, setPeriod] = useState<ListeningPeriod>("week");
  const listenedMsByDay = useListeningStatsStore((state) => state.listenedMsByDay);
  const trackListeningByDay = useListeningStatsStore((state) => state.trackListeningByDay);
  const totalMinutes = useMemo(
    () => Math.floor(getListeningTotalMs(listenedMsByDay, period, new Date()) / 60_000),
    [listenedMsByDay, period],
  );
  const rankings = useMemo(
    () => getListeningRankings(trackListeningByDay, period, new Date()),
    [trackListeningByDay, period],
  );
  const wrappedYear = new Date().getFullYear() - 1;
  const wrapped = useMemo(
    () => getYearlyWrapped(listenedMsByDay, trackListeningByDay, wrappedYear),
    [listenedMsByDay, trackListeningByDay, wrappedYear],
  );

  return (
    <div className="flex flex-col gap-[18px]">
      <SettingSection label="Listening activity">
        <div className="flex flex-col gap-[18px] px-[16px] py-[16px]">
          <div className="flex flex-col gap-[5px]">
            <span className="text-[13px] font-[500] text-text-secondary">
              Total Minutes Listened
            </span>
            <div className="flex items-baseline gap-[8px]">
              <span className="text-[38px] leading-[44px] font-[600] tracking-[-0.04em] tabular-nums text-text-primary">
                {totalMinutes.toLocaleString()}
              </span>
              <span className="text-[14px] font-[500] text-text-tertiary">minutes</span>
            </div>
            <span className="text-[12px] leading-[17px] text-text-tertiary">
              {PERIOD_DESCRIPTIONS[period]}
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-[12px] border-t border-border-alpha-8 pt-[14px]">
            <span className="text-[13px] font-[500] text-text-secondary">Time period</span>
            <SegmentedControl
              ariaLabel="Listening stats time period"
              value={period}
              onChange={setPeriod}
              options={PERIOD_OPTIONS}
            />
          </div>
        </div>
      </SettingSection>

      <section className="overflow-hidden rounded-[16px] border border-border-alpha-8 bg-bg-elevated">
        <div className="flex flex-col gap-[5px] border-b border-border-alpha-8 px-[16px] py-[15px]">
          <h3 className="m-0 text-[14px] font-[650] text-text-primary">Your top music</h3>
          <p className="m-0 text-[11px] text-text-tertiary">
            Top songs and artists for {PERIOD_OPTIONS.find((option) => option.value === period)?.label.toLowerCase()}.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-[18px] p-[16px] sm:grid-cols-2">
          <div className="min-w-0">
            <div className="mb-[12px] flex items-center justify-between">
              <h4 className="m-0 text-[13px] font-[650] text-text-primary">Top 10 songs</h4>
              <span className="text-[10px] text-text-tertiary">BY LISTEN TIME</span>
            </div>
            {rankings.topSongs.length ? (
              <ol className="m-0 flex list-none flex-col gap-[10px] p-0">
                {rankings.topSongs.map((song, index) => (
                  <li key={song.id} className="flex min-w-0 items-center gap-[9px]">
                    <span className="w-[15px] shrink-0 text-[11px] font-[650] tabular-nums text-text-tertiary">{index + 1}</span>
                    {song.coverUrl ? (
                      <img src={song.coverUrl} alt="" className="size-[34px] shrink-0 rounded-[7px] object-cover" />
                    ) : (
                      <div className="size-[34px] shrink-0 rounded-[7px] bg-bg-surface" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[12px] font-[600] text-text-primary">{song.title}</div>
                      <div className="truncate text-[10px] text-text-tertiary">{song.artists}</div>
                    </div>
                    <span className="shrink-0 text-[10px] tabular-nums text-text-tertiary">{formatMinutes(song.listenedMs)}m</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="m-0 text-[12px] leading-[18px] text-text-tertiary">
                Your top songs for this period will show here as you listen.
              </p>
            )}
          </div>

          <div className="min-w-0">
            <div className="mb-[12px] flex items-center justify-between">
              <h4 className="m-0 text-[13px] font-[650] text-text-primary">Top 10 artists</h4>
              <span className="text-[10px] text-text-tertiary">BY LISTEN TIME</span>
            </div>
            {rankings.topArtists.length ? (
              <ol className="m-0 flex list-none flex-col gap-[10px] p-0">
                {rankings.topArtists.map((artist, index) => (
                  <li key={artist.id} className="flex min-w-0 items-center gap-[9px]">
                    <span className="w-[15px] shrink-0 text-[11px] font-[650] tabular-nums text-text-tertiary">{index + 1}</span>
                    <div className="flex size-[34px] shrink-0 items-center justify-center rounded-full bg-bg-surface text-[12px] font-[700] text-text-secondary">
                      {artist.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1 truncate text-[12px] font-[600] text-text-primary">{artist.name}</div>
                    <span className="shrink-0 text-[10px] tabular-nums text-text-tertiary">{formatMinutes(artist.listenedMs)}m</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="m-0 text-[12px] leading-[18px] text-text-tertiary">
                Your top artists for this period will show here as you listen.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-[16px] border border-border-alpha-8 bg-bg-elevated">
        <div className="relative overflow-hidden bg-gradient-to-br from-[#17142d] via-[#29204a] to-[#101018] px-[20px] py-[22px] text-white">
          <div className="pointer-events-none absolute -right-[30px] -top-[55px] size-[190px] rounded-full bg-[#a78bfa]/20 blur-[50px]" />
          <div className="relative flex items-start justify-between gap-[12px]">
            <div>
              <span className="text-[11px] font-[700] uppercase tracking-[0.22em] text-white/60">LYNE presents</span>
              <h3 className="m-0 mt-[8px] text-[30px] font-[750] tracking-[-0.06em]">Wrapped {wrappedYear}</h3>
              <p className="m-0 mt-[5px] text-[12px] text-white/65">Your year in music, all in one place.</p>
            </div>
            <span className="rounded-full border border-white/15 bg-white/10 px-[10px] py-[6px] text-[10px] font-[650] tracking-[0.12em]">YEAR IN REVIEW</span>
          </div>
          <div className="relative mt-[24px]">
            <div className="text-[11px] font-[600] uppercase tracking-[0.14em] text-white/60">Minutes listened</div>
            <div className="mt-[2px] text-[42px] font-[750] leading-none tracking-[-0.06em] tabular-nums">{formatMinutes(wrapped.totalMs)}</div>
            <div className="mt-[5px] text-[11px] text-white/55">Across all your listening sessions</div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-[18px] p-[16px] sm:grid-cols-2">
          <div className="min-w-0">
            <div className="mb-[12px] flex items-center justify-between">
              <h4 className="m-0 text-[13px] font-[650] text-text-primary">Top 10 songs</h4>
              <span className="text-[10px] text-text-tertiary">BY LISTEN TIME</span>
            </div>
            {wrapped.topSongs.length ? (
              <ol className="m-0 flex list-none flex-col gap-[10px] p-0">
                {wrapped.topSongs.map((song, index) => (
                  <li key={song.id} className="flex min-w-0 items-center gap-[9px]">
                    <span className="w-[15px] shrink-0 text-[11px] font-[650] tabular-nums text-text-tertiary">{index + 1}</span>
                    {song.coverUrl ? <img src={song.coverUrl} alt="" className="size-[34px] shrink-0 rounded-[7px] object-cover" /> : <div className="size-[34px] shrink-0 rounded-[7px] bg-bg-surface" />}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[12px] font-[600] text-text-primary">{song.title}</div>
                      <div className="truncate text-[10px] text-text-tertiary">{song.artists}</div>
                    </div>
                    <span className="shrink-0 text-[10px] tabular-nums text-text-tertiary">{formatMinutes(song.listenedMs)}m</span>
                  </li>
                ))}
              </ol>
            ) : <p className="m-0 text-[12px] leading-[18px] text-text-tertiary">Your most-listened songs will appear here as LYNE tracks your listening this year.</p>}
          </div>
          <div className="min-w-0">
            <div className="mb-[12px] flex items-center justify-between">
              <h4 className="m-0 text-[13px] font-[650] text-text-primary">Top 10 artists</h4>
              <span className="text-[10px] text-text-tertiary">BY LISTEN TIME</span>
            </div>
            {wrapped.topArtists.length ? (
              <ol className="m-0 flex list-none flex-col gap-[10px] p-0">
                {wrapped.topArtists.map((artist, index) => (
                  <li key={artist.id} className="flex min-w-0 items-center gap-[9px]">
                    <span className="w-[15px] shrink-0 text-[11px] font-[650] tabular-nums text-text-tertiary">{index + 1}</span>
                    <div className="flex size-[34px] shrink-0 items-center justify-center rounded-full bg-bg-surface text-[12px] font-[700] text-text-secondary">{artist.name.slice(0, 1).toUpperCase()}</div>
                    <div className="min-w-0 flex-1 truncate text-[12px] font-[600] text-text-primary">{artist.name}</div>
                    <span className="shrink-0 text-[10px] tabular-nums text-text-tertiary">{formatMinutes(artist.listenedMs)}m</span>
                  </li>
                ))}
              </ol>
            ) : <p className="m-0 text-[12px] leading-[18px] text-text-tertiary">Your top artists will appear here as LYNE tracks your listening this year.</p>}
          </div>
        </div>
        <div className="border-t border-border-alpha-8 px-[16px] py-[11px] text-[10px] leading-[16px] text-text-tertiary">
          Wrapped is built from listening activity recorded on this device. LYNE starts collecting song and artist rankings after this update is installed.
        </div>
      </section>

      <p className="m-0 px-[2px] text-[12px] leading-[18px] text-text-tertiary">
        LYNE counts time while a song is actively playing. Paused time and buffering time aren't included. Your listening totals are saved on this device.
      </p>
    </div>
  );
}
