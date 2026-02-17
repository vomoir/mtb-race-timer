import { beforeEach, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { useRaceStore } from '../store/raceStore';

// This runs before EVERY test in your entire project
beforeEach(() => {
  // 1. Clear the fake browser storage
  localStorage.clear();
  // Forces the store back to its initial state
  useRaceStore.setState(useRaceStore.getInitialState(), true);

  // 2. Clear session storage just in case
  sessionStorage.clear();

  // 3. Optional: Reset all mocks if you use vi.fn()
  vi.clearAllMocks();
});

// This runs after EVERY test
afterEach(() => {
  // Cleanup the DOM (prevents memory leaks and weird UI bugs)
  cleanup();
});