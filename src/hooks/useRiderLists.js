// hooks/useRiderLists.js
import { useMemo } from "react";
import { useRaceStore } from "../store/raceStore";
import { calculateTimeDifference, getTime } from "../utils/utils";

export function useRiderLists() {
  // 1. Grab everything needed from the store
  // Adding '|| []' is the "Safety Net" that prevents the .filter error
  const riders = useRaceStore((state) => state.riders ?? []);
  const tracks = useRaceStore((state) => state.tracks ?? []);
  const trackName = useRaceStore((state) => state.trackName);
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
    const currentWaiting = currentTrackRiders.filter((r) => r.status === "WAITING");
    if (currentWaiting.length === 0) return [];
    
    const currentTrackIndex = tracks.indexOf(trackName);
    
    // If it's the first track or track not found, just sort by rider number
    if (currentTrackIndex <= 0) {
      return [...currentWaiting].sort((a, b) => Number(a.riderNumber) - Number(b.riderNumber));
    }
    
    const previousTracks = tracks.slice(0, currentTrackIndex);
    
    // Pre-calculate stats for all riders for faster sorting
    const riderStats = {};
    riders.forEach(r => {
      if (previousTracks.includes(r.trackName) && r.status === "FINISHED") {
        if (!riderStats[r.riderNumber]) {
          riderStats[r.riderNumber] = { stagesCount: 0, totalMs: 0 };
        }
        riderStats[r.riderNumber].stagesCount += 1;
        riderStats[r.riderNumber].totalMs += (r.durationMs || 0);
      }
    });

    return [...currentWaiting].sort((a, b) => {
      const statsA = riderStats[a.riderNumber] || { stagesCount: 0, totalMs: Infinity };
      const statsB = riderStats[b.riderNumber] || { stagesCount: 0, totalMs: Infinity };

      // 1. Sort by most stages completed first
      if (statsB.stagesCount !== statsA.stagesCount) {
        return statsB.stagesCount - statsA.stagesCount;
      }
      
      // 2. Then by fastest total time
      if (statsA.totalMs !== statsB.totalMs) {
        return statsA.totalMs - statsB.totalMs;
      }

      // 3. Fallback to rider number
      return Number(a.riderNumber) - Number(b.riderNumber);
    });
  }, [currentTrackRiders, riders, tracks, trackName]);

  return { ridersOnTrack, finishedRiders, waitingRiders };
}