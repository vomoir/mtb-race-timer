import React, { useState } from "react";
import { useRaceStore } from "../store/raceStore";
import { useNavigate, useLocation } from "react-router-dom";
import { Clock, Wifi, WifiOff, Play, Flag, Trophy, File, Share2, LogOut, Menu, X } from "lucide-react";
import { RaceClock } from "./RaceClock";
import { SyncButton } from "./starter/SyncButton";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  const isOnline = useRaceStore((state) => state.isOnline);
  const trackName = useRaceStore((state) => state.trackName);
  const tracks = useRaceStore((state) => state.tracks);
  const setTrack = useRaceStore((state) => state.setTrack);
  const eventName = useRaceStore((state) => state.eventName);
  const logout = useRaceStore((state) => state.logout);

  const isActive = (path) => location.pathname === path;

  const handleNav = (path) => {
    navigate(path);
    setIsMenuOpen(false);
  };
  
  const shareUrl = eventName && trackName && trackName !== 'NO TRACK' 
    ? `${window.location.origin}/?event=${encodeURIComponent(eventName)}&track=${encodeURIComponent(trackName)}`
    : null;

  return (
    <header className="bg-slate-900 text-white sticky top-0 z-50 shadow-lg font-sans">
      <div className="max-w-4xl mx-auto px-2">
        {/* --- Main Header Bar --- */}
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold truncate">
              {eventName || "No Event"}
              {trackName && trackName !== "NO TRACK" && (
                <span className="text-slate-400 font-medium"> / {trackName}</span>
              )}
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden sm:block">
              <RaceClock />
            </div>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="sm:hidden p-2 rounded-md bg-slate-800 hover:bg-slate-700 transition-colors"
              aria-label="Toggle Menu"
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* --- Collapsible Menu --- */}
        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isMenuOpen ? 'max-h-screen' : 'max-h-0'} sm:max-h-full sm:overflow-visible`}>
          {/* --- Navigation Tabs --- */}
          <nav className="grid grid-cols-2 sm:grid-cols-4 gap-1 bg-slate-800/50 rounded-lg p-1">
            {[
              { path: "/registration", label: "Register", icon: File, color: "green" },
              { path: "/starter", label: "Starter", icon: Play, color: "green" },
              { path: "/finish", label: "Finisher", icon: Flag, color: "red" },
              { path: "/results", label: "Results", icon: Trophy, color: "blue" },
            ].map(({ path, label, icon: Icon, color }) => (
              <button
                key={path}
                onClick={() => handleNav(path)}
                className={`flex items-center justify-center gap-2 py-2.5 sm:py-3 px-2 rounded-md transition-all font-semibold text-xs sm:text-sm whitespace-nowrap ${
                  isActive(path)
                    ? `bg-${color}-600 text-white shadow-md`
                    : "text-slate-300 hover:bg-slate-700/50 hover:text-white"
                }`}
              >
                <Icon size={14} /> {label}
              </button>
            ))}
          </nav>

          {/* --- Secondary Controls (Inside Menu on Mobile) --- */}
          <div className="sm:hidden border-t-2 border-slate-800/50 my-2" />
          
          <div className="py-2 grid grid-cols-1 sm:grid-cols-[auto_1fr_auto] items-center gap-3 text-xs">
            {/* Online/Offline Status */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full font-bold ${
                isOnline
                  ? "bg-green-900/50 text-green-300 border border-green-800/50"
                  : "bg-red-900/50 text-red-300 border border-red-800/50"
              }`}
            >
              {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
              <span>{isOnline ? "ONLINE" : "OFFLINE"}</span>
            </div>

            {/* Track Select and Actions */}
            <div className="flex-grow flex items-center justify-center gap-2 bg-slate-800/50 p-1.5 rounded-lg min-w-0">
              <label htmlFor="trackSelect" className="font-bold text-slate-400 pl-1 shrink-0">TRACK</label>
              <select 
                id="trackSelect"
                value={trackName}
                onChange={(e) => setTrack(e.target.value)}
                className="flex-grow bg-slate-700/80 border border-slate-600 rounded px-2 py-1 font-mono text-orange-400 focus:border-orange-500 outline-none uppercase min-w-0"
              >
                <option value="NO TRACK">NO TRACK</option>
                {tracks?.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <SyncButton />
              {shareUrl && (
                <a 
                  href={shareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Share Finisher Link"
                  className="p-2 rounded-md bg-slate-700 hover:bg-slate-600 text-white transition-colors shrink-0"
                >
                  <Share2 size={16} />
                </a>
              )}
            </div>

            {/* Exit Button */}
            <button 
              onClick={logout}
              className="font-bold text-slate-400 hover:text-red-500 flex items-center justify-center gap-1.5 p-2 rounded-lg hover:bg-slate-800/50"
              title="Exit Event"
            >
              <LogOut size={14} />
              <span>EXIT</span>
            </button>
          </div>
          <div className="sm:hidden pb-2 text-center">
            <RaceClock />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;