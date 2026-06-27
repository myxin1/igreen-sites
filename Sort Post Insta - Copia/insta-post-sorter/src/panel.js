(function createInstaPostSorterPanel(global) {
  "use strict";

  const PANEL_ID = "insta-post-sorter-root";
  const SOURCE   = "insta-post-sorter";

  // ─── CSS (Shadow DOM) ──────────────────────────────────────────────────────
  const STYLES = `
    :host {
      resize: both;
      overflow: auto;
      min-width: 300px;
      min-height: 260px;
      max-width: calc(100vw - 16px);
      max-height: calc(100vh - 16px);
    }
    :host(.panel-minimized) {
      resize: none !important;
      min-height: 0 !important;
      overflow: hidden;
    }

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    /* ─── Dark theme (default) ─── */
    .panel-wrapper {
      --bg:          #0a0a0a;
      --surface:     #161616;
      --surface2:    #1e1e1e;
      --surface3:    #131313;
      --border:      #272727;
      --border2:     #3c3c3c;
      --text:        #f0f0f0;
      --text-muted:  #888;
      --text-dim:    #555;
      --text-faint:  #333;
      --spin-border: rgba(255,255,255,.25);
      --spin-top:    #fff;

      display: flex; flex-direction: column;
      background: var(--bg); width: 100%; height: 100%; min-height: 52px;
      border-radius: 12px; overflow: hidden;
      box-shadow: 0 16px 48px rgba(0,0,0,.8), 0 2px 8px rgba(0,0,0,.5);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 13px; color: var(--text); position: relative;
    }

    /* ─── Light theme ─── */
    .panel-wrapper.theme-light {
      --bg:          #ffffff;
      --surface:     #f5f5f5;
      --surface2:    #ebebeb;
      --surface3:    #f9f9f9;
      --border:      #d8d8d8;
      --border2:     #bbb;
      --text:        #111;
      --text-muted:  #666;
      --text-dim:    #999;
      --text-faint:  #c0c0c0;
      --spin-border: rgba(0,0,0,.15);
      --spin-top:    #444;
      box-shadow: 0 8px 32px rgba(0,0,0,.15), 0 2px 8px rgba(0,0,0,.08);
    }

    /* ── Header ── */
    .panel-header {
      display: flex; align-items: center; gap: 10px; padding: 11px 13px;
      background: linear-gradient(135deg, #833ab4 0%, #c13584 55%, #f77737 100%);
      cursor: grab; user-select: none; flex-shrink: 0;
    }
    .panel-header.dragging { cursor: grabbing; }
    .h-icon {
      font-size: 15px; background: rgba(255,255,255,.15); border-radius: 7px;
      width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .h-title { font-size: 13px; font-weight: 700; color: #fff; flex: 1; letter-spacing: -.3px; }
    .h-actions { display: flex; gap: 5px; align-items: center; }

    /* Window control dots */
    .hbtn {
      width: 22px; height: 22px; border-radius: 50%; border: none;
      font-size: 10px; font-weight: 800;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: opacity .15s, transform .1s; flex-shrink: 0;
      opacity: .85;
    }
    .hbtn:hover { opacity: 1; transform: scale(1.1); }
    .hbtn:active { transform: scale(.92); }
    .hbtn-min   { background: #f5a623; color: #7a4800; }
    .hbtn-full  { background: #4caf82; color: #00422a; }
    .hbtn-theme {
      background: rgba(255,255,255,.18); color: #fff;
      font-size: 12px; border-radius: 7px; width: 24px; height: 24px;
      border: 1px solid rgba(255,255,255,.25);
    }
    .hbtn-close { background: #e05252; color: #6a0000; }
    .hbtn-sep { width: 1px; height: 14px; background: rgba(255,255,255,.2); margin: 0 2px; }

    /* ── Body ── */
    .panel-body { overflow-y: auto; overflow-x: hidden; flex: 1; display: flex; flex-direction: column; }

    /* ── Status bar ── */
    .status-bar {
      display: flex; align-items: center; justify-content: space-between;
      padding: 7px 14px; background: var(--surface); border-bottom: 1px solid var(--border);
      flex-shrink: 0;
    }
    .status-label { font-size: 11px; color: var(--text-muted); display: flex; align-items: center; gap: 6px; }
    .dot { width: 7px; height: 7px; border-radius: 50%; background: #4caf82; box-shadow: 0 0 5px #4caf82; flex-shrink: 0; }
    .badge {
      background: linear-gradient(135deg, #833ab4, #c13584); color: #fff;
      font-size: 11px; font-weight: 700;
      padding: 2px 9px; border-radius: 20px; min-width: 52px; text-align: center;
    }

    /* ── Sections ── */
    .section { padding: 11px 14px; border-bottom: 1px solid var(--border); }
    .slabel {
      font-size: 10px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 1px; color: var(--text-dim); margin-bottom: 9px;
      padding-left: 8px; border-left: 2px solid #c13584;
    }
    .section-header {
      display: flex; align-items: center; justify-content: space-between; gap: 8px;
      width: 100%; border: none; background: transparent; color: inherit;
      cursor: pointer; margin-bottom: 9px; padding: 0; text-align: left;
    }
    .section-header .slabel { margin-bottom: 0; flex: 1; }
    .section-toggle {
      width: 30px; height: 22px; border-radius: 999px;
      border: 1px solid var(--border); background: var(--surface2);
      color: var(--text-muted); font-size: 11px; font-weight: 800;
      display: flex; align-items: center; justify-content: center;
      transition: background .15s, border-color .15s, color .15s, transform .15s;
      flex-shrink: 0;
    }
    .section-header:hover .section-toggle {
      background: var(--surface); border-color: var(--border2); color: var(--text);
    }
    .section.is-collapsed { padding-bottom: 11px; }
    .section.is-collapsed .section-toggle { transform: rotate(-90deg); }
    .section.is-collapsed .section-content { display: none; }
    .section-content { display: flex; flex-direction: column; gap: 8px; }

    /* ── Primary action button ── */
    .btn-analyze-wrap { margin-bottom: 8px; }
    .btn {
      display: flex; align-items: center; justify-content: center; gap: 7px;
      width: 100%; border: none; border-radius: 10px;
      font-size: 13px; font-weight: 700; cursor: pointer;
      transition: box-shadow .2s, transform .12s, filter .15s;
      letter-spacing: -.1px;
    }
    .btn:active:not(:disabled) { transform: scale(.96); }
    .btn:disabled { opacity: .38; cursor: not-allowed; transform: none; }
    .btn-primary {
      padding: 11px 16px; color: #fff;
      background: linear-gradient(135deg, #833ab4, #c13584);
      box-shadow: 0 4px 16px rgba(193,53,132,.38);
    }
    .btn-primary:hover:not(:disabled) {
      box-shadow: 0 6px 24px rgba(193,53,132,.55);
      filter: brightness(1.07);
    }

    /* ── Compact 2-col action grid ── */
    .actions-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
    .read-limit-block { display: flex; flex-direction: column; gap: 6px; }
    .read-limit-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 5px; }
    .check-btn {
      display: flex; align-items: center; justify-content: center; gap: 5px;
      min-width: 0; padding: 7px 5px; border-radius: 8px;
      border: 1px solid var(--border); background: var(--surface2);
      color: var(--text-muted); font-size: 11px; font-weight: 700;
      cursor: pointer; user-select: none; transition: background .15s, border-color .15s, color .15s;
    }
    .check-btn:hover { background: var(--surface); border-color: var(--border2); color: var(--text); }
    .check-btn input {
      width: 12px; height: 12px; margin: 0; flex-shrink: 0;
      accent-color: #c13584; pointer-events: none;
    }
    .check-btn:has(input:checked) {
      background: linear-gradient(135deg, #833ab4, #c13584);
      border-color: transparent; color: #fff;
    }
    .bulk-select-dropdown {
      border: 1px solid var(--border); border-radius: 9px;
      background: var(--surface3); overflow: hidden;
    }
    .bulk-select-dropdown summary {
      list-style: none; display: flex; align-items: center; justify-content: space-between;
      gap: 8px; padding: 8px 10px; cursor: pointer;
      color: var(--text); font-size: 12px; font-weight: 700;
      user-select: none;
    }
    .bulk-select-dropdown summary::-webkit-details-marker { display: none; }
    .bulk-select-dropdown summary::after {
      content: "v"; color: var(--text-muted); font-size: 11px; font-weight: 800;
      transition: transform .15s;
    }
    .bulk-select-dropdown[open] summary::after { transform: rotate(180deg); }
    .bulk-select-grid {
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 5px;
      padding: 0 8px 8px;
    }
    .btn-compact {
      display: flex; align-items: center; gap: 6px;
      padding: 8px 10px; border-radius: 9px;
      border: 1px solid var(--border); background: var(--surface2);
      color: var(--text); font-size: 12px; font-weight: 600;
      cursor: pointer; transition: background .15s, border-color .15s, box-shadow .15s, transform .1s;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .btn-compact:hover:not(:disabled) {
      background: var(--surface); border-color: var(--border2);
      box-shadow: 0 2px 8px rgba(0,0,0,.12);
    }
    .btn-compact:active:not(:disabled) { transform: scale(.96); }
    .btn-compact:disabled { opacity: .35; cursor: not-allowed; }
    .btn-compact .ico { font-size: 13px; flex-shrink: 0; }

    /* ── Sort rows ── */
    .sort-row { display: flex; align-items: center; gap: 8px; padding: 5px 0; }
    .sort-label { display: flex; align-items: center; gap: 7px; flex: 1; font-size: 12px; color: var(--text); }
    .sort-label .icon { font-size: 13px; flex-shrink: 0; }
    .sort-chips { display: flex; gap: 5px; }
    .sort-chip {
      width: 30px; height: 30px; border-radius: 8px;
      border: 1px solid var(--border); background: var(--surface2);
      color: var(--text-muted); font-size: 16px; font-weight: 700;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: all .15s; flex-shrink: 0; line-height: 1;
    }
    .sort-chip:hover:not(:disabled) {
      background: var(--surface); color: var(--text);
      border-color: var(--border2); transform: translateY(-1px);
      box-shadow: 0 3px 8px rgba(0,0,0,.15);
    }
    .sort-chip.active {
      background: linear-gradient(135deg, #833ab4, #c13584);
      color: #fff; border-color: transparent;
      box-shadow: 0 3px 10px rgba(193,53,132,.4);
    }
    .sort-chip:disabled { opacity: .3; cursor: not-allowed; }

    /* ── Results ── */
    .results-head { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    .results-note { font-size: 10px; color: var(--text-dim); flex: 1; text-align: right; line-height: 1.35; }
    .results-list {
      display: flex; flex-direction: column; gap: 5px;
      max-height: clamp(200px, 44vh, 600px); overflow-y: auto; padding-right: 2px;
    }
    .is-resized .results-list { max-height: calc(100vh - 390px); }
    .is-fullscreen .results-list { max-height: calc(86vh - 390px); }
    .result-item {
      display: grid; grid-template-columns: 18px 46px minmax(0,1fr);
      gap: 8px; padding: 7px;
      background: var(--surface3); border: 1px solid var(--border); border-radius: 9px;
      cursor: pointer; transition: border-color .15s, background .15s, box-shadow .15s;
    }
    .result-item:hover { border-color: var(--border2); background: var(--surface); box-shadow: 0 2px 8px rgba(0,0,0,.1); }
    .result-item.selected { border-color: #c13584; background: var(--surface2); box-shadow: inset 0 0 0 1px rgba(193,53,132,.2); }
    .result-item.no-video { cursor: default; opacity: .7; }
    .result-check { align-self: center; width: 16px; height: 16px; accent-color: #c13584; cursor: pointer; }
    .result-check:disabled { opacity: .25; }
    .result-thumb { width: 46px; height: 46px; object-fit: cover; border-radius: 7px; background: var(--surface2); }
    .result-main { min-width: 0; display: flex; flex-direction: column; gap: 5px; }
    .result-link {
      color: var(--text); font-size: 11px; font-weight: 700;
      text-decoration: none; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .result-link:hover { color: #f77737; }
    .result-metrics { display: flex; gap: 4px; flex-wrap: wrap; }
    .metric-pill {
      background: var(--surface2); border: 1px solid var(--border);
      border-radius: 5px; padding: 2px 5px; font-size: 10px;
      white-space: nowrap; color: var(--text-muted);
    }
    .metric-l { color: #e05252; border-color: rgba(224,82,82,.3); }
    .metric-c { color: #4a90e2; border-color: rgba(74,144,226,.3); }
    .metric-s { color: #f77737; border-color: rgba(247,119,55,.3); }
    .empty-results {
      color: var(--text-dim); font-size: 11px; line-height: 1.5; padding: 14px;
      background: var(--surface3); border: 1px solid var(--border);
      border-radius: 9px; text-align: center;
    }

    /* ── Diagnostics ── */
    .diag-box { background: var(--surface2); border: 1px solid var(--border); border-radius: 9px; padding: 9px 11px; }
    .diag-issue { display: flex; align-items: flex-start; gap: 6px; font-size: 11px; color: #f5a623; line-height: 1.4; padding: 3px 0; }
    .diag-issue.info { color: #4caf82; }
    .diag-issue + .diag-issue { border-top: 1px solid var(--border); padding-top: 5px; margin-top: 3px; }

    /* ── Spinner ── */
    .spinner {
      display: none; width: 12px; height: 12px; flex-shrink: 0;
      border: 2px solid var(--spin-border); border-top-color: var(--spin-top);
      border-radius: 50%; animation: spin .7s linear infinite;
    }
    .spinning .spinner { display: block; }
    .spinning .bicon   { display: none; }
    .btn-compact .spinner { width: 11px; height: 11px; }
    .btn-compact.w-full { width: 100%; justify-content: center; }
    .btn-compact.btn-tiny {
      min-width: 0; justify-content: center;
      padding: 7px 6px; font-size: 11px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── Footer ── */
    .footer { padding: 7px 14px; text-align: center; font-size: 10px; color: var(--text-faint); flex-shrink: 0; }

    /* ── Resize handle corner ── */
    .resize-handle {
      position: absolute; bottom: 0; right: 0; width: 22px; height: 22px;
      background: linear-gradient(135deg, transparent 50%, var(--border2) 50%);
      border-bottom-right-radius: 12px; z-index: 10; pointer-events: none;
    }
  `;

  // ─── Template ─────────────────────────────────────────────────────────────
  const TEMPLATE = `
    <div class="panel-wrapper">
      <div class="panel-header" id="drag-handle">
        <div class="h-icon">📸</div>
        <div class="h-title">Insta Post Sorter</div>
        <div class="h-actions">
          <button class="hbtn hbtn-min"   id="btn-min"   title="Minimizar">─</button>
          <button class="hbtn hbtn-full"  id="btn-full"  title="Tela cheia">□</button>
          <div class="hbtn-sep"></div>
          <button class="hbtn hbtn-theme" id="btn-theme" title="Alternar tema">☀</button>
          <button class="hbtn hbtn-close" id="btn-close" title="Fechar">✕</button>
        </div>
      </div>

      <div class="panel-body" id="panel-body">

        <div class="status-bar">
          <div class="status-label">
            <div class="dot"></div>
            <span id="profile-status">Instagram detectado</span>
          </div>
          <div class="badge" id="post-count">0 posts</div>
        </div>

        <div class="section" data-collapsible-section>
          <button class="section-header" type="button" aria-expanded="true">
            <span class="slabel">Acoes</span>
            <span class="section-toggle" aria-hidden="true">v</span>
          </button>

          <div class="section-content">
          <div class="btn-analyze-wrap">
            <button class="btn btn-primary" id="btn-analyze">
              <span class="bicon">🔍</span>
              <div class="spinner"></div>
              <span id="analyze-label">Analisar Posts</span>
            </button>
          </div>

          <div class="read-limit-block">
            <div class="slabel">Limite de leitura</div>
            <div class="read-limit-grid">
              <label class="check-btn"><input type="checkbox" data-read-limit="1000" checked> 1000</label>
              <label class="check-btn"><input type="checkbox" data-read-limit="2000"> 2000</label>
              <label class="check-btn"><input type="checkbox" data-read-limit="5000"> 5000</label>
              <label class="check-btn"><input type="checkbox" data-read-limit="10000"> 10000</label>
            </div>
          </div>

          <div class="actions-grid">
            <button class="btn-compact" id="btn-restore" disabled>
              <span class="ico">↺</span> Restaurar
            </button>
            <button class="btn-compact" id="btn-export" disabled>
              <span class="ico">📥</span> Exportar CSV
            </button>
            <button class="btn-compact w-full" id="btn-apply-feed" disabled style="grid-column:span 2">
              <span class="ico">▶</span> Aplicar ordenação no feed do Instagram
            </button>
          </div>
          </div>
        </div>

        <div class="section" data-collapsible-section>
          <button class="section-header" type="button" aria-expanded="true">
            <span class="slabel">Ordenar por</span>
            <span class="section-toggle" aria-hidden="true">v</span>
          </button>

          <div class="section-content">
          <div class="sort-row">
            <div class="sort-label"><span class="icon">❤️</span> Likes</div>
            <div class="sort-chips">
              <button class="sort-chip" data-key="likes_desc" disabled title="Mais likes">↓</button>
              <button class="sort-chip" data-key="likes_asc"  disabled title="Menos likes">↑</button>
            </div>
          </div>
          <div class="sort-row">
            <div class="sort-label"><span class="icon">💬</span> Comentários</div>
            <div class="sort-chips">
              <button class="sort-chip" data-key="comments_desc" disabled title="Mais comentários">↓</button>
              <button class="sort-chip" data-key="comments_asc"  disabled title="Menos comentários">↑</button>
            </div>
          </div>
          <div class="sort-row">
            <div class="sort-label"><span class="icon">👁️</span> Views</div>
            <div class="sort-chips">
              <button class="sort-chip" data-key="views_desc" disabled title="Mais views">↓</button>
              <button class="sort-chip" data-key="views_asc"  disabled title="Menos views">↑</button>
            </div>
          </div>
          <div class="sort-row">
            <div class="sort-label"><span class="icon">🔥</span> Engajamento</div>
            <div class="sort-chips">
              <button class="sort-chip" data-key="engagement_desc" disabled title="Maior engajamento">↓</button>
              <button class="sort-chip" data-key="engagement_asc"  disabled title="Menor engajamento">↑</button>
            </div>
          </div>
          <div class="sort-row">
            <div class="sort-label"><span class="icon">📅</span> Data</div>
            <div class="sort-chips">
              <button class="sort-chip" data-key="date_desc" disabled title="Mais recente">↓</button>
              <button class="sort-chip" data-key="date_asc"  disabled title="Mais antigo">↑</button>
            </div>
          </div>
          </div>
        </div>

        <div class="section" data-collapsible-section>
          <button class="section-header" type="button" aria-expanded="true">
            <span class="slabel">Videos &amp; Download</span>
            <span class="section-toggle" aria-hidden="true">v</span>
          </button>
          <div class="section-content col">
            <button class="btn-compact w-full" id="btn-load-more" disabled>
              <span class="ico bicon">⬇</span>
              <div class="spinner"></div>
              <span>Carregar mais posts (auto-scroll)</span>
            </button>
            <div class="actions-grid">
              <button class="btn-compact" id="btn-select-videos" disabled>
                <span class="ico">☑</span> Selecionar todos
              </button>
              <button class="btn-compact" id="btn-remove-images" disabled>
                <span class="ico">🖼</span> Remover imagens
              </button>
            </div>
            <details class="bulk-select-dropdown">
              <summary>Selecionar</summary>
              <div class="bulk-select-grid" aria-label="Selecionar quantidade de videos">
                <button class="btn-compact btn-tiny" data-select-limit="50" disabled>50</button>
                <button class="btn-compact btn-tiny" data-select-limit="100" disabled>100</button>
                <button class="btn-compact btn-tiny" data-select-limit="300" disabled>300</button>
                <button class="btn-compact btn-tiny" data-select-limit="500" disabled>500</button>
                <button class="btn-compact btn-tiny" data-select-limit="1000" disabled>1000</button>
              </div>
            </details>
            <button class="btn-compact w-full" id="btn-download" disabled>
              <span class="ico">⬇</span>
              <span id="download-label">Baixar selecionados</span>
            </button>
          </div>
        </div>

        <div class="section" data-collapsible-section>
          <button class="section-header" type="button" aria-expanded="true">
            <span class="slabel">Posts indexados</span>
            <span class="section-toggle" aria-hidden="true">v</span>
          </button>
          <div class="section-content">
            <div class="results-head">
              <div class="results-note" id="results-note">Ordena instantaneamente no painel</div>
            </div>
            <div class="results-list" id="results-list">
              <div class="empty-results">Abra um perfil e aguarde a indexação.</div>
            </div>
          </div>
        </div>

        <div class="section" id="diag-section" style="display:none">
          <div class="slabel">Avisos</div>
          <div class="diag-box" id="diag-box"></div>
        </div>

        <div class="footer">Sem servidor externo · dados apenas locais</div>
      </div>

      <div class="resize-handle"></div>
    </div>
  `;

  // ─── Drag ─────────────────────────────────────────────────────────────────
  function makeDraggable(host, handle) {
    handle.addEventListener("mousedown", (e) => {
      if (e.target.closest("button") || e.target.closest(".hbtn-sep")) return;
      if (host.dataset.fullscreen === "true") return;
      e.preventDefault();
      handle.classList.add("dragging");
      const rect = host.getBoundingClientRect();
      const ox = e.clientX - rect.left;
      const oy = e.clientY - rect.top;
      function onMove(e) {
        e.preventDefault();
        host.style.left  = `${e.clientX - ox}px`;
        host.style.top   = `${e.clientY - oy}px`;
        host.style.right = "auto";
      }
      function onUp() {
        handle.classList.remove("dragging");
        persistPanelState(host);
        // capture:true so Instagram's handlers don't swallow these events
        document.removeEventListener("mousemove", onMove, true);
        document.removeEventListener("mouseup",   onUp,   true);
      }
      document.addEventListener("mousemove", onMove, true);
      document.addEventListener("mouseup",   onUp,   true);
    });
  }

  // ─── Resize (ResizeObserver) ───────────────────────────────────────────────
  function makeResizable(host) {
    if (!window.ResizeObserver) return;
    const observer = new ResizeObserver(() => {
      if (host.dataset.fullscreen === "true" || host.classList.contains("panel-minimized")) return;
      window.clearTimeout(host._resizeTimer);
      constrainToViewport(host);
      host.classList.add("is-resized");
      host._resizeTimer = window.setTimeout(() => persistPanelState(host), 250);
    });
    observer.observe(host);
  }

  // ─── Fullscreen ────────────────────────────────────────────────────────────
  function toggleFullscreen(host, shadow) {
    const btnFull = shadow.getElementById("btn-full");
    const isFs = host.dataset.fullscreen === "true";
    if (isFs) {
      const prev = safeParse(host.dataset.previousRect);
      host.dataset.fullscreen = "false";
      host.classList.remove("is-fullscreen");
      Object.assign(host.style, {
        left: prev.left || "auto", top: prev.top || "60px",
        right: prev.right || "20px", bottom: prev.bottom || "auto",
        width: prev.width || "340px", height: prev.height || "640px"
      });
      if (btnFull) btnFull.textContent = "□";
      persistPanelState(host);
      return;
    }
    const w = Math.min(window.innerWidth - 48, Math.max(720, Math.round(window.innerWidth * .82)));
    const h = Math.min(window.innerHeight - 48, Math.max(560, Math.round(window.innerHeight * .86)));
    host.dataset.previousRect = JSON.stringify({
      left: host.style.left || "auto", top: host.style.top || "60px",
      right: host.style.right || "20px", bottom: host.style.bottom || "auto",
      width: host.style.width || "340px", height: host.style.height || "640px"
    });
    host.dataset.fullscreen = "true";
    host.classList.add("is-fullscreen");
    Object.assign(host.style, {
      left: `${Math.max(12, Math.round((window.innerWidth - w) / 2))}px`,
      top:  `${Math.max(12, Math.round((window.innerHeight - h) / 2))}px`,
      right: "auto", bottom: "auto", width: `${w}px`, height: `${h}px`
    });
    if (btnFull) btnFull.textContent = "↙";
  }

  function safeParse(json) { try { return JSON.parse(json || "{}"); } catch (_) { return {}; } }

  function persistPanelState(host) {
    if (host.dataset.fullscreen === "true") return;
    try {
      chrome.storage.local.set({
        "insta-post-sorter:panel-state": {
          left: host.style.left, top: host.style.top,
          right: host.style.right, width: host.style.width, height: host.style.height
        }
      });
    } catch (_) {}
  }

  function constrainToViewport(host) {
    const rect = host.getBoundingClientRect();
    const w = Math.min(rect.width,  window.innerWidth - 24);
    const h = Math.min(rect.height, window.innerHeight - 24);
    const l = Math.min(Math.max(rect.left, 8), window.innerWidth  - w - 8);
    const t = Math.min(Math.max(rect.top,  8), window.innerHeight - h - 8);
    Object.assign(host.style, {
      width: `${Math.max(300, w)}px`, height: `${Math.max(260, h)}px`,
      left: `${l}px`, top: `${t}px`, right: "auto"
    });
  }

  async function restorePanelState(host) {
    try {
      const r = await chrome.storage.local.get("insta-post-sorter:panel-state");
      const s = r && r["insta-post-sorter:panel-state"];
      if (!s) return;
      ["left","top","right","width","height"].forEach((k) => { if (s[k]) host.style[k] = s[k]; });
      if (s.width || s.height) host.classList.add("is-resized");
    } catch (_) {}
  }

  // ─── UI Logic ──────────────────────────────────────────────────────────────
  function initUI(host, shadow) {
    const DEFAULT_READ_LIMIT = 1000;
    const MAX_RENDER_ITEMS = 10000;
    const $ = (id) => shadow.getElementById(id);

    const elPostCount       = $("post-count");
    const elProfileStatus   = $("profile-status");
    const elBtnAnalyze      = $("btn-analyze");
    const elAnalyzeLabel    = $("analyze-label");
    const elBtnLoadMore     = $("btn-load-more");
    const elBtnApplyFeed    = $("btn-apply-feed");
    const elBtnRestore      = $("btn-restore");
    const elBtnExport       = $("btn-export");
    const elBtnSelectVideos  = $("btn-select-videos");
    const elBtnRemoveImages  = $("btn-remove-images");
    const elBtnDownload      = $("btn-download");
    const elDownloadLabel   = $("download-label");
    const elResultsList     = $("results-list");
    const elResultsNote     = $("results-note");
    const elDiagSection     = $("diag-section");
    const elDiagBox         = $("diag-box");
    const elPanelBody       = $("panel-body");
    const sortChips         = shadow.querySelectorAll(".sort-chip");
    const bulkSelectButtons = shadow.querySelectorAll("[data-select-limit]");
    const readLimitInputs   = shadow.querySelectorAll("[data-read-limit]");

    let isAnalyzing = false;
    let currentPosts = [];
    let currentSortKey = "";
    let currentDiagnostics = null;
    let lastSelectionUrl = "";
    let readLimit = DEFAULT_READ_LIMIT;
    const selectedPosts = new Set();

    function initSectionToggles() {
      shadow.querySelectorAll("[data-collapsible-section]").forEach((section) => {
        const header = section.querySelector(".section-header");
        if (!header) return;
        header.addEventListener("click", () => {
          const collapsed = !section.classList.contains("is-collapsed");
          section.classList.toggle("is-collapsed", collapsed);
          header.setAttribute("aria-expanded", String(!collapsed));
        });
      });
    }

    // ── Header controls ──────────────────────────────────────────────────────

    // Minimize: collapse host to header height only
    $("btn-min").addEventListener("click", () => {
      const isMin = host.classList.contains("panel-minimized");
      if (!isMin) {
        host.dataset.prevHeight    = host.style.height    || "640px";
        host.dataset.prevMinHeight = host.style.minHeight || "240px";
        const hdrH = Math.ceil(shadow.querySelector(".panel-header").getBoundingClientRect().height);
        host.classList.add("panel-minimized");
        elPanelBody.style.display = "none";
        host.style.height    = `${hdrH}px`;
        host.style.minHeight = "0";
        $("btn-min").textContent = "▾";
      } else {
        host.classList.remove("panel-minimized");
        elPanelBody.style.display = "";
        host.style.height    = host.dataset.prevHeight    || "640px";
        host.style.minHeight = host.dataset.prevMinHeight || "240px";
        $("btn-min").textContent = "─";
      }
    });

    $("btn-close").addEventListener("click", () => { host.style.display = "none"; });

    $("btn-full").addEventListener("click", () => { toggleFullscreen(host, shadow); });

    // Theme toggle — persisted
    (function() {
      const wrapper = shadow.querySelector(".panel-wrapper");
      function applyTheme(theme, save) {
        const light = theme === "light";
        wrapper.classList.toggle("theme-light", light);
        $("btn-theme").textContent = light ? "🌙" : "☀";
        if (save) try { chrome.storage.local.set({ "insta-post-sorter:theme": theme }); } catch (_) {}
      }
      $("btn-theme").addEventListener("click", () => {
        applyTheme(wrapper.classList.contains("theme-light") ? "dark" : "light", true);
      });
      try {
        chrome.storage.local.get("insta-post-sorter:theme", (r) => {
          if (r && r["insta-post-sorter:theme"]) applyTheme(r["insta-post-sorter:theme"], false);
        });
      } catch (_) {}
    })();

    // ── Helpers ──────────────────────────────────────────────────────────────
    function updateCount(n) {
      elPostCount.textContent = `${n} post${n !== 1 ? "s" : ""}`;
    }

    function updateProfileStatus(diag) {
      elProfileStatus.textContent = diag && diag.profileHandle
        ? `Detectado: ${diag.profileHandle}`
        : "Instagram detectado";
    }

    function enableControls(on) {
      sortChips.forEach((b) => (b.disabled = !on));
      elBtnApplyFeed.disabled     = !on || !currentSortKey;
      elBtnRestore.disabled       = !on;
      elBtnExport.disabled        = !on;
      elBtnSelectVideos.disabled  = !on;
      elBtnRemoveImages.disabled  = !on;
      elBtnLoadMore.disabled      = !on;
      bulkSelectButtons.forEach((b) => (b.disabled = !on));
      updateDownloadButton();
    }

    function highlightSort(key) {
      sortChips.forEach((b) => b.classList.toggle("active", b.dataset.key === key));
    }

    function getRenderLimit() {
      return Math.min(readLimit || DEFAULT_READ_LIMIT, MAX_RENDER_ITEMS);
    }

    function setReadLimit(limit, save) {
      const next = Number(limit) || DEFAULT_READ_LIMIT;
      readLimit = next;
      readLimitInputs.forEach((input) => {
        input.checked = Number(input.dataset.readLimit) === readLimit;
      });
      if (save) {
        try { chrome.storage.local.set({ "insta-post-sorter:read-limit": readLimit }); } catch (_) {}
      }
    }

    function initReadLimit() {
      readLimitInputs.forEach((input) => {
        input.addEventListener("change", () => {
          setReadLimit(input.dataset.readLimit, true);
          if (readLimit >= 5000) {
            showDiag([{ type: "info", icon: "OK", text: `Limite ajustado para ${readLimit}. Pode demorar mais em perfis grandes.` }]);
          }
        });
      });
      try {
        chrome.storage.local.get("insta-post-sorter:read-limit", (r) => {
          setReadLimit(r && r["insta-post-sorter:read-limit"] ? r["insta-post-sorter:read-limit"] : DEFAULT_READ_LIMIT, false);
        });
      } catch (_) {
        setReadLimit(DEFAULT_READ_LIMIT, false);
      }
    }

    function showDiag(lines) {
      if (!lines || !lines.length) { elDiagSection.style.display = "none"; return; }
      elDiagBox.innerHTML = lines
        .map((l) => `<div class="diag-issue ${l.type === "info" ? "info" : ""}">${l.icon || "⚠️"} ${esc(l.text)}</div>`)
        .join("");
      elDiagSection.style.display = "block";
    }

    function setPosts(posts, diagnostics) {
      currentPosts = Array.isArray(posts) ? posts.slice() : [];
      currentDiagnostics = diagnostics || currentDiagnostics;
      syncSelectionWithPosts();
      if (currentSortKey) currentPosts = sortPostsLocal(currentPosts, currentSortKey);
      renderResults(currentDiagnostics);
      saveCache(currentPosts, currentDiagnostics);
    }

    function mergePostLists(basePosts, incomingPosts) {
      const byUrl = new Map();
      (basePosts || []).forEach((post) => {
        if (post && post.postUrl) byUrl.set(post.postUrl, post);
      });
      (incomingPosts || []).forEach((post) => {
        if (!post || !post.postUrl) return;
        byUrl.set(post.postUrl, Object.assign({}, byUrl.get(post.postUrl) || {}, post));
      });
      return Array.from(byUrl.values());
    }

    function renderResults(diagnostics) {
      const src = diagnostics && diagnostics.source === "instagram_api" ? "API local" : "DOM carregado";
      elResultsNote.textContent = currentSortKey
        ? `${src} · ${labelSort(currentSortKey)}`
        : `${src} · clique para ordenar`;

      if (!currentPosts.length) {
        elResultsList.innerHTML = `<div class="empty-results">Nenhum post indexado ainda.</div>`;
        return;
      }
      elResultsList.innerHTML = currentPosts.slice(0, getRenderLimit()).map(renderPostRow).join("");
    }

    function renderPostRow(post, index) {
      const thumb = post.thumbnailUrl
        ? `<img class="result-thumb" src="${escAttr(post.thumbnailUrl)}" alt="">`
        : `<div class="result-thumb"></div>`;
      const title   = post.caption || post.postUrl;
      const checked = selectedPosts.has(post.postUrl) ? "checked" : "";
      const disabled = post.videoUrl ? "" : "disabled";
      const cls = ["result-item", checked && "selected", !post.videoUrl && "no-video"].filter(Boolean).join(" ");

      return `
        <div class="${cls}" data-url="${escAttr(post.postUrl)}">
          <input class="result-check" type="checkbox" data-url="${escAttr(post.postUrl)}" ${checked} ${disabled}>
          ${thumb}
          <div class="result-main">
            <a class="result-link" href="${escAttr(post.postUrl)}" target="_blank" title="${escAttr(title)}">#${index+1} ${esc(title)}</a>
            <div class="result-metrics">
              <span class="metric-pill metric-l">❤ ${fmt(post.likes)}</span>
              <span class="metric-pill metric-c">💬 ${fmt(post.comments)}</span>
              <span class="metric-pill metric-s">🔥 ${fmt(post.engagementScore)}</span>
            </div>
          </div>
        </div>`;
    }

    function sortPostsLocal(posts, key) {
      const fn = global.InstaPostSorterSorter && global.InstaPostSorterSorter.sortPosts;
      if (fn) return fn(posts, key);
      return posts.slice().sort((a, b) => {
        const dir = key.endsWith("_asc") ? 1 : -1;
        const field = (key.replace(/_(asc|desc)$/, "") === "engagement") ? "engagementScore" : key.replace(/_(asc|desc)$/, "");
        return dir * ((Number(a[field]) || 0) - (Number(b[field]) || 0));
      });
    }

    function labelSort(key) {
      return { likes_desc:"likes ↓", likes_asc:"likes ↑", comments_desc:"coments ↓", comments_asc:"coments ↑",
               views_desc:"views ↓", views_asc:"views ↑", engagement_desc:"engaj ↓", engagement_asc:"engaj ↑",
               date_desc:"mais recentes", date_asc:"mais antigos" }[key] || key;
    }

    function fmt(v) {
      const n = Number(v) || 0;
      if (n >= 1e6) return `${Math.round(n/1e5)/10}M`;
      if (n >= 1000) return `${Math.round(n/100)/10}k`;
      return String(Math.round(n));
    }

    function updateDownloadButton() {
      if (!elBtnDownload) return;
      elBtnDownload.disabled = selectedPosts.size === 0;
      if (elDownloadLabel) {
        elDownloadLabel.textContent = selectedPosts.size
          ? `Baixar ${selectedPosts.size}`
          : "Baixar selecionados";
      }
    }

    function syncSelectionWithPosts() {
      const valid = new Set(currentPosts.filter((p) => p.videoUrl).map((p) => p.postUrl));
      Array.from(selectedPosts).forEach((u) => { if (!valid.has(u)) selectedPosts.delete(u); });
      if (lastSelectionUrl && !valid.has(lastSelectionUrl)) lastSelectionUrl = "";
      updateDownloadButton();
    }

    function getSelectablePosts(limit) {
      return currentPosts
        .slice(0, getRenderLimit())
        .filter((p) => p && p.videoUrl && p.postUrl)
        .slice(0, limit);
    }

    function refreshRenderedSelection() {
      elResultsList.querySelectorAll(".result-item").forEach((row) => {
        const selected = selectedPosts.has(row.dataset.url);
        row.classList.toggle("selected", selected);
      });
      elResultsList.querySelectorAll(".result-check").forEach((input) => {
        input.checked = selectedPosts.has(input.dataset.url);
      });
      updateDownloadButton();
    }

    function selectRange(fromUrl, toUrl, selected) {
      const visiblePosts = currentPosts.slice(0, getRenderLimit());
      const fromIndex = visiblePosts.findIndex((p) => p.postUrl === fromUrl);
      const toIndex = visiblePosts.findIndex((p) => p.postUrl === toUrl);
      if (fromIndex < 0 || toIndex < 0) return false;

      const start = Math.min(fromIndex, toIndex);
      const end = Math.max(fromIndex, toIndex);
      visiblePosts.slice(start, end + 1).forEach((post) => {
        if (!post || !post.videoUrl || !post.postUrl) return;
        if (selected) selectedPosts.add(post.postUrl); else selectedPosts.delete(post.postUrl);
      });
      refreshRenderedSelection();
      return true;
    }

    function setSelected(url, selected, remember) {
      if (!url) return;
      const post = currentPosts.find((p) => p.postUrl === url);
      if (!post || !post.videoUrl) {
        showDiag([{ icon: "⚠️", text: "Este item não tem URL direta de vídeo disponível." }]);
        return;
      }
      if (selected) selectedPosts.add(url); else selectedPosts.delete(url);
      if (remember !== false) lastSelectionUrl = url;
      const row = Array.from(elResultsList.querySelectorAll(".result-item"))
        .find((item) => item.dataset.url === url);
      const input = Array.from(elResultsList.querySelectorAll(".result-check"))
        .find((item) => item.dataset.url === url);
      if (row)   row.classList.toggle("selected", selectedPosts.has(url));
      if (input) input.checked = selectedPosts.has(url);
      updateDownloadButton();
    }

    function onToggleSelection(e, input) {
      const url = input.dataset.url;
      const selected = input.checked;
      if (e.shiftKey && lastSelectionUrl && selectRange(lastSelectionUrl, url, selected)) {
        lastSelectionUrl = url;
        return;
      }
      setSelected(url, selected);
    }
    function onResultClick(e) {
      const input = e.target.closest(".result-check");
      if (input) {
        onToggleSelection(e, input);
        return;
      }
      if (e.target.closest("a")) return;
      const row = e.target.closest(".result-item");
      if (!row) return;
      const selected = !selectedPosts.has(row.dataset.url);
      if (e.shiftKey && lastSelectionUrl && selectRange(lastSelectionUrl, row.dataset.url, selected)) {
        lastSelectionUrl = row.dataset.url;
        return;
      }
      setSelected(row.dataset.url, selected);
    }
    function onRemoveImages() {
      if (!currentPosts.length) return;
      const before = currentPosts.length;
      currentPosts = currentPosts.filter((p) => p.videoUrl);
      const removed = before - currentPosts.length;
      syncSelectionWithPosts();
      renderResults(currentDiagnostics);
      updateCount(currentPosts.length);
      showDiag([{ type: "info", icon: "✅", text: `${removed} foto${removed !== 1 ? "s" : ""} removida${removed !== 1 ? "s" : ""} da lista. Restam ${currentPosts.length} vídeos/reels.` }]);
    }

    function onSelectVideos() {
      const videoPosts = currentPosts.filter((p) => p.videoUrl);
      const allSelected = videoPosts.length > 0 && videoPosts.every((p) => selectedPosts.has(p.postUrl));

      if (allSelected) {
        videoPosts.forEach((p) => selectedPosts.delete(p.postUrl));
      } else {
        videoPosts.forEach((p) => selectedPosts.add(p.postUrl));
      }

      renderResults(currentDiagnostics);
      updateDownloadButton();
      showDiag([{
        type: "info",
        icon: "OK",
        text: allSelected ? "Selecao de videos removida." : `${videoPosts.length} videos selecionados.`
      }]);
    }
    function onSelectLimit(limit) {
      const videoPosts = getSelectablePosts(limit);
      if (!videoPosts.length) {
        showDiag([{ icon: "⚠️", text: "Nenhum video disponivel para selecionar." }]);
        return;
      }

      const allSelected = videoPosts.every((p) => selectedPosts.has(p.postUrl));
      if (allSelected) {
        videoPosts.forEach((p) => selectedPosts.delete(p.postUrl));
        if (videoPosts.some((p) => p.postUrl === lastSelectionUrl)) lastSelectionUrl = "";
      } else {
        videoPosts.forEach((p) => selectedPosts.add(p.postUrl));
        lastSelectionUrl = videoPosts[videoPosts.length - 1].postUrl;
      }

      refreshRenderedSelection();
      showDiag([{
        type: "info",
        icon: "OK",
        text: allSelected
          ? `${videoPosts.length} videos removidos da selecao.`
          : `${videoPosts.length} videos selecionados.`
      }]);
    }
    async function onDownloadSelected() {
      const sel = currentPosts.filter((p) => selectedPosts.has(p.postUrl) && p.videoUrl);
      if (!sel.length) { showDiag([{ icon:"⚠️", text:"Nenhum vídeo selecionado." }]); return; }
      elBtnDownload.disabled = true;
      try {
        const folder = buildDownloadFolder();
        const response = await chrome.runtime.sendMessage({
          source: SOURCE, type: "DOWNLOAD_MEDIA_BATCH",
          items: sel.map((p, i) => ({ url: p.videoUrl, filename: buildVideoFilename(p, i, folder) }))
        });
        const n = response && Number.isFinite(Number(response.started)) ? Number(response.started) : 0;
        showDiag([{ type:"info", icon:"✅", text:`${n} download${n===1?"":"s"} iniciado${n===1?"":"s"} em ${folder}.` }]);
      } catch (err) {
        showDiag([{ icon:"⚠️", text:String(err && err.message ? err.message : err) }]);
      } finally { updateDownloadButton(); }
    }

    function buildDownloadFolder() {
      const h = (global.InstaPostSorterDom.getProfileHandle() || "perfil").replace(/^@/,"");
      const stamp = new Date().toISOString().slice(0,19).replace(/[-:T]/g,"");
      return `insta-post-sorter/${safe(h)}/${safe(labelSort(currentSortKey||"ordem"))}-${stamp}`;
    }
    function buildVideoFilename(post, i, folder) {
      const rank = getPostRank(post) || i + 1;
      const rankLabel = `rank-${String(rank).padStart(4, "0")}`;
      const sortLabel = getDownloadSortParam();
      const metric = getSortMetricValue(post);
      const sc = getShortcode(post.postUrl);
      const parts = [rankLabel, sortLabel, metric, sc ? `post-${sc}` : ""].filter(Boolean);
      return `${folder}/${parts.map(safe).join(" - ")}.mp4`;
    }
    function getPostRank(post) {
      const index = currentPosts.findIndex((p) => p && p.postUrl === post.postUrl);
      return index >= 0 ? index + 1 : 0;
    }
    function getDownloadSortParam() {
      if (currentSortKey === "likes_desc") return "likes-desc";
      if (currentSortKey === "likes_asc") return "likes-asc";
      if (currentSortKey === "comments_desc") return "comments-desc";
      if (currentSortKey === "comments_asc") return "comments-asc";
      if (currentSortKey === "views_desc") return "views-desc";
      if (currentSortKey === "views_asc") return "views-asc";
      if (currentSortKey === "engagement_desc") return "engagement-desc";
      if (currentSortKey === "engagement_asc") return "engagement-asc";
      if (currentSortKey === "date_desc") return "date-desc";
      if (currentSortKey === "date_asc") return "date-asc";
      return "ordem-da-lista";
    }
    function getSortMetricValue(p) {
      if (!currentSortKey) return "";
      if (currentSortKey.startsWith("likes"))      return `likes-${Math.round(Number(p.likes)||0)}`;
      if (currentSortKey.startsWith("comments"))   return `comments-${Math.round(Number(p.comments)||0)}`;
      if (currentSortKey.startsWith("views"))      return `views-${Math.round(Number(p.views)||0)}`;
      if (currentSortKey.startsWith("engagement")) return `score-${Math.round(Number(p.engagementScore)||0)}`;
      if (currentSortKey.startsWith("date"))       return safe(String(p.date||"").slice(0,10));
      return "";
    }
    function safe(v) {
      return String(v||"item").normalize("NFD").replace(/[̀-ͯ]/g,"")
        .replace(/[<>:"|?*\\/\x00-\x1F]/g,"_").replace(/\s+/g,"-").replace(/_+/g,"_").slice(0,80)||"item";
    }
    function getShortcode(url) {
      try { return new URL(url).pathname.split("/").filter(Boolean)[1]||""; } catch(_){return "";}
    }

    function getCacheKey() {
      const h = global.InstaPostSorterDom && global.InstaPostSorterDom.getProfileHandle
        ? global.InstaPostSorterDom.getProfileHandle() : "";
      return h ? `insta-post-sorter:${h}` : "";
    }
    async function saveCache(posts, diagnostics) {
      const k = getCacheKey();
      if (!k || !chrome.storage || !chrome.storage.local) return;
      try {
        await chrome.storage.local.set({
          [k]: {
            posts: posts.slice(0, readLimit),
            diagnostics,
            savedAt: Date.now(),
            readLimit
          }
        });
      } catch (_) {}
    }
    async function clearCache() {
      const k = getCacheKey();
      if (!k || !chrome.storage || !chrome.storage.local) return;
      try { await chrome.storage.local.remove(k); } catch (_) {}
    }
    async function loadCache() {
      const k = getCacheKey();
      if (!k || !chrome.storage || !chrome.storage.local) return false;
      try {
        const r = await chrome.storage.local.get(k);
        const c = r && r[k];
        if (!c || !Array.isArray(c.posts) || !c.posts.length) return false;
        if (c.readLimit) setReadLimit(c.readLimit, false);
        currentPosts = c.posts; currentDiagnostics = c.diagnostics || null;
        updateCount(currentPosts.length); updateProfileStatus(c.diagnostics);
        renderResults(c.diagnostics); enableControls(true);
        elAnalyzeLabel.textContent = "Atualizar indexação";
        showDiag([{ type:"info", icon:"✅", text:"Cache local carregado. Clique para reindexar." }]);
        return true;
      } catch (_) { return false; }
    }

    function buildDiagLines(diag, n) {
      const lines = [];
      if (!diag) return lines;
      const mf = diag.metricsFound || {};
      const hasMet = (mf.likes||0)>0 || (mf.comments||0)>0 || (mf.views||0)>0;
      if (n > 0 && hasMet) {
        const parts = [];
        if (diag.source === "instagram_api") parts.push(`API: ${diag.indexedCount||n}/${diag.totalAvailable||n}`);
        if (mf.likes    > 0) parts.push(`❤ ${mf.likes}`);
        if (mf.comments > 0) parts.push(`💬 ${mf.comments}`);
        if (mf.views    > 0) parts.push(`👁 ${mf.views}`);
        lines.push({ type:"info", icon:"✅", text:parts.join(" · ") });
      }
      (diag.possibleIssues || []).forEach((m) => lines.push({ icon:"⚠️", text:m }));
      return lines;
    }

    function esc(s) { return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
    function escAttr(s) { return esc(s).replace(/"/g,"&quot;"); }

    function setLoading(btn, on) {
      btn.classList.toggle("spinning", on);
      if (btn !== elBtnAnalyze) btn.disabled = on;
    }

    // ── Actions ──────────────────────────────────────────────────────────────
    async function onAnalyze() {
      if (isAnalyzing) { try { global.InstaPostSorter.cancel(); } catch(_){} return; }
      isAnalyzing = true;
      setLoading(elBtnAnalyze, true);
      elAnalyzeLabel.textContent = "Parar indexação";
      try {
        const res = await global.InstaPostSorter.analyze({
          maxPosts: readLimit,
          enrichLimit: 12,
          maxApiPosts: readLimit
        });
        const n = Array.isArray(res.posts) ? res.posts.length : 0;
        await clearCache();
        setPosts(res.posts, res.diagnostics);
        updateCount(n); updateProfileStatus(res.diagnostics);
        showDiag(buildDiagLines(res.diagnostics, n));
        enableControls(n > 0);
        elAnalyzeLabel.textContent = "Re-analisar";
      } catch (err) {
        const cancelled = err && err.name === "AbortError";
        showDiag([{ icon: cancelled?"⏹":"⚠️", text: cancelled?"Análise interrompida.":String(err&&err.message?err.message:err) }]);
        elAnalyzeLabel.textContent = "Analisar Posts";
      } finally { isAnalyzing = false; setLoading(elBtnAnalyze, false); }
    }

    async function onLoadMore() {
      setLoading(elBtnLoadMore, true);
      try {
        const nextLimit = Math.min(readLimit, Math.max(150, currentPosts.length + 100));
        const res = await global.InstaPostSorter.loadMore({ limit: nextLimit, maxSteps:12 });
        if (res && Array.isArray(res.posts)) {
          const merged = mergePostLists(currentPosts, res.posts);
          setPosts(merged, res.diagnostics);
          updateCount(merged.length);
        } else if (res && typeof res.count === "number") {
          updateCount(res.count);
        }
        if (res && res.diagnostics) { updateProfileStatus(res.diagnostics); showDiag(buildDiagLines(res.diagnostics, res.count||0)); }
      } catch (err) {
        showDiag([{ icon:"⚠️", text:String(err&&err.message?err.message:err) }]);
      } finally { setLoading(elBtnLoadMore, false); }
    }

    async function onSort(key) {
      if (!currentPosts.length) { showDiag([{ icon:"⚠️", text:"Nenhum post para ordenar." }]); return; }
      currentSortKey = key;
      currentPosts = sortPostsLocal(currentPosts, key);
      renderResults(currentDiagnostics);
      highlightSort(key);
      elBtnApplyFeed.disabled = false;
      showDiag([{ type:"info", icon:"✅", text:`Ordenado: ${labelSort(key)}` }]);
    }

    async function onApplyFeed() {
      if (!currentSortKey) { showDiag([{ icon:"⚠️", text:"Escolha uma ordenação antes." }]); return; }
      elBtnApplyFeed.disabled = true;
      try {
        const res = await global.InstaPostSorter.sort(currentSortKey);
        if (res && res.ok) showDiag([{ type:"info", icon:"✅", text:`Aplicado: ${res.sortedCount||0} cards.` }]);
        else showDiag([{ icon:"⚠️", text:res&&res.error?res.error:"Não foi possível aplicar no Instagram." }]);
      } catch (err) {
        showDiag([{ icon:"⚠️", text:String(err&&err.message?err.message:err) }]);
      } finally { elBtnApplyFeed.disabled = !currentSortKey; }
    }

    function onRestore() {
      try {
        const res = global.InstaPostSorter.restore();
        if (res && res.ok) { currentSortKey=""; highlightSort(null); elBtnApplyFeed.disabled=true; renderResults(currentDiagnostics); showDiag([]); }
        else showDiag([{ icon:"⚠️", text:res&&res.error?res.error:"Nada para restaurar." }]);
      } catch (err) { showDiag([{ icon:"⚠️", text:String(err&&err.message?err.message:err) }]); }
    }

    async function onExport() {
      try { await global.InstaPostSorter.exportCsv({ download:true, filename:"instagram-posts.csv" }); }
      catch (err) { showDiag([{ icon:"⚠️", text:String(err&&err.message?err.message:err) }]); }
    }

    // ── Wire events ───────────────────────────────────────────────────────────
    initSectionToggles();
    initReadLimit();
    elBtnAnalyze.addEventListener("click", onAnalyze);
    elBtnLoadMore.addEventListener("click", onLoadMore);
    elBtnApplyFeed.addEventListener("click", onApplyFeed);
    elBtnRestore.addEventListener("click", onRestore);
    elBtnExport.addEventListener("click", onExport);
    elBtnSelectVideos.addEventListener("click", onSelectVideos);
    elBtnRemoveImages.addEventListener("click", onRemoveImages);
    elBtnDownload.addEventListener("click", onDownloadSelected);
    elResultsList.addEventListener("click", onResultClick);
    bulkSelectButtons.forEach((btn) => {
      btn.addEventListener("click", () => onSelectLimit(Number(btn.dataset.selectLimit) || 0));
    });
    sortChips.forEach((btn) => btn.addEventListener("click", () => onSort(btn.dataset.key)));

    loadCache().then((cached) => {
      if (!cached) {
        elResultsList.innerHTML = `<div class="empty-results">Clique em Analisar Posts para iniciar a indexação.</div>`;
        showDiag([]);
      }
    });
  }

  // ─── Panel lifecycle ───────────────────────────────────────────────────────
  function createPanel() {
    if (document.getElementById(PANEL_ID)) return;

    const host = document.createElement("div");
    host.id = PANEL_ID;
    host.style.cssText = "position:fixed;top:60px;right:20px;width:340px;height:640px;min-width:300px;min-height:240px;z-index:2147483647";

    const shadow = host.attachShadow({ mode: "open" });
    shadow.innerHTML = `<style>${STYLES}</style>${TEMPLATE}`;

    document.body.appendChild(host);
    initUI(host, shadow);
    makeDraggable(host, shadow.getElementById("drag-handle"));
    makeResizable(host);
    restorePanelState(host);
  }

  function togglePanel() {
    const el = document.getElementById(PANEL_ID);
    if (el) el.style.display = el.style.display === "none" ? "" : "none";
    else createPanel();
  }

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (!msg || msg.source !== SOURCE) return false;
    if (msg.type === "TOGGLE_PANEL") { togglePanel(); sendResponse({ ok: true }); }
    return false;
  });

})(window);

