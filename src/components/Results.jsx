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

const Results = () => {
  const { activeRaceId, eventName, trackName, isLoading, riders } = useRaceStore();

  const { finishedRiders } = useRiderLists(riders);
  const downloadCSV = () => {
    // CSV Header
    const headers = [
      ",Rank,Rider Number,Rider Name, AusCycle Number, Race Time,Start Time,Finish Time,Status",
    ];
    const raceDetails = [
      `Track Name: ${trackName}\nRace Date: ${new Date().toLocaleDateString()}`,
    ];
    // CSV Rows
    const rows = finishedRiders.map((r, index) => {
      const raceTime = r.raceTime;
      const start = r.startTime;
      const finish = r.finishTime;
      return `,${index + 1},${r.riderNumber},${r.firstName} ${r.lastName},${
        r.caLicenceNumber
      },${raceTime},${start},${finish},${r.status}`;
    });

    const csvContent = [raceDetails, headers, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Results_${activeRaceId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportResultsCSV = (riders, eventName, trackName) => {
    // 1. Filter for finished riders and group by Category
    const completedOrRetired = riders.filter(r => 
      ["FINISHED", "DNF", "DNS"].includes(r.status)
    );
    
    // Grouping logic
    const grouped = completedOrRetired.reduce((acc, rider) => {
      const cat = rider.category || "Uncategorized";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(rider);
      return acc;
    }, {});

    const today = new Date().toLocaleDateString("en-AU");
    let csvContent = `EVENT,${eventName.toUpperCase()}\n`;
    csvContent += `TRACK,${trackName.toUpperCase()}\n`;
    csvContent += `DATE,${today}\n`;
    csvContent += `GENERATED,${new Date().toLocaleTimeString()}\n\n`; // Spacer
    // 2. Setup CSV Headers
    csvContent += "Rank,Rider Number,Rider Name,AusCycle Number,Race Time,Start Time,Finish Time,Status\n";

    // 3. Process each category
    Object.keys(grouped).sort().forEach(category => {
      csvContent += `--- CATEGORY: ${category} ---\n`;
      
      // Sort riders within this category by durationMs
      const sortedRiders = grouped[category].sort((a, b) => {
        // 1. Finished riders always come first, sorted by time
        if (a.status === "FINISHED" && b.status === "FINISHED") {
          return (a.durationMs || 0) - (b.durationMs || 0);
        }
        // 2. Finished comes before DNF/DNS
        if (a.status === "FINISHED") return -1;
        if (b.status === "FINISHED") return 1;
        // 3. DNF comes before DNS
        if (a.status === "DNF" && b.status === "DNS") return -1;
        if (a.status === "DNS" && b.status === "DNF") return 1;
        return 0;
      });

      sortedRiders.forEach((r, index) => {
        const row = [
          index + 1,                                   // Rank
          `"${r.riderNumber}"`,                        // Rider Number
          `"${r.firstName} ${r.lastName}"`,           // Rider Name
          `"${r.caLicenceNumber || ''}"`,              // AusCycle Number
          r.raceTime,                                  // Race Time (00:00:30.45)
          r.startTime || '-',                                 // Start Time (19:33:42)
          // Convert Finish Ms back to readable time if needed
          r.finishTimeMs? new Date(r.finishTimeMs).toLocaleTimeString("en-AU", { hour12: false }) : '-', 
          r.status
        ].join(",");
        csvContent += row + "\n";
      });
      csvContent += "\n"; // Space between categories
    });

    // 4. Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const fileName = `${eventName}_${trackName}_${today.replace(/\//g, '-')}.csv`.replace(/\s+/g, '_');
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
const exportAllResultsCSV = (allRiders, eventName) => {
  // 1. Filter riders for THIS event only
  const eventRiders = allRiders.filter(r => r.eventName === eventName);
  
  // 2. Setup Meta Info
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
      const sorted = sortRidersByTime(grouped[category]);
      
      sorted.forEach((r, idx) => {
        csvContent += `${idx + 1},"${r.riderNumber}","${r.firstName} ${r.lastName}","${category}",${r.raceTime || '--:--:--'},${r.status}\n`;
      });
    });
    csvContent += "\n\n"; // Space between tracks
  });

  // --- SECTION B: OVERALL STANDINGS (GC) ---
  csvContent += `OVERALL EVENT STANDINGS (GC)\n`;
  csvContent += "Rank,Rider Number,Rider Name,Category,Stages Completed,Total Time\n";

  // Calculate totals per rider
  const riderMap = {};
  eventRiders.filter(r => r.status === "FINISHED").forEach(r => {
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
    const sortedGC = overallGrouped[category].sort((a, b) => a.totalMs - b.totalMs);
    
    sortedGC.forEach((r, idx) => {
      csvContent += `${idx + 1},"${r.riderNumber}","${r.name}","${r.category}",${r.count},${formatMsToTime(r.totalMs)}\n`;
    });
  });

  // 4. Trigger Download
  downloadCSV(csvContent, `${eventName}_Full_Results.csv`);
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
          onClick={() => downloadCSV(finishedRiders, eventName, trackName)}
          disabled={finishedRiders.length === 0}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors"
        >
          <Download size={16} />
          <span>📥</span> Export CSV
        </button>
        <button 
          onClick={() => exportAllResultsCSV(riders, eventName, trackName)}
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
              {/* <ExportCSVButton /> Our previously built button */}
            </div>
            {/* <DetailedResultsTable /> */}
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
