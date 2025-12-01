import React, { useState } from "react";

const LoginScreen = ({ onJoin }) => {
  const [inputId, setInputId] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputId.trim()) {
      onJoin(inputId.trim().toUpperCase());
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="text-blue-600" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Race Coordinator
          </h1>
          <p className="text-slate-500 mt-2">
            Enter a unique Race ID to sync Start & Finish lines.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Race Session ID
            </label>
            <div className="relative">
              <Hash
                className="absolute left-3 top-3.5 text-slate-400"
                size={20}
              />
              <input
                type="text"
                value={inputId}
                onChange={(e) => setInputId(e.target.value)}
                placeholder="e.g. DH-FINALS-24"
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none uppercase font-mono tracking-wider"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95"
          >
            <LogIn size={20} />
            Join Session
          </button>
        </form>
        <div className="mt-6 text-center text-xs text-slate-400">
          Ensure both devices use the exact same ID.
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
