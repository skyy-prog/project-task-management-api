const env = require('./config/env');
const app = require('./app');
const { connectMySQL, closeMySQL } = require('./config/mysql');
const { connectMongo, closeMongo } = require('./config/mongo');

const SHUTDOWN_TIMEOUT_MS = 10000;

const start = async () => {
  await connectMySQL();
  await connectMongo();

  const server = app.listen(env.port, () => {
    console.log(`Server running in ${env.nodeEnv} mode on port ${env.port}`);
  });

  const shutdown = (signal) => {
    console.log(`${signal} received, shutting down gracefully`);

    const forceExit = setTimeout(() => process.exit(1), SHUTDOWN_TIMEOUT_MS);
    forceExit.unref();

    server.close(async () => {
      try {
        await Promise.all([closeMySQL(), closeMongo()]);
        process.exit(0);
      } catch (err) {
        console.error('Error during shutdown', err);
        process.exit(1);
      }
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
};

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection', reason);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception', err);
  process.exit(1);
});

start().catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});
