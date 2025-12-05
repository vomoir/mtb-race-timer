import React, { useState, useEffect } from "react";
import {
  Flag,
  Clock,
  Timer,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Save,
  Plus,
  Bike,
  Trophy,
  History,
} from "lucide-react";

// --- MOCK DATA & UTILS ---

const INITIAL_RIDERS = [
  { number: "101", name: "Sam Hill", category: "Elite" },
  { number: "102", name: "Greg Minnaar", category: "Elite" },
  { number: "103", name: "Rachel Atherton", category: "Elite" },
  { number: "104", name: "Loic Bruni", category: "Elite" },
  { number: "105", name: "Finn Iles", category: "Elite" },
  { number: "201", name: "Jackson Goldstone", category: "Junior" },
  { number: "202", name: "Jordan Williams", category: "Junior" },
];

const formatTime = (date) => {
  return date.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    fractionalSecondDigits: 2,
  });
};

const formatDuration = (ms) => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const centis = Math.floor((ms % 1000) / 10);
  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}.${centis.toString().padStart(2, "0")}`;
};

// --- COMPONENTS ---

const Card = ({ children, className = "" }) => (
  <div
    className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden ${className}`}
  >
    {children}
  </div>
);

const Badge = ({ children, color = "slate" }) => {
  const colors = {
    slate: "bg-slate-100 text-slate-700",
    green: "bg-emerald-100 text-emerald-700",
    blue: "bg-blue-100 text-blue-700",
    red: "bg-red-100 text-red-700",
  };
  return (
    <span
      className={`px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
        colors[color] || colors.slate
      }`}
    >
      {children}
    </span>
  );
};

// --- MAIN FINISH LINE COMPONENT (THE REQUESTED UPDATE) ---

const ManualFinish = ({ onFinish, ridersOnTrack }) => {
  const [pendingFinishes, setPendingFinishes] = useState([]);

  // 1. CAPTURE: Immediately store the timestamp when the button is clicked
  const handleCaptureClick = () => {
    const now = new Date();
    const newEntry = {
      id: crypto.randomUUID(),
      timestamp: now,
      displayTime: formatTime(now),
      riderNumber: "", // Empty initially, to be filled in
    };
    // Add to top of list
    setPendingFinishes((prev) => [newEntry, ...prev]);
  };

  // 2. UPDATE: Handle typing into the specific input box
  const handleNumberChange = (id, value) => {
    setPendingFinishes((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, riderNumber: value } : item
      )
    );
  };

  // 3. SAVE: Process the finish with the CAPTURED time, not the current time
  const handleSave = (item) => {
    if (!item.riderNumber) return;

    // Call parent finish handler
    const success = onFinish(item.riderNumber, item.timestamp);

    if (success) {
      // Remove from pending list only if successful
      setPendingFinishes((prev) => prev.filter((p) => p.id !== item.id));
    }
  };

  // 4. DISCARD: Remove an accidental click
  const handleDiscard = (id) => {
    setPendingFinishes((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <Card className="p-6 border-l-4 border-l-red-600">
      <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
        <Flag className="text-red-600" size={24} />
        Manual Finish / Cluster Control
      </h2>

      {/* The Big Button */}
      <button
        onClick={handleCaptureClick}
        className="w-full bg-red-600 hover:bg-red-700 active:scale-[0.98] transition-all text-white py-6 rounded-xl shadow-lg flex flex-col items-center justify-center gap-2 mb-6 group"
      >
        <div className="bg-white/20 p-3 rounded-full group-hover:bg-white/30 transition-colors">
          <Timer size={32} className="text-white" />
        </div>
        <span className="text-2xl font-black uppercase tracking-widest">
          Capture Finish Time
        </span>
        <span className="text-red-100 text-sm font-medium">
          Click immediately as rider crosses line
        </span>
      </button>

      {/* The Queue */}
      <div className="space-y-3">
        {pendingFinishes.length === 0 ? (
          <div className="text-center py-4 text-slate-400 text-sm italic border-2 border-dashed border-slate-100 rounded-lg">
            No pending finishes. Click Capture to record a time.
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-500 uppercase px-2">
              <span>Captured Time</span>
              <span>Rider #</span>
              <span>Action</span>
            </div>
            {pendingFinishes.map((item, index) => {
              // Check if entered number is valid (is actually on track)
              const isValidRider = ridersOnTrack.some(
                (r) => r.number === item.riderNumber
              );
              const isFilled = item.riderNumber.length > 0;

              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-2 p-2 rounded-lg border-2 transition-all ${
                    index === 0
                      ? "bg-red-50 border-red-100"
                      : "bg-white border-slate-100"
                  }`}
                >
                  {/* Time Display */}
                  <div className="bg-slate-800 text-white font-mono rounded px-3 py-2 text-lg font-bold">
                    {item.displayTime}
                  </div>

                  {/* Rider Input */}
                  <input
                    type="number"
                    pattern="[0-9]*"
                    inputMode="numeric"
                    autoFocus={index === 0} // Auto focus the top one for convenience
                    value={item.riderNumber}
                    onChange={(e) =>
                      handleNumberChange(item.id, e.target.value)
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSave(item);
                    }}
                    placeholder="#"
                    className="flex-1 w-16 text-xl font-bold p-2 text-center border border-slate-300 rounded focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none"
                  />

                  {/* Actions */}
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleSave(item)}
                      disabled={!item.riderNumber}
                      className={`p-2 rounded-lg text-white transition-colors ${
                        isValidRider
                          ? "bg-emerald-500 hover:bg-emerald-600"
                          : isFilled
                          ? "bg-orange-500 hover:bg-orange-600" // Warn if number not found
                          : "bg-slate-300 cursor-not-allowed"
                      }`}
                      title="Save Finish"
                    >
                      <Save size={20} />
                    </button>
                    <button
                      onClick={() => handleDiscard(item.id)}
                      className="p-2 rounded-lg bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-red-500 transition-colors"
                      title="Discard Timestamp"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
};

// --- APP WRAPPER TO DEMONSTRATE FUNCTIONALITY ---

export default function App() {
  const [raceState, setRaceState] = useState("stopped"); // stopped, racing
  const [startTime, setStartTime] = useState(null);
  const [riders, setRiders] = useState([]);

  // Load initial riders
  useEffect(() => {
    const loadedRiders = INITIAL_RIDERS.map((r) => ({
      ...r,
      status: "waiting", // waiting, onTrack, finished
      startTime: null,
      finishTime: null,
      totalTime: null,
    }));
    setRiders(loadedRiders);
  }, []);

  const startRace = () => {
    setRaceState("racing");
    const now = Date.now();
    setStartTime(now);
    // Mass start for simplicity of demo
    setRiders((prev) =>
      prev.map((r) => ({
        ...r,
        status: "onTrack",
        startTime: now,
      }))
    );
  };

  const handleFinish = (number, timestamp) => {
    // 1. Find rider
    const rider = riders.find((r) => r.number === number.toString());

    if (!rider) {
      alert(`Rider #${number} not found in database!`);
      return false; // Signal failure to the child component
    }

    if (rider.status === "finished") {
      alert(`Rider #${number} has already finished!`);
      return false;
    }

    // 2. Update State
    const finishTime =
      timestamp instanceof Date ? timestamp.getTime() : timestamp;
    const duration = finishTime - rider.startTime;

    setRiders((prev) =>
      prev.map((r) => {
        if (r.number === number.toString()) {
          return {
            ...r,
            status: "finished",
            finishTime: finishTime,
            totalTime: duration,
          };
        }
        return r;
      })
    );

    return true; // Signal success
  };

  const ridersOnTrack = riders.filter((r) => r.status === "onTrack");
  const ridersFinished = riders
    .filter((r) => r.status === "finished")
    .sort((a, b) => a.totalTime - b.totalTime);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      {/* Header */}
      <header className="bg-slate-900 text-white p-4 shadow-lg sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-red-600 p-2 rounded-lg">
              <Bike size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold leading-tight">
                MTB Race Timer
              </h1>
              <div className="text-xs text-slate-400 font-mono">
                {raceState === "racing" ? "RACE IN PROGRESS" : "READY TO RACE"}
              </div>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <div className="text-sm text-slate-400">System Time</div>
            <div className="font-mono font-bold text-xl">
              {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Start Control */}
        {raceState === "stopped" && (
          <Card className="p-8 text-center space-y-4">
            <h2 className="text-2xl font-bold">Event Control</h2>
            <p className="text-slate-500">
              All riders are loaded and ready for mass start.
            </p>
            <button
              onClick={startRace}
              className="bg-emerald-600 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-emerald-700 active:scale-95 transition-all flex items-center gap-2 mx-auto"
            >
              <Flag size={20} /> START RACE
            </button>
          </Card>
        )}

        {/* ACTIVE RACE DASHBOARD */}
        {raceState === "racing" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* LEFT COLUMN: INPUTS */}
            <div className="space-y-6">
              {/* THE NEW COMPONENT */}
              <ManualFinish
                onFinish={handleFinish}
                ridersOnTrack={ridersOnTrack}
              />

              {/* Waiting / On Track Summary */}
              <Card className="p-4 bg-blue-50 border-blue-100">
                <h3 className="text-blue-800 font-bold mb-3 flex items-center gap-2">
                  <ActivityIcon className="animate-pulse" />
                  Riders On Track ({ridersOnTrack.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {ridersOnTrack.map((r) => (
                    <span
                      key={r.number}
                      className="bg-white text-blue-900 px-2 py-1 rounded text-sm font-mono border border-blue-200"
                    >
                      #{r.number}
                    </span>
                  ))}
                  {ridersOnTrack.length === 0 && (
                    <span className="text-sm text-blue-400">
                      All riders finished
                    </span>
                  )}
                </div>
              </Card>
            </div>

            {/* RIGHT COLUMN: LEADERBOARD */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Trophy className="text-amber-500" />
                  Leaderboard
                </h2>
                <Badge color="green">{ridersFinished.length} Finished</Badge>
              </div>

              <div className="space-y-2">
                {ridersFinished.length === 0 ? (
                  <div className="text-center py-10 bg-white rounded-xl border border-dashed border-slate-300 text-slate-400">
                    Waiting for first finisher...
                  </div>
                ) : (
                  ridersFinished.map((rider, idx) => (
                    <Card
                      key={rider.number}
                      className="p-3 flex items-center justify-between group hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                          ${
                            idx === 0
                              ? "bg-amber-100 text-amber-700"
                              : idx === 1
                              ? "bg-slate-200 text-slate-700"
                              : idx === 2
                              ? "bg-orange-100 text-orange-800"
                              : "bg-slate-50 text-slate-500"
                          }
                        `}
                        >
                          {idx + 1}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800">
                            #{rider.number}{" "}
                            <span className="font-normal text-slate-500 text-sm">
                              - {rider.name}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400">
                            {rider.category}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-lg text-slate-800 leading-none">
                          {formatDuration(rider.totalTime)}
                        </div>
                        <div className="text-[10px] text-slate-400 uppercase font-medium mt-1">
                          +
                          {idx === 0
                            ? "0.00"
                            : formatDuration(
                                rider.totalTime - ridersFinished[0].totalTime
                              )}
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const ActivityIcon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);
