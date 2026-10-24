const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const cookieParser = require("cookie-parser");
const { config, validateConfig } = require('./config/env');
const routes = require('./routes');
const { notFoundHandler, errorHandler } = require('./middleware/error-handler');
const { attachResponseHelpers } = require('./libs/response');

function createApp() {
  validateConfig();

  const app = express();

  app.use(helmet());
 const allowedOrigins = [
   "http://localhost:5173",
  "https://ctpt.nagarkaryavalinewuat.com",
  "https://nagarkaryavalinewuat.com",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin not allowed: ${origin}`));
      }
    },
    credentials: true,
  })
);
  app.use(cookieParser());

  app.use(compression());
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(attachResponseHelpers);
  // app.use(
  //   rateLimit({
  //     windowMs: config.rateLimitWindowMs,
  //     max: config.rateLimitMax,
  //     standardHeaders: true,
  //     legacyHeaders: false,
  //   })
  // );

  app.use('/api', routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = {
  createApp,
};
