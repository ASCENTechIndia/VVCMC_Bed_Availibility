import { CATEGORIES, QUOTAS } from '../data/seed.js';
import { availabilityClass, columnTotals } from '../utils.js';

/**
 * Shared bed table used on the public page and both admin forms.
 *   mode="view"     - read only
 *   mode="update"   - Occupied is editable (daily status)
 *   mode="capacity" - Total is editable (bed capacity setup)
 * rows[category][quota] = { total, occupied }
 */
export default function BedTable({ rows, mode = 'view', onChange, showHindi = false }) {
  const grand = [0, 1, 2].map((q) => columnTotals(rows, q));

  return (
    <div className="sc">
      <table className="bt">
        <thead>
          <tr>
            <th rowSpan="2">
              Bed Category / Ward Type
              {showHindi && (
                <>
                  <br />
                  बेड प्रकार
                </>
              )}
            </th>
            {QUOTAS.map((q) => (
              <th key={q.id} colSpan="3">{q.label}</th>
            ))}
          </tr>
          <tr>
            {QUOTAS.map((q) => (
              <FragmentHeads key={q.id} />
            ))}
          </tr>
        </thead>
        <tbody>
          {CATEGORIES.map((cat, ci) => (
            <tr key={cat.id}>
              <td className="l">{cat.name}</td>
              {QUOTAS.map((q, qi) => {
                const cell = rows[ci][qi];
                const available = cell.total - cell.occupied;
                return (
                  <FragmentCells
                    key={q.id}
                    cell={cell}
                    available={available}
                    mode={mode}
                    name={`${cat.id}_${q.id}`}
                    onTotal={(v) => onChange(ci, qi, 'total', v)}
                    onOccupied={(v) => onChange(ci, qi, 'occupied', v)}
                  />
                );
              })}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td className="l">Total</td>
            {grand.map((g, qi) => (
              <FragmentTotals key={qi} total={g.total} occupied={g.occupied} />
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function FragmentHeads() {
  return (
    <>
      <th>Total</th>
      <th>Occupied</th>
      <th>Available</th>
    </>
  );
}

function FragmentTotals({ total, occupied }) {
  return (
    <>
      <td>{total}</td>
      <td>{occupied}</td>
      <td>{total - occupied}</td>
    </>
  );
}

function FragmentCells({ cell, available, mode, name, onTotal, onOccupied }) {
  const cls = availabilityClass(cell.total, available);
  const num = (e) => Math.max(0, parseInt(e.target.value, 10) || 0);
  return (
    <>
      <td>
        {mode === 'capacity' ? (
          <input type="number" min="0" name={`total_${name}`} value={cell.total} onChange={(e) => onTotal(num(e))} />
        ) : (
          cell.total
        )}
      </td>
      <td>
        {mode === 'update' ? (
          <input
            type="number"
            min="0"
            max={cell.total}
            name={`occupied_${name}`}
            value={cell.occupied}
            onChange={(e) => onOccupied(num(e))}
          />
        ) : (
          cell.occupied
        )}
      </td>
      <td className={cls}>{available}</td>
    </>
  );
}
