/**
 * Cria redirects 301 no Rank Math para os 4 slugs alterados durante o refino de SEO.
 *
 * Como funciona: localiza cada post pelo slug ANTIGO, obtém o ID e usa o endpoint
 * rankmath/v1/updateRedirection para anexar um 301 apontando para o slug NOVO.
 * O post antigo permanece no WordPress redirecionando automaticamente.
 *
 * Pré-requisito: módulo Redirections do Rank Math ativo.
 * Habilitar em: Rank Math → Dashboard → Modules → Redirections → ON
 *
 * Run: npm run redirects
 */

import { logger } from "../utils/logger.js";
import { WordPressClient } from "../wordpress/client.js";
import { findPostBySlug } from "../wordpress/posts.js";

const SLUG_REDIRECTS: Array<{ label: string; oldSlug: string; newUrl: string }> = [
  {
    label: "Como Chegar",
    oldSlug: "como-chegar-aldeia-das-aguas",
    newUrl: "/como-chegar-na-aldeia-das-aguas/",
  },
  {
    label: "Atrações",
    oldSlug: "atracoes-aldeia-das-aguas",
    newUrl: "/atracoes-da-aldeia-das-aguas/",
  },
  {
    label: "Horário",
    oldSlug: "aldeia-das-aguas-horario",
    newUrl: "/aldeia-das-aguas-horario-de-funcionamento/",
  },
  {
    label: "Onde Ficar",
    oldSlug: "onde-ficar-aldeia-das-aguas",
    newUrl: "/onde-ficar-perto-da-aldeia-das-aguas/",
  },
];

async function applyRedirect(
  client: WordPressClient,
  oldSlug: string,
  newUrl: string,
): Promise<boolean> {
  const post = await findPostBySlug(client, oldSlug);
  if (!post) {
    logger.warn(`Post nao encontrado no WordPress: /${oldSlug}/`);
    return false;
  }

  const result = await client.maybeRequest<{ success?: boolean; redirectionID?: number } | null>(
    "rankmath/v1/updateRedirection",
    {
      method: "POST",
      body: {
        objectID: post.id,
        objectType: "post",
        hasRedirect: true,
        redirectionUrl: newUrl,
        redirectionType: "301",
      },
      expectedStatus: [200],
    },
  );

  return result !== null;
}

async function main(): Promise<void> {
  const client = new WordPressClient();
  let created = 0;
  const manual: typeof SLUG_REDIRECTS = [];

  logger.info("Iniciando criacao de redirects 301 no Rank Math...");

  for (const redirect of SLUG_REDIRECTS) {
    const ok = await applyRedirect(client, redirect.oldSlug, redirect.newUrl);

    if (ok) {
      logger.info(`[OK] ${redirect.label}: /${redirect.oldSlug}/ → ${redirect.newUrl}`);
      created++;
    } else {
      logger.warn(`[FALHOU] ${redirect.label}: /${redirect.oldSlug}/ → ${redirect.newUrl}`);
      manual.push(redirect);
    }
  }

  logger.info(`\nResultado: ${created} criados, ${manual.length} falhos.`);

  if (manual.length > 0) {
    logger.warn(
      "\nRedirects que precisam ser criados manualmente:\n" +
        "Rank Math → Redirections → Add New\n\n" +
        manual.map((r) => `  /${r.oldSlug}/  →  ${r.newUrl}  (301)`).join("\n"),
    );
  }
}

main().catch((error) => {
  logger.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
