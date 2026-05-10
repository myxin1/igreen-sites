import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";
import type { ContactFormRecord } from "./types.js";
import { WordPressClient } from "./client.js";
import { findPageBySlug } from "./pages.js";

const DEFAULT_FORM_MARKUP = `<label>Seu nome\n    [text* your-name autocomplete:name placeholder "Como voc&ecirc; gostaria de ser chamado?"]\n</label>\n\n<label>Seu e-mail\n    [email* your-email autocomplete:email placeholder "voce@exemplo.com"]\n</label>\n\n<label>Assunto\n    [text your-subject placeholder "Ex.: corre&ccedil;&atilde;o editorial, sugest&atilde;o de pauta, parceria"]\n</label>\n\n<label>Sua mensagem\n    [textarea* your-message placeholder "Conte com o m&aacute;ximo de contexto poss&iacute;vel para acelerar a resposta."]\n</label>\n\n[submit "Enviar mensagem"]`;

function contactFormAuthHeader(): string {
  return `Basic ${Buffer.from(`${env.wordpressUsername}:${env.wordpressAppPassword}`).toString("base64")}`;
}

async function updateContactForm(
  formId: number,
  title = "Contato",
): Promise<void> {
  if (env.dryRun) {
    logger.info(`[DRY RUN] Atualizaria o formulario ${formId} do Contact Form 7.`);
    return;
  }

  const body = new URLSearchParams();
  body.set("title", title);
  body.set("form", DEFAULT_FORM_MARKUP);

  const response = await fetch(`${env.wordpressUrl}/wp-json/contact-form-7/v1/contact-forms/${formId}`, {
    method: "POST",
    headers: {
      Authorization: contactFormAuthHeader(),
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    logger.warn(`Nao foi possivel atualizar o formulario ${formId} (${response.status}): ${errorBody}`);
  }
}

export async function ensureContactForm(client: WordPressClient): Promise<string | null> {
  const forms = await client.maybeRequest<ContactFormRecord[]>(
    "contact-form-7/v1/contact-forms",
    {
      expectedStatus: [200],
    },
  );

  if (!forms) {
    logger.warn("Contact Form 7 REST route indisponivel. A pagina /contato/ usara shortcode placeholder.");
    return null;
  }

  const existing = forms.find((form) => (form.title ?? "").toLowerCase() === "contato");
  if (existing?.id) {
    await updateContactForm(existing.id);
    return `[contact-form-7 id="${existing.id}" title="Contato"]`;
  }

  if (env.dryRun) {
    logger.info("[DRY RUN] Criaria formulario Contato no Contact Form 7.");
    return `[contact-form-7 id="0" title="Contato"]`;
  }

  const createBody = new URLSearchParams();
  createBody.set("title", "Contato");
  createBody.set("form", DEFAULT_FORM_MARKUP);

  const createResponse = await fetch(`${env.wordpressUrl}/wp-json/contact-form-7/v1/contact-forms`, {
    method: "POST",
    headers: {
      Authorization: contactFormAuthHeader(),
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
    body: createBody.toString(),
  });

  const created = createResponse.ok
    ? ((await createResponse.json()) as ContactFormRecord)
    : null;

  if (!created?.id) {
    const fallback = forms[0];
    if (fallback?.id) {
      logger.warn(`Nao foi possivel criar o formulario Contato. Atualizando o formulario existente ID ${fallback.id}.`);
      await updateContactForm(fallback.id, fallback.title ?? "Contato");
      return `[contact-form-7 id="${fallback.id}" title="${fallback.title ?? "Contato"}"]`;
    }
    return null;
  }

  return `[contact-form-7 id="${created.id}" title="Contato"]`;
}

export async function ensureContactPage(
  client: WordPressClient,
  shortcode: string | null,
): Promise<void> {
  const content = shortcode
    ? `<h1>Contato</h1><p>Use o formulário abaixo para falar com a equipe do Guia Parques Aquáticos.</p>${shortcode}`
    : `<h1>Contato</h1><p>Instale e configure o Contact Form 7 para substituir este placeholder.</p><p>[contact-form-7 id="" title="Contato"]</p>`;

  const existing = await findPageBySlug(client, "contato");

  if (env.dryRun) {
    logger.info("[DRY RUN] Criaria ou atualizaria a pagina /contato/.");
    return;
  }

  if (existing) {
    await client.request(`wp/v2/pages/${existing.id}`, {
      method: "POST",
      body: {
        title: "Contato",
        slug: "contato",
        status: "publish",
        content,
      },
      expectedStatus: [200],
    });
    return;
  }

  await client.request("wp/v2/pages", {
    method: "POST",
    body: {
      title: "Contato",
      slug: "contato",
      status: "publish",
      content,
    },
    expectedStatus: [201],
  });
}
