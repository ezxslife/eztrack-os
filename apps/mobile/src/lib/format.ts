type RelativeUnit = "minute" | "hour" | "day";

const relativeFormatter =
  typeof Intl !== "undefined" && typeof Intl.RelativeTimeFormat === "function"
    ? new Intl.RelativeTimeFormat("en", { numeric: "auto" })
    : null;

const shortDateFormatter =
  typeof Intl !== "undefined" && typeof Intl.DateTimeFormat === "function"
    ? new Intl.DateTimeFormat("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : null;

function formatRelativeFallback(value: number, unit: RelativeUnit) {
  if (value === 0) {
    return `this ${unit}`;
  }

  const absoluteValue = Math.abs(value);
  const label = absoluteValue === 1 ? unit : `${unit}s`;

  if (value > 0) {
    return `in ${absoluteValue} ${label}`;
  }

  return `${absoluteValue} ${label} ago`;
}

function formatRelative(value: number, unit: RelativeUnit) {
  if (relativeFormatter) {
    return relativeFormatter.format(value, unit);
  }

  return formatRelativeFallback(value, unit);
}

function formatShortDate(value: Date) {
  if (shortDateFormatter) {
    return shortDateFormatter.format(value);
  }

  return value.toLocaleString("en-US");
}

export function formatDate(value: Date | string) {
  const timestamp = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(timestamp.getTime())) {
    return String(value);
  }

  return formatShortDate(timestamp);
}

export function formatRelativeTimestamp(value: string) {
  const timestamp = new Date(value);

  if (Number.isNaN(timestamp.getTime())) {
    return value;
  }

  const deltaMs = timestamp.getTime() - Date.now();
  const deltaMinutes = Math.round(deltaMs / 60000);
  const absoluteMinutes = Math.abs(deltaMinutes);

  if (absoluteMinutes < 60) {
    return formatRelative(deltaMinutes, "minute");
  }

  const deltaHours = Math.round(deltaMinutes / 60);
  const absoluteHours = Math.abs(deltaHours);

  if (absoluteHours < 24) {
    return formatRelative(deltaHours, "hour");
  }

  const deltaDays = Math.round(deltaHours / 24);

  if (Math.abs(deltaDays) < 7) {
    return formatRelative(deltaDays, "day");
  }

  return formatShortDate(timestamp);
}

export function formatShortDateTime(value: string) {
  const timestamp = new Date(value);

  if (Number.isNaN(timestamp.getTime())) {
    return value;
  }

  return formatShortDate(timestamp);
}

export function formatCurrency(amount: number) {
  if (typeof Intl !== "undefined" && typeof Intl.NumberFormat === "function") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(amount);
  }

  return `$${amount.toFixed(2)}`;
}
