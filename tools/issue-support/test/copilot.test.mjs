import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import { readFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CLI_FLAGS, createCopilotAdapter, isolatedEnvironment, runProcess, validateActionsHost } from '../copilot.mjs';
import { LIMITS } from '../config.mjs';
import { parseArgs, run } from '../run.mjs';

function fakeSpawn(code, stdout) {
  return (_, __, options) => {
    assert.equal(options.shell, false);
    const child = new EventEmitter();
    child.stdout = new PassThrough();
    child.stderr = new PassThrough();
    child.kill = () => { child.emit('close', null); };
    queueMicrotask(() => {
      child.stdout.write(stdout);
      child.stderr.write('secret token must not be reported');
      child.emit('close', code);
    });
    return child;
  };
}

test('CLI process rejects nonzero exits even when stdout contains valid JSON', async () => {
  await assert.rejects(runProcess('copilot', [], {}, fakeSpawn(1, '{"decision":"suggest"}')), /model_nonzero_exit/);
  assert.equal(await runProcess('copilot', [], {}, fakeSpawn(0, '{"decision":"abstain"}')), '{"decision":"abstain"}');
});

test('model output budget kills the child without retaining oversized output', async () => {
  await assert.rejects(runProcess('copilot', [], {}, fakeSpawn(0, 'x'.repeat(LIMITS.modelOutputBytes + 1))), /model_output_budget/);
});

test('model environment is allowlisted, tools disabled, no inherited PAT or provider settings', () => {
  const env = isolatedEnvironment('isolated', {
    PATH: 'bin', GITHUB_TOKEN: 'actions-token', GH_TOKEN: 'PAT',
    COPILOT_GITHUB_TOKEN: 'PAT', COPILOT_PROVIDER_BASE_URL: 'https://attacker.invalid',
    SECRET: 'secret', NODE_OPTIONS: '--require malicious.js', COPILOT_ALLOW_ALL: 'true',
  });
  assert.equal(env.GITHUB_TOKEN, 'actions-token');
  assert.equal(env.HOME, 'isolated');
  assert.equal(env.COPILOT_HOME, join('isolated', 'state'));
  for (const key of ['GH_TOKEN', 'COPILOT_GITHUB_TOKEN', 'COPILOT_PROVIDER_BASE_URL', 'SECRET', 'NODE_OPTIONS', 'COPILOT_ALLOW_ALL']) {
    assert.ok(!(key in env));
  }
  assert.ok(CLI_FLAGS.includes('--available-tools='));
  assert.ok(CLI_FLAGS.includes('--disable-builtin-mcps'));
  assert.ok(CLI_FLAGS.includes('--no-custom-instructions'));
  assert.ok(!CLI_FLAGS.some(flag => flag.startsWith('--allow')));
  assert.ok(!CLI_FLAGS.includes('--autopilot'));
});

test('local execution cannot initialize paid inference', async () => {
  for (const env of [
    {}, { GITHUB_ACTIONS: 'true', ISSUE_SUPPORT_PRIVATE_REPO: 'false', GITHUB_TOKEN: 'token' },
    { GITHUB_ACTIONS: 'true', ISSUE_SUPPORT_PRIVATE_REPO: 'true' },
  ]) {
    await assert.rejects(createCopilotAdapter('unused', env), /requires_manual_upstream_actions_run/);
  }
});

test('manual public upstream is allowed, forks and automatic events are rejected', () => {
  const env = {
    GITHUB_ACTIONS: 'true', GITHUB_REPOSITORY: 'microsoft/fabric-extensibility-toolkit',
    GITHUB_EVENT_NAME: 'workflow_dispatch', GITHUB_TOKEN: 'actions-token',
  };
  assert.doesNotThrow(() => validateActionsHost(env, 'linux'));
  for (const overrides of [
    { GITHUB_REPOSITORY: 'someone/fabric-extensibility-toolkit' },
    { GITHUB_EVENT_NAME: 'issue_comment' }, { GITHUB_EVENT_NAME: 'pull_request_target' },
    { GITHUB_TOKEN: '' }, { GITHUB_ACTIONS: 'false' },
  ]) assert.throws(() => validateActionsHost({ ...env, ...overrides }, 'linux'));
  assert.throws(() => validateActionsHost(env, 'win32'));
});

test('CLI rejects unknown/live modes and public issue URL arguments', () => {
  assert.equal(parseArgs([]).adapter, 'fixture');
  for (const args of [['--adapter', 'live'], ['--issue', 'https://github.com/issues/1'], ['--output'], ['--adapter', 'fixture', '--adapter', 'copilot']]) {
    assert.throws(() => parseArgs(args));
  }
});

test('offline run writes report/evidence, not model logs or publication actions', async () => {
  const parent = new URL('../.test-output/', import.meta.url);
  await mkdir(parent, { recursive: true });
  const directory = await mkdtemp(join(fileURLToPath(parent), 'report-'));
  try {
    const result = await run({ adapter: 'fixture', output: directory });
    assert.equal(result.exitCode, 0);
    const report = JSON.parse(await readFile(join(directory, 'report.json'), 'utf8'));
    assert.equal(report.livePhaseEnabled, false);
    assert.equal(report.publication, 'disabled');
    assert.equal(report.evaluation.status, 'provisional');
    assert.equal(report.evaluation.modelQualityMeasured, false);
    assert.equal(report.evaluation.cases.length, 6);
    assert.ok(report.evaluation.cases.every(item => item.passed));
    const evidence = await readFile(join(directory, 'evidence.json'), 'utf8');
    assert.ok(!evidence.includes('"expected"'));
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('workflow is manual, upstream-only, token-minimal and artifact-only', async () => {
  const workflow = await readFile(new URL('../../../.github/workflows/issue-support-pilot.yml', import.meta.url), 'utf8');
  assert.match(workflow, /workflow_dispatch:/);
  assert.doesNotMatch(workflow, /^\s+(?:issues|issue_comment|pull_request|pull_request_target|schedule|push):/m);
  assert.doesNotMatch(workflow, /(?:contents|issues|pull-requests): write/);
  assert.match(workflow, /copilot-requests: write/);
  assert.doesNotMatch(workflow, /\bPAT\b|secrets\.|gh issue|gh api|github-script/);
  assert.equal((workflow.match(/persist-credentials: false/g) || []).length, 2);
  assert.doesNotMatch(workflow, /repository\.private|ISSUE_SUPPORT_PRIVATE_REPO/);
  assert.equal((workflow.match(/github\.repository == 'microsoft\/fabric-extensibility-toolkit'/g) || []).length, 2);
  assert.match(workflow, /default: false/);
  assert.match(workflow, /type: choice/);
  assert.match(workflow, /SUPPORT_CASE: \$\{\{ inputs\.case \}\}/);
  assert.doesNotMatch(workflow, /run:.*\$\{\{ inputs\./);
  assert.match(workflow, /--adapter prepare --case "\$SUPPORT_CASE"/);
  assert.match(workflow, /--adapter copilot --case "\$SUPPORT_CASE"/);
  for (const use of workflow.matchAll(/uses: (\S+)/g)) assert.match(use[1], /@[a-f0-9]{40}$/);
});
