import React, { useState, useEffect } from 'react';
import { useRaceStore } from '../store/useRaceStore';

export const RaceClock = () => {
  const { riders, activeRaceId } = useRaceStore();
  const [elapsed, setElapsed] = useState("00:00:00");

  useEffect(() => {
    const interval = setInterval(() => {
      // Find the very first person who started today
      const startTimes = riders
        .filter(r => r.raceId === activeRaceId && r.startTimeMs)
        .map(r => r.startTimeMs);

      if (startTimes.length === 0) {
        setElapsed("00:00:00");
        return;
      }

      const firstStart = Math.min(...startTimes);
      const now = Date.now();
      const diff = now - firstStart;

      // Format to HH:MM:SS
      const h = Math.floor(diff / 3600000).toString().padStart(2, '0');
      const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
      const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
      
      setElapsed(`${h}:${m}:${s}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [riders, activeRaceId]);

  return (
    <div className="bg-slate-900 text-orange-500 font-mono text-3xl px-4 py-2 rounded-lg border-2 border-orange-500/30 shadow-[0_0_15px_rgba(255,69,0,0.2)] flex flex-col items-center">
      <span className="text-[10px] uppercase tracking-widest text-slate-400">Race Time</span>
      {elapsed}
    </div>
  );
};