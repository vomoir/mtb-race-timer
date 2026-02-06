import { useRaceStore } from "../store/raceStore";
import { TrackPicker } from "./TrackPicker";
import RiderImporter from "./RiderImporter";
export const RegistrationPage = () => {
  const { trackName } = useRaceStore();

  return (
    <div className="max-w-4xl mx-auto p-4">
      <header className="mb-6">
        <h1 className="text-3xl font-black italic text-slate-900">RIDER REGISTRATION</h1>
      </header>

      <TrackPicker />

      <div className={!trackName ? "opacity-50 pointer-events-none" : ""}>
        <RiderImporter />
      </div>
    </div>
  );
};