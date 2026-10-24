const dotenv = require("dotenv");
dotenv.config();

function must(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing env var: ${name}`);
  }

  return value;
}

function asInt(value, fallback) {
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

const config = {
  nodeEnv: process.env.NODE_ENV || "development",

  port: asInt(process.env.PORT, 5000),

  corsOrigin: process.env.CORS_ORIGIN || "*",

  jwtSecret: must("JWT_SECRET"),

  loginEncryptionKey: must("LOGIN_ENCRYPTION_KEY"),

  jwtExpiresIn:
    process.env.JWT_EXPIRES_IN || "12h",

  oracle: {
    user: must("DB_USER"),

    password: must("DB_PASSWORD"),

    host: must("DB_HOST"),

    port: asInt(process.env.DB_PORT, 1521),

    serviceName: must("DB_SERVICE_NAME"),

    connectString: must("DB_CONNECT_STRING"),

    poolMin:
      asInt(process.env.ORACLE_POOL_MIN, 2),

    poolMax:
      asInt(process.env.ORACLE_POOL_MAX, 20),

    poolIncrement:
      asInt(process.env.ORACLE_POOL_INCREMENT, 2),

    poolTimeout:
      asInt(process.env.ORACLE_POOL_TIMEOUT, 60),
  }
};

function validateConfig() {
  const missing = [];

  if (!config.oracle.user)
    missing.push("DB_USER");

  if (!config.oracle.password)
    missing.push("DB_PASSWORD");

  if (!config.oracle.connectString)
    missing.push("DB_CONNECT_STRING");

  if (!config.jwtSecret)
    missing.push("JWT_SECRET");

  if (!config.loginEncryptionKey)
    missing.push("LOGIN_ENCRYPTION_KEY");

  if (missing.length > 0) {
    throw new Error(
      `Missing configuration: ${missing.join(", ")}`
    );
  }
}

module.exports = {
  PORT: config.port,
  DB_USER: config.oracle.user,
  DB_PASSWORD: config.oracle.password,
  DB_HOST: config.oracle.host,
  DB_PORT: config.oracle.port,
  DB_SERVICE_NAME: config.oracle.serviceName,
  DB_CONNECT_STRING:config.oracle.connectString,
  JWT_SECRET: config.jwtSecret,
  LOGIN_ENCRYPTION_KEY:config.loginEncryptionKey,
  NODE_ENV: config.nodeEnv,
  config,

  validateConfig
};