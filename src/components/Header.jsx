import React, { useState } from "react";
import { useRaceStore } from "../store/raceStore";
import { useNavigate, useLocation } from "react-router-dom"; // Add these
import { Clock, Wifi, WifiOff, Hash, Play, Flag, Trophy, File, Share2, LogOut, Menu, X } from "lucide-react";
import {RaceClock} from "./RaceClock";
import { SyncButton } from "./starter/SyncButton";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation(); // This tells us the current URL
  
  const { raceId, isOnline, trackName, setTrack, eventName } = useRaceStore();

  // Helper to check if a tab is active based on the URL
  const isActive = (path) => location.pathname === path;
// components/Header.jsx
const SwitchEventButton = () => {
  const logout = useRaceStore(state => state.logout);
  
  return (
    <button 
      onClick={logout}
      className="text-xs font-bold text-slate-400 hover:text-red-500 flex items-center gap-1"
      title="Exit Event"
    >
      <LogOut size={16} />
      <span className="hidden sm:inline">EXIT</span>
    </button>
  );
};

  const shareUrl = eventName && trackName && trackName !== 'NO TRACK' 
    ? `${window.location.origin}/?event=${encodeURIComponent(eventName)}&track=${encodeURIComponent(trackName)}`
    : null;

  const handleNav = (path) => {
    navigate(path);
    setIsMenuOpen(false);
  };

  return (
    <div className="bg-slate-900 text-white p-4 sticky top-0 z-50 shadow-lg">
      <div className="max-w-2xl mx-auto mb-4 space-y-4">
        <h1 className="text-xl font-bold flex items-center justify-center gap-2">
          <Clock className="text-yellow-400" />
          MTB Timing Pro - {eventName || "No Event Selected"}
        </h1>
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
          <RaceClock />
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
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-slate-500 font-bold uppercase">Active Track</label>
              <div className="flex gap-2">
                <input 
                  type="text"
                  value={trackName}
                  onChange={(e) => setTrack(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-orange-400 focus:border-orange-500 outline-none uppercase"
                  placeholder="NO TRACK"
                />
              </div>
            </div>
          </div>

              <div className="flex gap-2">
                <SyncButton />
                {shareUrl && (
                  <a 
                    href={shareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Finisher Link (Right-click to copy)"
                    className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white transition-colors flex items-center justify-center"
                  >
                    <Share2 size={16} />
                  </a>
                )}
                {/* Other header actions like Clock or Finish List */}
              </div>
          <SwitchEventButton  /> 
       </div>
      </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="sm:hidden w-full bg-slate-800 text-slate-300 hover:text-white py-2 rounded-lg font-bold flex items-center justify-center gap-2 mb-2 transition-colors"
        >
          {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          <span>{isMenuOpen ? "CLOSE MENU" : "MENU"}</span>
        </button>

      <div className={`${isMenuOpen ? "grid" : "hidden"} sm:grid grid-cols-1 sm:grid-cols-4 gap-1 bg-slate-800 rounded-lg p-1`}>
        <button
          onClick={() => handleNav("/registration")}
          className={`flex items-center justify-center gap-2 py-2 sm:py-3 px-2 rounded-md transition-all font-semibold text-xs sm:text-sm whitespace-nowrap ${
            isActive("/registration")
              ? "bg-green-600 text-white shadow-md"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <File size={16} /> Register
        </button>

        <button
          onClick={() => handleNav("/starter")}
          className={`flex items-center justify-center gap-2 py-2 sm:py-3 px-2 rounded-md transition-all font-semibold text-xs sm:text-sm whitespace-nowrap ${
            isActive("/starter")
              ? "bg-green-600 text-white shadow-md"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Play size={16} /> Starter
        </button>

        <button
          onClick={() => handleNav("/finish")}
          className={`flex items-center justify-center gap-2 py-2 sm:py-3 px-2 rounded-md transition-all font-semibold text-xs sm:text-sm whitespace-nowrap ${
            isActive("/finish")
              ? "bg-red-600 text-white shadow-md"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Flag size={16} /> Finisher
        </button>

        <button
          onClick={() => handleNav("/results")}
          className={`flex items-center justify-center gap-2 py-2 sm:py-3 px-2 rounded-md transition-all font-semibold text-xs sm:text-sm whitespace-nowrap ${
            isActive("/results")
              ? "bg-blue-600 text-white shadow-md"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Trophy size={16} /> Resulter
        </button>
      </div>
      </div>
    </div>
  );
};

export default Header;