// test/utils/generateRiders.js
export const generateLargeRiderSet = (count = 500, event = "Stress Test", track = "NO TRACK") => {
  return Array.from({ length: count }, (_, i) => ({
    id: `stress-rider-${i}`,
    riderNumber: (i + 1).toString(),
    firstName: `Rider`,
    lastName: `${i}`,
    category: i % 2 === 0 ? "Elite" : "Junior",
    eventName: event,
    trackName: track,
    status: "WAITING",
    startTime: null,
    finishTime: null,
    durationMs: 0,
    raceTime: "--:--:--"
  }));
};