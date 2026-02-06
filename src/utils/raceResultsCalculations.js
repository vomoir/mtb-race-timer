import { useRaceStore } from "../store/raceStore";

export const overallData = useMemo(() => {
  const eventRiders = riders.filter(r => r.eventName === eventName && r.status === "FINISHED");

  // --- 1. Stage Winners (Fastest per Track) ---
  const tracks = [...new Set(eventRiders.map(r => r.trackName))];
  const stageWinners = tracks.map(track => {
    const trackFinishers = eventRiders.filter(r => r.trackName === track);
    const fastest = trackFinishers.reduce((prev, curr) => 
      (prev.durationMs < curr.durationMs) ? prev : curr
    );
    return { track, ...fastest };
  });

  // --- 2. Overall GC (Summed per Rider) ---
  const riderMap = {}; // Key: firstName+lastName+category (or riderNumber)
  
  eventRiders.forEach(r => {
    const key = `${r.riderNumber}-${r.category}`;
    if (!riderMap[key]) {
      riderMap[key] = { 
        name: `${r.firstName} ${r.lastName}`, 
        riderNumber: r.riderNumber,
        category: r.category, 
        totalMs: 0, 
        stagesCount: 0 
      };
    }
    riderMap[key].totalMs += r.durationMs;
    riderMap[key].stagesCount += 1;
  });

  // Group by Category and Sort
  const categoryStandings = {};
  Object.values(riderMap).forEach(rider => {
    if (!categoryStandings[rider.category]) categoryStandings[rider.category] = [];
    categoryStandings[rider.category].push(rider);
  });

  Object.keys(categoryStandings).forEach(cat => {
    categoryStandings[cat].sort((a, b) => a.totalMs - b.totalMs);
  });

  return { stageWinners, categoryStandings };
}, [riders, eventName]);