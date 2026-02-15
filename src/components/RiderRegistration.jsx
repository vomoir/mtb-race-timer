import React, { useState, useEffect } from "react";
import { useRaceStore } from "../store/raceStore";
import { TrackPicker } from "./TrackPicker";
import { RiderImporter } from "./RiderImporter";
import { Card } from './Card'; // Assuming you have a generic Card component

import { Copy, Users, ChevronRight, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

export const RiderRegistration = () => {
  const { eventName, trackName, cloneRidersFromTrack, fetchEventResults } = useRaceStore();
  const [isCopying, setIsCopying] = useState(false);
  const [otherTracks, setOtherTracks] = useState([]);
  const [selectedTrackToClone, setSelectedTrackToClone] = useState('');

  // Get a list of unique tracks in this event that AREN'T the current one
  useEffect(() => {
    const loadTracks = async () => {
      if (!eventName) return;
      const allRiders = await fetchEventResults(eventName);
      const tracks = [...new Set(allRiders.filter(r => r.trackName && r.trackName !== trackName).map(r => r.trackName))].sort();
      setOtherTracks(tracks);
      if (tracks.length > 0) {
        setSelectedTrackToClone(tracks[0]); // Default to the first track
      }
    };
    loadTracks();
  }, [eventName, trackName, fetchEventResults]);

  const handleCopy = async () => {
    if (!selectedTrackToClone) {
      toast.error("Please select a track to clone from.");
      return;
    }
    setIsCopying(true);
    const result = await cloneRidersFromTrack(selectedTrackToClone);
    setIsCopying(false);
    
    if (result.success) {
      toast.success(`Successfully copied ${result.count} riders to ${trackName}`);
    } else {
      toast.error(`No riders found in ${selectedTrackToClone}.`);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-2 sm:p-4 space-y-6">
      
      <TrackPicker />
      
      {/* Option 1: Copy from another track, now using a dropdown */}
      {otherTracks.length > 0 && (
        <Card>
          <div className="p-4">
            <h3 className="text-sm font-black text-blue-800 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Copy size={14} />
              Clone from Previous Stage
            </h3>
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={selectedTrackToClone}
                onChange={(e) => setSelectedTrackToClone(e.target.value)}
                className="flex-grow w-full p-2 rounded-lg border border-slate-300 bg-white font-semibold text-slate-700"
                disabled={isCopying}
              >
                {otherTracks.map(other => (
                  <option key={other} value={other}>{other}</option>
                ))}
              </select>
              <button
                disabled={isCopying || !selectedTrackToClone}
                onClick={handleCopy}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 disabled:bg-slate-400 transition-all"
              >
                {isCopying ? "Cloning..." : "Clone Riders"}
                <ChevronRight size={14} />
              </button>
            </div>
             <div className="flex items-start gap-2 p-3 mt-3 bg-blue-50/50 rounded-lg text-blue-800/80 text-xs">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <p>
                Clones Name, Bib, and Category to <strong>{trackName}</strong>. Timing data is NOT carried over.
              </p>
            </div>
          </div>
        </Card>
      )}
      
      <RiderImporter />

    </div>
  );
};