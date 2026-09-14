import test from 'node:test';
import assert from 'node:assert/strict';
import { loadFixtures, mockAdapter } from '../fixtures.mjs';
import { bundleFor, customerInput, gate, investigatorPrompt, runPipeline, validateCandidate, verifierPrompt } from '../pipeline.mjs';
import { hashObject } from '../reader.mjs';

const fixtures = await loadFixtures();
async function outputs(bundle = fixtures[0]) {
  const adapter = mockAdapter(bundle);
  const candidate = JSON.parse(await adapter('investigator'));
  const verifier = JSON.parse(await adapter('verifier'));
  return { candidate, verifier };
}

test('six provisional policy scenarios run without model inference', async () => {
  const expected = ['suggest', 'clarify', 'escalate', 'escalate', 'clarify', 'abstain'];
  for (const [index, bundle] of fixtures.entries()) {
    const result = await runPipeline(bundle, mockAdapter(bundle));
    assert.equal(result.decision, expected[index]);
    assert.equal(result.publication, 'disabled');
    assert.equal(result.mode, 'fixture');
    if (result.decision !== 'suggest') assert.deepEqual(result.claims, []);
  }
});

test('fully cited and independently approved candidate passes the fixture gate', async () => {
  const { candidate, verifier } = await outputs();
  assert.equal(gate(fixtures[0], candidate, verifier).decision, 'suggest');
});

test('missing, unknown and non-exact citations fail closed', async () => {
  for (const evidence of [[], [{ sourceId: 'not-found', quote: 'invented evidence' }],
    [{ sourceId: 'startup', quote: 'This exact text does not exist.' }]]) {
    const { candidate } = await outputs();
    candidate.claims[0].evidence = evidence;
    assert.throws(() => validateCandidate(candidate, fixtures[0]), /citation/);
    const result = await runPipeline(fixtures[0], async () => JSON.stringify(candidate));
    assert.equal(result.status, 'investigator_failed');
    assert.equal(result.decision, 'abstain');
  }
});

test('verifier contradiction, rejection and safety blockers cannot suggest', async () => {
  for (const [field, value, decision] of [
    ['contradictions', ['Other evidence conflicts.'], 'escalate'],
    ['safetyBlockers', ['Unsafe request.'], 'abstain'],
    ['approved', false, 'abstain'],
    ['materialClaimsComplete', false, 'abstain'],
  ]) {
    const { candidate, verifier } = await outputs();
    verifier[field] = value;
    assert.equal(gate(fixtures[0], candidate, verifier).decision, decision);
  }
});

test('all claims must be reviewed exactly once and supported', async () => {
  const { candidate, verifier } = await outputs();
  verifier.claims = [];
  assert.throws(() => gate(fixtures[0], candidate, verifier), /unreviewed_claim/);
  verifier.claims = [{ id: 'c1', supported: false, citationsValid: true }];
  assert.equal(gate(fixtures[0], candidate, verifier).decision, 'abstain');
});

test('malformed JSON, non-JSON fences and extra answer prose fail closed', async () => {
  for (const malformed of ['{', '```json\n{}\n```', '{"schemaVersion":1}', 'null']) {
    const result = await runPipeline(fixtures[0], async () => malformed);
    assert.equal(result.status, 'investigator_failed');
  }
  const { candidate } = await outputs();
  candidate.answer = 'An unreviewed claim outside the evidence schema.';
  assert.throws(() => validateCandidate(candidate, fixtures[0]), /invalid_schema/);
});

test('process failure never becomes a success-shaped fallback or leaks stderr', async () => {
  const { candidate } = await outputs();
  for (const failedStage of ['investigator', 'verifier']) {
    const result = await runPipeline(fixtures[0], async stage => {
      if (stage === failedStage) throw new Error('sensitive stdout and token');
      return JSON.stringify(candidate);
    });
    assert.equal(result.decision, 'abstain');
    assert.equal(result.status, `${failedStage}_failed`);
    assert.ok(!JSON.stringify(result).includes('sensitive'));
    assert.deepEqual(result.claims, []);
  }
});

test('bindings prevent candidate/verifier replay or changed source and customer inputs', async () => {
  const { candidate, verifier } = await outputs();
  verifier.candidateHash = '0'.repeat(64);
  assert.throws(() => gate(fixtures[0], candidate, verifier), /binding/);
  const changed = structuredClone(fixtures[0]);
  changed.customer.version = 'different';
  let calls = 0;
  const result = await runPipeline(changed, async () => { calls++; });
  assert.equal(result.status, 'input_failed');
  assert.equal(calls, 0);
  const corrupt = structuredClone(fixtures[0]);
  corrupt.sources[0].text += '\nnew facts';
  assert.throws(() => bundleFor(corrupt.customer, corrupt.sources), /invalid_evidence/);
});

test('unknown or mismatched version and synthetic evidence cannot enter real suggestions', async () => {
  for (const version of [null, 'old-release']) {
    const bundle = bundleFor({ ...fixtures[0].customer, version }, fixtures[0].sources);
    const { candidate, verifier } = await outputs(bundle);
    assert.notEqual(gate(bundle, candidate, verifier).decision, 'suggest');
  }
  const realMode = bundleFor(fixtures[0].customer, fixtures[0].sources, 'copilot');
  const { candidate, verifier } = await outputs(realMode);
  assert.equal(gate(realMode, candidate, verifier).status, 'synthetic_evidence');
});

test('evaluator labels and unexpected customer metadata never enter either prompt', async () => {
  const customer = {
    ...fixtures[0].customer, expected: 'LABEL_SENTINEL',
    evaluation: { decision: 'LABEL_SENTINEL' }, privateToken: 'SECRET_SENTINEL',
  };
  const bundle = bundleFor(customer, fixtures[0].sources);
  assert.deepEqual(customerInput(customer), fixtures[0].customer);
  const { candidate } = await outputs(bundle);
  for (const prompt of [investigatorPrompt(bundle), verifierPrompt(bundle, candidate)]) {
    assert.ok(!prompt.includes('LABEL_SENTINEL'));
    assert.ok(!prompt.includes('SECRET_SENTINEL'));
    assert.ok(!prompt.includes('"expected"'));
  }
});

test('verifier is a separate call with evidence and bound candidate, not investigator history', async () => {
  const { candidate, verifier } = await outputs();
  const calls = [];
  await runPipeline(fixtures[0], async (stage, prompt) => {
    calls.push({ stage, prompt });
    return JSON.stringify(stage === 'investigator' ? candidate : verifier);
  });
  assert.deepEqual(calls.map(call => call.stage), ['investigator', 'verifier']);
  assert.ok(calls[1].prompt.includes(hashObject(candidate)));
  assert.ok(calls[1].prompt.includes('Re-derive the answer'));
  assert.ok(!calls[0].prompt.includes('"candidateHash"'));
});
