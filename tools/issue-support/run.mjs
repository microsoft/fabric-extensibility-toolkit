import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { bundleFor, runPipeline, investigatorPrompt } from './pipeline.mjs';
import { Reader } from './reader.mjs';
import { LEARN_URL, SOURCE_URL, TOOLKIT_SHA, CLI_VERSION, LIMITS, CASES, MODELS } from './config.mjs';
import { createCopilotAdapter } from './copilot.mjs';
import { retrieveIssue64Bundle } from './cases.mjs';

export async function retrieveStartupBundle(reader = new Reader(), mode = 'copilot') {
  const sources = [];
  // Maintainer-selected routes only. Customer URLs and branches are never dereferenced.
  for (const [id, url, version, operation, surface] of [
    ['learn-quickstart', LEARN_URL, null, 'start local workload', 'Microsoft Learn quickstart'],
    ['pinned-startup', SOURCE_URL, TOOLKIT_SHA, 'start local frontend', 'PowerShell script'],
  ]) {
    const page = await reader.read(url);
    sources.push({
      id, url: page.url, text: page.text, sha256: page.sha256,
      retrievedAt: page.retrievedAt, complete: page.complete, synthetic: false,
      card: {
        resource: 'Fabric Extensibility Toolkit', operation, interface: surface,
        authentication: null, inputs: null, results: null, limits: null,
        version, source: page.url,
      },
    });
  }
  return bundleFor({
    id: 'startup-smoke', title: 'How do I start the local frontend?',
    body: 'Setup is complete. At this exact checkout SHA, which script starts the local frontend? Do not run it or deploy anything.',
    version: TOOLKIT_SHA, environment: 'Windows, PowerShell 7, local development',
  }, sources, mode);
}

export function parseArgs(args) {
  const options = { adapter: 'fixture', case: 'startup-smoke', output: 'tools/issue-support/.reports' };
  const seen = new Set();
  for (let i = 0; i < args.length; i += 2) {
    const name = args[i].replace(/^--/, '');
    if (!args[i].startsWith('--') || !['adapter', 'output', 'case'].includes(name)
      || seen.has(name) || !args[i + 1] || args[i + 1].startsWith('--')) throw new Error('invalid_arguments');
    options[name] = args[i + 1];
    seen.add(name);
  }
  if (!['fixture', 'copilot', 'prepare'].includes(options.adapter)) throw new Error('invalid_adapter');
  if (!CASES.includes(options.case)) throw new Error('invalid_case');
  if (options.adapter === 'fixture' && seen.has('case')) throw new Error('fixture_runs_all_cases');
  return options;
}

export async function run(options, { reader = new Reader() } = {}) {
  const caseId = options.case ?? 'startup-smoke';
  if (!CASES.includes(caseId) || !['fixture', 'copilot', 'prepare'].includes(options.adapter)) {
    throw new Error('invalid_arguments');
  }
  const output = resolve(options.output);
  await mkdir(output, { recursive: true });
  await rm(join(output, 'investigator-prompt.txt'), { force: true });
  const reports = [];
  const bundles = [];
  let evaluation = null;
  if (options.adapter === 'fixture') {
    const { loadFixtures, mockAdapter } = await import('./fixtures.mjs');
    for (const bundle of await loadFixtures()) {
      bundles.push(bundle);
      reports.push(await runPipeline(bundle, mockAdapter(bundle)));
    }
    // Labels are loaded ONLY after both model stages have finished.
    const labels = JSON.parse(await readFile(new URL('./fixtures/expectations.json', import.meta.url), 'utf8'));
    evaluation = {
      status: labels.status, modelQualityMeasured: false,
      cases: reports.map(report => ({
        caseId: report.caseId, expected: labels.cases[report.caseId],
        actual: report.decision, passed: report.decision === labels.cases[report.caseId],
      })),
    };
  } else {
    let status = 'adapter_setup_failed';
    try {
      // Check the opt-in Actions boundary before performing any network retrieval.
      const adapter = options.adapter === 'copilot'
        ? await createCopilotAdapter(join(output, '.runtime')) : null;
      status = 'retrieval_failed';
      const bundle = caseId === 'issue-64' ? await retrieveIssue64Bundle(reader, options.adapter)
        : await retrieveStartupBundle(reader, options.adapter);
      bundles.push(bundle);
      if (adapter) reports.push(await runPipeline(bundle, adapter));
      else {
        reports.push({
          schemaVersion: 1, mode: 'prepare', caseId, bundleHash: bundle.bundleHash,
          decision: null, status: 'not_analyzed', modelCalls: 0,
          publication: 'disabled', claims: [], questions: [],
        });
        await writeFile(join(output, 'investigator-prompt.txt'), investigatorPrompt(bundle), { mode: 0o600 });
      }
    } catch {
      reports.push({
        schemaVersion: 1, mode: options.adapter, caseId,
        decision: 'abstain', status, publication: 'disabled', claims: [], questions: [],
      });
    }
  }
  const report = {
    schemaVersion: 1, adapter: options.adapter, generatedAt: new Date().toISOString(),
    publication: 'disabled', livePhaseEnabled: false,
    toolkitMainSnapshot: TOOLKIT_SHA, cliVersion: CLI_VERSION, limits: LIMITS,
    configuredModels: MODELS, analysisCompleted: options.adapter === 'copilot'
      && reports.some(item => item.candidateHash),
    reports, evaluation,
  };
  await writeFile(join(output, 'report.json'), `${JSON.stringify(report, null, 2)}\n`, { mode: 0o600 });
  await writeFile(join(output, 'evidence.json'), `${JSON.stringify(bundles, null, 2)}\n`, { mode: 0o600 });
  await writeFile(join(output, 'summary.txt'), reports.map(item =>
    `${item.caseId}: ${item.status}; publication disabled.${options.adapter === 'prepare'
      ? ' Evidence preparation only. No agents executed; no answer or accuracy result.' : ''}`).join('\n') + '\n',
  { mode: 0o600 });
  // Only counts reach Actions logs. No issue, source, or model prose is logged.
  const failed = reports.some(item => item.status.endsWith('_failed'))
    || evaluation?.cases.some(item => !item.passed);
  return { report, exitCode: failed ? 1 : 0 };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const { report, exitCode } = await run(parseArgs(process.argv.slice(2)));
    console.log(JSON.stringify({
      adapter: report.adapter, cases: report.reports.length,
      failed: Boolean(exitCode), publication: 'disabled',
    }));
    process.exitCode = exitCode;
  } catch {
    console.error('Issue-support pilot failed before reporting; no output was published.');
    process.exitCode = 1;
  }
}
