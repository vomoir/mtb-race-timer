import React, { useMemo, useState, useEffect } from "react";
import { AlertCircle, XCircle, Ban, Clock, UserMinus } from "lucide-react";
import { useRaceStore } from "../store/raceStore";

export const NonFinishers = () => {
  const { eventName, fetchEventResults, tracks } = useRaceStore();
  const [allRiders, setAllRiders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadResults = async () => {
      if (eventName) {
        setLoading(true);
        const results = await fetchEventResults(eventName);
        setAllRiders(results);
        setLoading(false);
      }
    };
    loadResults();
  }, [eventName, fetchEventResults]);

  const nonFinisherData = useMemo(() => {
    if (!allRiders.length) return { nonFinishers: [], sortedTracks: [] };

    const riderMap = {};
    allRiders.forEach(r => {
      const key = `${r.riderNumber}-${r.category}`;
      if (!riderMap[key]) {
        riderMap[key] = {
          name: `${r.firstName} ${r.lastName}`,
          riderNumber: r.riderNumber,
          category: r.category,
          tracks: {}
        };
      }
      riderMap[key].tracks[r.trackName] = r.status;
    });

    const sortedTracks = tracks && tracks.length > 0 
      ? tracks 
      : [...new Set(allRiders.map(r => r.trackName))].sort();

    const nonFinishers = Object.values(riderMap)
      .filter(rider => {
        // Find if they have any non-finished status on any track
        return Object.values(rider.tracks).some(status => status !== "FINISHED");
      })
      .sort((a, b) => a.category.localeCompare(b.category) || Number(a.riderNumber) - Number(b.riderNumber));

    return { nonFinishers, sortedTracks };
  }, [allRiders, tracks]);

  if (loading) return <div className="p-12 text-center text-slate-500 italic animate-pulse">Loading non-finisher statuses...</div>;

  const { nonFinishers, sortedTracks } = nonFinisherData;

  if (nonFinishers.length === 0) {
    return (
      <div className="p-16 text-center text-slate-400 bg-slate-50/50 rounded-xl border-2 border-dashed border-slate-200">
        <div className="flex justify-center mb-4">
          <AlertCircle size={48} className="text-slate-200" />
        </div>
        <p className="font-bold uppercase tracking-widest text-xs">All Riders Accounted For</p>
        <p className="text-sm mt-1">No pending or retired riders found in the event database.</p>
      </div>
    );
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "DNS": return <Ban size={16} className="text-slate-400" title="Did Not Start" />;
      case "DNF": return <XCircle size={16} className="text-red-500" title="Did Not Finish" />;
      case "ON_TRACK": return <Clock size={16} className="text-blue-500 animate-pulse" title="On Track" />;
      case "WAITING": return <UserMinus size={16} className="text-orange-400" title="Waiting" />;
      case "FINISHED": return <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" title="Finished" />;
      default: return <span className="text-slate-300">-</span>;
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-2 mb-6">
        <AlertCircle className="text-red-500" size={24} />
        <h2 className="text-2xl font-black italic text-slate-900 uppercase">Non-Finisher Tracker</h2>
      </div>

      <p className="text-sm text-slate-500 mb-4 bg-red-50 p-3 rounded-lg border border-red-100">
        Monitoring riders who have <strong>not yet finished</strong> one or more tracks. 
        Use this to identify riders who have retired or are still out on course.
      </p>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] tracking-widest border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Rider</th>
                <th className="px-6 py-4">Category</th>
                {sortedTracks.map(track => (
                  <th key={track} className="px-4 py-4 text-center whitespace-nowrap">{track}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {nonFinishers.map(rider => (
                <tr key={`${rider.riderNumber}-${rider.category}`} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800">{rider.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono font-bold tracking-tighter">BIB #{rider.riderNumber}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-black uppercase text-slate-500 bg-slate-100 px-2 py-1 rounded">
                      {rider.category}
                    </span>
                  </td>
                  {sortedTracks.map(track => (
                    <td key={track} className="px-4 py-4 text-center">
                      <div className="flex justify-center">
                        {getStatusIcon(rider.tracks[track])}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Finished
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
          <Ban size={16} className="text-slate-400" /> DNS (Did Not Start)
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
          <XCircle size={16} className="text-red-500" /> DNF (Did Not Finish)
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
          <Clock size={16} className="text-blue-500" /> On Track
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
          <UserMinus size={16} className="text-orange-400" /> Waiting
        </div>
      </div>
    </div>
  );
};
