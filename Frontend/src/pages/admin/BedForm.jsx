import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useData } from '../../context/DataContext.jsx';
import BedTable from '../../components/BedTable.jsx';
import Modal from '../../components/Modal.jsx';
import PageLoader from '../../components/PageLoader.jsx';
import { formatDateTime } from '../../utils.js';
import { QUOTAS } from '../../data/seed.js';
import { post } from '../../services/apiService.js';
import { getIpAddress, getSource } from '../../utils/device.js';

const emptyBeds = (count = 0) =>
  Array.from({ length: count }, () => QUOTAS.map(() => ({ total: 0, occupied: 0 })));

const clone = (rows) =>
  (rows && Array.isArray(rows) && rows.length > 0 ? rows : []).map((r) =>
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
  const [categories, setCategories] = useState([]);
  const [storedBeds, setStoredBeds] = useState(() => {
    return Array.isArray(beds[id]) ? beds[id] : [];
  });

  // Fetch hospital details, bed availability list, and bed category list from API
  const loadData = useCallback(async (showLoading = true) => {
    if (!id) return;
    if (showLoading) setLoading(true);
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

      // 3. Fetch Bed Category List from API (Master Categories)
      const catPromise = post('/hospitalMst/bedCategoryList', {
        ulbid: targetUlbId,
        ulbId: targetUlbId,
      }).catch((err) => {
        console.warn('Could not load bed category master from API:', err);
        return null;
      });

      const [hspRes, bedRes, catRes] = await Promise.all([hspPromise, bedPromise, catPromise]);

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

      // Active master categories (excluding status === 'N')
      const rawCats = Array.isArray(catRes?.data) ? catRes.data : [];
      const activeMasterCats = rawCats
        .filter((c) => {
          const status = String(c.VAR_BEDCATEGORY_STATUS ?? c.var_bedcategory_status ?? c.status ?? 'Y').toUpperCase().trim();
          return status === 'Y';
        })
        .map((c, idx) => ({
          id: Number(c.NUM_BEDCATEGORY_ID ?? c.num_bedcategory_id ?? (idx + 1)),
          name: c.VAR_BEDCATEGORY_NAME ?? c.var_bedcategory_name ?? `Category ${idx + 1}`,
          status: 'Y',
          bedAvailabilityId: 0,
          BEDAVAIL_ID: 0,
        }));

      // Process bed availability
      const rawBeds = Array.isArray(bedRes?.data)
        ? bedRes.data
        : Array.isArray(bedRes)
          ? bedRes
          : [];

      // Filter out 'Total' summary row AND any category with status 'N'
      const categoryRows = rawBeds.filter((r) => {
        const name = String(r.BED_CATEGORY || r.bed_category || '').trim().toLowerCase();
        if (name === 'total' || name === 'एकूण') return false;
        const status = String(r.VAR_BEDCATEGORY_STATUS ?? r.var_bedcategory_status ?? r.status ?? 'Y').toUpperCase().trim();
        return status !== 'N';
      });

      const finalCats = [];
      const mapped = [];

      if (activeMasterCats.length > 0) {
        // Base rows on the active categories from master API
        activeMasterCats.forEach((mCat) => {
          const matchedRow = categoryRows.find((r) => {
            const rId = Number(r.BED_CATEGORY_ID ?? r.bed_category_id);
            const rName = String(r.BED_CATEGORY ?? r.bed_category ?? '').trim().toLowerCase();
            return (rId && rId === mCat.id) || (rName && rName === mCat.name.trim().toLowerCase());
          });

          const availId = matchedRow ? Number(matchedRow.BEDAVAIL_ID || matchedRow.BED_AVAILABILITY_ID || 0) : 0;
          finalCats.push({
            ...mCat,
            bedAvailabilityId: availId,
            BEDAVAIL_ID: availId,
          });

          mapped.push([
            // Regular
            {
              total: matchedRow ? Number(matchedRow.REGULAR_TOTAL ?? matchedRow.regular_total ?? 0) : 0,
              occupied: matchedRow ? Number(matchedRow.REGULAR_OCCUPIED ?? matchedRow.regular_occupied ?? 0) : 0,
            },
            // Reserved
            {
              total: matchedRow ? Number(matchedRow.RESERVED_TOTAL ?? matchedRow.reserved_total ?? 0) : 0,
              occupied: matchedRow ? Number(matchedRow.RESERVED_OCCUPIED ?? matchedRow.reserved_occupied ?? 0) : 0,
            },
            // Concessional
            {
              total: matchedRow ? Number(matchedRow.CONCESSIONAL_TOTAL ?? matchedRow.concessional_total ?? 0) : 0,
              occupied: matchedRow ? Number(matchedRow.CONCESSIONAL_OCCUPIED ?? matchedRow.concessional_occupied ?? 0) : 0,
            },
          ]);
        });
      } else if (categoryRows.length > 0) {
        // Fallback to categoryRows if master categories were not loaded
        categoryRows.forEach((r, idx) => {
          const availId = Number(r.BEDAVAIL_ID || r.BED_AVAILABILITY_ID || 0);
          finalCats.push({
            id: Number(r.BED_CATEGORY_ID) || (idx + 1),
            name: r.BED_CATEGORY || `Category ${idx + 1}`,
            bedAvailabilityId: availId,
            BEDAVAIL_ID: availId,
          });

          mapped.push([
            {
              total: Number(r.REGULAR_TOTAL ?? r.regular_total ?? 0),
              occupied: Number(r.REGULAR_OCCUPIED ?? r.regular_occupied ?? 0),
            },
            {
              total: Number(r.RESERVED_TOTAL ?? r.reserved_total ?? 0),
              occupied: Number(r.RESERVED_OCCUPIED ?? r.reserved_occupied ?? 0),
            },
            {
              total: Number(r.CONCESSIONAL_TOTAL ?? r.concessional_total ?? 0),
              occupied: Number(r.CONCESSIONAL_OCCUPIED ?? r.concessional_occupied ?? 0),
            },
          ]);
        });
      }

      setCategories(finalCats);
      setStoredBeds(mapped);
    } catch (err) {
      console.error('Error loading bed form data:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [id, user?.ulbId, user?.ulbd, nameParam]);

  useEffect(() => {
    loadData(true);
  }, [loadData]);

  if (!id) return <Navigate to="/select-hospital" replace />;

  if (loading && !hospital) {
    return (
      <>
        <PageLoader
          loading={true}
          text="Loading hospital bed setup..."
          subtext="Fetching category and quota details..."
        />
        <div className="card" style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          Loading hospital bed setup...
        </div>
      </>
    );
  }

  return (
    <BedFormInner
      key={id}
      mode={mode}
      hospital={hospital || { id, name: nameParam || `Hospital #${id}` }}
      stored={storedBeds}
      categories={categories}
      onSave={mode === 'update' ? saveOccupied : saveCapacity}
      onRefresh={() => loadData(false)}
      user={user}
    />
  );
}

function BedFormInner({ mode, hospital, stored, categories, onSave, onRefresh, user }) {
  const navigate = useNavigate();
  const [rows, setRows] = useState(() => clone(stored));
  const [cats, setCats] = useState(categories || []);
  const [msg, setMsg] = useState(null);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState('success');
  const isUpdate = mode === 'update';

  useEffect(() => {
    setRows(clone(stored));
    setCats(categories || []);
  }, [stored, categories]);

  const onChange = (ci, qi, field, value) => {
    setRows((prev) => {
      const next = clone(prev);
      next[ci][qi][field] = value;

      const cell = next[ci]?.[qi];
      if (cell && Number(cell.total) < Number(cell.occupied)) {
        const alertText = 'Total number of beds should not be less than occupied number of beds';
        setModalMessage(alertText);
        setModalType('warning');
        setModalOpen(true);
      }

      return next;
    });
  };

  const onBlur = (ci, qi) => {
    const cell = rows[ci]?.[qi];
    if (cell && Number(cell.total) < Number(cell.occupied)) {
      const alertText = 'Total number of beds should not be less than occupied number of beds';
      setModalMessage(alertText);
      setModalType('warning');
      setModalOpen(true);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const hasInvalidBeds = rows.some((r) => r.some((c) => Number(c.total) < Number(c.occupied)));
    if (hasInvalidBeds) {
      const alertText = 'Total number of beds should not be less than occupied number of beds';
      setModalMessage(alertText);
      setModalType('warning');
      setModalOpen(true);
      return;
    }

    setSaving(true);
    setMsg(null);

    try {
      const targetUlbId = Number(user?.ulbId || user?.ulbd) || 790;
      const targetUserId = user?.userId || user?.username || 'admin';

      const [ipAddress, ipSource] = await Promise.all([
        getIpAddress(),
        Promise.resolve(getSource()),
      ]);

      // Filter only rows whose data has changed compared to stored
      const changedRows = rows
        .map((catRow, ci) => ({ catRow, ci }))
        .filter(({ catRow, ci }) => {
          const originalRow = stored?.[ci];
          if (!originalRow) return true;
          return catRow.some((c, qi) => {
            const orig = originalRow[qi] || { total: 0, occupied: 0 };
            return (
              Number(c?.total || 0) !== Number(orig?.total || 0) ||
              Number(c?.occupied || 0) !== Number(orig?.occupied || 0)
            );
          });
        });

      if (changedRows.length === 0) {
        const noChangeMsg = 'No changes to save.';
        setMsg({ type: 'ok', text: noChangeMsg });
        setModalMessage(noChangeMsg);
        setModalType('success');
        setModalOpen(true);
        return;
      }

      // Post updates to backend insertBedAvailability only for changed categories
      const requests = changedRows.map(async ({ catRow, ci }) => {
        const cat = cats[ci] || { id: ci + 1, bedAvailabilityId: 0, BEDAVAIL_ID: 0 };
        const reg = catRow[0] || { total: 0, occupied: 0 };
        const res = catRow[1] || { total: 0, occupied: 0 };
        const con = catRow[2] || { total: 0, occupied: 0 };

        const availId = Number(cat.BEDAVAIL_ID || cat.bedAvailabilityId || 0);
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
          ipAddress: ipAddress || '127.0.0.1',
          ipSource: ipSource || 'RW',
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
        const errText = `${firstErr} (${failed.length} categories failed)`;
        setMsg({
          type: 'err',
          text: errText,
        });
        setModalMessage(errText);
        setModalType('warning');
        setModalOpen(true);
      } else {
        const successMessage =
          results[0]?.resData?.data?.message || results[0]?.resData?.message || 'Data Updated Successfully';
        setMsg({
          type: 'ok',
          text: successMessage,
        });
        setModalMessage(successMessage);
        setModalType('success');
        setModalOpen(true);

        if (onRefresh) {
          onRefresh();
        }
      }

      if (onSave) {
        onSave(hospital.id, rows);
      }
    } catch (err) {
      console.error('Failed to save bed availability:', err);
      const errText = err?.message || 'Failed to save bed availability.';
      setMsg({
        type: 'err',
        text: errText,
      });
      setModalMessage(errText);
      setModalType('warning');
      setModalOpen(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageLoader
        loading={saving}
        text={isUpdate ? 'Saving bed status updates...' : 'Saving bed capacity...'}
        subtext="Please do not close or refresh this page..."
      />
      <div className="ph">
        <h1>{isUpdate ? 'Daily Bed Status Update' : 'Bed Capacity Setup'}</h1>
        <Link className="btn" to="/select-hospital">&laquo; Change hospital</Link>
      </div>
      <div className="card">
        <b>Hospital:</b> {hospital.name} &nbsp;
      </div>
      {/* <div className="alert info">
        {isUpdate ? (
          <>Enter <b>Occupied</b> beds for each category and quota. Total beds are fixed here.</>
        ) : (
          <>Enter <b>Total</b> beds for each category and quota. Use 0 where the hospital has no such beds.</>
        )}
      </div> */}
      {msg && <div className={`alert ${msg.type}`}>{msg.text}</div>}
      <form onSubmit={onSubmit} className="bed-edit-form">
        <BedTable rows={rows} mode={mode} onChange={onChange} onBlur={onBlur} categories={cats} />
        <p className="actions">
          <button className="btn y" type="submit" disabled={saving}>
            {saving ? 'Saving...' : isUpdate ? 'Save' : 'Save Capacity'}
          </button>{' '}
          <Link className="btn g2" to="/select-hospital">Cancel</Link>
        </p>
        <p className="sm">Available = Total − Occupied (calculated automatically). Occupied cannot exceed Total.</p>
      </form>

      {/* Response Modal */}
      <Modal
        isOpen={modalOpen}
        type={modalType}
        title={modalType === 'success' ? 'Success' : 'Notice'}
        message={modalMessage}
        onOk={() => {
          setModalOpen(false);
          if (modalType === 'success') {
            navigate('/select-hospital');
          }
        }}
        okText="OK"
      />
    </>
  );
}
