const oracledb = require("oracledb");
const env = require("./env");

oracledb.outFormat =
  oracledb.OUT_FORMAT_OBJECT;

oracledb.fetchAsString = [
  oracledb.CLOB
];

let pool = null;


// Create connection pool
async function initDB() {

  if (pool) {
    return pool;
  }

  pool = await oracledb.createPool({
    user: env.DB_USER,

    password: env.DB_PASSWORD,

    connectString:
      env.DB_CONNECT_STRING,

    poolMin:
      env.config?.oracle?.poolMin || 2,

    poolMax:
      env.config?.oracle?.poolMax || 20,

    poolIncrement:
      env.config?.oracle?.poolIncrement || 2,

    poolTimeout:
      env.config?.oracle?.poolTimeout || 60,
  });

  console.log(
    "Oracle pool created successfully"
  );

  return pool;
}


// Get connection
async function getConnection() {

  if (!pool) {
    await initDB();
  }

  return await pool.getConnection();
}


// Close pool
async function closeDBPool() {

  if (pool) {

    await pool.close(10);

    console.log(
      "Oracle pool closed"
    );

    pool = null;
  }
}


module.exports = {
  initDB,
  getConnection,
  closeDBPool
};