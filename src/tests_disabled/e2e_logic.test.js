import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useRaceStore } from '../store/raceStore';
import { demoRiders } from '../utils/demoData';

// Mock Firebase
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDocs: vi.fn(() => Promise.resolve({ empty: true, docs: [] })),
  setDoc: vi.fn(() => Promise.resolve()),
  updateDoc: vi.fn(() => Promise.resolve()),
  deleteDoc: vi.fn(() => Promise.resolve()),
  onSnapshot: vi.fn(() => vi.fn()),
  query: vi.fn(),
  where: vi.fn(),
  writeBatch: vi.fn(() => ({
    set: vi.fn(),
    delete: vi.fn(),
    commit: vi.fn(() => Promise.resolve())
  })),
  serverTimestamp: vi.fn(() => 'mock-timestamp')
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  onAuthStateChanged: vi.fn((auth, cb) => {
    cb({ uid: 'test-user' });
    return vi.fn();
  }),
  signInAnonymously: vi.fn(() => Promise.resolve()),
  signOut: vi.fn(() => Promise.resolve()),
  setPersistence: vi.fn(() => Promise.resolve()),
  browserLocalPersistence: 'local'
}));

vi.mock('../modules/firebase', () => ({
  db: {},
  auth: {}
}));

describe('MTB Race Timer - E2E Logic (Store)', () => {
  beforeEach(() => {
    // Clear state
    useRaceStore.setState({
      eventName: "",
      trackName: "NO TRACK",
      tracks: [],
      riders: [],
      activeRaceId: "",
      loading: false
    });
    localStorage.clear();
  });

  it('Flow: Create Event -> Import Riders -> Start Race -> Finish Race -> Results', async () => {
    const store = useRaceStore.getState();

    // 1. Create Event
    await useRaceStore.getState().createEventWithTracks("Championships 2026");
    expect(useRaceStore.getState().eventName).toBe("Championships 2026");
    expect(useRaceStore.getState().tracks.length).toBeGreaterThan(0);
    expect(localStorage.getItem('eventName')).toBe("Championships 2026");

    // 2. Import Demo Data
    // We simulate the import process as done in the UI
    await useRaceStore.getState().importRidersToDb(demoRiders);
    // In our logic, import adds them to the database. We simulate the state update that would follow via fetch/subscription
    useRaceStore.setState({ riders: demoRiders.map(r => ({...r, raceId: useRaceStore.getState().activeRaceId})) });
    
    expect(useRaceStore.getState().riders.length).toBeGreaterThan(0);
    const firstRiderNum = demoRiders[0].riderNumber;

    // 3. Start a Race (Recording a Start)
    await useRaceStore.getState().handleStart(firstRiderNum);
    const startedRider = useRaceStore.getState().riders.find(r => r.riderNumber === firstRiderNum);
    expect(startedRider.status).toBe("ON_TRACK");
    expect(startedRider.startTimeMs).toBeDefined();

    // 4. Record a Finish
    // Simulate time passing (manual update for test)
    const riderToFinish = { ...startedRider, startTimeMs: Date.now() - 120000 }; // 2 mins ago
    await useRaceStore.getState().handleFinish(riderToFinish);

    const finishedRider = useRaceStore.getState().riders.find(r => r.riderNumber === firstRiderNum);
    expect(finishedRider.status).toBe("FINISHED");
    expect(finishedRider.durationMs).toBeGreaterThanOrEqual(120000);
    expect(finishedRider.raceTime).toBeDefined();

    // 5. Output Results (Verify they are sorted)
    // Add a second, faster rider
    const fastRider = { 
        id: "fast-1", 
        riderNumber: "1", 
        status: "FINISHED", 
        durationMs: 60000, 
        raceId: useRaceStore.getState().activeRaceId 
    };
    useRaceStore.setState({ 
        riders: [...useRaceStore.getState().riders, fastRider] 
    });

    // We can't test useRiderLists hook here easily, but we verify the logic 
    // that a component would use to display results
    const results = useRaceStore.getState().riders
        .filter(r => r.status === "FINISHED")
        .sort((a, b) => a.durationMs - b.durationMs);

    expect(results[0].riderNumber).toBe("1"); // Faster rider should be first
    expect(results[1].riderNumber).toBe(firstRiderNum);
  });
});
