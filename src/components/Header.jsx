import React from "react";
import { useRaceStore } from "../store/raceStore";
import { useNavigate, useLocation } from "react-router-dom"; // Add these
import { Clock, Wifi, WifiOff, Hash, Play, Flag, Trophy, File } from "lucide-react";

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation(); // This tells us the current URL
  
  const { raceId, setRaceId, isOnline, logout } = useRaceStore();

  const handleLogout = () => {
    // Clear the store and redirect to login
    setRaceId(""); 
    logout(); // Ensure this is called as a function
    navigate("/"); 
  };

  // Helper to check if a tab is active based on the URL
  const isActive = (path) => location.pathname === path;

  return (
    <div className="bg-slate-900 text-white p-4 sticky top-0 z-50 shadow-lg">
      <div className="flex justify-between items-center mb-4 max-w-2xl mx-auto">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Clock className="text-yellow-400" />
          MTB Timing Pro
        </h1>
        <div className="flex items-center gap-3">
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
            <span className="font-mono text-blue-200">{raceId || 'NO SESSION'}</span>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs text-slate-400 hover:text-white underline"
          >
            Exit
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex bg-slate-800 rounded-lg p-1 max-w-2xl mx-auto overflow-x-auto">
        <button
          onClick={() => navigate("/registration")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-2 rounded-md transition-all font-semibold whitespace-nowrap ${
            isActive("/registration")
              ? "bg-green-600 text-white shadow-md"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <File size={18} /> Register
        </button>

        <button
          onClick={() => navigate("/starter")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-2 rounded-md transition-all font-semibold whitespace-nowrap ${
            isActive("/starter")
              ? "bg-green-600 text-white shadow-md"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Play size={18} /> Starter
        </button>

        <button
          onClick={() => navigate("/finish")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-2 rounded-md transition-all font-semibold whitespace-nowrap ${
            isActive("/finish")
              ? "bg-red-600 text-white shadow-md"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Flag size={18} /> Finisher
        </button>

        <button
          onClick={() => navigate("/results")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 px-2 rounded-md transition-all font-semibold whitespace-nowrap ${
            isActive("/results")
              ? "bg-blue-600 text-white shadow-md"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Trophy size={18} /> Resulter
        </button>
      </div>
    </div>
  );
};

export default Header;