import React, { useState, useEffect } from "react";
import { useRaceStore } from "../store/raceStore";
import { TrackPicker } from "./TrackPicker";
import { RiderImporter } from "./RiderImporter";
import { Card } from './Card'; // Assuming you have a generic Card component

import { Copy, Users, ChevronRight, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

export const RiderRegistration = () => {
  const { eventName, trackName, fetchEventResults } = useRaceStore();
  const [isCopying, setIsCopying] = useState(false);
  const [otherTracks, setOtherTracks] = useState([]);  

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
      <RiderImporter />
    </div>
  );
};