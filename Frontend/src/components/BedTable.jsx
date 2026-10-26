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
  const getCatName = (cat) =>
    cat?.BED_CATEGORY ?? cat?.bed_category ?? cat?.VAR_BEDCATEGORY_NAME ?? cat?.var_bedcategory_name ?? cat?.name ?? '';

  const toNum = (val) => {
    if (val === undefined || val === null || val === '') return 0;
    const n = Number(val);
    return isNaN(n) ? 0 : n;
  };

  // Check if rows is in API format (array of objects with category or hospital properties)
  const isApiData =
    Array.isArray(rows) &&
    rows.length > 0 &&
    typeof rows[0] === 'object' &&
    !Array.isArray(rows[0]) &&
    (
      rows[0].BED_CATEGORY !== undefined ||
      rows[0].bed_category !== undefined ||
      rows[0].HOSPITAL_NAME !== undefined ||
      rows[0].hospital_name !== undefined ||
      rows[0].REGULAR_TOTAL !== undefined ||
      rows[0].regular_total !== undefined
    );

  if (isApiData) {
    const isTotal = (r) => {
      const name = String(getCatName(r)).trim().toLowerCase();
      return name === 'total' || name === 'एकूण';
    };

    const categoryRows = rows.filter((r) => !isTotal(r));
    const totalRowFromData = rows.find((r) => isTotal(r));

    const totalRow = totalRowFromData || {
      BED_CATEGORY: 'Total',
      REGULAR_TOTAL: categoryRows.reduce((s, r) => s + toNum(r.REGULAR_TOTAL ?? r.regular_total), 0),
      REGULAR_OCCUPIED: categoryRows.reduce((s, r) => s + toNum(r.REGULAR_OCCUPIED ?? r.regular_occupied), 0),
      REGULAR_AVAILABLE: categoryRows.reduce((s, r) => s + toNum(r.REGULAR_AVAILABLE ?? r.regular_available ?? (toNum(r.REGULAR_TOTAL ?? r.regular_total) - toNum(r.REGULAR_OCCUPIED ?? r.regular_occupied))), 0),
      RESERVED_TOTAL: categoryRows.reduce((s, r) => s + toNum(r.RESERVED_TOTAL ?? r.reserved_total), 0),
      RESERVED_OCCUPIED: categoryRows.reduce((s, r) => s + toNum(r.RESERVED_OCCUPIED ?? r.reserved_occupied), 0),
      RESERVED_AVAILABLE: categoryRows.reduce((s, r) => s + toNum(r.RESERVED_AVAILABLE ?? r.reserved_available ?? (toNum(r.RESERVED_TOTAL ?? r.reserved_total) - toNum(r.RESERVED_OCCUPIED ?? r.reserved_occupied))), 0),
      CONCESSIONAL_TOTAL: categoryRows.reduce((s, r) => s + toNum(r.CONCESSIONAL_TOTAL ?? r.concessional_total), 0),
      CONCESSIONAL_OCCUPIED: categoryRows.reduce((s, r) => s + toNum(r.CONCESSIONAL_OCCUPIED ?? r.concessional_occupied), 0),
      CONCESSIONAL_AVAILABLE: categoryRows.reduce((s, r) => s + toNum(r.CONCESSIONAL_AVAILABLE ?? r.concessional_available ?? (toNum(r.CONCESSIONAL_TOTAL ?? r.concessional_total) - toNum(r.CONCESSIONAL_OCCUPIED ?? r.concessional_occupied))), 0),
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
                const catName = getCatName(cat) || `Category ${idx + 1}`;
                const regTotal = toNum(cat.REGULAR_TOTAL ?? cat.regular_total);
                const regOcc = toNum(cat.REGULAR_OCCUPIED ?? cat.regular_occupied);
                const regAvail = cat.REGULAR_AVAILABLE !== undefined
                  ? toNum(cat.REGULAR_AVAILABLE)
                  : (cat.regular_available !== undefined ? toNum(cat.regular_available) : regTotal - regOcc);

                const resTotal = toNum(cat.RESERVED_TOTAL ?? cat.reserved_total);
                const resOcc = toNum(cat.RESERVED_OCCUPIED ?? cat.reserved_occupied);
                const resAvail = cat.RESERVED_AVAILABLE !== undefined
                  ? toNum(cat.RESERVED_AVAILABLE)
                  : (cat.reserved_available !== undefined ? toNum(cat.reserved_available) : resTotal - resOcc);

                const conTotal = toNum(cat.CONCESSIONAL_TOTAL ?? cat.concessional_total);
                const conOcc = toNum(cat.CONCESSIONAL_OCCUPIED ?? cat.concessional_occupied);
                const conAvail = cat.CONCESSIONAL_AVAILABLE !== undefined
                  ? toNum(cat.CONCESSIONAL_AVAILABLE)
                  : (cat.concessional_available !== undefined ? toNum(cat.concessional_available) : conTotal - conOcc);

                const regCls = availabilityClass(regTotal, regAvail);
                const resCls = availabilityClass(resTotal, resAvail);
                const conCls = availabilityClass(conTotal, conAvail);

                return (
                  <tr key={catName || idx}>
                    <td className="l">{catName}</td>
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
              <td>{toNum(totalRow.REGULAR_TOTAL ?? totalRow.regular_total)}</td>
              <td>{toNum(totalRow.REGULAR_OCCUPIED ?? totalRow.regular_occupied)}</td>
              <td>{toNum(totalRow.REGULAR_AVAILABLE ?? totalRow.regular_available ?? (toNum(totalRow.REGULAR_TOTAL ?? totalRow.regular_total) - toNum(totalRow.REGULAR_OCCUPIED ?? totalRow.regular_occupied)))}</td>
              {/* Reserved Total */}
              <td>{toNum(totalRow.RESERVED_TOTAL ?? totalRow.reserved_total)}</td>
              <td>{toNum(totalRow.RESERVED_OCCUPIED ?? totalRow.reserved_occupied)}</td>
              <td>{toNum(totalRow.RESERVED_AVAILABLE ?? totalRow.reserved_available ?? (toNum(totalRow.RESERVED_TOTAL ?? totalRow.reserved_total) - toNum(totalRow.RESERVED_OCCUPIED ?? totalRow.reserved_occupied)))}</td>
              {/* Concessional Total */}
              <td>{toNum(totalRow.CONCESSIONAL_TOTAL ?? totalRow.concessional_total)}</td>
              <td>{toNum(totalRow.CONCESSIONAL_OCCUPIED ?? totalRow.concessional_occupied)}</td>
              <td>{toNum(totalRow.CONCESSIONAL_AVAILABLE ?? totalRow.concessional_available ?? (toNum(totalRow.CONCESSIONAL_TOTAL ?? totalRow.concessional_total) - toNum(totalRow.CONCESSIONAL_OCCUPIED ?? totalRow.concessional_occupied)))}</td>
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
