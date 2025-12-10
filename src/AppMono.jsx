import React, { useState, useEffect, useMemo, useContext } from "react";
import {
  Flag,
  Timer,
  Trash2,
  Save,
  Bike,
  Trophy,
  Upload,
  Play,
  Users,
  Search,
  ArrowRight,
  Activity,
} from "lucide-react";

// ==========================================
// 1. MOCK STORE & CONTEXT (Replaces raceStore.js)
// ==========================================

// Create a Context to mimic the Zustand store behavior for this single-file preview
const RaceContext = React.createContext(null);

// This hook mimics your usage: useRaceStore(state => state.riders)
const useRaceStore = (selector) => {
  const store = useContext(RaceContext);
  if (!store) {
    throw new Error("Missing RaceProvider");
  }
  // If a selector is passed, use it; otherwise return full store
  return selector ? selector(store) : store;
};

const RaceProvider = ({ children }) => {
  // --- STATE ---
  const [riders, setRiders] = useState([]);
  const [now, setNow] = useState(new Date());
  const [loading, setLoading] = useState(false);

  // --- ACTIONS ---

  // Simulates your 'tick' action
  const tick = () => {
    setNow(new Date());
  };

  // Simulates loading riders (e.g., from CSV or DB)
  const importRiders = (newRiders) => {
    setRiders(newRiders);
  };

  // Simulates handleStart
  const startRider = (riderNumber) => {
    setLoading(true);
    const startTime = new Date();

    setRiders((prev) =>
      prev.map((r) => {
        if (r.riderNumber === riderNumber) {
          return {
            ...r,
            status: "ON_TRACK", // UPPERCASE to match hook
            startTime: startTime,
          };
        }
        return r;
      })
    );
    setLoading(false);
  };

  // Simulates handleFinish
  const finishRider = (riderNumber, finishTime) => {
    // If finishTime is a string or riderNumber, convert to Date, else keep as Date
    const fTime = new Date(finishTime);

    setRiders((prev) =>
      prev.map((r) => {
        if (r.riderNumber === riderNumber.toString()) {
          const duration = fTime - new Date(r.startTime);
          return {
            ...r,
            status: "FINISHED", // UPPERCASE to match hook
            finishTime: fTime,
            totalTime: duration,
          };
        }
        return r;
      })
    );
    return true; // Success
  };

  const store = {
    riders,
    now,
    loading,
    tick,
    importRiders,
    startRider,
    finishRider,
  };

  return <RaceContext.Provider value={store}>{children}</RaceContext.Provider>;
};

// ==========================================
// 2. HOOKS (Replaces hooks/useRiderLists.js)
// ==========================================

function formatElapsed(startTime, now) {
  if (!startTime) return null;
  const start = new Date(startTime);
  const diffMs = now - start;

  // Prevent negative time if clock skew
  if (diffMs < 0) return "0m 0s";

  const minutes = Math.floor(diffMs / 60000);
  const seconds = Math.floor((diffMs % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}

function useRiderLists() {
  const riders = useRaceStore((state) => state.riders);
  const now = useRaceStore((state) => state.now);

  const ridersOnTrack = useMemo(() => {
    return (
      riders
        // FIX: Ensure Case Matching ("ON_TRACK" vs "onTrack")
        .filter((r) => r.status === "ON_TRACK")
        .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
        .map((r) => ({
          ...r,
          elapsedTime: formatElapsed(r.startTime, now),
        }))
    );
  }, [riders, now]);

  const finishedRiders = useMemo(() => {
    return riders
      .filter((r) => r.status === "FINISHED")
      .sort((a, b) => new Date(a.totalTime) - new Date(b.totalTime));
  }, [riders]);

  return { ridersOnTrack, finishedRiders };
}

// ==========================================
// 3. UTILS
// ==========================================

const formatDuration = (ms) => {
  if (ms === null || ms === undefined) return "--:--.--";
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const centis = Math.floor((ms % 1000) / 10);
  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}.${centis.toString().padStart(2, "0")}`;
};

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
    amber: "bg-amber-100 text-amber-700",
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

// ==========================================
// 4. SUB-COMPONENTS
// ==========================================

// --- HEADER ---
const Header = () => {
  const now = useRaceStore((state) => state.now);
  const riders = useRaceStore((state) => state.riders);
  const activeCount = riders.length > 0;

  return (
    <header className="bg-slate-900 text-white p-4 shadow-lg sticky top-0 z-10">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-red-600 p-2 rounded-lg">
            <Bike size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold leading-tight">MTB Race Timer</h1>
            <div className="text-xs text-slate-400 font-mono">
              {activeCount ? "EVENT ACTIVE" : "REGISTRATION / SETUP"}
            </div>
          </div>
        </div>
        <div className="text-right hidden sm:block">
          <div className="text-sm text-slate-400">System Time</div>
          <div className="font-mono font-bold text-xl">
            {now.toLocaleTimeString("en-US", { hour12: false })}
          </div>
        </div>
      </div>
    </header>
  );
};

// --- RIDER IMPORTER ---
const RiderImporter = () => {
  const importRiders = useRaceStore((state) => state.importRiders);
  const [dragActive, setDragActive] = useState(false);

  const handleFiles = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split("\n");
      const newRiders = [];
      lines.forEach((line, index) => {
        const parts = line.split(",").map((p) => p.trim());
        if (parts.length >= 2) {
          if (
            index === 0 &&
            isNaN(parts[0]) &&
            parts[0].toLowerCase().includes("riderNumber")
          )
            return;
          if (parts[0]) {
            newRiders.push({
              riderNumber: parts[0],
              name: parts[1] || "Unknown Rider",
              category: parts[2] || "Open",
              status: "WAITING", // INITIAL STATE
              startTime: null,
              finishTime: null,
              totalTime: null,
            });
          }
        }
      });
      importRiders(newRiders);
    };
    reader.readAsText(file);
  };

  const loadDemoData = () => {
    const demoRiders = [
      {
        riderNumber: "101",
        name: "Sam Hill",
        category: "Elite",
        status: "WAITING",
        startTime: null,
        finishTime: null,
        totalTime: null,
      },
      {
        riderNumber: "102",
        name: "Greg Minnaar",
        category: "Elite",
        status: "WAITING",
        startTime: null,
        finishTime: null,
        totalTime: null,
      },
      {
        riderNumber: "103",
        name: "Rachel Atherton",
        category: "Elite",
        status: "WAITING",
        startTime: null,
        finishTime: null,
        totalTime: null,
      },
      {
        riderNumber: "201",
        name: "Jackson Goldstone",
        category: "Junior",
        status: "WAITING",
        startTime: null,
        finishTime: null,
        totalTime: null,
      },
    ];
    importRiders(demoRiders);
  };

  return (
    <Card className="p-8 text-center space-y-6 max-w-2xl mx-auto mt-10">
      <div className="mx-auto bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center text-slate-500">
        <Users size={32} />
      </div>
      <h2 className="text-2xl font-bold text-slate-800">Rider Registration</h2>
      <div
        className={`border-2 border-dashed rounded-xl p-8 transition-all ${
          dragActive ? "border-blue-500 bg-blue-50" : "border-slate-300"
        }`}
        onDragEnter={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragActive(false);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          if (e.dataTransfer.files[0]) handleFiles(e.dataTransfer.files[0]);
        }}
      >
        <p className="font-medium text-slate-700">Drag & drop CSV file here</p>
        <p className="text-xs text-slate-400 mb-4">
          Format: Number, Name, Category
        </p>
        <button
          onClick={loadDemoData}
          className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-bold"
        >
          Load Demo Data
        </button>
      </div>
    </Card>
  );
};

// --- STARTER ---
const Starter = () => {
  const riders = useRaceStore((state) => state.riders);
  const startRider = useRaceStore((state) => state.startRider);
  const [searchTerm, setSearchTerm] = useState("");

  // Local filter for "WAITING" riders
  const waitingRiders = riders.filter((r) => r.status === "WAITING");

  const filtered = waitingRiders.filter(
    (r) =>
      r.riderNumber.includes(searchTerm) ||
      r.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card className="flex flex-col h-[500px]">
      <div className="p-4 border-b border-slate-100 bg-slate-50/50">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-3">
          <Play className="text-emerald-600 fill-emerald-600" size={20} />
          Start Gate
          <span className="text-xs font-normal text-slate-500 ml-auto bg-white px-2 py-1 rounded-full border border-slate-200">
            {waitingRiders.length} waiting
          </span>
        </h2>
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={16}
          />
          <input
            type="text"
            placeholder="Find rider..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-slate-50/30">
        {filtered.map((rider) => (
          <div
            key={rider.riderNumber}
            className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm flex items-center justify-between group hover:border-emerald-200"
          >
            <div className="flex items-center gap-3">
              <div className="bg-slate-100 text-slate-700 font-mono font-bold w-10 h-10 flex items-center justify-center rounded-lg">
                {rider.riderNumber}
              </div>
              <div>
                <div className="font-bold text-slate-800">{rider.name}</div>
                <div className="text-xs text-slate-500">{rider.category}</div>
              </div>
            </div>
            <button
              onClick={() => startRider(rider.riderNumber)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-lg font-bold text-xs uppercase flex items-center gap-1"
            >
              GO <ArrowRight size={14} />
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
};

// --- FINISH LINE ---
const FinishLine = () => {
  const finishRider = useRaceStore((state) => state.finishRider);
  const { ridersOnTrack } = useRiderLists();

  const [pendingFinishes, setPendingFinishes] = useState([]);

  const handleCapture = () => {
    const now = new Date();
    setPendingFinishes((prev) => [
      {
        id: crypto.randomUUID(),
        timestamp: now,
        displayTime: now.toLocaleTimeString("en-US", { hour12: false }),
        riderNumber: "",
      },
      ...prev,
    ]);
  };

  const handleSave = (item) => {
    if (!item.riderNumber) return;
    // Check if rider is actually on track
    const isOnTrack = ridersOnTrack.some(
      (r) => r.riderNumber === item.riderNumber
    );

    if (isOnTrack) {
      finishRider(item.riderNumber, item.timestamp);
      setPendingFinishes((prev) => prev.filter((p) => p.id !== item.id));
    } else {
      alert(`Rider #${item.riderNumber} is not currently on track!`);
    }
  };

  return (
    <Card className="flex flex-col h-[500px] border-l-4 border-l-red-600">
      <div className="p-4 border-b border-slate-100">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Flag className="text-red-600" size={24} />
          Finish Line
        </h2>
      </div>
      <div className="p-4">
        <button
          onClick={handleCapture}
          className="w-full bg-red-600 hover:bg-red-700 text-white py-6 rounded-xl shadow-lg flex flex-col items-center justify-center gap-2"
        >
          <Timer size={32} className="text-white" />
          <span className="text-xl font-black uppercase tracking-widest">
            Capture Finish
          </span>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
        {pendingFinishes.map((item, index) => (
          <div
            key={item.id}
            className="flex items-center gap-2 p-2 rounded-lg border-2 bg-red-50 border-red-100"
          >
            <div className="bg-slate-800 text-white font-mono rounded px-2 py-1 font-bold">
              {item.displayTime}
            </div>
            <input
              autoFocus={index === 0}
              value={item.riderNumber}
              onChange={(e) => {
                const val = e.target.value;
                setPendingFinishes((prev) =>
                  prev.map((p) =>
                    p.id === item.id ? { ...p, riderNumber: val } : p
                  )
                );
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSave(item)}
              placeholder="#"
              className="flex-1 w-12 font-bold p-1 text-center border border-slate-300 rounded"
            />
            <button
              onClick={() => handleSave(item)}
              className="p-1.5 rounded text-white bg-emerald-500"
            >
              <Save size={18} />
            </button>
            <button
              onClick={() =>
                setPendingFinishes((prev) =>
                  prev.filter((p) => p.id !== item.id)
                )
              }
              className="p-1.5 rounded bg-slate-200 text-slate-500"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
};

// --- RESULTS ---
const Results = () => {
  const { ridersOnTrack, finishedRiders } = useRiderLists();

  return (
    <div className="space-y-6">
      {/* ON TRACK */}
      <Card className="p-4 bg-blue-50 border-blue-100">
        <h3 className="text-blue-800 font-bold mb-3 flex items-center gap-2">
          <Activity size={18} className="animate-pulse" />
          On Track ({ridersOnTrack.length})
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {ridersOnTrack.map((r) => (
            <div
              key={r.riderNumber}
              className="bg-white p-2 rounded border border-blue-200 shadow-sm flex flex-col items-center"
            >
              <span className="font-bold text-blue-900">#{r.riderNumber}</span>
              <span className="text-xs font-mono text-blue-500">
                {r.elapsedTime}
              </span>
            </div>
          ))}
          {ridersOnTrack.length === 0 && (
            <span className="text-sm text-blue-400 italic">
              No riders on track.
            </span>
          )}
        </div>
      </Card>

      {/* LEADERBOARD */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Trophy className="text-amber-500" />
            Live Leaderboard
          </h2>
          <Badge color="green">{finishedRiders.length} Finished</Badge>
        </div>
        <Card>
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3 w-12 text-center">Pos</th>
                <th className="p-3">Rider</th>
                <th className="p-3 text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {finishedRiders.map((rider, idx) => (
                <tr key={rider.riderNumber} className="hover:bg-slate-50">
                  <td className="p-3 text-center font-bold text-slate-500">
                    {idx + 1}
                  </td>
                  <td className="p-3">
                    <div className="font-bold text-slate-800">{rider.name}</div>
                    <div className="text-xs text-slate-500">
                      #{rider.riderNumber} • {rider.category}
                    </div>
                  </td>
                  <td className="p-3 text-right font-mono text-base font-bold text-slate-800">
                    {formatDuration(rider.totalTime)}
                  </td>
                </tr>
              ))}
              {finishedRiders.length === 0 && (
                <tr>
                  <td
                    colSpan="3"
                    className="p-6 text-center text-slate-400 italic"
                  >
                    No finishes yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
};

// ==========================================
// 5. MAIN LAYOUT
// ==========================================

const Layout = () => {
  const riders = useRaceStore((state) => state.riders);

  // Conditional Rendering: If no riders, show import screen
  if (riders.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
        <Header />
        <RiderImporter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      <Header />
      <main className="max-w-6xl mx-auto p-4 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-6">
            <Starter />
            <FinishLine />
          </div>
          <div className="lg:col-span-2 space-y-6">
            <Results />
          </div>
        </div>
      </main>
    </div>
  );
};

// ==========================================
// 6. APP ENTRY POINT
// ==========================================

export default function App() {
  return (
    <RaceProvider>
      <AppContent />
    </RaceProvider>
  );
}

// Inner component to handle tick effect which needs the context
const AppContent = () => {
  const tick = useRaceStore((state) => state.tick);

  // Start the global clock tick
  useEffect(() => {
    const interval = setInterval(() => tick(), 1000);
    return () => clearInterval(interval);
  }, [tick]);

  return <Layout />;
};
