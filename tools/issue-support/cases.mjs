import { bundleFor } from './pipeline.mjs';
import { Reader, sha256 } from './reader.mjs';
import { COMMENT_PAGES, ISSUE_URL, ISSUE_WEB_URL, commentsUrl,
  SHORTCUT_LEARN_URL, SHORTCUT_SOURCE_URL, TOOLKIT_SHA } from './config.mjs';

const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const date = value => typeof value === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/.test(value)
  && Number.isFinite(Date.parse(value));
const integer = value => Number.isSafeInteger(value) && value >= 0;
const association = value => ['COLLABORATOR', 'CONTRIBUTOR', 'FIRST_TIMER', 'FIRST_TIME_CONTRIBUTOR',
  'MANNEQUIN', 'MEMBER', 'NONE', 'OWNER'].includes(value);

function parse(page) {
  try { return JSON.parse(page.text); } catch { throw new Error('invalid_github_json'); }
}

function project(value, issue = false) {
  if (!object(value) || !integer(value.id) || typeof value.body !== 'string'
    || !date(value.created_at) || !date(value.updated_at) || !association(value.author_association)) {
    throw new Error('invalid_github_schema');
  }
  const result = {
    id: value.id, body: value.body, created_at: value.created_at,
    updated_at: value.updated_at, author_association: value.author_association,
  };
  if (issue) {
    if (value.number !== 64 || value.html_url !== ISSUE_WEB_URL || value.url !== ISSUE_URL
      || value.comments_url !== `${ISSUE_URL}/comments` || 'pull_request' in value
      || typeof value.title !== 'string' || !value.title.trim() || !value.body.trim()
      || !integer(value.comments) || !['open', 'closed'].includes(value.state)) {
      throw new Error('invalid_github_issue');
    }
    Object.assign(result, { number: 64, title: value.title, comments: value.comments, state: value.state,
      html_url: ISSUE_WEB_URL });
  } else {
    if (value.issue_url !== ISSUE_URL || value.html_url !== `${ISSUE_WEB_URL}#issuecomment-${value.id}`) {
      throw new Error('invalid_github_comment');
    }
    result.html_url = value.html_url;
  }
  return result;
}

function checkPagination(link, page, pages) {
  const relations = new Map();
  if (link) {
    for (const part of link.split(',')) {
      const match = part.trim().match(/^<([^>]+)>;\s*rel="(next|prev|first|last)"$/);
      if (!match || relations.has(match[2])) throw new Error('invalid_pagination');
      const allowed = Array.from({ length: pages }, (_, i) => commentsUrl(i + 1));
      if (!allowed.includes(match[1])) throw new Error('invalid_pagination');
      relations.set(match[2], match[1]);
    }
  }
  if (relations.get('next') !== (page < pages ? commentsUrl(page + 1) : undefined)
    || (relations.has('last') && relations.get('last') !== commentsUrl(pages))) {
    throw new Error('incomplete_comments');
  }
}

export function evidenceSource(id, page, operation, surface, version = null, projected = null) {
  const text = projected === null ? page.text : JSON.stringify(projected, null, 2);
  return {
    id, url: page.url, text, sha256: sha256(text), retrievedAt: page.retrievedAt,
    complete: page.complete, synthetic: false,
    provenance: {
      requestedUrl: page.requestedUrl, responseSha256: page.sha256, responseBytes: page.bytes,
      projection: projected === null ? 'Complete UTF-8 response' : 'Allowlisted GitHub fields; complete bodies, no user profiles',
    },
    card: {
      resource: 'Fabric Extensibility Toolkit', operation, interface: surface,
      authentication: null, inputs: null, results: null, limits: null, version, source: page.url,
    },
  };
}

export async function retrieveIssue64Bundle(reader = new Reader(), mode = 'copilot') {
  const issuePage = await reader.read(ISSUE_URL);
  const issue = project(parse(issuePage), true);
  const pages = Math.max(1, Math.ceil(issue.comments / 100));
  if (pages > COMMENT_PAGES) throw new Error('comment_page_budget');
  const sources = [evidenceSource('issue-64', issuePage, 'Reported shortcut question', 'GitHub issue', null, issue)];
  const ids = new Set();
  for (let page = 1; page <= pages; page++) {
    // Link headers are validated, never used as fetch targets.
    const response = await reader.read(commentsUrl(page));
    const values = parse(response);
    if (!Array.isArray(values) || values.length !== Math.min(100, issue.comments - (page - 1) * 100)) {
      throw new Error('incomplete_comments');
    }
    checkPagination(response.link, page, pages);
    const comments = values.map(value => project(value));
    for (const comment of comments) {
      if (ids.has(comment.id)) throw new Error('duplicate_comment');
      ids.add(comment.id);
    }
    sources.push(evidenceSource(`issue-64-comments-${page}`, response,
      'Historical discussion, possibly stale or conflicting; association is not authority',
      'GitHub comments', null, comments));
  }
  // Catch observable edits/count changes during pagination; REST has no atomic snapshot.
  reader.cache.delete(ISSUE_URL);
  const finalPage = await reader.read(ISSUE_URL);
  if (JSON.stringify(project(parse(finalPage), true)) !== JSON.stringify(issue)) throw new Error('issue_changed_during_read');
  sources.push(evidenceSource('issue-64-recheck', finalPage, 'Pagination consistency check', 'GitHub issue', null, issue));
  for (const [id, url, version, surface] of [
    ['learn-shortcut', SHORTCUT_LEARN_URL, null, 'Microsoft Learn shortcut guide'],
    ['pinned-shortcut-client', SHORTCUT_SOURCE_URL, TOOLKIT_SHA, 'OneLakeShortcutClient TypeScript source'],
  ]) {
    sources.push(evidenceSource(id, await reader.read(url), 'Create OneLake shortcuts', surface, version));
  }
  return bundleFor({
    id: 'issue-64', title: issue.title, body: issue.body, version: null, environment: null,
  }, sources, mode);
}
