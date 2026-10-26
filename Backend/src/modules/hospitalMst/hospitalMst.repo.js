const oracledb = require('oracledb');
const { executeQuery } = require('../../db/queryExecutor');
const { executeProcedure } = require('../../db/procedureExecutor');

/**
 * Fetch hospital master list by ULB ID
 */
async function repoHospitalList(ulbid) {
  const sql = `
    SELECT a.num_hospital_id,
           a.num_hospital_ulbid,
           a.var_hospital_name,
           a.var_hospital_type,
           a.var_hospital_address,
           a.var_hospital_area_ward,
           a.var_hospital_pincode,
           a.var_hospital_phone,
           a.var_hospital_email,
           a.var_hospital_status,
           a.var_hospital_insby,
           a.dat_hospital_insdt,
           a.var_hospital_updby,
           a.dat_hospital_upddt
      FROM aoha_hospital_mas a
     WHERE a.num_hospital_ulbid = :ulbid
     ORDER BY a.num_hospital_id ASC
  `;
  const binds = { ulbid: Number(ulbid || 0) };
  const result = await executeQuery(sql, binds);
  return result.rows || [];
}

/**
 * Fetch hospital details by Hospital ID and ULB ID
**/
async function repoHospitalById(hospitalId, ulbId) {
  const sql = `
    SELECT a.num_hospital_id,
           a.num_hospital_ulbid,
           a.var_hospital_name,
           a.var_hospital_type,
           a.var_hospital_address,
           a.var_hospital_area_ward,
           a.var_hospital_pincode,
           a.var_hospital_phone,
           a.var_hospital_email,
           a.var_hospital_status,
           a.var_hospital_insby,
           a.dat_hospital_insdt,
           a.var_hospital_updby,
           a.dat_hospital_upddt
      FROM aoha_hospital_mas a
     WHERE a.num_hospital_id = :hospitalId
       AND a.num_hospital_ulbid = :ulbId
  `;
  const binds = {
    hospitalId: Number(hospitalId),
    ulbId: Number(ulbId),
  };
  const result = await executeQuery(sql, binds);
  return result.rows?.[0] || null;
}

/**
 * Execute stored procedure AOHA_HOSPITAL_INS
 * @param {Object} payload - Hospital insert/update payload
 * @returns {Promise<{errorCode: number, message: string}>}
 */
async function repoHospitalIns(payload) {
  const statement = `
    BEGIN
      AOHA_HOSPITAL_INS(
        :IN_USERID,
        :IN_ID,
        :IN_ULBID,
        :IN_HOSPITALNAME,
        :IN_HOSPITALTYPE,
        :IN_ADDRESS,
        :IN_AREAWARD,
        :IN_PINCODE,
        :IN_PHONE,
        :IN_EMAIL,
        :IN_STATUS,
        :IN_MODE,
        :IN_IPADDRESS,
        :IN_IPSOURCE,
        :OUT_ERRCODE,
        :OUT_ERRMSG
      );
    END;
  `;

  const binds = {
    IN_USERID: payload.userId ? String(payload.userId) : '',
    IN_ID: Number(payload.hospitalId),
    IN_ULBID: Number(payload.ulbId),
    IN_HOSPITALNAME: payload.hospitalName,
    IN_HOSPITALTYPE: payload.hospitalType,
    IN_ADDRESS: payload.address,
    IN_AREAWARD: payload.areaWard,
    IN_PINCODE: payload.pincode,
    IN_PHONE: payload.phone,
    IN_EMAIL: payload.email,
    IN_STATUS: payload.status,
    IN_MODE: payload.mode,
    IN_IPADDRESS: payload.ipAddress,
    IN_IPSOURCE: payload.ipSource ?? payload.IN_IPSOURCE ?? 'W',

    OUT_ERRCODE: {
      dir: oracledb.BIND_OUT,
      type: oracledb.NUMBER,
    },
    OUT_ERRMSG: {
      dir: oracledb.BIND_OUT,
      type: oracledb.STRING,
      maxSize: 1000,
    },
  };

  const result = await executeProcedure({
    statement,
    binds,
    useTx: false,
  });

  const out = result.outBinds || {};

  return {
    errorCode: out.OUT_ERRCODE,
    message: out.OUT_ERRMSG,
  };
}

/**
 * Fetch bed category master list by ULB ID
 */
async function repoBedCategoryList(ulbid) {
  const sql = `
    SELECT a.num_bedcategory_id,
           a.num_bedcategory_ulbid,
           a.var_bedcategory_name,
           a.var_bedcategory_status,
           a.var_bedcategory_insby,
           a.dat_bedcategory_insdt,
           a.var_bedcategory_updby,
           a.dat_bedcategory_upddt
      FROM aoha_bedcategory_mas a
     WHERE a.num_bedcategory_ulbid = :ulbid
     ORDER BY a.num_bedcategory_id DESC
  `;
  const binds = { ulbid: Number(ulbid || 0) };
  const result = await executeQuery(sql, binds);
  return result.rows || [];
}

/**
 * Execute stored procedure AOHA_BEDCATEGORY_INS
 * @param {Object} payload - Bed category insert/update payload
 * @returns {Promise<{errorCode: number, message: string}>}
 */
async function repoBedCategoryIns(payload) {
  const statement = `
    BEGIN
      AOHA_BEDCATEGORY_INS(
        :IN_USERID,
        :IN_ID,
        :IN_ULBID,
        :IN_BEDCATEGORYNAME,
        :IN_STATUS,
        :IN_MODE,
        :IN_IPADDRESS,
        :IN_IPSOURCE,
        :OUT_ERRCODE,
        :OUT_ERRMSG
      );
    END;
  `;

  const binds = {
    IN_USERID: payload.userId ? String(payload.userId) : '',
    IN_ID: Number(payload.bedCategoryId ?? 0),
    IN_ULBID: Number(payload.ulbId ?? 0),
    IN_BEDCATEGORYNAME: payload.bedCategoryName ?? '',
    IN_STATUS: payload.status ?? '',
    IN_MODE: Number(payload.mode ?? 0),
    IN_IPADDRESS: payload.ipAddress ?? '',
    IN_IPSOURCE: payload.ipSource ?? payload.IN_IPSOURCE ?? 'RW',

    OUT_ERRCODE: {
      dir: oracledb.BIND_OUT,
      type: oracledb.NUMBER,
    },
    OUT_ERRMSG: {
      dir: oracledb.BIND_OUT,
      type: oracledb.STRING,
      maxSize: 1000,
    },
  };

  const result = await executeProcedure({
    statement,
    binds,
    useTx: false,
  });

  const out = result.outBinds || {};

  return {
    errorCode: out.OUT_ERRCODE,
    message: out.OUT_ERRMSG,
  };
}

/**
 * Fetch bed availability summary by Hospital ID and ULB ID
 */
async function repoBedAvailabilityList(hospitalId, ulbId) {
  const sql = `
    SELECT
        H.VAR_HOSPITAL_NAME AS HOSPITAL_NAME,
        H.NUM_HOSPITAL_ID AS HOSPITAL_ID,
        B.NUM_BEDCATEGORY_ID AS BED_CATEGORY_ID,
        MAX(A.NUM_BEDAVAILABILITY_ID) AS BEDAVAIL_ID,
        NVL(B.VAR_BEDCATEGORY_NAME, 'Total') AS BED_CATEGORY,
     
        SUM(NVL(A.NUM_REGULAR_TOTAL, 0)) AS REGULAR_TOTAL,
        SUM(NVL(A.NUM_REGULAR_OCCUPIED, 0)) AS REGULAR_OCCUPIED,
        SUM(NVL(A.NUM_REGULAR_TOTAL, 0) - NVL(A.NUM_REGULAR_OCCUPIED, 0)) AS REGULAR_AVAILABLE,
     
        SUM(NVL(A.NUM_RESERVED_TOTAL, 0)) AS RESERVED_TOTAL,
        SUM(NVL(A.NUM_RESERVED_OCCUPIED, 0)) AS RESERVED_OCCUPIED,
        SUM(NVL(A.NUM_RESERVED_TOTAL, 0) - NVL(A.NUM_RESERVED_OCCUPIED, 0)) AS RESERVED_AVAILABLE,
     
        SUM(NVL(A.NUM_CONCESSIONAL_TOTAL, 0)) AS CONCESSIONAL_TOTAL,
        SUM(NVL(A.NUM_CONCESSIONAL_OCCUPIED, 0)) AS CONCESSIONAL_OCCUPIED,
        SUM(NVL(A.NUM_CONCESSIONAL_TOTAL, 0) - NVL(A.NUM_CONCESSIONAL_OCCUPIED, 0)) AS CONCESSIONAL_AVAILABLE
     
    FROM AOHA_BEDCATEGORY_MAS B
     
    LEFT JOIN AOHA_BEDAVAILABILITY_MAS A
        ON A.NUM_BEDAVAILABILITY_BEDCATEGORYID = B.NUM_BEDCATEGORY_ID
        AND A.NUM_BEDAVAILABILITY_ULBID = B.NUM_BEDCATEGORY_ULBID
        AND A.NUM_BEDAVAILABILITY_HOSPITALID = :HospitalId
        AND A.VAR_BEDAVAILABILITY_STATUS = 'Y'
     
    LEFT JOIN AOHA_HOSPITAL_MAS H
        ON H.NUM_HOSPITAL_ID = :HospitalId
        AND H.NUM_HOSPITAL_ULBID = B.NUM_BEDCATEGORY_ULBID
     
    WHERE B.NUM_BEDCATEGORY_ULBID = :ULBID
        AND B.VAR_BEDCATEGORY_STATUS = 'Y'
     
    GROUP BY GROUPING SETS
    (
        (H.VAR_HOSPITAL_NAME, H.NUM_HOSPITAL_ID, B.NUM_BEDCATEGORY_ID, B.VAR_BEDCATEGORY_NAME),
        (H.VAR_HOSPITAL_NAME, H.NUM_HOSPITAL_ID)
    )
     
    ORDER BY
        GROUPING(B.VAR_BEDCATEGORY_NAME),
        B.NUM_BEDCATEGORY_ID,
        H.NUM_HOSPITAL_ID
  `;

  const binds = {
    HospitalId: Number(hospitalId || 0),
    ULBID: Number(ulbId || 0),
  };

  const result = await executeQuery(sql, binds);
  return result.rows || [];
}

/**
 * Fetch total, occupied, and available bed counts by ULB ID
 */
async function repoBedAvailabilityCounts(ulbid) {
  const sql = `
    SELECT
        SUM(NVL(NUM_REGULAR_TOTAL, 0)
            + NVL(NUM_RESERVED_TOTAL, 0)
            + NVL(NUM_CONCESSIONAL_TOTAL, 0)) AS TOTAL_BEDS,
     
        SUM(NVL(NUM_REGULAR_OCCUPIED, 0)
            + NVL(NUM_RESERVED_OCCUPIED, 0)
            + NVL(NUM_CONCESSIONAL_OCCUPIED, 0)) AS OCCUPIED_BEDS,
     
        SUM(
            (NVL(NUM_REGULAR_TOTAL, 0) - NVL(NUM_REGULAR_OCCUPIED, 0))
            + (NVL(NUM_RESERVED_TOTAL, 0) - NVL(NUM_RESERVED_OCCUPIED, 0))
            + (NVL(NUM_CONCESSIONAL_TOTAL, 0) - NVL(NUM_CONCESSIONAL_OCCUPIED, 0))
        ) AS AVAILABLE_BEDS
     
    FROM AOHA_BEDAVAILABILITY_MAS
    WHERE NUM_BEDAVAILABILITY_ULBID = :ulbid
  `;
  const binds = { ulbid: Number(ulbid || 0) };
  const result = await executeQuery(sql, binds);
  return result.rows || [];
}

/**
 * Fetch hospital dropdown list (ID and Name) by ULB ID
 */
async function repoHospitalDropdownList(ulbid) {
  const sql = `
    SELECT a.num_hospital_id,
           a.var_hospital_name
      FROM aoha_hospital_mas a
     WHERE a.num_hospital_ulbid = :ulbid
     ORDER BY a.var_hospital_name ASC
  `;
  const binds = { ulbid: Number(ulbid || 0) };
  const result = await executeQuery(sql, binds);
  return result.rows || [];
}

/**
 * Execute stored procedure AOHA_BEDAVAILABILITY_INS
 * @param {Object} payload - Bed availability insert/update payload
 * @returns {Promise<{errorCode: number, message: string}>}
 */
async function repoBedAvailabilityIns(payload) {
  const statement = `
    BEGIN
      AOHA_BEDAVAILABILITY_INS(
        :IN_USERID,
        :IN_ID,
        :IN_ULBID,
        :IN_HOSPITALID,
        :IN_BEDCATEGORYID,
        :IN_REGULARTOTAL,
        :IN_REGULAROCCUPIED,
        :IN_RESERVEDTOTAL,
        :IN_RESERVEDOCCUPIED,
        :IN_CONCESSIONALTOTAL,
        :IN_CONCESSIONALOCCUPIED,
        :IN_STATUS,
        :IN_MODE,
        :IN_IPADDRESS,
        :IN_IPSOURCE,
        :OUT_ERRCODE,
        :OUT_ERRMSG
      );
    END;
  `;

  const binds = {
    IN_USERID: payload.userId ? String(payload.userId) : '',
    IN_ID: Number(payload.bedAvailabilityId ?? 0),
    IN_ULBID: Number(payload.ulbId ?? payload.ulbid ?? 0),
    IN_HOSPITALID: Number(payload.hospitalId ?? 0),
    IN_BEDCATEGORYID: Number(payload.bedCategoryId ?? 0),

    IN_REGULARTOTAL: Number(payload.regularTotal ?? 0),
    IN_REGULAROCCUPIED: Number(payload.regularOccupied ?? 0),

    IN_RESERVEDTOTAL: Number(payload.reservedTotal ?? 0),
    IN_RESERVEDOCCUPIED: Number(payload.reservedOccupied ?? 0),

    IN_CONCESSIONALTOTAL: Number(payload.concessionalTotal ?? 0),
    IN_CONCESSIONALOCCUPIED: Number(payload.concessionalOccupied ?? 0),

    IN_STATUS: payload.status ?? 'Y',
    IN_MODE: Number(payload.mode ?? 0),
    IN_IPADDRESS: payload.ipAddress ?? '',
    IN_IPSOURCE: payload.ipSource ?? payload.IN_IPSOURCE ?? 'RW',

    OUT_ERRCODE: {
      dir: oracledb.BIND_OUT,
      type: oracledb.NUMBER,
    },
    OUT_ERRMSG: {
      dir: oracledb.BIND_OUT,
      type: oracledb.STRING,
      maxSize: 1000,
    },
  };

  const result = await executeProcedure({
    statement,
    binds,
    useTx: false,
  });

  const out = result.outBinds || {};

  return {
    errorCode: out.OUT_ERRCODE,
    message: out.OUT_ERRMSG,
  };
}

/**
 * Fetch hospital-wise bed availability summary (Hospital ID optional)
 * @param {number|null} hospitalId - Optional Hospital ID
 * @param {number} ulbId - ULB ID (defaults to 790)
 */
async function repoHospitalBedSummary(hospitalId, ulbId) {
  const sql = `
    SELECT
        H.NUM_HOSPITAL_ID AS HOSPITAL_ID,
        H.VAR_HOSPITAL_NAME AS HOSPITAL_NAME,
        COUNT(DISTINCT A.NUM_BEDAVAILABILITY_BEDCATEGORYID) AS BED_CATEGORY_COUNT,
     
        SUM(NVL(A.NUM_REGULAR_TOTAL, 0)) AS REGULAR_TOTAL,
        SUM(NVL(A.NUM_REGULAR_OCCUPIED, 0)) AS REGULAR_OCCUPIED,
        SUM(NVL(A.NUM_REGULAR_TOTAL, 0)
            - NVL(A.NUM_REGULAR_OCCUPIED, 0)) AS REGULAR_AVAILABLE,
     
        SUM(NVL(A.NUM_RESERVED_TOTAL, 0)) AS RESERVED_TOTAL,
        SUM(NVL(A.NUM_RESERVED_OCCUPIED, 0)) AS RESERVED_OCCUPIED,
        SUM(NVL(A.NUM_RESERVED_TOTAL, 0)
            - NVL(A.NUM_RESERVED_OCCUPIED, 0)) AS RESERVED_AVAILABLE,
     
        SUM(NVL(A.NUM_CONCESSIONAL_TOTAL, 0)) AS CONCESSIONAL_TOTAL,
        SUM(NVL(A.NUM_CONCESSIONAL_OCCUPIED, 0)) AS CONCESSIONAL_OCCUPIED,
        SUM(NVL(A.NUM_CONCESSIONAL_TOTAL, 0)
            - NVL(A.NUM_CONCESSIONAL_OCCUPIED, 0)) AS CONCESSIONAL_AVAILABLE
     
    FROM AOHA_HOSPITAL_MAS H
     
    LEFT JOIN AOHA_BEDAVAILABILITY_MAS A
        ON A.NUM_BEDAVAILABILITY_HOSPITALID = H.NUM_HOSPITAL_ID
       AND A.NUM_BEDAVAILABILITY_ULBID = H.NUM_HOSPITAL_ULBID
       AND A.VAR_BEDAVAILABILITY_STATUS = 'Y'
     
    WHERE H.NUM_HOSPITAL_ULBID = :ulbId
      AND H.VAR_HOSPITAL_STATUS = 'Y'
      AND (
            :HospitalId = 0
            OR :HospitalId IS NULL
            OR H.NUM_HOSPITAL_ID = :HospitalId
          )
     
    GROUP BY
        H.NUM_HOSPITAL_ID,
        H.VAR_HOSPITAL_NAME
     
    ORDER BY
        H.VAR_HOSPITAL_NAME
  `;

  const binds = {
    ulbId: Number(ulbId || 0),
    HospitalId: Number(hospitalId || 0),
  };

  const result = await executeQuery(sql, binds);
  return result.rows || [];
}

function formatDateToDDMMYYYY(val) {
  if (!val || typeof val !== 'string') return null;
  const str = val.trim();
  if (!str) return null;

  if (/^\d{1,2}[\/-]\d{1,2}[\/-]\d{4}$/.test(str)) {
    const parts = str.split(/[\/-]/);
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];
    return `${day}/${month}/${year}`;
  }

  if (/^\d{4}[\/-]\d{1,2}[\/-]\d{1,2}$/.test(str)) {
    const parts = str.split(/[\/-]/);
    const year = parts[0];
    const month = parts[1].padStart(2, '0');
    const day = parts[2].padStart(2, '0');
    return `${day}/${month}/${year}`;
  }

  return str;
}

/**
 * Fetch bed availability update history/audit log
 * @param {Object} filters
 * @param {number|null} filters.hospitalId
 * @param {string|null} filters.fromDate
 * @param {string|null} filters.toDate
 * @param {string|null} filters.userId
 * @param {number} filters.ulbId
 */
async function repoBedAvailabilityLog({ hospitalId, fromDate, toDate, userId, ulbId } = {}) {
  const sql = `
    SELECT
        L.DAT_BEDAVAILABILITY_LOGDT AS ACTIVITY_DATE,
        H.VAR_HOSPITAL_NAME AS HOSPITAL,
        B.VAR_BEDCATEGORY_NAME AS CATEGORY,
        L.NUM_REGULAR_OCCUPIED AS OLD_OCCUPIED,
        M.NUM_REGULAR_OCCUPIED AS CURRENT_OCCUPIED,
        L.VAR_BEDAVAILABILITY_LOGUSER AS USER_ID
    FROM AOHA_BEDAVAILABILITY_MAS_LOG L
    LEFT JOIN AOHA_HOSPITAL_MAS H
        ON H.NUM_HOSPITAL_ID = L.NUM_BEDAVAILABILITY_HOSPITALID
       AND H.NUM_HOSPITAL_ULBID = L.NUM_BEDAVAILABILITY_ULBID
    LEFT JOIN AOHA_BEDCATEGORY_MAS B
        ON B.NUM_BEDCATEGORY_ID = L.NUM_BEDAVAILABILITY_BEDCATEGORYID
       AND B.NUM_BEDCATEGORY_ULBID = L.NUM_BEDAVAILABILITY_ULBID
    LEFT JOIN AOHA_BEDAVAILABILITY_MAS M
        ON M.NUM_BEDAVAILABILITY_ID = L.NUM_BEDAVAILABILITY_ID
       AND M.NUM_BEDAVAILABILITY_ULBID = L.NUM_BEDAVAILABILITY_ULBID
    WHERE L.NUM_BEDAVAILABILITY_ULBID = :ulbId
      AND (:HospitalId IS NULL
           OR :HospitalId = 0
           OR L.NUM_BEDAVAILABILITY_HOSPITALID = :HospitalId)
      AND (:FromDate IS NULL
           OR L.DAT_BEDAVAILABILITY_LOGDT >= TO_DATE(:FromDate, 'DD/MM/YYYY'))
      AND (:ToDate IS NULL
           OR L.DAT_BEDAVAILABILITY_LOGDT < TO_DATE(:ToDate, 'DD/MM/YYYY') + 1)
      AND (:UserId IS NULL
           OR L.VAR_BEDAVAILABILITY_LOGUSER = :UserId)
    ORDER BY L.DAT_BEDAVAILABILITY_LOGDT DESC NULLS LAST
  `;

  const formattedFrom = formatDateToDDMMYYYY(fromDate);
  const formattedTo = formatDateToDDMMYYYY(toDate);
  const cleanUserId = (userId && String(userId).trim() !== '' && String(userId).toLowerCase() !== 'all') ? String(userId).trim() : null;
  const numHospitalId = (hospitalId && Number(hospitalId) > 0) ? Number(hospitalId) : null;

  const binds = {
    ulbId: Number(ulbId || 790),
    HospitalId: {
      val: numHospitalId,
      type: oracledb.NUMBER,
    },
    FromDate: {
      val: formattedFrom,
      type: oracledb.STRING,
    },
    ToDate: {
      val: formattedTo,
      type: oracledb.STRING,
    },
    UserId: {
      val: cleanUserId,
      type: oracledb.STRING,
    },
  };

  const result = await executeQuery(sql, binds);
  return result.rows || [];
}

/**
 * Fetch user dropdown list (User ID and Username) by ULB ID
 * @param {number} ulbid - ULB ID (defaults to 790)
 */
async function repoUserDropdownList(ulbid) {
  const sql = `
    SELECT
        num_user_userid,
        var_user_username
    FROM admins.aoma_user_def
    WHERE num_user_ulbid = :ulbid
    ORDER BY var_user_username ASC
  `;

  const binds = { ulbid: Number(ulbid || 790) };
  const result = await executeQuery(sql, binds);
  return result.rows || [];
}

module.exports = {
  repoHospitalList,
  repoHospitalById,
  repoHospitalIns,
  repoBedCategoryList,
  repoBedCategoryIns,
  repoBedAvailabilityList,
  repoBedAvailabilityCounts,
  repoHospitalDropdownList,
  repoBedAvailabilityIns,
  repoHospitalBedSummary,
  repoBedAvailabilityLog,
  repoUserDropdownList,
};


