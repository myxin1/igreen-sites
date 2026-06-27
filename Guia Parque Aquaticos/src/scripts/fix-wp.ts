/**
 * Applies WordPress-level SEO fixes that cannot be done via content publishing:
 *  1. Updates Rank Math's og:site_name via the custom REST endpoint in the PHP bridge
 *  2. Verifies the PHP bridge plugin is active (warns if not)
 *
 * Run standalone: npm run fix-wp
 * Or called automatically as part of the full publish pipeline.
 */

import { SITE_NAME } from "../config/site.js";
import { logger } from "../utils/logger.js";
import { WordPressClient } from "../wordpress/client.js";

export async function applyWordPressFixes(client: WordPressClient): Promise<void> {
  await fixRankMathSiteName(client);
}

async function fixRankMathSiteName(client: WordPressClient): Promise<void> {
  try {
    const result = await client.request<{ success: boolean; settings: Record<string, string> }>(
      "42flows/v1/rank-math-settings",
      {
        method: "POST",
        body: { website_name: SITE_NAME },
        expectedStatus: [200],
      },
    );

    if (result.success) {
      logger.info(`Rank Math website_name atualizado para: ${SITE_NAME}`);
    }
  } catch (err) {
    logger.warn(
      `Nao foi possivel atualizar Rank Math website_name via REST. ` +
      `Verifique se o plugin 'Guia Parques Aquáticos - REST Bridge' (v2.0.0) esta ativo no WordPress. ` +
      `Erro: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

// ── Standalone entrypoint (only runs when executed directly, not on import) ──

import { fileURLToPath } from "node:url";

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const client = new WordPressClient();
  applyWordPressFixes(client)
    .then(() => logger.info("Correcoes WordPress concluidas."))
    .catch((error) => {
      logger.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    });
}
