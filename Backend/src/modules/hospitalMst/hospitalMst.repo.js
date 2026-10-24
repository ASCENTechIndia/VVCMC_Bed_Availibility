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
async function repoHospitalById(hospitalId, ulbId ) {
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
    IN_USERID: payload.userId ? String(payload.userId) :  '',
    IN_ID: Number(payload.hospitalId),
    IN_ULBID: Number(payload.ulbId),
    IN_HOSPITALNAME: payload.hospitalName,
    IN_HOSPITALTYPE: payload.hospitalType,
    IN_ADDRESS: payload.address,
    IN_AREAWARD: payload.areaWard,
    IN_PINCODE: payload.pincode ,
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
    IN_ULBID: Number(payload.ulbId  ?? 0),
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

module.exports = {
  repoHospitalList,
  repoHospitalById,
  repoHospitalIns,
  repoBedCategoryList,
  repoBedCategoryIns,
};
