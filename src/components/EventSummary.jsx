import React, {useMemo} from "react";
import { LayoutGrid, Timer, CheckCircle, AlertTriangle } from 'lucide-react';
import { useRaceStore } from "../store/raceStore";

export const EventSummary = () => {
  const { eventName, setTrack ,riders} = useRaceStore();
    const trackSummaries = useMemo(() => {
  // 1. Only look at riders belonging to this event
  const eventRiders = riders.filter(r => r.eventName === eventName);

  // 2. Group by trackName
  const summary = eventRiders.reduce((acc, rider) => {
    const track = rider.trackName || "Unassigned";
    if (!acc[track]) {
      acc[track] = { total: 0, finished: 0, onTrack: 0, dns: 0, dnf: 0 };
    }
    
    acc[track].total++;
    if (rider.status === "FINISHED") acc[track].finished++;
    if (rider.status === "ON_TRACK") acc[track].onTrack++;
    if (rider.status === "DNS") acc[track].dns++;
    if (rider.status === "DNF") acc[track].dnf++;
    
    return acc;
  }, {});

  return summary;
}, [riders, eventName]);

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <LayoutGrid className="text-orange-500" size={24} />
        <h2 className="text-xl font-bold text-slate-800">Event Overview: {eventName}</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(trackSummaries).map(([track, stats]) => (
          <div 
            key={track}
            onClick={() => setTrack(track)}
            className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-orange-500 cursor-pointer transition-all"
          >
            <h3 className="text-lg font-black uppercase text-slate-900 border-b pb-2 mb-3">
              {track}
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Finished</span>
                <span className="text-xl font-mono text-emerald-600">{stats.finished} / {stats.total}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 uppercase font-bold">On Track</span>
                <span className="text-xl font-mono text-blue-500">{stats.onTrack}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 uppercase font-bold">DNF/DNS</span>
                <span className="text-sm font-mono text-slate-400">{stats.dnf} / {stats.dns}</span>
              </div>
            </div>
            
            {stats.onTrack > 0 && (
              <div className="mt-3 flex items-center gap-2 text-xs text-orange-600 bg-orange-50 p-2 rounded">
                <Timer size={14} className="animate-pulse" />
                <span>Race currently in progress</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};