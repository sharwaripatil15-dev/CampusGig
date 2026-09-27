import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/RoleBadge';
import { Modal } from '../components/Modal';
import { Search, DollarSign, Users, Send, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

export const JobBoardPage = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Apply Modal state
  const [selectedJob, setSelectedJob] = useState(null);
  const [proposedPrice, setProposedPrice] = useState('');
  const [applySubmitting, setApplySubmitting] = useState(false);
  const [applyError, setApplyError] = useState('');

  const fetchJobs = async (keyword = '') => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getJobs(keyword);
      setJobs(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load open marketplace jobs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchJobs(search);
  };

  const handleClearSearch = () => {
    setSearch('');
    fetchJobs('');
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
      fetchJobs(search); // Refresh job applicant count
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setApplyError(err.message || 'Failed to submit application.');
    } finally {
      setApplySubmitting(false);
    }
  };

  return (
    <div>
      {/* Hero Header */}
      <div style={{
        textAlign: 'center',
        padding: '2.5rem 1rem 1.5rem',
        maxWidth: 720,
        margin: '0 auto',
      }}>
        <h1 style={{ fontSize: '2.4rem', fontWeight: 800, marginBottom: '0.75rem', letterSpacing: '-0.03em' }}>
          Campus Gig Marketplace
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.6 }}>
          Discover and apply for high-impact campus projects posted by college clubs, faculty, and local businesses.
        </p>
      </div>

      {/* Search Bar */}
      <div style={{ maxWidth: 650, margin: '1rem auto 2.5rem' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.625rem' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{
              position: 'absolute',
              left: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '2.75rem' }}
              placeholder="Search by keywords (e.g. Poster, App, Design, React)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Search
          </button>
          {search && (
            <button type="button" onClick={handleClearSearch} className="btn btn-secondary">
              Clear
            </button>
          )}
        </form>
      </div>

      {/* Global Alerts */}
      {error && (
        <div className="alert alert-danger" style={{ maxWidth: 800, margin: '0 auto 1.5rem' }}>
          <AlertCircle size={18} />
          <div>{error}</div>
        </div>
      )}

      {success && (
        <div className="alert alert-success" style={{ maxWidth: 800, margin: '0 auto 1.5rem' }}>
          <CheckCircle size={18} />
          <div>{success}</div>
        </div>
      )}

      {/* Jobs Grid or Loading / Empty */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <RefreshCw className="animate-spin" size={32} style={{ margin: '0 auto 1rem', display: 'block' }} />
          Loading active gigs...
        </div>
      ) : jobs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📂</div>
          <h3 style={{ marginBottom: '0.5rem', color: '#fff' }}>No Open Jobs Found</h3>
          <p style={{ maxWidth: 420, margin: '0 auto 1.25rem', fontSize: '0.9rem' }}>
            {search ? `No open gigs match the keyword "${search}". Try a different search term.` : 'There are currently no open jobs in the marketplace.'}
          </p>
          {search && (
            <button onClick={handleClearSearch} className="btn btn-secondary btn-sm">
              View All Jobs
            </button>
          )}
        </div>
      ) : (
        <div className="jobs-grid">
          {jobs.map((job) => (
            <div key={job.id} className="card job-card">
              <div>
                <div className="job-card-header">
                  <div>
                    <h3 className="job-title">{job.title}</h3>
                    <div className="job-client">
                      Posted by <strong>{job.clientName}</strong>
                    </div>
                  </div>
                  <StatusBadge status={job.status} />
                </div>

                <p className="job-desc">{job.description}</p>
              </div>

              <div>
                <div className="job-card-footer">
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Budget</div>
                    <div className="job-budget">${Number(job.budget).toFixed(2)}</div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Users size={14} />
                      {job.applicantCount || 0} applicant{(job.applicantCount || 0) === 1 ? '' : 's'}
                    </span>

                    {user?.role === 'Freelancer' ? (
                      <button
                        onClick={() => openApplyModal(job)}
                        className="btn btn-primary btn-sm"
                      >
                        <Send size={13} />
                        Apply
                      </button>
                    ) : !user ? (
                      <Link to="/login" className="btn btn-secondary btn-sm">
                        Log In to Apply
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
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
              <p className="form-helper">
                Specify your proposed project compensation for this proposal.
              </p>
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
