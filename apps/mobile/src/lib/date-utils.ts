import { formatRelativeTimestamp } from "@/lib/format";

export function formatRelativeTime(value: Date | string) {
  return formatRelativeTimestamp(
    value instanceof Date ? value.toISOString() : value
  );
}

export function formatTime(value: Date | string) {
  const timestamp = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(timestamp.getTime())) {
    return String(value);
  }

  return timestamp.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}
