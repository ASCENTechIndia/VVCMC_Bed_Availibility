import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { post } from '../../services/apiService.js';
import { formatDateTime, isToday } from '../../utils.js';

export default function Dashboard() {
  const { user } = useAuth();
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterQuery, setFilterQuery] = useState('');

  const targetUlbId = Number(user?.ulbId || user?.ulbd) || 790;

  // Fetch hospital update status from new dashboard API
  const fetchHospitalUpdateStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await post('/dashboard/hospitalUpdateStatus', {
        ulbId: targetUlbId,
        ulbid: targetUlbId,
      });

      const raw = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
          ? res
          : [];

      setHospitals(raw);
    } catch (err) {
      console.error('Failed to load hospital update status:', err);
      setError(err?.message || 'Failed to load hospital update status.');
    } finally {
      setLoading(false);
    }
  }, [targetUlbId]);

  useEffect(() => {
    fetchHospitalUpdateStatus();
  }, [fetchHospitalUpdateStatus]);

  // Check if updated today
  const isHospitalUpdatedToday = (h) => {
    const isFlag = String(h.IS_UPDATED_TODAY ?? h.is_updated_today ?? '').toUpperCase() === 'Y';
    const dateVal = h.DAT_BEDAVAILABILITY_UPDDT ?? h.dat_bedavailability_upddt;
    return isFlag || isToday(dateVal);
  };

  const updatedHospitals = useMemo(
    () => hospitals.filter((h) => isHospitalUpdatedToday(h)),
    [hospitals]
  );

  const pendingCount = hospitals.length - updatedHospitals.length;

  // Latest update date among all hospitals
  const lastUpdateDate = useMemo(() => {
    const dates = hospitals
      .map((h) => h.DAT_BEDAVAILABILITY_UPDDT ?? h.dat_bedavailability_upddt)
      .filter(Boolean)
      .sort();
    return dates.length > 0 ? dates[dates.length - 1] : null;
  }, [hospitals]);

  // Filter hospitals: hide hospitals whose status is not updated yet, then apply search query
  const filteredHospitals = useMemo(() => {
    return hospitals
      .filter((h) => {
        const lastDt = h.DAT_BEDAVAILABILITY_UPDDT ?? h.dat_bedavailability_upddt;
        return Boolean(lastDt);
      })
      .filter((h) => {
        if (!filterQuery.trim()) return true;
        const q = filterQuery.toLowerCase().trim();
        const name = String(h.VAR_HOSPITAL_NAME ?? h.var_hospital_name ?? '').toLowerCase();
        const addr = String(h.VAR_HOSPITAL_ADDRESS ?? h.var_hospital_address ?? '').toLowerCase();
        const area = String(h.VAR_HOSPITAL_AREA_WARD ?? h.var_hospital_area_ward ?? '').toLowerCase();
        return name.includes(q) || addr.includes(q) || area.includes(q);
      });
  }, [hospitals, filterQuery]);

  return (
    <>
      <div className="ph">
        <div>
          <h1>Dashboard</h1>
          <p className="sm">Overview of bed status updates across registered hospitals.</p>
        </div>
        <button
          type="button"
          className="btn s g2"
          onClick={fetchHospitalUpdateStatus}
          disabled={loading}
          title="Refresh hospital status"
        >
          {loading ? 'Refreshing...' : '↻ Refresh Status'}
        </button>
      </div>

      <div className="kpi">
        <div><b>{hospitals.length}</b><small>Active Hospitals</small></div>
        <div className="a"><b>{updatedHospitals.length}</b><small>Updated Today</small></div>
        <div className="o"><b>{pendingCount}</b><small>Pending Today</small></div>
        <div><b>{lastUpdateDate ? formatDateTime(lastUpdateDate) : '—'}</b><small>Last update</small></div>
      </div>

      {/* {pendingCount > 0 && !loading && (
        <div className="alert warn">
          {pendingCount} hospital{pendingCount > 1 ? 's have' : ' has'} not updated bed status today. Please follow up.
        </div>
      )} */}

      {error && (
        <div className="alert err" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{error}</span>
          <button type="button" className="btn s y" onClick={fetchHospitalUpdateStatus}>
            Retry
          </button>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
        <h2>Hospital Update Status</h2>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Filter hospitals by name or address..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            style={{ padding: '6px 10px', fontSize: '13px', width: '260px' }}
          />
          {filterQuery && (
            <button type="button" className="btn s" onClick={() => setFilterQuery('')}>
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="sc">
        <table className="lt">
          <thead>
            <tr>
              <th>Hospital</th>
              <th>Address / Area</th>
              <th>Last Updated</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#666' }}>
                  Loading hospital update status...
                </td>
              </tr>
            ) : filteredHospitals.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#666' }}>
                  No hospitals found.
                </td>
              </tr>
            ) : (
              filteredHospitals.map((h) => {
                const hId = Number(h.NUM_HOSPITAL_ID ?? h.num_hospital_id);
                const hName = h.VAR_HOSPITAL_NAME ?? h.var_hospital_name ?? '';
                const hAddr = h.VAR_HOSPITAL_ADDRESS ?? h.var_hospital_address ?? h.VAR_HOSPITAL_AREA_WARD ?? h.var_hospital_area_ward ?? '—';
                const lastDt = h.DAT_BEDAVAILABILITY_UPDDT ?? h.dat_bedavailability_upddt;
                const ok = isHospitalUpdatedToday(h);

                return (
                  <tr key={hId || hName}>
                    <td style={{ fontWeight: 600 }}>{hName}</td>
                    <td>{hAddr}</td>
                    <td>{lastDt ? formatDateTime(lastDt) : <span style={{ color: '#888' }}>Not updated yet</span>}</td>
                    <td>
                      <span className={`tag ${ok ? 'ok' : 'no'}`}>
                        {ok ? 'Updated today' : 'Not updated today'}
                      </span>
                    </td>
                    <td>
                      <Link
                        className="btn s y"
                        to={`/bed-update?hospital_id=${hId}&name=${encodeURIComponent(hName)}`}
                      >
                        Update Status
                      </Link>{' '}
                      <Link
                        className="btn s"
                        to={`/bed-capacity?hospital_id=${hId}&name=${encodeURIComponent(hName)}`}
                      >
                        Capacity
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
