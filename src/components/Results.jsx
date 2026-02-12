import React from "react";
import { Trophy, Download, FileText } from "lucide-react";

import { useRaceStore } from "../store/raceStore";
import { useRiderLists } from "../hooks/useRiderLists";
import { TableSkeleton } from '../components/LoadingStates';
import { OverallResults } from "./OverallResults";
import { sortRidersByTime } from "../utils/raceResultsCalculations";

// --- HELPER UTILS ---
const groupBy = (array, key) => array.reduce((acc, obj) => {
  const k = obj[key] || "Uncategorized";
  if (!acc[k]) acc[k] = [];
  acc[k].push(obj);
  return acc;
}, {});

const formatMsToTime = (ms) => {
  if (!ms) return "00:00:00.00";
  const date = new Date(ms);
  return date.toISOString().substr(11, 11); // Returns HH:MM:SS.ms
};

// Generic download trigger
const triggerFileDownload = (content, fileName) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const Results = () => {
  const { activeRaceId, eventName, trackName, isLoading, riders, fetchEventResults } = useRaceStore();
  const { finishedRiders } = useRiderLists(riders);

  // 1. Export Current Track Results (Single View)
  const exportCurrentTrackCSV = () => {
    // Filter for current track to ensure we don't mix data if store has multiple tracks
    const currentTrackFinishers = finishedRiders.filter(r => r.trackName === trackName);

    if (currentTrackFinishers.length === 0) return;

    const headers = "Rank,Rider Number,Rider Name,AusCycle Number,Category,Race Time,Start Time,Finish Time,Status";
    const raceDetails = `Track Name: ${trackName}\nRace Date: ${new Date().toLocaleDateString()}\n`;
    
    const rows = currentTrackFinishers.map((r, index) => {
      return `${index + 1},${r.riderNumber},"${r.firstName} ${r.lastName}",${r.caLicenceNumber || ''},"${r.category}",${r.raceTime},${r.startTime},${r.finishTime},${r.status}`;
    });

    const csvContent = [raceDetails, headers, ...rows].join("\n");
    triggerFileDownload(csvContent, `Results__${new Date().toISOString().split('T')[0]}.csv`);
  };

  // 2. Export Comprehensive Event Results (All Tracks + GC)
  const exportAllResultsCSV = async () => {
    // Fetch all riders for the event from DB to ensure we have all tracks
    const eventRiders = await fetchEventResults(eventName);
    
    // Setup Meta Info
    const today = new Date().toLocaleDateString("en-AU");
    let csvContent = `EVENT,${eventName.toUpperCase()}\n`;
    csvContent += `DATE,${today}\n`;
    csvContent += `GENERATED,${new Date().toLocaleTimeString()}\n\n`;

    // --- SECTION A: INDIVIDUAL TRACK RESULTS ---
    const tracks = [...new Set(eventRiders.map(r => r.trackName))].sort();

    tracks.forEach(track => {
      csvContent += `TRACK: ${track.toUpperCase()}\n`;
      csvContent += "Rank,Rider Number,Rider Name,Category,Race Time,Status\n";

      const trackRiders = eventRiders.filter(r => r.trackName === track);
      const grouped = groupBy(trackRiders, 'category');

      Object.keys(grouped).sort().forEach(category => {
        csvContent += `--- CATEGORY: ${category} ---\n`;
        
        // Sort: Finished (fastest first) -> DNF -> DNS -> Waiting
        const sorted = grouped[category].sort((a, b) => {
           if (a.status === "FINISHED" && b.status === "FINISHED") return (a.durationMs || 0) - (b.durationMs || 0);
           if (a.status === "FINISHED") return -1;
           if (b.status === "FINISHED") return 1;
           if (a.status === "DNF") return -1;
           if (b.status === "DNF") return 1;
           return 0;
        });
        
        sorted.forEach((r, idx) => {
          const rank = r.status === "FINISHED" ? idx + 1 : "-";
          csvContent += `${rank},"${r.riderNumber}","${r.firstName} ${r.lastName}","${category}",${r.raceTime || '--:--:--'},${r.status}\n`;
        });
      });
      csvContent += "\n"; // Space between tracks
    });

    // --- SECTION B: OVERALL STANDINGS (GC) ---
    csvContent += `OVERALL EVENT STANDINGS (GC)\n`;
    csvContent += "Rank,Rider Number,Rider Name,Category,Stages Completed,Total Time\n";

    // Calculate totals per rider
    const riderMap = {};
    eventRiders.forEach(r => {
      // Only count finished stages for GC time
      if (r.status !== "FINISHED") return;

      const key = `${r.riderNumber}-${r.category}`;
      if (!riderMap[key]) {
        riderMap[key] = { 
          riderNumber: r.riderNumber, 
          name: `${r.firstName} ${r.lastName}`, 
          category: r.category, 
          totalMs: 0, 
          count: 0 
        };
      }
      riderMap[key].totalMs += r.durationMs;
      riderMap[key].count += 1;
    });

    const overallGrouped = groupBy(Object.values(riderMap), 'category');

    Object.keys(overallGrouped).sort().forEach(category => {
      csvContent += `--- OVERALL CATEGORY: ${category} ---\n`;
      const sortedGC = overallGrouped[category].sort((a, b) => {
        // Sort by most stages completed, then fastest time
        if (b.count !== a.count) return b.count - a.count;
        return a.totalMs - b.totalMs;
      });
      
      sortedGC.forEach((r, idx) => {
        csvContent += `${idx + 1},"${r.riderNumber}","${r.name}","${r.category}",${r.count},${formatMsToTime(r.totalMs)}\n`;
      });
    });

    triggerFileDownload(csvContent, `${eventName}_Full_Results.csv`);
  };

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Trophy className="text-yellow-500" size={20} />
            Race Results
          </h2>
          {isLoading ? (
            <TableSkeleton rows={8} />
          ) : finishedRiders.length === 0 ? (
            <p className="text-gray-500">No finishers yet for this session.</p>
          ) : (
            <p className="text-xs text-slate-500">
              {finishedRiders.length} riders finished
            </p>
          )}
          </div>
        <button
          onClick={exportCurrentTrackCSV}
          disabled={finishedRiders.length === 0}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors"
        >
          <Download size={16} />
          <span>📥</span> Export CSV
        </button>
        <button 
          onClick={exportAllResultsCSV}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors"
        >
          <span>📥</span> Export Official Results
        </button>
      </div>
      <div className="max-w-7xl mx-auto p-6 bg-slate-50 min-h-screen">
        {/* 1. Global Event Header */}
        <div className="flex justify-between items-center mb-8">
          {/* <EventSummary /> */}
        </div>

        <hr className="my-8 border-slate-200" />

        {/* 2. Detailed View for Selected Track */}
        {trackName ? (
          <section>
            <div className="flex justify-between items-end mb-4">
              <div>
                <h2 className="text-3xl font-black italic text-slate-900 uppercase">
                  {trackName} Results
                </h2>
              </div>
            </div>
          </section>
        ) : (
          <div className="text-center py-20 bg-slate-100 rounded-2xl border-2 border-dashed border-slate-300">
            <p className="text-slate-500 font-medium">Select a track above to view detailed results and rankings.</p>
          </div>
        )}
      </div>
      <div>
      <OverallResults />
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {finishedRiders.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto text-slate-300 mb-2" size={32} />
            <p className="text-slate-400">No race results yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-5 border-b border-slate-200">
                <tr>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase">
                    Rank
                  </th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase">
                    Rider #
                  </th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase">
                    Rider Name
                  </th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase text-right">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {finishedRiders.map((rider, index) => {
                  const isWinner = index === 0;
                  return (
                    <tr
                      key={rider.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="p-4 font-bold text-slate-400 w-16">
                        {isWinner ? (
                          <Trophy
                            size={16}
                            className="text-yellow-500 fill-yellow-500"
                          />
                        ) : (
                          index + 1
                        )}
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-800 text-lg">
                          #{rider.riderNumber}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-800 text-lg">
                          {rider.firstName} {rider.lastName}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div
                          className={`font-mono font-bold text-lg ${
                            isWinner ? "text-green-600" : "text-slate-700"
                          }`}
                        >
                          {rider.raceTime}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
          </div>    
        )}
      </div>
    </div>
  );
};
export default Results;
