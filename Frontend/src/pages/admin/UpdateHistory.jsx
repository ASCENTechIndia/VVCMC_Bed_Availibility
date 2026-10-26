import { useCallback, useEffect, useState } from 'react';
import { useData } from '../../context/DataContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { post } from '../../services/apiService.js';
import { formatDateTime24 } from '../../utils.js';

const PAGE_SIZE = 10;

const dayStart = (s) => new Date(`${s}T00:00:00`).getTime();
const dayEnd = (s) => new Date(`${s}T23:59:59.999`).getTime();

export default function UpdateHistory() {
  const { hospitals: contextHospitals, history } = useData();
  const { user } = useAuth();

  const [hospitals, setHospitals] = useState([]);
  const [loadingHospitals, setLoadingHospitals] = useState(false);
  const [hospError, setHospError] = useState('');

  const [draft, setDraft] = useState({ hospital: '', from: '', to: '', user: '' });
  const [filter, setFilter] = useState(draft);
  const [page, setPage] = useState(1);

  // Fetch hospital dropdown list from API
  const fetchHospitalDropdown = useCallback(async () => {
    try {
      setLoadingHospitals(true);
      setHospError('');
      const targetUlbId = Number(user?.ulbId || user?.ulbd) || 790;
      const res = await post('/hospitalMst/hospitalDropdownList', {
        ulbId: targetUlbId,
        ulbid: targetUlbId,
      });

      const raw = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
          ? res
          : [];

      const formatted = raw
        .map((item) => ({
          id: Number(item.NUM_HOSPITAL_ID ?? item.num_hospital_id ?? item.id),
          name: item.VAR_HOSPITAL_NAME || item.var_hospital_name || item.name || '',
          value: Number(item.NUM_HOSPITAL_ID ?? item.num_hospital_id ?? item.id),
          label: item.VAR_HOSPITAL_NAME || item.var_hospital_name || item.name || '',
        }))
        .filter((h) => h.id && h.name);

      setHospitals(formatted);
    } catch (err) {
      console.error('Failed to load hospital dropdown options:', err);
      setHospError(err?.message || 'Failed to load hospitals');
    } finally {
      setLoadingHospitals(false);
    }
  }, [user?.ulbId, user?.ulbd]);

  useEffect(() => {
    fetchHospitalDropdown();
  }, [fetchHospitalDropdown]);

  const displayHospitals = hospitals.length > 0 ? hospitals : (contextHospitals || []);

  const nameOf = (id) => {
    const numId = Number(id);
    const foundApi = hospitals.find((h) => Number(h.id) === numId);
    if (foundApi) return foundApi.name;
    const foundCtx = contextHospitals?.find((h) => Number(h.id) === numId);
    return foundCtx?.name ?? `#${id}`;
  };

  const users = [...new Set(history.map((r) => r.user))];

  const list = history.filter((r) => {
    const t = new Date(r.at).getTime();
    return (
      (!filter.hospital || Number(r.hospitalId) === Number(filter.hospital)) &&
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
      <div className="ph">
        <div>
          <h1>Update History / Audit Log</h1>
          <p className="sm">Track all bed status updates and changes across hospitals.</p>
        </div>
        <button
          type="button"
          className="btn s g2"
          onClick={fetchHospitalDropdown}
          disabled={loadingHospitals}
          title="Refresh hospital dropdown list"
        >
          {loadingHospitals ? 'Refreshing...' : '↻ Refresh Hospitals'}
        </button>
      </div>

      {hospError && (
        <div className="alert err" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <span>Failed to load hospital list: {hospError}</span>
          <button type="button" className="btn s y" onClick={fetchHospitalDropdown}>
            Retry
          </button>
        </div>
      )}

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
          <select
            id="h"
            name="hospital_id"
            value={draft.hospital}
            onChange={set('hospital')}
            disabled={loadingHospitals && hospitals.length === 0}
          >
            <option value="">All</option>
            {loadingHospitals && hospitals.length === 0 ? (
              <option disabled>Loading hospitals...</option>
            ) : (
              displayHospitals.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))
            )}
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

