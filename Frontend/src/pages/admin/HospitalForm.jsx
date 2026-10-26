import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { post } from '../../services/apiService.js';
import Modal from '../../components/Modal.jsx';
import { inputHandlers, validateHospitalForm } from '../../validation/inputValidations.js';
import { getIpAddress, getSource } from '../../utils/device.js';

const BASE_TYPES = ['Municipal', 'Government', 'Private', 'Trust'];

const EMPTY = {
  id: 0,
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
  const hospitalId = Number(hospitalIdParam) || 0;

  const [form, setForm] = useState(EMPTY);
  const [initialData, setInitialData] = useState(EMPTY);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // Success modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

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
    setForm((f) => ({ ...f, [k]: e.target.value }));
    if (fieldErrors[k]) {
      setFieldErrors((prev) => ({ ...prev, [k]: '' }));
    }
  };

  const typeOptions = useMemo(() => {
    const types = new Set(BASE_TYPES);
    if (form.type) types.add(form.type);
    return Array.from(types).filter(Boolean);
  }, [form.type]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate inputs using inputValidations
    const validation = validateHospitalForm(form);
    if (!validation.isValid) {
      setFieldErrors(validation.errors);
      return;
    }
    setFieldErrors({});
    setSubmitting(true);

    try {
      const targetHospitalId = isEdit ? Number(hospitalId || form.id || 0) : 0;
      const targetUlbId = Number(user?.ulbId || user?.ulbd) || 790;
      const modeValue = isEdit ? 2 : 1;

      const [ipAddress, ipSource] = await Promise.all([
        getIpAddress(),
        Promise.resolve(getSource()),
      ]);

      const payload = {
        userId: user?.userId || 'admin',
        hospitalId: targetHospitalId,
        ulbId: targetUlbId,
        hospitalName: form.name.trim(),
        hospitalType: form.type,
        address: form.address.trim(),
        areaWard: form.area.trim(),
        pincode: form.pincode.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        status: form.active ? 'Y' : 'N',
        mode: modeValue,
        ipAddress: ipAddress || '127.0.0.1',
        ipSource: ipSource || 'RW',
      };

      const res = await post('/hospitalMst/insertHospital', payload);

      const errorCode = String(res?.data?.errorCode ?? res?.errorCode ?? '');
      if (errorCode && errorCode !== '9999') {
        throw new Error(res?.data?.message || res?.message || 'Failed to save hospital');
      }

      const successMsg =
        res?.data?.message ||
        res?.message ||
        (isEdit ? 'Hospital Updated Successfully' : 'Data Inserted Successfully');

      setModalMessage(successMsg);
      setModalOpen(true);
      setInitialData({ ...form });
    } catch (err) {
      console.error('Error saving hospital:', err);
      setError(err?.message || 'Failed to save hospital. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleModalOk = () => {
    setModalOpen(false);
    navigate('/hospitals');
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

      {loading && (
        <div className="card" style={{ textAlign: 'center', padding: '24px' }}>
          Loading hospital details...
        </div>
      )}

      {error && (
        <div className="alert err">
          {error}{' '}
          {isEdit && (
            <button
              type="button"
              className="btn s"
              onClick={fetchHospitalDetails}
              style={{ marginLeft: '12px' }}
            >
              Retry
            </button>
          )}
        </div>
      )}

      {!loading && (
        <form
          className="card"
          onSubmit={onSubmit}
          noValidate
          onReset={(e) => {
            e.preventDefault();
            setError('');
            setFieldErrors({});
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
                disabled={submitting}
                className={fieldErrors.name ? 'has-err' : undefined}
              />
              {fieldErrors.name && <span className="field-err">{fieldErrors.name}</span>}
            </div>
            <div>
              <label htmlFor="ty">Hospital Type *</label>
              <select
                id="ty"
                name="hospital_type"
                value={form.type}
                onChange={set('type')}
                required
                disabled={submitting}
                className={fieldErrors.type ? 'has-err' : undefined}
              >
                <option value="">-- Select --</option>
                {typeOptions.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              {fieldErrors.type && <span className="field-err">{fieldErrors.type}</span>}
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
                disabled={submitting}
                className={fieldErrors.address ? 'has-err' : undefined}
              />
              {fieldErrors.address && <span className="field-err">{fieldErrors.address}</span>}
            </div>
            <div>
              <label htmlFor="ar">Area / Ward</label>
              <input
                type="text"
                id="ar"
                name="area_ward"
                value={form.area}
                onChange={set('area')}
                disabled={submitting}
              />
            </div>
            <div>
              <label htmlFor="pn">Pincode (6 digits) *</label>
              <input
                type="text"
                inputMode="numeric"
                id="pn"
                name="pincode"
                value={form.pincode}
                onChange={(e) => {
                  inputHandlers.pincode(e, (val) => {
                    setForm((f) => ({ ...f, pincode: val }));
                    if (fieldErrors.pincode) {
                      setFieldErrors((prev) => ({ ...prev, pincode: '' }));
                    }
                  });
                }}
                maxLength="6"
                placeholder="e.g. 401303"
                disabled={submitting}
                className={fieldErrors.pincode ? 'has-err' : undefined}
              />
              {fieldErrors.pincode && <span className="field-err">{fieldErrors.pincode}</span>}
            </div>
            <div>
              <label htmlFor="ph">Phone (10 digits) *</label>
              <input
                type="tel"
                inputMode="numeric"
                id="ph"
                name="phone"
                value={form.phone}
                onChange={(e) => {
                  inputHandlers.phone(e, (val) => {
                    setForm((f) => ({ ...f, phone: val }));
                    if (fieldErrors.phone) {
                      setFieldErrors((prev) => ({ ...prev, phone: '' }));
                    }
                  });
                }}
                maxLength="10"
                placeholder="e.g. 9876543210"
                required
                disabled={submitting}
                className={fieldErrors.phone ? 'has-err' : undefined}
              />
              {fieldErrors.phone && <span className="field-err">{fieldErrors.phone}</span>}
            </div>
            <div>
              <label htmlFor="em">Email *</label>
              <input
                type="email"
                id="em"
                name="email"
                value={form.email}
                onChange={(e) => {
                  inputHandlers.email(e, (val) => {
                    setForm((f) => ({ ...f, email: val }));
                    if (fieldErrors.email) {
                      setFieldErrors((prev) => ({ ...prev, email: '' }));
                    }
                  });
                }}
                placeholder="e.g. hospital@example.com"
                required
                disabled={submitting}
                className={fieldErrors.email ? 'has-err' : undefined}
              />
              {fieldErrors.email && <span className="field-err">{fieldErrors.email}</span>}
            </div>
            <div>
              <label htmlFor="st">Status</label>
              <select
                id="st"
                name="is_active"
                value={form.active ? '1' : '0'}
                onChange={(e) => {
                  setForm((f) => ({ ...f, active: e.target.value === '1' }));
                }}
                disabled={submitting}
              >
                <option value="1">Active (shown to citizens)</option>
                <option value="0">Inactive (hidden)</option>
              </select>
            </div>
          </div>
          <p className="actions">
            <button className="btn y" type="submit" disabled={submitting}>
              {submitting
                ? isEdit
                  ? 'Updating...'
                  : 'Saving...'
                : isEdit
                ? 'Update Hospital'
                : 'Save Hospital'}
            </button>{' '}
            <button className="btn g2" type="reset" disabled={submitting}>
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

      {/* Success Modal */}
      <Modal
        isOpen={modalOpen}
        title="Success"
        message={modalMessage}
        onOk={handleModalOk}
        okText="OK"
      />
    </>
  );
}
