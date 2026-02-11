// components/Starter/SyncButton.jsx
import React from 'react';
import { RefreshCw } from 'lucide-react'; // Using Lucide for a clean icon
import { useRaceStore } from '../../store/raceStore';

export const SyncButton = () => {
  const sync = useRaceStore((state) => state.syncSessionRiders);
  const loading = useRaceStore((state) => state.loading);

  return (
    <button
      onClick={sync}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all
        ${loading 
          ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
          : 'bg-blue-100 text-blue-600 hover:bg-blue-200 active:scale-95'
        }`}
    >
      <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
      {loading ? "Syncing..." : "Sync Riders"}
    </button>
  );
};