import React from "react";
import { render, screen, act } from "@testing-library/react";
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
      lastStarted: {
        riderNumber: "101",
        time: "10:00:00",
        timestamp: baseTime - 12000, // 12 seconds ago
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
      lastStarted: {
        riderNumber: "101",
        time: "10:00:00",
        timestamp: baseTime,
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
      lastStarted: {
        riderNumber: "101",
        time: "10:00:00",
        timestamp: baseTime - 30000, // 30 seconds ago
      },
    });

    const { rerender } = render(<PacingTimer />);
    const timerDisplay = screen.getByTestId("pacing-timer-seconds");
    expect(timerDisplay.textContent).toBe("30s");

    // New rider started at current time
    act(() => {
      useRaceStore.setState({
        lastStarted: {
          riderNumber: "102",
          time: "10:00:30",
          timestamp: baseTime,
        },
      });
    });

    rerender(<PacingTimer />);
    expect(timerDisplay.textContent).toBe("0s");
  });

  it("renders inside StarterComponent on the Start tab", () => {
    render(<StarterComponent />);
    expect(screen.getByTestId("pacing-timer")).toBeDefined();
    expect(screen.getByText("Seconds Since Last Rider")).toBeDefined();
  });
});
