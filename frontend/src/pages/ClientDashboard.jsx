import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/RoleBadge';
import { Modal } from '../components/Modal';
import { FreelancerProfile } from '../components/FreelancerProfile';
import { PlusCircle, Users, CheckCircle2, UserCheck, AlertCircle, RefreshCw, Briefcase, Eye } from 'lucide-react';

export const ClientDashboard = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Post Job Modal State
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [postSubmitting, setPostSubmitting] = useState(false);
  const [postError, setPostError] = useState('');

  // Applicants Modal State
  const [activeJobForApplicants, setActiveJobForApplicants] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [viewingFreelancerId, setViewingFreelancerId] = useState(null);

  const loadClientJobs = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getClientJobs();
      setJobs(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to retrieve your posted jobs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClientJobs();
  }, []);

  const handlePostJob = async (e) => {
    e.preventDefault();
    const numBudget = parseFloat(budget);
    if (isNaN(numBudget) || numBudget <= 0) {
      setPostError('Budget must be strictly positive (> $0.00).');
      return;
    }

    setPostSubmitting(true);
    setPostError('');
    try {
      const res = await api.postJob({ title, description, budget: numBudget });
      setSuccess(res.message || 'Job posted successfully!');
      setIsPostModalOpen(false);
      setTitle('');
      setDescription('');
      setBudget('');
      loadClientJobs();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setPostError(err.message || 'Failed to post job.');
    } finally {
      setPostSubmitting(false);
    }
  };

  const handleOpenApplicants = async (job) => {
    setActiveJobForApplicants(job);
    setLoadingApplicants(true);
    setActionMessage('');
    setActionError('');
    try {
      const data = await api.getJobApplicants(job.id);
      setApplicants(Array.isArray(data) ? data : []);
    } catch (err) {
      setActionError(err.message || 'Failed to load applicants for this job.');
    } finally {
      setLoadingApplicants(false);
    }
  };

  const handleHire = async (jobId, freelancerId, freelancerName) => {
    setActionError('');
    setActionMessage('');
    try {
      const res = await api.hireFreelancer(jobId, freelancerId);
      setActionMessage(res.message || `Freelancer ${freelancerName} hired successfully!`);
      // Refresh applicants list and job list
      const updatedApps = await api.getJobApplicants(jobId);
      setApplicants(updatedApps);
      loadClientJobs();
    } catch (err) {
      setActionError(err.message || 'Failed to hire freelancer.');
    }
  };

  const handleMarkComplete = async (jobId) => {
    if (!window.confirm('Are you sure you want to mark this job as completed?')) return;
    setError('');
    setSuccess('');
    try {
      const res = await api.completeJob(jobId);
      setSuccess(res.message || 'Job marked as Completed!');
      loadClientJobs();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to mark job complete.');
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
          <h1 style={{ fontSize: '1.85rem', marginBottom: '0.25rem' }}>Client Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Welcome, <strong>{user?.name}</strong>. Manage your campus projects, review student proposals, and award contracts.
          </p>
        </div>

        <button onClick={() => setIsPostModalOpen(true)} className="btn btn-primary">
          <PlusCircle size={16} />
          Post a New Job
        </button>
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

      {/* Posted Jobs Section */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Briefcase size={18} color="var(--primary)" />
          Your Posted Projects ({jobs.length})
        </h2>
        <button onClick={loadClientJobs} className="btn btn-secondary btn-sm" title="Refresh">
          <RefreshCw size={13} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <RefreshCw className="animate-spin" size={28} style={{ margin: '0 auto 0.5rem', display: 'block' }} />
          Loading your projects...
        </div>
      ) : jobs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <h3 style={{ marginBottom: '0.5rem', color: '#fff' }}>No Projects Posted Yet</h3>
          <p style={{ maxWidth: 420, margin: '0 auto 1.25rem', fontSize: '0.9rem' }}>
            Have a project, event design, software task, or campus initiative? Post a job to connect with student freelancers.
          </p>
          <button onClick={() => setIsPostModalOpen(true)} className="btn btn-primary btn-sm">
            <PlusCircle size={14} />
            Post Your First Job
          </button>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Job Title & Description</th>
                <th>Budget</th>
                <th>Status</th>
                <th>Applicants</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td style={{ maxWidth: 320 }}>
                    <div style={{ fontWeight: 600, color: '#fff', marginBottom: 2 }}>{job.title}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {job.description}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, color: 'var(--success)' }}>
                      ${Number(job.budget).toFixed(2)}
                    </span>
                  </td>
                  <td>
                    <StatusBadge status={job.status} />
                  </td>
                  <td>
                    <button
                      onClick={() => handleOpenApplicants(job)}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.75rem' }}
                    >
                      <Users size={12} />
                      {job.applicantCount || 0} applicant{(job.applicantCount || 0) === 1 ? '' : 's'}
                    </button>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => handleOpenApplicants(job)}
                        className="btn btn-secondary btn-sm"
                      >
                        Applicants
                      </button>

                      {job.status === 'InProgress' && (
                        <button
                          onClick={() => handleMarkComplete(job.id)}
                          className="btn btn-success btn-sm"
                        >
                          <CheckCircle2 size={13} />
                          Complete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Post Job Modal */}
      <Modal
        isOpen={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
        title="Post a New Campus Gig"
      >
        <form onSubmit={handlePostJob}>
          {postError && (
            <div className="alert alert-danger">
              <AlertCircle size={16} />
              <div>{postError}</div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Job Title</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="e.g. Hackathon Website Design"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Job Description</label>
            <textarea
              rows={4}
              required
              className="form-textarea"
              placeholder="Describe deliverables, requirements, tech stack, and timeline..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Budget ($ USD)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              className="form-input"
              placeholder="e.g. 100.00"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
            />
            <p className="form-helper">Must be strictly greater than $0.00.</p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              onClick={() => setIsPostModalOpen(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={postSubmitting}>
              {postSubmitting ? 'Posting...' : 'Publish Job'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Applicants & Hire Modal */}
      <Modal
        isOpen={!!activeJobForApplicants}
        onClose={() => setActiveJobForApplicants(null)}
        title={activeJobForApplicants ? `Applicants for: ${activeJobForApplicants.title}` : 'Job Applicants'}
      >
        {activeJobForApplicants && (
          <div>
            <div style={{ marginBottom: '1.25rem', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-md)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Job Status: <StatusBadge status={activeJobForApplicants.status} />
                </span>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--success)' }}>
                  Budget: ${Number(activeJobForApplicants.budget).toFixed(2)}
                </span>
              </div>
            </div>

            {actionError && (
              <div className="alert alert-danger">
                <AlertCircle size={16} />
                <div>{actionError}</div>
              </div>
            )}

            {actionMessage && (
              <div className="alert alert-success">
                <CheckCircle2 size={16} />
                <div>{actionMessage}</div>
              </div>
            )}

            {loadingApplicants ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                Loading applicant list...
              </div>
            ) : applicants.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                No applications submitted for this project yet.
              </div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Freelancer</th>
                      <th>Proposed Price</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Decision</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applicants.map((app) => (
                      <tr key={app.freelancerId}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ fontWeight: 600, color: '#fff' }}>{app.freelancerName}</div>
                            <button
                              type="button"
                              onClick={() => setViewingFreelancerId(app.freelancerId)}
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '0.15rem 0.5rem', fontSize: '0.725rem' }}
                              title="View Verified Student Profile"
                            >
                              <Eye size={12} /> Profile
                            </button>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{app.freelancerEmail}</div>
                        </td>
                        <td style={{ fontWeight: 700, color: 'var(--success)' }}>
                          ${Number(app.proposedPrice).toFixed(2)}
                        </td>
                        <td>
                          <StatusBadge status={app.status} />
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {activeJobForApplicants.status === 'Open' && app.status === 'Pending' ? (
                            <button
                              onClick={() => handleHire(activeJobForApplicants.id, app.freelancerId, app.freelancerName)}
                              className="btn btn-primary btn-sm"
                            >
                              <UserCheck size={13} />
                              Hire
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              {app.status === 'Accepted' ? 'Awarded' : '—'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button
                type="button"
                onClick={() => setActiveJobForApplicants(null)}
                className="btn btn-secondary"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* View Freelancer Profile Modal */}
      <Modal
        isOpen={!!viewingFreelancerId}
        onClose={() => setViewingFreelancerId(null)}
        title="Student Freelancer Profile"
      >
        {viewingFreelancerId && (
          <div>
            <FreelancerProfile userId={viewingFreelancerId} isOwnProfile={false} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button
                type="button"
                onClick={() => setViewingFreelancerId(null)}
                className="btn btn-secondary"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
