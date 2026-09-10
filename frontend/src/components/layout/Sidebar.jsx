import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BookMarked,
  Zap,
  Layers,
  HelpCircle,
  Users,
  GraduationCap,
  BarChart3,
  Trophy,
  Flame,
  LogOut,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, color: 'text-emerald-500' },
  { name: 'My Notes', path: '/notes', icon: BookMarked, color: 'text-blue-500' },
  { name: '60s Quick Revision', path: '/quick-revision', icon: Zap, color: 'text-amber-500' },
  { name: 'Flashcards', path: '/flashcards', icon: Layers, color: 'text-purple-500' },
  { name: 'Quiz Arena', path: '/quiz', icon: HelpCircle, color: 'text-rose-500' },
  { name: 'Study Groups', path: '/groups', icon: Users, color: 'text-cyan-500' },
  { name: 'Peer Teaching', path: '/peer-teaching', icon: GraduationCap, color: 'text-indigo-500' },
  { name: 'Progress', path: '/progress', icon: BarChart3, color: 'text-teal-500' },
  { name: 'Achievements', path: '/profile', icon: Trophy, color: 'text-yellow-500' },
];

export const Sidebar = ({ isMobileOpen, onCloseMobile }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    if (onCloseMobile) onCloseMobile();
    navigate('/login');
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-slate-200 w-64 p-4">
      
      {/* Mobile close button header */}
      <div className="flex items-center justify-between lg:hidden mb-4 pb-2 border-b border-slate-100">
        <span className="font-fun text-xl font-bold text-slate-800">Navigation</span>
        <button onClick={onCloseMobile} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Nav List */}
      <nav className="flex-1 space-y-1.5 overflow-y-auto pr-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-2xl font-bold text-sm transition ${
                  isActive
                    ? 'bg-emerald-50 text-mentor-green border-2 border-emerald-300 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-2 border-transparent'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-5 h-5 ${isActive ? 'text-mentor-green' : item.color}`} />
                  <span>{item.name}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Daily Streak Motivator Card at bottom of sidebar */}
      {user && (
        <div className="mt-3 p-3.5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-mentor-orange/20 flex items-center justify-center">
              <Flame className="w-5 h-5 text-mentor-orange fill-mentor-orange animate-flame" />
            </div>
            <div>
              <p className="font-fun font-bold text-amber-900 text-xs sm:text-sm">
                {user.dailyStreak || 1} Day Streak!
              </p>
              <p className="text-[10px] font-medium text-amber-700">
                Keep learning daily!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Sign Out Button at the Last of Sidebar */}
      <button
        onClick={handleLogout}
        className="mt-3 w-full flex items-center justify-center gap-2.5 px-3.5 py-2.5 rounded-2xl font-bold text-sm text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition active:translate-y-0.5 shadow-sm"
      >
        <LogOut className="w-4 h-4" />
        <span>Sign Out</span>
      </button>

    </div>
  );

  return (
    <>
      {/* Desktop Persistent Fixed Sidebar */}
      <aside className="hidden lg:flex shrink-0 w-64 h-full z-30 flex-col">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white z-50 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
