import { useState } from "react";
import { Users } from "lucide-react";
import { toast } from "react-hot-toast";
import { useRaceStore } from "../store/raceStore"; // Import the hook
import { Card } from "./Card";
import { demoRiders } from "../utils/demoData";

export default function RiderRegistration() {
  const [activeTab, setActiveTab] = useState("import");
  const [dragActive, setDragActive] = useState(false);
  const { setRiders, importRidersToDb } = useRaceStore();

  const handleManualSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newRider = {
      id: crypto.randomUUID(),
      riderNumber: formData.get("riderNumber"),
      caLicenceNumber: formData.get("caLicence"),
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

      lines.forEach((line, index) => {
        const parts = line.split(",").map((p) => p.trim());

        // Skip header row
        if (index === 0) return;

        // Ensure we have enough columns
        if (parts.length >= 7) {
          const rider = {
            riderNumber: parts[1], // Race No
            caLicenceNumber: parts[2], // CA Licence Number
            category: parts[3], // Grade Entered
            firstName: parts[5], // First Name
            lastName: parts[6], // Surname
            status: "WAITING", // Initial state
            startTime: null,
            finishTime: null,
            raceTime: null,
            timestamp: new Date().toISOString(), // or serverTimestamp() in Firestore
          };

          newRiders.push(rider);
        }
      });

      setRiders(newRiders);
      importRidersToDb(newRiders);
    };
    reader.readAsText(file);
  };
  const loadDemoData = () => {
    setRiders(demoRiders);
    importRidersToDb(demoRiders);
    toast.success("Demo data loaded!");
  };

  return (
    <Card className="p-8 space-y-8 max-w-2xl mx-auto mt-10">
      {/* Header */}
      <div className="text-center space-y-4">
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
            Format: Number, Name, Category
          </p>

          {/* Mobile-friendly file picker */}
          <input
            type="file"
            accept=".csv"
            className="hidden"
            id="fileInput"
            onChange={(e) => {
              if (e.target.files[0]) handleFiles(e.target.files[0]);
              toast.success("File import successful");
            }}
          />
          <div className="flex gap-3 justify-center">
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
          </div>
        </div>
      )}
{/* TODO: break this out into its own component */}
      {activeTab === "manual" && (
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Rider Number
            </label>
            <input
              name="riderNumber"
              type="text"
              required
              className="mt-1 block w-full border rounded-lg px-3 py-2"
            />
          </div>
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
              Last Name
            </label>
            <input
              name="lastName"
              type="text"
              required
              className="mt-1 block w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              CA Licence Number
            </label>
            <input
              name="caLicence"
              type="text"
              required
              className="mt-1 block w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Category
            </label>
            <input
              name="category"
              type="text"
              required
              className="mt-1 block w-full border rounded-lg px-3 py-2"
            />
          </div>
          <button
            type="submit"
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-bold"
          >
            Add Rider
          </button>
        </form>
      )}
    </Card>
  );
}
