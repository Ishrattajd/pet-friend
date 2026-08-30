import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function AddLog() {
  const navigate = useNavigate();
  const [pets, setPets] = useState([]);
  const [formData, setFormData] = useState({
    pet: '',
    date: new Date().toISOString().split('T')[0],
    food_name: '',
    amount_g: '',
    calories: ''
  });

  useEffect(() => {
    api.get('pets/').then(res => setPets(res.data)).catch(console.error);
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('logs/', formData);
      navigate('/');
    } catch (err) {
      console.error(err);
      alert('Error saving meal log.');
    }
  };

  return (
    <div className="container py-4" style={{ maxWidth: '600px' }}>
      <h2 className="mb-4 fw-bold" style={{ color: 'var(--primary-color)' }}>Log Meal</h2>
      <div className="card p-4 shadow-sm border-0">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="form-label text-muted small fw-bold text-uppercase">Select Pet</label>
            <select name="pet" className="form-select form-select-lg bg-light border-0" value={formData.pet} onChange={handleChange} required>
              <option value="">-- Choose a pet --</option>
              {pets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="mb-4">
            <label className="form-label text-muted small fw-bold text-uppercase">Date</label>
            <input type="date" name="date" className="form-control form-control-lg bg-light border-0" value={formData.date} onChange={handleChange} required />
          </div>
          <div className="mb-4">
            <label className="form-label text-muted small fw-bold text-uppercase">Food Name</label>
            <input type="text" name="food_name" className="form-control form-control-lg bg-light border-0" value={formData.food_name} onChange={handleChange} required />
          </div>
          <div className="row">
            <div className="col-md-6 mb-5">
              <label className="form-label text-muted small fw-bold text-uppercase">Amount (grams)</label>
              <input type="number" name="amount_g" className="form-control form-control-lg bg-light border-0" value={formData.amount_g} onChange={handleChange} required />
            </div>
            <div className="col-md-6 mb-5">
              <label className="form-label text-muted small fw-bold text-uppercase">Calories</label>
              <input type="number" name="calories" className="form-control form-control-lg bg-light border-0" value={formData.calories} onChange={handleChange} required />
            </div>
          </div>
          <button type="submit" className="btn btn-primary btn-lg w-100 shadow-sm">Save Meal Log</button>
        </form>
      </div>
    </div>
  );
}

export default AddLog;
