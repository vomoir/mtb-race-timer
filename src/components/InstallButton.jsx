import React, { useEffect, useState } from "react";
import { usePWAInstall } from "../hooks/usePWAInstall";
import { Share } from "lucide-react";

export const InstallButton = () => {
  const { isInstallable, handleInstallClick } = usePWAInstall();
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(ios);

    // Detect if already installed
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    setIsStandalone(isInStandaloneMode);
  }, []);

  if (isStandalone) return null;

  // iOS Instructions
  if (isIOS) {
    return (
      <div className="bg-slate-100 p-4 rounded-xl text-center text-sm text-slate-600 border border-slate-200">
        <p className="font-bold mb-1">Install on iPhone/iPad:</p>
        <p className="flex items-center justify-center gap-1">
          Tap <Share size={14} className="text-blue-500" /> then <span className="font-bold">"Add to Home Screen"</span>
        </p>
      </div>
    );
  }

  if (!isInstallable) return null;

  return (
    <button
      onClick={handleInstallClick}
      className="bg-[#ff4500] hover:bg-orange-700 text-white px-5 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2 transition-all active:scale-95"
    >
      <span>📲</span> Install MTB Timer Pro
    </button>
  );
};
