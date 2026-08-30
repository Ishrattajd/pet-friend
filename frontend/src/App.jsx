import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import AddPet from './pages/AddPet';
import AddLog from './pages/AddLog';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import api from './api';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.get('auth/user/')
        .then(res => setUser(res.data))
        .catch(() => {
          localStorage.removeItem('token');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return <div className="d-flex justify-content-center align-items-center vh-100"><div className="spinner-border text-primary" role="status"></div></div>;
  }

  return (
    <Router>
      <div className="d-flex flex-column flex-md-row">
        {user && (
          <>
            <div className="mobile-header">
              <span className="navbar-brand mb-0">🐾 Pet Friend</span>
              <button className="btn btn-outline-primary btn-sm rounded-pill px-3 fw-bold" onClick={() => setMobileOpen(true)}>☰ Menu</button>
            </div>
            <Sidebar setUser={setUser} isMobileOpen={isMobileOpen} setMobileOpen={setMobileOpen} />
          </>
        )}
        <div className={`flex-grow-1 ${user ? 'p-3 p-md-4 main-content bg-light' : 'p-0'}`} style={{ minHeight: '100vh', width: user ? 'calc(100% - 250px)' : '100%' }}>
          <Routes>
            <Route path="/login" element={!user ? <Login setUser={setUser} /> : <Navigate to="/" />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:uid/:token" element={<ResetPassword />} />
            <Route path="/" element={user ? <Dashboard /> : <Navigate to="/login" />} />
            <Route path="/add-pet" element={user ? <AddPet /> : <Navigate to="/login" />} />
            <Route path="/add-log" element={user ? <AddLog /> : <Navigate to="/login" />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
