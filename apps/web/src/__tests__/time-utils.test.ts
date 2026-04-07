import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { formatRelativeTime, formatDateTime, formatDate } from "@/lib/utils/time";

describe("formatRelativeTime", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-07T14:00:00Z"));
  });
  afterEach(() => vi.useRealTimers());

  it("returns 'Just now' for < 1 minute ago", () => {
    expect(formatRelativeTime("2026-04-07T13:59:45Z")).toBe("Just now");
  });

  it("returns minutes for < 1 hour ago", () => {
    expect(formatRelativeTime("2026-04-07T13:45:00Z")).toBe("15 min ago");
  });

  it("returns hours for < 24 hours ago", () => {
    expect(formatRelativeTime("2026-04-07T08:00:00Z")).toBe("6 hr ago");
  });

  it("returns 'Yesterday' for 1 day ago", () => {
    expect(formatRelativeTime("2026-04-06T14:00:00Z")).toBe("Yesterday");
  });

  it("returns 'Xd ago' for 2-6 days", () => {
    expect(formatRelativeTime("2026-04-04T14:00:00Z")).toBe("3d ago");
  });

  it("returns formatted date for > 7 days (same year)", () => {
    const result = formatRelativeTime("2026-03-01T12:00:00Z");
    expect(result).toContain("Mar");
    expect(result).toContain("1");
    expect(result).not.toContain("2026"); // same year, no year shown
  });
});

describe("formatDateTime", () => {
  it("formats a full date with time", () => {
    const result = formatDateTime("2026-04-07T14:30:00Z");
    expect(result).toContain("Apr");
    expect(result).toContain("7");
    expect(result).toContain("2026");
  });
});

describe("formatDate", () => {
  it("formats date without time", () => {
    const result = formatDate("2026-04-07T14:30:00Z");
    expect(result).toContain("Apr");
    expect(result).toContain("7");
    expect(result).toContain("2026");
  });
});
