import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, BookOpen, Layers, Users, User } from 'lucide-react';

const mobileNavItems = [
  { name: 'Home', path: '/dashboard', icon: Home },
  { name: 'Learn', path: '/notes', icon: BookOpen },
  { name: 'Cards', path: '/flashcards', icon: Layers },
  { name: 'Groups', path: '/groups', icon: Users },
  { name: 'Profile', path: '/profile', icon: User },
];

export const BottomNav = () => {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200 px-2 py-1.5 flex items-center justify-around shadow-lg">
      {mobileNavItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 px-3 rounded-xl transition ${
                isActive
                  ? 'text-mentor-green font-extrabold scale-105'
                  : 'text-slate-500 font-semibold hover:text-slate-800'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`p-1 rounded-lg ${isActive ? 'bg-emerald-50' : ''}`}>
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                </div>
                <span className="text-[10px] mt-0.5 tracking-tight">{item.name}</span>
              </>
            )}
          </NavLink>
        );
      })}
    </div>
  );
};

export default BottomNav;
