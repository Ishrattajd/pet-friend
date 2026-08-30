import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import api from '../api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const formatAge = (months) => {
  if (!months) return "0 mo";
  const yrs = Math.floor(months / 12);
  const mos = months % 12;
  if (yrs === 0) return `${mos} mo`;
  if (mos === 0) return `${yrs} yr${yrs > 1 ? 's' : ''}`;
  return `${yrs} yr${yrs > 1 ? 's' : ''}, ${mos} mo`;
};

function Dashboard() {
  const [pets, setPets] = useState([]);
  const [logs, setLogs] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [selectedPetId, setSelectedPetId] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  
  const [newWeight, setNewWeight] = useState('');
  const [newReminder, setNewReminder] = useState({ title: '', reminder_type: 'Vaccine', due_date: '' });
  const [editFormData, setEditFormData] = useState({});
  const fileInputRef = useRef(null);

  useEffect(() => {
    api.get('pets/').then(res => {
      setPets(res.data);
      if (res.data.length > 0) {
        setSelectedPetId(res.data[0].id);
      }
    }).catch(console.error);
    api.get('logs/').then(res => setLogs(res.data)).catch(console.error);
    api.get('reminders/').then(res => setReminders(res.data)).catch(console.error);
  }, []);

  const selectedPet = pets.find(p => p.id === parseInt(selectedPetId)) || pets[0];
  const petLogs = selectedPet ? logs.filter(l => l.pet === selectedPet.id) : [];
  const petReminders = selectedPet ? reminders.filter(r => r.pet === selectedPet.id) : [];

  const todayStr = new Date().toISOString().split('T')[0];
  const todayLogs = petLogs.filter(l => l.date === todayStr);
  const caloriesToday = todayLogs.reduce((acc, log) => acc + log.calories, 0);
  const goal = selectedPet?.daily_calorie_target || 1000;
  const progressPercentage = Math.min((caloriesToday / goal) * 100, 100);

  // Birthday Check
  const todayDate = new Date();
  const dob = selectedPet?.date_of_birth ? new Date(selectedPet.date_of_birth) : null;
  const isBirthday = dob && dob.getDate() === todayDate.getDate() && dob.getMonth() === todayDate.getMonth();

  const chartDataMap = {};
  petLogs.forEach(log => {
    chartDataMap[log.date] = (chartDataMap[log.date] || 0) + log.calories;
  });
  const sortedDates = Object.keys(chartDataMap).sort();
  const calorieValues = sortedDates.map(date => chartDataMap[date]);

  const chartData = {
    labels: sortedDates,
    datasets: [
      { label: 'Calories Consumed', data: calorieValues, borderColor: '#0d9488', backgroundColor: 'rgba(13, 148, 136, 0.2)', tension: 0.4, fill: true },
      { label: 'Daily Goal', data: sortedDates.map(() => goal), borderColor: '#f97316', borderDash: [5, 5], pointRadius: 0, fill: false }
    ],
  };

  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'top' }, title: { display: false } },
    scales: { y: { beginAtZero: true } }
  };

  const mediaBaseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api/').replace(/\/api\/?$/, '');
  const photoUrl = selectedPet?.photo 
    ? (selectedPet.photo.startsWith('http') ? selectedPet.photo : `${mediaBaseUrl}${selectedPet.photo}`) 
    : null;

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const data = new FormData();
    data.append('photo', file);
    try {
      await api.patch(`pets/${selectedPet.id}/`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
      const res = await api.get('pets/');
      setPets(res.data);
      setShowModal(false);
    } catch (err) { alert('Error updating photo'); }
  };

  const handleWeightSubmit = async (e) => {
    e.preventDefault();
    if (!newWeight) return;
    try {
      await api.post('weights/', { pet: selectedPet.id, weight_kg: newWeight });
      const res = await api.get('pets/');
      setPets(res.data);
      setShowWeightModal(false);
      setNewWeight('');
    } catch (err) { alert('Error logging weight'); }
  };

  const handleDeletePet = async () => {
    try {
      await api.delete(`pets/${selectedPet.id}/`);
      const res = await api.get('pets/');
      setPets(res.data);
      if (res.data.length > 0) setSelectedPetId(res.data[0].id);
      setShowDeleteModal(false);
    } catch (err) { alert('Error deleting pet'); }
  };

  const handleOpenSettings = () => {
    setEditFormData({
      name: selectedPet.name,
      pet_type: selectedPet.pet_type,
      breed: selectedPet.breed,
      date_of_birth: selectedPet.date_of_birth || ''
    });
    setShowSettingsModal(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    if (name === 'pet_type') {
      setEditFormData({ ...editFormData, pet_type: value, breed: '' }); 
    } else {
      setEditFormData({ ...editFormData, [name]: value });
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`pets/${selectedPet.id}/`, editFormData);
      const res = await api.get('pets/');
      setPets(res.data);
      setShowSettingsModal(false);
    } catch (err) { alert('Error updating profile'); }
  };

  const handleToggleReminder = async (rem) => {
    try {
      await api.patch(`reminders/${rem.id}/`, { is_completed: !rem.is_completed });
      const res = await api.get('reminders/');
      setReminders(res.data);
    } catch (err) { console.error(err); }
  };

  const handleAddReminder = async (e) => {
    e.preventDefault();
    try {
      await api.post('reminders/', { ...newReminder, pet: selectedPet.id });
      const res = await api.get('reminders/');
      setReminders(res.data);
      setShowReminderModal(false);
      setNewReminder({ title: '', reminder_type: 'Vaccine', due_date: '' });
    } catch (err) { alert('Error adding reminder'); }
  };

  const getReminderTheme = (type, dueDate, isCompleted) => {
    const isUrgent = !isCompleted && dueDate <= todayStr;
    let baseClass = '';
    let emoji = '';
    if (type === 'Vaccine') { baseClass = 'bg-soft-purple'; emoji = '💉'; }
    else if (type === 'Medication') { baseClass = 'bg-soft-teal'; emoji = '💊'; }
    else if (type === 'Grooming') { baseClass = 'bg-soft-blue'; emoji = '✂️'; }
    else { baseClass = 'bg-soft-gray'; emoji = '📌'; }
    
    return { 
      className: `p-3 mb-3 rounded-end shadow-sm d-flex align-items-center justify-content-between ${baseClass} ${isUrgent ? 'reminder-urgent' : ''} ${isCompleted ? 'reminder-completed' : ''}`, 
      emoji, 
      isUrgent 
    };
  };

  if (pets.length === 0) {
    return (
      <div className="container py-5 d-flex flex-column align-items-center justify-content-center vh-100">
        <div className="card border-0 shadow-lg p-5 text-center" style={{ borderRadius: '24px', maxWidth: '540px', backgroundColor: '#ffffff' }}>
          <img src="https://cdni.iconscout.com/illustration/premium/thumb/pet-care-4352125-3618790.png" alt="Happy pets illustration" className="img-fluid mb-4 mx-auto" style={{ maxHeight: '280px' }} />
          <h2 className="fw-bolder mb-3" style={{ color: 'var(--primary-color)', fontSize: '2.2rem' }}>Welcome to the Pack! 🐾</h2>
          <p className="text-muted mb-4 fs-5 px-3">Let's start tracking your furry friend's health journey. Add your first pet below!</p>
          <Link to="/add-pet" className="btn btn-primary btn-lg rounded-pill shadow-sm py-3 px-5 fw-bold" style={{ fontSize: '1.1rem' }}>Add Your First Pet 🐕</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`container py-4 position-relative ${isBirthday ? 'birthday-theme rounded-4 p-4 shadow-sm' : ''}`}>
      
      {isBirthday && (
        <div className="text-center mb-4 pt-2">
          <h1 className="fw-bolder text-white" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.1)' }}>
            🎉 Happy Birthday, {selectedPet.name}! 🎂
          </h1>
          <p className="text-white fw-bold fs-5">Time for extra treats today! 🍖🍗</p>
        </div>
      )}

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className={`fw-bolder mb-0 ${isBirthday ? 'text-white' : ''}`} style={{ color: isBirthday ? '' : 'var(--primary-color)' }}>My Dashboard 🐾</h2>
        {pets.length > 1 && (
          <select 
            className="form-select form-select-lg w-auto shadow-sm border-0 fw-bold" 
            style={{ borderRadius: '1rem', backgroundColor: '#ffffff', color: 'var(--text-color)' }}
            value={selectedPetId} 
            onChange={(e) => setSelectedPetId(e.target.value)}
          >
            {pets.map(p => <option key={p.id} value={p.id}>{p.name} {p.pet_type === 'Dog' ? '🐶' : '🐱'}</option>)}
          </select>
        )}
      </div>

      {selectedPet && (
        <div className="row g-4">
          {/* Profile Card */}
          <div className="col-lg-4">
            <div className={`card h-100 p-4 p-md-5 text-center border-0 shadow-sm position-relative ${isBirthday ? 'birthday-card' : ''}`} style={{ borderRadius: '24px' }}>
              
              {photoUrl ? (
                <div 
                  className="mx-auto mb-4 shadow-sm rounded-circle bg-white position-relative" 
                  style={{ width: '200px', height: '200px', border: '4px solid var(--primary-color)', cursor: 'pointer', padding: '2px' }}
                  onClick={() => setShowModal(true)}
                  title="Click to view or change image"
                >
                  <img src={photoUrl} alt={selectedPet.name} className="rounded-circle" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div className="position-absolute bottom-0 end-0 bg-white text-primary rounded-circle d-flex align-items-center justify-content-center shadow" style={{ width: '45px', height: '45px', transform: 'translate(-5px, -5px)', border: '2px solid var(--primary-color)', fontSize: '1.2rem' }}>✏️</div>
                </div>
              ) : (
                <div 
                  className="mx-auto mb-4 p-1 shadow-sm rounded-circle d-flex align-items-center justify-content-center position-relative" 
                  style={{ width: '200px', height: '200px', border: '4px solid var(--primary-color)', backgroundColor: '#f0fdfa', cursor: 'pointer' }}
                  onClick={() => setShowModal(true)}
                  title="Click to add an image"
                >
                  <img src={selectedPet.pet_type === 'Cat' ? "https://cdn-icons-png.flaticon.com/512/1864/1864514.png" : "https://cdn-icons-png.flaticon.com/512/1864/1864455.png"} alt="Placeholder" className="rounded-circle p-4" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} />
                  <div className="position-absolute bottom-0 end-0 bg-white text-primary rounded-circle d-flex align-items-center justify-content-center shadow" style={{ width: '45px', height: '45px', transform: 'translate(-5px, -5px)', border: '2px solid var(--primary-color)', fontSize: '1.2rem' }}>➕</div>
                </div>
              )}
              
              <h3 className="fw-bold mb-1" style={{ color: 'var(--text-color)' }}>{selectedPet.name}</h3>
              <p className="text-muted mb-4 fs-5 fw-medium">{selectedPet.breed}</p>
              
              <div className="d-flex justify-content-center gap-3 mt-auto text-start">
                <div className="p-3 w-100 text-center rounded-4 shadow-sm" style={{ backgroundColor: '#f8fafc', border: '1px solid #f1f5f9' }}>
                  <div className="small text-muted text-uppercase fw-bold mb-1">Age</div>
                  <div className="fw-bolder fs-5" style={{ color: 'var(--primary-color)' }}>{formatAge(selectedPet.age_in_months)}</div>
                </div>
                <div className="p-3 w-100 text-center rounded-4 shadow-sm position-relative" style={{ backgroundColor: '#f8fafc', border: '1px solid #f1f5f9' }}>
                  <div className="small text-muted text-uppercase fw-bold mb-1">Weight</div>
                  <div className="fw-bolder fs-4" style={{ color: 'var(--primary-color)' }}>{selectedPet.current_weight} <span className="fs-6 fw-normal text-muted">kg</span></div>
                  <button className="btn btn-sm btn-light position-absolute top-0 end-0 m-2 rounded-circle shadow-sm" style={{ width: '28px', height: '28px', padding: 0, border: '1px solid #e2e8f0' }} onClick={() => setShowWeightModal(true)} title="Log Weight">➕</button>
                </div>
              </div>

              {/* Secure Settings / Delete Gear */}
              <button 
                className="btn btn-link text-muted position-absolute bottom-0 end-0 m-3 p-1 fs-5 text-decoration-none shadow-sm rounded-circle bg-light" 
                style={{ width: '40px', height: '40px' }}
                onClick={handleOpenSettings}
                title="Pet Settings"
              >
                ⚙️
              </button>
            </div>
          </div>

          {/* Nutrition Card */}
          <div className="col-lg-8">
            <div className="card h-100 p-4 p-md-5 d-flex flex-column justify-content-center border-0 shadow-sm" style={{ borderRadius: '24px' }}>
              <h4 className="fw-bold mb-4" style={{ color: 'var(--text-color)' }}>Today's Nutrition 🥗</h4>
              <div className="d-flex justify-content-between mb-2 align-items-end">
                <span className="text-muted fw-bold text-uppercase small">Calories Consumed</span>
                <span className="fw-bolder" style={{ fontSize: '1.75rem', color: 'var(--primary-color)' }}>{caloriesToday} <span className="text-muted fs-5 fw-normal">/ {goal} kcal</span></span>
              </div>
              <div className="progress mb-2 rounded-pill shadow-sm bg-light" style={{ height: '28px', border: '1px solid #f1f5f9' }}>
                <div className={`progress-bar progress-bar-striped progress-bar-animated ${progressPercentage >= 100 ? 'bg-danger' : ''}`} style={{ width: `${progressPercentage}%`, backgroundColor: progressPercentage >= 100 ? '' : 'var(--accent-color)' }}></div>
              </div>
              <div className="text-end mb-4 fw-bold pb-2" style={{ color: 'var(--primary-hover)', fontSize: '0.95rem' }}>
                {progressPercentage >= 100 ? "Goal reached! Time for play! 🎾" : (progressPercentage > 50 ? "Looking healthy today! 🦴" : "Time for a healthy snack! 🐟")}
              </div>
              
              {todayLogs.length > 0 ? (
                <div>
                  <h6 className="fw-bold text-muted text-uppercase small mb-3">Today's Meals 🍖</h6>
                  <ul className="list-group list-group-flush">
                    {todayLogs.map(log => (
                      <li key={log.id} className="list-group-item d-flex justify-content-between align-items-center px-0 bg-transparent py-3" style={{ borderBottom: '1px dashed #e2e8f0' }}>
                        <div><strong className="fs-5">{log.food_name}</strong><div className="text-muted fw-medium">{log.amount_g}g</div></div>
                        <span className="badge text-primary bg-white rounded-pill shadow-sm fs-6 px-3 py-2 border border-primary">{log.calories} kcal</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="text-center text-muted my-3 py-5 rounded-4 shadow-sm" style={{ backgroundColor: '#f8fafc', border: '1px dashed #cbd5e1' }}>
                  <div className="fs-1 mb-3">🍽️</div>
                  <h5 className="fw-bold text-muted mb-2">No meals logged today!</h5>
                  <Link to="/add-log" className="btn btn-primary px-4 py-2 rounded-pill fw-bold shadow-sm">Log First Meal</Link>
                </div>
              )}
            </div>
          </div>

          {/* Agenda & Reminders */}
          <div className="col-lg-6">
            <div className="card h-100 p-4 p-md-5 border-0 shadow-sm" style={{ borderRadius: '24px' }}>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="fw-bold mb-0" style={{ color: 'var(--text-color)' }}>Agenda & Reminders 📅</h4>
                <button className="btn btn-sm btn-primary rounded-pill shadow-sm fw-bold px-3" onClick={() => setShowReminderModal(true)}>+ New</button>
              </div>
              
              <div className="agenda-list">
                {petReminders.length > 0 ? petReminders.map(rem => {
                  const theme = getReminderTheme(rem.reminder_type, rem.due_date, rem.is_completed);
                  return (
                    <div key={rem.id} className={theme.className} style={{ cursor: 'pointer' }} onClick={() => handleToggleReminder(rem)}>
                      <div className="d-flex align-items-center gap-3">
                        <div className="form-check" onClick={e => e.stopPropagation()}>
                          <input className="form-check-input form-check-input-lg" type="checkbox" checked={rem.is_completed} onChange={() => handleToggleReminder(rem)} style={{ transform: 'scale(1.3)', cursor: 'pointer' }} />
                        </div>
                        <div>
                          <div className="fw-bolder fs-6 d-flex align-items-center gap-2">
                            {theme.emoji} {rem.title}
                            {theme.isUrgent && <span className="pulse-dot ms-2" title="Urgent / Overdue"></span>}
                          </div>
                          <div className="small text-muted fw-bold">Due: {new Date(rem.due_date).toLocaleDateString()}</div>
                        </div>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="text-center text-muted py-5 rounded-4 shadow-sm bg-light" style={{ border: '1px dashed #cbd5e1' }}>
                    <div className="fs-1 mb-3">✅</div>
                    <h6 className="fw-bold">All caught up!</h6>
                    <p className="small">No upcoming reminders.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Calorie Trends */}
          <div className="col-lg-6">
            <div className="card p-4 p-md-5 border-0 shadow-sm h-100" style={{ borderRadius: '24px' }}>
              <h4 className="fw-bold mb-4" style={{ color: 'var(--text-color)' }}>Calorie Intake Trends 📈</h4>
              <div style={{ height: '300px' }}>
                {sortedDates.length > 0 ? (
                  <Line data={chartData} options={chartOptions} />
                ) : (
                  <div className="h-100 d-flex flex-column align-items-center justify-content-center text-muted rounded-4 shadow-sm bg-light" style={{ border: '1px dashed #cbd5e1' }}>
                    <div className="fs-1 mb-3">📊</div>
                    <p className="fw-medium">Log meals over time to see trends!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '24px' }}>
              <div className="modal-body text-center p-5">
                <div className="mb-4" style={{ fontSize: '4rem' }}>🥺</div>
                <h3 className="fw-bolder mb-3" style={{ color: 'var(--text-color)' }}>Are you sure?</h3>
                <p className="text-muted fs-5 mb-4">
                  Do you want to remove <strong>{selectedPet.name}</strong> from your pack? 🐾<br/><br/>
                  <span className="text-danger small">This action will permanently delete all of their historical weight tracking, nutrition logs, and reminder schedules.</span>
                </p>
                <div className="d-flex justify-content-center gap-3">
                  <button className="btn btn-light btn-lg rounded-pill px-4 fw-bold shadow-sm" onClick={() => setShowDeleteModal(false)}>Keep {selectedPet.name}</button>
                  <button className="btn btn-outline-danger btn-lg rounded-pill px-4 fw-bold shadow-sm" onClick={handleDeletePet}>Yes, Delete Permanently</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings & Edit Profile Modal */}
      {showSettingsModal && selectedPet && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '24px' }}>
              <div className="modal-header border-0 pb-0 pt-4 px-4">
                <h5 className="modal-title fw-bold" style={{ color: 'var(--primary-color)' }}>Pet Settings ⚙️</h5>
                <button type="button" className="btn-close" onClick={() => setShowSettingsModal(false)}></button>
              </div>
              <form onSubmit={handleSaveSettings}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label text-muted small fw-bold text-uppercase">Name</label>
                    <input type="text" name="name" className="form-control form-control-lg bg-light border-0" value={editFormData.name || ''} onChange={handleEditChange} required />
                  </div>
                  <div className="row g-3 mb-3">
                    <div className="col-6">
                      <label className="form-label text-muted small fw-bold text-uppercase">Type</label>
                      <select name="pet_type" className="form-select form-select-lg bg-light border-0" value={editFormData.pet_type || ''} onChange={handleEditChange} required>
                        <option value="Dog">Dog 🐶</option>
                        <option value="Cat">Cat 🐱</option>
                        <option value="Unknown">Unknown</option>
                      </select>
                    </div>
                    <div className="col-6">
                      <label className="form-label text-muted small fw-bold text-uppercase">Breed</label>
                      <input type="text" name="breed" className="form-control form-control-lg bg-light border-0" value={editFormData.breed || ''} onChange={handleEditChange} required placeholder="Breed" />
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="form-label text-muted small fw-bold text-uppercase">Date of Birth</label>
                    <input type="date" name="date_of_birth" className="form-control form-control-lg bg-light border-0" value={editFormData.date_of_birth || ''} onChange={handleEditChange} max={todayStr} />
                  </div>
                  
                  <hr className="my-4" style={{ borderStyle: 'dashed' }} />
                  
                  <div className="d-flex justify-content-between align-items-center">
                     <div>
                       <h6 className="fw-bold text-danger mb-1">Danger Zone</h6>
                       <small className="text-muted">Permanently remove this pet.</small>
                     </div>
                     <button type="button" className="btn btn-outline-danger btn-sm rounded-pill px-3 fw-bold shadow-sm" onClick={() => { setShowSettingsModal(false); setShowDeleteModal(true); }}>Delete Pet</button>
                  </div>
                </div>
                <div className="modal-footer border-0 pt-0 pb-4 px-4 bg-light" style={{ borderBottomLeftRadius: '24px', borderBottomRightRadius: '24px' }}>
                  <button type="button" className="btn btn-light rounded-pill px-4 fw-bold mt-2" onClick={() => setShowSettingsModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm mt-2">Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Reminder Modal */}
      {showReminderModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '24px' }}>
              <div className="modal-header border-0 pb-0 pt-4 px-4">
                <h5 className="modal-title fw-bold" style={{ color: 'var(--primary-color)' }}>New Reminder 📅</h5>
                <button type="button" className="btn-close" onClick={() => setShowReminderModal(false)}></button>
              </div>
              <form onSubmit={handleAddReminder}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label text-muted small fw-bold text-uppercase">Title</label>
                    <input type="text" className="form-control form-control-lg bg-light border-0" value={newReminder.title} onChange={e => setNewReminder({...newReminder, title: e.target.value})} required placeholder="E.g., Deworming Pill" />
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-muted small fw-bold text-uppercase">Type</label>
                    <select className="form-select form-select-lg bg-light border-0" value={newReminder.reminder_type} onChange={e => setNewReminder({...newReminder, reminder_type: e.target.value})} required>
                      <option value="Vaccine">Vaccine 💉</option>
                      <option value="Medication">Medication 💊</option>
                      <option value="Grooming">Grooming ✂️</option>
                      <option value="Other">Other 📌</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label text-muted small fw-bold text-uppercase">Due Date</label>
                    <input type="date" className="form-control form-control-lg bg-light border-0" value={newReminder.due_date} onChange={e => setNewReminder({...newReminder, due_date: e.target.value})} required min={todayStr} />
                  </div>
                </div>
                <div className="modal-footer border-0 pt-0 pb-4 px-4">
                  <button type="button" className="btn btn-light rounded-pill px-4 fw-bold" onClick={() => setShowReminderModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm">Add Reminder</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Image View/Edit Modal */}
      {showModal && selectedPet && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)' }} tabIndex="-1" onClick={() => setShowModal(false)}>
          <div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()}>
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '24px' }}>
              <div className="modal-header border-0 pb-0 pt-4 px-4">
                <h5 className="modal-title fw-bold" style={{ color: 'var(--primary-color)' }}>{selectedPet.name}'s Photo</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body text-center p-4">
                {photoUrl ? (
                  <img src={photoUrl} alt={selectedPet.name} className="img-fluid rounded-4 mb-4 shadow-sm" style={{ maxHeight: '400px', objectFit: 'contain', width: '100%' }} />
                ) : (
                  <div className="mb-4 text-muted py-5 bg-light rounded-4 border"><div className="fs-1 mb-2">📷</div>No photo uploaded yet.</div>
                )}
                <input type="file" ref={fileInputRef} className="d-none" accept="image/*" onChange={handleFileChange} />
                <button className="btn btn-primary btn-lg rounded-pill px-5 fw-bold shadow-sm" onClick={() => fileInputRef.current.click()}>{photoUrl ? 'Change Photo 📸' : 'Upload Photo 📸'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Weight Log Modal */}
      {showWeightModal && selectedPet && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)' }} tabIndex="-1" onClick={() => setShowWeightModal(false)}>
          <div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()}>
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '24px' }}>
              <div className="modal-header border-0 pb-0 pt-4 px-4">
                <h5 className="modal-title fw-bold" style={{ color: 'var(--primary-color)' }}>Log New Weight for {selectedPet.name} ⚖️</h5>
                <button type="button" className="btn-close" onClick={() => setShowWeightModal(false)}></button>
              </div>
              <form onSubmit={handleWeightSubmit}>
                <div className="modal-body p-4">
                  <div className="mb-3 text-start">
                    <label className="form-label text-muted small fw-bold text-uppercase">Current Weight (kg)</label>
                    <input type="number" step="0.01" className="form-control form-control-lg bg-light border-0" value={newWeight} onChange={e => setNewWeight(e.target.value)} required placeholder="E.g., 15.5" autoFocus />
                  </div>
                </div>
                <div className="modal-footer border-0 pt-0 pb-4 px-4">
                  <button type="button" className="btn btn-light rounded-pill px-4 fw-bold" onClick={() => setShowWeightModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm">Save Weight</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
