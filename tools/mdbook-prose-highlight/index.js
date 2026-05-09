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

// Chapter paths whose prose we extend with the full structural
// palette: keywords, variables, property accesses, and string
// literals. Production-name colouring fires on every chapter and is
// not gated by this list. Adding a chapter here opts it in to the
// full set; useful for chapters with algorithm-style prose.
const EXTENDED_CHAPTERS = new Set(['validation.md']);

// Algorithm keywords we colour inside EXTENDED_CHAPTERS. The spec
// convention is that English-language uses of MUST/SHOULD/MAY are
// NOT in backticks, so this is naturally limited to the algorithm
// primitives (Run, Verify, Warn, Let) plus the rare backticked
// conformance keyword.
const KEYWORDS = new Set([
  // Algorithm primitives
  'Run', 'Verify', 'Warn', 'Let',
  // Set-builder / membership operators (English-language form)
  'is', 'in', 'else',
  // Conformance keywords (RFC 2119)
  'MUST', 'SHOULD', 'MAY',
  'MUST NOT', 'SHOULD NOT',
]);

// Recognition regexes. A backtick span's trimmed content is
// classified by trying these in order:
//
//   1. STRING_RE     — quoted JSON-style string literal.
//   2. PROP_RE       — property-access chain like `T.embedded_artifacts`
//                      or `M.versioning_metadata.status`. Lowercase head
//                      with at least one dot-accessor.
//   3. (production)  — the global UpperCamelCase set built from EBNF
//                      blocks; checked separately.
//   4. (keyword)     — the KEYWORDS set above.
//   5. VAR_RE        — single capital letter (`T`, `F`, `E`) or a plain
//                      lowercase identifier (`fields`, `keys`, `req`,
//                      `eff_min`).
//
// Any backtick span that matches none of these is left as a plain
// `<code>` span.
const STRING_RE = /^"[^"\n]*"$/;
const PROP_RE   = /^[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)+$/;
const VAR_RE    = /^(?:[A-Z]|[a-z_][a-z0-9_]*)$/;

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
  const extended = EXTENDED_CHAPTERS.has(ch.path);
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
    out.push(rewriteLine(line, productions, extended));
  }
  return out.join('\n');
}

// Rewrite plain backtick spans on one prose line.
//
// Pattern: ``…`` where neither immediate adjacency is `[` or `](`.
// We match a backtick span and inspect the preceding/following
// characters to decide whether to leave it alone.
function rewriteLine(line, productions, extended) {
  // Heading lines: leave most alone, but specialise subroutine
  // headings that match `name(arg: Type, ...)` so the parameter
  // names and types pick up the same colours used in the body.
  if (/^#{1,6}\s/.test(line)) {
    return rewriteHeading(line, productions, extended);
  }

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

    // Classify the span content. Order is most-specific first so that
    // an unambiguous match wins over a broader pattern (e.g. a
    // production name is preferred over the var-fallback for an
    // UpperCamelCase identifier — except productions only match if
    // the global productions set knows the name).
    let rendered = null;
    if (!insideLinkText) {
      const trimmed = inner.trim();
      if (extended && STRING_RE.test(trimmed)) {
        rendered = wrapPlain('ph-string', inner);
      } else if (extended && PROP_RE.test(trimmed)) {
        rendered = renderPropertyChain(inner, productions);
      } else if (extended && KEYWORDS.has(trimmed)) {
        rendered = wrapPlain('ph-keyword', inner);
      } else if (productions.has(trimmed)) {
        rendered = wrapPlain('ph-prod', inner);
      } else if (extended && VAR_RE.test(trimmed)) {
        rendered = wrapPlain('ph-var', inner);
      } else if (
        extended &&
        /[\s{}|,=≠≤≥∈∉∞]/.test(trimmed) &&
        !looksLikeRegexOrLiteral(trimmed)
      ) {
        // Compound expression — set-builder, membership predicate,
        // or other multi-token shape. Tokenize and classify per
        // token so identifiers within the expression pick up the
        // same colours they would standalone.
        rendered = renderCompoundExpression(inner, productions);
      }
    }

    if (rendered !== null) {
      out += rendered;
    } else {
      out += line.slice(i, closeIdx + runLen);
    }
    i = closeIdx + runLen;
  }
  return out;
}

function wrapPlain(cls, content) {
  return `<code class="${cls}">${escapeHtml(content)}</code>`;
}

// Decide whether a backtick span looks like a regex, URL pattern, or
// other literal that should NOT be tokenized as a compound algorithm
// expression. The compound-expression classifier expects tokens like
// `E.key | E ∈ T.embedded_artifacts`; it would misclassify a regex
// like `\d{4}` (treating `d` as a variable, `{4}` as braces).
function looksLikeRegexOrLiteral(s) {
  // Backslash escapes (\d, \., \w, \s, \\): regex metacharacters.
  if (/\\[dwsDWS.bnrt\\(){}[\]+*?|^$]/.test(s)) return true;
  // Character classes [...]: regex notation.
  if (/\[[^\]]+\]/.test(s)) return true;
  // {n} or {n,m} quantifiers (with no spaces between digits and brace).
  if (/\{\d+(?:,\d*)?\}/.test(s)) return true;
  // URL or URI pattern (scheme://...).
  if (/^[A-Za-z][A-Za-z0-9+.-]*:\/\//.test(s)) return true;
  return false;
}

// Tokenize a compound code-span (like a set-builder expression) and
// classify each token so identifiers within the expression pick up
// the same colours they would standalone.
//
// Examples:
//   { E.key | E ∈ T.embedded_artifacts, E is EmbeddedField }
//   FV.key ∈ field_keys
//   IV.key ∉ pc_keys
//
// The whole expression is wrapped in a single outer <code> wrapper
// so the existing code-span backround/font-family applies, and inner
// <code class="ph-..."> spans paint the per-token colours.
const COMPOUND_TOKEN = /"[^"\n]*"|[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)+|[A-Za-z_][A-Za-z0-9_]*|[0-9]+|[∈∉≤≥≠∞|{}(),:=]|\s+|./g;

function renderCompoundExpression(content, productions) {
  let out = '';
  COMPOUND_TOKEN.lastIndex = 0;
  let m;
  while ((m = COMPOUND_TOKEN.exec(content)) !== null) {
    const t = m[0];
    out += classifyToken(t, productions);
  }
  // We emit a <span> rather than a <code> wrapper so that pulldown-
  // cmark doesn't try to phrase-content-validate the inner <span>
  // tokens as if they were nested inside a code element. The
  // .ph-expr CSS class supplies the monospace styling and standard
  // code-span tinted background.
  return `<span class="ph-expr">${out}</span>`;
}

function classifyToken(t, productions) {
  // Whitespace: pass through.
  if (/^\s+$/.test(t)) return escapeHtml(t);
  // String literal.
  if (/^"[^"\n]*"$/.test(t)) return wrapInner('ph-string', t);
  // Property access (head + dotted tail).
  if (/^[A-Za-z_][A-Za-z0-9_]*\.[A-Za-z_][A-Za-z0-9_]*/.test(t)) {
    const m = /^([A-Za-z_][A-Za-z0-9_]*)(\..+)$/.exec(t);
    if (m) {
      const head = m[1];
      const tail = m[2];
      const headCls = productions.has(head) ? 'ph-prod' : 'ph-var';
      return wrapInner(headCls, head) + wrapInner('ph-prop', tail);
    }
  }
  // Identifier — production, keyword, or variable.
  if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(t)) {
    if (productions.has(t)) return wrapInner('ph-prod', t);
    if (KEYWORDS.has(t)) return wrapInner('ph-keyword', t);
    if (VAR_RE.test(t)) return wrapInner('ph-var', t);
    return escapeHtml(t);
  }
  // Number.
  if (/^[0-9]+$/.test(t)) return wrapInner('ph-string', t);
  // Set/math operator or punctuation.
  if (/^[∈∉≤≥≠∞|{}(),:=]$/.test(t)) return wrapInner('ph-punct', t);
  // Anything else: pass through unstyled.
  return escapeHtml(t);
}

// Wrap a token in an inner <span> for colour-only styling. We
// deliberately do not use a nested <code> because nesting <code>
// inside <code> is not well-formed HTML (pulldown-cmark warns
// about it). The outer <code class="ph-expr"> wrapper carries the
// monospace styling; these <span>s contribute the colour overlay.
function wrapInner(cls, content) {
  return `<span class="${cls}">${escapeHtml(content)}</span>`;
}

// Heading-line specialisation. Subroutine headings in
// `validation.md` look like:
//
//     ##### `validate_xxx(FT: TextFieldSpec)` {#fn-validate-xxx}
//
// where the whole `name(arg1: Type1, arg2: Type2)` is in a single
// backtick span. We want to colour the argument names like local
// variables and the type names like productions, matching the
// colouring used in the algorithm body. Anything else in headings
// is left untouched (heading boxes already provide visual structure).
const SUBROUTINE_HEADING_RE = /^(#{1,6}\s+)`([a-z_][a-z_0-9]*\([^`]*\))`(\s*\{#[^}]+\})?\s*$/;
const SUBROUTINE_BODY_RE = /^([a-z_][a-z_0-9]*)\(([^)]*)\)$/;

function rewriteHeading(line, productions, extended) {
  if (!extended) return line;
  const m = SUBROUTINE_HEADING_RE.exec(line);
  if (!m) return line;
  const prefix = m[1];                  // "##### "
  const inner = m[2];                   // "validate_xxx(FT: TextFieldSpec)"
  const anchor = m[3] || '';            // " {#fn-validate-xxx}"
  const bodyMatch = SUBROUTINE_BODY_RE.exec(inner);
  if (!bodyMatch) return line;
  const fnName = bodyMatch[1];
  const argList = bodyMatch[2].trim();
  const renderedArgs = renderArgList(argList, productions);
  // Emit the function name as a plain code span (will pick up the
  // heading-box styling via the heading anchor), and the parens with
  // each argument coloured.
  const html =
    `<code class="ph-fn">${escapeHtml(fnName)}</code>` +
    `<code class="ph-punct">(</code>` +
    renderedArgs +
    `<code class="ph-punct">)</code>`;
  return `${prefix}${html}${anchor}`;
}

function renderArgList(argList, productions) {
  if (argList === '') return '';
  // Split on commas; each piece is `name: Type` or just `name`.
  const pieces = argList.split(',').map((p) => p.trim());
  const rendered = pieces.map((p) => renderOneArg(p, productions));
  return rendered.join(`<code class="ph-punct">, </code>`);
}

function renderOneArg(piece, productions) {
  // `name: Type`
  const m = /^([A-Za-z_][A-Za-z0-9_]*)\s*:\s*([A-Za-z_][A-Za-z0-9_]*)$/.exec(piece);
  if (m) {
    const argName = m[1];
    const typeName = m[2];
    const typeCls = productions.has(typeName) ? 'ph-prod' : 'ph-var';
    return (
      `<code class="ph-var">${escapeHtml(argName)}</code>` +
      `<code class="ph-punct">: </code>` +
      `<code class="${typeCls}">${escapeHtml(typeName)}</code>`
    );
  }
  // Just `name` (rare).
  return `<code class="ph-var">${escapeHtml(piece)}</code>`;
}

// Render a property-access chain so the leading identifier picks up
// its own classification (production-name if known, else variable),
// and the dotted-accessor tail keeps the property colour. The eye can
// then track the leading binding (`E` in `E.artifactRef`) the same
// way it tracks a standalone `E`.
//
// Examples:
//   E.artifactRef                 -> [E:var][.artifactRef:prop]
//   FT.permissible_values         -> [FT:var][.permissible_values:prop]
//   M.versioning_metadata.status  -> [M:var][.versioning_metadata.status:prop]
//   ControlledTermFieldSpec.defaultValue
//                                 -> [ControlledTermFieldSpec:prod][.defaultValue:prop]
//                                    (or [..:var] if not a known production)
function renderPropertyChain(content, productions) {
  const m = /^([A-Za-z_][A-Za-z0-9_]*)(\..+)$/.exec(content);
  if (!m) return wrapPlain('ph-prop', content);  // shouldn't happen
  const head = m[1];
  const tail = m[2];
  const headCls = productions.has(head) ? 'ph-prod' : 'ph-var';
  return (
    `<code class="${headCls}">${escapeHtml(head)}</code>` +
    `<code class="ph-prop">${escapeHtml(tail)}</code>`
  );
}

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
