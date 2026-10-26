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
  const [selectedId, setSelectedId] = useState(1);
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

      setHospitalOptions(formatted);

      if (formatted.length > 0) {
        setSelectedId((prev) => {
          const exists = formatted.some((opt) => String(opt.value) === String(prev));
          if (exists && prev !== '') return prev;

          const hospital = formatted.find((opt) => Number(opt.value) === 1);
          return hospital ? hospital.value : formatted[0].value;
        });
      }
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

  const isAllHospitals = !selectedId || selectedId === '';

  const displayName = isAllHospitals
    ? 'All Hospitals / सर्व रुग्णालये'
    : hospitalDetails?.VAR_HOSPITAL_NAME ||
    selectedHospital?.label ||
    selectedHospital?.name ||
    bedList[0]?.HOSPITAL_NAME ||
    bedList[0]?.hospital_name ||
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
