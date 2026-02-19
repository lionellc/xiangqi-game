export const formatSeconds = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.max(seconds % 60, 0);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

export const clampMinutes = (value: number, min = 1, max = 180) => {
  const v = Number.isFinite(value) ? value : min;
  return Math.min(max, Math.max(min, v));
};
