import React, { useState, useEffect } from 'react';
import { useRaceStore } from '../store/raceStore';

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
    <>
      <div className="sm:hidden text-orange-400 font-mono text-xl font-bold bg-slate-800 px-4 py-1 rounded-full border border-slate-700 shadow-inner">
        {elapsed}
      </div>
      <div className="hidden sm:flex bg-slate-900 text-orange-500 font-mono text-xl sm:text-3xl px-3 py-1 sm:px-4 sm:py-2 rounded-lg border-2 border-orange-500/30 shadow-[0_0_15px_rgba(255,69,0,0.2)] flex-col items-center">
        <span className="text-[8px] sm:text-[10px] uppercase tracking-widest text-slate-400">Race Time</span>
        {elapsed}
      </div>
    </>
  );
};