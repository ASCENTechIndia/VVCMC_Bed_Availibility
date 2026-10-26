import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import BedTable from '../../components/BedTable.jsx';
import SearchableSelect from '../../components/SearchableSelect.jsx';
import { post } from '../../services/apiService.js';

export default function HospitalBedDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [hospitalOptions, setHospitalOptions] = useState([]);
  const [loadingDropdown, setLoadingDropdown] = useState(true);
  const [selectedHospitalId, setSelectedHospitalId] = useState(0);

  const [hospitalRows, setHospitalRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const targetUlbId = Number(user?.ulbId || user?.ulbd) || 790;

  // Fetch hospital dropdown options
  const fetchDropdownHospitals = useCallback(async () => {
    try {
      setLoadingDropdown(true);
      const res = await post('/hospitalMst/hospitalDropdownList', { ulbId: targetUlbId });
      const raw = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
          ? res
          : [];

      const formatted = [
        {
          label: 'All Hospitals / सर्व रुग्णालये',
          value: 0,
          id: 0,
          name: 'All Hospitals / सर्व रुग्णालये',
        },
        ...raw.map((item) => ({
          label: item.VAR_HOSPITAL_NAME || item.name || '',
          value: Number(item.NUM_HOSPITAL_ID ?? item.id),
          id: Number(item.NUM_HOSPITAL_ID ?? item.id),
          name: item.VAR_HOSPITAL_NAME || item.name || '',
          NUM_HOSPITAL_ID: item.NUM_HOSPITAL_ID,
          VAR_HOSPITAL_NAME: item.VAR_HOSPITAL_NAME,
        })),
      ];

      setHospitalOptions(formatted);
    } catch (err) {
      console.error('Failed to load hospital dropdown options:', err);
    } finally {
      setLoadingDropdown(false);
    }
  }, [targetUlbId]);

  useEffect(() => {
    fetchDropdownHospitals();
  }, [fetchDropdownHospitals]);

  // Fetch hospital-wise bed summary passing selected hospitalId (0 = all hospitals)
  const fetchHospitalSummary = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const res = await post('/hospitalMst/hospitalBedSummary', {
        hospitalId: Number(selectedHospitalId || 0),
        ulbId: targetUlbId,
      });

      const raw = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
          ? res
          : [];

      setHospitalRows(raw);
    } catch (err) {
      console.error('Failed to load hospital bed summary:', err);
      setError(err?.message || 'Failed to load hospital bed availability data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedHospitalId, targetUlbId]);

  useEffect(() => {
    fetchHospitalSummary();
  }, [fetchHospitalSummary]);

  // Redirect to citizen dashboard when hospital name is clicked from table
  const handleHospitalClick = (hsp) => {
    const hId = Number(hsp?.HOSPITAL_ID ?? hsp?.NUM_HOSPITAL_ID ?? hsp?.id ?? 0);
    if (hId) {
      navigate(`/citizendashboard?hospital_id=${hId}`);
    }
  };

  const toNum = (v) => (v !== undefined && v !== null && v !== '' && !isNaN(Number(v)) ? Number(v) : 0);

  // Calculate KPI totals
  const kpiTotals = useMemo(() => {
    let total = 0;
    let occupied = 0;
    let available = 0;

    hospitalRows.forEach((r) => {
      const regT = toNum(r.REGULAR_TOTAL ?? r.regular_total);
      const regO = toNum(r.REGULAR_OCCUPIED ?? r.regular_occupied);
      const regA = r.REGULAR_AVAILABLE !== undefined
        ? toNum(r.REGULAR_AVAILABLE)
        : (r.regular_available !== undefined ? toNum(r.regular_available) : regT - regO);

      const resT = toNum(r.RESERVED_TOTAL ?? r.reserved_total);
      const resO = toNum(r.RESERVED_OCCUPIED ?? r.reserved_occupied);
      const resA = r.RESERVED_AVAILABLE !== undefined
        ? toNum(r.RESERVED_AVAILABLE)
        : (r.reserved_available !== undefined ? toNum(r.reserved_available) : resT - resO);

      const conT = toNum(r.CONCESSIONAL_TOTAL ?? r.concessional_total);
      const conO = toNum(r.CONCESSIONAL_OCCUPIED ?? r.concessional_occupied);
      const conA = r.CONCESSIONAL_AVAILABLE !== undefined
        ? toNum(r.CONCESSIONAL_AVAILABLE)
        : (r.concessional_available !== undefined ? toNum(r.concessional_available) : conT - conO);

      total += regT + resT + conT;
      occupied += regO + resO + conO;
      available += regA + resA + conA;
    });

    return { total, occupied, available };
  }, [hospitalRows]);

  const selectedOption = hospitalOptions.find((opt) => Number(opt.value) === Number(selectedHospitalId));
  const isAllSelected = !selectedHospitalId || Number(selectedHospitalId) === 0;

  return (
    <main className="wrap">
      {/* View Switcher Bar */}
      <div className="view-switcher">
        <Link to="/hospitaldashboard" className="active" title="Hospital Overview Dashboard">
          🏥 रुग्णालयानुसार बेड (Hospital View)
        </Link>
        <Link to="/citizendashboard" title="Ward / Category Bed Dashboard">
          🛏️ वॉर्ड / संवर्गानुसार बेड (Ward View)
        </Link>
      </div>

      <h1>
        रुग्णालयनिहाय बेड उपलब्धता <small>Hospital-wise Bed Availability</small>
      </h1>
      <p className="lead">
        वसई विरार शहर महानगरपालिका क्षेत्रातील रुग्णालयांमधील बेडची सद्यस्थिती. Current aggregate bed status of hospitals across VVCMC area.
      </p>

      {/* Hospital Dropdown Filter card */}
      <div className="card bar">
        <div style={{ flex: 1, minWidth: '280px', maxWidth: '520px' }}>
          <label htmlFor="hospital-select-dropdown">
            Select Hospital Name / रुग्णालय निवडा
          </label>
          <SearchableSelect
            id="hospital-select-dropdown"
            options={hospitalOptions}
            value={selectedHospitalId}
            onChange={(newId) => {
              const val = newId !== '' && newId !== null && newId !== undefined ? Number(newId) : 0;
              setSelectedHospitalId(val);
            }}
            placeholder={loadingDropdown ? 'Loading hospitals...' : 'Select Hospital / रुग्णालय निवडा'}
            searchPlaceholder="Search hospital name / रुग्णालय शोधा..."
            labelKey="label"
            valueKey="value"
          />
        </div>

        <div style={{ alignSelf: 'flex-end', marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
          {!isAllSelected && (
            <button
              type="button"
              className="btn s"
              onClick={() => setSelectedHospitalId(0)}
              title="Show all hospitals"
            >
              Show All Hospitals / सर्व रुग्णालये
            </button>
          )}
          <button
            type="button"
            className="btn s y"
            onClick={fetchHospitalSummary}
            disabled={loading}
            title="Refresh bed availability"
          >
            {loading ? 'Refreshing...' : '↻ Refresh'}
          </button>
        </div>
      </div>

      {/* KPI summary counters */}
      <div className="kpi">
        <div><b>{kpiTotals.total}</b><small>Total Beds (एकूण बेड)</small></div>
        <div className="o"><b>{kpiTotals.occupied}</b><small>Occupied (भरलेले बेड)</small></div>
        <div className="a"><b>{kpiTotals.available}</b><small>Available (उपलब्ध बेड)</small></div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
        <h2>
          {isAllSelected
            ? 'All Registered Hospitals / सर्व नोंदणीकृत रुग्णालये'
            : (selectedOption?.label || hospitalRows[0]?.HOSPITAL_NAME || 'Hospital Record')}
        </h2>
        {/* <span style={{ fontSize: '13px', color: '#555' }}>
          💡 Click on any hospital name to view its detailed category breakdown on citizen dashboard
        </span> */}
      </div>

      {error && (
        <div className="alert err" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <span>{error}</span>
          <button type="button" className="btn s y" onClick={fetchHospitalSummary}>
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: '#555' }}>
          Loading hospital bed availability data...
        </div>
      ) : (
        <BedTable
          rows={hospitalRows}
          mode="view"
          showHindi
          isHospitalView
          onHospitalClick={handleHospitalClick}
        />
      )}

      <p className="legend">
        💡 रुग्णालयाचे तपशीलवार संवर्ग व वॉर्डनिहाय बेड पाहण्यासाठी रुग्णालयाच्या नावावर क्लिक करा. Click on any hospital name to view detailed category breakdown.
      </p>
    </main>
  );
}
