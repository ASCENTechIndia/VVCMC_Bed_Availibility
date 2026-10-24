import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { post } from '../../services/apiService.js';

const DEFAULT_TYPES = ['Municipal', 'Trust', 'Private'];

const EMPTY = {
  name: '',
  type: '',
  address: '',
  area: '',
  pincode: '',
  phone: '',
  email: '',
  active: true,
};

function mapHospitalData(data) {
  if (!data) return EMPTY;
  const statusRaw = data.VAR_HOSPITAL_STATUS ?? (data.active ? 'Y' : 'N');
  return {
    id: Number(data.NUM_HOSPITAL_ID ?? data.id ?? 0),
    name: data.VAR_HOSPITAL_NAME ?? data.name ?? '',
    type: data.VAR_HOSPITAL_TYPE ?? data.type ?? '',
    address: data.VAR_HOSPITAL_ADDRESS ?? data.address ?? '',
    area: data.VAR_HOSPITAL_AREA_WARD ?? data.area ?? '',
    pincode: data.VAR_HOSPITAL_PINCODE ?? data.pincode ?? '',
    phone: data.VAR_HOSPITAL_PHONE ?? data.phone ?? '',
    email: data.VAR_HOSPITAL_EMAIL ?? data.email ?? '',
    active:
      statusRaw === 'Y' ||
      statusRaw === 'Active' ||
      statusRaw === '1' ||
      statusRaw === 1 ||
      statusRaw === true,
  };
}

export default function HospitalForm({ mode }) {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isEdit = mode === 'edit';
  const hospitalIdParam = params.get('id') || params.get('hospitalId') || params.get('hospital_id');
  const hospitalId = Number(hospitalIdParam);

  const [form, setForm] = useState(EMPTY);
  const [initialData, setInitialData] = useState(EMPTY);
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const fetchHospitalDetails = useCallback(async () => {
    if (!isEdit || !hospitalId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const targetUlbId = Number(user?.ulbId || user?.ulbd) || 790;
      const res = await post('/hospitalMst/hspListById', {
        ulbId: targetUlbId,
        hospitalId: hospitalId,
      });

      const data = res?.data || res;
      if (!data) {
        throw new Error('Hospital details not found.');
      }

      const mapped = mapHospitalData(data);
      setForm(mapped);
      setInitialData(mapped);
    } catch (err) {
      console.error('Error fetching hospital details by id:', err);
      setError(err?.message || 'Failed to load hospital details. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [isEdit, hospitalId, user?.ulbId, user?.ulbd]);

  useEffect(() => {
    fetchHospitalDetails();
  }, [fetchHospitalDetails]);

  const set = (k) => (e) => {
    setSaved(false);
    setForm((f) => ({ ...f, [k]: e.target.value }));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    setSaved(true);
    if (!isEdit) {
      navigate('/hospitals');
    }
  };

  if (isEdit && !hospitalIdParam) {
    return (
      <div className="card">
        <div className="alert err">Invalid hospital ID.</div>
        <Link className="btn" to="/hospitals">&laquo; Back to list</Link>
      </div>
    );
  }

  return (
    <>
      <div className="ph">
        <h1>{isEdit ? 'Update Hospital' : 'Add New Hospital'}</h1>
        <Link className="btn" to="/hospitals">&laquo; Back to list</Link>
      </div>

      {saved && <div className="alert ok">Hospital updated successfully.</div>}

      {loading && (
        <div className="card" style={{ textAlign: 'center', padding: '24px' }}>
          Loading hospital details...
        </div>
      )}

      {error && (
        <div className="alert err">
          {error}{' '}
          <button
            type="button"
            className="btn s"
            onClick={fetchHospitalDetails}
            style={{ marginLeft: '12px' }}
          >
            Retry
          </button>
        </div>
      )}

      {!loading && (
        <form
          className="card"
          onSubmit={onSubmit}
          onReset={(e) => {
            e.preventDefault();
            setSaved(false);
            setForm(initialData);
          }}
        >
          <div className="form">
            <div>
              <label htmlFor="n">Hospital Name *</label>
              <input
                type="text"
                id="n"
                name="name"
                value={form.name}
                onChange={set('name')}
                required
                maxLength="200"
              />
            </div>
            <div>
              <label htmlFor="ty">Hospital Type *</label>
              <select
                id="ty"
                name="hospital_type"
                value={form.type}
                onChange={set('type')}
                required
              >
                <option value="">-- Select --</option>
                {DEFAULT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="w2">
              <label htmlFor="ad">Address *</label>
              <input
                type="text"
                id="ad"
                name="address"
                value={form.address}
                onChange={set('address')}
                required
                maxLength="500"
              />
            </div>
            <div>
              <label htmlFor="ar">Area / Ward</label>
              <input
                type="text"
                id="ar"
                name="area_ward"
                value={form.area}
                onChange={set('area')}
              />
            </div>
            <div>
              <label htmlFor="pn">Pincode</label>
              <input
                type="text"
                id="pn"
                name="pincode"
                value={form.pincode}
                onChange={set('pincode')}
                maxLength="6"
              />
            </div>
            <div>
              <label htmlFor="ph">Phone *</label>
              <input
                type="tel"
                id="ph"
                name="phone"
                value={form.phone}
                onChange={set('phone')}
                required
              />
            </div>
            <div>
              <label htmlFor="em">Email</label>
              <input
                type="email"
                id="em"
                name="email"
                value={form.email}
                onChange={set('email')}
              />
            </div>
            <div>
              <label htmlFor="st">Status</label>
              <select
                id="st"
                name="is_active"
                value={form.active ? '1' : '0'}
                onChange={(e) => {
                  setSaved(false);
                  setForm((f) => ({ ...f, active: e.target.value === '1' }));
                }}
              >
                <option value="1">Active (shown to citizens)</option>
                <option value="0">Inactive (hidden)</option>
              </select>
            </div>
          </div>
          <p className="actions">
            <button className="btn y" type="submit">
              {isEdit ? 'Update Hospital' : 'Save Hospital'}
            </button>{' '}
            <button className="btn g2" type="reset">
              Reset
            </button>
          </p>
          {!isEdit && (
            <p className="sm">
              After saving a new hospital, set its bed capacity (Total beds) before daily updates.
            </p>
          )}
        </form>
      )}
    </>
  );
}
