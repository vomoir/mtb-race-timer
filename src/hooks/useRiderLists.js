// hooks/useRiderLists.js
import { useMemo } from "react";
import { useRaceStore } from "../store/raceStore";
import { calculateTimeDifference, getTime } from "../utils/utils";

export const useRiderLists = (riders) => {
  const activeRaceId = useRaceStore((state) => state.activeRaceId);

  const finishedRiders = useMemo(() => {
    return riders
      .filter((r) => 
        r.status === "FINISHED" && 
        r.raceId === activeRaceId // Only show riders for the selected session
      )
      .sort((a, b) => (a.durationMs || 0) - (b.durationMs || 0));
  }, [riders, activeRaceId]);

  const ridersOnTrack = useMemo(() => {
    return riders.filter((r) => 
      r.status === "ON_TRACK" && 
      r.raceId === activeRaceId
    );
  }, [riders, activeRaceId]);

  return { finishedRiders, ridersOnTrack };
};

export function useRiderListsCurrent() {
  const riders = useRaceStore((state) => state.riders);
  const now = getTime();

  const ridersOnTrack = useMemo(() => {
    return riders
      .filter((r) => r.status === "ON_TRACK")
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
      .map((r) => ({
        ...r,
        elapsedTime: calculateTimeDifference(r.startTime, now),
      }));
  }, [riders, now]);

  const finishedRiders = useMemo(() => {
    return riders
      .filter((r) => r.status === "FINISHED")
      .sort((a, b) => {
        // Use the raw millisecond number, not the string
        return (a.durationMs || 0) - (b.durationMs || 0);
      });
  }, [riders]);

  const waitingRiders = useMemo(() => {
    if (!Array.isArray(riders)) {
      console.warn("Riders state is not an array!", riders);
      return [];
    }
    console.log("\nWaiting Riders Store state:", useRaceStore.getState());
    return riders.filter((r) => r.status === "WAITING");
  }, [riders]);

  return { ridersOnTrack, finishedRiders, waitingRiders };
}

// function formatElapsed(startTime, now) {
//   if (!startTime) return null;
//   const start = new Date(startTime);
//   const diffMs = now - start;

//   // Prevent negative time if clock skew
//   if (diffMs < 0) return "0m 0s";

//   const minutes = Math.floor(diffMs / 60000);
//   const seconds = Math.floor((diffMs % 60000) / 1000);
//   return `${minutes}m ${seconds}s`;
// }
