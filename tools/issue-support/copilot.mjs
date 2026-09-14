import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { CLI_VERSION, LIMITS, MODELS, VERIFIED_MODELS } from './config.mjs';

export const CLI_FLAGS = Object.freeze([
  '--silent', '--stream=off', '--available-tools=',
  '--disable-builtin-mcps', '--no-custom-instructions', '--no-ask-user',
  '--deny-tool=shell', '--deny-tool=write', '--deny-tool=url',
  '--no-auto-update', '--no-remote', '--no-remote-export',
  '--log-level=none', '--no-color',
  `--max-ai-credits=${LIMITS.creditsPerCall}`,
]);

export function modelFlags(stage, configHelp, models = MODELS) {
  if (!['investigator', 'verifier'].includes(stage)
    || !VERIFIED_MODELS.includes(models.investigator) || !VERIFIED_MODELS.includes(models.verifier)
    || models.investigator.split('-')[0] === models.verifier.split('-')[0]) {
    throw new Error('invalid_independent_models');
  }
  for (const model of Object.values(models)) {
    if (!configHelp.includes(`"${model}"`)) throw new Error('configured_model_unavailable');
  }
  return [...CLI_FLAGS, `--model=${models[stage]}`];
}

export function runProcess(command, args, options, spawnImpl = spawn) {
  return new Promise((resolvePromise, reject) => {
    const child = spawnImpl(command, args, { ...options, shell: false, stdio: ['ignore', 'pipe', 'pipe'] });
    const chunks = [];
    let size = 0;
    let failure;
    const fail = message => {
      failure ??= new Error(message);
      child.kill('SIGKILL');
    };
    const timer = setTimeout(() => fail('model_timeout'), LIMITS.modelTimeoutMs);
    child.stdout.on('data', chunk => {
      size += chunk.length;
      if (size > LIMITS.modelOutputBytes) fail('model_output_budget');
      else chunks.push(chunk);
    });
    // Count but do not retain stderr: it can contain credentials or untrusted prose.
    child.stderr.on('data', chunk => {
      size += chunk.length;
      if (size > LIMITS.modelOutputBytes) fail('model_output_budget');
    });
    child.on('error', () => {
      clearTimeout(timer);
      reject(new Error('model_process_error'));
    });
    child.on('close', code => {
      clearTimeout(timer);
      if (failure) reject(failure);
      else if (code !== 0) reject(new Error('model_nonzero_exit'));
      else resolvePromise(Buffer.concat(chunks).toString('utf8').trim());
    });
  });
}

export function isolatedEnvironment(directory, environment) {
  return {
    PATH: environment.PATH,
    HOME: directory, USERPROFILE: directory, COPILOT_HOME: join(directory, 'state'),
    TMPDIR: directory, TMP: directory, TEMP: directory,
    CI: 'true', GITHUB_ACTIONS: 'true',
    GITHUB_TOKEN: environment.GITHUB_TOKEN,
    NO_COLOR: '1',
  };
}

export function validateActionsHost(environment, platform = process.platform) {
  if (environment.GITHUB_ACTIONS !== 'true'
    || environment.GITHUB_REPOSITORY !== 'microsoft/fabric-extensibility-toolkit'
    || environment.GITHUB_EVENT_NAME !== 'workflow_dispatch'
    || !environment.GITHUB_TOKEN || platform !== 'linux') {
    throw new Error('requires_manual_upstream_actions_run');
  }
}

export async function createCopilotAdapter(runtimeRoot, environment = process.env) {
  validateActionsHost(environment);
  const root = resolve(runtimeRoot);
  await mkdir(root, { recursive: true, mode: 0o700 });
  let calls = 0;
  return async (stage, prompt) => {
    const requiredStage = calls === 0 ? 'investigator' : 'verifier';
    if (stage !== requiredStage || ++calls > LIMITS.modelCalls) throw new Error('model_call_budget');
    if (Buffer.byteLength(prompt) > LIMITS.promptBytes) throw new Error('prompt_budget');
    const directory = await mkdtemp(join(root, `${stage}-`));
    const options = { cwd: directory, env: isolatedEnvironment(directory, environment) };
    try {
      // A different CLI release must never silently weaken the available-tools boundary.
      const version = await runProcess('copilot', ['--version'], options);
      if (!new RegExp(`(?:^|\\s)${CLI_VERSION.replaceAll('.', '\\.')}\\.?(?:\\s|$)`).test(version)) {
        throw new Error('cli_version_mismatch');
      }
      const help = await runProcess('copilot', ['--help'], options);
      for (const flag of CLI_FLAGS) {
        if (!help.includes(flag.split('=')[0])) throw new Error('cli_missing_guardrail');
      }
      const configHelp = await runProcess('copilot', ['help', 'config'], options);
      const flags = modelFlags(stage, configHelp);
      if (!help.includes('--model')) throw new Error('cli_missing_guardrail');
      return await runProcess('copilot', [...flags, '--prompt', prompt], options);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  };
}
