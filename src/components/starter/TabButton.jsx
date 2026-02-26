import React from 'react';

export const TabButton = ({ tabName, label, icon: Icon, count, activeTab, setActiveTab, setShouldAutoFocus }) => (
  <button
    onClick={() => {
      if (setShouldAutoFocus) {
        setShouldAutoFocus(true);
      }
      setActiveTab(tabName);
    }}
    className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold border-b-4 transition-colors ${
      activeTab === tabName
        ? 'text-blue-600 border-blue-600'
        : 'text-slate-500 border-transparent hover:text-slate-800'
    }`}
  >
    <Icon size={16} />
    <span>{label}</span>
    {count !== undefined && <span className="text-xs bg-slate-200 text-slate-600 font-bold rounded-full px-2 py-0.5">{count}</span>}
  </button>
);
