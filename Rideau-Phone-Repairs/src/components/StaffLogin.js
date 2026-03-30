import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Simple staff password — in a real app this would be server-side auth
const STAFF_PASSWORD = 'staff123';
export const SESSION_KEY  = 'rideauStaffAuth';

export function isStaffAuthed() {
  return sessionStorage.getItem(SESSION_KEY) === 'true';
}

function StaffLogin() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Simulate a short async check
    setTimeout(() => {
      if (password === STAFF_PASSWORD) {
        sessionStorage.setItem(SESSION_KEY, 'true');
        navigate('/staff/portal');
      } else {
        setError('Incorrect password. Please try again.');
        setPassword('');
      }
      setLoading(false);
    }, 400);
  };

  return (
    <main className="page">
      <div className="container-xl">
        <div className="row justify-content-center">
          <div className="col-sm-10 col-md-7 col-lg-5">

            {/* Header */}
            <div className="text-center mb-4">
              <div className="staff-login-icon">
                <i className="bi bi-shield-lock-fill"></i>
              </div>
              <h1 className="staff-login-title">Staff Portal</h1>
              <p className="staff-login-sub">Enter your staff password to continue</p>
            </div>

            {/* Card */}
            <div className="staff-login-card">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="password" className="form-label fw-semibold" style={{ color: 'var(--brand)', fontSize: '0.9rem' }}>
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    className={`form-control ${error ? 'is-invalid' : ''}`}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    placeholder="Enter staff password"
                    autoFocus
                    required
                  />
                  {error && (
                    <div className="invalid-feedback d-block">
                      <i className="bi bi-exclamation-circle me-1"></i>{error}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100 py-2 fw-semibold mt-1"
                  disabled={loading}
                >
                  {loading
                    ? <><span className="spinner-border spinner-border-sm me-2"></span>Verifying…</>
                    : <><i className="bi bi-box-arrow-in-right me-2"></i>Sign In</>
                  }
                </button>
              </form>

              <div className="staff-login-hint">
                <i className="bi bi-info-circle me-1"></i>
                Demo password: <code>staff123</code>
              </div>
            </div>

            <div className="text-center mt-3">
              <button
                type="button"
                className="btn btn-link btn-sm"
                style={{ color: 'var(--text-muted)', textDecoration: 'none' }}
                onClick={() => navigate('/')}
              >
                <i className="bi bi-arrow-left me-1"></i>Back to site
              </button>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}

export default StaffLogin;
