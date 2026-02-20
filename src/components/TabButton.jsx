import React from "react";

export const TabButton = ({
  label,
  icon: Icon, // The prop is destructured and renamed here
  count,
  onClick,
  isActive,
  color = "blue",
}) => {
  const colorMap = {
    blue: "text-blue-600 border-blue-600",
    red: "text-red-600 border-red-600",
    yellow: "text-yellow-600 border-yellow-600",
    green: "text-green-600 border-green-600",
  };

  const activeClasses = colorMap[color] || colorMap.blue;

  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold border-b-4 transition-colors ${
        isActive
          ? activeClasses
          : "text-slate-500 border-transparent hover:text-slate-800"
      }`}
    >
      {Icon && <Icon size={16} />} {/* And used here */}
      <span>{label}</span>
      {count !== undefined && (
        <span className="text-xs bg-slate-200 text-slate-600 font-bold rounded-full px-2 py-0.5">
          {count}
        </span>
      )}
    </button>
  );
};
