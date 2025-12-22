import React, { useState } from "react";
import toast from "react-hot-toast";
import {
  List,
  Clock,
  RefreshCw,
  Timer,
  Zap,
  Flag,
  Save,
  Trash2,
} from "lucide-react";
import { Card } from "./Card";
import { useRaceStore } from "../store/raceStore"; // Import the hook
import { useRiderLists } from "../hooks/useRiderLists";
import { getTime } from "../utils/utils.js";

import { getRiderOnTrack } from "../utils/utils"; // adjust imports

const FinishLine = () => {
  const {
    finishing,
    finishLogs,
    showSoloStart,
    soloMode,
    soloNumber,
    setSoloNumber,
    setSoloMode,
    handleSoloStart,
    handleFinish,
  } = useRaceStore();

  const [pendingFinishes, setPendingFinishes] = useState([]);
  const { ridersOnTrack, finishedRiders } = useRiderLists();
  const handleCapture = () => {
    // const now = new Date();
    setPendingFinishes((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        finishTime: getTime(),
        // displayTime: now.toLocaleTimeString("en-US", { hour12: false }),
        displayTime: getTime(),
        riderNumber: "",
      },
    ]);
  };

  const handlePendingSave = (pendingItem) => {
    if (!pendingItem.riderNumber) return;
    // Check if rider is actually on track and get them
    const riderOnTrack = getRiderOnTrack(
      ridersOnTrack,
      pendingItem.riderNumber
    );

    if (riderOnTrack) {
      handleFinish(riderOnTrack);
      setPendingFinishes((prev) =>
        prev.filter((p) => p.id !== riderOnTrack.riderNumber)
      );
    } else {
      toast(`Rider #${riderOnTrack.riderNumber} is not currently on track!`);
    }
  };

  const handleSave = (rider) => {
    if (!rider.riderNumber) return;
    // Check if rider is actually on track
    const riderOnTrack = getRiderOnTrack(ridersOnTrack, rider.riderNumber);
    if (riderOnTrack) {
      riderOnTrack.finishTime = rider.finishTime ?? getTime();
      handleFinish(riderOnTrack);
      setPendingFinishes((prev) =>
        prev.filter((p) => p.id !== riderOnTrack.riderNumber)
      );
    } else {
      toast(`Rider #${rider.riderNumber} is not currently on track!`);
    }
  };

  const removePending = (rider) => {
    setPendingFinishes((prev) => prev.filter((p) => p.id !== rider.id));
  };

  const savePending = (rider) => {
    handleSave(rider);
    removePending(rider);
  };
  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6">
      {/* SOLO START TOGGLE */}
      <div className="bg-slate-200 rounded-xl p-2 flex justify-between items-center">
        <span className="text-xs font-bold text-slate-600 uppercase ml-2">
          Single User Mode
        </span>
        <button
          onClick={() => setSoloMode(!showSoloStart)}
          className={`text-sm font-bold px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
            showSoloStart
              ? "bg-slate-300 text-slate-700"
              : "bg-white text-blue-600 shadow-sm"
          }`}
        >
          {showSoloStart ? (
            "Hide Solo Start Panel"
          ) : (
            <>
              <Zap size={16} /> Solo Start
            </>
          )}
        </button>
      </div>
      {/* Capture finish Section */}
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
                onKeyDown={(e) => e.key === "Enter" && handlePendingSave(item)}
                placeholder="#"
                className="flex-1 w-12 font-bold p-1 text-center border border-slate-300 rounded"
              />
              <button
                title="Save Captured Time"
                onClick={() => savePending(item)}
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

      {/* SOLO START PANEL */}
      {soloMode && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 animate-in fade-in slide-in-from-top-2">
          <h3 className="text-sm font-bold text-blue-800 mb-3 flex items-center gap-2">
            <Zap size={16} /> Start Rider (Solo Mode)
          </h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSoloStart(); // call Zustand action without event
              setSoloNumber("");
            }}
            className="flex gap-3"
          >
            <input
              type="riderNumber"
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
                    #{rider.riderNumber}
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock size={12} /> Started: {rider.startTime}
                    <span className="text-blue-600 font-medium ml-1">
                      {rider.elapsedTime}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleSave(rider)}
                  disabled={finishing === rider.riderNumber}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-4 rounded-lg shadow-md active:scale-95 transition-all"
                >
                  {finishing === rider.riderNumber ? (
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
                    #{rider.riderNumber}
                  </span>
                  <span className="text-xs text-slate-400">
                    {rider.finishTime}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-green-700">
                  <Timer size={16} />
                  <span className="font-mono text-lg font-bold tracking-tight">
                    {rider.raceTime}
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
          {finishLogs.slice(0, 5).map((log, i) => (
            <div
              key={i}
              className="flex justify-between items-center text-sm text-slate-600 border-b border-slate-200 pb-1 last:border-0"
            >
              <span>#{log.riderNumber}</span>
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
export default FinishLine;
