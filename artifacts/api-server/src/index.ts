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

// Start listening immediately so Render health checks pass
app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening — running migrations");

  runMigrationsAndSeed()
    .then(() => {
      logger.info("Startup migrations complete — fully ready");
    })
    .catch((migrateErr) => {
      // Log but don't crash — server stays up, routes will fail gracefully
      logger.error(
        { err: migrateErr, message: String(migrateErr?.message), stack: String(migrateErr?.stack) },
        "Migration error (non-fatal)",
      );
    });
});
