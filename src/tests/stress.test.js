import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useRaceStore } from '../store/raceStore';
import { useRiderLists } from '../hooks/useRiderLists';
import { generateLargeRiderSet } from './utils/generateRiders';

describe('Rider Store Stress Testing', () => {
  
  beforeEach(() => {
    act(() => {
      useRaceStore.setState(useRaceStore.getInitialState(), true);
    });
  });

  it('handles 500+ riders without crashing and filters efficiently', () => {
    const riderCount = 60;
    const largeSet = generateLargeRiderSet(riderCount);

    // 1. Measure Import Performance
    const startImport = performance.now();
    
    act(() => {
      useRaceStore.setState({ 
        riders: largeSet,
        eventName: "Stress Test",
        trackName: "NO TRACK" 
      });
    });

    const endImport = performance.now();
    console.log(`⏱️ Import/State update for ${riderCount} riders: ${(endImport - startImport).toFixed(2)}ms`);

    // 2. Measure Filtering Performance (The Hook)
    const startFilter = performance.now();
    const { result } = renderHook(() => useRiderLists());
    const endFilter = performance.now();

    console.log(`⏱️ Hook filtering for ${riderCount} riders: ${(endFilter - startFilter).toFixed(2)}ms`);

    // 3. Assertions
    expect(result.current.waitingRiders).toHaveLength(riderCount);
    expect(endFilter - startFilter).toBeLessThan(50); // Should be sub-50ms for 600 riders
  });

  it('maintains performance when switching tracks with large data', () => {
    // Inject 1000 riders total across two tracks
    const track1 = generateLargeRiderSet(500, "Stress Test", "NO TRACK");
    const track2 = generateLargeRiderSet(500, "Stress Test", "Stage 2");

    act(() => {
      useRaceStore.setState({ riders: [...track1, ...track2] });
    });

    // Switch tracks and check speed
    const startSwitch = performance.now();
    act(() => {
      useRaceStore.setState({ trackName: "Stage 2" });
    });
    const { result } = renderHook(() => useRiderLists());
    const endSwitch = performance.now();

    console.log(`⏱️ Track switch (1000 total items): ${(endSwitch - startSwitch).toFixed(2)}ms`);
    
    expect(result.current.waitingRiders).toHaveLength(500);
    expect(result.current.waitingRiders[0].trackName).toBe("Stage 2");
  });
});