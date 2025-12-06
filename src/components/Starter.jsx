import React from "react";
import { Play, RefreshCw, CheckCircle, ArrowUp } from "lucide-react";
import { useRaceStore } from "../store/raceStore";
import { formatTime } from "../store/utils";
const StarterComponent = ({ user }) => {
  const {
    raceNumber,
    raceId,
    loading,
    lastStarted,
    localLogs,
    setRaceNumber,
    handleStart,
    riders,
  } = useRaceStore();

  const onSubmit = (e) => {
    e.preventDefault();
    handleStart(user, raceId);
  };
  const addRider = (riderNumber) => {
    setRaceNumber(riderNumber);
  };
  // const [searchTerm, setSearchTerm] = useState("");
  // Local filter for "WAITING" riders
  const waitingRiders = riders.filter((r) => r.status === "WAITING");

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
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-500 mb-1">
              Race Number
            </label>
            <input
              id="riderNumber"
              type="riderNumber"
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
        <div className="flex-1 overflow-y-auto p-2 space-y-2 bg-slate-50/30">
          {waitingRiders.map((rider) => (
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

export default StarterComponent;
