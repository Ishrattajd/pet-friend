import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api';

function ResetPassword() {
  const { uid, token } = useParams();
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      const res = await api.post(`auth/password-reset-confirm/${uid}/${token}/`, { password });
      setMessage(res.data.message);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid token or error occurred.');
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 pb-5">
      <div className="card p-5 shadow-sm" style={{ maxWidth: '400px', width: '100%' }}>
        <h3 className="text-center mb-4 fw-bold" style={{ color: 'var(--primary-color)' }}>Set New Password</h3>
        {message ? (
          <div className="text-center">
            <div className="alert alert-success border-0 rounded-3">{message}</div>
            <Link to="/login" className="btn btn-primary btn-lg w-100 mt-3 shadow-sm">Go to Login</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && <div className="alert alert-danger border-0 rounded-3">{error}</div>}
            <div className="mb-4">
              <label className="form-label text-muted small fw-bold text-uppercase">New Password</label>
              <input type="password" className="form-control form-control-lg bg-light border-0" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-primary btn-lg w-100 mb-4 shadow-sm">
              Reset Password
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default ResetPassword;
