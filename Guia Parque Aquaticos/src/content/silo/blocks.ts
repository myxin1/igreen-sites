/**
 * Converts flat article HTML to Gutenberg block markup.
 * Supported block-level elements: h2, h3, p, ul (with li children).
 * Inline elements (strong, a, em, span) are preserved as-is inside blocks.
 * Complex components (FAQ accordions, CTA cards, map sections) must be
 * wrapped separately via htmlBlock().
 */
export function htmlToBlocks(html: string): string {
  const blocks: string[] = [];
  const input = html.trim();
  let pos = 0;

  while (pos < input.length) {
    // Skip whitespace between block elements
    const ws = input.slice(pos).match(/^\s+/);
    if (ws) {
      pos += ws[0].length;
      continue;
    }

    // Identify the opening block tag
    const tagMatch = input.slice(pos).match(/^<(h2|h3|p|ul)(?:\s[^>]*)?>/i);
    if (!tagMatch) {
      pos++;
      continue;
    }

    const tag = tagMatch[1].toLowerCase() as "h2" | "h3" | "p" | "ul";
    const closeTag = `</${tag}>`;
    const contentStart = pos + tagMatch[0].length;
    const closeIdx = input.indexOf(closeTag, contentStart);

    if (closeIdx === -1) {
      pos++;
      continue;
    }

    const inner = input.slice(contentStart, closeIdx).trim();

    switch (tag) {
      case "h2":
        blocks.push(
          `<!-- wp:heading {"level":2,"className":"gpq-h2"} -->\n` +
          `<h2 class="wp-block-heading gpq-h2">${inner}</h2>\n` +
          `<!-- /wp:heading -->`,
        );
        break;
      case "h3":
        blocks.push(
          `<!-- wp:heading {"level":3,"className":"gpq-h3"} -->\n` +
          `<h3 class="wp-block-heading gpq-h3">${inner}</h3>\n` +
          `<!-- /wp:heading -->`,
        );
        break;
      case "p":
        if (inner) {
          blocks.push(
            `<!-- wp:paragraph {"className":"gpq-p"} -->\n` +
            `<p class="gpq-p">${inner}</p>\n` +
            `<!-- /wp:paragraph -->`,
          );
        }
        break;
      case "ul":
        const listBlock = makeListBlock(inner);
        if (listBlock) blocks.push(listBlock);
        break;
    }

    pos = closeIdx + closeTag.length;
  }

  return blocks.join("\n\n");
}

function makeListBlock(ulInner: string): string {
  const liPattern = /<li(?:\s[^>]*)?>([\s\S]*?)<\/li>/gi;
  const items: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = liPattern.exec(ulInner)) !== null) {
    const liContent = match[1].trim();
    if (liContent) {
      items.push(`<!-- wp:list-item --><li>${liContent}</li><!-- /wp:list-item -->`);
    }
  }

  if (items.length === 0) return "";

  return (
    `<!-- wp:list {"className":"gpq-ul"} -->\n` +
    `<ul class="wp-block-list gpq-ul">${items.join("")}</ul>\n` +
    `<!-- /wp:list -->`
  );
}

/** Wraps arbitrary HTML in an isolated wp:html block */
export function htmlBlock(html: string): string {
  return `<!-- wp:html -->\n${html}\n<!-- /wp:html -->`;
}
