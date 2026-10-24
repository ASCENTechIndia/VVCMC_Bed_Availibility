import { useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { useData } from '../../context/DataContext.jsx';
import BedTable from '../../components/BedTable.jsx';
import { formatDateTime } from '../../utils.js';

const clone = (rows) => rows.map((r) => r.map((c) => ({ ...c })));

/**
 * mode="update"   -> Daily Bed Status Update (edit Occupied)
 * mode="capacity" -> Bed Capacity Setup      (edit Total)
 */
export default function BedForm({ mode }) {
  const [params] = useSearchParams();
  const id = Number(params.get('hospital_id'));
  const { hospitals, beds, saveOccupied, saveCapacity } = useData();
  const hospital = hospitals.find((h) => h.id === id);

  if (!hospital) return <Navigate to="/select-hospital" replace />;
  // key forces a fresh draft when the hospital changes
  return <BedFormInner key={id} mode={mode} hospital={hospital} stored={beds[id]} onSave={mode === 'update' ? saveOccupied : saveCapacity} />;
}

function BedFormInner({ mode, hospital, stored, onSave }) {
  const [rows, setRows] = useState(() => clone(stored));
  const [msg, setMsg] = useState(null);
  const isUpdate = mode === 'update';

  const onChange = (ci, qi, field, value) => {
    setMsg(null);
    setRows((prev) => {
      const next = clone(prev);
      next[ci][qi][field] = value;
      if (isUpdate) {
        next[ci][qi].occupied = Math.min(next[ci][qi].occupied, next[ci][qi].total);
      }
      return next;
    });
  };

  const onSubmit = (e) => {
    e.preventDefault();
    const bad = rows.some((r) => r.some((c) => c.occupied > c.total));
    if (bad) {
      setMsg({ type: 'err', text: 'Occupied cannot exceed Total for any category / quota. Please correct and retry.' });
      return;
    }
    onSave(hospital.id, rows);
    setMsg({ type: 'ok', text: isUpdate ? 'Daily bed status saved successfully.' : 'Bed capacity saved successfully.' });
  };

  return (
    <>
      <div className="ph">
        <h1>{isUpdate ? 'Daily Bed Status Update' : 'Bed Capacity Setup'}</h1>
        <Link className="btn" to="/select-hospital">&laquo; Change hospital</Link>
      </div>
      <div className="card">
        <b>Hospital:</b> {hospital.name} &nbsp;|&nbsp; <b>Last updated:</b> {formatDateTime(hospital.lastUpdated)} by{' '}
        {hospital.updatedBy}
      </div>
      <div className="alert info">
        {isUpdate ? (
          <>Enter <b>Occupied</b> beds for each category and quota. Total beds are fixed here.</>
        ) : (
          <>Enter <b>Total</b> beds for each category and quota. Use 0 where the hospital has no such beds.</>
        )}
      </div>
      {msg && <div className={`alert ${msg.type}`}>{msg.text}</div>}
      <form onSubmit={onSubmit}>
        <BedTable rows={rows} mode={mode} onChange={onChange} />
        <p className="actions">
          <button className="btn y" type="submit">{isUpdate ? 'Save / Submit' : 'Save Capacity'}</button>{' '}
          <Link className="btn g2" to="/select-hospital">Cancel</Link>
        </p>
        <p className="sm">Available = Total − Occupied (calculated automatically). Occupied cannot exceed Total.</p>
      </form>
    </>
  );
}
