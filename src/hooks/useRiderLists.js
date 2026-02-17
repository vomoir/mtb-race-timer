// hooks/useRiderLists.js
import { useMemo } from "react";
import { useRaceStore } from "../store/raceStore";
import { calculateTimeDifference, getTime } from "../utils/utils";

export function useRiderLists() {
  // 1. Grab everything needed from the store
  // Adding '|| []' is the "Safety Net" that prevents the .filter error
  const riders = useRaceStore((state) => state.riders ?? []);
  // const trackName = useRaceStore((state) => state.trackName);
  // const eventName = useRaceStore((state) => state.eventName);
  const activeRaceId = useRaceStore((state) => state.activeRaceId);
  const now = getTime(); // Assuming getTime returns a string like "HH:MM:SS"

  // 2. CREATE THE BASE FILTER
  // This ensures we only look at riders for the CURRENT track
  const currentTrackRiders = useMemo(() => {
    return riders.filter(r => 
      r.raceId === activeRaceId
    );
  }, [riders, activeRaceId]);

  // 3. DERIVE THE LISTS FROM THE BASE FILTER
  const ridersOnTrack = useMemo(() => {
    return currentTrackRiders
      .filter((r) => r.status === "ON_TRACK")
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
      .map((r) => ({
        ...r,
        // Using your existing calculation logic
        elapsedTime: typeof calculateTimeDifference === 'function' 
          ? calculateTimeDifference(r.startTime, now) 
          : "00:00"
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