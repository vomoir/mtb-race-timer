import React, { useMemo, useSyncExternalStore } from "react";
import { useRaceStore } from "../../store/raceStore";
import { timeStringToMs } from "../../utils/utils";

const clockStore = {
  subscribe(callback) {
    const interval = setInterval(callback, 500);
    return () => clearInterval(interval);
  },
  getSnapshot() {
    return Date.now();
  },
  getServerSnapshot() {
    return 0;
  },
};

export const PacingTimer = () => {
  const lastStarted = useRaceStore((state) => state.lastStarted);
  const riders = useRaceStore((state) => state.riders);
  const activeRaceId = useRaceStore((state) => state.activeRaceId);

  const now = useSyncExternalStore(
    clockStore.subscribe,
    clockStore.getSnapshot,
    clockStore.getServerSnapshot
  );

  // Determine the timestamp when the most recent rider was started
  const lastStartTime = useMemo(() => {
    if (lastStarted?.timestamp) return lastStarted.timestamp;
    if (lastStarted?.timeMs) return lastStarted.timeMs;
    if (lastStarted?.time) {
      const ms = timeStringToMs(lastStarted.time);
      if (ms) return ms;
    }
    // Fallback: Check if any riders on the active track have started
    const startedOnTrack = (riders || []).filter(
      (r) => r.raceId === activeRaceId && r.startTimeMs
    );
    if (startedOnTrack.length > 0) {
      return Math.max(...startedOnTrack.map((r) => r.startTimeMs));
    }
    return null;
  }, [lastStarted, riders, activeRaceId]);

  const elapsedSeconds = lastStartTime
    ? Math.max(0, Math.floor((now - lastStartTime) / 1000))
    : null;

  return (
    <div
      data-testid="pacing-timer"
      className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200 text-center"
    >
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
        Seconds Since Last Rider
      </span>
      <div
        data-testid="pacing-timer-seconds"
        className="text-5xl sm:text-6xl font-mono font-bold text-slate-800"
      >
        {elapsedSeconds !== null ? `${elapsedSeconds}s` : "--"}
      </div>
    </div>
  );
};

export default PacingTimer;
