// Uset he raceResultsCalulations file to calculate the overall winners and stage winners, then display them here in a nice format with the trophy icon
import React from "react";
import { Trophy } from "lucide-react";
import { OverallResults } from "../utils/raceResultsCalculations";
<div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
    {/* {overallData.stageWinners.map(winner => (
        <div key={winner.track} className="bg-linear-to-br from-slate-900 to-slate-800 p-4 rounded-xl border-l-4 border-orange-500 shadow-lg">
        <div className="flex justify-between items-start">
            <p className="text-orange-500 text-[10px] font-black uppercase tracking-widest">{winner.track}</p>
            <Trophy size={16} className="text-orange-500" />
        </div>
        <p className="text-white font-bold text-lg">{winner.firstName} {winner.lastName}</p>
        <p className="text-slate-400 font-mono text-sm">{winner.raceTime} <span className="text-[10px] text-slate-500">({winner.category})</span></p>
        </div>
    ))} */}
    </div>
    <div className="space-y-8">
    <h2 className="text-2xl font-black italic text-slate-900">OVERALL STANDINGS</h2>
    <OverallResults />
    {/* {Object.entries(overallData.categoryStandings).map(([category, standings]) => (
        <div key={category} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 px-6 py-3 border-b border-slate-200">
            <h3 className="font-bold text-slate-700 uppercase tracking-wide">{category}</h3>
        </div>
        <table className="w-full text-left">
            <thead className="text-[10px] uppercase text-slate-400 bg-slate-50/50">
            <tr>
                <th className="px-6 py-2">Rank</th>
                <th className="px-6 py-2">Rider</th>
                <th className="px-6 py-2">Stages</th>
                <th className="px-6 py-2 text-right">Total Time</th>
            </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
            {standings.map((rider, index) => (
                <tr key={rider.riderNumber} className={index === 0 ? "bg-orange-50/30" : ""}>
                <td className="px-6 py-3 font-bold">{index + 1}</td>
                <td className="px-6 py-3">
                    <p className="font-bold text-slate-900">{rider.name}</p>
                    <p className="text-xs text-slate-500">#{rider.riderNumber}</p>
                </td>
                <td className="px-6 py-3 text-sm text-slate-500">{rider.stagesCount} Stages</td>
                <td className="px-6 py-3 text-right font-mono font-bold text-slate-900">
                    {formatDuration(rider.totalMs)}
                </td>
                </tr>
            ))}
            </tbody>
        </table>
        </div>
    ))} */}
    </div>
</div>