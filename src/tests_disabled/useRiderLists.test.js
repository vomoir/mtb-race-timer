import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useRiderLists } from '../hooks/useRiderLists';
import { useRaceStore } from '../store/raceStore';
import { demoRiders } from '../utils/demoData';

describe('useRiderLists Hook with localStorage', () => {
  
  beforeEach(() => {
    // Reset the store to a known state before each test
    act(() => {
      useRaceStore.setState({
        riders: demoRiders,
        eventName: "Dungog 2026",
        trackName: "NO TRACK",
        now: new Date("2026-02-09T10:05:00.000Z").getTime() // Fixed "now" for testing
      });
    });
  });
  
  it('starts with a clean slate thanks to our setup file', () => {
    const { result } = renderHook(() => useRiderLists());
    
    // Because of our helper, this will ALWAYS be empty/default 
    // regardless of what happened in previous tests.
    expect(localStorage.getItem('eventName')).toBeNull();
  });

  it('correctly picks up a manually set event', () => {
    localStorage.setItem('eventName', 'Epic Enduro');
    
    // If your store is set up to sync with localStorage:
    const event = useRaceStore.getState().eventName;
    expect(event).toBe('Epic Enduro');
  });

  it('should only return riders for the active Event and Track', () => {
    const { result } = renderHook(() => useRiderLists());

    // In demoData, Jack Moir has an entry for Stage 2. 
    // This hook should filter him out when trackName is NO TRACK.
    const allResults = [
      ...result.current.waitingRiders,
      ...result.current.ridersOnTrack,
      ...result.current.finishedRiders
    ];

    expect(allResults.every(r => r.trackName === "NO TRACK")).toBe(true);
    expect(allResults.every(r => r.eventName === "Dungog 2026")).toBe(true);
  });

  it('should correctly categorize riders by status', () => {
    const { result } = renderHook(() => useRiderLists());

    expect(result.current.waitingRiders).toHaveLength(1); // Sam Hill
    expect(result.current.ridersOnTrack).toHaveLength(1); // Troy Brosnan
    expect(result.current.finishedRiders).toHaveLength(1); // Jack Moir (NO TRACK only)
  });

  it('should calculate elapsedTime for riders on track', () => {
    const { result } = renderHook(() => useRiderLists());
    const troy = result.current.ridersOnTrack[0];

    // Troy started 2 mins before our fixed 'now' in the demo data
    expect(troy.elapsedTime).toBeDefined();
    expect(troy.firstName).toBe("Troy");
  });

  it('should sort finished riders by duration (fastest first)', () => {
    // Inject a second finished rider to test sorting
    act(() => {
      useRaceStore.setState({
        riders: [
          ...demoRiders,
          {
            id: "slow-rider",
            riderNumber: "999",
            status: "FINISHED",
            durationMs: 999999, // Very slow
            trackName: "NO TRACK",
            eventName: "Dungog 2026"
          }
        ]
      });
    });

    const { result } = renderHook(() => useRiderLists());
    const finished = result.current.finishedRiders;

    expect(finished[0].durationMs).toBeLessThan(finished[1].durationMs);
  });
});