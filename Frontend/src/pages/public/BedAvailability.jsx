import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import BedTable from '../../components/BedTable.jsx';
import SearchableSelect from '../../components/SearchableSelect.jsx';
import { post } from '../../services/apiService.js';
import { formatDateTime } from '../../utils.js';

export default function BedAvailability() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlHospitalId = searchParams.get('hospital_id');

  const [hospitalOptions, setHospitalOptions] = useState([]);
  const [loadingHospitals, setLoadingHospitals] = useState(true);
  const [selectedId, setSelectedId] = useState(() => (urlHospitalId ? Number(urlHospitalId) : ''));
  const [hospitalDetails, setHospitalDetails] = useState(null);

  const [bedList, setBedList] = useState([]);
  const [loadingBeds, setLoadingBeds] = useState(false);

  // Sync selectedId if URL parameter changes
  useEffect(() => {
    if (urlHospitalId) {
      setSelectedId(Number(urlHospitalId));
    }
  }, [urlHospitalId]);

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

      setHospitalOptions(formatted);

      if (formatted.length > 0) {
        setSelectedId((prev) => {
          if (urlHospitalId) {
            const match = formatted.find((opt) => Number(opt.value) === Number(urlHospitalId));
            if (match) return match.value;
          }
          if (prev && prev !== 0 && prev !== '') {
            const match = formatted.find((opt) => Number(opt.value) === Number(prev));
            if (match) return match.value;
          }
          return '';
        });
      }
    } catch (err) {
      console.error('Failed to load hospital dropdown options:', err);
    } finally {
      setLoadingHospitals(false);
    }
  }, [user?.ulbId, user?.ulbd, urlHospitalId]);

  useEffect(() => {
    fetchDropdownHospitals();
  }, [fetchDropdownHospitals]);

  // Fetch bed availability list:
  // if no hospital id is selected then reset to empty
  const fetchBedAvailability = useCallback(async () => {
    if (!selectedId || Number(selectedId) === 0) {
      setBedList([]);
      setLoadingBeds(false);
      return;
    }
    try {
      setLoadingBeds(true);
      const targetUlbId = Number(user?.ulbId || user?.ulbd) || 790;
      const res = await post('/hospitalMst/bedAvailabilityList', {
        hospitalId: Number(selectedId),
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
    if (!selectedId || Number(selectedId) === 0) {
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

  const toNum = (v) => (v !== undefined && v !== null && v !== '' && !isNaN(Number(v)) ? Number(v) : 0);

  // Calculate totals for KPI counters
  const totalRow = useMemo(() => {
    return bedList.find((r) => {
      const name = String(r.BED_CATEGORY ?? r.bed_category ?? '').trim().toLowerCase();
      return name === 'total' || name === 'एकूण';
    });
  }, [bedList]);

  const kpiTotals = useMemo(() => {
    if (totalRow) {
      const regT = toNum(totalRow.REGULAR_TOTAL ?? totalRow.regular_total);
      const regO = toNum(totalRow.REGULAR_OCCUPIED ?? totalRow.regular_occupied);
      const regA = totalRow.REGULAR_AVAILABLE !== undefined
        ? toNum(totalRow.REGULAR_AVAILABLE)
        : (totalRow.regular_available !== undefined ? toNum(totalRow.regular_available) : regT - regO);

      const resT = toNum(totalRow.RESERVED_TOTAL ?? totalRow.reserved_total);
      const resO = toNum(totalRow.RESERVED_OCCUPIED ?? totalRow.reserved_occupied);
      const resA = totalRow.RESERVED_AVAILABLE !== undefined
        ? toNum(totalRow.RESERVED_AVAILABLE)
        : (totalRow.reserved_available !== undefined ? toNum(totalRow.reserved_available) : resT - resO);

      const conT = toNum(totalRow.CONCESSIONAL_TOTAL ?? totalRow.concessional_total);
      const conO = toNum(totalRow.CONCESSIONAL_OCCUPIED ?? totalRow.concessional_occupied);
      const conA = totalRow.CONCESSIONAL_AVAILABLE !== undefined
        ? toNum(totalRow.CONCESSIONAL_AVAILABLE)
        : (totalRow.concessional_available !== undefined ? toNum(totalRow.concessional_available) : conT - conO);

      return {
        total: regT + resT + conT,
        occupied: regO + resO + conO,
        available: regA + resA + conA,
      };
    }

    const catRows = bedList.filter((r) => {
      const name = String(r.BED_CATEGORY ?? r.bed_category ?? '').trim().toLowerCase();
      return name !== 'total' && name !== 'एकूण';
    });

    if (catRows.length > 0) {
      let total = 0;
      let occupied = 0;
      let available = 0;
      catRows.forEach((r) => {
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
    }

    return { total: 0, occupied: 0, available: 0 };
  }, [bedList, totalRow]);

  const selectedHospital =
    hospitalOptions.find((h) => String(h.value) === String(selectedId)) || null;

  const isAllHospitals = !selectedId || selectedId === '' || Number(selectedId) === 0;

  const displayName = isAllHospitals
    ? 'Select a Hospital / रुग्णालय निवडा'
    : hospitalDetails?.VAR_HOSPITAL_NAME ||
    selectedHospital?.label ||
    selectedHospital?.name ||
    bedList[0]?.HOSPITAL_NAME ||
    bedList[0]?.hospital_name ||
    'Hospital';

  const displayAddress = isAllHospitals
    ? ''
    : hospitalDetails?.VAR_HOSPITAL_ADDRESS ||
    (hospitalDetails?.VAR_HOSPITAL_AREA_WARD ? `Area: ${hospitalDetails.VAR_HOSPITAL_AREA_WARD}` : '') ||
    selectedHospital?.address ||
    'VVCMC Area';

  const displayPhone = isAllHospitals
    ? ''
    : hospitalDetails?.VAR_HOSPITAL_PHONE ||
    selectedHospital?.phone ||
    '-';

  const displayUpdated = isAllHospitals
    ? null
    : hospitalDetails?.DAT_HOSPITAL_UPDDT ||
    hospitalDetails?.DAT_HOSPITAL_INSDT ||
    selectedHospital?.lastUpdated ||
    new Date().toISOString();

  return (
    <main className="wrap">
      {/* View Switcher Bar */}
      <div className="view-switcher">
        <Link to="/hospitaldashboard" title="Hospital Overview Dashboard">
          🏥 रुग्णालयानुसार बेड (Hospital View)
        </Link>
        <Link to="/citizendashboard" className="active" title="Ward / Category Bed Dashboard">
          🛏️ वॉर्ड / संवर्गानुसार बेड (Ward View)
        </Link>
      </div>

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
            onChange={(newId) => {
              const val = newId !== '' && newId !== null ? Number(newId) : '';
              setSelectedId(val);
              if (val) {
                setSearchParams({ hospital_id: String(val) }, { replace: true });
              } else {
                setSearchParams({}, { replace: true });
              }
            }}
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
      {!isAllHospitals && (
        <div className="meta">
          {displayAddress && <span>📍 {displayAddress}</span>}
          {displayPhone && <span>📞 {displayPhone}</span>}
        </div>
      )}

      <BedTable rows={bedList} mode="view" showHindi />

      <p className="legend">
        <span className="g">● Beds available</span> &nbsp; <span className="w">● Few beds left (20% or less)</span>{' '}
        &nbsp; <span className="r">● Full</span> &nbsp;|&nbsp; Available = Total − Occupied
      </p>
    </main>
  );
}
