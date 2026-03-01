import { useState } from 'react';
import api from '../lib/api';

export default function Apply() {
  const [mode, setMode] = useState('url'); // 'url' or 'screenshot'
  const [jobUrl, setJobUrl] = useState('');
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [jobData, setJobData] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [toast, setToast] = useState(null);
  const [step, setStep] = useState(1); // 1=input, 2=preview, 3=done
  const [additionalNotes, setAdditionalNotes] = useState('');

  function showToast(msg, type = 'success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleExtract() {
    setLoading(true);
    setLoadingMsg('🕷 Extracting job details...');
    try {
      let res;
      if (mode === 'screenshot' && screenshotFile) {
        const formData = new FormData();
        formData.append('screenshot', screenshotFile);
        res = await api.post('/apply/extract', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        res = await api.post('/apply/extract', { jobUrl });
      }
      setJobData(res.data.jobData);
      setStep(2);
      showToast('Job details extracted!');
    } catch (err) {
      showToast(err.response?.data?.error || 'Extraction failed', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handlePreview() {
    setLoading(true);
    setLoadingMsg('🧠 Generating CV & email...');
    try {
      const res = await api.post('/apply/preview', { jobData, additionalNotes: additionalNotes || undefined });
      setPreview(res.data.preview);
      setStep(3);
    } catch (err) {
      showToast(err.response?.data?.error || 'Preview failed', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleSend() {
    setLoading(true);
    setLoadingMsg('📬 Sending application...');
    try {
      const res = await api.post('/apply', {
        jobData: JSON.stringify(jobData),
        jobUrl: mode === 'url' ? jobUrl : undefined,
        emailSubject: preview?.emailSubject,
        emailBody: preview?.emailBody,
        additionalNotes: additionalNotes || undefined,
      });
      showToast(res.data.message || 'Application sent!');
      // Reset form
      setStep(1);
      setJobUrl('');
      setScreenshotFile(null);
      setJobData(null);
      setPreview(null);
      setAdditionalNotes('');
    } catch (err) {
      showToast(err.response?.data?.error || 'Send failed', 'error');
    } finally {
      setLoading(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setScreenshotFile(file);
      setMode('screenshot');
    }
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2>⚡ Apply</h2>
        <p>Paste a job URL or upload a screenshot — AI does the rest</p>
      </div>

      {/* Progress Steps */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '28px', alignItems: 'center' }}>
        {[
          { num: 1, label: 'Input' },
          { num: 2, label: 'Extract' },
          { num: 3, label: 'Preview & Send' },
        ].map((s, i) => (
          <div key={s.num} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontSize: '0.82rem',
              fontWeight: 700,
              background: step >= s.num ? 'var(--gradient-primary)' : 'var(--bg-card)',
              color: step >= s.num ? 'white' : 'var(--text-muted)',
              border: `1px solid ${step >= s.num ? 'var(--accent-primary)' : 'var(--border-color)'}`,
            }}>
              {s.num}
            </div>
            <span style={{ fontSize: '0.82rem', color: step >= s.num ? 'var(--text-primary)' : 'var(--text-muted)', fontWeight: 500 }}>
              {s.label}
            </span>
            {i < 2 && <span style={{ color: 'var(--text-muted)', margin: '0 8px' }}>→</span>}
          </div>
        ))}
      </div>

      {/* Step 1: Input */}
      {step === 1 && (
        <div className="card">
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            <button
              className={`btn ${mode === 'url' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              onClick={() => setMode('url')}
            >
              🔗 Job URL
            </button>
            <button
              className={`btn ${mode === 'screenshot' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
              onClick={() => setMode('screenshot')}
            >
              📸 Screenshot
            </button>
          </div>

          {mode === 'url' ? (
            <div className="form-group">
              <label className="form-label">Job URL</label>
              <input
                type="url"
                className="form-input"
                placeholder="https://linkedin.com/jobs/... or any job page URL"
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
              />
            </div>
          ) : (
            <div
              className={`upload-zone ${screenshotFile ? 'dragover' : ''}`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => document.getElementById('screenshot-input').click()}
            >
              <div className="upload-icon">{screenshotFile ? '✅' : '📸'}</div>
              <div className="upload-text">
                {screenshotFile ? screenshotFile.name : 'Drop a screenshot here or click to upload'}
              </div>
              <div className="upload-hint">PNG, JPG, WebP — up to 10MB</div>
              <input
                id="screenshot-input"
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => setScreenshotFile(e.target.files[0])}
              />
            </div>
          )}

          <div style={{ marginTop: '20px' }}>
            <button
              className="btn btn-primary"
              onClick={handleExtract}
              disabled={loading || (mode === 'url' ? !jobUrl : !screenshotFile)}
            >
              🕷 Extract Job Details
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Extracted Job Data */}
      {step === 2 && jobData && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">📋 Extracted Job Info</span>
            <button className="btn btn-secondary btn-sm" onClick={() => { setStep(1); setJobData(null); }}>
              ← Back
            </button>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Job Title</label>
              <div style={{ color: 'var(--text-accent)', fontWeight: 600, fontSize: '1.05rem' }}>
                {jobData.jobTitle || '—'}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Company</label>
              <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                {jobData.company || '—'}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Location</label>
              <div style={{ color: 'var(--text-secondary)' }}>
                {jobData.location || '—'} {jobData.workMode ? `(${jobData.workMode})` : ''}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">HR Email</label>
              <div style={{ color: jobData.hrEmail ? 'var(--accent-success)' : 'var(--accent-warning)' }}>
                {jobData.hrEmail || 'Not found — you can add manually'}
              </div>
            </div>
          </div>

          {jobData.requiredSkills?.length > 0 && (
            <div className="form-group">
              <label className="form-label">Required Skills</label>
              <div className="tags-container">
                {jobData.requiredSkills.map((skill, i) => (
                  <span key={i} className="tag">{skill}</span>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginTop: '20px' }}>
            <div className="form-group">
              <label className="form-label">💡 Want to add additional details? <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.8rem' }}>(optional)</span></label>
              <textarea
                className="form-input"
                placeholder="Add any extra context about yourself relevant to this job — e.g., specific projects, domain expertise, or achievements that match the role. The AI will incorporate this into your CV and email for more relevance."
                rows={4}
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                style={{ resize: 'vertical', minHeight: '80px', lineHeight: 1.6, fontFamily: 'inherit' }}
              />
            </div>
          </div>

          <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
            <button className="btn btn-primary" onClick={handlePreview}>
              🧠 Generate CV & Email Preview
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Preview & Send */}
      {step === 3 && preview && (
        <div>
          <div className="card" style={{ marginBottom: '16px' }}>
            <div className="card-header">
              <span className="card-title">✉️ Email Preview</span>
              <button className="btn btn-secondary btn-sm" onClick={() => setStep(2)}>
                ← Back to Job Info
              </button>
            </div>
            <div className="preview-panel">
              <div className="preview-section">
                <div className="preview-label">Subject</div>
                <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                  {preview.emailSubject}
                </div>
              </div>
              <hr className="section-divider" />
              <div className="preview-section">
                <div className="preview-label">Body</div>
                <div style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.7, fontSize: '0.9rem' }}>
                  {preview.emailBody}
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-success" onClick={handleSend} disabled={loading}>
              📬 Send Application
            </button>
            <button className="btn btn-secondary" onClick={() => { setStep(1); setJobData(null); setPreview(null); }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-card">
            <div className="spinner" />
            <p>{loadingMsg}</p>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.type === 'error' ? '❌' : '✅'} {toast.msg}
        </div>
      )}
    </div>
  );
}
