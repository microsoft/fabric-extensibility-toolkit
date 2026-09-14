import test from 'node:test';
import assert from 'node:assert/strict';
import { Reader, allowedUrl, sha256 } from '../reader.mjs';
import { LEARN_URL, SOURCE_URL } from '../config.mjs';
import { retrieveStartupBundle } from '../run.mjs';

const markdown = '# Contract\n\n| Property | Value |\n| --- | --- |\n| Input | Required |\n\n```pwsh\nnpm start\n```\n';
const response = (body = markdown) => new Response(body, { headers: { 'Content-Type': 'text/markdown' } });

test('markdown tables, headings and code are preserved, hashed and reused within a run', async () => {
  let calls = 0;
  const reader = new Reader({ fetchImpl: async (url, options) => {
    calls++;
    assert.equal(url, LEARN_URL);
    assert.equal(options.redirect, 'manual');
    assert.equal(options.headers.Accept, 'text/markdown');
    assert.ok(!('Authorization' in options.headers));
    return response();
  } });
  const first = await reader.read(LEARN_URL);
  assert.equal(first.text, markdown);
  assert.equal(first.sha256, sha256(markdown));
  assert.equal(first.complete, true);
  assert.ok(Number.isFinite(Date.parse(first.retrievedAt)));
  assert.deepEqual(await reader.read(LEARN_URL), first);
  assert.equal(calls, 1);
});

test('untrusted URLs, credentials, ports, hosts, schemes and source refs are blocked', async () => {
  const blocked = [
    'http://learn.microsoft.com/en-us/fabric/extensibility-toolkit/quickstart',
    'https://learn.microsoft.com.attacker.invalid/en-us/fabric/extensibility-toolkit/quickstart',
    'https://user:password@learn.microsoft.com/en-us/fabric/extensibility-toolkit/quickstart',
    'https://learn.microsoft.com:444/en-us/fabric/extensibility-toolkit/quickstart',
    'https://127.0.0.1/a', 'file:///etc/passwd',
    SOURCE_URL.replace(/\/[a-f0-9]{40}\//, '/main/'),
    `${LEARN_URL}?target=evil`,
  ];
  for (const url of blocked) assert.equal(allowedUrl(url), false);
  const reader = new Reader({ fetchImpl: () => assert.fail('must not fetch') });
  await assert.rejects(reader.read(blocked[0]), /blocked_url/);
});

test('all redirects fail before a second request', async () => {
  let calls = 0;
  const reader = new Reader({ fetchImpl: async () => {
    calls++;
    return new Response(null, { status: 302, headers: { location: 'https://attacker.invalid/' } });
  } });
  await assert.rejects(reader.read(LEARN_URL), /blocked_redirect/);
  assert.equal(calls, 1);
  const loop = new Reader({ limits: { requests: 2 }, fetchImpl: async () =>
    new Response(null, { status: 302, headers: { location: LEARN_URL } }) });
  await assert.rejects(loop.read(LEARN_URL), /blocked_redirect/);
  assert.equal(loop.requests, 1);
});

test('relative redirects are rejected rather than expanding reviewed routes', async () => {
  let calls = 0;
  const reader = new Reader({ fetchImpl: async () => ++calls === 1
    ? new Response(null, { status: 302, headers: { location: 'build-your-workload' } }) : response() });
  await assert.rejects(reader.read(LEARN_URL), /blocked_redirect/);
  assert.equal(calls, 1);
});

test('immutable toolkit source cannot redirect to mutable Learn content', async () => {
  let calls = 0;
  const reader = new Reader({ fetchImpl: async () => {
    calls++;
    return new Response(null, { status: 302, headers: { location: LEARN_URL } });
  } });
  await assert.rejects(reader.read(SOURCE_URL), /blocked_redirect/);
  assert.equal(calls, 1);
});

test('page, byte, total and invalid budget boundaries fail rather than truncate', async () => {
  const pages = new Reader({ limits: { pages: 1 }, fetchImpl: async () => response() });
  await pages.read(LEARN_URL);
  await assert.rejects(pages.read(SOURCE_URL), /page_budget/);
  const bytes = new Reader({ limits: { bytesPerPage: 12 }, fetchImpl: async () => response() });
  await assert.rejects(bytes.read(LEARN_URL), /byte_budget/);
  const total = new Reader({ limits: { totalBytes: 120 }, fetchImpl: async () => response() });
  await total.read(LEARN_URL);
  await assert.rejects(total.read(SOURCE_URL), /byte_budget/);
  assert.throws(() => new Reader({ limits: { requests: Infinity } }), /invalid_reader_budget/);
});

test('partial, truncated, empty, HTML, malformed encoding and failed responses are not evidence', async () => {
  for (const makeResponse of [
    () => response('[truncated]'), () => response('Content truncated'), () => response(' '),
    () => new Response('partial', { status: 206 }),
    () => new Response('<table><tr><td>value</td></tr></table>', { headers: { 'Content-Type': 'text/html' } }),
    () => new Response('missing', { status: 404 }),
    () => new Response('short', { headers: { 'Content-Type': 'text/markdown', 'Content-Length': '100' } }),
    () => new Response(new Uint8Array([0xc3, 0x28]), { headers: { 'Content-Type': 'text/markdown' } }),
  ]) {
    const reader = new Reader({ fetchImpl: async () => makeResponse() });
    await assert.rejects(reader.read(LEARN_URL));
    assert.equal(reader.cache.size, 0);
  }
});

test('timeout covers retrieval and reports unknown rather than unsupported', async () => {
  const reader = new Reader({ limits: { timeoutMs: 5 }, fetchImpl: async (_, { signal }) =>
    new Promise((_, reject) => signal.addEventListener('abort', () => reject(new Error('aborted')))) });
  await assert.rejects(reader.read(LEARN_URL), /retrieval_timeout/);
});

test('smoke retrieves only the fixed Learn page and immutable toolkit file', async () => {
  const urls = [];
  const reader = new Reader({ fetchImpl: async url => { urls.push(url); return response(); } });
  const bundle = await retrieveStartupBundle(reader);
  assert.deepEqual(urls, [LEARN_URL, SOURCE_URL]);
  assert.equal(bundle.mode, 'copilot');
  assert.equal(bundle.sources[0].card.version, null);
  assert.ok(bundle.sources.every(source => source.synthetic === false));
  assert.equal(bundle.sources[1].card.version, bundle.customer.version);
});
