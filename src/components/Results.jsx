import React from "react";
import { Trophy, Download, FileText } from "lucide-react";

import { useRaceStore } from "../store/raceStore";
import { useRiderLists } from "../hooks/useRiderLists";
import { calculateRaceDuration, formatRaceTime } from "../utils/utils";

const Results = () => {
  const { raceId } = useRaceStore();

  const { finishedRiders } = useRiderLists();
  const downloadCSV = () => {
    // CSV Header
    const headers = [
      ",Rank,Rider Number,Rider Name, AusCycle Number, Race Time,Start Time,Finish Time,Status",
    ];
    const raceDetails = [
      `Track Name: ${raceId}\nRace Date: ${new Date().toLocaleDateString()}`,
    ];
    // CSV Rows
    const rows = finishedRiders.map((r, index) => {
      const raceTime = calculateRaceDuration(r.startTime, r.finishTime);
      const start = new Date(r.startTime).toLocaleTimeString();
      const finish = new Date(r.finishTime).toLocaleTimeString();
      return `,${index + 1},${r.riderNumber},${r.name},${
        r.caLicenceNumber
      },${raceTime},${start},${finish},${r.status}`;
    });

    const csvContent = [raceDetails, headers, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${raceId}_Results.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Trophy className="text-yellow-500" size={20} />
            Race Results
          </h2>
          <p className="text-xs text-slate-500">
            {finishedRiders.length} riders finished
          </p>
        </div>
        <button
          onClick={downloadCSV}
          disabled={finishedRiders.length === 0}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors"
        >
          <Download size={16} />
          Export CSV
        </button>
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
                  const raceTime = formatRaceTime(
                    calculateRaceDuration(rider.startTime, rider.finishTime)
                  );
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
                          {rider.name}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div
                          className={`font-mono font-bold text-lg ${
                            isWinner ? "text-green-600" : "text-slate-700"
                          }`}
                        >
                          {raceTime}
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
