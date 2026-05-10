import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";
import { WordPressClient } from "./client.js";

export interface WordPressMenu {
  id: number;
  name: string;
  slug: string;
}

export interface WordPressMenuItem {
  id: number;
  menus: number;
  object_id?: number;
  title?: { rendered?: string };
}

export interface WordPressSidebar {
  id: string;
  name: string;
  status: string;
  widgets: string[];
}

export interface WordPressWidget {
  id: string;
  id_base: string;
  sidebar: string;
  instance?: {
    raw?: Record<string, unknown>;
  };
}

type MenuObjectType = "post" | "page";

export async function ensureMenu(
  client: WordPressClient,
  name: string,
  slug: string,
): Promise<WordPressMenu> {
  const menus = await client.request<WordPressMenu[]>("wp/v2/menus", {
    query: { context: "edit", per_page: 100 },
  });
  const existing = menus.find((menu) => menu.slug === slug || menu.name === name);
  if (existing) {
    return existing;
  }

  if (env.dryRun) {
    logger.info(`[DRY RUN] Criaria menu ${name}.`);
    return { id: 0, name, slug };
  }

  return client.request<WordPressMenu>("wp/v2/menus", {
    method: "POST",
    body: { name, slug },
    expectedStatus: [201],
  });
}

export async function listMenuItems(
  client: WordPressClient,
  menuId: number,
): Promise<WordPressMenuItem[]> {
  return client.request<WordPressMenuItem[]>("wp/v2/menu-items", {
    query: { context: "edit", per_page: 100, menus: menuId },
  });
}

export async function clearMenu(client: WordPressClient, menuId: number): Promise<void> {
  const items = await listMenuItems(client, menuId);
  for (const item of items) {
    if (env.dryRun) {
      logger.info(`[DRY RUN] Removeria item ${item.id} do menu ${menuId}.`);
      continue;
    }

    await client.request(`wp/v2/menu-items/${item.id}`, {
      method: "DELETE",
      query: { force: true },
      expectedStatus: [200],
    });
  }
}

export async function createContentMenuItem(
  client: WordPressClient,
  menuId: number,
  object: MenuObjectType,
  objectId: number,
  title: string,
  order: number,
): Promise<void> {
  if (env.dryRun) {
    logger.info(`[DRY RUN] Criaria item ${title} no menu ${menuId}.`);
    return;
  }

  await client.request("wp/v2/menu-items", {
    method: "POST",
    body: {
      title,
      type: "post_type",
      object,
      object_id: objectId,
      menus: menuId,
      status: "publish",
      menu_order: order,
    },
    expectedStatus: [201],
  });
}

export async function createPostMenuItem(
  client: WordPressClient,
  menuId: number,
  postId: number,
  title: string,
  order: number,
): Promise<void> {
  return createContentMenuItem(client, menuId, "post", postId, title, order);
}

export async function createPageMenuItem(
  client: WordPressClient,
  menuId: number,
  pageId: number,
  title: string,
  order: number,
): Promise<void> {
  return createContentMenuItem(client, menuId, "page", pageId, title, order);
}

export async function assignMenuLocations(
  client: WordPressClient,
  menuId: number,
  locations: string[],
): Promise<void> {
  if (env.dryRun) {
    logger.info(`[DRY RUN] Vincularia menu ${menuId} as localizacoes: ${locations.join(", ")}.`);
    return;
  }

  await client.request(`wp/v2/menus/${menuId}`, {
    method: "POST",
    body: { locations },
    expectedStatus: [200],
  });
}

export async function listSidebars(client: WordPressClient): Promise<WordPressSidebar[]> {
  return client.request<WordPressSidebar[]>("wp/v2/sidebars", {
    query: { context: "edit", per_page: 100 },
  });
}

export async function listWidgets(
  client: WordPressClient,
  sidebar?: string,
): Promise<WordPressWidget[]> {
  return client.request<WordPressWidget[]>("wp/v2/widgets", {
    query: { context: "edit", per_page: 100, sidebar },
  });
}

export async function deleteWidget(client: WordPressClient, widgetId: string): Promise<void> {
  if (env.dryRun) {
    logger.info(`[DRY RUN] Removeria widget ${widgetId}.`);
    return;
  }

  await client.request(`wp/v2/widgets/${widgetId}`, {
    method: "DELETE",
    expectedStatus: [200],
  });
}

async function updateSidebarWidgets(
  client: WordPressClient,
  sidebar: string,
  widgets: string[],
): Promise<void> {
  if (env.dryRun) {
    logger.info(`[DRY RUN] Atualizaria widgets da sidebar ${sidebar}: ${widgets.join(", ")}.`);
    return;
  }

  await client.request(`wp/v2/sidebars/${sidebar}`, {
    method: "POST",
    body: { widgets },
    expectedStatus: [200],
  });
}

export async function ensureNavMenuWidget(
  client: WordPressClient,
  sidebar: string,
  menuId: number,
  title: string,
): Promise<void> {
  const widgets = await listWidgets(client, sidebar);
  const navMenuWidgets = widgets.filter((widget) => widget.id_base === "nav_menu");
  const matching = navMenuWidgets.find(
    (widget) => Number(widget.instance?.raw?.nav_menu) === menuId,
  );

  for (const widget of navMenuWidgets) {
    if (!matching || widget.id !== matching.id) {
      await deleteWidget(client, widget.id);
    }
  }

  if (env.dryRun) {
    logger.info(
      `[DRY RUN] ${matching ? "Atualizaria" : "Criaria"} widget nav_menu do menu ${menuId} em ${sidebar}.`,
    );
    return;
  }

  let widgetId = matching?.id;
  if (matching) {
    const updated = await client.request<WordPressWidget>(`wp/v2/widgets/${matching.id}`, {
      method: "POST",
      body: {
        sidebar,
        instance: {
          raw: {
            title,
            nav_menu: menuId,
          },
        },
      },
      expectedStatus: [200],
    });
    widgetId = updated.id;
  } else {
    const created = await client.request<WordPressWidget>("wp/v2/widgets", {
      method: "POST",
      body: {
        id_base: "nav_menu",
        sidebar,
        instance: {
          raw: {
            title,
            nav_menu: menuId,
          },
        },
      },
      expectedStatus: [201],
    });
    widgetId = created.id;
  }

  if (!widgetId) {
    throw new Error(`Nao foi possivel determinar o widget do menu ${menuId}.`);
  }

  const sidebars = await listSidebars(client);
  for (const currentSidebar of sidebars) {
    if (currentSidebar.id === sidebar || !currentSidebar.widgets.includes(widgetId)) {
      continue;
    }

    await updateSidebarWidgets(
      client,
      currentSidebar.id,
      currentSidebar.widgets.filter((item) => item !== widgetId),
    );
  }

  const targetSidebar = sidebars.find((item) => item.id === sidebar);
  const currentWidgets = targetSidebar?.widgets ?? [];
  const nextWidgets = [...currentWidgets.filter((item) => item !== widgetId), widgetId];
  await updateSidebarWidgets(client, sidebar, nextWidgets);
}

export async function ensureBlockWidget(
  client: WordPressClient,
  sidebar: string,
  content: string,
  matchText: string,
): Promise<void> {
  const allWidgets = await listWidgets(client);
  const matchingWidgets = allWidgets.filter(
    (widget) =>
      widget.id_base === "block" &&
      typeof widget.instance?.raw?.content === "string" &&
      widget.instance.raw.content.includes(matchText),
  );
  const matching = matchingWidgets[0];

  if (env.dryRun) {
    logger.info(
      `[DRY RUN] Substituiria widget block em ${sidebar} com marcador ${matchText}.`,
    );
    return;
  }

  const sidebars = await listSidebars(client);
  const duplicateIds = new Set(matchingWidgets.map((widget) => widget.id));
  for (const duplicate of matchingWidgets) {
    await deleteWidget(client, duplicate.id);
  }

  const created = await client.request<WordPressWidget>("wp/v2/widgets", {
    method: "POST",
    body: {
      id_base: "block",
      sidebar,
      instance: {
        raw: {
          content,
        },
      },
    },
    expectedStatus: [201],
  });
  const widgetId = created.id;

  if (!widgetId) {
    throw new Error(`Nao foi possivel determinar o widget block para ${matchText}.`);
  }

  for (const currentSidebar of sidebars) {
    if (currentSidebar.id === sidebar) {
      continue;
    }

    if (!currentSidebar.widgets.some((item) => duplicateIds.has(item) || item === widgetId)) {
      continue;
    }

    await updateSidebarWidgets(
      client,
      currentSidebar.id,
      currentSidebar.widgets.filter((item) => !duplicateIds.has(item) && item !== widgetId),
    );
  }

  const targetSidebar = sidebars.find((item) => item.id === sidebar);
  const currentWidgets = (targetSidebar?.widgets ?? []).filter((item) => !duplicateIds.has(item));
  const nextWidgets = [widgetId, ...currentWidgets.filter((item) => item !== widgetId)];
  await updateSidebarWidgets(client, sidebar, nextWidgets);
}

export async function appendBlockWidget(
  client: WordPressClient,
  sidebar: string,
  content: string,
  matchText: string,
): Promise<void> {
  const allWidgets = await listWidgets(client);
  const matchingWidgets = allWidgets.filter(
    (widget) =>
      widget.id_base === "block" &&
      typeof widget.instance?.raw?.content === "string" &&
      widget.instance.raw.content.includes(matchText),
  );

  if (env.dryRun) {
    logger.info(`[DRY RUN] Adicionaria widget block no final de ${sidebar} com marcador ${matchText}.`);
    return;
  }

  const sidebars = await listSidebars(client);
  const duplicateIds = new Set(matchingWidgets.map((widget) => widget.id));
  for (const duplicate of matchingWidgets) {
    await deleteWidget(client, duplicate.id);
  }

  const created = await client.request<WordPressWidget>("wp/v2/widgets", {
    method: "POST",
    body: {
      id_base: "block",
      sidebar,
      instance: { raw: { content } },
    },
    expectedStatus: [201],
  });
  const widgetId = created.id;

  if (!widgetId) {
    throw new Error(`Nao foi possivel criar widget block para ${matchText}.`);
  }

  for (const currentSidebar of sidebars) {
    if (currentSidebar.id === sidebar) continue;
    if (!currentSidebar.widgets.some((item) => duplicateIds.has(item) || item === widgetId)) continue;
    await updateSidebarWidgets(
      client,
      currentSidebar.id,
      currentSidebar.widgets.filter((item) => !duplicateIds.has(item) && item !== widgetId),
    );
  }

  const targetSidebar = sidebars.find((item) => item.id === sidebar);
  const currentWidgets = (targetSidebar?.widgets ?? []).filter((item) => !duplicateIds.has(item));
  // Append to end (unlike ensureBlockWidget which prepends)
  const nextWidgets = [...currentWidgets.filter((item) => item !== widgetId), widgetId];
  await updateSidebarWidgets(client, sidebar, nextWidgets);
}

export async function removeBlockWidgetsByText(
  client: WordPressClient,
  sidebar: string,
  markers: string[],
): Promise<void> {
  const widgets = await listWidgets(client, sidebar);
  const matches = widgets.filter(
    (widget) => {
      const content = widget.instance?.raw?.content;
      return (
        widget.id_base === "block" &&
        typeof content === "string" &&
        markers.some((marker) => content.includes(marker))
      );
    },
  );

  if (matches.length === 0) {
    return;
  }

  if (env.dryRun) {
    logger.info(
      `[DRY RUN] Removeria widgets block da sidebar ${sidebar}: ${matches.map((widget) => widget.id).join(", ")}.`,
    );
    return;
  }

  for (const widget of matches) {
    await deleteWidget(client, widget.id);
  }

  const sidebars = await listSidebars(client);
  const targetSidebar = sidebars.find((item) => item.id === sidebar);
  if (!targetSidebar) {
    return;
  }

  const matchIds = new Set(matches.map((widget) => widget.id));
  await updateSidebarWidgets(
    client,
    sidebar,
    targetSidebar.widgets.filter((widgetId) => !matchIds.has(widgetId)),
  );
}
