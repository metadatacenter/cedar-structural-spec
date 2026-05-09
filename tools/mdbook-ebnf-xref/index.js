#!/usr/bin/env node
//
// mdbook-ebnf-xref
//
// An mdBook preprocessor that:
//   1. Finds EBNF code blocks across the whole book — both ``` ebnf ``` fences
//      and unlabeled ``` ``` fences whose body contains a `Name ::=` or
//      `Name :::` production.
//   2. Builds a global index of production names → (chapter, anchor).
//      Anchors are emitted at the LHS of each definition.
//   3. Rewrites each EBNF block as raw HTML (<pre class="ebnf">…</pre>),
//      with:
//        - LHS production names wrapped as <a id="prod-Name" class="ebnf-def">.
//        - RHS UpperCamelCase identifiers wrapped as <a href="…#prod-Name">
//          when known (cross-file linking is supported).
//        - EBNF metasymbols highlighted via <span class="ebnf-…"> classes for
//          CSS to colour.
//
// mdBook calls preprocessors with `supports <renderer>` to probe support and
// otherwise pipes the [context, book] JSON pair on stdin and expects the
// modified `book` JSON on stdout.

'use strict';

// ------------------------------------------------------------------ args ----

const args = process.argv.slice(2);
if (args[0] === 'supports') {
  // We support every renderer; HTML is the only one that meaningfully uses
  // the rewritten content, but emitting raw HTML in other backends is
  // harmless.
  process.exit(0);
}

// ------------------------------------------------------- read stdin (JSON) ----

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => { input += chunk; });
process.stdin.on('end', () => {
  try {
    const [, book] = JSON.parse(input);
    processBook(book);
    process.stdout.write(JSON.stringify(book));
  } catch (e) {
    process.stderr.write(`mdbook-ebnf-xref error: ${e.stack || e.message}\n`);
    process.exit(1);
  }
});

// ----------------------------------------------------------- core logic ----

function processBook(book) {
  const chapters = collectChapters(book);

  // Pass 1: find every production definition and where it lives.
  const defs = new Map(); // Name -> { paths: Set<path>, anchor }
  for (const ch of chapters) {
    findDefs(ch, defs);
  }

  // Pass 2: rewrite EBNF blocks using the index from Pass 1.
  for (const ch of chapters) {
    ch.content = rewriteChapter(ch, defs);
  }

  // Pass 3: if a chapter named index-of-productions.md exists, fill it.
  const indexCh = chapters.find(
    (c) => c.path === 'index-of-productions.md'
  );
  if (indexCh) {
    indexCh.content = renderProductionIndex(defs, indexCh.content);
  }
}

// Render the alphabetical index of productions. Each entry lists the
// name and one or more "defined in <chapter>" links. Pages from
// FILE_SCOPED_FILES (e.g. wire-grammar.md) are kept distinct from the
// abstract grammar so that the index reflects what actually exists.
function renderProductionIndex(defs, existingContent) {
  // Sort case-insensitively for a more readable A–Z.
  const names = [...defs.keys()].sort((a, b) =>
    a.toLowerCase().localeCompare(b.toLowerCase())
  );

  // Group entries by leading letter for an A–Z heading layout.
  const groups = new Map();
  for (const name of names) {
    const letter = name[0].toUpperCase();
    if (!groups.has(letter)) groups.set(letter, []);
    groups.get(letter).push(name);
  }

  const lines = [];
  // Preserve any author-written prose at the top of the chapter (above
  // the auto-generated marker). If the file is empty or has no marker,
  // start with a default heading + intro.
  const marker = '<!-- AUTO-GENERATED PRODUCTION INDEX -->';
  const split = (existingContent || '').split(marker);
  const head = split[0].trim()
    ? split[0].trimEnd() + '\n\n'
    : '# Index of Productions\n\n' +
      'An alphabetical index of every production defined in this specification. ' +
      'Click a chapter link to jump to the production\'s definition.\n\n';
  lines.push(head);
  lines.push(marker + '\n');

  // Letter navigation row.
  const letters = [...groups.keys()];
  lines.push(
    letters
      .map((l) => `[${l}](#index-${l.toLowerCase()})`)
      .join(' · ') + '\n'
  );

  for (const letter of letters) {
    lines.push(`\n## ${letter} {#index-${letter.toLowerCase()}}\n`);
    for (const name of groups.get(letter)) {
      const entry = defs.get(name);
      const sites = [...entry.paths]
        .sort()
        .map((p) => {
          const label = chapterLabel(p);
          const href = p.replace(/\.md$/, '.html') + '#' + entry.anchor;
          return `[${label}](${href})`;
        })
        .join(', ');
      lines.push(`- **${name}** — ${sites}\n`);
    }
  }
  return lines.join('');
}

function chapterLabel(path) {
  // Strip directory and extension; turn "wire-grammar.md" -> "Wire Grammar".
  const base = path.replace(/^.*\//, '').replace(/\.md$/, '');
  return base
    .split(/[-_]/)
    .map((s) => (s ? s[0].toUpperCase() + s.slice(1) : s))
    .join(' ');
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

// ----- EBNF block detection -------------------------------------------------

// Match a fenced code block, capturing the info string and body.
// Non-greedy body, allows leading whitespace before the closing fence.
const FENCE_RE = /^(`{3,})([^\n]*)\n([\s\S]*?)\n\1[ \t]*$/gm;

// Production-LHS line: `Name ::=` or `Name :::`. Allows leading whitespace.
const LHS_RE = /^[ \t]*([A-Z][A-Za-z0-9]*)[ \t]+(?:::=|:::)/m;

// LHS occurrence within a block, used both to gather defs and to anchor
// during rewrite. Capture the name and the operator separately.
const LHS_LINE_RE = /^([ \t]*)([A-Z][A-Za-z0-9]*)([ \t]+)(::=|:::)/gm;

function isEbnfBlock(info, body) {
  const lang = info.trim().toLowerCase();
  if (lang === 'ebnf' || lang === 'wire-ebnf') return true;
  // Unlabeled fence: treat as EBNF iff it contains a production LHS.
  if (lang === '' && LHS_RE.test(body)) return true;
  return false;
}

// ----- pass 1: collect definitions -----------------------------------------

// For each production name, record every file that defines it. Lookup at
// rewrite time prefers the same-file definition (so that the same name
// defined in both grammar.md and wire-grammar.md anchors and links
// correctly within each file).
function findDefs(ch, defs) {
  if (!ch.content) return;
  const path = ch.path;
  for (const m of matchAllFences(ch.content)) {
    if (!isEbnfBlock(m.info, m.body)) continue;
    let lhs;
    LHS_LINE_RE.lastIndex = 0;
    while ((lhs = LHS_LINE_RE.exec(m.body)) !== null) {
      const name = lhs[2];
      let entry = defs.get(name);
      if (!entry) {
        entry = { paths: new Set(), anchor: `prod-${name}` };
        defs.set(name, entry);
      }
      entry.paths.add(path);
    }
  }
}

// Emit a "see also" annotation linking an EmbeddedXxxField production to
// its standalone XxxField counterpart and vice versa. Returns the empty
// string when no matching peer exists. Pairing is purely name-based:
//
//   EmbeddedXxxField   ↗  XxxField
//   XxxField           ↗  EmbeddedXxxField
//
// The annotation is a sibling span next to the LHS anchor, styled by CSS.
function seeAlsoFor(name, currentPath, defs) {
  let peer = null;
  const embedded = /^Embedded([A-Z][A-Za-z0-9]*Field)$/.exec(name);
  if (embedded) {
    peer = embedded[1];
  } else if (/^[A-Z][A-Za-z0-9]*Field$/.test(name)) {
    peer = `Embedded${name}`;
  }
  if (!peer) return '';
  const target = resolveDef(peer, currentPath, defs);
  if (!target) return '';
  const fileScoped = FILE_SCOPED_FILES.has(currentPath);
  if (fileScoped && target.path !== currentPath) return '';
  const href = linkHref(currentPath, target);
  return ` <a class="ebnf-see-also" href="${href}" title="See ${esc(peer)}">↗ ${esc(peer)}</a>`;
}

// Resolve a production reference from currentPath, returning a link
// target { path, anchor } or null if unknown. Same-file definitions are
// preferred; otherwise fall back to any file that defines the name.
function resolveDef(name, currentPath, defs) {
  const entry = defs.get(name);
  if (!entry) return null;
  if (entry.paths.has(currentPath)) {
    return { path: currentPath, anchor: entry.anchor };
  }
  // Pick the first non-current path deterministically.
  const first = [...entry.paths][0];
  return { path: first, anchor: entry.anchor };
}

function* matchAllFences(content) {
  FENCE_RE.lastIndex = 0;
  let m;
  while ((m = FENCE_RE.exec(content)) !== null) {
    yield {
      full: m[0],
      fence: m[1],
      info: m[2],
      body: m[3],
      index: m.index,
      length: m[0].length,
    };
  }
}

// ----- pass 2: rewrite each chapter ----------------------------------------

function rewriteChapter(ch, defs) {
  if (!ch.content) return ch.content;
  const src = ch.content;
  const out = [];
  let cursor = 0;
  for (const m of matchAllFences(src)) {
    if (!isEbnfBlock(m.info, m.body)) continue;
    out.push(src.slice(cursor, m.index));
    out.push(renderEbnfBlock(m.body, ch.path, defs));
    cursor = m.index + m.length;
  }
  out.push(src.slice(cursor));
  return out.join('');
}

// Files whose EBNF blocks should NOT link out to other files. References
// in these files are resolved only against definitions in the same file;
// anything else is rendered as plain-text identifier. This isolates the
// wire grammar so that, e.g., `Iri` in wire-grammar.md does not jump to
// the abstract grammar — the wire grammar is a self-contained surface.
const FILE_SCOPED_FILES = new Set(['wire-grammar.md']);

// "Prose-pinned leaf" productions — primitive string types that
// have no `::=` LHS in any EBNF block but are *prose-defined* in
// grammar.md §Primitive String Types. Without this set the
// preprocessor would redden them as unresolved identifiers.
//
// We treat them as known references that link to the prose section
// where they're defined, and style them with the standard ebnf-ref
// class so they read as resolved cross-references rather than as
// dangling identifiers.
const PROSE_PINNED_LEAVES = new Set([
  'SemanticVersion',
  'IriString',
  'Bcp47Tag',
  'Iso8601DateTimeLexicalForm',
  'AsciiIdentifier',
  'IntegerLexicalForm',
]);

// Where the prose-pinned leaves are documented, relative to any
// chapter referring to them.
const PROSE_PINNED_LEAVES_HREF = 'grammar.html#primitive-string-types';

// Render a single EBNF block body as raw HTML <pre class="ebnf">…</pre>.
function renderEbnfBlock(body, currentPath, defs) {
  const lines = body.split('\n');
  const rendered = lines.map((line) =>
    renderEbnfLine(line, currentPath, defs)
  );
  return '<pre class="ebnf"><code>' + rendered.join('\n') + '</code></pre>';
}

// Render one line. Strategy: tokenize the line greedily into highlighted
// spans, escaping any text that isn't itself HTML we emitted.
function renderEbnfLine(line, currentPath, defs) {
  // Comment line: keep as-is, but escape, and wrap in a comment span.
  const commentMatch = line.match(/^(\s*)(\/\/.*)$/);
  if (commentMatch) {
    return commentMatch[1] + spanEsc('ebnf-comment', commentMatch[2]);
  }

  // LHS definition line: anchor the production name.
  const lhsMatch = line.match(/^(\s*)([A-Z][A-Za-z0-9]*)(\s+)(::=|:::)(.*)$/);
  if (lhsMatch) {
    const [, lead, name, gap, op, rest] = lhsMatch;
    return (
      lead +
      `<a id="prod-${name}" class="ebnf-def">${esc(name)}</a>` +
      seeAlsoFor(name, currentPath, defs) +
      gap +
      spanEsc('ebnf-op', op) +
      renderRhs(rest, currentPath, defs)
    );
  }

  // Continuation / RHS-only line.
  return renderRhs(line, currentPath, defs);
}

// Tokenise an RHS fragment and emit highlighted/linked HTML.
function renderRhs(text, currentPath, defs) {
  // Token regex (alternation is order-sensitive: longer / more specific
  // alternatives first):
  //   - string literal: "..."  (double-quoted, no escapes for now)
  //   - line comment fragment (only if a // appears mid-line, rare)
  //   - operator: ::= or :::
  //   - meta: | * + ? = ( ) [ ] < > , ; :
  //   - constructor form: lower_snake_case immediately followed by `(`
  //   - identifier: UpperCamelCase or lower_snake_case (handled separately)
  const TOK = /"(?:[^"\\]|\\.)*"|\/\/.*$|::=|:::|[A-Z][A-Za-z0-9]*|[a-z_][A-Za-z0-9_]*|[|*+?=(){}\[\]<>,;:]|\s+|./g;
  let out = '';
  let m;
  TOK.lastIndex = 0;
  while ((m = TOK.exec(text)) !== null) {
    const t = m[0];
    if (/^\s+$/.test(t)) {
      out += t;
    } else if (t === '"' || (t.length > 1 && t[0] === '"' && t[t.length - 1] === '"')) {
      out += spanEsc('ebnf-string', t);
    } else if (t.startsWith('//')) {
      out += spanEsc('ebnf-comment', t);
    } else if (t === '::=' || t === ':::') {
      out += spanEsc('ebnf-op', t);
    } else if (/^[|*+?]$/.test(t)) {
      out += spanEsc('ebnf-meta', t);
    } else if (/^[(){}\[\]<>,;:=]$/.test(t)) {
      out += spanEsc('ebnf-punct', t);
    } else if (/^[A-Z][A-Za-z0-9]*$/.test(t)) {
      // UpperCamelCase identifier — link if known.
      // For file-scoped pages (e.g. wire-grammar.md), only link to defs
      // defined within the same file; cross-file refs render as plain
      // text. The prose-pinned leaves (SemanticVersion, IriString,
      // Bcp47Tag, etc.) have no EBNF LHS but are documented in
      // grammar.md §Primitive String Types — link them there so they
      // don't appear as unresolved identifiers.
      const target = resolveDef(t, currentPath, defs);
      const fileScoped = FILE_SCOPED_FILES.has(currentPath);
      const inScope = target && (!fileScoped || target.path === currentPath);
      if (inScope) {
        const href = linkHref(currentPath, target);
        out += `<a class="ebnf-ref" href="${href}">${esc(t)}</a>`;
      } else if (PROSE_PINNED_LEAVES.has(t)) {
        // Resolves to grammar.md §Primitive String Types regardless
        // of currentPath; the leaves are global.
        out += `<a class="ebnf-ref" href="${PROSE_PINNED_LEAVES_HREF}">${esc(t)}</a>`;
      } else {
        out += `<span class="ebnf-ident">${esc(t)}</span>`;
      }
    } else if (/^[a-z_][A-Za-z0-9_]*$/.test(t)) {
      // lower_snake_case — constructor form name or wire-grammar primitive
      // (string, number, object, array, nonEmptyArray, …). Style as
      // ebnf-ctor; CSS can decide whether to colour primitives differently
      // by listing them.
      out += spanEsc('ebnf-ctor', t);
    } else {
      out += esc(t);
    }
  }
  return out;
}

function linkHref(currentPath, def) {
  // mdBook serves chapter X.md as X.html. If the def is in the same file,
  // emit a fragment-only link; otherwise emit a relative path link.
  if (def.path === currentPath) {
    return `#${def.anchor}`;
  }
  // Both paths are relative to the book src root and share the same depth
  // (flat `spec/` layout), so we can just swap extensions.
  return def.path.replace(/\.md$/, '.html') + `#${def.anchor}`;
}

// ----- HTML escaping --------------------------------------------------------

function esc(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function spanEsc(cls, s) {
  return `<span class="${cls}">${esc(s)}</span>`;
}
