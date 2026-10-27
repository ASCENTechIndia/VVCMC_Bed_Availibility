import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { post } from '../../services/apiService.js';
import SearchableSelect from '../../components/SearchableSelect.jsx';
import BedTable from '../../components/BedTable.jsx';
import PageLoader from '../../components/PageLoader.jsx';

export default function SelectHospital() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [id, setId] = useState('');
  const [validationError, setValidationError] = useState('');

  // Bed availability table state
  const [bedList, setBedList] = useState([]);
  const [loadingBeds, setLoadingBeds] = useState(false);
  const [bedError, setBedError] = useState('');
  const [categories, setCategories] = useState([]);

  // Fetch bed category master list from API
  const fetchBedCategories = useCallback(async () => {
    try {
      const targetUlbId = Number(user?.ulbId || user?.ulbd) || 790;
      const res = await post('/hospitalMst/bedCategoryList', {
        ulbid: targetUlbId,
        ulbId: targetUlbId,
      });

      const raw = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      const formatted = raw
        .filter((item) => {
          const status = String(item.VAR_BEDCATEGORY_STATUS ?? item.var_bedcategory_status ?? item.status ?? 'Y').toUpperCase().trim();
          return status === 'Y';
        })
        .map((item) => ({
          id: Number(item.NUM_BEDCATEGORY_ID ?? item.num_bedcategory_id ?? item.id),
          name: item.VAR_BEDCATEGORY_NAME ?? item.var_bedcategory_name ?? item.name ?? '',
          status: 'Y',
          BED_CATEGORY: item.VAR_BEDCATEGORY_NAME ?? item.var_bedcategory_name ?? item.name ?? '',
        }))
        .filter((c) => c.id && c.name);

      setCategories(formatted);
    } catch (err) {
      console.warn('Failed to load bed category master from API:', err);
    }
  }, [user?.ulbId, user?.ulbd]);

  useEffect(() => {
    fetchBedCategories();
  }, [fetchBedCategories]);

  // Fetch hospital dropdown list from API
  const fetchHospitalDropdown = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      setValidationError('');

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

      // Map to label and value matching the citizen page format
      const formatted = raw
        .map((item) => ({
          label: item.VAR_HOSPITAL_NAME || item.name || '',
          value: Number(item.NUM_HOSPITAL_ID ?? item.id),
          id: Number(item.NUM_HOSPITAL_ID ?? item.id),
          name: item.VAR_HOSPITAL_NAME || item.name || '',
          NUM_HOSPITAL_ID: item.NUM_HOSPITAL_ID,
          VAR_HOSPITAL_NAME: item.VAR_HOSPITAL_NAME,
        }))
        .filter((h) => h.id && h.name);

      setHospitals(formatted);
    } catch (err) {
      console.error('Failed to load hospital dropdown options:', err);
      setError(err?.message || 'Failed to load hospital list. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user?.ulbId, user?.ulbd]);

  useEffect(() => {
    fetchHospitalDropdown();
  }, [fetchHospitalDropdown]);

  // Fetch bed availability list when a hospital is clicked/selected
  const fetchBedAvailability = useCallback(async (hospitalId) => {
    if (!hospitalId) {
      setBedList([]);
      setBedError('');
      return;
    }
    try {
      setLoadingBeds(true);
      setBedError('');
      const targetUlbId = Number(user?.ulbId || user?.ulbd) || 790;
      const res = await post('/hospitalMst/bedAvailabilityList', {
        hospitalId: Number(hospitalId),
        ulbId: targetUlbId,
      });

      const raw = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
          ? res
          : [];

      // Filter out any row where category status is 'N'
      const activeRows = raw.filter((r) => {
        const status = String(r.VAR_BEDCATEGORY_STATUS ?? r.var_bedcategory_status ?? r.status ?? 'Y').toUpperCase().trim();
        return status !== 'N';
      });

      setBedList(activeRows);
    } catch (err) {
      console.error('Failed to load bed availability list:', err);
      setBedError(err?.message || 'Failed to load bed availability details.');
    } finally {
      setLoadingBeds(false);
    }
  }, [user?.ulbId, user?.ulbd]);

  useEffect(() => {
    if (id) {
      fetchBedAvailability(id);
    } else {
      setBedList([]);
    }
  }, [id, fetchBedAvailability]);

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

  const selectedHospital = hospitals.find((h) => String(h.id) === String(id)) || null;

  const go = (path) => (e) => {
    e.preventDefault();
    if (!id) {
      setValidationError('Please select a hospital to proceed / कृपया रुग्णालय निवडा.');
      return;
    }
    setValidationError('');

    if (loadingBeds) {
      return;
    }

    // If attempting to update daily bed status and no bed capacity exists / 0 rows returned
    if (path === '/bed-update') {
      const hasNoBedCapacity =
        !bedList ||
        bedList.length === 0 ||
        kpiTotals.total === 0 ||
        !bedList.some((r) => {
          const regT = Number(r.REGULAR_TOTAL ?? r.regular_total ?? 0);
          const resT = Number(r.RESERVED_TOTAL ?? r.reserved_total ?? 0);
          const conT = Number(r.CONCESSIONAL_TOTAL ?? r.concessional_total ?? 0);
          return regT + resT + conT > 0;
        });

      if (hasNoBedCapacity) {
        alert('Please add bed capacity first');
        setValidationError('Please add bed capacity first / कृपया प्रथम खाटांची क्षमता जोडा.');
        return;
      }
    }

    const hName = selectedHospital?.name || '';
    navigate(`${path}?hospital_id=${id}${hName ? `&name=${encodeURIComponent(hName)}` : ''}`);
  };


  return (
    <>
      <PageLoader
        loading={loadingBeds || loading}
        text={loadingBeds ? 'Loading bed availability details...' : 'Loading hospital list...'}
        subtext="Please wait a moment..."
      />
      <div className="ph">
        <div>
          <h1>Update Bed Status</h1>
          <p className="sm">Select a hospital, then choose what to update.</p>
        </div>
        <button
          type="button"
          className="btn s g2"
          onClick={() => {
            fetchHospitalDropdown();
            if (id) fetchBedAvailability(id);
          }}
          disabled={loading || loadingBeds}
          title="Refresh hospital dropdown list"
        >
          {loading || loadingBeds ? 'Refreshing...' : '↻ Refresh List'}
        </button>
      </div>

      {error && (
        <div className="alert err" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{error}</span>
          <button type="button" className="btn s y" onClick={fetchHospitalDropdown}>
            Retry
          </button>
        </div>
      )}

      <form className="card" onSubmit={go('/bed-update')}>
        <div className="form one">
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label htmlFor="hospital-search-select" style={{ margin: 0 }}>
                Select Hospital Name / रुग्णालय निवडा *
              </label>
              {!loading && hospitals.length > 0 && (
                <span className="sm" style={{ margin: 0, fontSize: '12px' }}>
                  {hospitals.length} hospital{hospitals.length !== 1 ? 's' : ''} available
                </span>
              )}
            </div>

            {/* Searchable dropdown matching citizen page */}
            <input type="hidden" name="hospital_id" value={id} />
            <SearchableSelect
              id="hospital-search-select"
              options={hospitals}
              value={id}
              onChange={(newId) => {
                const nextId = newId !== '' && newId !== null && newId !== undefined ? Number(newId) : '';
                setId(nextId);
                if (nextId) setValidationError('');
              }}
              placeholder={loading ? 'Loading hospitals... / लोड होत आहे...' : 'Select Hospital / रुग्णालय निवडा'}
              searchPlaceholder="Search by name / रुग्णालय शोधा..."
              labelKey="label"
              valueKey="value"
              disabled={loading}
              className={validationError ? 'has-err' : ''}
            />
            {validationError && <span className="field-err">{validationError}</span>}
          </div>
        </div>

        <p className="actions">
          <button
            className="btn y"
            type="submit"
            disabled={loading || loadingBeds || hospitals.length === 0}
          >
            {loadingBeds ? 'Loading Beds...' : 'Update Daily Bed Status'}
          </button>{' '}
          <button
            className="btn"
            type="button"
            onClick={go('/bed-capacity')}
            disabled={loading || hospitals.length === 0}
          >
            Set Bed Capacity (Total Beds)
          </button>
        </p>
      </form>

      {/* Bed Details Section shown after selecting/clicking hospital name */}

      <div style={{ marginTop: '20px' }}>
        <div className="ph">
          <h2>{selectedHospital?.name || 'Hospital Bed Details'}</h2>
          {loadingBeds && <span className="sm">Loading bed details...</span>}
        </div>

        <div className="kpi">
          <div><b>{kpiTotals.total}</b><small>Total Beds</small></div>
          <div className="o"><b>{kpiTotals.occupied}</b><small>Occupied</small></div>
          <div className="a"><b>{kpiTotals.available}</b><small>Available</small></div>
        </div>

        {bedError && (
          <div className="alert err" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{bedError}</span>
            <button type="button" className="btn s y" onClick={() => fetchBedAvailability(id)}>
              Retry
            </button>
          </div>
        )}

        {loadingBeds ? (
          <div className="card" style={{ textAlign: 'center', padding: '30px', color: '#666' }}>
            Loading bed availability details...
          </div>
        ) : (
          <>
            <BedTable rows={bedList} mode="view" showHindi categories={categories} />
            <p className="legend">
              <span className="g">● Beds available</span> &nbsp; <span className="w">● Few beds left (20% or less)</span>{' '}
              &nbsp; <span className="r">● Full</span> &nbsp;|&nbsp; Available = Total − Occupied
            </p>
          </>
        )}
      </div>
    </>
  );
}
