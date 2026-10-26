import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { QUOTAS, seedState } from '../data/seed.js';
import { useAuth } from './AuthContext.jsx';
import { post } from '../services/apiService.js';

const STORAGE_KEY = 'vvcmc-bed-dashboard:v1';

const DataContext = createContext(null);

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (error) {
    console.warn('Failed to load state from localStorage:', error);
  }
  return seedState();
}

const emptyBeds = (count = 0) =>
  Array.from({ length: count }, () => QUOTAS.map(() => ({ total: 0, occupied: 0 })));

export function DataProvider({ children }) {
  const [state, setState] = useState(loadState);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const auth = useAuth();

  const fetchBedCategories = useCallback(async () => {
    try {
      setLoadingCategories(true);
      const targetUlbId = Number(auth?.user?.ulbId || auth?.user?.ulbd) || 790;
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
          NUM_BEDCATEGORY_ID: item.NUM_BEDCATEGORY_ID,
          VAR_BEDCATEGORY_NAME: item.VAR_BEDCATEGORY_NAME,
        }))
        .filter((c) => c.id && c.name);

      setCategories(formatted);
    } catch (err) {
      console.warn('Failed to load bed category master in DataContext:', err);
    } finally {
      setLoadingCategories(false);
    }
  }, [auth?.user?.ulbId, auth?.user?.ulbd]);

  useEffect(() => {
    fetchBedCategories();
  }, [fetchBedCategories]);

  const addHospital = useCallback((data) => {
    let newId;
    setState((s) => {
      newId = s.hospitals.reduce((m, h) => Math.max(m, h.id), 0) + 1;
      return {
        ...s,
        hospitals: [
          ...s.hospitals,
          { ...data, id: newId, lastUpdated: new Date().toISOString(), updatedBy: 'Admin User' },
        ],
        beds: { ...s.beds, [newId]: emptyBeds() },
      };
    });
    return newId;
  }, []);

  const updateHospital = useCallback((id, data) => {
    setState((s) => ({
      ...s,
      hospitals: s.hospitals.map((h) => (h.id === id ? { ...h, ...data } : h)),
    }));
  }, []);

  const toggleHospitalStatus = useCallback((id) => {
    setState((s) => ({
      ...s,
      hospitals: s.hospitals.map((h) => (h.id === id ? { ...h, active: !h.active } : h)),
    }));
  }, []);

  /** Daily update: only the Occupied numbers change; every change is written to the audit log. */
  const saveOccupied = useCallback((id, newBeds) => {
    setState((s) => {
      const old = s.beds[id] || emptyBeds(categories.length);
      const now = new Date().toISOString();
      const entries = [];
      newBeds.forEach((row, ci) =>
        row.forEach((cell, qi) => {
          if (cell.occupied !== old[ci]?.[qi]?.occupied) {
            entries.push({
              at: now,
              hospitalId: id,
              category: categories[ci]?.name || `Category ${ci + 1}`,
              quota: QUOTAS[qi].key,
              oldOccupied: old[ci]?.[qi]?.occupied || 0,
              newOccupied: cell.occupied,
              user: 'admin',
              ip: (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('vvcmc_device_ip')) || '127.0.0.1',
            });
          }
        })
      );
      return {
        ...s,
        beds: { ...s.beds, [id]: newBeds },
        hospitals: s.hospitals.map((h) =>
          h.id === id ? { ...h, lastUpdated: now, updatedBy: 'Admin User' } : h
        ),
        history: [...entries.reverse(), ...s.history],
      };
    });
  }, [categories]);

  /** Capacity setup: only the Total numbers change. */
  const saveCapacity = useCallback((id, newBeds) => {
    setState((s) => ({ ...s, beds: { ...s.beds, [id]: newBeds } }));
  }, []);

  const resetData = useCallback(() => setState(seedState()), []);

  const value = useMemo(
    () => ({
      hospitals: state.hospitals,
      beds: state.beds,
      history: state.history,
      categories,
      loadingCategories,
      fetchBedCategories,
      isAdmin: auth.isAdmin,
      isAuthenticated: auth.isAuthenticated,
      currentUser: auth.currentUser,
      user: auth.user,
      token: auth.token,
      login: auth.login,
      logout: auth.logout,
      addHospital,
      updateHospital,
      toggleHospitalStatus,
      saveOccupied,
      saveCapacity,
      resetData,
    }),
    [state, auth, categories, loadingCategories, fetchBedCategories, addHospital, updateHospital, toggleHospitalStatus, saveOccupied, saveCapacity, resetData]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export const useData = () => useContext(DataContext);
