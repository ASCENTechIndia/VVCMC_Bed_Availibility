import { useCallback, useEffect, useState } from 'react';
import { useData } from '../../context/DataContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { post } from '../../services/apiService.js';
import { formatDateTime24 } from '../../utils.js';

const PAGE_SIZE = 10;

function safeFormatDateTime24(iso) {
  if (!iso) return '-';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso);
  return formatDateTime24(iso);
}

export default function UpdateHistory() {
  const { hospitals: contextHospitals } = useData();
  const { user } = useAuth();

  const [hospitals, setHospitals] = useState([]);
  const [loadingHospitals, setLoadingHospitals] = useState(false);
  const [hospError, setHospError] = useState('');

  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userError, setUserError] = useState('');

  const [historyList, setHistoryList] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState('');

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

  // Fetch user dropdown list from API
  const fetchUserDropdown = useCallback(async () => {
    try {
      setLoadingUsers(true);
      setUserError('');
      const targetUlbId = Number(user?.ulbId || user?.ulbd) || 790;
      const res = await post('/hospitalMst/userDropdownList', {
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
          id: String(item.NUM_USER_USERID ?? item.num_user_userid ?? item.userId ?? item.id ?? '').trim(),
          name: String(item.VAR_USER_USERNAME ?? item.var_user_username ?? item.username ?? item.name ?? '').trim(),
        }))
        .filter((u) => u.id || u.name);

      setUsers(formatted);
    } catch (err) {
      console.error('Failed to load user dropdown options:', err);
      setUserError(err?.message || 'Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  }, [user?.ulbId, user?.ulbd]);

  // Fetch bed availability history from API
  const fetchHistory = useCallback(async (filterParams) => {
    try {
      setLoadingHistory(true);
      setHistoryError('');
      const targetUlbId = Number(user?.ulbId || user?.ulbd) || 790;
      const payload = {
        hospitalId: filterParams?.hospital ? Number(filterParams.hospital) : 0,
        fromDate: filterParams?.from || null,
        toDate: filterParams?.to || null,
        userId: (filterParams?.user && filterParams.user !== 'All') ? String(filterParams.user).trim() : null,
        ulbId: targetUlbId,
      };

      const res = await post('/hospitalMst/bedAvailabilityHistory', payload);
      const raw = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
          ? res
          : [];

      setHistoryList(raw);
    } catch (err) {
      console.error('Failed to load bed availability history:', err);
      setHistoryError(err?.message || 'Failed to load update history');
    } finally {
      setLoadingHistory(false);
    }
  }, [user?.ulbId, user?.ulbd]);

  useEffect(() => {
    fetchHospitalDropdown();
    fetchUserDropdown();
    fetchHistory(filter);
  }, [fetchHospitalDropdown, fetchUserDropdown, fetchHistory]);

  const displayHospitals = hospitals.length > 0 ? hospitals : (contextHospitals || []);

  const nameOf = (id) => {
    const numId = Number(id);
    const foundApi = hospitals.find((h) => Number(h.id) === numId);
    if (foundApi) return foundApi.name;
    const foundCtx = contextHospitals?.find((h) => Number(h.id) === numId);
    return foundCtx?.name ?? `#${id}`;
  };

  const userNameOf = (uVal) => {
    if (!uVal) return '-';
    const found = users.find((u) => u.id === uVal || u.name === uVal);
    if (found && found.name && found.id && found.name !== found.id) {
      return `${found.name} (${found.id})`;
    }
    return found ? (found.name || found.id) : uVal;
  };

  const pages = Math.max(1, Math.ceil(historyList.length / PAGE_SIZE));
  const cur = Math.min(page, pages);
  const shown = historyList.slice((cur - 1) * PAGE_SIZE, cur * PAGE_SIZE);

  const set = (k) => (e) => setDraft((d) => ({ ...d, [k]: e.target.value }));
  const go = (p) => (e) => {
    e.preventDefault();
    setPage(Math.min(Math.max(1, p), pages));
  };

  const exportCsv = () => {
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const head = ['Date & Time', 'Hospital', 'Category', 'Old Occupied', 'Current Occupied', 'User'];
    const lines = historyList.map((r) => {
      const at = r.ACTIVITY_DATE ?? r.activity_date ?? r.at;
      const hosp = r.HOSPITAL ?? r.hospital ?? nameOf(r.hospitalId);
      const cat = r.CATEGORY ?? r.category ?? '';
      const oldOcc = r.OLD_OCCUPIED ?? r.old_occupied ?? r.oldOccupied ?? 0;
      const curOcc = r.CURRENT_OCCUPIED ?? r.current_occupied ?? r.newOccupied ?? 0;
      const userVal = userNameOf(r.USER_ID ?? r.user_id ?? r.user);
      return [safeFormatDateTime24(at), hosp, cat, oldOcc, curOcc, userVal]
        .map(esc)
        .join(',');
    });
    const blob = new Blob([[head.map(esc).join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bed-availability-history.csv';
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
          onClick={() => {
            fetchHospitalDropdown();
            fetchUserDropdown();
            fetchHistory(filter);
          }}
          disabled={loadingHospitals || loadingUsers || loadingHistory}
          title="Refresh history and dropdowns"
        >
          {loadingHospitals || loadingUsers || loadingHistory ? 'Refreshing...' : '↻ Refresh'}
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

      {userError && (
        <div className="alert err" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <span>Failed to load user list: {userError}</span>
          <button type="button" className="btn s y" onClick={fetchUserDropdown}>
            Retry
          </button>
        </div>
      )}

      {historyError && (
        <div className="alert err" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <span>Failed to load history records: {historyError}</span>
          <button type="button" className="btn s y" onClick={() => fetchHistory(filter)}>
            Retry
          </button>
        </div>
      )}

      <form
        className="card bar"
        onSubmit={(e) => {
          e.preventDefault();
          setFilter(draft);
          fetchHistory(draft);
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
          <select
            id="u"
            name="user_id"
            value={draft.user}
            onChange={set('user')}
            disabled={loadingUsers && users.length === 0}
          >
            <option value="">All</option>
            {loadingUsers && users.length === 0 ? (
              <option disabled>Loading users...</option>
            ) : (
              users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name ? `${u.name} (${u.id})` : u.id}
                </option>
              ))
            )}
          </select>
        </div>
        <button className="btn" type="submit" disabled={loadingHistory}>Filter</button>{' '}
        <button
          className="btn g2"
          type="button"
          onClick={() => {
            const emptyDraft = { hospital: '', from: '', to: '', user: '' };
            setDraft(emptyDraft);
            setFilter(emptyDraft);
            fetchHistory(emptyDraft);
            setPage(1);
          }}
          disabled={loadingHistory}
        >
          Reset
        </button>{' '}
        <button className="btn g2" type="button" onClick={exportCsv} disabled={historyList.length === 0}>Export CSV</button>
      </form>

      <div className="sc">
        <table className="lt">
          <thead>
            <tr>
              <th>Date &amp; Time</th>
              <th>Hospital</th>
              <th>Category</th>
              <th>Old Occupied</th>
              <th>Current Occupied</th>
              <th>User</th>
            </tr>
          </thead>
          <tbody>
            {loadingHistory ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '24px' }}>
                  Loading update history...
                </td>
              </tr>
            ) : (
              shown.map((r, i) => (
                <tr key={`${r.ACTIVITY_DATE || r.at}-${i}`}>
                  <td>{safeFormatDateTime24(r.ACTIVITY_DATE ?? r.activity_date ?? r.at)}</td>
                  <td>{r.HOSPITAL ?? r.hospital ?? nameOf(r.hospitalId)}</td>
                  <td>{r.CATEGORY ?? r.category ?? '-'}</td>
                  <td>{r.OLD_OCCUPIED ?? r.old_occupied ?? r.oldOccupied ?? 0}</td>
                  <td>{r.CURRENT_OCCUPIED ?? r.current_occupied ?? r.newOccupied ?? 0}</td>
                  <td>{userNameOf(r.USER_ID ?? r.user_id ?? r.user)}</td>
                </tr>
              ))
            )}
            {!loadingHistory && shown.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
                  No update history records found.
                </td>
              </tr>
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

