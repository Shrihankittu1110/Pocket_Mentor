import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Flame, Star, Volume2, VolumeX, LogOut, User, Menu, X, BookOpen, Layers } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSound } from '../../context/SoundContext';
import Logo from '../common/Logo';
import { getHumanAvatar } from '../../utils/avatarHelper';

export const Navbar = ({ onToggleMobileSidebar }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const { soundEnabled, toggleSound } = useSound();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        
        {/* Brand & Mobile Hamburger */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {isAuthenticated && (
            <button
              onClick={onToggleMobileSidebar}
              className="p-2 -ml-1 sm:-ml-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:scale-105 active:scale-95 transition-all duration-200 lg:hidden min-w-[40px] min-h-[40px] flex items-center justify-center cursor-pointer"
              aria-label="Toggle navigation drawer"
            >
              <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          )}

          <Link to={isAuthenticated ? "/dashboard" : "/"} className="transition-transform duration-200 hover:scale-105 shrink-0">
            <Logo badge="AI LEARNING" />
          </Link>
        </div>

        {/* Center / Right Header Badges */}
        {isAuthenticated && user ? (
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            
            {/* Streak Flame Badge */}
            <Link
              to="/progress"
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-2xl bg-amber-50 border border-amber-200 hover:bg-amber-100 hover:border-amber-300 hover:scale-105 active:scale-95 transition-all duration-200 shadow-xs group cursor-pointer"
              title="Daily Streak"
            >
              <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-mentor-orange fill-mentor-orange animate-flame group-hover:scale-110 transition-transform duration-200 shrink-0" />
              <span className="font-fun font-bold text-mentor-orange text-xs sm:text-sm">
                {user.dailyStreak ?? 0}
              </span>
              <span className="hidden md:inline text-xs font-bold text-amber-800">
                Days
              </span>
            </Link>

            {/* Total Points (XP) Gem Badge (Visible on sm and up) */}
            <div
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-blue-50 border border-blue-200 hover:bg-blue-100 hover:border-blue-300 hover:scale-105 transition-all duration-200 shadow-xs group cursor-default"
              title="Total XP Points"
            >
              <Star className="w-4 h-4 text-mentor-blue fill-mentor-blue group-hover:scale-110 transition-transform duration-200 shrink-0" />
              <span className="font-fun font-bold text-mentor-blue text-xs sm:text-sm">
                {user.totalPoints ?? 0}
              </span>
              <span className="hidden md:inline text-xs font-bold text-blue-800">
                XP
              </span>
            </div>

            {/* Sound Effects Toggle (Visible on sm and up) */}
            <button
              onClick={toggleSound}
              className={`hidden sm:flex p-2 rounded-xl border transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer shadow-xs items-center justify-center ${
                soundEnabled
                  ? 'bg-emerald-50 border-emerald-200 text-mentor-green hover:bg-emerald-100 hover:border-emerald-300'
                  : 'bg-slate-100 border-slate-200 text-slate-400 hover:bg-slate-200 hover:text-slate-600'
              }`}
              title={soundEnabled ? "Mute Game Sounds" : "Unmute Game Sounds"}
              aria-label="Toggle game audio"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 p-1 rounded-full hover:ring-4 hover:ring-emerald-400/30 hover:scale-105 active:scale-95 transition-all duration-200 min-w-[40px] min-h-[40px] justify-center cursor-pointer"
                aria-label="User profile menu"
              >
                <img
                  src={getHumanAvatar(user)}
                  alt={user.name}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 border border-slate-200 object-cover"
                />
              </button>

              {dropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setDropdownOpen(false)}
                  />
                  <div
                    className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <div className="px-4 py-2.5 border-b border-slate-100">
                      <p className="font-bold text-slate-800 truncate text-sm">{user.name}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      {user.college && (
                        <p className="text-[11px] font-semibold text-mentor-green mt-0.5 truncate">{user.college}</p>
                      )}
                      
                      {/* Mobile stats breakdown inside dropdown */}
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100 sm:hidden">
                        <span className="flex items-center gap-1 text-[11px] font-bold text-mentor-blue bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200">
                          <Star className="w-3 h-3 fill-mentor-blue" />
                          {user.totalPoints ?? 0} XP
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSound();
                          }}
                          className="flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200"
                        >
                          {soundEnabled ? <Volume2 className="w-3 h-3 text-mentor-green" /> : <VolumeX className="w-3 h-3" />}
                          <span>{soundEnabled ? 'Sound On' : 'Muted'}</span>
                        </button>
                      </div>
                    </div>

                    <div className="py-1">
                      <Link
                        to="/profile"
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs sm:text-sm text-slate-700 hover:bg-slate-50 font-medium"
                      >
                        <User className="w-4 h-4 text-slate-500" />
                        My Profile & Badges
                      </Link>
                      <Link
                        to="/my-learning"
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs sm:text-sm text-slate-700 hover:bg-slate-50 font-medium"
                      >
                        <BookOpen className="w-4 h-4 text-slate-500" />
                        My Learning Library
                      </Link>
                      <Link
                        to="/progress"
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs sm:text-sm text-slate-700 hover:bg-slate-50 font-medium sm:hidden"
                      >
                        <Flame className="w-4 h-4 text-mentor-orange" />
                        Streak & Analytics
                      </Link>
                    </div>

                    <div className="border-t border-slate-100 my-1"></div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs sm:text-sm text-red-600 hover:bg-red-50 font-bold text-left cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>

          </div>
        ) : (
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/login"
              className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold text-slate-700 hover:text-mentor-green transition-all duration-200 min-h-[40px] flex items-center"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold rounded-xl btn-duo-green hover:scale-105 active:scale-95 transition-all duration-200 shadow-sm min-h-[40px] flex items-center"
            >
              Get Started Free
            </Link>
          </div>
        )}

      </div>
    </header>
  );
};

export default Navbar;

