import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { JobBoardPage } from './pages/JobBoardPage';
import { AuthPage } from './pages/AuthPage';
import { ClientDashboard } from './pages/ClientDashboard';
import { FreelancerDashboard } from './pages/FreelancerDashboard';
import { AdminDashboard } from './pages/AdminDashboard';

/**
 * Polymorphic Dashboard Dispatcher
 * Directly mirrors the C++ console polymorphism (different menu per role)
 * by dynamically rendering the role-specific view while maintaining uniform routing.
 */
const DashboardDispatcher = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
        Authenticating session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case 'Client':
      return <ClientDashboard />;
    case 'Freelancer':
      return <FreelancerDashboard />;
    case 'Admin':
      return <AdminDashboard />;
    default:
      return <Navigate to="/jobs" replace />;
  }
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app-container">
          <Navbar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Navigate to="/jobs" replace />} />
              <Route path="/jobs" element={<JobBoardPage />} />
              <Route path="/login" element={<AuthPage initialMode="login" />} />
              <Route path="/register" element={<AuthPage initialMode="register" />} />
              <Route path="/dashboard" element={<DashboardDispatcher />} />
              <Route path="*" element={<Navigate to="/jobs" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
