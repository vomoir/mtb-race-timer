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

export const formatTime = (dateObj) => {
  // if ("serviceWorker" in navigator) {
  //   window.addEventListener("load", () => {
  //     navigator.serviceWorker
  //       .register("/service-worker.js")
  //       .then((reg) => console.log("Service Worker Registered"))
  //       .catch((err) => console.log("Service Worker Failed", err));
  //   });
  // }
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
