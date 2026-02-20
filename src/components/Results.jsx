import React, { useState } from "react";
import { Trophy, Download, List } from "lucide-react";

import { useRaceStore } from "../store/raceStore";
import { useRiderLists } from "../hooks/useRiderLists";
import { TableSkeleton } from "../components/LoadingStates";
import { OverallResults } from "./OverallResults";
import { Card } from "./Card";
import { TabButton } from "./TabButton";

const groupBy = (array, key) =>
  array.reduce((acc, obj) => {
    const k = obj[key] || "Uncategorized";
    if (!acc[k]) acc[k] = [];
    acc[k].push(obj);
    return acc;
  }, {});

const formatMsToTime = (ms) => {
  if (!ms) return "00:00:00.00";
  const date = new Date(ms);
  return date.toISOString().substr(11, 11);
};

const triggerFileDownload = (content, fileName) => {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", fileName);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const Results = () => {
  const { eventName, trackName, isLoading, riders, fetchEventResults } =
    useRaceStore();
  const { finishedRiders } = useRiderLists(riders);
  const [activeTab, setActiveTab] = useState("track");

  const exportCurrentTrackCSV = () => {
    const currentTrackFinishers = finishedRiders.filter(
      (r) => r.trackName === trackName,
    );
    if (currentTrackFinishers.length === 0) return;

    const headers =
      "Rank,Rider Number,Rider Name,Category,Race Time,Start Time,Finish Time,Status";
    const rows = currentTrackFinishers.map(
      (r, index) =>
        `${index + 1},${r.riderNumber},"${r.firstName} ${r.lastName}","${r.category}",${r.raceTime},${r.startTime},${r.finishTime},${r.status}`,
    );
    const csvContent = [headers, ...rows].join("\n");
    triggerFileDownload(
      csvContent,
      `Results_${trackName}_${new Date().toISOString().split("T")[0]}.csv`,
    );
  };

  const exportAllResultsCSV = async () => {
    const eventRiders = await fetchEventResults(eventName);
    let csvContent = `EVENT,${eventName.toUpperCase()}\nDATE,${new Date().toLocaleDateString("en-AU")}\n\n`;
    const tracks = [...new Set(eventRiders.map((r) => r.trackName))].sort();

    tracks.forEach((track) => {
      csvContent += `TRACK: ${track.toUpperCase()}\nRank,Rider Number,Rider Name,Category,Race Time,Status\n`;
      const grouped = groupBy(
        eventRiders.filter((r) => r.trackName === track),
        "category",
      );
      Object.keys(grouped)
        .sort()
        .forEach((category) => {
          csvContent += `--- CATEGORY: ${category} ---\n`;
          const sorted = grouped[category].sort((a, b) => {
            if (a.status === "FINISHED" && b.status === "FINISHED")
              return (a.durationMs || 0) - (b.durationMs || 0);
            if (a.status === "FINISHED") return -1;
            if (b.status === "FINISHED") return 1;
            return 0;
          });
          sorted.forEach((r, idx) => {
            const rank = r.status === "FINISHED" ? idx + 1 : "-";
            csvContent += `${rank},"${r.riderNumber}","${r.firstName} ${r.lastName}","${category}",${r.raceTime || "--:--:--"},${r.status}\n`;
          });
        });
      csvContent += "\n";
    });

    csvContent += `OVERALL EVENT STANDINGS (GC)\nRank,Rider Number,Rider Name,Category,Stages Completed,Total Time\n`;
    const riderMap = {};
    eventRiders.forEach((r) => {
      if (r.status !== "FINISHED") return;
      const key = `${r.riderNumber}-${r.category}`;
      if (!riderMap[key])
        riderMap[key] = {
          riderNumber: r.riderNumber,
          name: `${r.firstName} ${r.lastName}`,
          category: r.category,
          totalMs: 0,
          count: 0,
        };
      riderMap[key].totalMs += r.durationMs;
      riderMap[key].count += 1;
    });
    const overallGrouped = groupBy(Object.values(riderMap), "category");
    Object.keys(overallGrouped)
      .sort()
      .forEach((category) => {
        csvContent += `--- OVERALL CATEGORY: ${category} ---\n`;
        const sortedGC = overallGrouped[category].sort((a, b) =>
          b.count !== a.count ? b.count - a.count : a.totalMs - b.totalMs,
        );
        sortedGC.forEach((r, idx) => {
          csvContent += `${idx + 1},"${r.riderNumber}","${r.name}","${r.category}",${r.count},${formatMsToTime(r.totalMs)}\n`;
        });
      });
    triggerFileDownload(
      csvContent,
      `${eventName}_Full_Results_${new Date().toISOString().split("T")[0]}.csv`,
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-2 sm:p-4">
      <Card className="overflow-hidden">
        {/* --- Tabs --- */}
        <div className="flex bg-slate-50 border-b border-slate-200">
          <TabButton
            label="Track Results"
            icon={List}
            onClick={() => setActiveTab("track")}
            isActive={activeTab === "track"}
            color="yellow"
          />
          <TabButton
            label="Overall Standings"
            icon={Trophy}
            onClick={() => setActiveTab("overall")}
            isActive={activeTab === "overall"}
            color="yellow"
          />
        </div>

        {/* --- Tab Content --- */}
        <div className="p-4 sm:p-6">
          {activeTab === "track" && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">
                    {trackName}
                  </h2>
                  <p className="text-sm text-slate-500">
                    {finishedRiders.length} finishers
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={exportCurrentTrackCSV}
                    disabled={finishedRiders.length === 0}
                    className="flex-1 sm:flex-initial w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-sm font-bold px-4 py-2 rounded-lg"
                  >
                    <Download size={16} /> Export Track
                  </button>
                  <button
                    onClick={exportAllResultsCSV}
                    className="flex-1 sm:flex-initial w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold px-4 py-2 rounded-lg"
                  >
                    <Download size={16} /> Export All
                  </button>
                </div>
              </div>

              {isLoading ? (
                <TableSkeleton />
              ) : (
                <>
                  {/* Mobile View: List of Cards */}
                  <div className="sm:hidden space-y-3">
                    {finishedRiders.map((rider, index) => (
                      <div
                        key={rider.id}
                        className="bg-white p-3 rounded-lg border border-slate-200 flex items-center"
                      >
                        <div
                          className={`font-bold text-lg w-10 ${index === 0 ? "text-yellow-500" : "text-slate-400"}`}
                        >
                          {index === 0 ? (
                            <Trophy size={20} className="fill-yellow-500" />
                          ) : (
                            index + 1
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-slate-800">
                            #{rider.riderNumber} - {rider.firstName}{" "}
                            {rider.lastName}
                          </p>
                          <p className="text-xs text-slate-500">
                            {rider.category}
                          </p>
                        </div>
                        <div
                          className={`font-mono font-bold text-lg ${index === 0 ? "text-green-600" : "text-slate-700"}`}
                        >
                          {rider.raceTime}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop View: Table */}
                  <div className="hidden sm:block border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase font-bold">
                        <tr>
                          <th className="p-3 w-16">Rank</th>
                          <th className="p-3">Rider</th>
                          <th className="p-3">Category</th>
                          <th className="p-3 text-right">Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {finishedRiders.map((rider, index) => (
                          <tr key={rider.id} className="hover:bg-slate-50">
                            <td className="p-3 font-bold text-slate-400">
                              {index === 0 ? (
                                <Trophy
                                  size={16}
                                  className="text-yellow-500 fill-yellow-500"
                                />
                              ) : (
                                index + 1
                              )}
                            </td>
                            <td className="p-3">
                              <p className="font-bold text-slate-800">
                                #{rider.riderNumber} - {rider.firstName}{" "}
                                {rider.lastName}
                              </p>
                            </td>
                            <td className="p-3 text-xs text-slate-500">
                              {rider.category}
                            </td>
                            <td
                              className={`p-3 text-right font-mono font-bold ${index === 0 ? "text-green-600" : "text-slate-700"}`}
                            >
                              {rider.raceTime}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
              {finishedRiders.length === 0 && (
                <p className="text-center py-12 text-slate-400">
                  No finishers yet for this track.
                </p>
              )}
            </div>
          )}

          {activeTab === "overall" && (
            <div className="animate-in fade-in">
              <OverallResults />
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
export default Results;
