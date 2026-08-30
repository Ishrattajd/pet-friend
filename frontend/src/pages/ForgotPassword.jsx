import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      const res = await api.post('auth/password-reset/', { email });
      setMessage(res.data.message);
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 pb-5">
      <div className="card p-5 shadow-sm" style={{ maxWidth: '400px', width: '100%' }}>
        <h3 className="text-center mb-4 fw-bold" style={{ color: 'var(--primary-color)' }}>Reset Password</h3>
        {message && <div className="alert alert-success border-0 rounded-3">{message}</div>}
        {error && <div className="alert alert-danger border-0 rounded-3">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="form-label text-muted small fw-bold text-uppercase">Email Address</label>
            <input type="email" className="form-control form-control-lg bg-light border-0" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <button type="submit" className="btn btn-primary btn-lg w-100 mb-4 shadow-sm">
            Send Reset Link
          </button>
        </form>
        <div className="text-center border-top pt-4">
          <Link to="/login" className="text-decoration-none fw-bold" style={{ color: 'var(--primary-color)' }}>Back to Login</Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
