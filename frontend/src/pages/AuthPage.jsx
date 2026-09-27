import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, UserPlus, AlertCircle, CheckCircle, GraduationCap, Briefcase, Shield } from 'lucide-react';

export const AuthPage = ({ initialMode = 'login' }) => {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [role, setRole] = useState('Freelancer');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      if (isLogin) {
        await login(email, password);
        navigate('/dashboard');
      } else {
        // Client-side quick hint check
        if (role === 'Freelancer' && !email.toLowerCase().endsWith('@vit.edu')) {
          setError('Freelancer accounts require a valid college email ending in @vit.edu.');
          setSubmitting(false);
          return;
        }

        const res = await register({ name, email, password, role });
        setSuccess(res?.message || 'Registration successful!');
        setTimeout(() => {
          navigate('/dashboard');
        }, 600);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify your details.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 460, margin: '2rem auto' }}>
      <div className="card" style={{ padding: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <h2 style={{ fontSize: '1.6rem', marginBottom: '0.35rem' }}>
            {isLogin ? 'Welcome Back to CampusGig' : 'Create Your Account'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            {isLogin
              ? 'Access your college freelancing marketplace account'
              : 'Join the premier campus gig community for students and clients'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          background: 'rgba(0,0,0,0.25)',
          borderRadius: 'var(--radius-md)',
          padding: 4,
          marginBottom: '1.5rem',
        }}>
          <button
            type="button"
            className={`btn btn-sm ${isLogin ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: 'var(--radius-sm)' }}
            onClick={() => { setIsLogin(true); setError(''); }}
          >
            <LogIn size={14} />
            Log In
          </button>
          <button
            type="button"
            className={`btn btn-sm ${!isLogin ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: 'var(--radius-sm)' }}
            onClick={() => { setIsLogin(false); setError(''); }}
          >
            <UserPlus size={14} />
            Register
          </button>
        </div>

        {error && (
          <div className="alert alert-danger">
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <div>{error}</div>
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <CheckCircle size={18} style={{ flexShrink: 0 }} />
            <div>{success}</div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              {/* Role Selection */}
              <div className="form-group">
                <label className="form-label">Select Your Role</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setRole('Freelancer')}
                    className={`btn btn-sm ${role === 'Freelancer' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flexDirection: 'column', padding: '0.625rem 0.25rem', gap: 4 }}
                  >
                    <GraduationCap size={16} />
                    <span>Freelancer</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('Client')}
                    className={`btn btn-sm ${role === 'Client' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flexDirection: 'column', padding: '0.625rem 0.25rem', gap: 4 }}
                  >
                    <Briefcase size={16} />
                    <span>Client</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('Admin')}
                    className={`btn btn-sm ${role === 'Admin' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flexDirection: 'column', padding: '0.625rem 0.25rem', gap: 4 }}
                  >
                    <Shield size={16} />
                    <span>Admin</span>
                  </button>
                </div>

                {role === 'Freelancer' && (
                  <p className="form-helper" style={{ color: '#38bdf8', marginTop: '0.5rem' }}>
                    ⓘ Note: Freelancers must register with institutional email ending in <strong>@vit.edu</strong>.
                  </p>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. Rohan Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              required
              className="form-input"
              placeholder={role === 'Freelancer' && !isLogin ? 'yourname@vit.edu' : 'you@example.com'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              required
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.75rem', padding: '0.75rem' }}
            disabled={submitting}
          >
            {submitting ? 'Please wait...' : isLogin ? 'Sign In to CampusGig' : `Register as ${role}`}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          {isLogin ? (
            <span>
              Don't have an account yet?{' '}
              <button
                type="button"
                style={{ background: 'none', color: 'var(--primary)', fontWeight: 600 }}
                onClick={() => { setIsLogin(false); setError(''); }}
              >
                Create one now
              </button>
            </span>
          ) : (
            <span>
              Already registered?{' '}
              <button
                type="button"
                style={{ background: 'none', color: 'var(--primary)', fontWeight: 600 }}
                onClick={() => { setIsLogin(true); setError(''); }}
              >
                Sign In
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
