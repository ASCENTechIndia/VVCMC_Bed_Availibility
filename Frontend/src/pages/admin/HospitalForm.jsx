import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useData } from '../../context/DataContext.jsx';
import { HOSPITAL_TYPES } from '../../data/seed.js';

const EMPTY = { name: '', type: '', address: '', area: '', pincode: '', phone: '', email: '', active: true };

/** Used for both "Add New Hospital" and "Update Hospital". */
export default function HospitalForm({ mode }) {
  const [params] = useSearchParams();
  const { hospitals } = useData();
  const isEdit = mode === 'edit';
  const existing = isEdit ? hospitals.find((h) => h.id === Number(params.get('id'))) : null;

  if (isEdit && !existing) return <Navigate to="/hospitals" replace />;
  return <HospitalFormInner key={existing?.id ?? 'new'} isEdit={isEdit} initial={existing || EMPTY} />;
}

function HospitalFormInner({ isEdit, initial }) {
  const { addHospital, updateHospital } = useData();
  const navigate = useNavigate();
  const [form, setForm] = useState(initial);
  const [saved, setSaved] = useState(false);

  const set = (k) => (e) => {
    setSaved(false);
    setForm((f) => ({ ...f, [k]: e.target.value }));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    const data = {
      name: form.name.trim(),
      type: form.type,
      address: form.address.trim(),
      area: form.area.trim(),
      pincode: form.pincode.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      active: form.active === true || form.active === '1' || form.active === 1,
    };
    if (isEdit) {
      updateHospital(initial.id, data);
      setSaved(true);
    } else {
      const newId = addHospital(data);
      navigate(`/bed-capacity?hospital_id=${newId}`);
    }
  };

  return (
    <>
      <div className="ph">
        <h1>{isEdit ? 'Update Hospital' : 'Add New Hospital'}</h1>
        <Link className="btn" to="/hospitals">&laquo; Back to list</Link>
      </div>
      {saved && <div className="alert ok">Hospital updated successfully.</div>}
      <form className="card" onSubmit={onSubmit} onReset={(e) => { e.preventDefault(); setForm(initial); }}>
        <div className="form">
          <div>
            <label htmlFor="n">Hospital Name *</label>
            <input type="text" id="n" name="name" value={form.name} onChange={set('name')} required maxLength="200" />
          </div>
          <div>
            <label htmlFor="ty">Hospital Type *</label>
            <select id="ty" name="hospital_type" value={form.type} onChange={set('type')} required>
              <option value="">-- Select --</option>
              {HOSPITAL_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="w2">
            <label htmlFor="ad">Address *</label>
            <input type="text" id="ad" name="address" value={form.address} onChange={set('address')} required maxLength="500" />
          </div>
          <div>
            <label htmlFor="ar">Area / Ward</label>
            <input type="text" id="ar" name="area_ward" value={form.area} onChange={set('area')} />
          </div>
          <div>
            <label htmlFor="pn">Pincode</label>
            <input type="text" id="pn" name="pincode" value={form.pincode} onChange={set('pincode')} maxLength="6" />
          </div>
          <div>
            <label htmlFor="ph">Phone *</label>
            <input type="tel" id="ph" name="phone" value={form.phone} onChange={set('phone')} required />
          </div>
          <div>
            <label htmlFor="em">Email</label>
            <input type="email" id="em" name="email" value={form.email} onChange={set('email')} />
          </div>
          <div>
            <label htmlFor="st">Status</label>
            <select
              id="st"
              name="is_active"
              value={form.active ? '1' : '0'}
              onChange={(e) => { setSaved(false); setForm((f) => ({ ...f, active: e.target.value === '1' })); }}
            >
              <option value="1">Active (shown to citizens)</option>
              <option value="0">Inactive (hidden)</option>
            </select>
          </div>
        </div>
        <p className="actions">
          <button className="btn y" type="submit">{isEdit ? 'Update Hospital' : 'Save Hospital'}</button>{' '}
          <button className="btn g2" type="reset">Reset</button>
        </p>
        {!isEdit && <p className="sm">After saving a new hospital, set its bed capacity (Total beds) before daily updates.</p>}
      </form>
    </>
  );
}
