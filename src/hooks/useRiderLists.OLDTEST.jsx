import { renderHook } from "@testing-library/react";
import { useRiderLists } from "./useRiderLists";
import { useRaceStore } from "../store/raceStore";

// helper to set store state before each test
const setStore = (state) => {
  useRaceStore.setState(state);
};

describe("useRiderLists", () => {
  it("returns riders on track sorted by startTime", () => {
    const now = new Date("2025-12-03T10:00:00Z");
    setStore({
      riders: [
        {
          id: 1,
          raceNumber: 101,
          status: "ON_TRACK",
          startTime: "2025-12-03T09:00:00Z",
        },
        {
          id: 2,
          raceNumber: 102,
          status: "ON_TRACK",
          startTime: "2025-12-03T08:30:00Z",
        },
      ],
      now,
    });

    const { result } = renderHook(() => useRiderLists());
    const { ridersOnTrack } = result.current;

    expect(ridersOnTrack.map((r) => r.id)).toEqual([2, 1]); // sorted by startTime
    expect(ridersOnTrack[0].elapsedTime).toMatch(/m \d+s/); // formatted string
  });

  it("returns finished riders sorted by finishTime descending", () => {
    setStore({
      riders: [
        {
          id: 1,
          raceNumber: 101,
          status: "FINISHED",
          finishTime: "2025-12-03T09:00:00Z",
        },
        {
          id: 2,
          raceNumber: 102,
          status: "FINISHED",
          finishTime: "2025-12-03T10:00:00Z",
        },
      ],
      now: new Date("2025-12-03T11:00:00Z"),
    });

    const { result } = renderHook(() => useRiderLists());
    const { finishedRiders } = result.current;

    expect(finishedRiders.map((r) => r.id)).toEqual([2, 1]); // latest first
  });

  it("returns empty arrays when no riders match", () => {
    setStore({ riders: [], now: new Date() });

    const { result } = renderHook(() => useRiderLists());
    expect(result.current.ridersOnTrack).toEqual([]);
    expect(result.current.finishedRiders).toEqual([]);
  });
});
