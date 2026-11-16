import React from "react";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { PacingTimer } from "../components/starter/PacingTimer";
import StarterComponent from "../components/Starter";
import { useRaceStore } from "../store/raceStore";

describe("PacingTimer component", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useRaceStore.setState({
      lastStarted: null,
      riders: [],
      activeRaceId: "EVENT_STAGE-1",
      riderNumber: "",
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("displays '--' when no rider has been started", () => {
    render(<PacingTimer />);
    const timerDisplay = screen.getByTestId("pacing-timer-seconds");
    expect(timerDisplay.textContent).toBe("--");
  });

  it("displays elapsed seconds since last rider started", () => {
    const baseTime = 1700000000000;
    vi.setSystemTime(baseTime);

    useRaceStore.setState({
      activeRaceId: "EVENT_STAGE-1",
      riders: [
        { id: "1", raceId: "EVENT_STAGE-1", riderNumber: "101", status: "ON_TRACK", startTimeMs: baseTime - 12000 },
        { id: "2", raceId: "EVENT_STAGE-1", riderNumber: "102", status: "WAITING" },
      ],
      lastStarted: {
        riderNumber: "101",
        time: "10:00:00",
        timestamp: baseTime - 12000, // 12 seconds ago
        raceId: "EVENT_STAGE-1",
      },
    });

    render(<PacingTimer />);
    const timerDisplay = screen.getByTestId("pacing-timer-seconds");
    expect(timerDisplay.textContent).toBe("12s");
  });

  it("updates elapsed seconds as time elapses", () => {
    const baseTime = 1700000000000;
    vi.setSystemTime(baseTime);

    useRaceStore.setState({
      activeRaceId: "EVENT_STAGE-1",
      riders: [
        { id: "1", raceId: "EVENT_STAGE-1", riderNumber: "101", status: "ON_TRACK", startTimeMs: baseTime },
        { id: "2", raceId: "EVENT_STAGE-1", riderNumber: "102", status: "WAITING" },
      ],
      lastStarted: {
        riderNumber: "101",
        time: "10:00:00",
        timestamp: baseTime,
        raceId: "EVENT_STAGE-1",
      },
    });

    render(<PacingTimer />);
    const timerDisplay = screen.getByTestId("pacing-timer-seconds");
    expect(timerDisplay.textContent).toBe("0s");

    // Advance 5 seconds
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(timerDisplay.textContent).toBe("5s");

    // Advance to 30 seconds
    act(() => {
      vi.advanceTimersByTime(25000);
    });
    expect(timerDisplay.textContent).toBe("30s");
  });

  it("resets the counter when a new rider is started", () => {
    const baseTime = 1700000000000;
    vi.setSystemTime(baseTime);

    useRaceStore.setState({
      activeRaceId: "EVENT_STAGE-1",
      riders: [
        { id: "1", raceId: "EVENT_STAGE-1", riderNumber: "101", status: "ON_TRACK", startTimeMs: baseTime - 30000 },
        { id: "2", raceId: "EVENT_STAGE-1", riderNumber: "102", status: "WAITING" },
        { id: "3", raceId: "EVENT_STAGE-1", riderNumber: "103", status: "WAITING" },
      ],
      lastStarted: {
        riderNumber: "101",
        time: "10:00:00",
        timestamp: baseTime - 30000, // 30 seconds ago
        raceId: "EVENT_STAGE-1",
      },
    });

    const { rerender } = render(<PacingTimer />);
    const timerDisplay = screen.getByTestId("pacing-timer-seconds");
    expect(timerDisplay.textContent).toBe("30s");

    // New rider started at current time (still 1 rider waiting)
    act(() => {
      useRaceStore.setState({
        riders: [
          { id: "1", raceId: "EVENT_STAGE-1", riderNumber: "101", status: "ON_TRACK", startTimeMs: baseTime - 30000 },
          { id: "2", raceId: "EVENT_STAGE-1", riderNumber: "102", status: "ON_TRACK", startTimeMs: baseTime },
          { id: "3", raceId: "EVENT_STAGE-1", riderNumber: "103", status: "WAITING" },
        ],
        lastStarted: {
          riderNumber: "102",
          time: "10:00:30",
          timestamp: baseTime,
          raceId: "EVENT_STAGE-1",
        },
      });
    });

    rerender(<PacingTimer />);
    expect(timerDisplay.textContent).toBe("0s");
  });

  it("resets the timer when the last rider has been released", () => {
    const baseTime = 1700000000000;
    vi.setSystemTime(baseTime);

    // Initial state: rider 1 on track, rider 2 waiting
    useRaceStore.setState({
      activeRaceId: "EVENT_STAGE-1",
      riders: [
        { id: "1", raceId: "EVENT_STAGE-1", riderNumber: "101", status: "ON_TRACK", startTimeMs: baseTime - 25000 },
        { id: "2", raceId: "EVENT_STAGE-1", riderNumber: "102", status: "WAITING" },
      ],
      lastStarted: {
        riderNumber: "101",
        time: "10:00:00",
        timestamp: baseTime - 25000,
        raceId: "EVENT_STAGE-1",
      },
    });

    const { rerender } = render(<PacingTimer />);
    expect(screen.getByTestId("pacing-timer-seconds").textContent).toBe("25s");

    // Start rider 2 (the last rider: waitingCount becomes 0)
    act(() => {
      useRaceStore.setState({
        riders: [
          { id: "1", raceId: "EVENT_STAGE-1", riderNumber: "101", status: "ON_TRACK", startTimeMs: baseTime - 25000 },
          { id: "2", raceId: "EVENT_STAGE-1", riderNumber: "102", status: "ON_TRACK", startTimeMs: baseTime },
        ],
        lastStarted: {
          riderNumber: "102",
          time: "10:00:25",
          timestamp: baseTime,
          raceId: "EVENT_STAGE-1",
        },
      });
    });

    rerender(<PacingTimer />);
    // With 0 waiting riders left on this track, timer resets to "--" and displays "All Riders Released"
    expect(screen.getByTestId("pacing-timer-seconds").textContent).toBe("--");
    expect(screen.getByText("All Riders Released")).toBeDefined();
  });

  it("does not show previous track's time when moving to a new track", () => {
    const baseTime = 1700000000000;
    vi.setSystemTime(baseTime);

    // Track 1 has finished starting riders
    useRaceStore.setState({
      activeRaceId: "EVENT_STAGE-1",
      lastStarted: {
        riderNumber: "101",
        time: "09:00:00",
        timestamp: baseTime - 3600000, // 1 hour ago on Track 1
        raceId: "EVENT_STAGE-1",
      },
      riders: [
        { id: "1", raceId: "EVENT_STAGE-1", riderNumber: "101", status: "FINISHED", startTimeMs: baseTime - 3600000 },
        { id: "2", raceId: "EVENT_STAGE-2", riderNumber: "101", status: "WAITING" },
      ],
    });

    // Move to Track 2
    act(() => {
      useRaceStore.setState({
        activeRaceId: "EVENT_STAGE-2",
        trackName: "Stage 2",
        lastStarted: null, // As setTrack clears lastStarted
      });
    });

    render(<PacingTimer />);
    // Track 2 has not started any riders yet, so it should be "--", NOT a huge 3600s count
    expect(screen.getByTestId("pacing-timer-seconds").textContent).toBe("--");
    expect(screen.getByText("Seconds Since Last Rider")).toBeDefined();
  });

  it("allows resetting the timer manually", () => {
    const baseTime = 1700000000000;
    vi.setSystemTime(baseTime);

    useRaceStore.setState({
      activeRaceId: "EVENT_STAGE-1",
      riders: [
        { id: "1", raceId: "EVENT_STAGE-1", riderNumber: "101", status: "ON_TRACK", startTimeMs: baseTime - 15000 },
        { id: "2", raceId: "EVENT_STAGE-1", riderNumber: "102", status: "WAITING" },
      ],
      lastStarted: {
        riderNumber: "101",
        time: "10:00:00",
        timestamp: baseTime - 15000,
        raceId: "EVENT_STAGE-1",
      },
    });

    render(<PacingTimer />);
    expect(screen.getByTestId("pacing-timer-seconds").textContent).toBe("15s");

    const resetBtn = screen.getByTestId("pacing-timer-reset");
    act(() => {
      fireEvent.click(resetBtn);
    });

    expect(screen.getByTestId("pacing-timer-seconds").textContent).toBe("--");
  });

  it("renders inside StarterComponent on the Start tab", () => {
    render(<StarterComponent />);
    expect(screen.getByTestId("pacing-timer")).toBeDefined();
  });
});
