import { useState } from 'react';
import { useData } from '../../context/DataContext.jsx';
import { formatDateTime24 } from '../../utils.js';

const PAGE_SIZE = 10;

const dayStart = (s) => new Date(`${s}T00:00:00`).getTime();
const dayEnd = (s) => new Date(`${s}T23:59:59.999`).getTime();

export default function UpdateHistory() {
  const { hospitals, history } = useData();
  const [draft, setDraft] = useState({ hospital: '', from: '', to: '', user: '' });
  const [filter, setFilter] = useState(draft);
  const [page, setPage] = useState(1);

  const nameOf = (id) => hospitals.find((h) => h.id === id)?.name ?? `#${id}`;
  const users = [...new Set(history.map((r) => r.user))];

  const list = history.filter((r) => {
    const t = new Date(r.at).getTime();
    return (
      (!filter.hospital || r.hospitalId === Number(filter.hospital)) &&
      (!filter.from || t >= dayStart(filter.from)) &&
      (!filter.to || t <= dayEnd(filter.to)) &&
      (!filter.user || r.user === filter.user)
    );
  });

  const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const cur = Math.min(page, pages);
  const shown = list.slice((cur - 1) * PAGE_SIZE, cur * PAGE_SIZE);

  const set = (k) => (e) => setDraft((d) => ({ ...d, [k]: e.target.value }));
  const go = (p) => (e) => {
    e.preventDefault();
    setPage(Math.min(Math.max(1, p), pages));
  };

  const exportCsv = () => {
    const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;
    const head = ['Date & Time', 'Hospital', 'Category', 'Quota', 'Old Occupied', 'New Occupied', 'User', 'IP'];
    const lines = list.map((r) =>
      [formatDateTime24(r.at), nameOf(r.hospitalId), r.category, r.quota, r.oldOccupied, r.newOccupied, r.user, r.ip]
        .map(esc)
        .join(',')
    );
    const blob = new Blob([[head.map(esc).join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'update-history.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <h1>Update History / Audit Log</h1>
      <form
        className="card bar"
        onSubmit={(e) => {
          e.preventDefault();
          setFilter(draft);
          setPage(1);
        }}
      >
        <div>
          <label htmlFor="h">Hospital</label>
          <select id="h" name="hospital_id" value={draft.hospital} onChange={set('hospital')}>
            <option value="">All</option>
            {hospitals.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="f">From</label>
          <input type="date" id="f" name="from" value={draft.from} onChange={set('from')} />
        </div>
        <div>
          <label htmlFor="t">To</label>
          <input type="date" id="t" name="to" value={draft.to} onChange={set('to')} />
        </div>
        <div>
          <label htmlFor="u">User</label>
          <select id="u" name="user_id" value={draft.user} onChange={set('user')}>
            <option value="">All</option>
            {users.map((u) => <option key={u}>{u}</option>)}
          </select>
        </div>
        <button className="btn" type="submit">Filter</button>{' '}
        <button className="btn g2" type="button" onClick={exportCsv}>Export CSV</button>
      </form>

      <div className="sc">
        <table className="lt">
          <thead>
            <tr>
              <th>Date &amp; Time</th><th>Hospital</th><th>Category</th><th>Quota</th>
              <th>Old Occupied</th><th>New Occupied</th><th>User</th><th>IP</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((r, i) => (
              <tr key={`${r.at}-${i}`}>
                <td>{formatDateTime24(r.at)}</td>
                <td>{nameOf(r.hospitalId)}</td>
                <td>{r.category}</td>
                <td>{r.quota}</td>
                <td>{r.oldOccupied}</td>
                <td>{r.newOccupied}</td>
                <td>{r.user}</td>
                <td>{r.ip}</td>
              </tr>
            ))}
            {shown.length === 0 && <tr><td colSpan="8">No records found.</td></tr>}
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
