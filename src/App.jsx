import React, { useState, useEffect, useMemo } from "react";
import {
  Play,
  Flag,
  Clock,
  CheckCircle,
  AlertTriangle,
  List,
  RefreshCw,
  Timer,
  LogIn,
  Hash,
  FileText,
  Trophy,
  Download,
  Wifi,
  WifiOff,
  Zap,
} from "lucide-react";
import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import {
  getFirestore,
  collection,
  serverTimestamp,
  addDoc,
  updateDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";

// --- FIXED: Standard React/Vite Firebase Configuration ---
// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBBRlw9TPYBf9pmSSw25yW_VDYPFIY0vZo",
  authDomain: "mtb-race-timer-a3453.firebaseapp.com",
  projectId: "mtb-race-timer-a3453",
  storageBucket: "mtb-race-timer-a3453.firebasestorage.app",
  messagingSenderId: "612454539416",
  appId: "1:612454539416:web:619cb0fe16cad484ad70ed",
  measurementId: "G-FGWWBVV5JN",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
// const analytics = getAnalytics(app);

// Use a static ID or one from env
const appId = "mtb-race-timer-v1";

// --- Helpers ---
const formatTime = (dateObj) => {
  // Service Worker check removed for dev simplicity, can be added back if PWA is needed
  if (!dateObj) return "--:--:--";
  const d = new Date(dateObj);
  return d.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    fractionalSecondDigits: 2,
  });
};

const calculateRaceTime = (startIso, endIso) => {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const diff = end - start;

  if (diff < 0) return "00:00:00.00";

  const milliseconds = Math.floor((diff % 1000) / 10); // get centiseconds
  const seconds = Math.floor((diff / 1000) % 60);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const hours = Math.floor(diff / (1000 * 60 * 60));

  const pad = (num) => num.toString().padStart(2, "0");

  // Format: HH:MM:SS.ms
  return `${hours > 0 ? pad(hours) + ":" : ""}${pad(minutes)}:${pad(
    seconds
  )}.${pad(milliseconds)}`;
};

const saveToLocalBackup = (type, data) => {
  try {
    const key = `mtb_backup_${type}`;
    const existing = JSON.parse(localStorage.getItem(key) || "[]");
    const entry = { ...data, localTimestamp: new Date().toISOString() };
    localStorage.setItem(
      key,
      JSON.stringify([entry, ...existing].slice(0, 50))
    ); // Keep last 50
  } catch (e) {
    console.error("Local storage failed", e);
  }
};

const getLocalBackup = (type) => {
  try {
    return JSON.parse(localStorage.getItem(`mtb_backup_${type}`) || "[]");
  } catch (e) {
    return [];
  }
};

// --- Components ---

const Header = ({ activeTab, setActiveTab, raceId, onLogout, isOnline }) => (
  <div className="bg-slate-900 text-white p-4 sticky top-0 z-50 shadow-lg">
    <div className="flex justify-between items-center mb-4 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold flex items-center gap-2">
        <Clock className="text-yellow-400" />
        MTB Timing Pro
      </h1>
      <div className="flex items-center gap-3">
        {/* Connection Status Indicator */}
        <div
          className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
            isOnline
              ? "bg-green-900/50 text-green-400 border border-green-800"
              : "bg-red-900/50 text-red-400 border border-red-800"
          }`}
        >
          {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
          <span className="hidden sm:inline">
            {isOnline ? "ONLINE" : "OFFLINE"}
          </span>
        </div>

        <div className="flex items-center gap-1 text-xs bg-slate-800 px-2 py-1 rounded border border-slate-700">
          <Hash size={12} className="text-blue-400" />
          <span className="font-mono text-blue-200">{raceId}</span>
        </div>
        <button
          onClick={onLogout}
          className="text-xs text-slate-400 hover:text-white underline"
        >
          Exit
        </button>
      </div>
    </div>

    <div className="flex bg-slate-800 rounded-lg p-1 max-w-2xl mx-auto overflow-x-auto">
      <button
        onClick={() => setActiveTab("starter")}
        className={`flex-1 flex items-center justify-center gap-2 py-3 px-2 rounded-md transition-all font-semibold whitespace-nowrap ${
          activeTab === "starter"
            ? "bg-green-600 text-white shadow-md"
            : "text-slate-400 hover:text-white"
        }`}
      >
        <Play size={18} /> Starter
      </button>
      <button
        onClick={() => setActiveTab("finish")}
        className={`flex-1 flex items-center justify-center gap-2 py-3 px-2 rounded-md transition-all font-semibold whitespace-nowrap ${
          activeTab === "finish"
            ? "bg-red-600 text-white shadow-md"
            : "text-slate-400 hover:text-white"
        }`}
      >
        <Flag size={18} /> Finish Line
      </button>
      <button
        onClick={() => setActiveTab("results")}
        className={`flex-1 flex items-center justify-center gap-2 py-3 px-2 rounded-md transition-all font-semibold whitespace-nowrap ${
          activeTab === "results"
            ? "bg-blue-600 text-white shadow-md"
            : "text-slate-400 hover:text-white"
        }`}
      >
        <Trophy size={18} /> Results
      </button>
    </div>
  </div>
);

const LoginScreen = ({ onJoin }) => {
  const [inputId, setInputId] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputId.trim()) {
      onJoin(inputId.trim().toUpperCase());
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="text-blue-600" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Race Coordinator
          </h1>
          <p className="text-slate-500 mt-2">
            Enter a unique Race ID to sync Start & Finish lines.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Race Session ID
            </label>
            <div className="relative">
              <Hash
                className="absolute left-3 top-3.5 text-slate-400"
                size={20}
              />
              <input
                type="text"
                value={inputId}
                onChange={(e) => setInputId(e.target.value)}
                placeholder="e.g. DH-FINALS-24"
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none uppercase font-mono tracking-wider"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95"
          >
            <LogIn size={20} />
            Join Session
          </button>
        </form>
        <div className="mt-6 text-center text-xs text-slate-400">
          Ensure both devices use the exact same ID.
        </div>
      </div>
    </div>
  );
};

const ResultsComponent = ({ riders, raceId, calculateRaceTime }) => {
  const sortedResults = useMemo(() => {
    return riders
      .filter((r) => r.status === "FINISHED" && r.finishTime && r.startTime)
      .map((r) => ({
        ...r,
        durationMs: new Date(r.finishTime) - new Date(r.startTime),
      }))
      .sort((a, b) => a.durationMs - b.durationMs);
  }, [riders]);

  const downloadCSV = () => {
    // CSV Header
    const headers = [
      "Rank,Race Number,Race Time,Start Time,Finish Time,Status",
    ];

    // CSV Rows
    const rows = sortedResults.map((r, index) => {
      const raceTime = calculateRaceTime(r.startTime, r.finishTime);
      const start = new Date(r.startTime).toLocaleTimeString();
      const finish = new Date(r.finishTime).toLocaleTimeString();
      return `${index + 1},${r.raceNumber},${raceTime},${start},${finish},${
        r.status
      }`;
    });

    const csvContent = [headers, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${raceId}_Results.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Trophy className="text-yellow-500" size={20} />
            Race Results
          </h2>
          <p className="text-xs text-slate-500">
            {sortedResults.length} riders finished
          </p>
        </div>
        <button
          onClick={downloadCSV}
          disabled={sortedResults.length === 0}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {sortedResults.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto text-slate-300 mb-2" size={32} />
            <p className="text-slate-400">No race results yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-5 border-b border-slate-200">
                <tr>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase">
                    Rank
                  </th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase">
                    Rider
                  </th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase text-right">
                    Time
                  </th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase text-right hidden sm:table-cell">
                    Diff
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedResults.map((rider, index) => {
                  const isWinner = index === 0;
                  const raceTime = calculateRaceTime(
                    rider.startTime,
                    rider.finishTime
                  );
                  const diff =
                    index === 0
                      ? "-"
                      : `+${(
                          (rider.durationMs - sortedResults[0].durationMs) /
                          1000
                        ).toFixed(2)}`;

                  return (
                    <tr
                      key={rider.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="p-4 font-bold text-slate-400 w-16">
                        {isWinner ? (
                          <Trophy
                            size={16}
                            className="text-yellow-500 fill-yellow-500"
                          />
                        ) : (
                          index + 1
                        )}
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-800 text-lg">
                          #{rider.raceNumber}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div
                          className={`font-mono font-bold text-lg ${
                            isWinner ? "text-green-600" : "text-slate-700"
                          }`}
                        >
                          {raceTime}
                        </div>
                      </td>
                      <td className="p-4 text-right hidden sm:table-cell">
                        <div className="font-mono text-xs text-red-500 font-medium">
                          {diff}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const StarterComponent = ({ user, raceId, formatTime }) => {
  const [raceNumber, setRaceNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastStarted, setLastStarted] = useState(null);
  const [localLogs, setLocalLogs] = useState(getLocalBackup("starts"));

  const handleStart = async (e) => {
    e.preventDefault();
    if (!raceNumber.trim() || !user) return;

    setLoading(true);
    const num = raceNumber.trim();
    const now = new Date();

    const raceData = {
      raceId: raceId,
      raceNumber: num,
      startTime: now.toISOString(),
      status: "ON_TRACK",
      startedBy: user.uid,
      finishTime: null,
      raceTime: null,
      timestamp: serverTimestamp(),
    };

    try {
      saveToLocalBackup("starts", raceData);
      setLocalLogs(getLocalBackup("starts"));

      await addDoc(
        collection(db, "artifacts", appId, "public", "data", "mtb_riders"),
        raceData
      );

      setLastStarted({ number: num, time: now });
      setRaceNumber("");
    } catch (error) {
      console.error("Error starting rider:", error);
      alert("Error saving data. Checked local storage.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Play className="text-green-600" size={20} />
          Start Rider
        </h2>

        <form onSubmit={handleStart} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-500 mb-1">
              Race Number
            </label>
            <input
              type="number"
              pattern="[0-9]*"
              inputMode="numeric"
              value={raceNumber}
              onChange={(e) => setRaceNumber(e.target.value)}
              className="w-full text-4xl font-bold p-4 text-center border-2 border-slate-300 rounded-lg focus:border-green-500 focus:ring-4 focus:ring-green-100 outline-none transition-all placeholder:text-slate-200"
              placeholder="000"
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={!raceNumber || loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xl font-bold py-6 rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            {loading ? <RefreshCw className="animate-spin" /> : "START RIDER"}
          </button>
        </form>

        {lastStarted && (
          <div className="mt-6 p-4 bg-green-50 border border-green-100 rounded-lg flex items-center justify-between animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <CheckCircle className="text-green-600" />
              <div>
                <p className="text-sm text-green-800 font-semibold">
                  Rider #{lastStarted.number} Started
                </p>
                <p className="text-xs text-green-600">
                  {formatTime(lastStarted.time)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          Local Backup Log (Last 5)
        </h3>
        <div className="space-y-2">
          {localLogs.slice(0, 5).map((log, i) => (
            <div
              key={i}
              className="flex justify-between text-sm text-slate-600 border-b border-slate-200 pb-1 last:border-0"
            >
              <span>#{log.raceNumber}</span>
              <span className="font-mono text-xs">
                {formatTime(log.startTime)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const FinishLineComponent = ({ user, riders, raceId }) => {
  const [finishing, setFinishing] = useState(null);
  const [manualNumber, setManualNumber] = useState("");
  const [localLogs, setLocalLogs] = useState(getLocalBackup("finishes"));
  const [showSoloStart, setShowSoloStart] = useState(false); // Toggle for Solo/Offline mode
  const [soloNumber, setSoloNumber] = useState("");

  const ridersOnTrack = useMemo(() => {
    return riders
      .filter((r) => r.status === "ON_TRACK")
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  }, [riders]);

  const finishedRiders = useMemo(() => {
    return riders
      .filter((r) => r.status === "FINISHED")
      .sort((a, b) => new Date(b.finishTime) - new Date(a.finishTime));
  }, [riders]);

  // Handle Solo Start (Manual Start)
  const handleSoloStart = async (e) => {
    e.preventDefault();
    if (!soloNumber.trim() || !user) return;

    const num = soloNumber.trim();
    const now = new Date();

    const raceData = {
      raceId: raceId,
      raceNumber: num,
      startTime: now.toISOString(),
      status: "ON_TRACK",
      startedBy: user.uid,
      finishTime: null,
      raceTime: null,
      timestamp: serverTimestamp(),
    };

    try {
      saveToLocalBackup("starts", raceData);
      await addDoc(
        collection(db, "artifacts", appId, "public", "data", "mtb_riders"),
        raceData
      );
      setSoloNumber("");
      setShowSoloStart(false);
    } catch (error) {
      console.error("Error starting rider:", error);
    }
  };

  const handleFinish = async (rider) => {
    if (!user) return;
    setFinishing(rider.id);
    const now = new Date();
    const nowIso = now.toISOString();
    const calculatedRaceTime = calculateRaceTime(rider.startTime, nowIso);

    const finishData = {
      status: "FINISHED",
      finishTime: nowIso,
      finishedBy: user.uid,
      raceTime: calculatedRaceTime,
    };

    try {
      saveToLocalBackup("finishes", { ...rider, ...finishData });
      setLocalLogs(getLocalBackup("finishes"));
      const docRef = doc(
        db,
        "artifacts",
        appId,
        "public",
        "data",
        "mtb_riders",
        rider.id
      );
      await updateDoc(docRef, finishData);
    } catch (error) {
      console.error("Error finishing rider:", error);
    } finally {
      setFinishing(null);
      setManualNumber("");
    }
  };

  const handleManualFinish = (e) => {
    e.preventDefault();
    const num = manualNumber.trim();
    if (!num) return;
    const rider = ridersOnTrack.find((r) => r.raceNumber === num);
    if (rider) {
      handleFinish(rider);
    } else {
      alert(`Rider #${num} not found on track for Race ID: ${raceId}!`);
    }
  };

  const getElapsedTime = (startTime) => {
    const start = new Date(startTime);
    const now = new Date();
    const diffMs = now - start;
    const minutes = Math.floor(diffMs / 60000);
    return `${minutes}m`;
  };

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6">
      {/* SOLO START TOGGLE */}
      <div className="bg-slate-200 rounded-xl p-2 flex justify-between items-center">
        <span className="text-xs font-bold text-slate-600 uppercase ml-2">
          Single User Mode
        </span>
        <button
          onClick={() => setShowSoloStart(!showSoloStart)}
          className={`text-sm font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
            showSoloStart
              ? "bg-slate-300 text-slate-700"
              : "bg-white text-blue-600 shadow-sm"
          }`}
        >
          {showSoloStart ? (
            "Hide Start Panel"
          ) : (
            <>
              <Zap size={16} /> Solo Start
            </>
          )}
        </button>
      </div>

      {/* SOLO START PANEL */}
      {showSoloStart && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 animate-in fade-in slide-in-from-top-2">
          <h3 className="text-sm font-bold text-blue-800 mb-3 flex items-center gap-2">
            <Zap size={16} /> Start Rider (Solo Mode)
          </h3>
          <form onSubmit={handleSoloStart} className="flex gap-3">
            <input
              type="number"
              pattern="[0-9]*"
              inputMode="numeric"
              value={soloNumber}
              onChange={(e) => setSoloNumber(e.target.value)}
              className="flex-1 text-xl font-bold p-3 text-center border-2 border-blue-200 rounded-lg focus:border-blue-500 outline-none"
              placeholder="#"
              autoFocus
            />
            <button
              type="submit"
              disabled={!soloNumber}
              className="bg-green-600 hover:bg-green-700 text-white font-bold px-6 rounded-lg shadow-md active:scale-95 transition-all"
            >
              START
            </button>
          </form>
          <p className="text-xs text-blue-600 mt-2">
            Use this when you are managing both start/finish lines. Rider will
            appear "On Track" immediately.
          </p>
        </div>
      )}

      {/* MANUAL FINISH SECTION */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Flag className="text-red-600" size={20} />
          Manual Finish
        </h2>

        <form onSubmit={handleManualFinish} className="flex gap-3">
          <input
            type="number"
            pattern="[0-9]*"
            inputMode="numeric"
            value={manualNumber}
            onChange={(e) => setManualNumber(e.target.value)}
            className="flex-1 text-2xl font-bold p-3 text-center border-2 border-slate-300 rounded-lg focus:border-red-500 focus:ring-4 focus:ring-red-100 outline-none transition-all placeholder:text-slate-200"
            placeholder="#"
          />
          <button
            type="submit"
            disabled={!manualNumber || finishing}
            className="bg-red-600 hover:bg-red-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold px-6 rounded-lg shadow-md active:scale-95 transition-all flex items-center gap-2"
          >
            {finishing ? <RefreshCw className="animate-spin" /> : "FINISH"}
          </button>
        </form>
      </div>

      {/* ON TRACK LIST */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <List className="text-blue-600" size={20} />
            On Track ({ridersOnTrack.length})
          </span>
          {ridersOnTrack.length > 0 && (
            <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded">
              Tap to Finish
            </span>
          )}
        </h2>

        {ridersOnTrack.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
            <p className="text-slate-400">No riders currently on track</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ridersOnTrack.map((rider) => (
              <div
                key={rider.id}
                className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex justify-between items-center hover:border-blue-300 transition-colors"
              >
                <div>
                  <div className="text-3xl font-black text-slate-800">
                    #{rider.raceNumber}
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock size={12} /> Started: {formatTime(rider.startTime)}
                    <span className="text-blue-600 font-medium ml-1">
                      ({getElapsedTime(rider.startTime)})
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleFinish(rider)}
                  disabled={finishing === rider.id}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-4 rounded-lg shadow-md active:scale-95 transition-all"
                >
                  {finishing === rider.id ? (
                    <RefreshCw className="animate-spin" />
                  ) : (
                    "FINISH"
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RECENTLY FINISHED */}
      {finishedRiders.length > 0 && (
        <div className="opacity-75">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">
            Recently Finished
          </h3>
          <div className="bg-slate-50 rounded-xl overflow-hidden border border-slate-200">
            {finishedRiders.slice(0, 5).map((rider) => (
              <div
                key={rider.id}
                className="p-3 border-b border-slate-200 last:border-0 flex justify-between items-center bg-white"
              >
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-700 w-12">
                    #{rider.raceNumber}
                  </span>
                  <span className="text-xs text-slate-400">
                    ({formatTime(rider.finishTime)})
                  </span>
                </div>
                <div className="flex items-center gap-2 text-green-700">
                  <Timer size={16} />
                  <span className="font-mono text-lg font-bold tracking-tight">
                    {rider.raceTime ||
                      calculateRaceTime(rider.startTime, rider.finishTime)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LOCAL LOGS */}
      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 mt-8">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          Local Backup Log (Finishes)
        </h3>
        <div className="space-y-2">
          {localLogs.slice(0, 5).map((log, i) => (
            <div
              key={i}
              className="flex justify-between items-center text-sm text-slate-600 border-b border-slate-200 pb-1 last:border-0"
            >
              <span>#{log.raceNumber}</span>
              <span className="font-mono text-xs font-bold text-green-600">
                {log.raceTime || "--:--"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState("starter");
  const [raceId, setRaceId] = useState("");
  const [user, setUser] = useState(null);
  const [riders, setRiders] = useState([]);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Monitor Connectivity
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // 1. Authenticate
  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (e) {
        console.error("Auth failed", e);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Real-time Listener filtered by RACE ID
  useEffect(() => {
    if (!user || !raceId) return;

    const q = collection(
      db,
      "artifacts",
      appId,
      "public",
      "data",
      "mtb_riders"
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((doc) => doc.raceId === raceId); // CLIENT-SIDE FILTERING

        setRiders(data);
      },
      (error) => {
        console.error("Firestore sync error:", error);
      }
    );

    return () => unsubscribe();
  }, [user, raceId]);

  if (loadingAuth) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900 text-white">
        Loading Timing System...
      </div>
    );
  }

  // SHOW LOGIN SCREEN IF NO RACE ID
  if (!raceId) {
    return <LoginScreen onJoin={setRaceId} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 font-sans pb-20">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        raceId={raceId}
        onLogout={() => setRaceId("")}
        isOnline={isOnline}
      />

      <main className="animate-in fade-in duration-300">
        {activeTab === "starter" ? (
          <StarterComponent user={user} raceId={raceId} />
        ) : activeTab === "finish" ? (
          <FinishLineComponent
            user={user}
            riders={riders}
            raceId={raceId}
            isOnline={isOnline}
          />
        ) : (
          <ResultsComponent riders={riders} raceId={raceId} />
        )}
      </main>
    </div>
  );
}
