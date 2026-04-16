import React from "react";
import { TrackPicker } from "./TrackPicker";
import { RiderImporter } from "./RiderImporter";

export const RiderRegistration = () => {
  return (
    <div className="max-w-3xl mx-auto p-2 sm:p-4 space-y-6">      
      <TrackPicker />
      <RiderImporter />
    </div>
  );
};