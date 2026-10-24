const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad = (n) => String(n).padStart(2, '0');

/** "24 Oct 2026, 09:30 AM" */
export function formatDateTime(iso) {
  const d = new Date(iso);
  let h = d.getHours();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${pad(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${pad(h)}:${pad(d.getMinutes())} ${ampm}`;
}

/** "24 Oct 2026, 09:30" (24-hour, used in the audit log) */
export function formatDateTime24(iso) {
  const d = new Date(iso);
  return `${pad(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export const isToday = (iso) => new Date(iso).toDateString() === new Date().toDateString();

/** green / warning (<=20% left) / red (full) / none (no beds) */
export function availabilityClass(total, available) {
  if (total === 0) return '';
  if (available <= 0) return 'r';
  if (available / total <= 0.2) return 'w';
  return 'g';
}

/** Totals of one quota column across all categories. */
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
