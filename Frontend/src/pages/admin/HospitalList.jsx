import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { post } from '../../services/apiService.js';

const PAGE_SIZE = 10;
const DEFAULT_TYPES = ['Municipal', 'Trust', 'Private'];

function normalizeHospital(h) {
  const id = Number(h.NUM_HOSPITAL_ID ?? h.id ?? 0);
  const ulbid = Number(h.NUM_HOSPITAL_ULBID ?? h.ulbid);
  const name = h.VAR_HOSPITAL_NAME ?? h.name ?? '';
  const type = h.VAR_HOSPITAL_TYPE ?? h.type ?? '';
  const address = h.VAR_HOSPITAL_ADDRESS ?? h.address ?? '';
  const area = h.VAR_HOSPITAL_AREA_WARD ?? h.area ?? '';
  const pincode = h.VAR_HOSPITAL_PINCODE ?? h.pincode ?? '';
  const phone = h.VAR_HOSPITAL_PHONE ?? h.phone ?? '';
  const email = h.VAR_HOSPITAL_EMAIL ?? h.email ?? '';
  const statusRaw = h.VAR_HOSPITAL_STATUS ?? (h.active ? 'Y' : 'N');
  const active =
    statusRaw === 'Y' ||
    statusRaw === 'Active' ||
    statusRaw === '1' ||
    statusRaw === 1 ||
    statusRaw === true;

  return {
    ...h,
    id,
    NUM_HOSPITAL_ID: id,
    ulbid,
    NUM_HOSPITAL_ULBID: ulbid,
    name,
    VAR_HOSPITAL_NAME: name,
    type,
    VAR_HOSPITAL_TYPE: type,
    address,
    VAR_HOSPITAL_ADDRESS: address,
    area,
    VAR_HOSPITAL_AREA_WARD: area,
    pincode,
    VAR_HOSPITAL_PINCODE: pincode,
    phone,
    VAR_HOSPITAL_PHONE: phone,
    email,
    VAR_HOSPITAL_EMAIL: email,
    status: statusRaw,
    VAR_HOSPITAL_STATUS: statusRaw,
    active,
    lastUpdated: h.DAT_HOSPITAL_UPDDT || h.DAT_HOSPITAL_INSDT || new Date().toISOString(),
    updatedBy: h.VAR_HOSPITAL_UPDBY || h.VAR_HOSPITAL_INSBY || 'Admin',
  };
}

export default function HospitalList() {
  const { user } = useAuth();

  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [draft, setDraft] = useState({ q: '', type: '', status: '' });
  const [filter, setFilter] = useState(draft);
  const [page, setPage] = useState(1);

  const fetchHospitals = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const targetUlbId = Number(user?.ulbId);
      const res = await post('/hospitalMst/hospitalList', { ulbid: targetUlbId });

      const rawList = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
          ? res
          : [];

      const normalized = rawList.map((item) => normalizeHospital(item, targetUlbId));
      setHospitals(normalized);
    } catch (err) {
      console.error('Error fetching hospital master list:', err);
      setError(err?.message || 'Failed to load hospital list. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user?.ulbId]);

  useEffect(() => {
    fetchHospitals();
  }, [fetchHospitals]);

  const toggleStatus = (id) => {
    setHospitals((prev) =>
      prev.map((h) => {
        if (h.id === id) {
          const newActive = !h.active;
          return {
            ...h,
            active: newActive,
            status: newActive ? 'Y' : 'N',
            VAR_HOSPITAL_STATUS: newActive ? 'Y' : 'N',
          };
        }
        return h;
      })
    );
  };

  const availableTypes = useMemo(() => {
    const types = new Set(DEFAULT_TYPES);
    hospitals.forEach((h) => {
      if (h.type) types.add(h.type);
    });
    return Array.from(types).filter(Boolean);
  }, [hospitals]);

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
        <Link className="btn" to="/hospitals/add">+ Add New Hospital</Link>
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
            {availableTypes.map((t) => <option key={t}>{t}</option>)}
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

      {loading && (
        <div className="card" style={{ textAlign: 'center', padding: '24px' }}>
          Loading hospital records...
        </div>
      )}

      {error && (
        <div className="alert err">
          {error}{' '}
          <button
            type="button"
            className="btn s"
            onClick={fetchHospitals}
            style={{ marginLeft: '12px' }}
          >
            Retry
          </button>
        </div>
      )}

      {!loading && (
        <div className="sc">
          <table className="lt">
            <thead>
              <tr>
                <th>ID</th>
                <th>Hospital Name</th>
                <th>Area</th>
                <th>Type</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((h) => (
                <tr key={h.id}>
                  <td>{h.id}</td>
                  <td>{h.name}</td>
                  <td>{h.area}</td>
                  <td>{h.type}</td>
                  <td>{h.phone}</td>
                  <td>
                    <span className={`tag ${h.active ? 'ok' : 'no'}`}>
                      {h.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <Link className="btn s" to={`/hospitals/edit?id=${h.id}`}>Edit</Link>{' '}
                    <Link className="btn s y" to={`/bed-capacity?hospital_id=${h.id}`}>Capacity</Link>{' '}
                    <button
                      type="button"
                      className={`btn s ${h.active ? 'd' : ''}`}
                      onClick={() => toggleStatus(h.id)}
                    >
                      {h.active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
              {shown.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>
                    No hospitals found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {!loading && pages > 1 && (
        <div className="pg">
          <a href="#" onClick={go(cur - 1)}>&laquo; Prev</a>
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <a key={p} href="#" className={p === cur ? 'on' : undefined} onClick={go(p)}>{p}</a>
          ))}
          <a href="#" onClick={go(cur + 1)}>Next &raquo;</a>
        </div>
      )}
    </>
  );
}
