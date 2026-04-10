const relativeFormatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
const shortDateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function formatRelativeTimestamp(value: string) {
  const timestamp = new Date(value);

  if (Number.isNaN(timestamp.getTime())) {
    return value;
  }

  const deltaMs = timestamp.getTime() - Date.now();
  const deltaMinutes = Math.round(deltaMs / 60000);
  const absoluteMinutes = Math.abs(deltaMinutes);

  if (absoluteMinutes < 60) {
    return relativeFormatter.format(deltaMinutes, "minute");
  }

  const deltaHours = Math.round(deltaMinutes / 60);
  const absoluteHours = Math.abs(deltaHours);

  if (absoluteHours < 24) {
    return relativeFormatter.format(deltaHours, "hour");
  }

  const deltaDays = Math.round(deltaHours / 24);

  if (Math.abs(deltaDays) < 7) {
    return relativeFormatter.format(deltaDays, "day");
  }

  return shortDateFormatter.format(timestamp);
}

export function formatShortDateTime(value: string) {
  const timestamp = new Date(value);

  if (Number.isNaN(timestamp.getTime())) {
    return value;
  }

  return shortDateFormatter.format(timestamp);
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(amount);
}
