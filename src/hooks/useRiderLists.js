// hooks/useRiderLists.js
import { useMemo } from "react";
import { useRaceStore } from "../store/raceStore";

export function useRiderLists() {
  const riders = useRaceStore((state) => state.riders);
  const now = useRaceStore((state) => state.now);

  const ridersOnTrack = useMemo(() => {
    return riders
      .filter((r) => r.status === "ON_TRACK")
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
      .map((r) => ({
        ...r,
        elapsedTime: formatElapsed(r.startTime, now),
      }));
  }, [riders, now]);

  const finishedRiders = useMemo(() => {
    return (
      riders
        .filter((r) => r.status === "FINISHED")
        // .sort((a, b) => new Date(a.totalTime) - new Date(b.totalTime));
        .sort((a, b) => a.totalTime - b.totalTime)
    );
  }, [riders]);

  const waitingRiders = useMemo(() => {
    // console.log(`In waitingRiders ${!Array.isArray(riders)}`);
    // console.log("Riders type:", typeof riders, riders);

    if (!Array.isArray(riders)) {
      console.warn("Riders state is not an array!", riders);
      return [];
    }
    console.log("\nWaiting Riders Store state:", useRaceStore.getState());
    return riders.filter((r) => r.status === "WAITING");
  }, [riders]);

  return { ridersOnTrack, finishedRiders, waitingRiders };
}

function formatElapsed(startTime, now) {
  if (!startTime) return null;
  const start = new Date(startTime);
  const diffMs = now - start;

  // Prevent negative time if clock skew
  if (diffMs < 0) return "0m 0s";

  const minutes = Math.floor(diffMs / 60000);
  const seconds = Math.floor((diffMs % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}
