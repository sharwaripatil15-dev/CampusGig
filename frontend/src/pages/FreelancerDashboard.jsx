import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/RoleBadge';
import { Modal } from '../components/Modal';
import { FreelancerProfile } from '../components/FreelancerProfile';
import { GraduationCap, FileText, Search, Send, CheckCircle2, AlertCircle, RefreshCw, DollarSign, User } from 'lucide-react';

export const FreelancerDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('applications'); // 'applications' | 'browse'

  // Applications State
  const [applications, setApplications] = useState([]);
  const [loadingApps, setLoadingApps] = useState(true);

  // Browse & Search Gigs State
  const [openJobs, setOpenJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [search, setSearch] = useState('');

  // Apply Modal State
  const [selectedJob, setSelectedJob] = useState(null);
  const [proposedPrice, setProposedPrice] = useState('');
  const [applySubmitting, setApplySubmitting] = useState(false);
  const [applyError, setApplyError] = useState('');

  // Global Alerts
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadApplications = async () => {
    setLoadingApps(true);
    setError('');
    try {
      const data = await api.getMyApplications();
      setApplications(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to retrieve your applications.');
    } finally {
      setLoadingApps(false);
    }
  };

  const loadOpenJobs = async (query = '') => {
    setLoadingJobs(true);
    try {
      const data = await api.getJobs(query);
      setOpenJobs(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load jobs.');
    } finally {
      setLoadingJobs(false);
    }
  };

  useEffect(() => {
    loadApplications();
    loadOpenJobs();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadOpenJobs(search);
  };

  const openApplyModal = (job) => {
    setSelectedJob(job);
    setProposedPrice(job.budget.toString());
    setApplyError('');
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    if (!selectedJob) return;

    const price = parseFloat(proposedPrice);
    if (isNaN(price) || price <= 0) {
      setApplyError('Proposed price must be strictly positive (> $0.00).');
      return;
    }

    setApplySubmitting(true);
    setApplyError('');
    try {
      const res = await api.applyToJob(selectedJob.id, price);
      setSuccess(res.message || `Application submitted for "${selectedJob.title}"!`);
      setSelectedJob(null);
      loadApplications();
      loadOpenJobs(search);
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setApplyError(err.message || 'Failed to apply.');
    } finally {
      setApplySubmitting(false);
    }
  };

  return (
    <div>
      {/* Dashboard Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '2rem',
        paddingBottom: '1.25rem',
        borderBottom: '1px solid var(--border-color)',
      }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            Freelancer Dashboard
            <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', borderRadius: 'var(--radius-full)', background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)', fontWeight: 600 }}>
              Verified College Student ({user?.email})
            </span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Welcome back, <strong>{user?.name}</strong>. Track your submitted proposals and browse available campus opportunities.
          </p>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger">
          <AlertCircle size={18} />
          <div>{error}</div>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <CheckCircle2 size={18} />
          <div>{success}</div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
        <button
          onClick={() => setActiveTab('applications')}
          className={`btn btn-sm ${activeTab === 'applications' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <FileText size={15} />
          My Applications ({applications.length})
        </button>
        <button
          onClick={() => setActiveTab('browse')}
          className={`btn btn-sm ${activeTab === 'browse' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Search size={15} />
          Explore Open Gigs ({openJobs.length})
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`btn btn-sm ${activeTab === 'profile' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <User size={15} />
          My Profile & Skills
        </button>
      </div>

      {/* TAB 1: My Applications */}
      {activeTab === 'applications' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem' }}>Your Proposal Status</h2>
            <button onClick={loadApplications} className="btn btn-secondary btn-sm">
              <RefreshCw size={13} />
              Refresh
            </button>
          </div>

          {loadingApps ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              Loading applications...
            </div>
          ) : applications.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📝</div>
              <h3 style={{ marginBottom: '0.5rem', color: '#fff' }}>No Active Applications</h3>
              <p style={{ maxWidth: 420, margin: '0 auto 1.25rem', fontSize: '0.9rem' }}>
                You haven't submitted any job proposals yet. Browse open gigs to start earning on campus!
              </p>
              <button onClick={() => setActiveTab('browse')} className="btn btn-primary btn-sm">
                <Search size={14} />
                Browse Open Gigs
              </button>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Job Title & Client</th>
                    <th>Job Budget</th>
                    <th>Your Proposed Price</th>
                    <th>Application Review</th>
                    <th>Job Lifecycle</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app, idx) => (
                    <tr key={`${app.jobId}-${idx}`}>
                      <td>
                        <div style={{ fontWeight: 600, color: '#fff' }}>{app.jobTitle}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Posted by: {app.clientName}
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        ${Number(app.jobBudget || 0).toFixed(2)}
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--success)' }}>
                        ${Number(app.proposedPrice).toFixed(2)}
                      </td>
                      <td>
                        <StatusBadge status={app.status} />
                      </td>
                      <td>
                        <StatusBadge status={app.jobStatus} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Browse Gigs */}
      {activeTab === 'browse' && (
        <div>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.625rem', marginBottom: '1.5rem', maxWidth: 600 }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search gigs by keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="submit" className="btn btn-primary">
              <Search size={14} />
              Filter
            </button>
            {search && (
              <button type="button" onClick={() => { setSearch(''); loadOpenJobs(''); }} className="btn btn-secondary">
                Reset
              </button>
            )}
          </form>

          {loadingJobs ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              Loading gigs...
            </div>
          ) : openJobs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <h3 style={{ marginBottom: '0.5rem', color: '#fff' }}>No Open Gigs Found</h3>
              <p style={{ fontSize: '0.9rem' }}>Check back soon for new opportunities!</p>
            </div>
          ) : (
            <div className="jobs-grid">
              {openJobs.map((job) => {
                const alreadyApplied = applications.some((a) => a.jobId === job.id);
                return (
                  <div key={job.id} className="card job-card">
                    <div>
                      <div className="job-card-header">
                        <div>
                          <h3 className="job-title">{job.title}</h3>
                          <div className="job-client">Posted by {job.clientName}</div>
                        </div>
                        <StatusBadge status={job.status} />
                      </div>
                      <p className="job-desc">{job.description}</p>
                    </div>

                    <div className="job-card-footer">
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Budget</div>
                        <div className="job-budget">${Number(job.budget).toFixed(2)}</div>
                      </div>

                      {alreadyApplied ? (
                        <span className="badge badge-accepted">✓ Applied</span>
                      ) : (
                        <button
                          onClick={() => openApplyModal(job)}
                          className="btn btn-primary btn-sm"
                        >
                          <Send size={13} />
                          Apply
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: My Profile */}
      {activeTab === 'profile' && (
        <FreelancerProfile userId={user?.id} isOwnProfile={true} />
      )}

      {/* Apply Modal */}
      <Modal
        isOpen={!!selectedJob}
        onClose={() => setSelectedJob(null)}
        title={selectedJob ? `Apply for: ${selectedJob.title}` : 'Apply for Job'}
      >
        {selectedJob && (
          <form onSubmit={handleApplySubmit}>
            <div style={{ marginBottom: '1.25rem', padding: '0.875rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Client Budget</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--success)' }}>
                ${Number(selectedJob.budget).toFixed(2)}
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                {selectedJob.description}
              </p>
            </div>

            {applyError && (
              <div className="alert alert-danger">
                <AlertCircle size={16} />
                <div>{applyError}</div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Your Proposed Price ($)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                className="form-input"
                placeholder="e.g. 50.00"
                value={proposedPrice}
                onChange={(e) => setProposedPrice(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button
                type="button"
                onClick={() => setSelectedJob(null)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={applySubmitting}
              >
                <Send size={14} />
                {applySubmitting ? 'Submitting...' : 'Submit Proposal'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
