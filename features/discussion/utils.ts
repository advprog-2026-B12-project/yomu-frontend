const RTF = new Intl.RelativeTimeFormat("id", { numeric: "auto" });

const UNITS: Array<{ unit: Intl.RelativeTimeFormatUnit; seconds: number }> = [
  { unit: "year", seconds: 60 * 60 * 24 * 365 },
  { unit: "month", seconds: 60 * 60 * 24 * 30 },
  { unit: "week", seconds: 60 * 60 * 24 * 7 },
  { unit: "day", seconds: 60 * 60 * 24 },
  { unit: "hour", seconds: 60 * 60 },
  { unit: "minute", seconds: 60 },
  { unit: "second", seconds: 1 },
];

export function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return iso;

  const diffSeconds = Math.round((then - Date.now()) / 1000);
  const absSeconds = Math.abs(diffSeconds);

  for (const { unit, seconds } of UNITS) {
    if (absSeconds >= seconds || unit === "second") {
      const value = Math.round(diffSeconds / seconds);
      return RTF.format(value, unit);
    }
  }
  return RTF.format(diffSeconds, "second");
}

export function formatAbsoluteTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
