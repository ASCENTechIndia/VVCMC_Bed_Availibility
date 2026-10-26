const { executeQuery } = require('../../db/queryExecutor');

/**
 * Fetch hospital update status by ULB ID
 * Query joins aoha_hospital_mas with aoha_bedavailability_mas to get latest dat_bedavailability_upddt
 * @param {number} ulbid - ULB ID
 */
async function repoHospitalUpdateStatus(ulbid) {
  const sql = `
    SELECT
        h.num_hospital_id,
        h.var_hospital_name,
        h.var_hospital_address,
        h.var_hospital_area_ward,
        MAX(ba.dat_bedavailability_upddt) AS dat_bedavailability_upddt,
        CASE
            WHEN TRUNC(MAX(ba.dat_bedavailability_upddt)) = TRUNC(SYSDATE) THEN 'Y'
            ELSE 'N'
        END AS is_updated_today
    FROM aoha_hospital_mas h
    LEFT JOIN aoha_bedavailability_mas ba
        ON ba.num_bedavailability_hospitalid = h.num_hospital_id
       AND ba.num_bedavailability_ulbid = h.num_hospital_ulbid
       AND ba.var_bedavailability_status = 'Y'
    WHERE (:ulbid = 0 OR h.num_hospital_ulbid = :ulbid)
      AND h.var_hospital_status = 'Y'
    GROUP BY
        h.num_hospital_id,
        h.var_hospital_name,
        h.var_hospital_address,
        h.var_hospital_area_ward
    ORDER BY
        h.var_hospital_name ASC
  `;

  const binds = {
    ulbid: Number(ulbid || 0),
  };

  const result = await executeQuery(sql, binds);
  return result.rows || [];
}

module.exports = {
  repoHospitalUpdateStatus,
};
