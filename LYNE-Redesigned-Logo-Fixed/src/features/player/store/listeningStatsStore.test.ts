import { describe, expect, it } from "vitest";
import { getListeningTotalMs, localDateKey } from "./listeningStatsStore";

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
});
