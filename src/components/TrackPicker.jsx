import React, {useRef, useState} from "react";
import TrackDialog from "./TrackDialog";
import { useRaceStore } from "../store/raceStore";
import { Pencil, Lock } from "lucide-react";

// 2. Wrap it with forwardRef
// const ForwardedTrackDialog = forwardRef(TrackDialog);

export const TrackPicker = () => {
  const { trackName, setTrack, riders, eventName, renameTrack } = useRaceStore();
  
  // Get all unique tracks already created for this specific event
  const existingTracks = [...new Set(riders
    .filter(r => r.eventName === eventName)
    .map(r => r.trackName))].filter(Boolean);

  // Guard Rail Logic
  const currentTrackRiders = riders.filter(r => r.trackName === trackName);
  const hasRiders = currentTrackRiders.length > 0;
  const allWaiting = currentTrackRiders.every(r => r.status === "WAITING");
  // Lock creation if we have riders but haven't started any (implies setup phase)
  const isLocked = hasRiders && allWaiting;

  const [dialogConfig, setDialogConfig] = useState({
    title: "Enter New Track/Stage Name",
    onSubmit: (val) => setTrack(val)
  });

  const openDialog = (mode) => {
    if (mode === 'rename') {
      setDialogConfig({ title: `Rename ${trackName}`, onSubmit: (val) => renameTrack(val) });
    } else {
      setDialogConfig({ title: "Enter New Track/Stage Name", onSubmit: (val) => setTrack(val) });
    }
    dialogRef.current.open();
  };

  const dialogRef = useRef(null);

  return (
    <div className="bg-slate-100 p-4 rounded-xl mb-6 border border-slate-200">
      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Active Race Track</label>
      <div className="flex flex-col md:flex-row gap-2">
        <select 
          value={trackName}
          onChange={(e) => setTrack(e.target.value)}
          className="flex-1 w-full p-2 rounded border border-slate-300 bg-white font-mono text-sm"
        >
          <option value="">Select ↓ or Add new Track →</option>
          {existingTracks.map(t => <option key={t} value={t}>{t}</option>)}
        </select>        

        {isLocked ? (
          <button
            onClick={() => openDialog('rename')}
            className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded text-sm font-bold flex items-center justify-center gap-2"
            title="Track has riders. Rename instead of creating new."
          >
            <Pencil size={14} /> RENAME
          </button>
        ) : (
          <button
            onClick={() => openDialog('new')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-bold"
          >
            + NEW
          </button>
        )}

        <TrackDialog
          ref={dialogRef}
          title={dialogConfig.title}
          placeholder="Track name…"
          onSubmit={dialogConfig.onSubmit}
        />

      </div>
      {isLocked && (
        <p className="text-amber-600 text-[10px] mt-1 font-bold flex items-center gap-1">
          <Lock size={10} /> Track locked for new creation. Rename allowed.
        </p>
      )}
      {!trackName && <p className="text-red-500 text-[10px] mt-1 font-bold">⚠️ PLEASE SELECT A TRACK BEFORE ADDING RIDERS</p>}
    </div>
  );
};