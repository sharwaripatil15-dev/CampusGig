import React from 'react';
import { Shield, Briefcase, GraduationCap } from 'lucide-react';

export const RoleBadge = ({ role }) => {
  if (role === 'Freelancer') {
    return (
      <span className="badge badge-freelancer">
        <GraduationCap size={13} />
        Verified Student
      </span>
    );
  }
  if (role === 'Client') {
    return (
      <span className="badge badge-client">
        <Briefcase size={13} />
        Client
      </span>
    );
  }
  if (role === 'Admin') {
    return (
      <span className="badge badge-admin">
        <Shield size={13} />
        Admin
      </span>
    );
  }
  return <span className="badge">{role}</span>;
};

export const StatusBadge = ({ status }) => {
  const norm = status?.toLowerCase();
  if (norm === 'open') return <span className="badge badge-open">● Open</span>;
  if (norm === 'inprogress') return <span className="badge badge-inprogress">● In Progress</span>;
  if (norm === 'completed') return <span className="badge badge-completed">✓ Completed</span>;
  if (norm === 'pending') return <span className="badge badge-pending">⏳ Pending</span>;
  if (norm === 'accepted') return <span className="badge badge-accepted">✓ Accepted</span>;
  if (norm === 'rejected') return <span className="badge badge-rejected">✕ Rejected</span>;
  return <span className="badge">{status}</span>;
};
