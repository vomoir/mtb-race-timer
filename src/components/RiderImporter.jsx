import { useState, useRef } from "react";
import { Users, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { useRaceStore } from "../store/raceStore"; // Import the hook
import { Card } from "./Card";
import { demoRiders } from "../utils/demoData";
import ConfirmDialog from "./ConfirmDialog";

export const RiderImporter = () => {
  const [activeTab, setActiveTab] = useState("import");
  const [dragActive, setDragActive] = useState(false);
  const { riders, setRiders, importRidersToDb, deleteAllRiders } = useRaceStore();
  const confirmDialog = useRef(null);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const riderNumber = formData.get("riderNumber").trim();

    if (riders.some((r) => r.riderNumber === riderNumber)) {
      toast.error(`Rider #${riderNumber} is already registered!`);
      return;
    }

    const newRider = {
      id: (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).substr(2),
      riderNumber: riderNumber,
      caLicenceNumber: formData.get("caLicence") || "TBA",
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      category: formData.get("category"),
    };
    importRidersToDb(newRider);
    e.target.reset();
    toast.success("Rider added");
  };

  const handleFiles = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
      const newRiders = [];
      let skippedCount = 0;

      lines.forEach((line, index) => {
        // Auto-detect delimiter (Tab for copy-paste/TSV, Comma for standard CSV)
        const delimiter = line.includes("\t") ? "\t" : ",";
        const parts = line.split(delimiter).map((p) => p.trim());

        // Skip header row
        if (index === 0) return;

        // Ensure we have enough columns
        // New format: CA Licence No, Grade Entered, Race Grade, First Name, Surname, Race No
        if (parts.length >= 6) {
          const rider = {
            caLicenceNumber: parts[0] || "TBA",
            category: parts[1], // Grade Entered
            // parts[2] is Race Grade (e.g. "A")
            firstName: parts[3],
            lastName: parts[4],
            riderNumber: parts[5], // Race No
            status: "WAITING", // Initial state
            startTime: null,
            finishTime: null,
            raceTime: null,
            timestamp: new Date().toISOString(),
          };

          if (rider.riderNumber) {
            newRiders.push(rider);
          } else {
            skippedCount++;
          }
        }
      });

      if (skippedCount > 0) {
        toast.error(`⚠️ Skipped ${skippedCount} riders missing a Rider Number!`);
      }

      setRiders(newRiders);
      importRidersToDb(newRiders);
      toast.success(`Imported ${newRiders.length} riders successfully`);
    };
    reader.readAsText(file);
  };
  const loadDemoData = () => {
    setRiders(demoRiders);
    importRidersToDb(demoRiders);
    toast.success("Demo data loaded!");
  };

  return (
    <Card className="p-4 sm:p-8 space-y-4 sm:space-y-8 max-w-2xl mx-auto">      
      <div>
        <div className="mx-auto bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center text-slate-500">
          <Users size={32} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">
          Rider Registration
        </h2>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-300">
        <button
          className={`flex-1 py-2 font-semibold ${
            activeTab === "import"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-slate-500"
          }`}
          onClick={() => setActiveTab("import")}
        >
          Import CSV
        </button>
        <button
          className={`flex-1 py-2 font-semibold ${
            activeTab === "manual"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-slate-500"
          }`}
          onClick={() => setActiveTab("manual")}
        >
          Manual Entry
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "import" && (
        <div
          className={`border-2 border-dashed rounded-xl p-6 transition-all ${
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
            toast.success("File import successful");
          }}
        >
          <p className="font-medium text-slate-700">
            Drag & drop CSV file here
          </p>
          <p className="text-xs text-slate-400 mb-4">
            Format: CA Licence, Category, Grade, First Name, Surname, Number
          </p>

          {/* Mobile-friendly file picker */}
          <input
            type="file"
            accept=".csv,text/csv,application/vnd.ms-excel,text/plain"
            className="hidden"
            id="fileInput"
            onClick={(e) => (e.target.value = null)}
            onChange={(e) => {
              if (e.target.files[0]) handleFiles(e.target.files[0]);
            }}
          />
          <div className="flex gap-3 justify-center flex-wrap">
            <label
              htmlFor="fileInput"
              className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-bold cursor-pointer"
            >
              Upload CSV
            </label>
            <button
              onClick={loadDemoData}
              className="px-4 py-2 bg-slate-600 text-white rounded-lg text-sm font-bold"
            >
              Load Demo Data
            </button>
            <button
              onClick={() => {
                confirmDialog.current.open({
                  title: "Delete All Riders",
                  message: "Are you sure you want to DELETE ALL riders from this track? This cannot be undone.",
                  onConfirm: () => deleteAllRiders()
                });
              }}
              className="px-4 py-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
            >
              <Trash2 size={16} /> Delete All
            </button>
          </div>
        </div>
      )}
{/* TODO: break this out into its own component */}
      {activeTab === "manual" && (
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              CA Licence Number
            </label>
            <input
              name="caLicence"
              type="text"
              className="mt-1 block w-full border rounded-lg px-3 py-2"
              placeholder="AC..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Grade / Category
            </label>
            <input
              name="category"
              type="text"
              required
              className="mt-1 block w-full border rounded-lg px-3 py-2"
              placeholder="e.g. B Grade Men"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                First Name
              </label>
              <input
                name="firstName"
                type="text"
                required
                className="mt-1 block w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Surname
              </label>
              <input
                name="lastName"
                type="text"
                required
                className="mt-1 block w-full border rounded-lg px-3 py-2"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Race Number
            </label>
            <input
              name="riderNumber"
              type="text"
              pattern="[0-9]*"
              inputMode="numeric"
              required
              className="mt-1 block w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="reset"
              className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg font-bold hover:bg-slate-300 transition-colors"
            >
              Clear Form
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors"
            >
              Add Rider
            </button>
          </div>
        </form>
      )}
      <ConfirmDialog ref={confirmDialog} />
    </Card>
  );
}
