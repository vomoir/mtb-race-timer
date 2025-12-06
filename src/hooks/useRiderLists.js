// hooks/useRiderLists.js
import { useMemo } from "react";
import { useRaceStore } from "../store/raceStore";

export function useRiderLists() {
  const { riders, now } = useRaceStore();

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
    return riders
      .filter((r) => r.status === "FINISHED")
      .sort((a, b) => new Date(b.finishTime) - new Date(a.finishTime));
  }, [riders]);

  return { ridersOnTrack, finishedRiders };
}

function formatElapsed(startTime, now) {
  if (!startTime) return null;
  const diffMs = now - new Date(startTime);
  const minutes = Math.floor(diffMs / 60000);
  const seconds = Math.floor((diffMs % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}
