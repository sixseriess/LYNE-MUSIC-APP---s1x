import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { debouncedStorage } from "@/shared/utils/storage";

export type ListeningPeriod = "today" | "week" | "month" | "year";

export interface ListeningStatsState {
  /** Total milliseconds listened, keyed by the listener's local calendar date. */
  listenedMsByDay: Record<string, number>;
  addListeningTime: (milliseconds: number, timestamp?: number) => void;
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
    // Use Monday as the first day of the week.
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

export const useListeningStatsStore = create<ListeningStatsState>()(
  persist(
    (set) => ({
      listenedMsByDay: {},
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
    }),
    {
      name: "lyne_listening_stats_v1",
      storage: createJSONStorage(() => debouncedStorage),
      partialize: (state) => ({ listenedMsByDay: state.listenedMsByDay }),
    },
  ),
);
