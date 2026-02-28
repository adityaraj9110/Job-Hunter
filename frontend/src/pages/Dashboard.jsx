import { useState, useEffect } from 'react';
import api from '../lib/api';

export default function Dashboard() {
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState({ total: 0, thisWeek: 0, thisMonth: 0, replied: 0, interviews: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications();
  }, []);

  async function fetchApplications() {
    try {
      const res = await api.get('/applications');
      setApplications(res.data.applications || []);
      setStats(res.data.stats || stats);
    } catch (err) {
      console.error('Failed to fetch applications:', err);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id, status) {
    try {
      await api.patch(`/applications/${id}`, { status });
      fetchApplications();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  }

  const statusOptions = ['sent', 'replied', 'rejected', 'interview'];

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2>📊 Dashboard</h2>
        <p>Track all your sent applications and their status</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📬</div>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Applied</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-value">{stats.thisWeek}</div>
          <div className="stat-label">This Week</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💬</div>
          <div className="stat-value">{stats.replied}</div>
          <div className="stat-label">Replied</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-value">{stats.interviews}</div>
          <div className="stat-label">Interviews</div>
        </div>
      </div>

      {/* Applications Table */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Recent Applications</span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div className="spinner" />
          </div>
        ) : applications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>No applications yet</h3>
            <p>Go to the Apply page to send your first application!</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="app-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Position</th>
                  <th>HR Email</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map(app => (
                  <tr key={app.id}>
                    <td className="company-name">{app.company}</td>
                    <td className="job-title">{app.jobTitle}</td>
                    <td>{app.hrEmail || '—'}</td>
                    <td>{new Date(app.sentAt).toLocaleDateString()}</td>
                    <td>
                      <span className={`status-badge status-${app.status}`}>
                        {app.status}
                      </span>
                    </td>
                    <td>
                      <select
                        className="form-select"
                        value={app.status}
                        onChange={(e) => updateStatus(app.id, e.target.value)}
                        style={{ width: 'auto', padding: '4px 8px', fontSize: '0.78rem' }}
                      >
                        {statusOptions.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
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
}
