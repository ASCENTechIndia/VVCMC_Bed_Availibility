import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext.jsx';

export default function SelectHospital() {
  const { hospitals } = useData();
  const navigate = useNavigate();
  const [id, setId] = useState('');

  const go = (path) => (e) => {
    e.preventDefault();
    if (!id) {
      e.currentTarget.form?.reportValidity();
      return;
    }
    navigate(`${path}?hospital_id=${id}`);
  };

  return (
    <>
      <h1>Update Bed Status</h1>
      <p className="sm">Select a hospital, then choose what to update.</p>
      <form className="card" onSubmit={go('/bed-update')}>
        <div className="form one">
          <div>
            <label htmlFor="h">Select Hospital *</label>
            <select id="h" name="hospital_id" required value={id} onChange={(e) => setId(e.target.value)}>
              <option value="">-- Select Hospital --</option>
              {hospitals.filter((h) => h.active).map((h) => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          </div>
        </div>
        <p className="actions">
          <button className="btn y" type="submit">Update Daily Bed Status</button>{' '}
          <button className="btn" type="button" onClick={go('/bed-capacity')}>
            Set Bed Capacity (Total Beds)
          </button>
        </p>
      </form>
      <div className="alert info">
        <b>Tip:</b> Use "Daily Bed Status" every day to enter occupied beds. Use "Bed Capacity" only when total beds
        change.
      </div>
    </>
  );
}
