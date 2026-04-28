import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Spinner } from './components/UI';
import Navbar from './components/Navbar';

import Landing from './pages/Landing';
import { SignIn, Register, ConfirmEmail } from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import { NewProject, EditProject, ProjectDetail } from './pages/ProjectPages';
import ThreadDetail from './pages/ThreadDetail';
import Admin from './pages/Admin';
import Profile from './pages/Profile';

import './index.css';

/* ─── Route guards ─────────────────────────────────────────────────────────── */

// Shows a branded loader while Cognito session is being restored
const LoadingScreen = () => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: '100vh', background: 'var(--cream)',
  }}>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <span style={{ fontSize: '40px' }}>⛺</span>
      <Spinner size={28} />
      <p style={{ color: 'var(--muted)', fontSize: '13px' }}>Restoring your session…</p>
    </div>
  </div>
);

// Requires a valid Cognito session
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/signin" replace />;
  if (adminOnly && !user.isAdmin) return <Navigate to="/dashboard" replace />;
  return children;
};

// Redirects to dashboard if already authenticated
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
};

// Wraps authenticated pages with the Navbar and top padding
const AppShell = ({ children }) => (
  <>
    <Navbar />
    <div style={{ paddingTop: 60 }}>{children}</div>
  </>
);

/* ─── Router ────────────────────────────────────────────────────────────────── */
const AppRoutes = () => (
  <Routes>
    {/* Public */}
    <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
    <Route path="/signin" element={<PublicRoute><SignIn /></PublicRoute>} />
    <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
    {/* Cognito email confirmation step — unique to Gen 2 */}
    <Route path="/confirm-email" element={<PublicRoute><ConfirmEmail /></PublicRoute>} />

    {/* Protected */}
    <Route path="/dashboard" element={<ProtectedRoute><AppShell><Dashboard /></AppShell></ProtectedRoute>} />
    <Route path="/projects" element={<ProtectedRoute><AppShell><Projects /></AppShell></ProtectedRoute>} />
    <Route path="/projects/new" element={<ProtectedRoute><AppShell><NewProject /></AppShell></ProtectedRoute>} />
    <Route path="/projects/:id" element={<ProtectedRoute><AppShell><ProjectDetail /></AppShell></ProtectedRoute>} />
    <Route path="/projects/:projectId/threads/:threadId" element={<ProtectedRoute><AppShell><ThreadDetail /></AppShell></ProtectedRoute>} />
    <Route path="/projects/:id/edit" element={<ProtectedRoute><AppShell><EditProject /></AppShell></ProtectedRoute>} />
    <Route path="/admin" element={<ProtectedRoute adminOnly><AppShell><Admin /></AppShell></ProtectedRoute>} />
    <Route path="/profile" element={<ProtectedRoute><AppShell><Profile /></AppShell></ProtectedRoute>} />

    {/* Fallback */}
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </BrowserRouter>
);

export default App;
