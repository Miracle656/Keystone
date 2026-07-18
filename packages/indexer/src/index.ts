import { startServer } from "./server.js";
import { runIngestLoop } from "./ingest.js";
import { runReserveSnapshotLoop } from "./reserve-snapshot.js";
import { logger } from "./lib/logger.js";

startServer();

runIngestLoop().catch((err) => {
  logger.error({ err }, "ingest loop crashed");
  process.exit(1);
});

runReserveSnapshotLoop().catch((err) => {
  logger.error({ err }, "reserve snapshot loop crashed");
  process.exit(1);
});
