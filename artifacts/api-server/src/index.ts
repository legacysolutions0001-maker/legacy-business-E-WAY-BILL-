import app from "./app";
import { logger } from "./lib/logger";
import { runMigrationsAndSeed } from "./migrate";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// Start listening immediately so health checks pass on Render
app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening — running migrations in background");

  // Run migrations after server is up so health checks pass
  runMigrationsAndSeed()
    .then(() => {
      logger.info("Migrations complete — server fully ready");
    })
    .catch((err) => {
      logger.error({ err }, "Migration failed — server still running but DB may be uninitialized");
    });
});
