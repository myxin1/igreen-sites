import { ensureRoadmapFile } from "../roadmap/service.js";
import { logger } from "../utils/logger.js";

async function main(): Promise<void> {
  await ensureRoadmapFile();
  logger.info(`Roadmap sincronizado em ${process.cwd()}\\roadmap.md.`);
}

main().catch((error) => {
  logger.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
