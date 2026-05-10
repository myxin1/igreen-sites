import { env } from "../config/env.js";
import { updateRoadmapTasks } from "../roadmap/service.js";
import { runSetupAudit } from "../wordpress/plugin-checker.js";
import { WordPressClient } from "../wordpress/client.js";
import { ensureContactForm } from "../wordpress/contact-form.js";
import { logger } from "../utils/logger.js";

async function main(): Promise<void> {
  const client = new WordPressClient();
  const summary = await runSetupAudit(client);

  logger.info(`REST API pronta: ${summary.restReady}`);
  logger.info(`Application Passwords expostas: ${summary.applicationPasswordsAvailable}`);
  logger.info(`Endpoint de plugins disponivel: ${summary.pluginsEndpointAvailable}`);
  logger.info(`Endpoint de temas disponivel: ${summary.themesEndpointAvailable}`);
  logger.info(`Rank Math gravavel via REST: ${summary.rankMathMetaWritable}`);
  logger.info(
    `Rank Math fields: title=${summary.rankMathWritableFields.title}, description=${summary.rankMathWritableFields.description}, focus=${summary.rankMathWritableFields.focusKeyword}, schema=${summary.rankMathWritableFields.schemaType}`,
  );
  logger.info(
    `42flows schema fields: delivered=${summary.flowsWritableFields.delivered}, schemas=${summary.flowsWritableFields.schemas}`,
  );
  logger.info(summary.themeMessage);

  for (const plugin of summary.plugins) {
    logger.info(`Plugin ${plugin.name}: ${plugin.status}`);
  }

  await ensureContactForm(client);

  const allRequiredPluginsActive = summary.plugins.every((plugin) => plugin.status === "active");
  await updateRoadmapTasks({
    "conexao wordpress": summary.restReady && summary.applicationPasswordsAvailable,
    "instalacao plugins": allRequiredPluginsActive,
    "configuracao rankmath": summary.rankMathMetaWritable && summary.schemaAutomationWritable,
    "validacao SEO": false,
  });

  if (!summary.rankMathMetaWritable) {
    logger.warn("Rank Math ainda nao esta pronto para escrita via REST. O bridge/plugin auxiliar continua necessario.");
  }

  if (!env.dryRun && !allRequiredPluginsActive) {
    logger.warn("Nem todos os plugins obrigatorios ficaram ativos. Verifique permissoes e o painel do WordPress.");
  }
}

main().catch((error) => {
  logger.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
