import { useMemo, useState } from 'react';
import { useData } from '../../context/DataContext.jsx';
import BedTable from '../../components/BedTable.jsx';
import SearchableSelect from '../../components/SearchableSelect.jsx';
import { formatDateTime, grandTotals } from '../../utils.js';

export default function BedAvailability() {
  const { hospitals, beds } = useData();
  const active = useMemo(() => hospitals.filter((h) => h.active), [hospitals]);

  const [selectedId, setSelectedId] = useState(active[0]?.id ?? '');

  const hospital = active.find((h) => h.id === Number(selectedId)) || active[0];

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

  const rows = beds[hospital.id] || [];
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

      <div className="card bar">
        <div style={{ flex: 1, minWidth: '280px', maxWidth: '520px' }}>
          <label htmlFor="hospital-search-select">
            Select Hospital Name / रुग्णालय निवडा
          </label>
          <SearchableSelect
            id="hospital-search-select"
            options={active}
            value={hospital.id}
            onChange={(newId) => setSelectedId(Number(newId))}
            placeholder="Select Hospital / रुग्णालय निवडा"
            searchPlaceholder="Search by name, area / नाव किंवा क्षेत्र शोधा..."
          />
        </div>
      </div>

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
