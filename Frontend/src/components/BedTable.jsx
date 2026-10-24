import { CATEGORIES, QUOTAS } from '../data/seed.js';
import { availabilityClass, columnTotals } from '../utils.js';

/**
 * Shared bed table used on the public page and both admin forms.
 *   mode="view"     - read only
 *   mode="update"   - Occupied is editable (daily status)
 *   mode="capacity" - Total is editable (bed capacity setup)
 * rows[category][quota] = { total, occupied }
 */
export default function BedTable({ rows = [], mode = 'view', onChange, showHindi = false }) {
  // Check if rows is in API format (array of objects with BED_CATEGORY)
  const isApiData =
    Array.isArray(rows) &&
    rows.length > 0 &&
    typeof rows[0] === 'object' &&
    rows[0]?.BED_CATEGORY !== undefined;

  if (isApiData) {
    const categoryRows = rows.filter((r) => r.BED_CATEGORY !== 'Total');
    const totalRow = rows.find((r) => r.BED_CATEGORY === 'Total') || {
      BED_CATEGORY: 'Total',
      REGULAR_TOTAL: categoryRows.reduce((s, r) => s + (Number(r.REGULAR_TOTAL) || 0), 0),
      REGULAR_OCCUPIED: categoryRows.reduce((s, r) => s + (Number(r.REGULAR_OCCUPIED) || 0), 0),
      REGULAR_AVAILABLE: categoryRows.reduce((s, r) => s + (Number(r.REGULAR_AVAILABLE) || 0), 0),
      RESERVED_TOTAL: categoryRows.reduce((s, r) => s + (Number(r.RESERVED_TOTAL) || 0), 0),
      RESERVED_OCCUPIED: categoryRows.reduce((s, r) => s + (Number(r.RESERVED_OCCUPIED) || 0), 0),
      RESERVED_AVAILABLE: categoryRows.reduce((s, r) => s + (Number(r.RESERVED_AVAILABLE) || 0), 0),
      CONCESSIONAL_TOTAL: categoryRows.reduce((s, r) => s + (Number(r.CONCESSIONAL_TOTAL) || 0), 0),
      CONCESSIONAL_OCCUPIED: categoryRows.reduce((s, r) => s + (Number(r.CONCESSIONAL_OCCUPIED) || 0), 0),
      CONCESSIONAL_AVAILABLE: categoryRows.reduce((s, r) => s + (Number(r.CONCESSIONAL_AVAILABLE) || 0), 0),
    };

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
            {categoryRows.length === 0 ? (
              <tr>
                <td colSpan="10" style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                  No bed availability records found.
                </td>
              </tr>
            ) : (
              categoryRows.map((cat, idx) => {
                const regTotal = Number(cat.REGULAR_TOTAL) || 0;
                const regOcc = Number(cat.REGULAR_OCCUPIED) || 0;
                const regAvail = Number(cat.REGULAR_AVAILABLE ?? (regTotal - regOcc));

                const resTotal = Number(cat.RESERVED_TOTAL) || 0;
                const resOcc = Number(cat.RESERVED_OCCUPIED) || 0;
                const resAvail = Number(cat.RESERVED_AVAILABLE ?? (resTotal - resOcc));

                const conTotal = Number(cat.CONCESSIONAL_TOTAL) || 0;
                const conOcc = Number(cat.CONCESSIONAL_OCCUPIED) || 0;
                const conAvail = Number(cat.CONCESSIONAL_AVAILABLE ?? (conTotal - conOcc));

                const regCls = availabilityClass(regTotal, regAvail);
                const resCls = availabilityClass(resTotal, resAvail);
                const conCls = availabilityClass(conTotal, conAvail);

                return (
                  <tr key={cat.BED_CATEGORY || idx}>
                    <td className="l">{cat.BED_CATEGORY}</td>
                    {/* Regular */}
                    <td>{regTotal}</td>
                    <td>{regOcc}</td>
                    <td className={regCls}>{regAvail}</td>
                    {/* Reserved */}
                    <td>{resTotal}</td>
                    <td>{resOcc}</td>
                    <td className={resCls}>{resAvail}</td>
                    {/* Concessional */}
                    <td>{conTotal}</td>
                    <td>{conOcc}</td>
                    <td className={conCls}>{conAvail}</td>
                  </tr>
                );
              })
            )}
          </tbody>
          <tfoot>
            <tr>
              <td className="l">Total</td>
              {/* Regular Total */}
              <td>{Number(totalRow.REGULAR_TOTAL) || 0}</td>
              <td>{Number(totalRow.REGULAR_OCCUPIED) || 0}</td>
              <td>{Number(totalRow.REGULAR_AVAILABLE ?? ((Number(totalRow.REGULAR_TOTAL) || 0) - (Number(totalRow.REGULAR_OCCUPIED) || 0)))}</td>
              {/* Reserved Total */}
              <td>{Number(totalRow.RESERVED_TOTAL) || 0}</td>
              <td>{Number(totalRow.RESERVED_OCCUPIED) || 0}</td>
              <td>{Number(totalRow.RESERVED_AVAILABLE ?? ((Number(totalRow.RESERVED_TOTAL) || 0) - (Number(totalRow.RESERVED_OCCUPIED) || 0)))}</td>
              {/* Concessional Total */}
              <td>{Number(totalRow.CONCESSIONAL_TOTAL) || 0}</td>
              <td>{Number(totalRow.CONCESSIONAL_OCCUPIED) || 0}</td>
              <td>{Number(totalRow.CONCESSIONAL_AVAILABLE ?? ((Number(totalRow.CONCESSIONAL_TOTAL) || 0) - (Number(totalRow.CONCESSIONAL_OCCUPIED) || 0)))}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    );
  }

  // Safe fallback for legacy 2D array
  const safeRows =
    Array.isArray(rows) && rows.length > 0 && Array.isArray(rows[0])
      ? rows
      : CATEGORIES.map(() => QUOTAS.map(() => ({ total: 0, occupied: 0 })));

  const grand = [0, 1, 2].map((q) => columnTotals(safeRows, q));

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
                const cell = safeRows[ci]?.[qi] || { total: 0, occupied: 0 };
                const available = cell.total - cell.occupied;
                return (
                  <FragmentCells
                    key={q.id}
                    cell={cell}
                    available={available}
                    mode={mode}
                    name={`${cat.id}_${q.id}`}
                    onTotal={(v) => onChange && onChange(ci, qi, 'total', v)}
                    onOccupied={(v) => onChange && onChange(ci, qi, 'occupied', v)}
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
