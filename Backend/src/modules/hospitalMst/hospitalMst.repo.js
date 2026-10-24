const { executeQuery } = require('../../db/queryExecutor');

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

module.exports = {
  repoHospitalList,
  repoHospitalById,
};
