import React from "react";

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
export default Header;
