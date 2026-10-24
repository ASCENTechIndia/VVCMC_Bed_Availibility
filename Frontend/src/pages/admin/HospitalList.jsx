import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../../context/DataContext.jsx';
import { HOSPITAL_TYPES } from '../../data/seed.js';

const PAGE_SIZE = 10;

export default function HospitalList() {
  const { hospitals, toggleHospitalStatus } = useData();
  const [draft, setDraft] = useState({ q: '', type: '', status: '' });
  const [filter, setFilter] = useState(draft);
  const [page, setPage] = useState(1);

  const term = filter.q.trim().toLowerCase();
  const list = hospitals.filter(
    (h) =>
      (!term || h.name.toLowerCase().includes(term) || h.area.toLowerCase().includes(term)) &&
      (!filter.type || h.type === filter.type) &&
      (!filter.status || (filter.status === 'Active') === h.active)
  );
  const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const cur = Math.min(page, pages);
  const shown = list.slice((cur - 1) * PAGE_SIZE, cur * PAGE_SIZE);

  const set = (k) => (e) => setDraft((d) => ({ ...d, [k]: e.target.value }));
  const go = (p) => (e) => {
    e.preventDefault();
    setPage(Math.min(Math.max(1, p), pages));
  };

  return (
    <>
      <div className="ph">
        <h1>Hospital Master</h1>
        <Link className="btn" to="/admin/hospitals/add">+ Add New Hospital</Link>
      </div>
      <form
        className="card bar"
        onSubmit={(e) => {
          e.preventDefault();
          setFilter(draft);
          setPage(1);
        }}
      >
        <div>
          <label htmlFor="q">Search name / area</label>
          <input type="text" id="q" name="q" value={draft.q} onChange={set('q')} />
        </div>
        <div>
          <label htmlFor="t">Type</label>
          <select id="t" name="type" value={draft.type} onChange={set('type')}>
            <option value="">All</option>
            {HOSPITAL_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="s">Status</label>
          <select id="s" name="status" value={draft.status} onChange={set('status')}>
            <option value="">All</option>
            <option>Active</option>
            <option>Inactive</option>
          </select>
        </div>
        <button className="btn" type="submit">Search</button>
      </form>

      <div className="sc">
        <table className="lt">
          <thead>
            <tr><th>ID</th><th>Hospital Name</th><th>Area</th><th>Type</th><th>Phone</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {shown.map((h) => (
              <tr key={h.id}>
                <td>{h.id}</td>
                <td>{h.name}</td>
                <td>{h.area}</td>
                <td>{h.type}</td>
                <td>{h.phone}</td>
                <td><span className={`tag ${h.active ? 'ok' : 'no'}`}>{h.active ? 'Active' : 'Inactive'}</span></td>
                <td>
                  <Link className="btn s" to={`/admin/hospitals/edit?id=${h.id}`}>Edit</Link>{' '}
                  <Link className="btn s y" to={`/admin/bed-capacity?hospital_id=${h.id}`}>Capacity</Link>{' '}
                  <button type="button" className={`btn s ${h.active ? 'd' : ''}`} onClick={() => toggleHospitalStatus(h.id)}>
                    {h.active ? 'Deactivate' : 'Activate'}
                  </button>
                </td>
              </tr>
            ))}
            {shown.length === 0 && (
              <tr><td colSpan="7">No hospitals found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pg">
        <a href="#" onClick={go(cur - 1)}>&laquo; Prev</a>
        {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
          <a key={p} href="#" className={p === cur ? 'on' : undefined} onClick={go(p)}>{p}</a>
        ))}
        <a href="#" onClick={go(cur + 1)}>Next &raquo;</a>
      </div>
    </>
  );
}
