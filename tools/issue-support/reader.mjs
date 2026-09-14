import { createHash } from 'node:crypto';
import { LIMITS, SOURCE_URL, LEARN_URL, SHORTCUT_SOURCE_URL, SHORTCUT_LEARN_URL,
  ISSUE_URL, COMMENT_PAGES, commentsUrl } from './config.mjs';

const jsonUrls = new Set([ISSUE_URL, ...Array.from({ length: COMMENT_PAGES }, (_, i) => commentsUrl(i + 1))]);
const textUrls = new Set([SOURCE_URL, LEARN_URL, SHORTCUT_SOURCE_URL, SHORTCUT_LEARN_URL]);

export const sha256 = value => createHash('sha256').update(value).digest('hex');
export const hashObject = value => sha256(JSON.stringify(value));

export function allowedUrl(value) {
  let url;
  try { url = new URL(value); } catch { return false; }
  if (url.protocol !== 'https:' || url.username || url.password || url.port) return false;
  return value === url.href && (jsonUrls.has(value) || textUrls.has(value));
}

export class Reader {
  constructor({ fetchImpl = fetch, limits = {} } = {}) {
    this.fetch = fetchImpl;
    this.limits = { ...LIMITS, ...limits };
    for (const key of ['pages', 'requests', 'bytesPerPage', 'totalBytes', 'timeoutMs']) {
      if (!Number.isSafeInteger(this.limits[key]) || this.limits[key] <= 0
        || this.limits[key] > LIMITS[key]) throw new Error('invalid_reader_budget');
    }
    this.requests = 0;
    this.pages = 0;
    this.bytes = 0;
    this.cache = new Map();
  }

  async read(initialUrl) {
    if (!allowedUrl(initialUrl)) throw new Error('blocked_url');
    if (this.cache.has(initialUrl)) return this.cache.get(initialUrl);
    if (++this.pages > this.limits.pages) throw new Error('page_budget');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.limits.timeoutMs);
    let url = initialUrl;
    try {
      while (true) {
        if (!allowedUrl(url)) throw new Error('blocked_redirect');
        if (++this.requests > this.limits.requests) throw new Error('request_budget');
        const response = await this.fetch(url, {
          redirect: 'manual',
          signal: controller.signal,
          headers: { Accept: jsonUrls.has(url) ? 'application/vnd.github+json' : 'text/markdown',
            'Accept-Encoding': 'identity', 'User-Agent': 'toolkit-issue-support-readonly' },
        });
        if ([301, 302, 303, 307, 308].includes(response.status)) {
          await response.body?.cancel();
          // Fixed routes never follow redirects, including redirects between allowed hosts.
          throw new Error('blocked_redirect');
        }
        if (!response.ok || response.status === 206) {
          await response.body?.cancel();
          throw new Error('retrieval_http_error');
        }
        const type = response.headers.get('content-type') || '';
        // HTML is not silently flattened: a dropped table is missing evidence.
        if (!(jsonUrls.has(url) ? /^application\/json(;|$)/i : /^text\/(markdown|plain)(;|$)/i).test(type)) {
          await response.body?.cancel();
          throw new Error('retrieval_requires_markdown');
        }
        const chunks = [];
        let size = 0;
        for await (const chunk of response.body) {
          size += chunk.length;
          this.bytes += chunk.length;
          if (size > this.limits.bytesPerPage || this.bytes > this.limits.totalBytes) {
            controller.abort();
            throw new Error('byte_budget');
          }
          chunks.push(chunk);
        }
        const text = new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks));
        const length = response.headers.get('content-length');
        if (length !== null && !response.headers.get('content-encoding')
          && (!/^\d+$/.test(length) || Number(length) !== size)) throw new Error('incomplete_evidence');
        if (!text.trim() || /(?:content truncated|<note>.*truncat|\[truncated\])/i.test(text)) {
          throw new Error('incomplete_evidence');
        }
        const result = {
          requestedUrl: initialUrl, url, text, bytes: size, link: response.headers.get('link'),
          sha256: sha256(text), retrievedAt: new Date().toISOString(), complete: true,
        };
        this.cache.set(initialUrl, result);
        return result;
      }
    } catch (error) {
      if (controller.signal.aborted && error.message !== 'byte_budget') {
        throw new Error('retrieval_timeout');
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }
}
