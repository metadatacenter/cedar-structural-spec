#!/usr/bin/env node
//
// mdbook-prose-highlight
//
// An mdBook preprocessor that adds subtle structural colouring to
// inline `code` spans in spec prose:
//
//   - If a span's text is the name of a known abstract grammar
//     production (UpperCamelCase, defined as a `Name ::=` LHS in any
//     EBNF block in the book), wrap the span as
//       `<code class="ph-prod">Name</code>`
//     and replace the surrounding markdown so the wrapping survives
//     mdBook's parser.
//
//   - If a span's text is one of a small fixed set of algorithm
//     keywords (`Run`, `Verify`, `Warn`, `Let`, `MUST`, `SHOULD`,
//     `MAY`, `MUST NOT`, `SHOULD NOT`), and the chapter is on the
//     keyword-allowlist (currently `validation.md`), wrap the span as
//       `<code class="ph-keyword">…</code>`.
//
// Pre-existing styling (subroutine-link boxes, EBNF blocks, etc.) is
// preserved: this preprocessor only adds class names to plain
// `<code>` spans, never to spans inside an existing markdown link or
// inside a fenced code block.
//
// Build dependencies: zero. Just Node and stdin/stdout JSON, same
// contract as mdbook-ebnf-xref.

'use strict';

const args = process.argv.slice(2);
if (args[0] === 'supports') {
  process.exit(0);
}

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (c) => { input += c; });
process.stdin.on('end', () => {
  try {
    const [, book] = JSON.parse(input);
    processBook(book);
    process.stdout.write(JSON.stringify(book));
  } catch (e) {
    process.stderr.write(`mdbook-prose-highlight error: ${e.stack || e.message}\n`);
    process.exit(1);
  }
});

// ---------------------------------------------------------------- config ----

// Chapter paths whose prose we extend with algorithm-keyword colouring.
// Keyword colouring is opt-in per chapter to avoid colouring "Run" or
// "Verify" everywhere in the spec.
const KEYWORD_CHAPTERS = new Set(['validation.md']);

// Algorithm keywords we colour inside KEYWORD_CHAPTERS. Conformance
// auxiliaries (MUST/SHOULD/MAY etc.) are coloured everywhere they are
// already wrapped in backticks — the spec convention is that
// MUST/SHOULD/MAY appearing inline as English-language words are NOT
// in backticks, so this is naturally limited.
const KEYWORDS = new Set([
  // Algorithm primitives
  'Run', 'Verify', 'Warn', 'Let',
  // Conformance keywords (RFC 2119)
  'MUST', 'SHOULD', 'MAY',
  'MUST NOT', 'SHOULD NOT',
]);

// --------------------------------------------------------------- traversal ----

function processBook(book) {
  const chapters = collectChapters(book);

  // Build a global set of production names from EBNF blocks across all
  // chapters. The mdbook-ebnf-xref preprocessor already does this, but
  // we run independently — repeating the small extraction is cheaper
  // than invoking the other preprocessor.
  const productions = collectProductionNames(chapters);

  for (const ch of chapters) {
    if (!ch.content) continue;
    ch.content = rewriteChapter(ch, productions);
  }
}

function collectChapters(book) {
  const out = [];
  function walk(items) {
    for (const item of items) {
      if (item.Chapter) {
        out.push(item.Chapter);
        if (item.Chapter.sub_items) walk(item.Chapter.sub_items);
      }
    }
  }
  walk(book.items || book.sections || []);
  return out;
}

// ------------------------------------------------------ production gather ----

const FENCE_RE = /^(`{3,})([^\n]*)\n([\s\S]*?)\n\1[ \t]*$/gm;
const LHS_RE = /^[ \t]*([A-Z][A-Za-z0-9]*)[ \t]+(?:::=|:::)/gm;

function collectProductionNames(chapters) {
  const names = new Set();
  for (const ch of chapters) {
    if (!ch.content) continue;
    FENCE_RE.lastIndex = 0;
    let m;
    while ((m = FENCE_RE.exec(ch.content)) !== null) {
      const info = m[2].trim().toLowerCase();
      const body = m[3];
      // Treat any block tagged `ebnf`, `wire-ebnf`, or unlabeled-with-
      // a-production-LHS as an EBNF block (mirrors ebnf-xref).
      const isEbnf =
        info === 'ebnf' ||
        info === 'wire-ebnf' ||
        (info === '' && /^[ \t]*[A-Z][A-Za-z0-9]*[ \t]+(?:::=|:::)/m.test(body));
      if (!isEbnf) continue;
      LHS_RE.lastIndex = 0;
      let lhs;
      while ((lhs = LHS_RE.exec(body)) !== null) {
        names.add(lhs[1]);
      }
    }
  }
  return names;
}

// ---------------------------------------------------------------- rewrite ----

// Walk the chapter line by line, skipping fenced code blocks. For each
// non-fenced line, replace plain ``…`` spans with classed `<code>`
// elements when the content matches a known production or keyword.
//
// "Plain" means: not already wrapped in a markdown link (`[...](url)`)
// and not part of a longer construct. We use a single-line regex that
// looks for backtick spans and consults the surrounding context to
// detect markdown-link wrapping.

function rewriteChapter(ch, productions) {
  const wantKeywords = KEYWORD_CHAPTERS.has(ch.path);
  const lines = ch.content.split('\n');
  const out = [];
  let inFence = false;
  let fenceMarker = null;

  for (const line of lines) {
    // Track fenced-block state.
    const fenceMatch = line.match(/^(`{3,}|~{3,})/);
    if (fenceMatch) {
      const marker = fenceMatch[1];
      if (!inFence) {
        inFence = true;
        fenceMarker = marker[0].repeat(marker.length);
      } else if (line.startsWith(fenceMarker)) {
        inFence = false;
        fenceMarker = null;
      }
      out.push(line);
      continue;
    }
    if (inFence) {
      out.push(line);
      continue;
    }
    out.push(rewriteLine(line, productions, wantKeywords));
  }
  return out.join('\n');
}

// Rewrite plain backtick spans on one prose line.
//
// Pattern: ``…`` where neither immediate adjacency is `[` or `](`.
// We match a backtick span and inspect the preceding/following
// characters to decide whether to leave it alone.
function rewriteLine(line, productions, wantKeywords) {
  // Skip lines that are pure heading anchors like `## Heading {#id}`.
  // Heading content can include backtick spans we should NOT classify
  // (they're part of the heading text); leave headings alone.
  if (/^#{1,6}\s/.test(line)) return line;

  let out = '';
  let i = 0;
  while (i < line.length) {
    const c = line[i];
    if (c !== '`') {
      out += c;
      i++;
      continue;
    }
    // Find end of backtick span. Support multi-backtick fences for
    // spans that contain backticks (rare in our prose).
    let runLen = 0;
    while (line[i + runLen] === '`') runLen++;
    const open = '`'.repeat(runLen);
    const close = open;
    const closeIdx = line.indexOf(close, i + runLen);
    if (closeIdx === -1) {
      // Unbalanced; pass through.
      out += line.slice(i);
      break;
    }
    const inner = line.slice(i + runLen, closeIdx);
    const before = i > 0 ? line[i - 1] : '';
    const after = line[closeIdx + runLen] || '';

    // If immediately preceded by `[` and followed by `]` (markdown
    // link text), leave alone — link styling handles it.
    const insideLinkText = before === '[' && after === ']';

    // Classify the span content.
    let cls = null;
    if (!insideLinkText) {
      const trimmed = inner.trim();
      if (productions.has(trimmed)) {
        cls = 'ph-prod';
      } else if (wantKeywords && KEYWORDS.has(trimmed)) {
        cls = 'ph-keyword';
      }
    }

    if (cls) {
      out += `<code class="${cls}">${escapeHtml(inner)}</code>`;
    } else {
      out += line.slice(i, closeIdx + runLen);
    }
    i = closeIdx + runLen;
  }
  return out;
}

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
