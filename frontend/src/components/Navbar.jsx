import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { RoleBadge } from './RoleBadge';
import { Sparkles, LogOut, LayoutDashboard, Search, LogIn } from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="nav-inner">
        <Link to="/jobs" className="brand-logo">
          <Sparkles size={22} color="#6366f1" />
          <span>CampusGig</span>
          <span className="brand-badge">Web v2.0</span>
        </Link>

        <div className="nav-links">
          <Link
            to="/jobs"
            className={`nav-link ${location.pathname === '/jobs' ? 'active' : ''}`}
          >
            <Search size={15} style={{ display: 'inline', marginRight: 4, verticalAlign: 'text-bottom' }} />
            Job Board
          </Link>

          {user && (
            <Link
              to="/dashboard"
              className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
            >
              <LayoutDashboard size={15} style={{ display: 'inline', marginRight: 4, verticalAlign: 'text-bottom' }} />
              {user.role} Dashboard
            </Link>
          )}

          {user ? (
            <div className="nav-user">
              <div className="user-tag">
                <span className="user-name">{user.name}</span>
                <RoleBadge role={user.role} />
              </div>
              <button onClick={handleLogout} className="btn btn-secondary btn-sm" title="Log Out">
                <LogOut size={14} />
                Logout
              </button>
            </div>
          ) : (
            <div className="nav-links">
              <Link to="/login" className="btn btn-secondary btn-sm">
                <LogIn size={14} />
                Log In
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
