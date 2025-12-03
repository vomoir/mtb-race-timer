export const calculateRaceTime = (startIso, endIso) => {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const diff = end - start;

  if (diff < 0) return "00:00:00.00";

  const milliseconds = Math.floor((diff % 1000) / 10); // get centiseconds
  const seconds = Math.floor((diff / 1000) % 60);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const hours = Math.floor(diff / (1000 * 60 * 60));

  const pad = (num) => num.toString().padStart(2, "0");

  // Format: HH:MM:SS.ms
  return `${hours > 0 ? pad(hours) + ":" : ""}${pad(minutes)}:${pad(
    seconds
  )}.${pad(milliseconds)}`;
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
