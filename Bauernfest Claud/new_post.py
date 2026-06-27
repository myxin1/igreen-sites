"""
Bauernfest — Dashboard para criação de novos posts WordPress.
http://localhost:8765

Uso: python new_post.py  (ou duplo-clique em start_dashboard.bat)
"""

import base64
import json
import os
import re
import time
import urllib.error
import urllib.request
import urllib.parse
from http.server import BaseHTTPRequestHandler, HTTPServer

# ── Configuração ───────────────────────────────────────────────────────────────
WP_API_BASE = "https://bauernfest.org/wp-json/wp/v2"
WP_USER = "ClaudeBot"
WP_PASS = "p8Np bMs8 Xnsh MfH2 cZ7u w5xy"

CONFIG_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "config.json")
SITE_ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "site-bauernfest")
DEFAULT_OPENAI_MODEL = "gpt-4.1-mini"
DEFAULT_GEMINI_MODEL = "gemini-2.5-flash-lite"

OPENAI_MODELS = {
    "gpt-4.1-mini": "OpenAI equilibrado",
    "gpt-4.1-nano": "OpenAI ultra barato",
    "gpt-4o-mini": "OpenAI rapido",
}

GEMINI_MODELS = {
    "gemini-2.5-flash-lite": "Gemini mais barato",
    "gemini-2.5-flash": "Gemini melhor qualidade",
}


def _load_config():
    try:
        with open(CONFIG_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data if isinstance(data, dict) else {}
    except Exception:
        return {}


def _load_openai_key():
    return _load_config().get("openai_key", "")


def _load_gemini_key():
    return _load_config().get("gemini_key", "")


def _faq_toggle_enabled():
    return _load_config().get("faq_toggle_enabled", True)


def _save_config(data):
    existing = _load_config()
    existing.update(data)
    with open(CONFIG_FILE, "w", encoding="utf-8") as f:
        json.dump(existing, f, ensure_ascii=False, indent=2)


BF_CSS_BLOCK    = 2348
BF_NAV_BLOCK    = 2349
BF_FOOTER_BLOCK = 2350

CATEGORIES = {
    "faq":             {"label": "FAQ",                "path": "/FAQ/"},
    "gastronomia":     {"label": "Gastronomia",        "path": "/gastronomia/"},
    "turismo":         {"label": "Turismo",            "path": "/turismo/"},
    "programacao":     {"label": "Programação",        "path": "/programacao/"},
    "receitas-alemas": {"label": "Receitas Alemãs",    "path": "/receitas-alemas/"},
    "sobre":           {"label": "Sobre a Bauernfest", "path": "/sobre/"},
    "curiosidades":    {"label": "Curiosidades",       "path": "/curiosidades/"},
}


# ── Markdown → HTML ────────────────────────────────────────────────────────────

def _inline(text):
    text = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', text)
    text = re.sub(r'\*(.+?)\*',     r'<em>\1</em>',         text)
    text = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'<a href="\2">\1</a>', text)
    return text


def md_to_html(text):
    if not text or not text.strip():
        return "<p>Escreva o conteúdo aqui.</p>"

    parts, in_list, para = [], False, []

    def flush():
        nonlocal para
        if para:
            parts.append(f"<p>{_inline(' '.join(para))}</p>")
            para = []

    def close_ul():
        nonlocal in_list
        if in_list:
            parts.append("</ul>")
            in_list = False

    for raw in text.split("\n"):
        line = raw.strip()
        if not line:
            flush(); close_ul(); continue

        if line.startswith("## "):
            flush(); close_ul()
            parts.append(f"<h2>{_inline(line[3:].strip())}</h2>")
        elif line.startswith("### "):
            flush(); close_ul()
            parts.append(f"<h3>{_inline(line[4:].strip())}</h3>")
        elif line.startswith("- ") or line.startswith("* "):
            flush()
            if not in_list:
                parts.append("<ul>")
                in_list = True
            parts.append(f"  <li>{_inline(line[2:].strip())}</li>")
        else:
            close_ul()
            para.append(line)

    flush(); close_ul()
    return "\n".join(parts)


def _is_faq_heading(text):
    normalized = text.lower().strip()
    return normalized in {"perguntas frequentes", "faq"}


def _render_faq_toggle(title, items):
    if not items:
        return ""

    parts = [f'<section class="bf-faq-block"><h2>{_inline(title)}</h2>']
    for question, answer_md in items:
        answer_html = md_to_html(answer_md, faq_toggle_enabled=False)
        parts.append(
            "<details class=\"bf-faq-item\">"
            f"<summary>{_inline(question)}</summary>"
            f"<div class=\"bf-faq-answer\">{answer_html}</div>"
            "</details>"
        )
    parts.append("</section>")
    return "\n".join(parts)


def md_to_html(text, faq_toggle_enabled=None):
    if not text or not text.strip():
        return "<p>Escreva o conteudo aqui.</p>"

    if faq_toggle_enabled is None:
        faq_toggle_enabled = _faq_toggle_enabled()

    parts, in_list, para = [], False, []
    in_faq = False
    faq_title = "Perguntas Frequentes"
    faq_question = None
    faq_answer_lines = []
    faq_items = []

    def flush():
        nonlocal para
        if para:
            parts.append(f"<p>{_inline(' '.join(para))}</p>")
            para = []

    def flush_faq_answer():
        nonlocal faq_question, faq_answer_lines
        if faq_question:
            faq_items.append((faq_question, "\n".join(faq_answer_lines).strip()))
        faq_question = None
        faq_answer_lines = []

    def close_faq():
        nonlocal in_faq, faq_items, faq_title
        if in_faq:
            flush_faq_answer()
            parts.append(_render_faq_toggle(faq_title, faq_items))
            in_faq = False
            faq_items = []
            faq_title = "Perguntas Frequentes"

    def close_ul():
        nonlocal in_list
        if in_list:
            parts.append("</ul>")
            in_list = False

    for raw in text.split("\n"):
        line = raw.strip()
        if not line:
            if in_faq:
                if faq_question:
                    faq_answer_lines.append("")
                continue
            flush(); close_ul(); continue

        if in_faq:
            if line.startswith("### "):
                flush_faq_answer()
                faq_question = line[4:].strip()
                continue
            if line.startswith("## "):
                close_faq()
            else:
                faq_answer_lines.append(line)
                continue

        if line.startswith("## "):
            flush(); close_ul()
            heading = line[3:].strip()
            if faq_toggle_enabled and _is_faq_heading(heading):
                in_faq = True
                faq_title = heading
                faq_question = None
                faq_answer_lines = []
                faq_items = []
            else:
                parts.append(f"<h2>{_inline(heading)}</h2>")
        elif line.startswith("### "):
            flush(); close_ul()
            parts.append(f"<h3>{_inline(line[4:].strip())}</h3>")
        elif line.startswith("- ") or line.startswith("* "):
            flush()
            if not in_list:
                parts.append("<ul>")
                in_list = True
            parts.append(f"  <li>{_inline(line[2:].strip())}</li>")
        else:
            close_ul()
            para.append(line)

    close_faq()
    flush(); close_ul()
    return "\n".join(parts)


def extract_meta_desc(md):
    for raw in md.split("\n"):
        line = raw.strip()
        if line and not line.startswith("#") and not line.startswith("-") and not line.startswith("*"):
            clean = re.sub(r'\*\*(.+?)\*\*', r'\1', line)
            clean = re.sub(r'\*(.+?)\*',     r'\1', clean)
            clean = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', clean)
            if len(clean) > 155:
                return clean[:152].rsplit(' ', 1)[0] + '...'
            return clean
    return ""


def _clean_html_title(text):
    text = re.sub(r"<[^>]+>", "", text or "")
    text = text.replace("&amp;", "&").replace("&quot;", '"').replace("&#39;", "'")
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _fallback_link_text(slug):
    text = slug.replace("-", " ").replace("_", " ").strip()
    return text.title() if text else "Ver artigo"


def _relative_site_url(file_path):
    rel_path = os.path.relpath(file_path, SITE_ROOT).replace("\\", "/")
    if rel_path.lower().endswith("/index.html"):
        rel_path = rel_path[:-10]
    elif rel_path.lower() == "index.html":
        rel_path = ""
    elif rel_path.lower().endswith(".html"):
        rel_path = rel_path[:-5]
    return f"/{rel_path.strip('/')}/" if rel_path else "/"


def _relative_live_url(url):
    parsed = urllib.parse.urlparse(url or "")
    path = parsed.path or "/"
    return path if path.endswith("/") else f"{path}/"


def _read_html_title(file_path):
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read(4000)
    except Exception:
        try:
            with open(file_path, "r", encoding="latin-1") as f:
                content = f.read(4000)
        except Exception:
            return ""

    match = re.search(r"<title>(.*?)</title>", content, re.IGNORECASE | re.DOTALL)
    if not match:
        return ""
    return _clean_html_title(match.group(1))


def _load_category_link_manifest(category_dir, limit=5):
    manifest_path = os.path.join(category_dir, "_links.json")
    if not os.path.isfile(manifest_path):
        return []

    try:
        with open(manifest_path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception:
        return []

    links = []
    for item in data if isinstance(data, list) else []:
        text = (item.get("text") or "").strip()
        url = (item.get("url") or "").strip()
        if text and url:
            links.append({"text": text, "url": url})
        if len(links) >= limit:
            break
    return links


def get_category_default_links(category_key, limit=5):
    cat = CATEGORIES[category_key]
    category_dir = os.path.join(SITE_ROOT, category_key)
    links = []

    if os.path.isdir(category_dir):
        manifest_links = _load_category_link_manifest(category_dir, limit=limit)
        if manifest_links:
            return manifest_links

        for root, _, files in os.walk(category_dir):
            for name in sorted(files):
                if not name.lower().endswith(".html"):
                    continue
                if name.lower() == "index.html" and os.path.normpath(root) == os.path.normpath(category_dir):
                    continue

                file_path = os.path.join(root, name)
                url = _relative_site_url(file_path)
                slug = os.path.basename(os.path.dirname(file_path)) if name.lower() == "index.html" else os.path.splitext(name)[0]
                text = _read_html_title(file_path) or _fallback_link_text(slug)
                links.append({"text": text, "url": url})

    seen = set()
    unique_links = []
    for link in links:
        if link["url"] in seen:
            continue
        seen.add(link["url"])
        unique_links.append(link)
        if len(unique_links) >= limit:
            break

    if unique_links:
        return unique_links

    cat_id = get_category_id(category_key)
    if cat_id:
        try:
            req = urllib.request.Request(
                f"{WP_API_BASE}/posts?categories={cat_id}&per_page={limit}&_fields=link,title",
                headers=_wp_headers(),
            )
            with urllib.request.urlopen(req, timeout=15) as r:
                posts = json.loads(r.read())
            live_links = []
            for post in posts:
                live_links.append({
                    "text": _clean_html_title(post.get("title", {}).get("rendered", "")) or "Ver artigo",
                    "url": _relative_live_url(post.get("link", "")),
                })
            if live_links:
                return live_links
        except Exception:
            pass

    return [{"text": f"Ver todos os artigos de {cat['label']}", "url": cat["path"]}]


# ── OpenAI ─────────────────────────────────────────────────────────────────────

def _friendly_openai_error(exc):
    try:
        raw = exc.read().decode("utf-8", errors="replace")
    except Exception:
        raw = ""

    try:
        payload = json.loads(raw)
        err = payload.get("error", {})
    except Exception:
        err = {}

    code = err.get("code") or ""
    message = err.get("message") or raw or str(exc)

    if code == "insufficient_quota":
        return (
            "A chave OpenAI foi aceita, mas a conta/projeto esta sem cota. "
            "Ative billing ou use outra chave com creditos disponiveis."
        )
    if code == "invalid_api_key":
        return "A chave OpenAI salva e invalida. Confira a chave na aba Configuracoes."
    if code == "rate_limit_exceeded":
        return "O limite de requisicoes da OpenAI foi atingido. Aguarde um pouco e tente novamente."
    if exc.code == 401:
        return "A OpenAI recusou a autenticacao. Revise a chave salva na aba Configuracoes."
    if exc.code == 429:
        return f"A OpenAI recusou a geracao por limite/cota: {message}"

    return f"OpenAI HTTP {exc.code}: {message}"


def generate_article(keyword, word_count):
    key = _load_openai_key()
    if not key:
        raise ValueError("Chave OpenAI não configurada — abra a aba Configurações")

    prompt = (
        f'Escreva um artigo em português brasileiro sobre "{keyword}", '
        f'com aproximadamente {word_count} palavras.\n\n'
        f'Regras:\n'
        f'- NÃO inclua o título H1 — o título da página já contém "{keyword}"\n'
        f'- O PRIMEIRO parágrafo deve mencionar "{keyword}" naturalmente na primeira frase\n'
        f'- Use ## para subtítulos H2 e ### para H3\n'
        f'- Use - para bullet points\n'
        f'- Use **negrito** para termos importantes\n'
        f'- Mencione "{keyword}" pelo menos 3x ao longo do texto\n'
        f'- Use [texto](/caminho/) para links internos quando mencionar outras seções\n'
        f'- Inclua ## Perguntas Frequentes ao final com 3 perguntas (### para cada)\n'
        f'- Tom: editorial, informativo, elegante\n'
        f'- Retorne APENAS o markdown, sem prefácio nem explicação'
    )

    body = json.dumps({
        "model": "gpt-4o",
        "messages": [
            {
                "role": "system",
                "content": (
                    "Você é redator editorial especializado na Bauernfest de Petrópolis, RJ. "
                    "Escreve em português brasileiro, tom elegante e informativo. "
                    "Contexto: bauernfest.org, guia sobre a festa alemã anual."
                ),
            },
            {"role": "user", "content": prompt},
        ],
        "max_tokens": max(2000, int(word_count * 1.8)),
        "temperature": 0.7,
    }).encode("utf-8")

    req = urllib.request.Request(
        "https://api.openai.com/v1/chat/completions",
        data=body,
        method="POST",
        headers={
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=90) as r:
            data = json.loads(r.read())
            return data["choices"][0]["message"]["content"].strip()
    except urllib.error.HTTPError as e:
        raise ValueError(_friendly_openai_error(e)) from e


# ── WordPress ──────────────────────────────────────────────────────────────────

def _article_system_prompt():
    return (
        "Voce e redator editorial especializado na Bauernfest de Petropolis, RJ. "
        "Escreve em portugues brasileiro, tom elegante e informativo. "
        "Contexto: bauernfest.org, guia sobre a festa alema anual."
    )


def _article_prompt(keyword, word_count, category_key="faq"):
    cat = CATEGORIES.get(category_key, CATEGORIES["faq"])
    default_links = get_category_default_links(category_key)
    link_examples = ", ".join(f'[{item["text"]}]({item["url"]})' for item in default_links[:4])
    faq_rule = (
        "- Inclua ## Perguntas Frequentes ao final com 3 perguntas, usando ### em cada pergunta.\n"
        if _faq_toggle_enabled()
        else "- Nao inclua secao de FAQ. Encerre o artigo com uma conclusao forte.\n"
    )
    return (
        f'Escreva um artigo em portugues brasileiro sobre "{keyword}", '
        f'com aproximadamente {word_count} palavras.\n\n'
        f"Regras:\n"
        f'- Nao inclua o titulo H1. O titulo da pagina ja contem "{keyword}".\n'
        f'- O primeiro paragrafo deve mencionar "{keyword}" naturalmente na primeira frase.\n'
        f"- Use ## para subtitulos H2 e ### para H3.\n"
        f"- Use - para bullet points.\n"
        f"- Use **negrito** para termos importantes.\n"
        f'- Mencione "{keyword}" pelo menos 3x ao longo do texto.\n'
        f'- O artigo pertence a categoria "{cat["label"]}" e deve reforcar esse contexto editorial.\n'
        f'- Sempre que fizer links internos, priorize URLs da categoria {cat["path"]}.\n'
        f"- Use [texto](/caminho/) para links internos quando mencionar outras secoes.\n"
        f"- Exemplos de links internos preferenciais desta categoria: {link_examples}.\n"
        f"{faq_rule}"
        f"- Tom: editorial, informativo, elegante.\n"
        f"- Retorne apenas o markdown, sem prefacio nem explicacao."
    )


def _friendly_gemini_error(exc):
    try:
        raw = exc.read().decode("utf-8", errors="replace")
    except Exception:
        raw = ""

    try:
        payload = json.loads(raw)
        err = payload.get("error", {})
    except Exception:
        err = {}

    status = err.get("status") or ""
    message = err.get("message") or raw or str(exc)

    if exc.code == 400:
        return f"Gemini recusou a requisicao: {message}"
    if exc.code == 401:
        return "A chave Gemini e invalida ou nao tem permissao para esse projeto."
    if exc.code == 403:
        return f"Gemini bloqueou a geracao: {message}"
    if exc.code == 503:
        return (
            "Gemini esta com alta demanda no momento. Tente novamente em alguns segundos. "
            "Se continuar, troque para o modelo gemini-2.5-flash ou use OpenAI."
        )
    if exc.code == 429 or status == "RESOURCE_EXHAUSTED":
        return f"Gemini atingiu limite/cota: {message}"

    return f"Gemini HTTP {exc.code}: {message}"


def _extract_gemini_text(payload):
    texts = []
    for candidate in payload.get("candidates", []):
        content = candidate.get("content", {})
        for part in content.get("parts", []):
            text = part.get("text")
            if text:
                texts.append(text)
    return "\n".join(texts).strip()


def _generate_with_openai(keyword, word_count, model, category_key="faq"):
    key = _load_openai_key()
    if not key:
        raise ValueError("Chave OpenAI nao configurada. Abra a aba Configuracoes.")

    body = json.dumps({
        "model": model or DEFAULT_OPENAI_MODEL,
        "messages": [
            {"role": "system", "content": _article_system_prompt()},
            {"role": "user", "content": _article_prompt(keyword, word_count, category_key)},
        ],
        "max_tokens": max(1800, int(word_count * 1.8)),
        "temperature": 0.7,
    }).encode("utf-8")

    req = urllib.request.Request(
        "https://api.openai.com/v1/chat/completions",
        data=body,
        method="POST",
        headers={
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=90) as r:
            data = json.loads(r.read())
            return data["choices"][0]["message"]["content"].strip()
    except urllib.error.HTTPError as e:
        raise ValueError(_friendly_openai_error(e)) from e


def _generate_with_gemini(keyword, word_count, model, category_key="faq"):
    key = _load_gemini_key()
    if not key:
        raise ValueError("Chave Gemini nao configurada. Abra a aba Configuracoes.")

    body = json.dumps({
        "system_instruction": {
            "parts": [{"text": _article_system_prompt()}],
        },
        "contents": [
            {
                "role": "user",
                "parts": [{"text": _article_prompt(keyword, word_count, category_key)}],
            }
        ],
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": max(1800, int(word_count * 1.8)),
            "thinkingConfig": {"thinkingBudget": 0},
        },
    }).encode("utf-8")

    req = urllib.request.Request(
        f"https://generativelanguage.googleapis.com/v1beta/models/{model or DEFAULT_GEMINI_MODEL}:generateContent",
        data=body,
        method="POST",
        headers={
            "x-goog-api-key": key,
            "Content-Type": "application/json",
        },
    )
    retry_delays = [1.5, 3.0, 6.0]
    last_error = None

    for attempt, delay in enumerate(retry_delays, start=1):
        try:
            with urllib.request.urlopen(req, timeout=90) as r:
                data = json.loads(r.read())
                text = _extract_gemini_text(data)
                if not text:
                    raise ValueError("Gemini respondeu sem texto utilizavel.")
                return text
        except urllib.error.HTTPError as e:
            last_error = e
            if e.code in (429, 503) and attempt < len(retry_delays):
                time.sleep(delay)
                continue
            raise ValueError(_friendly_gemini_error(e)) from e

    if last_error is not None:
        raise ValueError(_friendly_gemini_error(last_error))
    raise ValueError("Falha inesperada ao gerar com Gemini.")


def generate_article(keyword, word_count, provider="openai", model="", category_key="faq"):
    provider = (provider or "openai").strip().lower()
    if provider == "gemini":
        if model and model not in GEMINI_MODELS:
            raise ValueError("Modelo Gemini nao reconhecido.")
        return _generate_with_gemini(keyword, word_count, model or DEFAULT_GEMINI_MODEL, category_key)

    if model and model not in OPENAI_MODELS:
        raise ValueError("Modelo OpenAI nao reconhecido.")
    return _generate_with_openai(keyword, word_count, model or DEFAULT_OPENAI_MODEL, category_key)


def _wp_headers():
    cred = base64.b64encode(f"{WP_USER}:{WP_PASS}".encode()).decode()
    return {
        "Authorization": f"Basic {cred}",
        "Content-Type": "application/json",
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0.0.0 Safari/537.36"
        ),
    }


def get_category_id(slug):
    try:
        req = urllib.request.Request(
            f"{WP_API_BASE}/categories?slug={slug}",
            headers=_wp_headers(),
        )
        with urllib.request.urlopen(req, timeout=10) as r:
            data = json.loads(r.read())
            if data:
                return data[0]["id"]
    except Exception:
        pass
    return None


def build_sidebar(links, category_key):
    valid = [lk for lk in links if lk.get("text") and lk.get("url")]
    source_links = valid or get_category_default_links(category_key)
    items = "\n".join(
        f'      <li><a href="{lk["url"]}">{lk["text"]}</a></li>'
        for lk in source_links
    )
    return items


def build_content(title, category_key, body_html, links):
    cat = CATEGORIES[category_key]
    t   = title.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    faq_styles = (
        "<style>"
        ".bf-faq-block{margin-top:2.75rem;padding:1.4rem 1.25rem;"
        "background:linear-gradient(180deg,rgba(200,146,42,.06),rgba(200,146,42,.02));"
        "border:1px solid rgba(200,146,42,.12);border-radius:22px}"
        ".bf-faq-block h2{margin:0 0 1rem!important}"
        ".bf-faq-item{border-top:1px solid rgba(16,8,5,.12)}"
        ".bf-faq-item:last-child{border-bottom:1px solid rgba(16,8,5,.12)}"
        ".bf-faq-item + .bf-faq-item{margin-top:.2rem}"
        ".bf-faq-item summary{list-style:none;cursor:pointer;position:relative;"
        "padding:1rem 3.2rem 1rem .2rem;font-weight:700;color:#22110a;transition:color .2s ease}"
        ".bf-faq-item summary::-webkit-details-marker{display:none}"
        ".bf-faq-item summary::after{content:'+';position:absolute;right:.1rem;top:50%;"
        "transform:translateY(-50%);width:2rem;height:2rem;border-radius:999px;display:flex;"
        "align-items:center;justify-content:center;background:#f3e3bf;color:#8a5a14;"
        "font-size:1.2rem;font-weight:700;box-shadow:inset 0 0 0 1px rgba(200,146,42,.22);"
        "transition:all .22s ease}"
        ".bf-faq-item[open] summary{color:#8a5a14}"
        ".bf-faq-item[open] summary::after{content:'−';background:#c8922a;color:#fff;box-shadow:none}"
        ".bf-faq-answer{padding:0 0 1rem .2rem;color:#4a3428}"
        ".bf-faq-answer p:last-child,.bf-faq-answer ul:last-child{margin-bottom:0}"
        "</style>"
    )
    return (
        f'<!-- wp:block {{"ref":{BF_CSS_BLOCK}}} --><!-- /wp:block -->\n\n'
        f'<!-- wp:block {{"ref":{BF_NAV_BLOCK}}} --><!-- /wp:block -->\n\n'
        f'<!-- wp:html -->\n'
        f'{faq_styles}\n'
        f'<div class="bf-breadcrumb"><nav class="bfc" aria-label="Breadcrumb">\n'
        f'  <a href="https://bauernfest.org/">Bauernfest</a><span>›</span>\n'
        f'  <a href="{cat["path"]}">{cat["label"]}</a><span>›</span>\n'
        f'  <span>{t}</span>\n'
        f'</nav></div>\n'
        f'<div class="bf-page-wrap"><div class="bf-page-inner">\n'
        f'<article class="bf-article">\n'
        f'  <h1>{t}</h1>\n'
        f'{body_html}\n'
        f'</article>\n'
        f'<aside>\n'
        f'  <div class="sb-card">\n'
        f'    <span class="lbl">{cat["label"]}</span>\n'
        f'    <ul>\n'
        f'{build_sidebar(links, category_key)}\n'
        f'    </ul>\n'
        f'  </div>\n'
        f'</aside>\n'
        f'</div></div>\n'
        f'<!-- /wp:html -->\n\n'
        f'<!-- wp:block {{"ref":{BF_FOOTER_BLOCK}}} --><!-- /wp:block -->'
    )


def create_wp_post(title, slug, category_key, body_md, links, keyword="", meta_desc=""):
    cat_id  = get_category_id(category_key)
    payload = {
        "title":    title,
        "slug":     slug,
        "status":   "draft",
        "template": "elementor_canvas",
        "content":  build_content(title, category_key, md_to_html(body_md), links),
        "meta": {
            "rank_math_focus_keyword": keyword,
            "rank_math_title":         f"{title} — Bauernfest.org",
            "rank_math_description":   meta_desc,
        },
    }
    if cat_id:
        payload["categories"] = [cat_id]

    req = urllib.request.Request(
        f"{WP_API_BASE}/posts",
        data=json.dumps(payload).encode("utf-8"),
        method="POST",
        headers=_wp_headers(),
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())


# ── HTML ───────────────────────────────────────────────────────────────────────

HTML = r"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Bauernfest — Dashboard</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@900&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  :root{--gold:#C8922A;--glt:#E8B84B;--dark:#100805;--dark2:#1c0d06;}
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'DM Sans',sans-serif;background:var(--dark);
    min-height:100vh;display:flex;flex-direction:column;
    align-items:center;padding:2.5rem 1rem 4rem;}

  /* Card */
  .card{background:var(--dark2);border:1px solid rgba(200,146,42,.16);
    border-radius:20px;padding:2rem 2rem 2.5rem;
    width:100%;max-width:640px;box-shadow:0 8px 40px rgba(0,0,0,.5);}

  /* Header */
  .logo{font-family:'Playfair Display',serif;font-size:1.4rem;color:var(--glt);}
  .logo span{color:#fff;}
  .tagline{font-size:.72rem;color:rgba(255,247,238,.28);
    letter-spacing:.07em;text-transform:uppercase;margin-top:.2rem;}

  /* Tabs */
  .tabs{display:flex;gap:1.75rem;border-bottom:1px solid rgba(200,146,42,.12);
    margin:1.5rem 0 2rem;}
  .tab-btn{background:none;border:none;border-bottom:2px solid transparent;
    color:rgba(255,247,238,.25);font-family:'DM Sans',sans-serif;
    font-size:.78rem;font-weight:600;letter-spacing:.07em;text-transform:uppercase;
    padding:.5rem 0;margin-bottom:-1px;cursor:pointer;
    transition:color .18s,border-color .18s;}
  .tab-btn.active{color:var(--glt);border-bottom-color:var(--gold);}
  .tab-btn:hover:not(.active){color:rgba(255,247,238,.5);}
  .tab-pane{display:none;}
  .tab-pane.active{display:block;}

  /* Form elements */
  label{display:block;font-size:.71rem;font-weight:600;letter-spacing:.06em;
    text-transform:uppercase;color:var(--gold);margin-bottom:.4rem;margin-top:1.2rem;}
  label:first-child{margin-top:0;}
  input[type=text],input[type=number],input[type=password],select,textarea{
    width:100%;background:rgba(255,247,238,.055);
    border:1px solid rgba(200,146,42,.2);border-radius:10px;
    padding:.68rem 1rem;color:#fff;
    font-family:'DM Sans',sans-serif;font-size:.93rem;
    outline:none;transition:border-color .2s;}
  input:focus,select:focus,textarea:focus{border-color:rgba(200,146,42,.6);}
  input::placeholder,textarea::placeholder{color:rgba(255,247,238,.2);}
  select option{background:#1c0d06;color:#fff;}
  textarea{font-family:'Courier New',monospace;font-size:.85rem;
    resize:vertical;min-height:220px;line-height:1.65;}
  .row{display:flex;gap:.9rem;}
  .row>div{flex:1;}
  .hint{font-size:.69rem;color:rgba(255,247,238,.26);margin-top:.35rem;}
  .hint em{color:rgba(232,184,75,.55);font-style:normal;}

  /* Section divider */
  .div{display:flex;align-items:center;gap:.6rem;margin:1.6rem 0 1rem;
    font-size:.69rem;font-weight:600;letter-spacing:.08em;text-transform:uppercase;
    color:rgba(200,146,42,.45);}
  .div::before,.div::after{content:'';flex:1;height:1px;background:rgba(200,146,42,.1);}

  /* Guide chips */
  .guide{margin-top:.45rem;font-size:.7rem;color:rgba(255,247,238,.28);line-height:2;}
  .guide code{background:rgba(255,247,238,.06);border-radius:4px;padding:.1rem .35rem;
    font-family:'Courier New',monospace;font-size:.72rem;color:rgba(232,184,75,.6);}

  /* Sidebar link rows */
  .link-row{display:flex;gap:.45rem;margin-bottom:.4rem;align-items:center;}
  .link-row input{flex:1;margin-top:0!important;}
  .link-row .rm{flex-shrink:0;background:none;border:none;
    color:rgba(255,247,238,.22);cursor:pointer;font-size:1rem;
    padding:0 .2rem;transition:color .15s;}
  .link-row .rm:hover{color:#ff7070;}
  .btn-add{width:100%;margin-top:.3rem;padding:.5rem;background:none;
    border:1px dashed rgba(200,146,42,.18);border-radius:8px;
    color:rgba(232,184,75,.38);font-family:'DM Sans',sans-serif;font-size:.78rem;
    cursor:pointer;transition:border-color .2s,color .2s;}
  .btn-add:hover{border-color:rgba(200,146,42,.4);color:var(--glt);}

  /* AI button */
  .btn-ai{display:flex;align-items:center;justify-content:center;gap:.45rem;
    width:100%;margin-top:.7rem;padding:.7rem;
    background:rgba(200,146,42,.07);border:1px solid rgba(200,146,42,.2);
    color:var(--glt);border-radius:10px;cursor:pointer;
    font-family:'DM Sans',sans-serif;font-size:.9rem;font-weight:600;
    transition:background .2s,border-color .2s;}
  .btn-ai:hover{background:rgba(200,146,42,.14);border-color:rgba(200,146,42,.38);}
  .btn-ai:disabled{opacity:.38;cursor:not-allowed;}

  /* Primary button */
  .btn{display:flex;align-items:center;justify-content:center;gap:.5rem;
    width:100%;margin-top:1.8rem;padding:.85rem;
    background:linear-gradient(135deg,var(--gold),var(--glt));
    color:#100805;font-family:'DM Sans',sans-serif;
    font-weight:700;font-size:.98rem;border:none;
    border-radius:999px;cursor:pointer;transition:opacity .2s,transform .15s;}
  .btn:hover{opacity:.9;transform:translateY(-1px);}
  .btn:disabled{opacity:.38;cursor:not-allowed;transform:none;}

  /* Save button (config) */
  .btn-save{display:flex;align-items:center;justify-content:center;gap:.4rem;
    width:100%;margin-top:1rem;padding:.75rem;
    background:rgba(200,146,42,.1);border:1px solid rgba(200,146,42,.28);
    color:var(--glt);font-family:'DM Sans',sans-serif;
    font-weight:600;font-size:.92rem;border-radius:10px;
    cursor:pointer;transition:background .2s;}
  .btn-save:hover{background:rgba(200,146,42,.18);}

  /* Spinner */
  .spin{display:none;width:15px;height:15px;
    border:2px solid rgba(16,8,5,.3);border-top-color:currentColor;
    border-radius:50%;animation:rot .6s linear infinite;}
  @keyframes rot{to{transform:rotate(360deg);}}

  /* Result */
  .result{display:none;margin-top:1.4rem;padding:1rem 1.1rem;
    border-radius:12px;font-size:.87rem;line-height:1.55;}
  .result.ok{display:block;background:rgba(200,146,42,.08);
    border:1px solid rgba(200,146,42,.25);color:var(--glt);}
  .result.err{display:block;background:rgba(139,26,26,.13);
    border:1px solid rgba(139,26,26,.35);color:#ff9090;}
  .result-links{display:flex;gap:.55rem;margin-top:.75rem;flex-wrap:wrap;}
  .result-links a{color:var(--glt);font-weight:700;text-decoration:none;
    padding:.38rem .8rem;border:1px solid rgba(232,184,75,.45);
    border-radius:999px;font-size:.78rem;transition:background .2s;}
  .result-links a:hover{background:rgba(232,184,75,.1);}

  /* Config status */
  .cfg-status{margin-top:.75rem;font-size:.82rem;min-height:1.2rem;}
  .cfg-status.ok{color:var(--glt);}
  .cfg-status.err{color:#ff9090;}

  /* Config key indicator */
  .key-badge{display:inline-flex;align-items:center;gap:.35rem;
    margin-top:.5rem;font-size:.73rem;padding:.3rem .7rem;
    border-radius:999px;border:1px solid;}
  .key-badge.set{color:rgba(232,184,75,.8);border-color:rgba(200,146,42,.25);}
  .key-badge.unset{color:rgba(255,144,144,.7);border-color:rgba(139,26,26,.3);}
</style>
</head>
<body>
<div class="card">

  <!-- Header -->
  <div class="logo">Bauern<span>fest</span></div>
  <div class="tagline">Dashboard Editorial</div>

  <!-- Tabs -->
  <div class="tabs">
    <button class="tab-btn active" data-tab="create" onclick="switchTab('create')">Criar Artigo</button>
    <button class="tab-btn"        data-tab="config" onclick="switchTab('config')">Configurações</button>
  </div>

  <!-- ══════════════════════════════════════════════════════════
       ABA 1 — CRIAR ARTIGO
  ══════════════════════════════════════════════════════════ -->
  <div class="tab-pane active" id="tab-create">

    <label for="title">Título do artigo</label>
    <input id="title" type="text" placeholder="Ex: O que comer na Bauernfest 2026" autocomplete="off">

    <div class="row" style="margin-top:1.2rem">
      <div>
        <label for="slug" style="margin-top:0">Slug (URL)</label>
        <input id="slug" type="text" placeholder="o-que-comer-bauernfest" autocomplete="off">
        <div class="hint">bauernfest.org/<em id="slug-preview">slug</em>/</div>
      </div>
      <div>
        <label for="category" style="margin-top:0">Categoria</label>
        <select id="category">
          <option value="faq">FAQ</option>
          <option value="gastronomia">Gastronomia</option>
          <option value="turismo">Turismo</option>
          <option value="programacao">Programação</option>
          <option value="receitas-alemas">Receitas Alemãs</option>
          <option value="sobre">Sobre a Bauernfest</option>
          <option value="curiosidades">Curiosidades</option>
        </select>
      </div>
    </div>

    <!-- Gerador IA -->
    <div class="div"><span>Gerar com IA</span></div>

    <div class="row">
      <div>
        <label for="keyword" style="margin-top:0">Palavra-chave</label>
        <input id="keyword" type="text" placeholder="Ex: pratos típicos bauernfest" autocomplete="off">
      </div>
      <div style="max-width:148px">
        <label for="wordcount" style="margin-top:0">Nº de palavras</label>
        <input id="wordcount" type="number" value="800" min="300" max="2000" step="100">
      </div>
    </div>
    <div class="row" style="margin-top:.9rem">
      <div>
        <label for="provider" style="margin-top:0">IA</label>
        <select id="provider" onchange="updateModelOptions()">
          <option value="openai">OpenAI</option>
          <option value="gemini">Gemini</option>
        </select>
      </div>
      <div>
        <label for="model" style="margin-top:0">Modelo</label>
        <select id="model"></select>
      </div>
    </div>
    <div class="hint">Mais barato hoje: Gemini flash-lite ou OpenAI gpt-4.1-nano.</div>
    <button class="btn-ai" id="gen-btn" onclick="gerar()">
      <span id="gen-label">✨ Gerar conteúdo com IA</span>
      <div class="spin" id="gen-spin" style="border-top-color:var(--glt)"></div>
    </button>

    <!-- Conteúdo -->
    <div class="div"><span>Conteúdo</span></div>

    <label for="meta_desc" style="margin-top:0">
      Meta description
      <span style="font-weight:400;text-transform:none;letter-spacing:0;
        color:rgba(255,247,238,.28);font-size:.69rem"> — Rank Math (auto)</span>
    </label>
    <input id="meta_desc" type="text" placeholder="Descrição para o Google (até 155 caracteres)" maxlength="160" autocomplete="off">
    <div class="hint"><em id="meta-chars">0</em>/155 caracteres</div>

    <label for="body">Markdown</label>
    <textarea id="body" placeholder="## Título da seção&#10;&#10;Parágrafo normal...&#10;&#10;- Item da lista&#10;[Texto](/caminho/)"></textarea>
    <div class="guide">
      <code>## H2</code> <code>### H3</code> <code>- bullet</code>
      <code>**negrito**</code> <code>*itálico*</code> <code>[texto](/url/)</code>
    </div>

    <!-- Sidebar links -->
    <div class="div"><span>Links da sidebar</span></div>

    <div id="links-container"></div>
    <button class="btn-add" onclick="addLink()">+ Adicionar link</button>
    <div class="hint" style="margin-top:.45rem">Deixe vazio → usa link da categoria como padrão</div>

    <!-- Botão criar -->
    <button class="btn" id="btn" onclick="criar()">
      <span id="btn-label">Criar Rascunho no WordPress</span>
      <div class="spin" id="btn-spin" style="border-top-color:#100805"></div>
    </button>

    <div class="result" id="result"></div>

  </div><!-- /tab-create -->


  <!-- ══════════════════════════════════════════════════════════
       ABA 2 — CONFIGURAÇÕES
  ══════════════════════════════════════════════════════════ -->
  <div class="tab-pane" id="tab-config">

    <label for="openai-key" style="margin-top:0">Chave API OpenAI</label>
    <input id="openai-key" type="password" placeholder="sk-proj-..." autocomplete="off">
    <div class="hint" style="margin-top:.4rem">
      Obtenha em <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer"><em>platform.openai.com/api-keys</em></a>
    </div>

    <label for="gemini-key">Chave API Gemini</label>
    <input id="gemini-key" type="password" placeholder="AIza..." autocomplete="off">
    <div class="hint" style="margin-top:.4rem">
      Obtenha em <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer"><em>aistudio.google.com/apikey</em></a>
    </div>

    <div id="key-status"></div>
    <label style="display:flex;align-items:center;gap:.6rem;margin-top:1rem;color:#fff;text-transform:none;letter-spacing:0;font-size:.9rem;font-weight:500">
      <input id="faq-toggle-enabled" type="checkbox" style="width:auto;transform:translateY(1px)">
      Gerar FAQ final em toggle
    </label>
    <div class="hint" style="margin-top:.35rem">
      Se desligado, o artigo termina na conclusao e a IA nao cria FAQ.
    </div>

    <button class="btn-save" onclick="salvarConfig()">
      <span id="save-label">💾 Salvar chave</span>
      <div class="spin" id="save-spin" style="border-top-color:var(--glt)"></div>
    </button>
    <div class="cfg-status" id="cfg-msg"></div>

  </div><!-- /tab-config -->

</div><!-- /card -->

<script>
  // ── Tabs ────────────────────────────────────────────────────────────────────
  const MODEL_OPTIONS = {
    openai: [
      { value: 'gpt-4.1-mini', label: 'gpt-4.1-mini - equilibrio custo/qualidade' },
      { value: 'gpt-4.1-nano', label: 'gpt-4.1-nano - mais barato' },
      { value: 'gpt-4o-mini', label: 'gpt-4o-mini - rapido' },
    ],
    gemini: [
      { value: 'gemini-2.5-flash-lite', label: 'gemini-2.5-flash-lite - mais barato' },
      { value: 'gemini-2.5-flash', label: 'gemini-2.5-flash - melhor qualidade' },
    ],
  };
  const DEFAULT_MODELS = { openai: 'gpt-4.1-mini', gemini: 'gemini-2.5-flash-lite' };
  let loadedConfig = {};

  function switchTab(name) {
    document.querySelectorAll('.tab-btn').forEach(b =>
      b.classList.toggle('active', b.dataset.tab === name));
    document.querySelectorAll('.tab-pane').forEach(p =>
      p.classList.toggle('active', p.id === 'tab-' + name));
  }

  // ── Carregar config ao iniciar ──────────────────────────────────────────────
  window.addEventListener('DOMContentLoaded', async () => {
    try {
      const r = await fetch('/get-config');
      const d = await r.json();
      const keyEl  = document.getElementById('openai-key');
      const badge  = document.getElementById('key-status');
      if (d.openai_key) {
        keyEl.value = d.openai_key;
        badge.innerHTML = '<span class="key-badge set">✓ Chave configurada</span>';
      } else {
        badge.innerHTML = '<span class="key-badge unset">⚠ Chave não configurada</span>';
        switchTab('config');
      }
    } catch(e) {}
  });

  // ── Slug auto ───────────────────────────────────────────────────────────────
  const titleEl = document.getElementById('title');
  const slugEl  = document.getElementById('slug');
  const preview = document.getElementById('slug-preview');
  let slugEdited = false;

  function toSlug(s) {
    return s.toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g,'')
      .replace(/[^a-z0-9\s-]/g,'').trim()
      .replace(/\s+/g,'-').replace(/-+/g,'-');
  }
  titleEl.addEventListener('input', () => {
    if (!slugEdited) { const s=toSlug(titleEl.value); slugEl.value=s; preview.textContent=s||'slug'; }
  });
  slugEl.addEventListener('input', () => {
    slugEdited = slugEl.value.length > 0;
    preview.textContent = slugEl.value || 'slug';
  });

  // ── Meta chars counter ──────────────────────────────────────────────────────
  const metaEl    = document.getElementById('meta_desc');
  const metaChars = document.getElementById('meta-chars');
  metaEl.addEventListener('input', () => {
    const n = metaEl.value.length;
    metaChars.textContent = n;
    metaChars.style.color = n > 155 ? '#ff7070' : 'rgba(232,184,75,.6)';
  });

  // ── Sidebar links ───────────────────────────────────────────────────────────
  function updateMetaCount() {
    const n = metaEl.value.length;
    metaChars.textContent = n;
    metaChars.style.color = n > 155 ? '#ff7070' : 'rgba(232,184,75,.6)';
  }

  function updateKeyStatus() {
    const openaiKey = document.getElementById('openai-key').value.trim();
    const geminiKey = document.getElementById('gemini-key').value.trim();
    document.getElementById('key-status').innerHTML = [
      `<span class="key-badge ${openaiKey ? 'set' : 'unset'}">OpenAI ${openaiKey ? 'configurada' : 'nao configurada'}</span>`,
      `<span class="key-badge ${geminiKey ? 'set' : 'unset'}">Gemini ${geminiKey ? 'configurada' : 'nao configurada'}</span>`,
    ].join(' ');
  }

  function updateModelOptions(selectedModel = '') {
    const provider = document.getElementById('provider').value;
    const modelEl = document.getElementById('model');
    const options = MODEL_OPTIONS[provider] || [];
    modelEl.innerHTML = options.map((item) => `<option value="${item.value}">${item.label}</option>`).join('');
    const allowed = options.map((item) => item.value);
    modelEl.value = allowed.includes(selectedModel) ? selectedModel : DEFAULT_MODELS[provider];
  }

  function providerHasKey(provider) {
    if (provider === 'gemini') return !!document.getElementById('gemini-key').value.trim();
    return !!document.getElementById('openai-key').value.trim();
  }

  function addLink(text='', url='') {
    const c = document.getElementById('links-container');
    const r = document.createElement('div');
    r.className = 'link-row';
    r.innerHTML = `
      <input type="text" class="lk-text" placeholder="Texto do link" value="${text}">
      <input type="text" class="lk-url"  placeholder="/caminho/ ou URL" value="${url}">
      <button class="rm" onclick="this.closest('.link-row').remove()" title="Remover">×</button>`;
    c.appendChild(r);
  }

  function getLinks() {
    return [...document.querySelectorAll('.link-row')].map(r => ({
      text: r.querySelector('.lk-text').value.trim(),
      url:  r.querySelector('.lk-url').value.trim(),
    })).filter(l => l.text && l.url);
  }

  // ── Gerar com IA ───────────────────────────────────────────────────────────
  async function gerar() {
    const keyword   = document.getElementById('keyword').value.trim();
    const wordcount = document.getElementById('wordcount').value;
    if (!keyword) { alert('Preencha a palavra-chave.'); return; }

    const btn = document.getElementById('gen-btn');
    const lbl = document.getElementById('gen-label');
    const spn = document.getElementById('gen-spin');
    btn.disabled=true; lbl.style.display='none'; spn.style.display='block';

    try {
      const resp = await fetch('/generate', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({keyword, word_count: parseInt(wordcount)})
      });
      const data = await resp.json();
      if (data.ok) {
        document.getElementById('body').value = data.content;
        if (data.meta_desc) {
          metaEl.value = data.meta_desc;
          metaChars.textContent = data.meta_desc.length;
        }
      } else {
        if (data.error.includes('Configurações')) switchTab('config');
        alert(data.error);
      }
    } catch(e) { alert('Falha de conexão: ' + e.message); }

    btn.disabled=false; lbl.style.display='block'; spn.style.display='none';
  }

  // ── Criar rascunho ──────────────────────────────────────────────────────────
  async function criar() {
    const title    = titleEl.value.trim();
    const slug     = slugEl.value.trim();
    const category = document.getElementById('category').value;
    const body     = document.getElementById('body').value;
    const keyword  = document.getElementById('keyword').value.trim();
    const meta_desc = metaEl.value.trim();
    if (!title || !slug) { alert('Preencha o título e o slug.'); return; }

    const btn    = document.getElementById('btn');
    const label  = document.getElementById('btn-label');
    const spn    = document.getElementById('btn-spin');
    const result = document.getElementById('result');

    btn.disabled=true; label.textContent='Criando...';
    spn.style.display='block'; result.className='result'; result.innerHTML='';

    try {
      const resp = await fetch('/create', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({title, slug, category, body, links:getLinks(), keyword, meta_desc})
      });
      const data = await resp.json();
      if (data.ok) {
        result.className='result ok';
        result.innerHTML=`✅ Rascunho <strong>${title}</strong> criado!
          <div class="result-links">
            <a href="${data.edit_url}"    target="_blank">✏️ Editar no WordPress</a>
            <a href="${data.preview_url}" target="_blank">👁 Pré-visualizar</a>
          </div>`;
        titleEl.value=''; slugEl.value=''; slugEdited=false;
        document.getElementById('body').value='';
        document.getElementById('links-container').innerHTML='';
        metaEl.value=''; metaChars.textContent='0';
        preview.textContent='slug';
      } else {
        result.className='result err';
        result.innerHTML='❌ '+data.error;
      }
    } catch(e) {
      result.className='result err';
      result.innerHTML='❌ Falha de conexão: '+e.message;
    }

    btn.disabled=false; label.textContent='Criar Rascunho no WordPress';
    spn.style.display='none';
  }

  // ── Salvar config ───────────────────────────────────────────────────────────
  async function salvarConfig() {
    const key  = document.getElementById('openai-key').value.trim();
    const msg  = document.getElementById('cfg-msg');
    const lbl  = document.getElementById('save-label');
    const spn  = document.getElementById('save-spin');
    const badge = document.getElementById('key-status');

    document.querySelector('.btn-save').disabled=true;
    lbl.style.display='none'; spn.style.display='block';
    msg.className='cfg-status'; msg.textContent='';

    try {
      const r = await fetch('/save-config', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({openai_key: key})
      });
      const d = await r.json();
      if (d.ok) {
        msg.className='cfg-status ok'; msg.textContent='✅ Chave salva!';
        badge.innerHTML='<span class="key-badge set">✓ Chave configurada</span>';
        setTimeout(() => { msg.textContent=''; switchTab('create'); }, 1500);
      } else {
        msg.className='cfg-status err'; msg.textContent='❌ '+d.error;
      }
    } catch(e) {
      msg.className='cfg-status err'; msg.textContent='❌ Falha: '+e.message;
    }

    document.querySelector('.btn-save').disabled=false;
    lbl.style.display='block'; spn.style.display='none';
  }
  async function gerar() {
    const keyword = document.getElementById('keyword').value.trim();
    const wordcount = document.getElementById('wordcount').value;
    const category = document.getElementById('category').value;
    const provider = document.getElementById('provider').value;
    const model = document.getElementById('model').value;
    if (!keyword) { alert('Preencha a palavra-chave.'); return; }
    if (!providerHasKey(provider)) {
      switchTab('config');
      alert(`Configure a chave ${provider === 'gemini' ? 'Gemini' : 'OpenAI'} antes de gerar.`);
      return;
    }

    const btn = document.getElementById('gen-btn');
    const lbl = document.getElementById('gen-label');
    const spn = document.getElementById('gen-spin');
    btn.disabled = true;
    lbl.style.display = 'none';
    spn.style.display = 'block';

    try {
      const resp = await fetch('/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword,
          word_count: parseInt(wordcount, 10),
          category,
          provider,
          model,
        })
      });
      const data = await resp.json();
      if (data.ok) {
        document.getElementById('body').value = data.content;
        if (data.meta_desc) {
          metaEl.value = data.meta_desc;
          updateMetaCount();
        }
      } else {
        if (/nao configurada/i.test(data.error)) switchTab('config');
        alert(data.error);
      }
    } catch(e) {
      alert('Falha de conexao: ' + e.message);
    }

    btn.disabled = false;
    lbl.style.display = 'block';
    spn.style.display = 'none';
  }

  async function salvarConfig() {
    const openaiKey = document.getElementById('openai-key').value.trim();
    const geminiKey = document.getElementById('gemini-key').value.trim();
    const faqToggleEnabled = document.getElementById('faq-toggle-enabled').checked;
    const msg = document.getElementById('cfg-msg');
    const lbl = document.getElementById('save-label');
    const spn = document.getElementById('save-spin');
    const btn = document.querySelector('.btn-save');

    btn.disabled = true;
    lbl.style.display = 'none';
    spn.style.display = 'block';
    msg.className = 'cfg-status';
    msg.textContent = '';

    try {
      const r = await fetch('/save-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          openai_key: openaiKey,
          gemini_key: geminiKey,
          faq_toggle_enabled: faqToggleEnabled
        })
      });
      const d = await r.json();
      if (d.ok) {
        loadedConfig = {
          ...loadedConfig,
          openai_key: openaiKey,
          gemini_key: geminiKey,
          faq_toggle_enabled: faqToggleEnabled
        };
        msg.className = 'cfg-status ok';
        msg.textContent = 'Chaves salvas.';
        lbl.textContent = 'Salvar chaves';
        updateKeyStatus();
        setTimeout(() => {
          msg.textContent = '';
          switchTab('create');
        }, 1200);
      } else {
        msg.className = 'cfg-status err';
        msg.textContent = 'Erro: ' + d.error;
      }
    } catch(e) {
      msg.className = 'cfg-status err';
      msg.textContent = 'Falha: ' + e.message;
    }

    btn.disabled = false;
    lbl.style.display = 'block';
    spn.style.display = 'none';
  }

  window.addEventListener('DOMContentLoaded', async () => {
    try {
      const r = await fetch('/get-config');
      loadedConfig = await r.json();
    } catch(e) {
      loadedConfig = {};
    }

    document.getElementById('openai-key').value = loadedConfig.openai_key || '';
    const geminiEl = document.getElementById('gemini-key');
    if (geminiEl) geminiEl.value = loadedConfig.gemini_key || '';
    const faqToggleEl = document.getElementById('faq-toggle-enabled');
    if (faqToggleEl) faqToggleEl.checked = loadedConfig.faq_toggle_enabled !== false;
    document.getElementById('save-label').textContent = 'Salvar chaves';

    const providerEl = document.getElementById('provider');
    if (providerEl) {
      providerEl.value = loadedConfig.gemini_key && !loadedConfig.openai_key ? 'gemini' : 'openai';
      updateModelOptions(loadedConfig.default_model || '');
    }

    document.getElementById('openai-key').addEventListener('input', updateKeyStatus);
    if (geminiEl) geminiEl.addEventListener('input', updateKeyStatus);
    updateKeyStatus();
    updateMetaCount();

    if (!loadedConfig.openai_key && !loadedConfig.gemini_key) {
      switchTab('config');
    } else {
      switchTab('create');
    }
  });
</script>
</body>
</html>"""


# ── HTTP Handler ───────────────────────────────────────────────────────────────

class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        pass

    def _read_body(self):
        n = int(self.headers.get("Content-Length", 0))
        return json.loads(self.rfile.read(n))

    def _send_json(self, payload):
        data = json.dumps(payload).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        if self.path == "/get-config":
            cfg = _load_config()
            self._send_json({
                "openai_key": cfg.get("openai_key", ""),
                "gemini_key": cfg.get("gemini_key", ""),
                "faq_toggle_enabled": cfg.get("faq_toggle_enabled", True),
            })
            return
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.end_headers()
        self.wfile.write(HTML.encode("utf-8"))

    def do_POST(self):
        if self.path == "/generate":
            body = self._read_body()
            try:
                content   = generate_article(
                    body["keyword"],
                    body.get("word_count", 800),
                    body.get("provider", "openai"),
                    body.get("model", ""),
                    body.get("category", "faq"),
                )
                meta_desc = extract_meta_desc(content)
                self._send_json({"ok": True, "content": content, "meta_desc": meta_desc})
            except Exception as e:
                self._send_json({"ok": False, "error": str(e)})

        elif self.path == "/create":
            body = self._read_body()
            try:
                post = create_wp_post(
                    body["title"], body["slug"], body["category"],
                    body.get("body", ""), body.get("links", []),
                    body.get("keyword", ""), body.get("meta_desc", ""),
                )
                self._send_json({
                    "ok":          True,
                    "id":          post["id"],
                    "edit_url":    f"https://bauernfest.org/wp-admin/post.php?post={post['id']}&action=edit",
                    "preview_url": post.get("link", ""),
                })
            except urllib.error.HTTPError as e:
                err = e.read().decode("utf-8", errors="replace")
                self._send_json({"ok": False, "error": f"HTTP {e.code}: {err[:300]}"})
            except Exception as e:
                self._send_json({"ok": False, "error": str(e)})

        elif self.path == "/save-config":
            body = self._read_body()
            try:
                _save_config(body)
                self._send_json({"ok": True})
            except Exception as e:
                self._send_json({"ok": False, "error": str(e)})

        else:
            self.send_response(404)
            self.end_headers()


if __name__ == "__main__":
    port = 8765
    print(f"\nBauernfest Dashboard  http://localhost:{port}")
    print("Ctrl+C para parar.\n")
    HTTPServer(("localhost", port), Handler).serve_forever()
