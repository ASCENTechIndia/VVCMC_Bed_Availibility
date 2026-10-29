import { QUOTAS } from '../data/seed.js';
import { availabilityClass, columnTotals } from '../utils.js';

/**
 * Shared bed table used on the public page and both admin forms.
 *   mode="view"     - read only
 *   mode="update"   - Occupied is editable (daily status)
 *   mode="capacity" - Total is editable (bed capacity setup)
 * rows[category][quota] = { total, occupied }
 */
export default function BedTable({
  rows = [],
  mode = 'view',
  onChange,
  showHindi = false,
  categories,
  isHospitalView = false,
  onHospitalClick,
}) {
  const isEditMode = mode === 'update' || mode === 'capacity';
  const getQuotaKey = (q) => {
    const k = q?.key || '';
    if (k === 'Free') return 'reserved';
    return k.toLowerCase();
  };
  const getCatName = (cat) =>
    cat?.BED_CATEGORY ?? cat?.bed_category ?? cat?.VAR_BEDCATEGORY_NAME ?? cat?.var_bedcategory_name ?? cat?.name ?? '';

  const getHspName = (r) =>
    r?.HOSPITAL_NAME ?? r?.hospital_name ?? r?.VAR_HOSPITAL_NAME ?? r?.name ?? '';

  const getCatCount = (r) =>
    toNum(r?.CATEGORY_COUNT ?? r?.category_count ?? r?.BED_CATEGORY_COUNT ?? r?.bed_category_count ?? 0);

  const toNum = (val) => {
    if (val === undefined || val === null || val === '') return 0;
    const n = Number(val);
    return isNaN(n) ? 0 : n;
  };

  const isCategoryInactive = (r) => {
    const status = String(r?.VAR_BEDCATEGORY_STATUS ?? r?.var_bedcategory_status ?? r?.status ?? 'Y').toUpperCase().trim();
    return status === 'N';
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
      const name = String(isHospitalView ? getHspName(r) : getCatName(r)).trim().toLowerCase();
      return name === 'total' || name === 'एकूण';
    };

    const itemRows = rows.filter((r) => !isTotal(r) && !isCategoryInactive(r));
    const totalRowFromData = rows.find((r) => isTotal(r));

    const totalCategoryCount = itemRows.reduce((s, r) => s + getCatCount(r), 0);

    // Dedicated simplified table for Hospital View (Hospital Dashboard)
    if (isHospitalView) {
      const totalBedsGrand = itemRows.reduce(
        (s, r) =>
          s +
          toNum(r.REGULAR_TOTAL ?? r.regular_total) +
          toNum(r.RESERVED_TOTAL ?? r.reserved_total) +
          toNum(r.CONCESSIONAL_TOTAL ?? r.concessional_total),
        0
      );
      const totalOccupiedGrand = itemRows.reduce(
        (s, r) =>
          s +
          toNum(r.REGULAR_OCCUPIED ?? r.regular_occupied) +
          toNum(r.RESERVED_OCCUPIED ?? r.reserved_occupied) +
          toNum(r.CONCESSIONAL_OCCUPIED ?? r.concessional_occupied),
        0
      );
      const totalAvailableGrand = Math.max(0, totalBedsGrand - totalOccupiedGrand);
      const grandCls = availabilityClass(totalBedsGrand, totalAvailableGrand);

      return (
        <div className="sc">
          <table className="bt">
            <thead>
              <tr>
                <th>
                  Hospital Name
                  {showHindi && (
                    <>
                      <br />
                      रुग्णालय नाव
                    </>
                  )}
                </th>
                <th>
                  Total Beds
                  {showHindi && (
                    <>
                      <br />
                      एकूण बेड
                    </>
                  )}
                </th>
                <th>
                  Total Occupied
                  {showHindi && (
                    <>
                      <br />
                      एकूण भरलेले
                    </>
                  )}
                </th>
                <th>
                  Total Available
                  {showHindi && (
                    <>
                      <br />
                      एकूण उपलब्ध
                    </>
                  )}
                </th>
              </tr>
            </thead>
            <tbody>
              {itemRows.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                    No hospital bed records found.
                  </td>
                </tr>
              ) : (
                itemRows.map((cat, idx) => {
                  const displayName = getHspName(cat) || `Hospital ${idx + 1}`;
                  const regT = toNum(cat.REGULAR_TOTAL ?? cat.regular_total);
                  const regO = toNum(cat.REGULAR_OCCUPIED ?? cat.regular_occupied);

                  const resT = toNum(cat.RESERVED_TOTAL ?? cat.reserved_total);
                  const resO = toNum(cat.RESERVED_OCCUPIED ?? cat.reserved_occupied);

                  const conT = toNum(cat.CONCESSIONAL_TOTAL ?? cat.concessional_total);
                  const conO = toNum(cat.CONCESSIONAL_OCCUPIED ?? cat.concessional_occupied);

                  const totalBeds = regT + resT + conT;
                  const totalOccupied = regO + resO + conO;
                  const totalAvailable = Math.max(0, totalBeds - totalOccupied);
                  const cls = availabilityClass(totalBeds, totalAvailable);

                  return (
                    <tr key={displayName || idx}>
                      <td className="l">
                        {onHospitalClick ? (
                          <button
                            type="button"
                            className="hsp-link"
                            onClick={() => onHospitalClick(cat)}
                            title={`Click to view bed details for ${displayName}`}
                          >
                            {displayName}
                          </button>
                        ) : (
                          displayName
                        )}
                      </td>
                      <td><b>{totalBeds}</b></td>
                      <td><b>{totalOccupied}</b></td>
                      <td className={cls}><b>{totalAvailable}</b></td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot>
              <tr>
                <td className="l">Total</td>
                <td><b>{totalBedsGrand}</b></td>
                <td><b>{totalOccupiedGrand}</b></td>
                <td className={grandCls}><b>{totalAvailableGrand}</b></td>
              </tr>
            </tfoot>
          </table>
        </div>
      );
    }

    const totalRow = totalRowFromData || {
      BED_CATEGORY: 'Total',
      HOSPITAL_NAME: 'Total',
      CATEGORY_COUNT: totalCategoryCount,
      REGULAR_TOTAL: itemRows.reduce((s, r) => s + toNum(r.REGULAR_TOTAL ?? r.regular_total), 0),
      REGULAR_OCCUPIED: itemRows.reduce((s, r) => s + toNum(r.REGULAR_OCCUPIED ?? r.regular_occupied), 0),
      REGULAR_AVAILABLE: itemRows.reduce((s, r) => s + toNum(r.REGULAR_AVAILABLE ?? r.regular_available ?? (toNum(r.REGULAR_TOTAL ?? r.regular_total) - toNum(r.REGULAR_OCCUPIED ?? r.regular_occupied))), 0),
      RESERVED_TOTAL: itemRows.reduce((s, r) => s + toNum(r.RESERVED_TOTAL ?? r.reserved_total), 0),
      RESERVED_OCCUPIED: itemRows.reduce((s, r) => s + toNum(r.RESERVED_OCCUPIED ?? r.reserved_occupied), 0),
      RESERVED_AVAILABLE: itemRows.reduce((s, r) => s + toNum(r.RESERVED_AVAILABLE ?? r.reserved_available ?? (toNum(r.RESERVED_TOTAL ?? r.reserved_total) - toNum(r.RESERVED_OCCUPIED ?? r.reserved_occupied))), 0),
      CONCESSIONAL_TOTAL: itemRows.reduce((s, r) => s + toNum(r.CONCESSIONAL_TOTAL ?? r.concessional_total), 0),
      CONCESSIONAL_OCCUPIED: itemRows.reduce((s, r) => s + toNum(r.CONCESSIONAL_OCCUPIED ?? r.concessional_occupied), 0),
      CONCESSIONAL_AVAILABLE: itemRows.reduce((s, r) => s + toNum(r.CONCESSIONAL_AVAILABLE ?? r.concessional_available ?? (toNum(r.CONCESSIONAL_TOTAL ?? r.concessional_total) - toNum(r.CONCESSIONAL_OCCUPIED ?? r.concessional_occupied))), 0),
    };

    return (
      <div className="sc">
        <table className={`bt bed-quota-table ${isEditMode ? 'bed-edit-table' : ''}`}>
          <thead>
            <tr>
              <th rowSpan="2" className="bed-cat-head">
                {isHospitalView ? (
                  <>
                    Hospital Name
                    {showHindi && (
                      <>
                        <br />
                        रुग्णालय नाव
                      </>
                    )}
                  </>
                ) : (
                  <>
                    Bed Category / Ward Type
                    {showHindi && (
                      <>
                        <br />
                        बेड प्रकार
                      </>
                    )}
                  </>
                )}
              </th>
              {isHospitalView && (
                <th rowSpan="2">
                  Category Count
                  {showHindi && (
                    <>
                      <br />
                      कॅटेगरी संख्या
                    </>
                  )}
                </th>
              )}
              {QUOTAS.map((q) => {
                const qKey = getQuotaKey(q);
                return (
                  <th key={q.id} colSpan="3" className={`q-head q-${qKey}`}>{q.label}</th>
                );
              })}
            </tr>
            <tr>
              {QUOTAS.map((q) => (
                <FragmentHeads
                  key={q.id}
                  quotaClass={`q-${getQuotaKey(q)}`}
                />
              ))}
            </tr>
          </thead>
          <tbody>
            {itemRows.length === 0 ? (
              <tr>
                <td colSpan={isHospitalView ? 11 : 10} style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                  {isHospitalView ? 'No hospital bed records found.' : 'No bed availability records found.'}
                </td>
              </tr>
            ) : (
              itemRows.map((cat, idx) => {
                const displayName = isHospitalView
                  ? (getHspName(cat) || `Hospital ${idx + 1}`)
                  : (getCatName(cat) || `Category ${idx + 1}`);
                const catCount = getCatCount(cat);

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
                  <tr key={displayName || idx}>
                    <td className="l">
                      {isHospitalView && onHospitalClick ? (
                        <button
                          type="button"
                          className="hsp-link"
                          onClick={() => onHospitalClick(cat)}
                          title={`Click to view bed details for ${displayName}`}
                        >
                          {displayName}
                        </button>
                      ) : (
                        displayName
                      )}
                    </td>
                    {isHospitalView && <td><b>{catCount}</b></td>}
                    {/* Regular */}
                    <td className="q-regular col-total">{regTotal}</td>
                    <td className="q-regular col-occupied">{regOcc}</td>
                    <td className={`q-regular col-available ${regCls}`}>{regAvail}</td>
                    {/* Reserved */}
                    <td className="q-reserved col-total">{resTotal}</td>
                    <td className="q-reserved col-occupied">{resOcc}</td>
                    <td className={`q-reserved col-available ${resCls}`}>{resAvail}</td>
                    {/* Concessional */}
                    <td className="q-concessional col-total">{conTotal}</td>
                    <td className="q-concessional col-occupied">{conOcc}</td>
                    <td className={`q-concessional col-available ${conCls}`}>{conAvail}</td>
                  </tr>
                );
              })
            )}
          </tbody>
          <tfoot>
            <tr>
              <td className="l">Total</td>
              {isHospitalView && <td><b>{totalCategoryCount}</b></td>}
              {/* Regular Total */}
              <td className="q-foot q-regular col-total">{toNum(totalRow.REGULAR_TOTAL ?? totalRow.regular_total)}</td>
              <td className="q-foot q-regular col-occupied">{toNum(totalRow.REGULAR_OCCUPIED ?? totalRow.regular_occupied)}</td>
              <td className="q-foot q-regular col-available">{toNum(totalRow.REGULAR_AVAILABLE ?? totalRow.regular_available ?? (toNum(totalRow.REGULAR_TOTAL ?? totalRow.regular_total) - toNum(totalRow.REGULAR_OCCUPIED ?? totalRow.regular_occupied)))}</td>
              {/* Reserved Total */}
              <td className="q-foot q-reserved col-total">{toNum(totalRow.RESERVED_TOTAL ?? totalRow.reserved_total)}</td>
              <td className="q-foot q-reserved col-occupied">{toNum(totalRow.RESERVED_OCCUPIED ?? totalRow.reserved_occupied)}</td>
              <td className="q-foot q-reserved col-available">{toNum(totalRow.RESERVED_AVAILABLE ?? totalRow.reserved_available ?? (toNum(totalRow.RESERVED_TOTAL ?? totalRow.reserved_total) - toNum(totalRow.RESERVED_OCCUPIED ?? totalRow.reserved_occupied)))}</td>
              {/* Concessional Total */}
              <td className="q-foot q-concessional col-total">{toNum(totalRow.CONCESSIONAL_TOTAL ?? totalRow.concessional_total)}</td>
              <td className="q-foot q-concessional col-occupied">{toNum(totalRow.CONCESSIONAL_OCCUPIED ?? totalRow.concessional_occupied)}</td>
              <td className="q-foot q-concessional col-available">{toNum(totalRow.CONCESSIONAL_AVAILABLE ?? totalRow.concessional_available ?? (toNum(totalRow.CONCESSIONAL_TOTAL ?? totalRow.concessional_total) - toNum(totalRow.CONCESSIONAL_OCCUPIED ?? totalRow.concessional_occupied)))}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    );
  }

  // Fallback for 2D array or category list (only active categories where status is not 'N')
  const cats = (Array.isArray(categories) && categories.length > 0 ? categories : [])
    .filter((cat) => {
      const status = String(cat?.VAR_BEDCATEGORY_STATUS ?? cat?.var_bedcategory_status ?? cat?.status ?? 'Y').toUpperCase().trim();
      return status !== 'N';
    });

  const safeRows =
    Array.isArray(rows) && rows.length > 0 && Array.isArray(rows[0])
      ? rows
      : cats.map(() => QUOTAS.map(() => ({ total: 0, occupied: 0 })));

  const grand = [0, 1, 2].map((q) => columnTotals(safeRows, q));

  return (
    <div className="sc">
      <table className={`bt bed-quota-table ${isEditMode ? 'bed-edit-table' : ''}`}>
        <thead>
          <tr>
            <th rowSpan="2" className="bed-cat-head">
              Bed Category / Ward Type
              {showHindi && (
                <>
                  <br />
                  बेड प्रकार
                </>
              )}
            </th>
            {QUOTAS.map((q) => {
              const qKey = getQuotaKey(q);
              return (
                <th key={q.id} colSpan="3" className={`q-head q-${qKey}`}>{q.label}</th>
              );
            })}
          </tr>
          <tr>
            {QUOTAS.map((q) => (
              <FragmentHeads
                key={q.id}
                quotaClass={`q-${getQuotaKey(q)}`}
              />
            ))}
          </tr>
        </thead>
        <tbody>
          {cats.length === 0 ? (
            <tr>
              <td colSpan={10} style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                No bed categories available.
              </td>
            </tr>
          ) : (
            cats.map((cat, ci) => (
              <tr key={cat.id || ci}>
                <td className="l">{cat.name || cat.VAR_BEDCATEGORY_NAME || cat.BED_CATEGORY}</td>
                {QUOTAS.map((q, qi) => {
                  const cell = safeRows[ci]?.[qi] || { total: 0, occupied: 0 };
                  const available = cell.total - cell.occupied;
                  const qClass = `q-${getQuotaKey(q)}`;
                  return (
                    <FragmentCells
                      key={q.id}
                      cell={cell}
                      available={available}
                      mode={mode}
                      name={`${cat.id}_${q.id}`}
                      quotaClass={qClass}
                      onTotal={(v) => onChange && onChange(ci, qi, 'total', v)}
                      onOccupied={(v) => onChange && onChange(ci, qi, 'occupied', v)}
                    />
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
        <tfoot>
          <tr>
            <td className="l">Total</td>
            {grand.map((g, qi) => {
              const q = QUOTAS[qi];
              const qClass = `q-${getQuotaKey(q)}`;
              return (
                <FragmentTotals key={qi} total={g.total} occupied={g.occupied} quotaClass={qClass} />
              );
            })}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function FragmentHeads({ quotaClass }) {
  const cls = (sub) => (quotaClass ? `q-subhead ${quotaClass} ${sub}` : undefined);
  return (
    <>
      <th className={cls('col-total')}>Total</th>
      <th className={cls('col-occupied')}>Occupied</th>
      <th className={cls('col-available')}>Available</th>
    </>
  );
}

function FragmentTotals({ total, occupied, quotaClass }) {
  const cls = (sub) => (quotaClass ? `q-foot ${quotaClass} ${sub}` : undefined);
  return (
    <>
      <td className={cls('col-total')}>{total}</td>
      <td className={cls('col-occupied')}>{occupied}</td>
      <td className={cls('col-available')}>{total - occupied}</td>
    </>
  );
}

function FragmentCells({ cell, available, mode, name, quotaClass, onTotal, onOccupied }) {
  const cls = availabilityClass(cell.total, available);
  const num = (e) => Math.max(0, parseInt(e.target.value, 10) || 0);
  const cellCls = (sub, extra = '') => {
    const parts = [];
    if (quotaClass) parts.push(quotaClass);
    if (sub) parts.push(sub);
    if (extra) parts.push(extra);
    return parts.length > 0 ? parts.join(' ') : undefined;
  };
  return (
    <>
      <td className={cellCls('col-total')}>
        {mode === 'capacity' ? (
          <input type="number" min="0" name={`total_${name}`} value={cell.total} onChange={(e) => onTotal(num(e))} />
        ) : (
          cell.total
        )}
      </td>
      <td className={cellCls('col-occupied')}>
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
      <td className={cellCls('col-available', cls)}>{available}</td>
    </>
  );
}
