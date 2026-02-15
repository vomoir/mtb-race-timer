import React, { useRef, useState } from "react";
import { Play, RefreshCw, Users, Clock, CheckCircle } from "lucide-react";
import { useRaceStore } from "../store/raceStore";
import { formatTime } from "../utils/utils";
import { useRiderLists } from "../hooks/useRiderLists";
import { CategoryFilter } from "./starter/CategoryFilter";
import ConfirmDialog from "./ConfirmDialog";
import { Card } from "./Card";

const StarterComponent = () => {
  const {
    riderNumber,
    loading,
    lastStarted,
    localLogs,
    setRiderNumber,
    handleStart,
    updateRiderStatus,
    categoryFilter
  } = useRaceStore();

  const [activeTab, setActiveTab] = useState("start");
  const [shouldAutoFocus, setShouldAutoFocus] = useState(true);

  const { waitingRiders } = useRiderLists();

  const filteredRiders = waitingRiders.filter(rider => {
    if (categoryFilter === "ALL") return true;
    return rider.category === categoryFilter;
  });
  
  const confirmDialog = useRef(null);

  const onSubmit = (e) => {
    e.preventDefault();
    handleStart(null, riderNumber);
    setRiderNumber("");
  };

  const selectRider = (riderNum) => {
    setRiderNumber(riderNum);
    setShouldAutoFocus(false);
    setActiveTab('start'); // Switch back to the start tab
  };

  const TabButton = ({ tabName, label, icon: Icon, count }) => (
    <button
      onClick={() => {
        setShouldAutoFocus(true);
        setActiveTab(tabName);
      }}
      className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold border-b-4 transition-colors ${
        activeTab === tabName
          ? 'text-blue-600 border-blue-600'
          : 'text-slate-500 border-transparent hover:text-slate-800'
      }`}
    >
      <Icon size={16} />
      <span>{label}</span>
      {count !== undefined && <span className="text-xs bg-slate-200 text-slate-600 font-bold rounded-full px-2 py-0.5">{count}</span>}
    </button>
  );

  return (
    <div className="max-w-md mx-auto p-2 sm:p-4">
      <Card className="overflow-hidden">
        {/* --- Tabs --- */}
        <div className="flex bg-slate-50 border-b border-slate-200">
          <TabButton tabName="start" label="Start" icon={Play} />
          <TabButton tabName="waiting" label="Waiting" icon={Users} count={waitingRiders.length} />
          <TabButton tabName="log" label="Log" icon={Clock} count={localLogs.length > 0 ? localLogs.length : undefined}/>
        </div>

        {/* --- Tab Content --- */}
        <div className="p-4 sm:p-6">
          {activeTab === 'start' && (
            <form onSubmit={onSubmit} className="space-y-4 animate-in fade-in">
              <div>
                <label htmlFor="riderNumber" className="block text-sm font-medium text-slate-500 mb-1">
                  Rider Number
                </label>
                <input
                  id="riderNumber"
                  type="text"
                  pattern="[0-9]*"
                  inputMode="numeric"
                  value={riderNumber}
                  onChange={(e) => setRiderNumber(e.target.value)}
                  className="w-full text-4xl sm:text-5xl font-bold p-4 text-center border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all placeholder:text-slate-300"
                  placeholder="Bib #"
                  autoFocus={shouldAutoFocus}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                 <button
                  type="button"
                  disabled={!riderNumber || loading}
                   onClick={() => {
                    confirmDialog.current.open({
                      title: "Mark DNS",
                      message: `Are you sure you want to mark rider #${riderNumber} as DNS (Did Not Start)?`,
                      onConfirm: () => {
                        updateRiderStatus(riderNumber, 'DNS');
                        setRiderNumber("");
                      }
                    });
                  }}
                  className="w-full bg-slate-400 hover:bg-slate-500 disabled:bg-slate-300 text-white text-sm font-bold py-3 rounded-lg transition-colors flex items-center justify-center"
                >
                  DNS
                </button>
                <button
                  type="submit"
                  disabled={!riderNumber || loading}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-slate-300 text-white text-lg font-bold py-3 rounded-lg shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
                >
                  {loading ? <RefreshCw className="animate-spin" /> : 'START'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'waiting' && (
            <div className="animate-in fade-in">
              <CategoryFilter />
              <p className="text-xs text-slate-400 mb-2">
                Showing {filteredRiders.length} of {waitingRiders.length} waiting riders. Tap a rider to start.
              </p>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredRiders.map((rider) => (
                  <button
                    key={rider.id}
                    onClick={() => selectRider(rider.riderNumber)}
                    className="w-full bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between text-left hover:border-blue-500 hover:bg-blue-50 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-100 text-slate-700 font-mono font-bold w-10 h-10 flex items-center justify-center rounded-md text-lg">
                        {rider.riderNumber}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">
                          {rider.firstName} {rider.lastName}
                        </div>
                        <div className="text-xs text-slate-500">{rider.category}</div>
                      </div>
                    </div>
                    <div className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play size={20} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'log' && (
            <div className="space-y-4 animate-in fade-in">
              {lastStarted && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                  <CheckCircle className="text-green-600" />
                  <div>
                    <p className="text-sm text-green-800 font-semibold">
                      Rider #{lastStarted.riderNumber} Started
                    </p>
                    <p className="text-xs text-green-600 font-mono">
                      {formatTime(lastStarted.time)}
                    </p>
                  </div>
                </div>
              )}
               <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Local Backup Log
                </h3>
                {localLogs.slice(0, 10).map((log, i) => (
                  <div
                    key={i}
                    className="flex justify-between text-sm text-slate-600 border-b border-slate-100 pb-1 last:border-0"
                  >
                    <span className="font-semibold">#{log.riderNumber}</span>
                    <span className="font-mono text-xs">{formatTime(log.startTime)}</span>
                  </div>
                ))}
                 {localLogs.length === 0 && <p className="text-xs text-slate-400">No starts recorded yet.</p>}
              </div>
            </div>
          )}
        </div>
      </Card>
      <ConfirmDialog ref={confirmDialog} />
    </div>
  );
};

export default StarterComponent;
