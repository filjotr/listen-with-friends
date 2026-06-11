import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { RoomProvider } from './context/RoomContext';

import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import RoomPage from './pages/RoomPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';

// Protected Route wrapper for routes that require session tokens
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-t-2 border-brandCyan rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Redirect wrapper for Guest routes (like login/register) when token exists
function GuestRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-t-2 border-brandCyan rounded-full animate-spin"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <RoomProvider>
            
            {/* Ambient Background decoration (Always visible) */}
            <div className="ambient-bg">
              <div className="ambient-glow-cyan"></div>
              <div className="ambient-glow-pink"></div>
            </div>

            {/* Premium Header */}
            <Navbar />

            {/* Layout body */}
            <main className="min-h-screen flex flex-col justify-center">
              <Routes>
                {/* Guest routes */}
                <Route path="/" element={<LandingPage />} />
                <Route 
                  path="/login" 
                  element={
                    <GuestRoute>
                      <LoginPage />
                    </GuestRoute>
                  } 
                />
                <Route 
                  path="/register" 
                  element={
                    <GuestRoute>
                      <RegisterPage />
                    </GuestRoute>
                  } 
                />

                {/* Authenticated routes */}
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/room/:code" 
                  element={
                    <ProtectedRoute>
                      <RoomPage />
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
                <Route 
                  path="/settings" 
                  element={
                    <ProtectedRoute>
                      <SettingsPage />
                    </ProtectedRoute>
                  } 
                />

                {/* Error handling */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </main>

          </RoomProvider>
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}
