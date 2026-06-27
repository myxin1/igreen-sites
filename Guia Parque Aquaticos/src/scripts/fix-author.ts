/**
 * Atribui todos os posts do silo a um autor WordPress específico.
 *
 * O Google usa o autor dos posts como sinal de E-E-A-T. Posts publicados
 * pelo usuário "admin" ou "ClaudeBot" precisam ser migrados para o autor
 * editorial real (ex: "Daniel Martins") antes de iniciar link building.
 *
 * Uso:
 *   npm run fix-author              → lista usuários e mostra autor atual dos posts
 *   npm run fix-author -- --apply   → aplica a atribuição ao primeiro autor não-admin encontrado
 *   npm run fix-author -- --user 5  → atribui ao usuário com ID 5
 *
 * Run: npm run fix-author
 */

import { logger } from "../utils/logger.js";
import { SILO_PAGES } from "../content/silo.js";
import { WordPressClient } from "../wordpress/client.js";
import { findPostBySlug } from "../wordpress/posts.js";

interface WpUser {
  id: number;
  name: string;
  slug: string;
  roles?: string[];
}

interface WpPost {
  id: number;
  slug: string;
  author: number;
}

const DRY_RUN = !process.argv.includes("--apply");
const FORCED_USER_ID = (() => {
  const idx = process.argv.indexOf("--user");
  if (idx !== -1 && process.argv[idx + 1]) {
    return parseInt(process.argv[idx + 1], 10);
  }
  return null;
})();

async function listUsers(client: WordPressClient): Promise<WpUser[]> {
  const users = await client.maybeRequest<WpUser[]>("wp/v2/users", {
    query: { per_page: 50 },
    expectedStatus: [200],
  });
  return users ?? [];
}

function pickEditorialUser(users: WpUser[]): WpUser | null {
  // Prefer users that are not pure admin slugs
  const nonAdmin = users.filter(
    (u) => !["admin", "claudebot", "wordpress"].includes(u.slug.toLowerCase()),
  );
  return nonAdmin[0] ?? users[0] ?? null;
}

async function main(): Promise<void> {
  const client = new WordPressClient();

  // ── List available users ──────────────────────────────────────────────────
  const users = await listUsers(client);
  if (users.length === 0) {
    logger.warn(
      "Nenhum usuario encontrado via REST API. " +
        "Verifique se a conta tem permissao de leitura de usuarios.",
    );
    return;
  }

  logger.info("\nUsuarios encontrados no WordPress:");
  for (const u of users) {
    logger.info(`  ID ${u.id}  slug: ${u.slug}  nome: ${u.name}`);
  }

  // ── Resolve target author ─────────────────────────────────────────────────
  let targetUser: WpUser | null = null;
  if (FORCED_USER_ID !== null) {
    targetUser = users.find((u) => u.id === FORCED_USER_ID) ?? null;
    if (!targetUser) {
      logger.error(`Usuario com ID ${FORCED_USER_ID} nao encontrado.`);
      process.exitCode = 1;
      return;
    }
  } else {
    targetUser = pickEditorialUser(users);
  }

  if (!targetUser) {
    logger.error("Nenhum usuario editorial encontrado. Use --user <id> para forcar.");
    process.exitCode = 1;
    return;
  }

  logger.info(
    `\nAutor editorial selecionado: ${targetUser.name} (ID ${targetUser.id}, slug: ${targetUser.slug})`,
  );

  if (DRY_RUN) {
    logger.info(
      "\n[DRY RUN] Nenhuma alteracao sera feita. " +
        "Execute com --apply para atribuir os posts a este autor.\n",
    );
  }

  // ── Check and update posts ────────────────────────────────────────────────
  let updated = 0;
  let alreadyCorrect = 0;

  for (const page of SILO_PAGES) {
    const post = await findPostBySlug(client, page.slug) as WpPost | null;
    if (!post) {
      logger.warn(`Post nao encontrado: ${page.slug}`);
      continue;
    }

    if (post.author === targetUser.id) {
      alreadyCorrect++;
      continue;
    }

    if (DRY_RUN) {
      logger.info(`[DRY RUN] Atualizaria autor de "${page.slug}" (atual: ID ${post.author} → novo: ID ${targetUser.id})`);
      updated++;
      continue;
    }

    await client.request(`wp/v2/posts/${post.id}`, {
      method: "POST",
      body: { author: targetUser.id },
      expectedStatus: [200],
    });

    logger.info(`Autor atualizado: ${page.slug} → ${targetUser.name}`);
    updated++;
  }

  logger.info(
    `\nResultado: ${updated} posts ${DRY_RUN ? "seriam atualizados" : "atualizados"}, ` +
      `${alreadyCorrect} ja estavam corretos.`,
  );
}

main().catch((error) => {
  logger.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
