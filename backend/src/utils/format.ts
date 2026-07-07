export function formatDuration(seconds: number | null | undefined): string | null {
  if (seconds == null || Number.isNaN(seconds)) return null;
  const total = Math.round(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

export function estimateSizeBytes(
  bitrateKbps: number | null | undefined,
  durationSeconds: number | null | undefined,
): number | null {
  if (!bitrateKbps || !durationSeconds) return null;
  return Math.round((bitrateKbps * 1000 * durationSeconds) / 8);
}

const HEIGHT_LADDER = [144, 240, 360, 480, 720, 1080, 1440, 2160];

export function nearestStandardHeight(height: number | null | undefined): number | null {
  if (!height) return null;
  return HEIGHT_LADDER.reduce((closest, step) =>
    Math.abs(step - height) < Math.abs(closest - height) ? step : closest,
  );
}

export { HEIGHT_LADDER };
