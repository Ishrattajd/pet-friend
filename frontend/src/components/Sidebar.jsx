import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../api';

function Sidebar({ setUser, isMobileOpen, setMobileOpen }) {
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await api.post('auth/logout/');
    } catch (err) {
      console.error(err);
    } finally {
      localStorage.removeItem('token');
      setUser(null);
    }
  };

  const closeSidebar = () => {
    if (setMobileOpen) setMobileOpen(false);
  };

  return (
    <>
      <div className={`mobile-overlay ${isMobileOpen ? 'open' : ''}`} onClick={closeSidebar}></div>
      <div className={`sidebar-wrapper p-3 d-flex flex-column ${isMobileOpen ? 'open' : ''}`}>
        <div className="d-flex justify-content-between align-items-center mb-4 mt-2">
          <Link to="/" className="navbar-brand px-2 text-decoration-none" onClick={closeSidebar}>
            🐾 Pet Friend
          </Link>
          <button className="btn btn-link d-md-none text-dark fs-4 text-decoration-none" onClick={closeSidebar}>&times;</button>
        </div>
        <div className="nav flex-column gap-1">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`} onClick={closeSidebar}>
            📊 Pet Dashboard
          </Link>
          <Link to="/add-pet" className={`nav-link ${location.pathname === '/add-pet' ? 'active' : ''}`} onClick={closeSidebar}>
            🐕 Add Pet Profile
          </Link>
          <Link to="/add-log" className={`nav-link ${location.pathname === '/add-log' ? 'active' : ''}`} onClick={closeSidebar}>
            🥗 Log Meal Meal
          </Link>
        </div>
        <button className="btn btn-outline-danger mt-auto py-2 rounded-pill fw-bold" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </>
  );
}

export default Sidebar;
