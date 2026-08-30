import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import bgImage from '../assets/login-bg.png';

function Login({ setUser }) {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({ username: '', password: '', email: '' });
  const [error, setError] = useState('');

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const endpoint = isRegister ? 'auth/register/' : 'auth/login/';
    try {
      const res = await api.post(endpoint, formData);
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed');
    }
  };

  return (
    <div className="container-fluid p-0 vh-100 d-flex m-0" style={{ position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/* Background Image Side */}
      <div className="d-none d-lg-block col-lg-7" 
           style={{ 
             backgroundImage: `url(${bgImage})`, 
             backgroundSize: 'cover', 
             backgroundPosition: 'center',
             borderRight: '1px solid #e2e8f0'
           }}>
      </div>
      
      {/* Form Side */}
      <div className="col-12 col-lg-5 d-flex justify-content-center align-items-center bg-white shadow-lg z-3">
        <div className="p-4 p-md-5 w-100" style={{ maxWidth: '480px' }}>
          <h2 className="mb-2 fw-bolder" style={{ color: 'var(--primary-color)', fontSize: '2.5rem' }}>🐾 Pet Friend</h2>
          <h5 className="mb-4 text-muted fw-normal">{isRegister ? 'Create your new account' : 'Sign in to your account'}</h5>
          
          {error && <div className="alert alert-danger border-0 rounded-3">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label text-muted small fw-bold text-uppercase">Username</label>
              <input type="text" name="username" className="form-control form-control-lg bg-light border-0" value={formData.username} onChange={handleChange} required />
            </div>
            {isRegister && (
              <div className="mb-3">
                <label className="form-label text-muted small fw-bold text-uppercase">Email (Optional)</label>
                <input type="email" name="email" className="form-control form-control-lg bg-light border-0" value={formData.email} onChange={handleChange} />
              </div>
            )}
            <div className="mb-4">
              <label className="form-label text-muted small fw-bold text-uppercase">Password</label>
              <input type="password" name="password" className="form-control form-control-lg bg-light border-0" value={formData.password} onChange={handleChange} required />
            </div>
            
            <button type="submit" className="btn btn-primary btn-lg w-100 mb-3 shadow-sm" style={{ borderRadius: '1rem' }}>
              {isRegister ? 'Sign Up' : 'Login'}
            </button>
          </form>
          
          <div className="text-center mb-4 mt-2">
            {!isRegister && (
              <Link to="/forgot-password" className="text-decoration-none text-muted fw-bold">Forgot Password?</Link>
            )}
          </div>
          
          <div className="text-center pt-4" style={{ borderTop: '2px solid #f1f5f9' }}>
            <span className="text-muted">{isRegister ? 'Already have an account? ' : "Don't have an account? "}</span>
            <button className="btn btn-link text-decoration-none fw-bold p-0 m-0 align-baseline" onClick={() => setIsRegister(!isRegister)} style={{ color: 'var(--primary-color)' }}>
              {isRegister ? 'Login here' : 'Sign up for free'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
