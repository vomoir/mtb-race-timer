// --- RIDER IMPORTER ---
import React, { useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { Users } from "lucide-react";
import { useRaceStore } from "../store/raceStore"; // Import the hook
import { Card } from "./Card";

const RiderImporter = () => {
  const { setRiders } = useRaceStore();

  const [dragActive, setDragActive] = useState(false);

  const handleFiles = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split("\n");
      const newRiders = [];
      lines.forEach((line, index) => {
        const parts = line.split(",").map((p) => p.trim());
        if (parts.length >= 2) {
          if (
            index === 0 &&
            isNaN(parts[0]) &&
            parts[0].toLowerCase().includes("riderNumber")
          )
            return;
          if (parts[0]) {
            newRiders.push({
              riderNumber: parts[0],
              name: parts[1] || "Unknown Rider",
              category: parts[2] || "Open",
              status: "WAITING", // INITIAL STATE
              startTime: null,
              finishTime: null,
              totalTime: null,
            });
          }
        }
      });
      setRiders(newRiders);
    };
    reader.readAsText(file);
  };

  const loadDemoData = () => {
    const demoRiders = [
      {
        riderNumber: "101",
        name: "Sam Hill",
        category: "Elite",
        status: "WAITING",
        startTime: null,
        finishTime: null,
        totalTime: null,
      },
      {
        riderNumber: "102",
        name: "Greg Minnaar",
        category: "Elite",
        status: "WAITING",
        startTime: null,
        finishTime: null,
        totalTime: null,
      },
      {
        riderNumber: "103",
        name: "Rachel Atherton",
        category: "Elite",
        status: "WAITING",
        startTime: null,
        finishTime: null,
        totalTime: null,
      },
      {
        riderNumber: "201",
        name: "Jackson Goldstone",
        category: "Junior",
        status: "WAITING",
        startTime: null,
        finishTime: null,
        totalTime: null,
      },
    ];
    setRiders(demoRiders);
    toast.success("Demo data loaded!");
  };

  return (
    <Card className="p-8 text-center space-y-6 max-w-2xl mx-auto mt-10">
      <div className="mx-auto bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center text-slate-500">
        <Users size={32} />
      </div>
      <h2 className="text-2xl font-bold text-slate-800">Rider Registration</h2>
      <div
        className={`border-2 border-dashed rounded-xl p-8 transition-all ${
          dragActive ? "border-blue-500 bg-blue-50" : "border-slate-300"
        }`}
        onDragEnter={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragActive(false);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          if (e.dataTransfer.files[0]) handleFiles(e.dataTransfer.files[0]);
        }}
      >
        <p className="font-medium text-slate-700">Drag & drop CSV file here</p>
        <p className="text-xs text-slate-400 mb-4">
          Format: Number, Name, Category
        </p>
        <button
          onClick={loadDemoData}
          className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-bold"
        >
          Load Demo Data
        </button>
      </div>
    </Card>
  );
};
export default RiderImporter;
