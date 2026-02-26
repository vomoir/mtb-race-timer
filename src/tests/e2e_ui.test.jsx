import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import { useRaceStore } from '../store/raceStore';

// Mock Firebase
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(), doc: vi.fn(), getDocs: vi.fn(() => Promise.resolve({ empty: true, docs: [] })),
  setDoc: vi.fn(() => Promise.resolve()), updateDoc: vi.fn(() => Promise.resolve()),
  deleteDoc: vi.fn(() => Promise.resolve()), onSnapshot: vi.fn(() => vi.fn()),
  query: vi.fn(), where: vi.fn(), writeBatch: vi.fn(() => ({
    set: vi.fn(), delete: vi.fn(), commit: vi.fn(() => Promise.resolve())
  })), serverTimestamp: vi.fn(() => 'mock-timestamp')
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(), onAuthStateChanged: vi.fn((auth, cb) => { cb({ uid: 'test-user' }); return vi.fn(); }),
  signInAnonymously: vi.fn(() => Promise.resolve()), signOut: vi.fn(() => Promise.resolve()),
  setPersistence: vi.fn(() => Promise.resolve()), browserLocalPersistence: 'local'
}));

vi.mock('../modules/firebase', () => ({ db: {}, auth: {} }));

describe('MTB Race Timer - E2E UI Flow', () => {
  beforeEach(() => {
    useRaceStore.setState({
      eventName: "", trackName: "NO TRACK", tracks: [], riders: [], activeRaceId: "", loading: false
    });
    localStorage.clear();
  });

  it('Flow: Create Event -> Load Demo -> Start -> Finish -> Check Results', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>
    );

    // 1. LOGIN SCREEN: Create Event
    const input = screen.getByPlaceholderText(/Enter Event Name/i);
    fireEvent.change(input, { target: { value: 'Test Event' } });
    const createBtn = screen.getByText(/Create Event/i);
    fireEvent.click(createBtn);

    await waitFor(() => {
      expect(screen.getByText(/Test Event/i)).toBeDefined();
    });

    // 2. REGISTRATION: Load Demo Data
    // Find the Load Demo Data button (it's in the RiderImporter component)
    const demoBtn = screen.getByText(/Load Demo Data/i);
    fireEvent.click(demoBtn);

    await waitFor(() => {
      // Check if some riders appeared in the store (or UI if we had a list here)
      expect(useRaceStore.getState().riders.length).toBeGreaterThan(0);
    });

    // 3. STARTER: Start a rider
    // Navigate to Starter (simulated by finding the link/button if it exists, or just checking if App renders it)
    const starterLink = screen.getByText(/Starter/i);
    fireEvent.click(starterLink);

    // In Starter, find the first "START" button for a rider
    // Note: In a real test we'd need to wait for the list to render
    const startButtons = await screen.findAllByRole('button', { name: /START/i });
    fireEvent.click(startButtons[0]);

    await waitFor(() => {
      expect(useRaceStore.getState().riders.some(r => r.status === "ON_TRACK")).toBe(true);
    });

    // 4. FINISH LINE: Finish a rider
    const finishLink = screen.getByText(/Finish/i);
    fireEvent.click(finishLink);

    const finishButtons = await screen.findAllByRole('button', { name: /FINISH/i });
    fireEvent.click(finishButtons[0]);

    await waitFor(() => {
      expect(useRaceStore.getState().riders.some(r => r.status === "FINISHED")).toBe(true);
    });

    // 5. RESULTS: Verify output
    const resultsLink = screen.getByText(/Results/i);
    fireEvent.click(resultsLink);

    await waitFor(() => {
        // Look for the "Rank" header or a rider number in the results table
        expect(screen.getByText(/Rank/i)).toBeDefined();
        expect(screen.queryAllByText(/FINISHED/i).length).toBeGreaterThan(0);
    });
  });
});
