import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useData } from '../../context/DataContext.jsx';
import BedTable from '../../components/BedTable.jsx';
import { formatDateTime } from '../../utils.js';
import { CATEGORIES, QUOTAS } from '../../data/seed.js';
import { post } from '../../services/apiService.js';

const emptyBeds = () =>
  CATEGORIES.map(() => QUOTAS.map(() => ({ total: 0, occupied: 0 })));

const clone = (rows) =>
  (rows && Array.isArray(rows) && rows.length > 0 ? rows : emptyBeds()).map((r) =>
    (Array.isArray(r) ? r : []).map((c) => ({
      total: Number(c?.total || 0),
      occupied: Number(c?.occupied || 0),
    }))
  );

/**
 * mode="update"   -> Daily Bed Status Update (edit Occupied)
 * mode="capacity" -> Bed Capacity Setup      (edit Total)
 */
export default function BedForm({ mode }) {
  const [params] = useSearchParams();
  const id = Number(params.get('hospital_id'));
  const nameParam = params.get('name') || '';
  const { user } = useAuth();
  const dataContext = useData() || {};
  const { hospitals = [], beds = {}, saveOccupied, saveCapacity } = dataContext;

  const [hospital, setHospital] = useState(() => {
    const found = hospitals.find((h) => Number(h.id) === id);
    if (found) return found;
    return id
      ? {
        id,
        name: nameParam || `Hospital #${id}`,
        lastUpdated: new Date().toISOString(),
        updatedBy: 'Admin',
      }
      : null;
  });

  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState(() =>
    CATEGORIES.map((cat) => ({ ...cat, bedAvailabilityId: 0 }))
  );
  const [storedBeds, setStoredBeds] = useState(() => {
    return beds[id] || emptyBeds();
  });

  // Fetch hospital details and bed availability list from API
  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const targetUlbId = Number(user?.ulbId || user?.ulbd) || 790;

    try {
      // 1. Fetch Hospital Info if needed
      const hspPromise = post('/hospitalMst/hspListById', {
        hospitalId: id,
        ulbId: targetUlbId,
      }).catch((err) => {
        console.warn('Could not load hospital details from API:', err);
        return null;
      });

      // 2. Fetch Bed Availability List
      const bedPromise = post('/hospitalMst/bedAvailabilityList', {
        hospitalId: id,
        ulbId: targetUlbId,
      }).catch((err) => {
        console.warn('Could not load bed availability from API:', err);
        return null;
      });

      const [hspRes, bedRes] = await Promise.all([hspPromise, bedPromise]);

      // Process hospital details
      if (hspRes?.data) {
        const hData = hspRes.data;
        setHospital({
          id,
          name: hData.VAR_HOSPITAL_NAME || nameParam || `Hospital #${id}`,
          address: hData.VAR_HOSPITAL_ADDRESS || '',
          area: hData.VAR_HOSPITAL_AREA_WARD || '',
          lastUpdated: hData.DAT_HOSPITAL_UPDDT || hData.DAT_HOSPITAL_INSDT || new Date().toISOString(),
          updatedBy: hData.VAR_HOSPITAL_UPDBY || hData.VAR_HOSPITAL_INSBY || 'Admin',
        });
      }

      // Process bed availability
      const rawBeds = Array.isArray(bedRes?.data)
        ? bedRes.data
        : Array.isArray(bedRes)
          ? bedRes
          : [];

      // Filter out 'Total' summary row
      const categoryRows = rawBeds.filter((r) => {
        const name = String(r.BED_CATEGORY || r.bed_category || '').trim().toLowerCase();
        return name !== 'total' && name !== 'एकूण';
      });

      if (categoryRows.length > 0) {
        const parsedCats = categoryRows.map((r, idx) => ({
          id: Number(r.NUM_BEDCATEGORY_ID) || (idx + 1),
          name: r.BED_CATEGORY || `Category ${idx + 1}`,
          bedAvailabilityId: Number(r.NUM_BEDAVAILABILITY_ID || 0),
        }));

        const mapped = categoryRows.map((row) => [
          // Regular
          {
            total: Number(row.REGULAR_TOTAL ?? row.regular_total ?? 0),
            occupied: Number(row.REGULAR_OCCUPIED ?? row.regular_occupied ?? 0),
          },
          // Reserved
          {
            total: Number(row.RESERVED_TOTAL ?? row.reserved_total ?? 0),
            occupied: Number(row.RESERVED_OCCUPIED ?? row.reserved_occupied ?? 0),
          },
          // Concessional
          {
            total: Number(row.CONCESSIONAL_TOTAL ?? row.concessional_total ?? 0),
            occupied: Number(row.CONCESSIONAL_OCCUPIED ?? row.concessional_occupied ?? 0),
          },
        ]);

        setCategories(parsedCats);
        setStoredBeds(mapped);
      } else {
        // Hospital has 0 count / no bed rows yet: initialize with 0s and base categories
        const parsedCats = CATEGORIES.map((cat) => ({
          ...cat,
          bedAvailabilityId: 0,
        }));
        setCategories(parsedCats);
        setStoredBeds(emptyBeds());
      }
    } catch (err) {
      console.error('Error loading bed form data:', err);
    } finally {
      setLoading(false);
    }
  }, [id, user?.ulbId, user?.ulbd, nameParam]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!id) return <Navigate to="/select-hospital" replace />;

  if (loading && !hospital) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
        Loading hospital bed setup...
      </div>
    );
  }

  return (
    <BedFormInner
      key={`${id}-${loading}`}
      mode={mode}
      hospital={hospital || { id, name: nameParam || `Hospital #${id}` }}
      stored={storedBeds}
      categories={categories}
      onSave={mode === 'update' ? saveOccupied : saveCapacity}
      onRefresh={loadData}
      user={user}
    />
  );
}

function BedFormInner({ mode, hospital, stored, categories, onSave, onRefresh, user }) {
  const [rows, setRows] = useState(() => clone(stored));
  const [cats, setCats] = useState(categories || []);
  const [msg, setMsg] = useState(null);
  const [saving, setSaving] = useState(false);
  const isUpdate = mode === 'update';

  useEffect(() => {
    setRows(clone(stored));
    setCats(categories || []);
  }, [stored, categories]);

  const onChange = (ci, qi, field, value) => {
    setMsg(null);
    setRows((prev) => {
      const next = clone(prev);
      next[ci][qi][field] = value;
      if (isUpdate) {
        next[ci][qi].occupied = Math.min(next[ci][qi].occupied, next[ci][qi].total);
      }
      return next;
    });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const bad = rows.some((r) => r.some((c) => c.occupied > c.total));
    if (bad) {
      setMsg({ type: 'err', text: 'Occupied cannot exceed Total for any category / quota. Please correct and retry.' });
      return;
    }

    setSaving(true);
    setMsg(null);

    try {
      const targetUlbId = Number(user?.ulbId || user?.ulbd) || 790;
      const targetUserId = user?.userId || user?.username || 'admin';

      // Post updates to backend insertBedAvailability for each category
      const requests = rows.map(async (catRow, ci) => {
        const cat = cats[ci] || CATEGORIES[ci] || { id: ci + 1, bedAvailabilityId: 0 };
        const reg = catRow[0] || { total: 0, occupied: 0 };
        const res = catRow[1] || { total: 0, occupied: 0 };
        const con = catRow[2] || { total: 0, occupied: 0 };

        const availId = Number(cat.bedAvailabilityId || 0);
        const modeVal = availId > 0 ? 2 : 1;

        const payload = {
          userId: targetUserId,
          bedAvailabilityId: availId,
          ulbId: targetUlbId,
          hospitalId: Number(hospital.id),
          bedCategoryId: Number(cat.id),
          regularTotal: Number(reg.total || 0),
          regularOccupied: Number(reg.occupied || 0),
          reservedTotal: Number(res.total || 0),
          reservedOccupied: Number(res.occupied || 0),
          concessionalTotal: Number(con.total || 0),
          concessionalOccupied: Number(con.occupied || 0),
          status: 'Y',
          mode: modeVal,
          ipAddress: '127.0.0.1',
          ipSource: 'RW',
        };

        const resData = await post('/hospitalMst/insertBedAvailability', payload);
        return { cat, payload, resData };
      });

      const results = await Promise.all(requests);

      const failed = results.filter(
        (r) => r?.resData?.data?.errorCode && r.resData.data.errorCode !== 9999
      );

      if (failed.length > 0) {
        const firstErr = failed[0]?.resData?.data?.message || 'Failed to update some bed categories.';
        setMsg({
          type: 'err',
          text: `${firstErr} (${failed.length} categories failed)`,
        });
      } else {
        const successMessage =
          results[0]?.resData?.data?.message || 'Data Updated Successfully';
        setMsg({
          type: 'ok',
          text: successMessage,
        });

        if (onRefresh) {
          onRefresh();
        }
      }

      if (onSave) {
        onSave(hospital.id, rows);
      }
    } catch (err) {
      console.error('Failed to save bed availability:', err);
      setMsg({
        type: 'err',
        text: err?.message || 'Failed to save bed availability.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="ph">
        <h1>{isUpdate ? 'Daily Bed Status Update' : 'Bed Capacity Setup'}</h1>
        <Link className="btn" to="/select-hospital">&laquo; Change hospital</Link>
      </div>
      <div className="card">
        <b>Hospital:</b> {hospital.name} &nbsp;|&nbsp; <b>Last updated:</b> {formatDateTime(hospital.lastUpdated)} by{' '}
        {hospital.updatedBy || 'Admin'}
      </div>
      <div className="alert info">
        {isUpdate ? (
          <>Enter <b>Occupied</b> beds for each category and quota. Total beds are fixed here.</>
        ) : (
          <>Enter <b>Total</b> beds for each category and quota. Use 0 where the hospital has no such beds.</>
        )}
      </div>
      {msg && <div className={`alert ${msg.type}`}>{msg.text}</div>}
      <form onSubmit={onSubmit}>
        <BedTable rows={rows} mode={mode} onChange={onChange} categories={cats} />
        <p className="actions">
          <button className="btn y" type="submit" disabled={saving}>
            {saving ? 'Saving...' : isUpdate ? 'Save / Submit' : 'Save Capacity'}
          </button>{' '}
          <Link className="btn g2" to="/select-hospital">Cancel</Link>
        </p>
        <p className="sm">Available = Total − Occupied (calculated automatically). Occupied cannot exceed Total.</p>
      </form>
    </>
  );
}
