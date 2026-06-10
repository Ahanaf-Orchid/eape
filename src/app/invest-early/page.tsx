'use client';

import { useState, useEffect } from 'react';
import { SITE } from "@/lib/site-config";
import { formApi } from '@/lib/api';

interface FormData {
  twitter: string;
  email: string;
  amount: string;
  message: string;
}

const DEFAULT_FORM: FormData = {
  twitter: '',
  email: '',
  amount: '',
  message: '',
};

export default function InvestEarlyPage() {
  const [isClient, setIsClient] = useState(false);
  const [formData, setFormData] = useState<FormData>(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.twitter.trim() || !formData.email.trim()) {
      setError('Twitter and Email are required');
      return;
    }

    if (!formData.email.includes('@')) {
      setError('Please enter a valid email');
      return;
    }

    setSubmitting(true);

    try {
      await formApi.investEarly({
        ...formData,
        timestamp: new Date().toISOString(),
      });
      setSubmitted(true);
    } catch (err) {
      console.error('Submit error:', err);
      setError('Failed to submit. Please try again.');
    }

    setSubmitting(false);
  };

  if (!isClient) return null;

  if (submitted) {
    return (
      <div className="page-container">
        <div className="form-shell success-shell">
          <div className="success-content">
            <div className="success-icon">🚀</div>
            <h1>Thank You!</h1>
            <p>Your early access inquiry has been submitted. We will be in touch soon with exclusive opportunities!</p>
            <button className="btn primary-btn" onClick={() => window.location.href = '/'}>
              BACK TO HOME
            </button>
          </div>
        </div>
        <style>{globals}</style>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="form-shell">
        <div className="form-header">
          <button className="back-btn" onClick={() => window.location.href = '/'}>
            ← BACK
          </button>
          <img src="/logo.PNG" alt="Logo" className="page-logo" />
        </div>

        <h1 className="page-title">INVEST EARLY</h1>
        <p className="page-subtitle">Get early access to {SITE.projectName} investment opportunities!</p>

        <form onSubmit={handleSubmit} className="form-content">
          <div className="form-group">
            <label>Twitter *</label>
            <input
              type="text"
              placeholder="@username"
              value={formData.twitter}
              onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Investment Amount (Optional)</label>
            <input
              type="text"
              placeholder="e.g. $1K - $10K, or TBD"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Message</label>
            <textarea
              placeholder={`Tell us about your interest in ${SITE.projectName}...`}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              rows={4}
            />
          </div>

          {error && <p className="error-msg">{error}</p>}

          <button type="submit" className="btn primary-btn" disabled={submitting}>
            {submitting ? 'SUBMITTING...' : 'REQUEST EARLY ACCESS'}
          </button>
        </form>
      </div>
      <style>{globals}</style>
    </div>
  );
}

const globals = `
  @import url('https://fonts.googleapis.com/css2?family=Anton&family=Comic+Neue:wght@400;700&display=swap');
  * { box-sizing: border-box; }
  body {
    margin: 0; background: #EED5C1; color: #1E1E1E;
    font-family: 'Comic Neue', cursive;
    min-height: 100vh;
  }
  .page-container {
    width: 100%; max-width: 480px; margin: 0 auto; padding: 20px;
    min-height: 100vh;
  }
  .form-shell {
    background: #FAFAFA; border: 3px solid #1E1E1E; border-radius: 15px;
    padding: 24px 20px; box-shadow: 4px 4px 0 #8B5A2B;
  }
  .success-shell {
    text-align: center; padding: 40px 24px;
  }
  .success-content {
    display: flex; flex-direction: column; align-items: center; gap: 16px;
  }
  .success-icon { font-size: 48px; }
  .success-content h1 {
    font-family: 'Anton', sans-serif; font-size: 28px; color: #9E1B1E;
    margin: 0; text-transform: uppercase; letter-spacing: 2px;
  }
  .success-content p {
    color: #705B4E; margin: 0; font-size: 14px; line-height: 1.5;
  }
  .form-header {
    display: flex; align-items: center; gap: 16px; margin-bottom: 20px;
  }
  .back-btn {
    background: #FAFAFA; border: 3px solid #1E1E1E; color: #1E1E1E;
    padding: 8px 14px; font-size: 12px; font-weight: 700;
    border-radius: 8px; cursor: pointer; box-shadow: 2px 2px 0 #8B5A2B;
    font-family: 'Comic Neue', cursive;
  }
  .back-btn:hover { background: #9E1B1E; color: #FAFAFA; }
  .page-logo {
    width: 40px; height: 40px; border-radius: 50%; border: 2px solid #1E1E1E;
  }
  .page-title {
    font-family: 'Anton', sans-serif; font-size: 24px; color: #9E1B1E;
    margin: 0 0 8px 0; text-transform: uppercase; letter-spacing: 2px;
    text-align: center;
  }
  .page-subtitle {
    color: #705B4E; font-size: 13px; margin: 0 0 24px 0; text-align: center;
    line-height: 1.4;
  }
  .form-content { display: flex; flex-direction: column; gap: 16px; }
  .form-group { display: flex; flex-direction: column; gap: 6px; }
  .form-group label {
    font-size: 12px; font-weight: 700; color: #1E1E1E;
    text-transform: uppercase; letter-spacing: 0.5px;
  }
  .form-group input, .form-group textarea {
    width: 100%; padding: 12px; background: #FAFAFA;
    border: 3px solid #1E1E1E; border-radius: 10px;
    font-family: 'Comic Neue', cursive; font-size: 14px; color: #1E1E1E;
    box-shadow: inset 2px 2px 0 rgba(0,0,0,0.05);
  }
  .form-group input:focus, .form-group textarea:focus {
    outline: none; border-color: #F28C28;
  }
  .form-group textarea { resize: vertical; min-height: 80px; }
  .error-msg { color: #C62828; font-size: 13px; font-weight: 700; margin: 0; text-align: center; }
  .btn { width: 100%; padding: 14px; border-radius: 10px; font-family: 'Comic Neue', cursive; font-weight: 700; font-size: 14px; cursor: pointer; border: 3px solid #1E1E1E; text-transform: uppercase; letter-spacing: 0.5px; }
  .btn.primary-btn { background: #9E1B1E; color: #FAFAFA; box-shadow: 4px 4px 0 #8B5A2B; }
  .btn.primary-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 6px 6px 0 #8B5A2B; }
  .btn.primary-btn:disabled { opacity: 0.6; cursor: not-allowed; }
`;
