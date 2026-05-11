"""
Global shell propagator for the Bauernfest site.

Reads the shared header/footer assets from site-bauernfest/Rodape/
and reapplies them to:
  1. Every local static HTML page in the site tree
  2. WordPress reusable blocks (BF-Nav ID:2349, BF-Footer ID:2350)
     — all WP posts that reference these blocks update automatically

Managed sections:
  nav CSS      -> Rodape/nav-breadcrumb.css
  footer CSS   -> Rodape/shared-bottom.css
  nav markup   -> Rodape/nav.html
  footer markup-> Rodape/footer.html

WordPress reusable blocks (auto-sync):
  BF-Nav     (ID 2349) — header nav HTML for all WP posts
  BF-Footer  (ID 2350) — footer HTML for all WP posts

Usage:
  python update_footer.py
"""

import base64
import glob
import json
import os
import re
import subprocess
import urllib.error
import urllib.request

BASE = "c:/Users/User/Downloads/Projeto Claude Code/Bauernfest Claud/site-bauernfest"
RODAPE = os.path.join(BASE, "Rodape")
ROOT = os.path.dirname(os.path.abspath(__file__))

NAV_SCRIPT = """<script>
(function(){
  var burger=document.getElementById('bfBurger'),menu=document.getElementById('bfMenu');
  if(!burger||!menu){return;}

  function closeMenu(){
    menu.classList.remove('bfopen');
    burger.classList.remove('open');
    burger.setAttribute('aria-expanded','false');
  }

  burger.addEventListener('click',function(e){
    e.stopPropagation();
    var open=menu.classList.toggle('bfopen');
    burger.classList.toggle('open',open);
    burger.setAttribute('aria-expanded',String(open));
  });

  document.addEventListener('click',function(e){
    if(!burger.contains(e.target)&&!menu.contains(e.target)){
      closeMenu();
    }
  });

  document.addEventListener('keydown',function(e){
    if(e.key==='Escape'){
      closeMenu();
    }
  });

  window.addEventListener('resize',function(){
    if(window.innerWidth>=860){
      closeMenu();
    }
  });
})();
</script>"""

BODY_CLOSE = "</body>\n</html>"


def read(filename):
    path = os.path.join(RODAPE, filename)
    with open(path, "r", encoding="utf-8") as handle:
        return handle.read().strip()


def replace_first(patterns, replacement, content):
    for pattern in patterns:
        updated, count = re.subn(pattern, replacement, content, count=1, flags=re.DOTALL)
        if count:
            return updated, True
    return content, False


def find_last_start(content, patterns):
    last_start = -1
    for pattern in patterns:
        for match in re.finditer(pattern, content, flags=re.DOTALL):
            if match.start() > last_start:
                last_start = match.start()
    return last_start


def read_head_version(filepath):
    relpath = os.path.relpath(filepath, ROOT).replace("\\", "/")
    try:
        output = subprocess.check_output(
            ["git", "show", f"HEAD:./{relpath}"],
            cwd=ROOT,
            stderr=subprocess.DEVNULL,
            text=True,
            encoding="utf-8",
        )
        return output
    except Exception:
        return ""


def extract_preserved_tail(filepath, current_content):
    source = read_head_version(filepath) or current_content
    footer_start = find_last_start(
        source,
        [
            r"<!-- NEWSLETTER -->",
            r"<div class=\"bf-footer-shell\">",
            r"<section class=\"bf-newsletter\"[^>]*>",
            r"<footer class=\"bfftr\"[^>]*>",
        ],
    )
    if footer_start == -1:
        return "", ""

    body_close = re.search(r"</body>\s*</html>", source, re.DOTALL | re.IGNORECASE)
    if not body_close:
        return "", ""

    script_match = re.search(r"<script\b", source[footer_start:], re.IGNORECASE)
    if script_match:
        tail_start = footer_start + script_match.start()
        preserved_tail = source[tail_start:body_close.start()].strip()
    else:
        preserved_tail = ""

    preserved_tail = re.sub(
        r"<script>\s*\(function\(\)\{\s*var burger=document\.getElementById\('bfBurger'\),menu=document\.getElementById\('bfMenu'\);.*?</script>",
        "",
        preserved_tail,
        flags=re.DOTALL,
    ).strip()

    trailing_after_html = source[body_close.end():]
    return preserved_tail, trailing_after_html


nav_css = read("nav-breadcrumb.css")
bottom_css = read("shared-bottom.css")
nav_html = read("nav.html")
footer_html = read("footer.html")


def process(filepath):
    with open(filepath, "r", encoding="utf-8") as handle:
        content = handle.read()
    original = content

    nav_css_pattern = re.compile(
        r"/\* NAV \*/.*?\.bf-breadcrumb span\{opacity:\.5\}",
        re.DOTALL,
    )
    if re.search(nav_css_pattern, content):
        content = re.sub(nav_css_pattern, nav_css, content)

    bottom_css_pattern = re.compile(r"/\* NEWSLETTER \*/.*?(?=</style>)", re.DOTALL)
    if re.search(bottom_css_pattern, content):
        content = re.sub(bottom_css_pattern, bottom_css + "\n", content)

    content, _ = replace_first(
        [
            r"<!-- NAV -->.*?(?=<!-- BREADCRUMB -->)",
            r"<header class=\"bf-header-shell\">.*?</header>",
            r"<nav class=\"bfnav\"[^>]*>.*?</nav>",
        ],
        nav_html + "\n\n",
        content,
    )

    footer_start = find_last_start(
        content,
        [
            r"<!-- NEWSLETTER -->",
            r"<div class=\"bf-footer-shell\">",
            r"<section class=\"bf-newsletter\"[^>]*>",
            r"<footer class=\"bfftr\"[^>]*>",
        ],
    )
    if footer_start != -1:
        preserved_tail, trailing_after_html = extract_preserved_tail(filepath, content)
        content = content[:footer_start].rstrip() + "\n\n" + footer_html
        if preserved_tail:
            content += "\n\n" + preserved_tail
        content += "\n\n" + NAV_SCRIPT + "\n" + BODY_CLOSE + trailing_after_html

    if content != original:
        with open(filepath, "w", encoding="utf-8") as handle:
            handle.write(content)
        label = filepath.replace(BASE, "").replace("\\", "/")
        print(f"  UPDATED  {label}")
        return True

    label = filepath.replace(BASE, "").replace("\\", "/")
    print(f"  skipped  {label}")
    return False


WP_API_BASE = "https://bauernfest.org/wp-json/wp/v2"
WP_USER = "ClaudeBot"
WP_PASS = "p8Np bMs8 Xnsh MfH2 cZ7u w5xy"
WP_NAV_BLOCK_ID = 2349
WP_FOOTER_BLOCK_ID = 2350


def update_wp_block(block_id, content, label):
    credentials = base64.b64encode(f"{WP_USER}:{WP_PASS}".encode()).decode()
    body = json.dumps({"content": content, "status": "publish"}).encode("utf-8")
    req = urllib.request.Request(
        f"{WP_API_BASE}/blocks/{block_id}",
        data=body,
        method="POST",
        headers={
            "Authorization": f"Basic {credentials}",
            "Content-Type": "application/json",
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/124.0.0.0 Safari/537.36"
            ),
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=30):
            print(f"  WP OK    {label} (block {block_id})")
            return True
    except urllib.error.HTTPError as exc:
        print(f"  WP FAIL  {label}: HTTP {exc.code}")
        return False
    except Exception as exc:
        print(f"  WP FAIL  {label}: {exc}")
        return False


files = [
    path
    for path in glob.glob(os.path.join(BASE, "**", "*.html"), recursive=True)
    if "Rodape" not in path
]

print(f"\nBauerUP - {len(files)} HTML page(s) found\n")
updated = sum(process(path) for path in sorted(files))
print(f"\nOK: {updated} updated, {len(files) - updated} unchanged.\n")

print("Syncing WordPress reusable blocks...\n")
update_wp_block(
    WP_NAV_BLOCK_ID,
    f"<!-- wp:html -->\n{nav_html}\n<!-- /wp:html -->",
    "BF-Nav — Navegação Principal",
)
update_wp_block(
    WP_FOOTER_BLOCK_ID,
    f"<!-- wp:html -->\n{footer_html}\n<!-- /wp:html -->",
    "BF-Footer — Rodapé Global",
)
print("\nBauerUP concluído.\n")
