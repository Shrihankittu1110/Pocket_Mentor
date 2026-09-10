import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, School, BookOpen, Calendar, ArrowRight, AlertCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSound } from '../context/SoundContext';
import Logo from '../components/common/Logo';

export const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    college: '',
    course: '',
    year: '3rd Year',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const { playCorrect } = useSound();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(formData);
      playCorrect();
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center p-4 bg-[#f7f9fa] py-8">
      {/* Back to Home Link */}
      <div className="w-full max-w-lg mb-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-600 hover:text-mentor-green hover:border-emerald-300 transition shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
      </div>

      <div className="w-full max-w-lg bg-white rounded-3xl border-2 border-slate-200 p-8 shadow-xl space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <Logo size="lg" showText={false} />
          </div>
          <h1 className="font-fun text-2xl sm:text-3xl font-black text-slate-900">
            Create Pocket Mentor Account
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Join thousands of students learning faster with AI
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Full Name *
            </label>
            <div className="relative">
              <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                name="name"
                required
                disabled={loading}
                value={formData.name}
                onChange={handleChange}
                placeholder="Alex Rivera"
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-medium focus:bg-white focus:border-mentor-green focus:outline-none transition disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                name="email"
                required
                disabled={loading}
                value={formData.email}
                onChange={handleChange}
                placeholder="student@university.edu"
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-medium focus:bg-white focus:border-mentor-green focus:outline-none transition disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Password (min 6 chars) *
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                required
                minLength={6}
                disabled={loading}
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full pl-11 pr-11 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-medium focus:bg-white focus:border-mentor-green focus:outline-none transition disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1 transition-colors disabled:opacity-40"
                title={showPassword ? 'Hide password' : 'Show password'}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                College / University
              </label>
              <div className="relative">
                <School className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  name="college"
                  disabled={loading}
                  value={formData.college}
                  onChange={handleChange}
                  placeholder="MIT / Stanford / UCLA"
                  className="w-full pl-10 pr-3 py-2 bg-slate-50 border-2 border-slate-200 rounded-2xl text-xs font-medium focus:bg-white focus:border-mentor-green focus:outline-none transition disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Course / Major
              </label>
              <div className="relative">
                <BookOpen className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  name="course"
                  disabled={loading}
                  value={formData.course}
                  onChange={handleChange}
                  placeholder="Computer Science"
                  className="w-full pl-10 pr-3 py-2 bg-slate-50 border-2 border-slate-200 rounded-2xl text-xs font-medium focus:bg-white focus:border-mentor-green focus:outline-none transition disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Year of Study
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                name="year"
                disabled={loading}
                value={formData.year}
                onChange={handleChange}
                className="w-full pl-10 pr-3 py-2 bg-slate-50 border-2 border-slate-200 rounded-2xl text-xs font-medium focus:bg-white focus:border-mentor-green focus:outline-none transition disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100"
              >
                <option value="1st Year">1st Year (Freshman)</option>
                <option value="2nd Year">2nd Year (Sophomore)</option>
                <option value="3rd Year">3rd Year (Junior)</option>
                <option value="4th Year">4th Year (Senior)</option>
                <option value="Postgraduate">Postgraduate</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-2xl btn-duo-green text-base font-black flex items-center justify-center gap-2 mt-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-sm hover:brightness-105 active:translate-y-0.5"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Setting up Profile...</span>
              </>
            ) : (
              <>
                <span>Claim 100 Free XP & Register</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-xs font-bold text-slate-500 pt-2 border-t border-slate-100">
          Already a student?{' '}
          <Link to="/login" className="text-mentor-green hover:underline">
            Sign In Here
          </Link>
        </div>

      </div>
    </div>
  );
};

export default RegisterPage;
