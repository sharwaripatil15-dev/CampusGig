/**
 * CampusGig REST API Client Service
 * Connects frontend directly to C++ Crow REST API server on localhost:8080
 */

const API_BASE = 'http://localhost:8080/api';

/**
 * Retrieve authorization headers with Bearer token
 */
function getHeaders(token = null) {
  const currentToken = token || localStorage.getItem('cg_token');
  const headers = {
    'Content-Type': 'application/json',
  };
  if (currentToken) {
    headers['Authorization'] = `Bearer ${currentToken}`;
    headers['X-Session-Token'] = currentToken;
  }
  return headers;
}

/**
 * Centralized fetch handler with consistent error unpacking
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...getHeaders(),
        ...options.headers,
      },
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMessage = data?.error || data?.message || `Request failed with status ${response.status}`;
      throw new Error(errorMessage);
    }

    return data;
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error('Unable to connect to CampusGig C++ backend server on localhost:8080. Please ensure campusgig_server.exe is running.');
    }
    throw err;
  }
}

export const api = {
  // Authentication
  async register({ name, email, password, role }) {
    return request('/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role }),
    });
  },

  async login({ email, password }) {
    return request('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async logout() {
    return request('/logout', {
      method: 'POST',
    });
  },

  async getMe() {
    return request('/auth/me');
  },

  async getUserProfile(userId) {
    return request(`/users/${userId}`);
  },

  async updateProfile({ name, password }) {
    return request('/profile/update', {
      method: 'POST',
      body: JSON.stringify({ name, password }),
    });
  },

  // Jobs
  async getJobs(search = '') {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return request(`/jobs${query}`);
  },

  async postJob({ title, description, budget }) {
    return request('/jobs', {
      method: 'POST',
      body: JSON.stringify({ title, description, budget: Number(budget) }),
    });
  },

  async getClientJobs() {
    return request('/client/jobs');
  },

  async getJobApplicants(jobId) {
    return request(`/jobs/${jobId}/applicants`);
  },

  async applyToJob(jobId, proposedPrice) {
    return request(`/jobs/${jobId}/apply`, {
      method: 'POST',
      body: JSON.stringify({ proposedPrice: Number(proposedPrice) }),
    });
  },

  async hireFreelancer(jobId, freelancerId) {
    return request(`/jobs/${jobId}/hire`, {
      method: 'POST',
      body: JSON.stringify({ freelancerId: Number(freelancerId) }),
    });
  },

  async completeJob(jobId) {
    return request(`/jobs/${jobId}/complete`, {
      method: 'POST',
    });
  },

  // Applications (Freelancer)
  async getMyApplications() {
    return request('/applications/me');
  },

  // Admin
  async getAdminUsers() {
    return request('/admin/users');
  },

  async removeAdminUser(userId) {
    return request(`/admin/users/${userId}`, {
      method: 'DELETE',
    });
  },

  async getAdminJobs() {
    return request('/admin/jobs');
  },
};
