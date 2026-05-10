import type { SiloPageDefinition } from "../types.js";
import { findGroupByChildKey, SILO_GROUPS, type SiloGroup } from "./definitions/groups.js";
import { PAGE_PARENT } from "./definitions/pillar.js";
import { TOP_FUNNEL_PAGES } from "./definitions/top-funnel.js";
import { findSiloPage } from "./registry.js";

export interface InternalLinkTarget {
  href: string;
  key: string;
  label: string;
}

export function permalinkForPage(page: SiloPageDefinition): string {
  return `/${page.slug}/`;
}

export function permalinkForGroup(group: SiloGroup): string {
  return `/${group.slug}/`;
}

function uniqueTargets(targets: InternalLinkTarget[]): InternalLinkTarget[] {
  const seen = new Set<string>();
  return targets.filter((target) => {
    if (seen.has(target.href)) return false;
    seen.add(target.href);
    return true;
  });
}

export function groupForPage(page: SiloPageDefinition): SiloGroup | undefined {
  return findGroupByChildKey(page.key);
}

export function articleLinkTargets(page: SiloPageDefinition): InternalLinkTarget[] {
  if (page.type === "pillar") {
    return SILO_GROUPS.map((group) => ({
      href: permalinkForGroup(group),
      key: group.key,
      label: group.name,
    }));
  }

  if (page.type === "top-funnel") {
    return uniqueTargets(
      page.siblings.slice(0, 3).map((key) => {
        const target = findSiloPage(key);
        return {
          href: permalinkForPage(target),
          key: target.key,
          label: target.title,
        };
      }),
    );
  }

  const group = groupForPage(page);
  if (!group) {
    return [];
  }

  const siblingTargets = page.siblings
    .map((key) => findSiloPage(key))
    .filter((target) => groupForPage(target)?.key === group.key)
    .slice(0, 3)
    .map((target) => ({
      href: permalinkForPage(target),
      key: target.key,
      label: target.title,
    }));

  return uniqueTargets([
    {
      href: permalinkForGroup(group),
      key: group.key,
      label: group.name,
    },
    ...siblingTargets,
  ]);
}

export function hubLinkTargets(group: SiloGroup): InternalLinkTarget[] {
  return group.children.map((child) => {
    const page = findSiloPage(child.key);
    return {
      href: permalinkForPage(page),
      key: page.key,
      label: page.title,
    };
  });
}

export function articlePathSet(): string[] {
  return [PAGE_PARENT, ...TOP_FUNNEL_PAGES, ...SILO_GROUPS.flatMap((group) => group.children.map((child) => findSiloPage(child.key)))].map(
    (page) => permalinkForPage(page),
  );
}
