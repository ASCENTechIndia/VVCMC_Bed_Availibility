const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad = (n) => String(n).padStart(2, '0');

export function formatDateTime(iso) {
  const d = new Date(iso);
  let h = d.getHours();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${pad(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${pad(h)}:${pad(d.getMinutes())} ${ampm}`;
}

export function formatDateTime24(iso) {
  const d = new Date(iso);
  return `${pad(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export const isToday = (iso) => new Date(iso).toDateString() === new Date().toDateString();

export function availabilityClass(total, available) {
  if (total === 0) return '';
  if (available <= 0) return 'r';
  if (available / total <= 0.2) return 'w';
  return 'g';
}

export function columnTotals(rows, q) {
  return rows.reduce(
    (acc, row) => {
      acc.total += row[q].total;
      acc.occupied += row[q].occupied;
      return acc;
    },
    { total: 0, occupied: 0 }
  );
}

export function grandTotals(rows) {
  return [0, 1, 2].reduce(
    (acc, q) => {
      const c = columnTotals(rows, q);
      acc.total += c.total;
      acc.occupied += c.occupied;
      return acc;
    },
    { total: 0, occupied: 0 }
  );
}

export { getHostname, getIpAddress, getMacAddress, getSource } from './utils/device.js';

