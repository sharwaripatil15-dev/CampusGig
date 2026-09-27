import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { RoleBadge, StatusBadge } from '../components/RoleBadge';
import { Shield, Trash2, Users, Briefcase, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';

export const AdminDashboard = () => {
  const { user } = useAuth();
  const [usersList, setUsersList] = useState([]);
  const [jobsList, setJobsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [usersData, jobsData] = await Promise.all([
        api.getAdminUsers(),
        api.getAdminJobs(),
      ]);
      setUsersList(Array.isArray(usersData) ? usersData : []);
      setJobsList(Array.isArray(jobsData) ? jobsData : []);
    } catch (err) {
      setError(err.message || 'Failed to fetch administrator records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRemoveUser = async (targetId, targetName) => {
    if (targetId === user?.id) {
      setError('You cannot remove your own active administrator account.');
      return;
    }

    if (!window.confirm(`Are you sure you want to remove user "${targetName}" (ID: ${targetId})? This will cascade remove their associated jobs and applications.`)) {
      return;
    }

    setError('');
    setSuccess('');
    try {
      const res = await api.removeAdminUser(targetId);
      setSuccess(res.message || `Removed user "${targetName}" successfully.`);
      loadData();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to remove user.');
    }
  };

  return (
    <div>
      {/* Admin Header */}
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
            <Shield size={24} color="#f59e0b" />
            Administrator Control Console
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Logged in as <strong>{user?.name}</strong>. Full system moderation and user management.
          </p>
        </div>

        <button onClick={loadData} className="btn btn-secondary btn-sm">
          <RefreshCw size={13} />
          Refresh Console
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

      {/* Overview Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <Users size={18} color="var(--primary)" />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Registered Users</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{usersList.length}</div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <Briefcase size={18} color="var(--success)" />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Marketplace Gigs</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800 }}>{jobsList.length}</div>
        </div>
      </div>

      {/* Users Management Section */}
      <div style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users size={18} color="var(--primary)" />
          Registered Users Directory
        </h2>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            Loading users...
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 60 }}>ID</th>
                  <th>Role</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map((u) => (
                  <tr key={u.id}>
                    <td style={{ color: 'var(--text-muted)', fontWeight: 600 }}>#{u.id}</td>
                    <td>
                      <RoleBadge role={u.role} />
                    </td>
                    <td style={{ fontWeight: 600, color: '#fff' }}>
                      {u.name} {u.id === user?.id && <span style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>(You)</span>}
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                    <td style={{ textAlign: 'right' }}>
                      {u.id !== user?.id ? (
                        <button
                          onClick={() => handleRemoveUser(u.id, u.name)}
                          className="btn btn-danger btn-sm"
                          title="Remove User"
                        >
                          <Trash2 size={13} />
                          Remove
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Active Session</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* System Marketplace Jobs Overview */}
      <div>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Briefcase size={18} color="var(--info)" />
          All Marketplace Gigs
        </h2>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            Loading gigs...
          </div>
        ) : jobsList.length === 0 ? (
          <div className="empty-state">
            <p>No gigs in the system.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 60 }}>ID</th>
                  <th>Title & Description</th>
                  <th>Client</th>
                  <th>Budget</th>
                  <th>Lifecycle Status</th>
                </tr>
              </thead>
              <tbody>
                {jobsList.map((job) => (
                  <tr key={job.id}>
                    <td style={{ color: 'var(--text-muted)' }}>#{job.id}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#fff' }}>{job.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{job.description}</div>
                    </td>
                    <td>{job.clientName || `Client #${job.clientId}`}</td>
                    <td style={{ fontWeight: 700, color: 'var(--success)' }}>
                      ${Number(job.budget).toFixed(2)}
                    </td>
                    <td>
                      <StatusBadge status={job.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
