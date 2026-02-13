import React, { useRef } from "react";
import { Play, RefreshCw, RotateCcw, CheckCircle, ArrowUp } from "lucide-react";
import { useRaceStore } from "../store/raceStore";
import { formatTime } from "../utils/utils";
import { useRiderLists } from "../hooks/useRiderLists";
import SessionPicker from "./SessionPicker";
import { CategoryFilter } from "./starter/CategoryFilter";
import ConfirmDialog from "./ConfirmDialog";

const StarterComponent = () => {
  const {
    riderNumber,
    raceId,
    loading,
    lastStarted,
    localLogs,
    setRiderNumber,
    handleStart,
    updateRiderStatus,    
    resetRider,
    riders, 
    categoryFilter
  } = useRaceStore();

  // 🟢 The logic: Filter the list based on the selected category
  const filteredRiders = riders.filter(rider => {
    if (rider.status !== "WAITING") return false;
    if (categoryFilter === "ALL") return true;
    return rider.category === categoryFilter;
  });
  const onSubmit = (e) => {
    e.preventDefault();
    handleStart(raceId, riderNumber);
    setRiderNumber("");
  };
  // Moves rider from list of waiting riders into the "start zone"
  const addRider = (riderNumber) => {
    setRiderNumber(riderNumber);
  };
  // Local filter for "WAITING" riders  
  const { waitingRiders } = useRiderLists();
  const confirmDialog = useRef(null);

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Play className="text-green-600" size={20} />
          Start Rider
          <span className="text-xs font-normal text-slate-500 ml-auto bg-white px-2 py-1 rounded-full border border-slate-200">
            {waitingRiders.length} waiting
          </span>
        </h2>        
        <div className="session-picker">      
          <SessionPicker />
        </div>
        <div className="max-w-2xl mx-auto p-4">
          <h2 className="text-lg font-bold mb-2">Start Line</h2>
          
          {/* 1. Show the Filter Buttons */}
          <CategoryFilter />

          {/* 2. Show the Count */}
          <div className="text-[10px] text-slate-400 uppercase mb-2">
            Showing {filteredRiders.length} of {riders.length} total riders
          </div>

        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-500 mb-1">
              Rider Number
            </label>
            <input
              id="riderNumber"
              type="riderNumber"
              pattern="[0-9]*"
              inputMode="numeric"
              value={riderNumber}
              onChange={(e) => setRiderNumber(e.target.value)}
              className="w-full text-4xl font-bold p-4 text-center border-2 border-slate-300 rounded-lg focus:border-green-500 focus:ring-4 focus:ring-green-100 outline-none transition-all placeholder:text-slate-200"
              placeholder="000"
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={!riderNumber || loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xl font-bold py-6 rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            {loading ? <RefreshCw className="animate-spin" /> : "START RIDER"}
          </button>
          <button 
            type="button"
            disabled={!riderNumber}
            onClick={() => {
              confirmDialog.current.open({
                title: "Mark DNS",
                message: `Are you sure you want to mark rider #${riderNumber} as DNS?`,
                onConfirm: () => updateRiderStatus(riderNumber, 'DNS')
              });
            }}
            className="bg-slate-400 text-white px-3 py-1 rounded text-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            DNS
          </button>          
        </form>
        <div className="overflow-y-auto p-2 space-y-2 bg-slate-50/30 max-h-96 rounded-lg">        
          {filteredRiders.map((rider) => (
            <div
              key={rider.riderNumber}
              className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm flex items-center justify-between group hover:border-emerald-200"
            >          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-bold">{rider.raceTime}</p>
              <p className="text-xs text-slate-500">{rider.status}</p>
            </div>
            
            {/* The Undo Button */}
            {rider.status !== "WAITING" && (
              <button 
                onClick={() => {
                  confirmDialog.current.open({
                    title: "Reset Rider",
                    message: `Reset ${rider.firstName} to WAITING? All times will be lost.`,
                    onConfirm: () => resetRider(rider.id)
                  });
                }}
                className="p-2 text-slate-400 hover:text-orange-600 transition-colors"
                title="Reset Rider"
              >
                <RotateCcw size={16} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-slate-100 text-slate-700 font-mono font-bold w-10 h-10 flex items-center justify-center rounded-lg">
              {rider.riderNumber}
            </div>
            <div>
              <div className="font-bold text-slate-800">
                {rider.firstName} {rider.lastName}
              </div>
              <div className="text-xs text-slate-500">{rider.category}</div>
            </div>
          </div>
          <button
            onClick={() => addRider(rider.riderNumber)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-lg font-bold text-xs uppercase flex items-center gap-1"
          >
            Next to go <ArrowUp size={14} />
          </button>
        </div>
          ))}
        </div>
        {lastStarted && (
          <div className="mt-6 p-4 bg-green-50 border border-green-100 rounded-lg flex items-center justify-between animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <CheckCircle className="text-green-600" />
              <div>
                <p className="text-sm text-green-800 font-semibold">
                  Rider #{lastStarted.riderNumber} Started
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
              <span>#{log.riderNumber}</span>
              <span className="font-mono text-xs">
                {formatTime(log.startTime)}
              </span>
            </div>
          ))}
        </div>
      </div>
      <ConfirmDialog ref={confirmDialog} />
    </div>
  );
};

export default StarterComponent;
