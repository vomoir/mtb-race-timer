// Always return a numeric duration in ms
export const calculateRaceDuration = (startIso, endIso) => {
  if (!startIso || !endIso) return Infinity;
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  const diff = end - start;
  return diff < 0 ? Infinity : diff;
};

// Format a numeric duration into HH:MM:SS.cs
export const formatRaceTime = (diff) => {
  if (!diff || diff === Infinity) return "00:00:00.00";

  const milliseconds = Math.floor((diff % 1000) / 10); // centiseconds
  const seconds = Math.floor((diff / 1000) % 60);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const hours = Math.floor(diff / (1000 * 60 * 60));

  const pad = (num) => num.toString().padStart(2, "0");

  return `${hours > 0 ? pad(hours) + ":" : ""}${pad(minutes)}:${pad(
    seconds
  )}.${pad(milliseconds)}`;
};

export const formatTime = (dateObj) => {
  if (!dateObj) return "--:--:--";
  const d = new Date(dateObj);
  return d.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    fractionalSecondDigits: 2,
  });
};

export const saveToLocalBackup = (type, data) => {
  try {
    const key = `mtb_backup_${type}`;
    const existing = JSON.parse(localStorage.getItem(key) || "[]");
    const entry = { ...data, localTimestamp: new Date().toISOString() };
    localStorage.setItem(
      key,
      JSON.stringify([entry, ...existing].slice(0, 50))
    ); // Keep last 50
  } catch (e) {
    console.error("Local storage failed", e);
  }
};

export const getLocalBackup = (type) => {
  try {
    return JSON.parse(localStorage.getItem(`mtb_backup_${type}`) || "[]");
  } catch (e) {
    console.error(`Failed to parse local backup for ${type}:`, e);
    return [];
  }
};

export const formatDuration = (ms) => {
  if (ms === null || ms === undefined) return "--:--.--";
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const centis = Math.floor((ms % 1000) / 10);
  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}.${centis.toString().padStart(2, "0")}`;
};

export function getRiderOnTrack(ridersOnTrack, riderNumber) {
  if (!Array.isArray(ridersOnTrack)) return null;
  return ridersOnTrack.find((r) => r.riderNumber === riderNumber);
}

export const getTime = () => {
  const now = new Date();
  const nowIso = now.toLocaleTimeString("en-US", { hour12: false });
  return nowIso;
};

const timeToSeconds = (timeStr) => {
  const [hours, minutes, seconds] = timeStr.split(":").map(Number);
  return hours * 3600 + minutes * 60 + seconds;
};

export const calculateTimeDifference = (time1, time2) => {
  const diffInSeconds = Math.abs(timeToSeconds(time2) - timeToSeconds(time1));

  // Convert back to HH:MM:SS
  const h = Math.floor(diffInSeconds / 3600)
    .toString()
    .padStart(2, "0");
  const m = Math.floor((diffInSeconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const s = (diffInSeconds % 60).toString().padStart(2, "0");

  return `${h}:${m}:${s}`;
};
