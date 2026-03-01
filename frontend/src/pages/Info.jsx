import { useState, useEffect } from 'react';
import api from '../lib/api';

export default function Info() {
  const [info, setInfo] = useState({
    currentCTC: '',
    expectedCTC: '',
    noticePeriod: '',
    isServing: false,
    phone: '',
    location: '',
    linkedinUrl: '',
    currentJobTitle: '',
    experienceYears: '',
    senderName: '',
    smtpHost: '',
    smtpPort: '',
    smtpEmail: '',
    smtpPassword: '',
    aiTone: 'formal',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchInfo();
  }, []);

  async function fetchInfo() {
    try {
      const res = await api.get('/info');
      setInfo(prev => ({ ...prev, ...res.data, smtpPassword: '' }));
    } catch (err) {
      console.error('Failed to fetch info:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const dataToSend = { ...info };
      if (!dataToSend.smtpPassword) delete dataToSend.smtpPassword;
      await api.put('/info', dataToSend);
      setToast({ msg: 'Settings saved!', type: 'success' });
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      setToast({ msg: 'Failed to save', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setSaving(false);
    }
  }

  function handleChange(field, value) {
    setInfo(prev => ({ ...prev, [field]: value }));
  }

  if (loading) return <div style={{ textAlign: 'center', padding: '60px' }}><div className="spinner" /></div>;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2>ℹ️ Info Settings</h2>
        <p>Configure your personal details, SMTP, and AI preferences</p>
      </div>

      {/* Personal Info */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-header">
          <span className="card-title">👤 Personal Details</span>
        </div>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Current CTC</label>
            <input
              className="form-input"
              placeholder="e.g., 12 LPA"
              value={info.currentCTC || ''}
              onChange={(e) => handleChange('currentCTC', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Expected CTC</label>
            <input
              className="form-input"
              placeholder="e.g., 18 LPA"
              value={info.expectedCTC || ''}
              onChange={(e) => handleChange('expectedCTC', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Notice Period</label>
            <input
              className="form-input"
              placeholder="e.g., 30 days"
              value={info.noticePeriod || ''}
              onChange={(e) => handleChange('noticePeriod', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Serving Notice Period?</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={info.isServing}
                  onChange={(e) => handleChange('isServing', e.target.checked)}
                />
                <span className="toggle-slider" />
              </label>
              <span style={{ fontSize: '0.85rem', color: info.isServing ? 'var(--accent-success)' : 'var(--text-muted)' }}>
                {info.isServing ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input
              className="form-input"
              placeholder="+91 9876543210"
              value={info.phone || ''}
              onChange={(e) => handleChange('phone', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Location</label>
            <input
              className="form-input"
              placeholder="e.g., Bangalore"
              value={info.location || ''}
              onChange={(e) => handleChange('location', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">LinkedIn URL</label>
            <input
              className="form-input"
              placeholder="https://linkedin.com/in/yourprofile"
              value={info.linkedinUrl || ''}
              onChange={(e) => handleChange('linkedinUrl', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Current Job Title</label>
            <input
              className="form-input"
              placeholder="e.g., Frontend Developer"
              value={info.currentJobTitle || ''}
              onChange={(e) => handleChange('currentJobTitle', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Total Experience</label>
            <input
              className="form-input"
              placeholder="e.g., 3 years"
              value={info.experienceYears || ''}
              onChange={(e) => handleChange('experienceYears', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* SMTP Settings */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-header">
          <span className="card-title">📧 SMTP Email Settings</span>
        </div>
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Sender Name <span style={{ color: 'var(--accent-danger)', fontWeight: 700 }}>*</span></label>
            <input
              className="form-input"
              placeholder="e.g., Aditya Raj — shown as email sender"
              value={info.senderName || ''}
              onChange={(e) => handleChange('senderName', e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">SMTP Host</label>
            <input
              className="form-input"
              placeholder="smtp.gmail.com"
              value={info.smtpHost || ''}
              onChange={(e) => handleChange('smtpHost', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">SMTP Port</label>
            <input
              className="form-input"
              type="number"
              placeholder="587"
              value={info.smtpPort || ''}
              onChange={(e) => handleChange('smtpPort', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              className="form-input"
              type="email"
              placeholder="your@email.com"
              value={info.smtpEmail || ''}
              onChange={(e) => handleChange('smtpEmail', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">App Password</label>
            <input
              className="form-input"
              type="password"
              placeholder={info.hasSmtpPassword ? '••••••••' : 'Enter app password'}
              value={info.smtpPassword || ''}
              onChange={(e) => handleChange('smtpPassword', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* AI Settings */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-header">
          <span className="card-title">🤖 AI Preferences</span>
        </div>
        <div className="form-group">
          <label className="form-label">Email Tone</label>
          <div style={{ display: 'flex', gap: '10px' }}>
            {['formal', 'semi-formal', 'casual'].map(tone => (
              <button
                key={tone}
                className={`btn ${info.aiTone === tone ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                onClick={() => handleChange('aiTone', tone)}
              >
                {tone}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Save */}
      <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
        {saving ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Saving...</> : '💾 Save Settings'}
      </button>

      {/* Toast */}
      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.type === 'error' ? '❌' : '✅'} {toast.msg}
        </div>
      )}
    </div>
  );
}
