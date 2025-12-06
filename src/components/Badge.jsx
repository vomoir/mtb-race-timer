export const Badge = ({ children, color = "slate" }) => {
  const colors = {
    slate: "bg-slate-100 text-slate-700",
    green: "bg-emerald-100 text-emerald-700",
    blue: "bg-blue-100 text-blue-700",
    red: "bg-red-100 text-red-700",
    amber: "bg-amber-100 text-amber-700",
  };
  return (
    <span
      className={`px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
        colors[color] || colors.slate
      }`}
    >
      {children}
    </span>
  );
};
