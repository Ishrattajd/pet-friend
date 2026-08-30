import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const DOG_BREEDS = ["Labrador", "German Shepherd", "Golden Retriever", "Indie", "Poodle", "Boxer", "Bulldog", "Beagle"];
const CAT_BREEDS = ["Persian", "Siamese", "Maine Coon", "Indie/Domestic Shorthair", "Bengal", "Sphynx", "Ragdoll"];

function AddPet() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    pet_type: '',
    breed: '',
    date_of_birth: '',
    age_months: '',
    initial_weight: '',
  });
  const [knowsBirthday, setKnowsBirthday] = useState(true);
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'pet_type') {
      setFormData({ ...formData, pet_type: value, breed: '' }); 
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };
  const handleFileChange = (e) => setPhoto(e.target.files[0]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const data = new FormData();
    Object.keys(formData).forEach(key => {
      if (key === 'date_of_birth' && !knowsBirthday) return;
      if (key === 'age_months' && knowsBirthday) return;
      if (formData[key]) data.append(key, formData[key]);
    });
    if (photo) {
      data.append('photo', photo);
    }

    try {
      await api.post('pets/', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      navigate('/');
    } catch (err) {
      console.error(err);
      const backendError = err.response?.data;
      if (backendError && typeof backendError === 'object') {
         const errorMessages = Object.entries(backendError).map(([key, val]) => `${key}: ${val}`).join(' | ');
         setError(errorMessages);
      } else {
         setError('Error saving pet profile. Please try again.');
      }
    }
  };

  const breedOptions = formData.pet_type === 'Dog' ? DOG_BREEDS : (formData.pet_type === 'Cat' ? CAT_BREEDS : []);

  return (
    <div className="container py-4 d-flex justify-content-center">
      <div style={{ maxWidth: '700px', width: '100%' }}>
        <h2 className="mb-4 fw-bolder" style={{ color: 'var(--primary-color)' }}>Add Pet Profile</h2>
        <div className="card p-5 shadow-lg border-0" style={{ borderRadius: '1.5rem' }}>
          {error && <div className="alert alert-danger border-0 rounded-3 mb-4">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="form-label text-muted small fw-bold text-uppercase">Pet Name</label>
              <input type="text" name="name" className="form-control form-control-lg bg-light border-0 px-4 py-3" value={formData.name} onChange={handleChange} required placeholder="E.g., Max" />
            </div>
            
            <div className="row g-4 mb-4">
              <div className="col-md-6">
                <label className="form-label text-muted small fw-bold text-uppercase">Pet Type</label>
                <select name="pet_type" className="form-select form-select-lg bg-light border-0 px-4 py-3" value={formData.pet_type} onChange={handleChange} required>
                  <option value="">-- Select Type --</option>
                  <option value="Dog">Dog 🐶</option>
                  <option value="Cat">Cat 🐱</option>
                  <option value="Unknown">Unknown</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label text-muted small fw-bold text-uppercase">Breed</label>
                <select name="breed" className="form-select form-select-lg bg-light border-0 px-4 py-3" value={formData.breed} onChange={handleChange} required disabled={!formData.pet_type}>
                  <option value="">-- Select Breed --</option>
                  {breedOptions.map(b => <option key={b} value={b}>{b}</option>)}
                  {formData.pet_type && <option value="Unknown">Unknown</option>}
                </select>
              </div>
            </div>

            <div className="mb-4 p-4 rounded-4 shadow-sm" style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <label className="form-label text-muted small fw-bold text-uppercase m-0">Do you know your pet's exact birthday?</label>
                <div className="form-check form-switch">
                  <input className="form-check-input form-check-input-lg" type="checkbox" role="switch" checked={knowsBirthday} onChange={(e) => setKnowsBirthday(e.target.checked)} style={{ cursor: 'pointer', transform: 'scale(1.2)' }} />
                </div>
              </div>

              {knowsBirthday ? (
                <div>
                  <input type="date" name="date_of_birth" className="form-control form-control-lg bg-white border-0 px-4 py-3 shadow-sm" value={formData.date_of_birth} onChange={handleChange} required={knowsBirthday} max={new Date().toISOString().split('T')[0]} />
                </div>
              ) : (
                <div>
                  <input type="number" name="age_months" className="form-control form-control-lg bg-white border-0 px-4 py-3 shadow-sm mb-2" value={formData.age_months} onChange={handleChange} required={!knowsBirthday} placeholder="Age in months (e.g., 24)" />
                  <small className="text-primary fw-medium">🎉 We'll set their birthday to International Pet Day (April 11) so we can celebrate!</small>
                </div>
              )}
            </div>

            <div className="mb-4">
              <label className="form-label text-muted small fw-bold text-uppercase">Current Weight (kg)</label>
              <input type="number" step="0.01" name="initial_weight" className="form-control form-control-lg bg-light border-0 px-4 py-3" value={formData.initial_weight} onChange={handleChange} required placeholder="E.g., 15.5" />
            </div>

            <div className="mb-5">
              <label className="form-label text-muted small fw-bold text-uppercase">Profile Photo (Optional)</label>
              <input type="file" className="form-control form-control-lg bg-light border-0 px-4 py-3" accept="image/*" onChange={handleFileChange} />
              <div className="form-text text-muted mt-2">Upload a cute photo of your pet!</div>
            </div>
            
            <button type="submit" className="btn btn-primary btn-lg w-100 shadow-sm py-3 fw-bold" style={{ borderRadius: '1rem' }}>Save Pet Profile</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AddPet;
