import { useState, useEffect } from 'react';
import api from '../lib/api';

export default function Resume() {
  const [profile, setProfile] = useState(null);
  const [exists, setExists] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [dragover, setDragover] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      const res = await api.get('/resume/profile');
      setExists(res.data.exists);
      if (res.data.exists) setProfile(res.data.profile);
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(file) {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('resume', file);
      const res = await api.post('/resume/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setProfile(res.data.profile);
      setExists(true);
      setToast({ msg: 'Resume parsed successfully!', type: 'success' });
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      setToast({ msg: err.response?.data?.error || 'Upload failed', type: 'error' });
      setTimeout(() => setToast(null), 4000);
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragover(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '60px' }}><div className="spinner" /></div>;

  const profileSummary = profile?.profileSummary || {};
  const skills = profile?.skills || [];
  const experience = profile?.experience || [];
  const education = profile?.education || [];
  const projects = profile?.projects || [];

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2>📄 Resume</h2>
        <p>Upload your resume — AI parses it into a structured profile</p>
      </div>

      {/* Upload Zone */}
      <div
        className={`upload-zone ${dragover ? 'dragover' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragover(true); }}
        onDragLeave={() => setDragover(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById('resume-input').click()}
        style={{ marginBottom: '28px' }}
      >
        {uploading ? (
          <>
            <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3, margin: '0 auto 12px' }} />
            <div className="upload-text">Parsing your resume with AI...</div>
            <div className="upload-hint">This may take a few seconds</div>
          </>
        ) : (
          <>
            <div className="upload-icon">📎</div>
            <div className="upload-text">
              {exists ? 'Drop a new resume to replace' : 'Drop your resume here or click to upload'}
            </div>
            <div className="upload-hint">PDF or DOCX — up to 10MB</div>
          </>
        )}
        <input
          id="resume-input"
          type="file"
          accept=".pdf,.docx,.doc"
          style={{ display: 'none' }}
          onChange={(e) => handleUpload(e.target.files[0])}
        />
      </div>

      {/* Parsed Profile */}
      {exists && profile && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">👤 Parsed Profile</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Updated: {new Date(profile.uploadedAt).toLocaleDateString()}
            </span>
          </div>

          {/* Summary */}
          {profileSummary.name && (
            <div className="profile-section">
              <h3>Profile</h3>
              <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '1.1rem', marginBottom: '4px' }}>
                {profileSummary.name}
              </div>
              {profileSummary.title && (
                <div style={{ color: 'var(--text-accent)', marginBottom: '8px' }}>{profileSummary.title}</div>
              )}
              {profileSummary.summary && (
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6 }}>
                  {profileSummary.summary}
                </div>
              )}
            </div>
          )}

          <hr className="section-divider" />

          {/* Skills */}
          {skills.length > 0 && (
            <div className="profile-section">
              <h3>🛠 Skills</h3>
              <div className="tags-container">
                {skills.map((skill, i) => (
                  <span key={i} className="tag">{skill}</span>
                ))}
              </div>
            </div>
          )}

          {experience.length > 0 && (
            <>
              <hr className="section-divider" />
              <div className="profile-section">
                <h3>💼 Experience</h3>
                {experience.map((exp, i) => (
                  <div key={i} className="experience-item">
                    <h4>{exp.title || 'Role'}</h4>
                    <div className="exp-meta">
                      {exp.company} • {exp.startDate} – {exp.endDate || 'Present'}
                    </div>
                    {exp.bullets?.length > 0 && (
                      <ul>
                        {exp.bullets.map((bullet, j) => <li key={j}>{bullet}</li>)}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {education.length > 0 && (
            <>
              <hr className="section-divider" />
              <div className="profile-section">
                <h3>🎓 Education</h3>
                {education.map((edu, i) => (
                  <div key={i} className="experience-item">
                    <h4>{edu.degree}</h4>
                    <div className="exp-meta">{edu.institution} • {edu.year}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {projects.length > 0 && (
            <>
              <hr className="section-divider" />
              <div className="profile-section">
                <h3>🚀 Projects</h3>
                {projects.map((proj, i) => (
                  <div key={i} className="experience-item">
                    <h4>{proj.name}</h4>
                    {proj.description && (
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '4px' }}>
                        {proj.description}
                      </div>
                    )}
                    {proj.technologies?.length > 0 && (
                      <div className="tags-container" style={{ marginTop: '6px' }}>
                        {proj.technologies.map((t, j) => <span key={j} className="tag">{t}</span>)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {!exists && !uploading && (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">📄</div>
            <h3>No resume uploaded yet</h3>
            <p>Upload your resume above. AI will parse it into a structured profile for CV tailoring.</p>
          </div>
        </div>
      )}

      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.type === 'error' ? '❌' : '✅'} {toast.msg}
        </div>
      )}
    </div>
  );
}
