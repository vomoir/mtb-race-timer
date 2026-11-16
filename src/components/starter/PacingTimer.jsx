import React, { useState, useMemo, useSyncExternalStore } from "react";
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
  const resetPacingTimer = useRaceStore((state) => state.resetPacingTimer);

  const [manuallyResetAt, setManuallyResetAt] = useState(0);

  const now = useSyncExternalStore(
    clockStore.subscribe,
    clockStore.getSnapshot,
    clockStore.getServerSnapshot
  );

  // Riders on current track
  const currentTrackRiders = useMemo(() => {
    return (riders || []).filter((r) => r.raceId === activeRaceId);
  }, [riders, activeRaceId]);

  const waitingCount = useMemo(() => {
    return currentTrackRiders.filter((r) => r.status === "WAITING").length;
  }, [currentTrackRiders]);

  const startedCount = useMemo(() => {
    return currentTrackRiders.filter(
      (r) => r.status === "ON_TRACK" || r.status === "FINISHED" || r.startTimeMs
    ).length;
  }, [currentTrackRiders]);

  // When all waiting riders have been released on this track
  const isAllReleased = startedCount > 0 && waitingCount === 0;

  // Determine the timestamp when the most recent rider was started on THIS track
  const lastStartTime = useMemo(() => {
    // If the last rider has been released, reset the timer
    if (isAllReleased) {
      return null;
    }

    const isCurrentTrackLastStarted =
      lastStarted && (!lastStarted.raceId || lastStarted.raceId === activeRaceId);

    let candidateTime = null;

    if (isCurrentTrackLastStarted) {
      if (lastStarted?.timestamp) candidateTime = lastStarted.timestamp;
      else if (lastStarted?.timeMs) candidateTime = lastStarted.timeMs;
      else if (lastStarted?.time) {
        candidateTime = timeStringToMs(lastStarted.time);
      }
    }

    // Fallback: Check if any riders on the active track have started
    if (!candidateTime) {
      const startedOnTrack = currentTrackRiders.filter((r) => r.startTimeMs);
      if (startedOnTrack.length > 0) {
        candidateTime = Math.max(...startedOnTrack.map((r) => r.startTimeMs));
      }
    }

    // If candidate start time occurred before a manual reset, suppress it
    if (candidateTime && candidateTime <= manuallyResetAt) {
      return null;
    }

    return candidateTime;
  }, [isAllReleased, lastStarted, activeRaceId, currentTrackRiders, manuallyResetAt]);

  const handleManualReset = () => {
    setManuallyResetAt(Date.now());
    if (typeof resetPacingTimer === "function") {
      resetPacingTimer();
    }
  };

  const elapsedSeconds = lastStartTime
    ? Math.max(0, Math.floor((now - lastStartTime) / 1000))
    : null;

  return (
    <div
      data-testid="pacing-timer"
      className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200 text-center"
    >
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
        {isAllReleased ? "All Riders Released" : "Seconds Since Last Rider"}
      </span>
      <div
        data-testid="pacing-timer-seconds"
        className="text-5xl sm:text-6xl font-mono font-bold text-slate-800"
      >
        {elapsedSeconds !== null ? `${elapsedSeconds}s` : "--"}
      </div>
      {elapsedSeconds !== null && (
        <button
          type="button"
          data-testid="pacing-timer-reset"
          onClick={handleManualReset}
          className="mt-2 text-xs text-slate-400 hover:text-slate-600 underline transition-colors cursor-pointer"
        >
          Reset Timer
        </button>
      )}
    </div>
  );
};

export default PacingTimer;
