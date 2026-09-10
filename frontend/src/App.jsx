import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import BottomNav from './components/layout/BottomNav';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import NotesPage from './pages/NotesPage';
import QuickRevisionPage from './pages/QuickRevisionPage';
import FlashcardsPage from './pages/FlashcardsPage';
import QuizPage from './pages/QuizPage';
import StudyGroupsPage from './pages/StudyGroupsPage';
import PeerTeachingPage from './pages/PeerTeachingPage';
import ProgressPage from './pages/ProgressPage';
import MyLearningPage from './pages/MyLearningPage';
import ProfilePage from './pages/ProfilePage';

// Protected Route Guard
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f9fa]">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-mentor-green border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="font-fun font-bold text-slate-700">Loading Pocket Mentor...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export const App = () => {
  const { isAuthenticated } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();

  const isPublicPage = location.pathname === '/' || location.pathname === '/login' || location.pathname === '/register';

  return (
    <div className={`flex flex-col bg-[#f7f9fa] text-slate-800 ${!isPublicPage ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
      
      {/* Top Navbar */}
      <Navbar onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)} />

      {/* Main Layout Area */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Desktop Sidebar (Only when authenticated and not on landing/auth) */}
        {isAuthenticated && !isPublicPage && (
          <Sidebar
            isMobileOpen={mobileSidebarOpen}
            onCloseMobile={() => setMobileSidebarOpen(false)}
          />
        )}

        {/* Page Viewport */}
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-8">
          <Routes>
            <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Authenticated Student Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notes"
              element={
                <ProtectedRoute>
                  <NotesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/quick-revision"
              element={
                <ProtectedRoute>
                  <QuickRevisionPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/flashcards"
              element={
                <ProtectedRoute>
                  <FlashcardsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/quiz"
              element={
                <ProtectedRoute>
                  <QuizPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/groups"
              element={
                <ProtectedRoute>
                  <StudyGroupsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/peer-teaching"
              element={
                <ProtectedRoute>
                  <PeerTeachingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/progress"
              element={
                <ProtectedRoute>
                  <ProgressPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-learning"
              element={
                <ProtectedRoute>
                  <MyLearningPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      {isAuthenticated && !isPublicPage && <BottomNav />}

    </div>
  );
};

export default App;
