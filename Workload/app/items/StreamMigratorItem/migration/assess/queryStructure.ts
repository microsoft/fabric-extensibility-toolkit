/**
 * Statement-level structure of a Stream Analytics query: its WITH steps, its
 * SELECT statements, what each one reads and writes, and how UNION splits them.
 *
 * A job with several stream inputs can only move to Eventstream if we know
 * which statements read which inputs, because Eventstream merges every source
 * into one default stream (see mapping/inputGroups.ts). This module answers
 * the "what reads what" half of that question.
 *
 * Like analyzeQuery, it scans maskQuery output rather than parsing, so every
 * span maps back onto the original text and can be cut out of it verbatim. It
 * recognizes the shapes ASA allows at the top level: an optional
 * `WITH step AS (...), ...` clause, then one or more SELECT statements, each of
 * which may be a UNION of branches.
 */

import { maskQuery } from "./queryMask";

export interface QuerySpan {
  start: number;
  end: number;
}

export interface QueryRead {
  keyword: "FROM" | "JOIN";
  /** The identifier as written, brackets removed. */
  name: string;
}

export interface QueryBranch {
  span: QuerySpan;
  reads: QueryRead[];
  /**
   * The branch with its INTO clause dropped and every identifier it reads (and
   * that identifier's alias) replaced by a placeholder. Two branches with equal
   * signatures do the same thing to different inputs. Keywords and identifiers
   * are upper-cased, since ASA is case-insensitive; string literals are kept
   * exactly, since `'east'` and `'west'` are not interchangeable.
   */
  signature: string;
}

export interface QuerySite {
  kind: "step" | "statement";
  /** The step name; empty for statements. */
  name: string;
  /** A step's `name AS ( ... )`, or a statement from its first SELECT to its last token. */
  span: QuerySpan;
  /** The part UNION splits: a step's body, or the whole statement. */
  body: QuerySpan;
  /** One entry when there is no UNION. */
  branches: QueryBranch[];
  reads: QueryRead[];
  /** INTO targets as written, brackets removed. */
  into: string[];
  hasJoin: boolean;
  /** 1-based line where the site starts. */
  line: number;
}

export interface QueryStructure {
  /** From WITH to the end of the last step, when the query has steps. */
  withSpan?: QuerySpan;
  steps: QuerySite[];
  statements: QuerySite[];
}

interface Token {
  /** Original text. */
  text: string;
  /** Upper-cased, for bare words only; empty otherwise. */
  word: string;
  start: number;
  end: number;
  /** Parenthesis depth; a matching "(" and ")" share a depth. */
  depth: number;
  /** A string literal (or one line of a multi-line one). */
  literal: boolean;
}

/** Fills string literals in the mask, so they occupy a span but never read as words. */
const LITERAL_FILL = "\u0001";

/** Words that can follow `FROM x` and are therefore not an alias. */
const NOT_AN_ALIAS = new Set([
  "TIMESTAMP", "WHERE", "GROUP", "HAVING", "PARTITION", "JOIN", "INNER", "LEFT", "RIGHT",
  "OUTER", "FULL", "CROSS", "ON", "UNION", "ALL", "SELECT", "INTO", "WITH", "ORDER", "LIMIT", "OVER"
]);

function tokenize(query: string): Token[] {
  const masked = maskQuery(query, LITERAL_FILL);
  const pattern = /\u0001+|\[[^\]]*\]|[A-Za-z_][A-Za-z0-9_]*|\S/g;
  const tokens: Token[] = [];
  let depth = 0;
  let match = pattern.exec(masked);

  while (match) {
    const raw = match[0];
    if (raw === ")") {
      depth = Math.max(0, depth - 1);
    }
    tokens.push({
      text: query.slice(match.index, match.index + raw.length),
      word: /^[A-Za-z_]/.test(raw) ? raw.toUpperCase() : "",
      start: match.index,
      end: match.index + raw.length,
      depth,
      literal: raw[0] === LITERAL_FILL
    });
    if (raw === "(") {
      depth++;
    }
    match = pattern.exec(masked);
  }

  return tokens;
}

function isIdentifier(token: Token | undefined): boolean {
  return Boolean(token && (token.word || token.text[0] === "["));
}

function identifierName(token: Token): string {
  return token.text.replace(/^\[|\]$/g, "");
}

function lineAt(query: string, offset: number): number {
  return query.slice(0, offset).split("\n").length;
}

/** FROM/JOIN reads, INTO targets and JOIN use among tokens[from, to). */
function scanRange(tokens: Token[], from: number, to: number) {
  const reads: QueryRead[] = [];
  const into: string[] = [];
  let hasJoin = false;

  for (let k = from; k < to; k++) {
    const word = tokens[k].word;
    const next = k + 1 < to ? tokens[k + 1] : undefined;
    if (word === "JOIN") {
      hasJoin = true;
    }
    if ((word === "FROM" || word === "JOIN") && isIdentifier(next)) {
      reads.push({ keyword: word, name: identifierName(next) });
    } else if (word === "INTO" && isIdentifier(next)) {
      into.push(identifierName(next));
    }
  }

  return { reads, into, hasJoin };
}

/** See QueryBranch.signature. */
function signatureOf(tokens: Token[], from: number, to: number, reads: QueryRead[]): string {
  const readNames = new Set(reads.map(read => read.name.toLowerCase()));
  const aliases = new Set<string>();
  /** The optional AS before an alias, which `FROM a x` and `FROM b AS y` may differ by. */
  const skipped = new Set<number>();

  // An alias follows the identifier a FROM/JOIN reads, optionally after AS.
  for (let k = from; k + 2 < to; k++) {
    if ((tokens[k].word === "FROM" || tokens[k].word === "JOIN") && isIdentifier(tokens[k + 1])) {
      const hasAs = tokens[k + 2].word === "AS";
      const candidate = hasAs && k + 3 < to ? tokens[k + 3] : tokens[k + 2];
      if (candidate.word && !NOT_AN_ALIAS.has(candidate.word)) {
        aliases.add(candidate.word);
        if (hasAs) {
          skipped.add(k + 2);
        }
      }
    }
  }

  const parts: string[] = [];
  for (let k = from; k < to; k++) {
    const token = tokens[k];
    if (skipped.has(k)) {
      continue;
    }
    if (token.word === "INTO" && isIdentifier(tokens[k + 1])) {
      k++;
      continue;
    }
    if (token.literal) {
      parts.push(token.text);
    } else if (isIdentifier(token)) {
      const name = identifierName(token);
      if (readNames.has(name.toLowerCase())) {
        parts.push("<source>");
      } else if (aliases.has(name.toUpperCase())) {
        parts.push("<alias>");
      } else {
        parts.push(name.toUpperCase());
      }
    } else {
      parts.push(token.text);
    }
  }
  return parts.join(" ");
}

/** Splits tokens[from, to) on UNION at `depth` and describes each branch. */
function branchesOf(tokens: Token[], from: number, to: number, depth: number): QueryBranch[] {
  const ranges: [number, number][] = [];
  let branchStart = from;

  for (let k = from; k < to; k++) {
    if (tokens[k].word === "UNION" && tokens[k].depth === depth) {
      ranges.push([branchStart, k]);
      branchStart = tokens[k + 1]?.word === "ALL" ? k + 2 : k + 1;
    }
  }
  ranges.push([branchStart, to]);

  return ranges
    .filter(([start, end]) => end > start)
    .map(([start, end]) => {
      const { reads } = scanRange(tokens, start, end);
      return {
        span: { start: tokens[start].start, end: tokens[end - 1].end },
        reads,
        signature: signatureOf(tokens, start, end, reads)
      };
    });
}

function site(
  query: string,
  tokens: Token[],
  kind: QuerySite["kind"],
  name: string,
  span: QuerySpan,
  bodyFrom: number,
  bodyTo: number,
  bodyDepth: number
): QuerySite {
  const { reads, into, hasJoin } = scanRange(tokens, bodyFrom, bodyTo);
  return {
    kind,
    name,
    span,
    body: { start: tokens[bodyFrom].start, end: tokens[bodyTo - 1].end },
    branches: branchesOf(tokens, bodyFrom, bodyTo, bodyDepth),
    reads,
    into,
    hasJoin,
    line: lineAt(query, span.start)
  };
}

export function parseQueryStructure(query: string): QueryStructure {
  const tokens = tokenize(query || "");
  const steps: QuerySite[] = [];
  const statements: QuerySite[] = [];
  let withSpan: QuerySpan | undefined;
  let k = 0;

  // ---- WITH step AS ( ... ), step AS ( ... ) ------------------------------
  if (tokens[0]?.word === "WITH") {
    k = 1;
    while (k + 2 < tokens.length) {
      const nameToken = tokens[k];
      const open = tokens[k + 2];
      if (!isIdentifier(nameToken) || tokens[k + 1].word !== "AS" || open.text !== "(") {
        break;
      }
      let close = k + 3;
      while (close < tokens.length && !(tokens[close].text === ")" && tokens[close].depth === open.depth)) {
        close++;
      }
      if (close >= tokens.length || close === k + 3) {
        break;
      }
      steps.push(
        site(
          query,
          tokens,
          "step",
          identifierName(nameToken),
          { start: nameToken.start, end: tokens[close].end },
          k + 3,
          close,
          open.depth + 1
        )
      );
      k = close + 1;
      if (tokens[k]?.text !== ",") {
        break;
      }
      k++;
    }
    if (steps.length > 0) {
      withSpan = { start: tokens[0].start, end: steps[steps.length - 1].span.end };
    }
  }

  // ---- top-level SELECT statements ----------------------------------------
  // A SELECT at depth 0 starts a statement, unless it follows UNION [ALL].
  let statementStart = -1;
  let previousWord = "";
  const close = (end: number) => {
    if (statementStart >= 0 && end > statementStart) {
      const span = { start: tokens[statementStart].start, end: tokens[end - 1].end };
      statements.push(site(query, tokens, "statement", "", span, statementStart, end, 0));
    }
  };

  for (; k < tokens.length; k++) {
    const token = tokens[k];
    if (token.depth !== 0 || !token.word) {
      continue;
    }
    if (token.word === "SELECT" && previousWord !== "UNION") {
      close(k);
      statementStart = k;
    }
    if (token.word !== "ALL") {
      previousWord = token.word;
    }
  }
  close(tokens.length);

  return { withSpan, steps, statements };
}

/**
 * The identifiers a site reads, expanded through the WITH steps it uses, and
 * the steps it uses along the way. Names are lower-cased.
 */
export function resolveReads(
  structure: QueryStructure,
  start: QuerySite
): { names: string[]; steps: QuerySite[] } {
  const stepsByName = new Map(structure.steps.map(step => [step.name.toLowerCase(), step]));
  const names = new Set<string>();
  const used: QuerySite[] = [];
  const visit = (current: QuerySite) => {
    for (const read of current.reads) {
      const name = read.name.toLowerCase();
      const step = stepsByName.get(name);
      if (step && step !== current) {
        if (used.indexOf(step) === -1) {
          used.push(step);
          visit(step);
        }
      } else if (!step) {
        names.add(name);
      }
    }
  };
  visit(start);
  return { names: Array.from(names), steps: used };
}

/** The site (step or statement) whose span contains `offset`. */
export function siteAt(structure: QueryStructure, offset: number): QuerySite | undefined {
  return [...structure.steps, ...structure.statements].find(
    candidate => candidate.span.start <= offset && offset < candidate.span.end
  );
}
