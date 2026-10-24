import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useData } from '../../context/DataContext.jsx';
import BedTable from '../../components/BedTable.jsx';
import SearchableSelect from '../../components/SearchableSelect.jsx';
import { post } from '../../services/apiService.js';
import { formatDateTime, grandTotals } from '../../utils.js';
import { CATEGORIES, QUOTAS } from '../../data/seed.js';

const emptyBeds = () =>
  CATEGORIES.map(() => QUOTAS.map(() => ({ total: 0, occupied: 0 })));

export default function BedAvailability() {
  const { user } = useAuth();
  const { hospitals, beds } = useData();
  const activeFallback = useMemo(() => hospitals.filter((h) => h.active), [hospitals]);

  const [hospitalOptions, setHospitalOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState('');
  const [hospitalDetails, setHospitalDetails] = useState(null);

  // Fetch hospital dropdown list from API
  const fetchDropdownHospitals = useCallback(async () => {
    try {
      setLoading(true);
      const targetUlbId = Number(user?.ulbId || user?.ulbd) || 790;
      const res = await post('/hospitalMst/hospitalDropdownList', { ulbId: targetUlbId });
      const raw = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
          ? res
          : [];

      // Map to label and value:
      // keep hospital name for label and keep id for value
      const formatted = raw.map((item) => ({
        label: item.VAR_HOSPITAL_NAME || item.name || '',
        value: Number(item.NUM_HOSPITAL_ID ?? item.id),
        id: Number(item.NUM_HOSPITAL_ID ?? item.id),
        name: item.VAR_HOSPITAL_NAME || item.name || '',
        NUM_HOSPITAL_ID: item.NUM_HOSPITAL_ID,
        VAR_HOSPITAL_NAME: item.VAR_HOSPITAL_NAME,
      }));

      setHospitalOptions(formatted);

      if (formatted.length > 0) {
        setSelectedId((prev) => {
          const exists = formatted.some((opt) => opt.value === Number(prev));
          return exists ? prev : formatted[0].value;
        });
      }
    } catch (err) {
      console.error('Failed to load hospital dropdown options:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.ulbId, user?.ulbd]);

  useEffect(() => {
    fetchDropdownHospitals();
  }, [fetchDropdownHospitals]);

  // Fetch full details of selected hospital
  useEffect(() => {
    if (!selectedId) return;
    const targetUlbId = Number(user?.ulbId || user?.ulbd) || 790;

    post('/hospitalMst/hspListById', {
      ulbId: targetUlbId,
      hospitalId: Number(selectedId),
    })
      .then((res) => {
        if (res?.data) {
          setHospitalDetails(res.data);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch hospital details:', err);
      });
  }, [selectedId, user?.ulbId, user?.ulbd]);

  // Options to render in dropdown
  const options = hospitalOptions.length > 0
    ? hospitalOptions
    : activeFallback.map((h) => ({
        label: h.name,
        value: h.id,
        id: h.id,
        name: h.name,
        area: h.area,
        type: h.type,
      }));

  const selectedHospital =
    options.find((h) => Number(h.value) === Number(selectedId)) || options[0];

  if (!selectedHospital && !loading) {
    return (
      <main className="wrap">
        <h1>
          रुग्णालय बेड उपलब्धता <small>Hospital Bed Availability</small>
        </h1>
        <p className="lead">No hospitals are currently available.</p>
      </main>
    );
  }

  const rows = beds[selectedId] || (beds[1] ? beds[1] : emptyBeds());
  const totals = grandTotals(rows);

  const displayName =
    hospitalDetails?.VAR_HOSPITAL_NAME ||
    selectedHospital?.label ||
    selectedHospital?.name ||
    'Hospital';

  const displayAddress =
    hospitalDetails?.VAR_HOSPITAL_ADDRESS ||
    (hospitalDetails?.VAR_HOSPITAL_AREA_WARD ? `Area: ${hospitalDetails.VAR_HOSPITAL_AREA_WARD}` : '') ||
    selectedHospital?.address ||
    'VVCMC Area';

  const displayPhone =
    hospitalDetails?.VAR_HOSPITAL_PHONE ||
    selectedHospital?.phone ||
    '-';

  const displayUpdated =
    hospitalDetails?.DAT_HOSPITAL_UPDDT ||
    hospitalDetails?.DAT_HOSPITAL_INSDT ||
    selectedHospital?.lastUpdated ||
    new Date().toISOString();

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
            options={options}
            value={selectedId}
            onChange={(newId) => setSelectedId(Number(newId))}
            placeholder="Select Hospital / रुग्णालय निवडा"
            searchPlaceholder="Search by name / रुग्णालय शोधा..."
            labelKey="label"
            valueKey="value"
          />
        </div>
      </div>

      <div className="kpi">
        <div><b>{totals.total}</b><small>Total Beds</small></div>
        <div className="o"><b>{totals.occupied}</b><small>Occupied</small></div>
        <div className="a"><b>{totals.total - totals.occupied}</b><small>Available</small></div>
      </div>

      <h2>{displayName}</h2>
      <div className="meta">
        <span>📍 {displayAddress}</span>
        <span>📞 {displayPhone}</span>
        <span>🕒 Last updated: {formatDateTime(displayUpdated)}</span>
      </div>

      <BedTable rows={rows} mode="view" showHindi />

      <p className="legend">
        <span className="g">● Beds available</span> &nbsp; <span className="w">● Few beds left (20% or less)</span>{' '}
        &nbsp; <span className="r">● Full</span> &nbsp;|&nbsp; Available = Total − Occupied
      </p>
    </main>
  );
}
