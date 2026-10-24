import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import BedTable from '../../components/BedTable.jsx';
import SearchableSelect from '../../components/SearchableSelect.jsx';
import { post } from '../../services/apiService.js';
import { formatDateTime } from '../../utils.js';

export default function BedAvailability() {
  const { user } = useAuth();

  const [hospitalOptions, setHospitalOptions] = useState([]);
  const [loadingHospitals, setLoadingHospitals] = useState(true);
  const [selectedId, setSelectedId] = useState('');
  const [hospitalDetails, setHospitalDetails] = useState(null);

  const [bedList, setBedList] = useState([]);
  const [loadingBeds, setLoadingBeds] = useState(false);

  // Fetch hospital dropdown list from API
  const fetchDropdownHospitals = useCallback(async () => {
    try {
      setLoadingHospitals(true);
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

      setHospitalOptions([
        { label: 'All Hospitals / सर्व रुग्णालये', value: '', id: '', name: 'All Hospitals' },
        ...formatted,
      ]);
    } catch (err) {
      console.error('Failed to load hospital dropdown options:', err);
    } finally {
      setLoadingHospitals(false);
    }
  }, [user?.ulbId, user?.ulbd]);

  useEffect(() => {
    fetchDropdownHospitals();
  }, [fetchDropdownHospitals]);

  // Fetch bed availability list:
  // if not hospital id is passed from the dropdown then pass null
  const fetchBedAvailability = useCallback(async () => {
    try {
      setLoadingBeds(true);
      const targetUlbId = Number(user?.ulbId || user?.ulbd) || 790;
      const hospitalIdPayload =
        selectedId !== '' && selectedId !== null && selectedId !== undefined
          ? Number(selectedId)
          : null;

      const res = await post('/hospitalMst/bedAvailabilityList', {
        hospitalId: hospitalIdPayload,
        ulbId: targetUlbId,
      });

      const raw = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
          ? res
          : [];

      setBedList(raw);
    } catch (err) {
      console.error('Failed to load bed availability list:', err);
    } finally {
      setLoadingBeds(false);
    }
  }, [selectedId, user?.ulbId, user?.ulbd]);

  useEffect(() => {
    fetchBedAvailability();
  }, [fetchBedAvailability]);

  // Fetch full details of selected hospital (when a specific hospital is chosen)
  useEffect(() => {
    if (!selectedId) {
      setHospitalDetails(null);
      return;
    }
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

  // Calculate totals for KPI counters
  const totalRow = useMemo(() => bedList.find((r) => r.BED_CATEGORY === 'Total'), [bedList]);

  const kpiTotals = useMemo(() => {
    if (totalRow) {
      const total =
        (Number(totalRow.REGULAR_TOTAL) || 0) +
        (Number(totalRow.RESERVED_TOTAL) || 0) +
        (Number(totalRow.CONCESSIONAL_TOTAL) || 0);

      const occupied =
        (Number(totalRow.REGULAR_OCCUPIED) || 0) +
        (Number(totalRow.RESERVED_OCCUPIED) || 0) +
        (Number(totalRow.CONCESSIONAL_OCCUPIED) || 0);

      const available =
        Number(totalRow.REGULAR_AVAILABLE ?? ((Number(totalRow.REGULAR_TOTAL) || 0) - (Number(totalRow.REGULAR_OCCUPIED) || 0))) +
        Number(totalRow.RESERVED_AVAILABLE ?? ((Number(totalRow.RESERVED_TOTAL) || 0) - (Number(totalRow.RESERVED_OCCUPIED) || 0))) +
        Number(totalRow.CONCESSIONAL_AVAILABLE ?? ((Number(totalRow.CONCESSIONAL_TOTAL) || 0) - (Number(totalRow.CONCESSIONAL_OCCUPIED) || 0)));

      return { total, occupied, available };
    }

    const catRows = bedList.filter((r) => r.BED_CATEGORY !== 'Total');
    if (catRows.length > 0) {
      let total = 0;
      let occupied = 0;
      let available = 0;
      catRows.forEach((r) => {
        total += (Number(r.REGULAR_TOTAL) || 0) + (Number(r.RESERVED_TOTAL) || 0) + (Number(r.CONCESSIONAL_TOTAL) || 0);
        occupied += (Number(r.REGULAR_OCCUPIED) || 0) + (Number(r.RESERVED_OCCUPIED) || 0) + (Number(r.CONCESSIONAL_OCCUPIED) || 0);
        available += (Number(r.REGULAR_AVAILABLE) || 0) + (Number(r.RESERVED_AVAILABLE) || 0) + (Number(r.CONCESSIONAL_AVAILABLE) || 0);
      });
      return { total, occupied, available };
    }

    return { total: 0, occupied: 0, available: 0 };
  }, [bedList, totalRow]);

  const selectedHospital =
    hospitalOptions.find((h) => String(h.value) === String(selectedId)) || null;

  const isAllHospitals = !selectedId || selectedId === '';

  const displayName = isAllHospitals
    ? 'All Hospitals / सर्व रुग्णालये'
    : hospitalDetails?.VAR_HOSPITAL_NAME ||
      selectedHospital?.label ||
      selectedHospital?.name ||
      'Hospital';

  const displayAddress = isAllHospitals
    ? 'Vasai-Virar City Municipal Corporation Area'
    : hospitalDetails?.VAR_HOSPITAL_ADDRESS ||
      (hospitalDetails?.VAR_HOSPITAL_AREA_WARD ? `Area: ${hospitalDetails.VAR_HOSPITAL_AREA_WARD}` : '') ||
      selectedHospital?.address ||
      'VVCMC Area';

  const displayPhone = isAllHospitals
    ? 'VVCMC Helpline / हेल्पलाईन'
    : hospitalDetails?.VAR_HOSPITAL_PHONE ||
      selectedHospital?.phone ||
      '-';

  const displayUpdated = isAllHospitals
    ? new Date().toISOString()
    : hospitalDetails?.DAT_HOSPITAL_UPDDT ||
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
            options={hospitalOptions}
            value={selectedId}
            onChange={(newId) => setSelectedId(newId !== '' && newId !== null ? Number(newId) : '')}
            placeholder="Select Hospital / रुग्णालय निवडा"
            searchPlaceholder="Search by name / रुग्णालय शोधा..."
            labelKey="label"
            valueKey="value"
          />
        </div>
      </div>

      <div className="kpi">
        <div><b>{kpiTotals.total}</b><small>Total Beds</small></div>
        <div className="o"><b>{kpiTotals.occupied}</b><small>Occupied</small></div>
        <div className="a"><b>{kpiTotals.available}</b><small>Available</small></div>
      </div>

      <h2>{displayName}</h2>
      <div className="meta">
        <span>📍 {displayAddress}</span>
        <span>📞 {displayPhone}</span>
        <span>🕒 Last updated: {formatDateTime(displayUpdated)}</span>
      </div>

      <BedTable rows={bedList} mode="view" showHindi />

      <p className="legend">
        <span className="g">● Beds available</span> &nbsp; <span className="w">● Few beds left (20% or less)</span>{' '}
        &nbsp; <span className="r">● Full</span> &nbsp;|&nbsp; Available = Total − Occupied
      </p>
    </main>
  );
}
