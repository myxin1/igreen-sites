import { logger } from "../utils/logger.js";
import { WordPressClient } from "../wordpress/client.js";
import { runSetupAudit } from "../wordpress/plugin-checker.js";

export async function applyRankMathAudit(client: WordPressClient): Promise<void> {
  const summary = await runSetupAudit(client);

  logger.info(
    `Rank Math REST meta ${summary.rankMathMetaWritable ? "disponivel" : "indisponivel"} para escrita automatica.`,
  );
  logger.info(`Tema: ${summary.themeMessage}`);
}
