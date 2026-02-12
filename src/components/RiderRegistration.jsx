import React, { useState, useEffect } from "react";
import { useRaceStore } from "../store/raceStore";
import { TrackPicker } from "./TrackPicker";
import {RiderImporter} from "./RiderImporter";

import { Copy, Users, ChevronRight, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

export const RiderRegistration = () => {
  const { riders, eventName, trackName, cloneRidersFromTrack, fetchEventResults } = useRaceStore();
  const [isCopying, setIsCopying] = useState(false);
  const [otherTracks, setOtherTracks] = useState([]);

  // Get a list of unique tracks in this event that AREN'T the current one
  useEffect(() => {
    const loadTracks = async () => {
      if (!eventName) return;
      const allRiders = await fetchEventResults(eventName);
      const tracks = [...new Set(allRiders.filter(r => r.trackName && r.trackName !== trackName).map(r => r.trackName))].sort();
      setOtherTracks(tracks);
    };
    loadTracks();
  }, [eventName, trackName, fetchEventResults]);

  const handleCopy = async (sourceTrack) => {
    setIsCopying(true);
    const result = await cloneRidersFromTrack(sourceTrack);
    setIsCopying(false);
    
    if (result.success) {
      toast.success(`Successfully copied ${result.count} riders to ${trackName}`);
    } else {
      toast.error("No riders found in that track.");
    }
  };
return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2">
          <Users className="text-blue-600" />
          Rider Management
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          Currently managing riders for: <span className="font-bold text-slate-900">{trackName}</span>
        </p>

		    <TrackPicker />
        
        {/* Option 1: Copy from another track */}
        {otherTracks.length > 0 && (
          <div className="mb-8 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <h3 className="text-xs font-black text-blue-800 uppercase tracking-wider mb-3">
              Carry Over from previous track
            </h3>
            <div className="space-y-2">
              {otherTracks.map(other => (
                <button
                  key={other}
                  disabled={isCopying}
                  onClick={() => handleCopy(other)}
                  className="w-full flex items-center justify-between bg-white p-3 rounded-lg border border-blue-200 hover:border-blue-500 hover:shadow-md transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <Copy size={16} className="text-blue-400" />
                    <span className="font-semibold text-slate-700">{other}</span>
                  </div>
                  <div className="flex items-center gap-2 text-blue-600 text-xs font-bold">
                    CLONE LIST <ChevronRight size={14} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Option 2: New Import (Your existing CSV logic) */}
        <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center">
          <h3 className="text-sm font-bold text-slate-700 mb-2">Manual Import</h3>
          <p className="text-xs text-slate-400 mb-4">Upload a new CSV for this track only</p>
          <RiderImporter /> {/* Your existing component */}
        </div>
      </div>

      {/* Safety Notice */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg text-amber-800 text-xs">
        <AlertCircle size={16} className="shrink-0" />
        <p>
          Cloning riders copies their Name, Bib, and Category to <strong>{trackName}</strong>. 
          Timing data from the source track will not be affected.
        </p>
      </div>
    </div>
  );
};