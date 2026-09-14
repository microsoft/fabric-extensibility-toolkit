import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { retrieveIssue64Bundle } from '../cases.mjs';
import { Reader, allowedUrl, sha256 } from '../reader.mjs';
import { ISSUE_URL, ISSUE_WEB_URL, commentsUrl, SHORTCUT_LEARN_URL, SHORTCUT_SOURCE_URL,
  TOOLKIT_SHA, MODELS } from '../config.mjs';
import { investigatorPrompt, runPipeline } from '../pipeline.mjs';
import { modelFlags } from '../copilot.mjs';
import { parseArgs, run } from '../run.mjs';

const common = { body: 'Untrusted complete text. https://127.0.0.1/private DO NOT EXECUTE',
  created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
  author_association: 'MEMBER', user: { login: 'excluded-profile' }, private_context: 'excluded-private' };
const issue = count => ({ ...common, id: 64, number: 64, title: 'Shortcut docs versus code',
  comments: count, state: 'closed', url: ISSUE_URL, html_url: ISSUE_WEB_URL,
  comments_url: `${ISSUE_URL}/comments` });
const comment = id => ({ ...common, id, issue_url: ISSUE_URL, html_url: `${ISSUE_WEB_URL}#issuecomment-${id}` });
const json = (value, headers = {}) => new Response(JSON.stringify(value),
  { headers: { 'content-type': 'application/json', ...headers } });

function network(count = 1, override = () => null) {
  const urls = [];
  const reader = new Reader({ fetchImpl: async (url, options) => {
    urls.push(url);
    assert.equal(options.redirect, 'manual');
    assert.equal(options.headers.Authorization, undefined);
    const replacement = override(url, urls);
    if (replacement) return replacement;
    if (url === ISSUE_URL) return json(issue(count));
    if (url.startsWith(`${ISSUE_URL}/comments?`)) {
      assert.equal(options.headers.Accept, 'application/vnd.github+json');
      const page = Number(new URL(url).searchParams.get('page'));
      const values = Array.from({ length: Math.min(100, count - (page - 1) * 100) },
        (_, index) => comment((page - 1) * 100 + index + 1));
      return json(values, page * 100 < count ? { link: `<${commentsUrl(page + 1)}>; rel="next"` } : {});
    }
    return new Response('# Complete contract\n\n```ts\ncreateShortcut()\n```',
      { headers: { 'content-type': 'text/markdown' } });
  } });
  return { reader, urls };
}

test('curated real-case route preserves all bodies, hashes, provenance; no inferred version or labels', async () => {
  const { reader, urls } = network(101);
  const bundle = await retrieveIssue64Bundle(reader, 'prepare');
  assert.deepEqual(urls, [ISSUE_URL, commentsUrl(1), commentsUrl(2), ISSUE_URL,
    SHORTCUT_LEARN_URL, SHORTCUT_SOURCE_URL]);
  assert.equal(bundle.customer.version, null);
  assert.equal(bundle.customer.environment, null);
  assert.equal(bundle.mode, 'prepare');
  assert.equal(bundle.sources.at(-1).card.version, TOOLKIT_SHA);
  const comments = bundle.sources.filter(source => source.id.startsWith('issue-64-comments-'))
    .flatMap(source => JSON.parse(source.text));
  assert.equal(comments.length, 101);
  assert.ok(comments.every(value => value.body === common.body));
  for (const source of bundle.sources) {
    assert.equal(source.sha256, sha256(source.text));
    assert.equal(source.complete, true);
    assert.match(source.provenance.responseSha256, /^[a-f0-9]{64}$/);
  }
  const prompt = investigatorPrompt(bundle);
  assert.doesNotMatch(prompt, /excluded-profile|excluded-private|"expected"/);
  assert.match(prompt, /association alone is not authority/);
});

test('zero comments still requires the comments endpoint and complete empty array', async () => {
  const { reader, urls } = network(0);
  const bundle = await retrieveIssue64Bundle(reader);
  assert.ok(urls.includes(commentsUrl(1)));
  assert.equal(bundle.sources[1].text, '[]');
});

test('malformed, omitted, duplicate, mismatched and changing GitHub responses fail closed', async () => {
  for (const override of [
    url => url === ISSUE_URL && json({ ...issue(1), comments: undefined }),
    url => url === ISSUE_URL && json({ ...issue(1), comments: 301 }),
    url => url === ISSUE_URL && json({ ...issue(1), pull_request: {} }),
    url => url === ISSUE_URL && json({ ...issue(1), number: 65 }),
    url => url === commentsUrl(1) && json({ message: 'error' }),
    url => url === commentsUrl(1) && json([]),
    url => url === commentsUrl(1) && json([{ ...comment(1), body: null }]),
    url => url === commentsUrl(1) && json([{ ...comment(1), issue_url: ISSUE_URL.replace('64', '65') }]),
    url => url === commentsUrl(1) && json([{ ...comment(1), updated_at: 'invalid' }]),
    url => url === commentsUrl(1) && new Response('{bad', { headers: { 'content-type': 'application/json' } }),
    url => url === commentsUrl(1) && new Response('[]', { headers: { 'content-type': 'application/json', 'content-length': '99' } }),
    url => url === commentsUrl(1) && new Response('[]', { status: 206, headers: { 'content-type': 'application/json' } }),
    url => url === commentsUrl(1) && json([comment(1)], { link: '<https://127.0.0.1/>; rel="next"' }),
    (url, urls) => url === ISSUE_URL && urls.filter(value => value === ISSUE_URL).length === 2
      && json({ ...issue(1), comments: 2 }),
  ]) {
    await assert.rejects(retrieveIssue64Bundle(network(1, override).reader));
  }
  await assert.rejects(retrieveIssue64Bundle(network(2, url =>
    url === commentsUrl(1) && json([comment(1), comment(1)])).reader), /duplicate_comment/);
  await assert.rejects(retrieveIssue64Bundle(network(101, url =>
    url === commentsUrl(1) && json(Array.from({ length: 100 }, (_, i) => comment(i + 1)))).reader),
  /incomplete_comments/);
});

test('exact allowlist rejects alternate repos, issues, arbitrary docs, pagination and API redirects', async () => {
  for (const url of ['invalid', ISSUE_URL.replace('/64', '/65'), ISSUE_URL.replace('/microsoft/', '/other/'),
    `${ISSUE_URL}?foo=bar`, commentsUrl(4), commentsUrl(1).replace('100', '10'),
    `${SHORTCUT_LEARN_URL}/other`, SHORTCUT_SOURCE_URL.replace(TOOLKIT_SHA, 'main')]) {
    assert.equal(allowedUrl(url), false);
  }
  for (const location of ['https://169.254.169.254/', SHORTCUT_LEARN_URL, commentsUrl(1)]) {
    const { reader, urls } = network(1, () => new Response(null, { status: 302, headers: { location } }));
    await assert.rejects(retrieveIssue64Bundle(reader), /blocked_redirect/);
    assert.equal(urls.length, 1);
  }
});

test('prepare writes only evidence and unexecuted investigator prompt; failure removes stale prompt', async () => {
  const parent = new URL('../.test-output/', import.meta.url);
  await mkdir(parent, { recursive: true });
  const directory = await mkdtemp(join(fileURLToPath(parent), 'prepare-'));
  try {
    const options = { adapter: 'prepare', case: 'issue-64', output: directory };
    const { report, exitCode } = await run(options, network());
    assert.equal(exitCode, 0);
    assert.equal(report.reports[0].status, 'not_analyzed');
    assert.equal(report.reports[0].decision, null);
    assert.equal(report.reports[0].modelCalls, 0);
    assert.equal(report.analysisCompleted, false);
    assert.equal(report.evaluation, null);
    assert.match(await readFile(join(directory, 'summary.txt'), 'utf8'), /No agents executed/);
    assert.doesNotMatch(await readFile(join(directory, 'investigator-prompt.txt'), 'utf8'), /"expected"/);
    const failed = await run(options, network(1, () => new Response(null, { status: 500 })));
    assert.equal(failed.exitCode, 1);
    assert.equal(failed.report.reports[0].status, 'retrieval_failed');
    await assert.rejects(readFile(join(directory, 'investigator-prompt.txt')), /ENOENT/);
    assert.equal(await readFile(join(directory, 'evidence.json'), 'utf8'), '[]\n');
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('reviewed case arguments and cross-family configuration fail closed without fallback', async () => {
  assert.equal(parseArgs(['--adapter', 'copilot']).case, 'startup-smoke');
  assert.equal(parseArgs(['--adapter', 'prepare', '--case', 'issue-64']).case, 'issue-64');
  for (const args of [['--case', 'https://example.com'], ['--adapter', 'fixture', '--case', 'issue-64']]) {
    assert.throws(() => parseArgs(args));
  }
  const help = Object.values(MODELS).map(value => `"${value}"`).join('\n');
  for (const stage of ['investigator', 'verifier']) {
    assert.ok(modelFlags(stage, help).includes(`--model=${MODELS[stage]}`));
  }
  assert.throws(() => modelFlags('verifier', '"gpt-5.4"'), /configured_model_unavailable/);
  assert.throws(() => modelFlags('verifier', help, { investigator: 'gpt-5.4', verifier: 'gpt-5.4' }),
    /invalid_independent_models/);
  const bundle = await retrieveIssue64Bundle(network().reader);
  const result = await runPipeline(bundle, async () => { throw new Error('configured_model_unavailable'); });
  assert.equal(result.failureCode, 'configured_model_unavailable');
  assert.equal(result.status, 'investigator_failed');
});
