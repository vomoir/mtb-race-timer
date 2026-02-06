import { useRaceStore } from "../store/raceStore";
export const TrackPicker = () => {
  const { trackName, setTrack, riders, eventName } = useRaceStore();
  
  // Get all unique tracks already created for this specific event
  const existingTracks = [...new Set(riders
    .filter(r => r.eventName === eventName)
    .map(r => r.trackName))].filter(Boolean);

  return (
    <div className="bg-slate-100 p-4 rounded-xl mb-6 border border-slate-200">
      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Active Race Track</label>
      <div className="flex gap-2">
        <select 
          value={trackName}
          onChange={(e) => setTrack(e.target.value)}
          className="flex-1 p-2 rounded border border-slate-300 bg-white font-mono text-sm"
        >
          <option value="">-- Select or Create Track --</option>
          {existingTracks.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        
        <button 
          onClick={() => {
            const newTrack = prompt("Enter New Track/Stage Name:");
            if (newTrack) setTrack(newTrack);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-bold"
        >
          + NEW
        </button>
      </div>
      {!trackName && <p className="text-red-500 text-[10px] mt-1 font-bold">⚠️ PLEASE SELECT A TRACK BEFORE ADDING RIDERS</p>}
    </div>
  );
};