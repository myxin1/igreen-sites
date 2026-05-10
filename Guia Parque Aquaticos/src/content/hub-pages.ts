import { escapeHtml } from "../utils/text.js";
import { SILO_GROUPS, type SiloGroup } from "./silo/definitions/groups.js";
import { findSiloPage } from "./silo/registry.js";

const WRAPPER =
  "font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;color:#21433d;font-size:18px;line-height:1.85;";
const CARD =
  "margin:28px 0;padding:24px 22px;border:1px solid #cfe5df;border-radius:18px;background:linear-gradient(180deg,#f7fcfb 0%,#eef7f5 100%);box-shadow:0 10px 26px rgba(16,68,60,.08);";
const H2 =
  "font-family:Georgia,'Times New Roman',serif;color:#0f4f46;font-size:30px;line-height:1.3;margin:0 0 14px;";
const P = "margin:0 0 18px;color:#21433d;";
const CHILD_CARD =
  "display:block;padding:18px 20px;border:1px solid #cfe5df;border-radius:14px;background:#ffffff;text-decoration:none;box-shadow:0 8px 20px rgba(16,68,60,.08);";

function introSection(group: SiloGroup): string {
  return [
    `<div style="${CARD}">`,
    `<h2 style="${H2}">${escapeHtml(group.name)}</h2>`,
    `<p style="${P}">${escapeHtml(group.intro)}</p>`,
    `<p style="${P}">Escolha abaixo apenas o guia que responde a sua duvida desta etapa. A ideia desta pagina e organizar melhor a leitura, sem empilhar links demais.</p>`,
    `</div>`,
  ].join("");
}

function childrenGrid(group: SiloGroup): string {
  const cards = group.children
    .map((child) => {
      const page = findSiloPage(child.key);
      return [
        `<a href="/${page.slug}/" style="${CHILD_CARD}">`,
        `<strong style="display:block;color:#0f4f46;font-size:17px;line-height:1.4;margin-bottom:6px;">${escapeHtml(page.title)}</strong>`,
        `<span style="display:block;color:#47635d;font-size:14px;line-height:1.5;">${escapeHtml(child.description)}</span>`,
        `</a>`,
      ].join("");
    })
    .join("");

  return [
    `<div style="${CARD}">`,
    `<h2 style="${H2}">Guias desta categoria</h2>`,
    `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px;">${cards}</div>`,
    `</div>`,
  ].join("");
}

export function buildHubPageContent(group: SiloGroup): string {
  return `<div style="${WRAPPER}">${introSection(group)}${childrenGrid(group)}</div>`;
}

export { SILO_GROUPS };
