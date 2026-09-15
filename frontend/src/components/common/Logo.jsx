import React from 'react';
import { GraduationCap } from 'lucide-react';

export const Logo = ({ size = 'md', showText = true, badge = 'AI LEARNING' }) => {
  const isSmall = size === 'sm';
  const isLarge = size === 'lg';

  const boxSize = isSmall ? 'w-8 h-8' : isLarge ? 'w-14 h-14' : 'w-10 h-10';
  const iconSize = isSmall ? 'w-4 h-4' : isLarge ? 'w-8 h-8' : 'w-5 h-5';
  const textSize = isSmall ? 'text-lg' : isLarge ? 'text-3xl' : 'text-2xl';

  return (
    <div className="flex items-center gap-2.5 group">
      {/* Modern Gradient Emblem with Graduation Cap */}
      <div
        className={`${boxSize} rounded-2xl bg-gradient-to-tr from-mentor-green via-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-duo-green group-hover:scale-105 transition-transform`}
      >
        <GraduationCap className={`${iconSize} stroke-[2.4] text-white`} />
      </div>

      {showText && (
        <div className="flex items-center gap-1.5">
          <span className={`font-fun ${textSize} font-black tracking-tight text-slate-800 group-hover:text-mentor-green transition-colors`}>
            Pocket Mentor
          </span>
          {badge && (
            <span className="hidden sm:inline-block px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase rounded-md tracking-wider">
              {badge}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default Logo;

