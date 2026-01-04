
import React, { useId } from 'react';

interface BrandLogoProps {
  className?: string;
  showText?: boolean;
  variant?: 'light' | 'dark' | 'color';
}

const BrandLogo: React.FC<BrandLogoProps> = ({ className = "w-12 h-12", showText = false, variant = 'color' }) => {
  // توليد معرفات فريدة لمنع تداخل الألوان عند استخدام الشعار أكثر من مرة
  const uuid = useId ? useId().replace(/:/g, '') : Math.random().toString(36).substr(2, 9);
  const bgGradId = `blue_bg_${uuid}`;
  const checkGradId = `check_grad_${uuid}`;
  const glowFilterId = `glow_${uuid}`;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg viewBox="0 0 512 512" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
            {/* Background Gradient: Deep Royal Blue */}
            <linearGradient id={bgGradId} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#172554" />
            </linearGradient>
            
            {/* Checkmark Gradient: Golden Orange to Red-Orange */}
            <linearGradient id={checkGradId} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fbbf24" /> {/* Amber 400 */}
                <stop offset="50%" stopColor="#f59e0b" /> {/* Amber 500 */}
                <stop offset="100%" stopColor="#ea580c" /> {/* Orange 600 */}
            </linearGradient>

            <filter id={glowFilterId} x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="6" result="blur"/>
                <feComposite in="SourceGraphic" in2="blur" operator="over"/>
            </filter>
        </defs>

        {/* 1. Base Shape (Rounded Square) */}
        {/* Adjusted rx to 90 for a slightly more square look */}
        <rect x="20" y="20" width="472" height="472" rx="90" fill={`url(#${bgGradId})`} stroke="#60a5fa" strokeWidth="4" strokeOpacity="0.5" />

        {/* 2. Radar/Grooves Effect (Concentric Circles) - made subtle */}
        <circle cx="256" cy="256" r="170" fill="none" stroke="white" strokeWidth="1" strokeOpacity="0.1" />
        <circle cx="256" cy="256" r="130" fill="none" stroke="white" strokeWidth="1" strokeOpacity="0.05" />
        
        {/* 3. Main Glowing Ring */}
        <circle cx="256" cy="256" r="145" fill="none" stroke="white" strokeWidth="12" strokeLinecap="round" strokeOpacity="0.8" style={{filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.4))'}} />

        {/* 4. Checkmark - The Hero Element */}
        <path 
            d="M 160 260 L 225 325 L 355 185" 
            fill="none" 
            stroke={`url(#${checkGradId})`} 
            strokeWidth="42" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            style={{filter: `drop-shadow(0 4px 6px rgba(0,0,0,0.2))`}}
        />
        
        {/* 5. Glass Gloss Reflection (Top Half) */}
        <path d="M 40 120 Q 256 220 472 120 L 472 100 Q 472 50 422 50 L 90 50 Q 40 50 40 100 Z" fill="white" fillOpacity="0.12" />
        
        {/* 6. Subtle Bottom Shine */}
        <path d="M 120 480 Q 256 450 392 480" fill="none" stroke="white" strokeWidth="2" strokeOpacity="0.2" />

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
