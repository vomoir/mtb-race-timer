// hooks/useRiderLists.js
import { useMemo } from "react";
import { useRaceStore } from "../store/raceStore";
import { calculateTimeDifference } from "../utils/utils";

export function useRiderLists() {
  const riders = useRaceStore((state) => state.riders ?? []);
  const activeRaceId = useRaceStore((state) => state.activeRaceId);
  const now = useRaceStore((state) => state.now); // Subscribe to live 'now' from store

  const currentTrackRiders = useMemo(() => {
    return riders.filter(r => r.raceId === activeRaceId);
  }, [riders, activeRaceId]);

  const ridersOnTrack = useMemo(() => {
    return currentTrackRiders
      .filter((r) => r.status === "ON_TRACK")
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
      .map((r) => ({
        ...r,
        elapsedTime: calculateTimeDifference(r.startTime, now)
      }));
  }, [currentTrackRiders, now]);

  const finishedRiders = useMemo(() => {
    return currentTrackRiders
      .filter((r) => r.status === "FINISHED")
      .sort((a, b) => (a.durationMs || 0) - (b.durationMs || 0));
  }, [currentTrackRiders]);

  const waitingRiders = useMemo(() => {
    return currentTrackRiders.filter((r) => r.status === "WAITING");
  }, [currentTrackRiders]);

  return { ridersOnTrack, finishedRiders, waitingRiders };
}
