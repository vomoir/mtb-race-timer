import React from 'react';

// A simple CSS-in-JS shimmer effect
const shimmerStyle = {
  background: 'linear-gradient(90deg, #2a2a2a 25%, #3a3a3a 50%, #2a2a2a 75%)',
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.5s infinite linear',
};

// Add this to your global CSS file or a <style> tag
const shimmerKeyframes = `
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
`;

export const TableSkeleton = ({ rows = 5 }) => (
  <div style={{ width: '100%' }}>
    <style>{shimmerKeyframes}</style>
    {[...Array(rows)].map((_, i) => (
      <div 
        key={i} 
        style={{
          height: '50px',
          margin: '10px 0',
          borderRadius: '8px',
          ...shimmerStyle
        }} 
      />
    ))}
  </div>
);

export const LoadingSpinner = () => (
  <div className="flex justify-center items-center p-10">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
  </div>
);
