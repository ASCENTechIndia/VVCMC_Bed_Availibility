import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { CATEGORIES, QUOTAS, seedState } from '../data/seed.js';
import { useAuth } from './AuthContext.jsx';

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

const emptyBeds = () =>
  CATEGORIES.map(() => QUOTAS.map(() => ({ total: 0, occupied: 0 })));

export function DataProvider({ children }) {
  const [state, setState] = useState(loadState);
  const auth = useAuth();

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
      const old = s.beds[id] || emptyBeds();
      const now = new Date().toISOString();
      const entries = [];
      newBeds.forEach((row, ci) =>
        row.forEach((cell, qi) => {
          if (cell.occupied !== old[ci][qi].occupied) {
            entries.push({
              at: now,
              hospitalId: id,
              category: CATEGORIES[ci].name,
              quota: QUOTAS[qi].key,
              oldOccupied: old[ci][qi].occupied,
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
  }, []);

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
    [state, auth, addHospital, updateHospital, toggleHospitalStatus, saveOccupied, saveCapacity, resetData]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export const useData = () => useContext(DataContext);
