import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      <defs>
        <linearGradient id="logo_gradient" x1="0" y1="100" x2="100" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#10b981" /> {/* emerald-500 */}
          <stop offset="100%" stopColor="#06b6d4" /> {/* cyan-500 */}
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      
      {/* Bar 1 - Short */}
      <path 
        d="M20 80 V50" 
        stroke="url(#logo_gradient)" 
        strokeWidth="14" 
        strokeLinecap="round" 
      />
      
      {/* Bar 2 - Medium */}
      <path 
        d="M50 80 V35" 
        stroke="url(#logo_gradient)" 
        strokeWidth="14" 
        strokeLinecap="round" 
      />
      
      {/* Bar 3 - Tall */}
      <path 
        d="M80 80 V20" 
        stroke="url(#logo_gradient)" 
        strokeWidth="14" 
        strokeLinecap="round" 
      />
      
      {/* Rising Arrow */}
      <path 
        d="M20 50 L50 35 L80 20" 
        stroke="#e0f2fe" /* sky-100 for contrast on both dark/light */
        strokeWidth="8" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        style={{ filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,0.3))' }}
      />
      
      {/* Arrow Head */}
      <path 
        d="M65 20 L80 20 L80 35" 
        stroke="#e0f2fe" 
        strokeWidth="8" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        style={{ filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,0.3))' }}
      />
    </svg>
  );
};