import app from "./app";
import { logger } from "./lib/logger";

const port = Number(process.env["PORT"] ?? 3001);

if (Number.isNaN(port) || port <= 0) {
  logger.error(`Invalid PORT value: "${process.env["PORT"]}"`);
  process.exit(1);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error starting server");
    process.exit(1);
  }
  logger.info({ port }, "AERISYN API server listening");
});
