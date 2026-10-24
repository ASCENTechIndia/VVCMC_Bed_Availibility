import { useMemo, useState } from 'react';
import { useData } from '../../context/DataContext.jsx';
import BedTable from '../../components/BedTable.jsx';
import { formatDateTime, grandTotals } from '../../utils.js';

export default function BedAvailability() {
  const { hospitals, beds } = useData();
  const active = useMemo(() => hospitals.filter((h) => h.active), [hospitals]);

  const [selectedId, setSelectedId] = useState(active[0]?.id ?? '');
  const [q, setQ] = useState('');
  const [notFound, setNotFound] = useState(false);

  const hospital = active.find((h) => h.id === Number(selectedId)) || active[0];

  const onSearch = (e) => {
    e.preventDefault();
    const term = q.trim().toLowerCase();
    if (!term) {
      setNotFound(false);
      return;
    }
    const hit = active.find(
      (h) => h.name.toLowerCase().includes(term) || h.area.toLowerCase().includes(term)
    );
    if (hit) {
      setSelectedId(hit.id);
      setNotFound(false);
    } else {
      setNotFound(true);
    }
  };

  if (!hospital) {
    return (
      <main className="wrap">
        <h1>
          रुग्णालय बेड उपलब्धता <small>Hospital Bed Availability</small>
        </h1>
        <p className="lead">No hospitals are currently available.</p>
      </main>
    );
  }

  const rows = beds[hospital.id];
  const totals = grandTotals(rows);

  return (
    <main className="wrap">
      <h1>
        रुग्णालय बेड उपलब्धता <small>Hospital Bed Availability</small>
      </h1>
      <p className="lead">
        वसई विरार शहर महानगरपालिका क्षेत्रातील रुग्णालयांमधील बेडची सद्यस्थिती. Current bed status of hospitals in the
        VVCMC area.
      </p>

      <form className="card bar" onSubmit={onSearch}>
        <div>
          <label htmlFor="hospital">Select Hospital Name / रुग्णालय निवडा</label>
          <select
            id="hospital"
            name="hospital_id"
            value={hospital.id}
            onChange={(e) => {
              setSelectedId(Number(e.target.value));
              setNotFound(false);
            }}
          >
            {active.map((h) => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="q">Search / शोधा</label>
          <input
            type="text"
            id="q"
            name="q"
            placeholder="Hospital or area"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <button className="btn" type="submit">Search</button>
      </form>
      {notFound && <p className="note">No hospital found for “{q}”.</p>}

      <div className="kpi">
        <div><b>{totals.total}</b><small>Total Beds</small></div>
        <div className="o"><b>{totals.occupied}</b><small>Occupied</small></div>
        <div className="a"><b>{totals.total - totals.occupied}</b><small>Available</small></div>
      </div>

      <h2>{hospital.name}</h2>
      <div className="meta">
        <span>📍 {hospital.address}</span>
        <span>📞 {hospital.phone}</span>
        <span>🕒 Last updated: {formatDateTime(hospital.lastUpdated)}</span>
      </div>

      <BedTable rows={rows} mode="view" showHindi />

      <p className="legend">
        <span className="g">● Beds available</span> &nbsp; <span className="w">● Few beds left (20% or less)</span>{' '}
        &nbsp; <span className="r">● Full</span> &nbsp;|&nbsp; Available = Total − Occupied
      </p>
    </main>
  );
}
