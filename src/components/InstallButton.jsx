import { usePWAInstall } from "../hooks/usePWAInstall";

export const InstallButton = () => {
  const { isInstallable, handleInstallClick } = usePWAInstall();

  // If the app is already installed or the browser doesn't support it,
  // don't render anything.
  if (!isInstallable) return null;

  return (
    <button
      onClick={handleInstallClick}
      style={{
        backgroundColor: "#ff4500",
        color: "white",
        padding: "10px 20px",
        borderRadius: "8px",
        border: "none",
        fontWeight: "bold",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "8px",
      }}
    >
      <span>📲</span> Install MTB Timer Pro
    </button>
  );
};
