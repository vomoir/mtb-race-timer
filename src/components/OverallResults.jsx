import React, { useMemo, useState, useEffect } from "react";
import { Trophy, Medal } from "lucide-react";
import { useRaceStore } from "../store/raceStore";
import { formatDuration } from "../utils/utils";

export const OverallResults = () => {
  const { eventName, fetchEventResults } = useRaceStore();
  const [allRiders, setAllRiders] = useState([]);
  
  useEffect(() => {
    const loadResults = async () => {
      if (eventName) {
        const results = await fetchEventResults(eventName);
        setAllRiders(results);
      }
    };
    loadResults();
  }, [eventName, fetchEventResults]);

  const overallData = useMemo(() => {
    if (!allRiders.length) return { stageWinners: [], categoryStandings: {} };
    
    const eventRiders = allRiders.filter(r => r.eventName === eventName && r.status === "FINISHED");

    // --- 1. Stage Winners (Fastest per Track) ---
    const tracks = [...new Set(eventRiders.map(r => r.trackName))];
    const stageWinners = tracks.map(track => {
      const trackFinishers = eventRiders.filter(r => r.trackName === track);
      if (trackFinishers.length === 0) return null;
      const fastest = trackFinishers.reduce((prev, curr) => 
        (prev.durationMs < curr.durationMs) ? prev : curr
      );
      return { track, ...fastest };
    }).filter(Boolean);

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
      categoryStandings[cat].sort((a, b) => {
        // Sort by most stages completed first, then fastest total time
        if (b.stagesCount !== a.stagesCount) return b.stagesCount - a.stagesCount;
        return a.totalMs - b.totalMs;
      });
    });

    return { stageWinners, categoryStandings };
  }, [allRiders, eventName]);

  if (!overallData.categoryStandings || Object.keys(overallData.categoryStandings).length === 0) {
    return null;
  }

  return (
    <div className="space-y-8 mt-12">
      
      {/* Stage Winners Section */}
      {overallData.stageWinners.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-black italic text-slate-900 uppercase mb-4 flex items-center gap-2">
            <Medal className="text-orange-500" /> Stage Winners
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {overallData.stageWinners.map(winner => (
              <div key={winner.track} className="bg-white p-4 rounded-xl border-l-4 border-orange-500 shadow-sm">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{winner.track}</span>
                  <Trophy size={14} className="text-yellow-500" />
                </div>
                <div className="font-bold text-slate-800">{winner.firstName} {winner.lastName}</div>
                <div className="flex justify-between items-end mt-2">
                  <span className="text-xs text-slate-500">{winner.category}</span>
                  <span className="font-mono font-bold text-lg text-slate-900">{winner.raceTime}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Overall Standings Section */}
      <div>
        <h2 className="text-2xl font-black italic text-slate-900 uppercase mb-6">Overall Event Standings</h2>
        <div className="grid gap-8">
          {Object.entries(overallData.categoryStandings).sort().map(([category, standings]) => (
            <div key={category} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex justify-between items-center">
                <h3 className="font-bold text-slate-700 uppercase tracking-wide">{category}</h3>
                <span className="text-xs font-bold text-slate-400 bg-slate-200 px-2 py-1 rounded-full">{standings.length} Riders</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50/50 text-slate-500 font-medium border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-3 w-16">Rank</th>
                      <th className="px-6 py-3">Rider</th>
                      <th className="px-6 py-3 text-center">Stages</th>
                      <th className="px-6 py-3 text-right">Total Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {standings.map((rider, index) => (
                      <tr key={rider.riderNumber} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-3">
                          {index === 0 ? (
                            <Trophy size={16} className="text-yellow-500 fill-yellow-500" />
                          ) : (
                            <span className="font-bold text-slate-400 ml-1">{index + 1}</span>
                          )}
                        </td>
                        <td className="px-6 py-3">
                          <div className="font-bold text-slate-800">{rider.name}</div>
                          <div className="text-xs text-slate-400">#{rider.riderNumber}</div>
                        </td>
                        <td className="px-6 py-3 text-center">
                          <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded font-mono text-xs font-bold">
                            {rider.stagesCount}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-right font-mono font-bold text-slate-900">
                          {formatDuration(rider.totalMs)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};