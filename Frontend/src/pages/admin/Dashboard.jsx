import { Link } from 'react-router-dom';
import { useData } from '../../context/DataContext.jsx';
import { formatDateTime, isToday } from '../../utils.js';

export default function Dashboard() {
  const { hospitals } = useData();
  const active = hospitals.filter((h) => h.active);
  const updated = active.filter((h) => isToday(h.lastUpdated));
  const pending = active.length - updated.length;
  const last = active.length
    ? active.map((h) => h.lastUpdated).sort().at(-1)
    : null;

  return (
    <>
      <h1>Dashboard</h1>
      <div className="kpi">
        <div><b>{active.length}</b><small>Active Hospitals</small></div>
        <div className="a"><b>{updated.length}</b><small>Updated Today</small></div>
        <div className="o"><b>{pending}</b><small>Pending Today</small></div>
        <div><b>{last ? formatDateTime(last) : '—'}</b><small>Last update</small></div>
      </div>

      {pending > 0 && (
        <div className="alert warn">
          {pending} hospital{pending > 1 ? 's have' : ' has'} not updated bed status today. Please follow up.
        </div>
      )}

      <h2>Hospital Update Status</h2>
      <div className="sc">
        <table className="lt">
          <thead>
            <tr><th>Hospital</th><th>Area</th><th>Last Updated</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {active.map((h) => {
              const ok = isToday(h.lastUpdated);
              return (
                <tr key={h.id}>
                  <td>{h.name}</td>
                  <td>{h.area}</td>
                  <td>{formatDateTime(h.lastUpdated)}</td>
                  <td><span className={`tag ${ok ? 'ok' : 'no'}`}>{ok ? 'Updated today' : 'Not updated today'}</span></td>
                  <td>
                    <Link className="btn s y" to={`/admin/bed-update?hospital_id=${h.id}`}>Update Status</Link>{' '}
                    <Link className="btn s" to={`/admin/bed-capacity?hospital_id=${h.id}`}>Capacity</Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
