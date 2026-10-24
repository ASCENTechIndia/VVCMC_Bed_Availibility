const { createApp } = require('./src/app');
const { config } = require('./src/config/env');
const { initOraclePool, closeOraclePool } = require('./src/db/oracle');
const { logger } = require('./src/utils/logger');

async function bootstrap() {
  try {
    await initOraclePool();

    const app = createApp();
    const server = app.listen(config.port, () => {
      logger.info({ port: config.port, env: config.nodeEnv }, 'Server started');
    });

    server.on('error', async (error) => {
      if (error.code === 'EADDRINUSE') {
        logger.error({ port: config.port }, 'Port already in use. Set a different PORT or stop the existing process.');
      } else {
        logger.error({ err: error }, 'Server failed to start');
      }

      await closeOraclePool();
      process.exit(1);
    });

    const shutdown = async (signal) => {
      logger.info({ signal }, 'Shutting down gracefully');
      server.close(async () => {
        await closeOraclePool();
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    logger.error({ err: error }, 'Failed to start server');
    process.exit(1);
  }
}

bootstrap();
