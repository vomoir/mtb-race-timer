import React, { useMemo} from "react";
import { useRaceStore } from "../store/raceStore";
import {convertMsToMinSec} from "../utils/raceResultsCalculations";
export const OverallResults = () => {
  const { riders, eventName } = useRaceStore();
  const overallData = useMemo(() => {
    if (!riders.length) return { stageWinners: [], categoryStandings: {} };
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
return (
    <div>
      <h2>Overall Standings</h2>
      {/* Map through overallData.categoryStandings here */}
      {overallData.categoryStandings && Object.entries(overallData.categoryStandings).map(([category, standings]) => (
        <div key={category}>
          <h3>{category}</h3>
          <ul>
            {standings.map((rider, index) => (
              <li key={rider.riderNumber}>{index + 1}. {rider.name} ({convertMsToMinSec(rider.totalMs)})</li>
            ))}
          </ul>
        </div>
      ))}

      <h2>Stage Winners</h2>
      {overallData.stageWinners && overallData.stageWinners.map(winner => (
        <div key={winner.track}>
          <p>{winner.track}: {winner.firstName} {winner.lastName}</p>
        </div>
      ))}
      

    </div>
  )
};