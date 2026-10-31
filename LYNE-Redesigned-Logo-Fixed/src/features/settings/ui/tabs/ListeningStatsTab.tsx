import { useMemo, useState } from "react";
import {
  getListeningTotalMs,
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

export function ListeningStatsTab() {
  const [period, setPeriod] = useState<ListeningPeriod>("week");
  const listenedMsByDay = useListeningStatsStore(
    (state) => state.listenedMsByDay,
  );
  const totalMinutes = useMemo(
    () =>
      Math.floor(getListeningTotalMs(listenedMsByDay, period, new Date()) / 60_000),
    [listenedMsByDay, period],
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
              <span className="text-[14px] font-[500] text-text-text-tertiary">
                minutes
              </span>
            </div>
            <span className="text-[12px] leading-[17px] text-text-tertiary">
              {PERIOD_DESCRIPTIONS[period]}
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-[12px] border-t border-border-alpha-8 pt-[14px]">
            <span className="text-[13px] font-[500] text-text-secondary">
              Time period
            </span>
            <SegmentedControl
              ariaLabel="Listening stats time period"
              value={period}
              onChange={setPeriod}
              options={PERIOD_OPTIONS}
            />
          </div>
        </div>
      </SettingSection>
      <p className="m-0 px-[2px] text-[12px] leading-[18px] text-text-tertiary">
        LYNE counts time while a song is actively playing. Paused time and
        buffering time aren't included. Your listening totals are saved on this
        device.
      </p>
    </div>
  );
}
