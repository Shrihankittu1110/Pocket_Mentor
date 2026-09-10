import React, { useState, useEffect } from 'react';
import {
  User,
  School,
  BookOpen,
  Calendar,
  Flame,
  Star,
  Trophy,
  Award,
  Edit2,
  Check,
  X,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSound } from '../context/SoundContext';
import { getHumanAvatar, HUMAN_AVATAR_PRESETS } from '../utils/avatarHelper';

export const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const { playCorrect } = useSound();

  const [profileData, setProfileData] = useState(user);
  const [allAchievements, setAllAchievements] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: user?.name || '',
    college: user?.college || '',
    course: user?.course || '',
    year: user?.year || '',
    profileImage: getHumanAvatar(user),
  });

  useEffect(() => {
    const fetchProfileInfo = async () => {
      try {
        const { data } = await api.get('/progress');
        setAllAchievements(data.allAvailableAchievements || []);
        if (data) {
          setProfileData(prev => ({
            ...prev,
            dailyStreak: data.dailyStreak,
            longestStreak: data.longestStreak,
            totalPoints: data.totalPoints,
            achievements: data.achievements,
          }));
        }
      } catch (err) {
        console.error('Failed to load profile extra data:', err);
      }
    };

    fetchProfileInfo();
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.put('/auth/profile', editForm);
      updateUser(data);
      setProfileData(prev => ({ ...prev, ...data }));
      setIsEditing(false);
      playCorrect();
    } catch (err) {
      alert('Failed to update profile');
    }
  };

  const unlockedSlugs = new Set((profileData?.achievements || []).map(a => a.slug));

  // Calculate Duolingo-style XP Level
  const currentXP = profileData?.totalPoints || user?.totalPoints || 0;
  const currentLevel = Math.floor(currentXP / 100) + 1;
  const xpInCurrentLevel = currentXP % 100;

  return (
    <div className="space-y-8 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      
      {/* Header Profile Card */}
      <div className="bg-white rounded-3xl border-2 border-slate-200 p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
          
          <img
            src={getHumanAvatar(profileData || user)}
            alt="profile"
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl border-4 border-emerald-300 bg-slate-50 shadow-md object-cover"
          />

          <div className="space-y-2 text-center sm:text-left flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h1 className="font-fun text-3xl font-black text-slate-900">
                {profileData?.name || 'Student Name'}
              </h1>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="self-center sm:self-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>{isEditing ? 'Cancel Edit' : 'Edit Profile'}</span>
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-500 font-medium">{profileData?.email}</p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2 text-xs font-bold text-slate-600">
              <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl">
                <School className="w-4 h-4 text-slate-400" />
                {profileData?.college || 'University Student'}
              </span>
              <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl">
                <BookOpen className="w-4 h-4 text-slate-400" />
                {profileData?.course || 'Computer Science'}
              </span>
              <span className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl">
                <Calendar className="w-4 h-4 text-slate-400" />
                {profileData?.year || '3rd Year'}
              </span>
            </div>
          </div>
        </div>

        {/* Edit Form Drawer */}
        {isEditing && (
          <form onSubmit={handleSaveProfile} className="mt-6 pt-6 border-t border-slate-100 space-y-4">
            {/* Choose Human Avatar */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-2">
                Choose Your Human Avatar
              </label>
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {HUMAN_AVATAR_PRESETS.map((avatar) => {
                  const isSelected = editForm.profileImage === avatar.url;
                  return (
                    <button
                      key={avatar.id}
                      type="button"
                      onClick={() => setEditForm({ ...editForm, profileImage: avatar.url })}
                      className={`relative p-1 rounded-2xl border-2 transition shrink-0 ${
                        isSelected
                          ? 'border-mentor-green bg-emerald-50 scale-105 shadow-duo-sm'
                          : 'border-slate-200 hover:border-emerald-300'
                      }`}
                    >
                      <img
                        src={avatar.url}
                        alt={avatar.name}
                        className="w-12 h-12 rounded-xl object-cover bg-white"
                      />
                      {isSelected && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-mentor-green text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-mentor-green"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">College / University</label>
                <input
                  type="text"
                  value={editForm.college}
                  onChange={(e) => setEditForm({ ...editForm, college: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-mentor-green"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Course / Major</label>
                <input
                  type="text"
                  value={editForm.course}
                  onChange={(e) => setEditForm({ ...editForm, course: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-mentor-green"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Year</label>
                <input
                  type="text"
                  value={editForm.year}
                  onChange={(e) => setEditForm({ ...editForm, year: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-mentor-green"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl btn-duo-white text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl btn-duo-green text-xs font-black"
              >
                Save Changes
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Gamification Level & Streak Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Level Rank Card */}
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-3xl p-6 shadow-duo-blue space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-blue-100 bg-white/20 px-2.5 py-0.5 rounded-full">
              Scholar Rank
            </span>
            <Sparkles className="w-5 h-5 text-blue-200" />
          </div>
          <h2 className="font-fun text-3xl font-black">Level {currentLevel}</h2>
          <div className="w-full h-3 bg-blue-400/40 rounded-full overflow-hidden p-0.5">
            <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${xpInCurrentLevel}%` }} />
          </div>
          <p className="text-xs text-blue-100 font-semibold">{xpInCurrentLevel} / 100 XP to Level {currentLevel + 1}</p>
        </div>

        {/* Streak Card */}
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-3xl p-6 shadow-duo-orange space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-100 bg-white/20 px-2.5 py-0.5 rounded-full">
              Active Streak
            </span>
            <Flame className="w-5 h-5 text-white animate-flame" />
          </div>
          <h2 className="font-fun text-3xl font-black">{profileData?.dailyStreak || 1} Days</h2>
          <p className="text-xs text-amber-100 font-medium leading-relaxed">
            Record: {profileData?.longestStreak || 1} Days. Study every day to keep your flame lit!
          </p>
        </div>

        {/* Total Knowledge Points */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-3xl p-6 shadow-duo-green space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-100 bg-white/20 px-2.5 py-0.5 rounded-full">
              Total Points
            </span>
            <Star className="w-5 h-5 text-yellow-300 fill-yellow-300" />
          </div>
          <h2 className="font-fun text-3xl font-black">{profileData?.totalPoints || 0} XP</h2>
          <p className="text-xs text-emerald-100 font-medium leading-relaxed">
            Earn points from quizzes (+10/+50), flashcards (+5), and teaching peers (+25).
          </p>
        </div>

      </div>

      {/* Achievements Showcase (Duolingo Style Badges) */}
      <div className="bg-white rounded-3xl border-2 border-slate-200 p-6 sm:p-8 space-y-6 shadow-sm">
        <div>
          <h2 className="font-fun text-2xl font-black text-slate-900 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            <span>🏆 Learning Achievements & Badges</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Collect special recognition badges as you hit study milestones
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {allAchievements.map((ach) => {
            const isUnlocked = unlockedSlugs.has(ach.slug);
            return (
              <div
                key={ach.slug}
                className={`p-5 rounded-3xl border-2 transition flex items-start gap-4 ${
                  isUnlocked
                    ? 'bg-amber-50/50 border-amber-300 shadow-sm'
                    : 'bg-slate-50 border-slate-200 opacity-60'
                }`}
              >
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shrink-0 ${
                    isUnlocked
                      ? 'bg-gradient-to-tr from-amber-400 to-yellow-300 shadow-duo-sm'
                      : 'bg-slate-200 grayscale'
                  }`}
                >
                  {ach.icon || '🏆'}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-fun text-base font-bold text-slate-900">{ach.title}</h3>
                    {isUnlocked && (
                      <Check className="w-4 h-4 text-mentor-green stroke-[3]" />
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    {ach.description}
                  </p>
                  <span className="inline-block text-[11px] font-black text-amber-600 bg-amber-100/60 px-2 py-0.5 rounded-md mt-1">
                    +{ach.points} XP
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default ProfilePage;
