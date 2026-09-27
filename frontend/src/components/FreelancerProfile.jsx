import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { RoleBadge, StatusBadge } from './RoleBadge';
import { Modal } from './Modal';
import {
  GraduationCap,
  Award,
  DollarSign,
  FileCheck,
  CheckCircle2,
  Clock,
  Edit3,
  Mail,
  Building,
  ShieldCheck,
  Sparkles,
  Code2,
  Video,
  Layers,
  AlertCircle
} from 'lucide-react';

export const FreelancerProfile = ({ userId, isOwnProfile = true, onClose = null }) => {
  const { user: authUser, login } = useAuth();
  const targetId = userId || authUser?.id;

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Edit Profile Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  // Editable / customizable bio & skills (persisted in localStorage per user)
  const [bio, setBio] = useState(() => {
    return localStorage.getItem(`cg_bio_${targetId}`) ||
      'Third-year student specialized in video editing, motion graphics, and full-stack software development. Open for campus club projects, hackathon initiatives, and creative freelance gigs.';
  });
  const [skills, setSkills] = useState(() => {
    const saved = localStorage.getItem(`cg_skills_${targetId}`);
    return saved ? JSON.parse(saved) : [
      'React.js', 'Next.js', 'Node.js', 'Premiere Pro', 'After Effects', 'Flutter', 'Python', 'Figma', 'UI/UX Design'
    ];
  });
  const [newSkill, setNewSkill] = useState('');

  const loadProfileData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getUserProfile(targetId);
      if (data?.user) {
        setProfile(data.user);
        setName(data.user.name);
      }
    } catch (err) {
      setError(err.message || 'Failed to retrieve profile details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (targetId) {
      loadProfileData();
    }
  }, [targetId]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError('');
    try {
      const payload = { name };
      if (password) payload.password = password;
      const res = await api.updateProfile(payload);

      setSuccess('Profile updated successfully!');
      setIsEditModalOpen(false);
      setPassword('');
      loadProfileData();

      // Update local storage user if editing own profile
      if (isOwnProfile && authUser) {
        const updated = { ...authUser, name };
        localStorage.setItem('cg_user', JSON.stringify(updated));
      }
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setEditError(err.message || 'Failed to update profile.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleSaveBio = (newBio) => {
    setBio(newBio);
    localStorage.setItem(`cg_bio_${targetId}`, newBio);
  };

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (!newSkill.trim()) return;
    if (!skills.includes(newSkill.trim())) {
      const updated = [...skills, newSkill.trim()];
      setSkills(updated);
      localStorage.setItem(`cg_skills_${targetId}`, JSON.stringify(updated));
    }
    setNewSkill('');
  };

  const handleRemoveSkill = (skillToRemove) => {
    const updated = skills.filter((s) => s !== skillToRemove);
    setSkills(updated);
    localStorage.setItem(`cg_skills_${targetId}`, JSON.stringify(updated));
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
        Loading student freelancer profile...
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="alert alert-danger">
        <AlertCircle size={18} />
        <div>{error || 'Unable to display profile.'}</div>
      </div>
    );
  }

  const initials = profile.name
    ? profile.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
    : 'ST';

  return (
    <div style={{ maxWidth: 880, margin: '0 auto' }}>
      {success && (
        <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}>
          <CheckCircle2 size={18} />
          <div>{success}</div>
        </div>
      )}

      {/* Main Profile Header Card */}
      <div className="card" style={{ padding: '2rem', marginBottom: '1.5rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: 250,
          height: 250,
          background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            {/* Avatar */}
            <div style={{
              width: 80,
              height: 80,
              borderRadius: 'var(--radius-full)',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '1.85rem',
              fontWeight: 800,
              boxShadow: '0 0 25px rgba(99,102,241,0.4)',
              border: '3px solid rgba(255,255,255,0.15)',
              flexShrink: 0,
            }}>
              {initials}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
                <h2 style={{ fontSize: '1.6rem', color: '#fff' }}>{profile.name}</h2>
                <RoleBadge role={profile.role} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--text-secondary)', fontSize: '0.875rem', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Mail size={14} color="var(--primary)" />
                  {profile.email}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Building size={14} color="var(--info)" />
                  {profile.institution}
                </span>
              </div>

              {profile.isVerifiedStudent && (
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  marginTop: '0.625rem',
                  padding: '0.2rem 0.625rem',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(16,185,129,0.12)',
                  color: '#34d399',
                  border: '1px solid rgba(16,185,129,0.3)',
                  fontSize: '0.775rem',
                  fontWeight: 600,
                }}>
                  <ShieldCheck size={14} />
                  Institution Domain Verified (@vit.edu)
                </div>
              )}
            </div>
          </div>

          {isOwnProfile && (
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="btn btn-secondary btn-sm"
              style={{ alignSelf: 'flex-start' }}
            >
              <Edit3 size={14} />
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Freelance Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem',
      }}>
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: 4 }}>
            <Clock size={15} color="var(--primary)" />
            Proposals Submitted
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff' }}>
            {profile.stats?.totalApplications || 0}
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: 4 }}>
            <Award size={15} color="var(--info)" />
            Gigs Awarded / Active
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#38bdf8' }}>
            {profile.stats?.acceptedGigs || 0}
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: 4 }}>
            <CheckCircle2 size={15} color="var(--success)" />
            Gigs Completed
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#34d399' }}>
            {profile.stats?.completedGigs || 0}
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: 4 }}>
            <DollarSign size={15} color="#fbbf24" />
            Total Earned
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fbbf24' }}>
            ${Number(profile.stats?.totalEarnings || 0).toFixed(2)}
          </div>
        </div>
      </div>

      {/* About Me & Bio Section */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.15rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Sparkles size={16} color="var(--primary)" />
          About Me & Campus Bio
        </h3>

        {isOwnProfile ? (
          <div>
            <textarea
              className="form-textarea"
              rows={3}
              value={bio}
              onChange={(e) => handleSaveBio(e.target.value)}
              placeholder="Tell clients about your background, major, technical interests, and past projects..."
            />
            <p className="form-helper">This bio is visible to campus clubs and faculty when they review your proposals.</p>
          </div>
        ) : (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.925rem', lineHeight: 1.6 }}>
            {bio}
          </p>
        )}
      </div>

      {/* Skills & Expertise Section */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h3 style={{ fontSize: '1.15rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Code2 size={16} color="var(--success)" />
          Verified Technical Skills & Specializations
        </h3>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: isOwnProfile ? '1rem' : 0 }}>
          {skills.map((skill) => (
            <span
              key={skill}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '0.35rem 0.75rem',
                background: 'rgba(99,102,241,0.12)',
                color: '#818cf8',
                border: '1px solid rgba(99,102,241,0.25)',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.8rem',
                fontWeight: 600,
              }}
            >
              {skill}
              {isOwnProfile && (
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  style={{ background: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.9rem', lineHeight: 1 }}
                  title="Remove skill"
                >
                  ×
                </button>
              )}
            </span>
          ))}
        </div>

        {isOwnProfile && (
          <form onSubmit={handleAddSkill} style={{ display: 'flex', gap: '0.5rem', maxWidth: 360, marginTop: '0.5rem' }}>
            <input
              type="text"
              className="form-input"
              style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
              placeholder="Add skill (e.g. Docker, Figma, Video Editing)..."
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
            />
            <button type="submit" className="btn btn-secondary btn-sm">
              Add
            </button>
          </form>
        )}
      </div>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Freelancer Profile"
      >
        <form onSubmit={handleSaveProfile}>
          {editError && (
            <div className="alert alert-danger">
              <AlertCircle size={16} />
              <div>{editError}</div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              required
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">College Email (Read Only)</label>
            <input
              type="email"
              disabled
              className="form-input"
              value={profile.email}
              style={{ opacity: 0.6, cursor: 'not-allowed' }}
            />
            <p className="form-helper">Institution email cannot be changed to maintain verified student status.</p>
          </div>

          <div className="form-group">
            <label className="form-label">New Password (leave blank to keep current)</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={editLoading}>
              {editLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
