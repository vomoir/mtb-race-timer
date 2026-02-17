import React from "react";
import { Play, RefreshCw, CheckCircle, ArrowUp } from "lucide-react";
import { useRaceStore } from "../store/raceStore";

const SessionPicker = () => {
  const { activeRaceId, setActiveRaceId, riders } = useRaceStore();
  
  // Get unique race IDs from all riders in the database to fill the dropdown
  const availableRaces = [...new Set(riders.map(r => r.raceId))].filter(Boolean);

  return (
    <div className="session-picker">
      <label>Select Race Session: </label>
      <select 
        value={activeRaceId} 
        onChange={(e) => setActiveRaceId(e.target.value)}
      >
        {availableRaces.map(id => (
          <option key={id} value={id}>{id}</option>
        ))}
        <option value={new Date().toISOString().split('T')[0]}>+ New Session (Today)</option>
      </select>
    </div>
  );
};
export default SessionPicker;