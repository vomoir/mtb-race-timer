import React, { useState, useRef } from "react";
import {
  Flag,
  Timer,
  Trash2,
  Save,
  Bike,
  Trophy,
  Upload,
  Play,
  FileText,
  Users,
  Search,
  ArrowRight,
} from "lucide-react";

// --- UTILS ---

const formatTime = (date) => {
  if (!date) return "--:--:--";
  return date.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    fractionalSecondDigits: 2,
  });
};

const formatDuration = (ms) => {
  if (ms === null || ms === undefined) return "--:--.--";
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

// --- CSV IMPORTER COMPONENT ---

const RiderImporter = ({ onImport }) => {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleFiles = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split("\n");
      const newRiders = [];

      // Simple CSV parsing (Number,Name,Category)
      lines.forEach((line, index) => {
        const parts = line.split(",").map((p) => p.trim());
        if (parts.length >= 2) {
          // Skip header if it looks like a header
          if (
            index === 0 &&
            isNaN(parts[0]) &&
            parts[0].toLowerCase().includes("number")
          )
            return;

          if (parts[0]) {
            newRiders.push({
              number: parts[0],
              name: parts[1] || "Unknown Rider",
              category: parts[2] || "Open",
              status: "waiting", // waiting, onTrack, finished
              startTime: null,
              finishTime: null,
              totalTime: null,
            });
          }
        }
      });
      onImport(newRiders);
    };
    reader.readAsText(file);
  };

  const loadDemoData = () => {
    const demoRiders = [
      {
        number: "101",
        name: "Sam Hill",
        category: "Elite",
        status: "waiting",
        startTime: null,
        finishTime: null,
        totalTime: null,
      },
      {
        number: "102",
        name: "Greg Minnaar",
        category: "Elite",
        status: "waiting",
        startTime: null,
        finishTime: null,
        totalTime: null,
      },
      {
        number: "103",
        name: "Rachel Atherton",
        category: "Elite",
        status: "waiting",
        startTime: null,
        finishTime: null,
        totalTime: null,
      },
      {
        number: "201",
        name: "Jackson Goldstone",
        category: "Junior",
        status: "waiting",
        startTime: null,
        finishTime: null,
        totalTime: null,
      },
      {
        number: "202",
        name: "Jordan Williams",
        category: "Junior",
        status: "waiting",
        startTime: null,
        finishTime: null,
        totalTime: null,
      },
    ];
    onImport(demoRiders);
  };

  return (
    <Card className="p-8 text-center space-y-6">
      <div className="mx-auto bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center text-slate-500">
        <Users size={32} />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-slate-800">
          Rider Registration
        </h2>
        <p className="text-slate-500 mt-2">
          Import your rider list to begin the event.
        </p>
      </div>

      <div
        className={`border-2 border-dashed rounded-xl p-8 transition-all ${
          dragActive
            ? "border-blue-500 bg-blue-50"
            : "border-slate-300 hover:border-slate-400"
        }`}
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragActive(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragActive(false);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragActive(false);
          if (e.dataTransfer.files && e.dataTransfer.files[0])
            handleFiles(e.dataTransfer.files[0]);
        }}
      >
        <div className="flex flex-col items-center gap-2">
          <Upload className={dragActive ? "text-blue-500" : "text-slate-400"} />
          <p className="font-medium text-slate-700">
            Drag & drop CSV file here
          </p>
          <p className="text-xs text-slate-400">
            Format: Number, Name, Category
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files[0])}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="mt-4 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 shadow-sm"
          >
            Browse Files
          </button>
        </div>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-slate-500">Or</span>
        </div>
      </div>

      <button
        onClick={loadDemoData}
        className="text-slate-500 hover:text-slate-800 underline text-sm"
      >
        Load Demo Data
      </button>
    </Card>
  );
};

// --- START GATE COMPONENT (NEW) ---

const StartGate = ({ waitingRiders, onStartRider }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredRiders = waitingRiders.filter(
    (r) =>
      r.number.includes(searchTerm) ||
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
            placeholder="Find rider number or name..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-slate-50/30">
        {filteredRiders.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm">
            <p>No riders found</p>
          </div>
        ) : (
          filteredRiders.map((rider) => (
            <div
              key={rider.number}
              className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm flex items-center justify-between group hover:border-emerald-200 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="bg-slate-100 text-slate-700 font-mono font-bold w-10 h-10 flex items-center justify-center rounded-lg text-lg group-hover:bg-emerald-50 group-hover:text-emerald-700 transition-colors">
                  {rider.number}
                </div>
                <div>
                  <div className="font-bold text-slate-800 leading-tight">
                    {rider.name}
                  </div>
                  <div className="text-xs text-slate-500">{rider.category}</div>
                </div>
              </div>
              <button
                onClick={() => onStartRider(rider.number)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-lg shadow-sm active:scale-95 transition-all flex items-center gap-1 font-bold text-xs uppercase"
              >
                GO <ArrowRight size={14} />
              </button>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};

// --- FINISH LINE COMPONENT (EXISTING) ---

const ManualFinish = ({ onFinish, ridersOnTrack }) => {
  const [pendingFinishes, setPendingFinishes] = useState([]);

  const handleCaptureClick = () => {
    const now = new Date();
    const newEntry = {
      id: crypto.randomUUID(),
      timestamp: now,
      displayTime: formatTime(now),
      riderNumber: "",
    };
    setPendingFinishes((prev) => [newEntry, ...prev]);
  };

  const handleNumberChange = (id, value) => {
    setPendingFinishes((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, riderNumber: value } : item
      )
    );
  };

  const handleSave = (item) => {
    if (!item.riderNumber) return;
    const success = onFinish(item.riderNumber, item.timestamp);
    if (success) {
      setPendingFinishes((prev) => prev.filter((p) => p.id !== item.id));
    }
  };

  const handleDiscard = (id) => {
    setPendingFinishes((prev) => prev.filter((p) => p.id !== id));
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
          onClick={handleCaptureClick}
          className="w-full bg-red-600 hover:bg-red-700 active:scale-[0.98] transition-all text-white py-6 rounded-xl shadow-lg flex flex-col items-center justify-center gap-2 group"
        >
          <div className="bg-white/20 p-3 rounded-full group-hover:bg-white/30 transition-colors">
            <Timer size={32} className="text-white" />
          </div>
          <span className="text-xl font-black uppercase tracking-widest">
            Capture Finish
          </span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
        {pendingFinishes.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm italic">
            No pending finishes.
          </div>
        ) : (
          pendingFinishes.map((item, index) => {
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
                <div className="bg-slate-800 text-white font-mono rounded px-2 py-1 text-md font-bold">
                  {item.displayTime}
                </div>
                <input
                  type="number"
                  pattern="[0-9]*"
                  inputMode="numeric"
                  autoFocus={index === 0}
                  value={item.riderNumber}
                  onChange={(e) => handleNumberChange(item.id, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSave(item);
                  }}
                  placeholder="#"
                  className="flex-1 w-12 font-bold p-1 text-center border border-slate-300 rounded focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none"
                />
                <button
                  onClick={() => handleSave(item)}
                  disabled={!item.riderNumber}
                  className={`p-1.5 rounded text-white ${
                    isValidRider
                      ? "bg-emerald-500"
                      : isFilled
                      ? "bg-orange-500"
                      : "bg-slate-300"
                  }`}
                >
                  <Save size={18} />
                </button>
                <button
                  onClick={() => handleDiscard(item.id)}
                  className="p-1.5 rounded bg-slate-100 text-slate-400 hover:text-red-600"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
};

// --- APP WRAPPER ---

export default function App() {
  const [riders, setRiders] = useState([]);
  const [appState, setAppState] = useState("setup"); // setup, active

  const handleImport = (importedRiders) => {
    setRiders(importedRiders);
    setAppState("active");
  };

  const handleStartRider = (number) => {
    const now = Date.now();
    setRiders((prev) =>
      prev.map((r) => {
        if (r.number === number) {
          return { ...r, status: "onTrack", startTime: now };
        }
        return r;
      })
    );
  };

  const handleFinishRider = (number, timestamp) => {
    const rider = riders.find((r) => r.number === number.toString());
    if (!rider) {
      alert(`Rider #${number} not found!`);
      return false;
    }
    if (rider.status !== "onTrack") {
      alert(
        `Rider #${number} is not currently on track (Status: ${rider.status})`
      );
      return false;
    }

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
    return true;
  };

  const waitingRiders = riders.filter((r) => r.status === "waiting");
  const ridersOnTrack = riders
    .filter((r) => r.status === "onTrack")
    .sort((a, b) => b.startTime - a.startTime);
  const ridersFinished = riders
    .filter((r) => r.status === "finished")
    .sort((a, b) => a.totalTime - b.totalTime);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
      {/* Header */}
      <header className="bg-slate-900 text-white p-4 shadow-lg sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-red-600 p-2 rounded-lg">
              <Bike size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold leading-tight">
                MTB Race Timer
              </h1>
              <div className="text-xs text-slate-400 font-mono">
                {appState === "setup" ? "REGISTRATION" : "EVENT ACTIVE"}
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

      <main className="max-w-6xl mx-auto p-4 space-y-6">
        {appState === "setup" && (
          <div className="max-w-2xl mx-auto mt-10">
            <RiderImporter onImport={handleImport} />
          </div>
        )}

        {appState === "active" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* COLUMN 1: CONTROLS */}
            <div className="space-y-6">
              {/* Start Gate */}
              <StartGate
                waitingRiders={waitingRiders}
                onStartRider={handleStartRider}
              />

              {/* Manual Finish */}
              <ManualFinish
                onFinish={handleFinishRider}
                ridersOnTrack={ridersOnTrack}
              />
            </div>

            {/* COLUMN 2 & 3: TRACKING & RESULTS */}
            <div className="lg:col-span-2 space-y-6">
              {/* Active Riders Grid */}
              <Card className="p-4 bg-blue-50 border-blue-100 min-h-[120px]">
                <h3 className="text-blue-800 font-bold mb-3 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                  On Track ({ridersOnTrack.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {ridersOnTrack.length === 0 ? (
                    <span className="text-sm text-blue-400 italic">
                      No riders currently on track.
                    </span>
                  ) : (
                    ridersOnTrack.map((r) => (
                      <div
                        key={r.number}
                        className="bg-white text-blue-900 px-3 py-2 rounded shadow-sm border border-blue-200 flex flex-col items-center min-w-[80px]"
                      >
                        <span className="font-bold text-lg leading-none">
                          #{r.number}
                        </span>
                        <span className="text-[10px] text-blue-400 truncate max-w-[70px]">
                          {r.name}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </Card>

              {/* Leaderboard */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Trophy className="text-amber-500" />
                    Live Leaderboard
                  </h2>
                  <Badge color="green">{ridersFinished.length} Finished</Badge>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-3 w-12 text-center">Pos</th>
                        <th className="p-3">Rider</th>
                        <th className="p-3 text-right">Time</th>
                        <th className="p-3 text-right text-xs">Gap</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {ridersFinished.length === 0 ? (
                        <tr>
                          <td
                            colSpan="4"
                            className="p-8 text-center text-slate-400 italic"
                          >
                            Waiting for results...
                          </td>
                        </tr>
                      ) : (
                        ridersFinished.map((rider, idx) => (
                          <tr
                            key={rider.number}
                            className="hover:bg-slate-50 transition-colors"
                          >
                            <td className="p-3 text-center">
                              <span
                                className={`inline-block w-6 h-6 rounded-full text-xs leading-6 font-bold
                                ${
                                  idx === 0
                                    ? "bg-amber-100 text-amber-700"
                                    : idx === 1
                                    ? "bg-slate-200 text-slate-700"
                                    : idx === 2
                                    ? "bg-orange-100 text-orange-800"
                                    : "text-slate-500"
                                }
                              `}
                              >
                                {idx + 1}
                              </span>
                            </td>
                            <td className="p-3">
                              <div className="font-bold text-slate-800">
                                {rider.name}
                              </div>
                              <div className="flex gap-2 text-xs">
                                <span className="text-slate-500">
                                  #{rider.number}
                                </span>
                                <span className="text-slate-400">
                                  • {rider.category}
                                </span>
                              </div>
                            </td>
                            <td className="p-3 text-right font-mono text-base font-bold text-slate-800">
                              {formatDuration(rider.totalTime)}
                            </td>
                            <td className="p-3 text-right font-mono text-xs text-slate-400">
                              +
                              {idx === 0
                                ? "0.00"
                                : formatDuration(
                                    rider.totalTime -
                                      ridersFinished[0].totalTime
                                  )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
