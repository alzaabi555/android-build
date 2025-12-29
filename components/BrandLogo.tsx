import React from 'react';

interface BrandLogoProps {
  className?: string;
  showText?: boolean;
  variant?: 'light' | 'dark' | 'color';
}

const BrandLogo: React.FC<BrandLogoProps> = ({ className = "w-12 h-12", showText = false, variant = 'color' }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg viewBox="0 0 512 512" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="bg_glass" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a6e4ff" stopOpacity="0.9"/>
            <stop offset="100%" stopColor="#2a9d8f" stopOpacity="0.6"/>
            </linearGradient>
            
            <linearGradient id="arrow_grad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="50%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#fbbf24" />
            </linearGradient>

            <linearGradient id="eye_grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>

            <linearGradient id="book_grad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#4ade80" />
                <stop offset="100%" stopColor="#15803d" />
            </linearGradient>

            <filter id="dropShadow" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000" floodOpacity="0.2"/>
            </filter>
        </defs>

        {/* 1. Outer Glass Container */}
        <rect x="30" y="30" width="452" height="452" rx="90" fill="url(#bg_glass)" stroke="white" strokeWidth="6" strokeOpacity="0.6" />
        <rect x="40" y="40" width="432" height="432" rx="80" fill="none" stroke="white" strokeWidth="2" strokeOpacity="0.3" />

        {/* 2. Inner White Circle Platform */}
        <circle cx="256" cy="256" r="190" fill="white" fillOpacity="0.95" filter="url(#dropShadow)" />
        <circle cx="256" cy="256" r="180" fill="none" stroke="#e2e8f0" strokeWidth="2" />

        {/* 3. The Eye (Center) */}
        <g transform="translate(131, 156) scale(1)">
            <path d="M0 100 Q 125 -20 250 100 Q 125 220 0 100 Z" fill="#f0f9ff" stroke="#0ea5e9" strokeWidth="10" strokeLinejoin="round" />
            <circle cx="125" cy="100" r="50" fill="url(#eye_grad)" />
            <circle cx="125" cy="100" r="22" fill="#0f172a" />
            <circle cx="145" cy="85" r="12" fill="white" opacity="0.8" />
        </g>

        {/* 4. The Book (Bottom) */}
        <g transform="translate(140, 310) scale(0.9)">
            <path d="M5 50 Q 80 80 155 50 L 155 70 Q 80 100 5 70 Z" fill="url(#book_grad)" filter="url(#dropShadow)" />
            <path d="M155 50 Q 230 80 305 50 L 305 70 Q 230 100 155 70 Z" fill="url(#book_grad)" filter="url(#dropShadow)" />
            <path d="M15 40 Q 85 70 145 40" fill="none" stroke="#22c55e" strokeWidth="5" strokeLinecap="round" />
            <path d="M165 40 Q 225 70 295 40" fill="none" stroke="#22c55e" strokeWidth="5" strokeLinecap="round" />
            <path d="M20 25 Q 85 55 145 25" fill="none" stroke="#86efac" strokeWidth="5" strokeLinecap="round" />
            <path d="M165 25 Q 225 55 290 25" fill="none" stroke="#86efac" strokeWidth="5" strokeLinecap="round" />
            <path d="M155 50 L 155 70" stroke="#14532d" strokeWidth="2" />
        </g>

        {/* 5. Chart Arrow (Overlay) */}
        <path d="M180 300 L 230 250 L 270 290 L 350 170" fill="none" stroke="url(#arrow_grad)" strokeWidth="28" strokeLinecap="round" strokeLinejoin="round" filter="url(#dropShadow)" />
        <path d="M310 170 L 350 170 L 350 215" fill="none" stroke="url(#arrow_grad)" strokeWidth="28" strokeLinecap="round" strokeLinejoin="round" />

        {/* 6. Top Icons Badges */}
        <g transform="translate(190, 160)">
            <circle cx="0" cy="0" r="18" fill="#22c55e" filter="url(#dropShadow)" />
            <path d="M-8 0 L -3 5 L 8 -6" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </g>

        <g transform="translate(256, 140)">
            <circle cx="0" cy="0" r="18" fill="#fbbf24" filter="url(#dropShadow)" />
            <circle cx="-5" cy="-3" r="2" fill="#78350f" />
            <circle cx="5" cy="-3" r="2" fill="#78350f" />
            <path d="M-6 5 Q 0 10 6 5" fill="none" stroke="#78350f" strokeWidth="2" strokeLinecap="round" />
        </g>

        <g transform="translate(322, 160)">
            <text x="0" y="8" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="28" fill="#ef4444" filter="url(#dropShadow)">A+</text>
        </g>
      </svg>
      
      {showText && (
          <div className="flex flex-col">
              <span className={`font-black tracking-tighter leading-none ${variant === 'light' ? 'text-white' : 'text-slate-800'}`} style={{fontSize: '1.2em'}}>راصد</span>
              <span className={`text-[0.4em] font-bold tracking-widest uppercase opacity-70 ${variant === 'light' ? 'text-indigo-200' : 'text-indigo-500'}`}>Rased App</span>
          </div>
      )}
    </div>
  );
};

export default BrandLogo;