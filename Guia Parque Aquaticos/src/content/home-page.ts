import { SILO_GROUPS } from "./silo/definitions/groups.js";
import { PAGE_PARENT } from "./silo/index.js";

function buildHomeHtml(imageMap: Map<string, string>): string {
  const thumbUrl = imageMap.get(PAGE_PARENT.key) ?? "";
  const thumbHtml = thumbUrl
    ? `<img src="${thumbUrl}" alt="${PAGE_PARENT.title}" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block;">`
    : "";

  const siloCards = SILO_GROUPS.map((g) => `
    <a href="/${g.slug}/" style="
      display:flex;flex-direction:column;gap:6px;
      padding:16px 14px;border-radius:14px;
      border:1px solid #cfe5df;background:#f7fcfb;
      text-decoration:none;color:inherit;
      transition:transform .2s ease,box-shadow .2s ease;
    "
    onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 8px 20px rgba(16,68,60,.12)'"
    onmouseout="this.style.transform='';this.style.boxShadow='none'"
    >
      <strong style="font-size:.9rem;font-weight:700;color:#0f4f46;">${g.name}</strong>
      <span style="font-size:.8rem;font-weight:700;color:#ff8a00;margin-top:2px;">Ver guias &rarr;</span>
    </a>`).join("");

  return `
<div style="font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;max-width:900px;margin:0 auto;padding:0 16px 48px;">

  <!-- Card principal: Aldeia das Águas com SILOs dentro -->
  <div style="
    border-radius:20px;overflow:hidden;
    border:1px solid #cfe5df;
    box-shadow:0 8px 24px rgba(16,68,60,.1);
  ">
    <a href="/${PAGE_PARENT.slug}/" style="display:block;text-decoration:none;color:inherit;">
      ${thumbHtml ? `<div style="aspect-ratio:16/7;overflow:hidden;">${thumbHtml}</div>` : `<div style="aspect-ratio:16/7;background:linear-gradient(135deg,#0f4f46,#1c6a5f);"></div>`}
    </a>
    <div style="padding:24px 22px 20px;background:#fff;">
      <a href="/${PAGE_PARENT.slug}/" style="text-decoration:none;color:inherit;display:block;">
        <span style="display:inline-block;background:#dff3ee;color:#14574d;border-radius:999px;padding:4px 10px;font-size:11px;font-weight:700;margin-bottom:10px;text-transform:uppercase;letter-spacing:.05em;">Guia principal</span>
        <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:1.6rem;color:#0f4f46;margin:0 0 8px;line-height:1.3;">${PAGE_PARENT.title}</h1>
        <p style="color:#3a6560;font-size:.93rem;line-height:1.7;margin:0 0 16px;">Tudo sobre ingressos, preços, hospedagem, atrações e planejamento da visita ao maior resort aquático do interior fluminense.</p>
        <span style="display:inline-block;background:linear-gradient(135deg,#0f4f46,#1c6a5f);color:#fff;padding:10px 20px;border-radius:10px;font-weight:700;font-size:.9rem;">Acessar guia completo &rarr;</span>
      </a>

      <!-- Divisor -->
      <hr style="border:0;border-top:1px solid #e5f0ed;margin:20px 0 16px;">

      <!-- Três SILOs dentro do card -->
      <p style="font-size:.75rem;font-weight:700;color:#8aafa8;text-transform:uppercase;letter-spacing:.08em;margin:0 0 12px;">Categorias</p>
      <div class="gpq-home-silos" style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;">
        ${siloCards}
      </div>
    </div>
  </div>

  <style>
    @media(max-width:600px){
      .gpq-home-silos{grid-template-columns:1fr!important;}
    }
  </style>
</div>`;
}

export function buildHomePageContent(imageMap: Map<string, string>): string {
  return `<!-- wp:html -->\n${buildHomeHtml(imageMap)}\n<!-- /wp:html -->`;
}
