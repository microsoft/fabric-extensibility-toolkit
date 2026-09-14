import { readFile } from 'node:fs/promises';
import { bundleFor } from './pipeline.mjs';
import { hashObject, sha256 } from './reader.mjs';

export async function loadFixtures() {
  const cases = JSON.parse(await readFile(new URL('./fixtures/cases.json', import.meta.url), 'utf8'));
  const corpus = JSON.parse(await readFile(new URL('./fixtures/corpus.json', import.meta.url), 'utf8'));
  return cases.map(customer => bundleFor(customer, corpus[customer.id].map(source => {
    const url = `fixture:${source.id}`;
    return {
      id: source.id, url, text: source.text, sha256: sha256(source.text),
      retrievedAt: '2026-09-14T00:00:00.000Z', complete: true, synthetic: true,
      card: {
        resource: 'Fabric Extensibility Toolkit', operation: 'synthetic policy test',
        interface: 'fixture only', authentication: null, inputs: null, results: null,
        limits: 'Not product documentation', version: source.version, source: url,
      },
    };
  })));
}

// Scripted behavior is deliberately separate from hidden evaluator labels.
// It tests orchestration and policy, not independent model reasoning.
export function mockAdapter(bundle) {
  const candidate = {
    schemaVersion: 1, bundleHash: bundle.bundleHash, decision: 'abstain',
    claims: [], questions: [], reasonCode: 'fixture_only', risks: [],
  };
  switch (bundle.customer.id) {
    case 'case-01':
      candidate.decision = 'suggest';
      candidate.claims = [{
        id: 'c1', text: 'For this fixture version, use StartDevServer.ps1 to start the development server.',
        evidence: [{ sourceId: 'startup', quote: 'For this fixture version, use StartDevServer.ps1 to start the development server.' }],
      }];
      break;
    case 'case-02':
      candidate.decision = 'clarify';
      candidate.questions = ['Which checkout SHA and environment file are you using?'];
      break;
    case 'case-03':
      candidate.decision = 'suggest';
      candidate.claims = [{
        id: 'c1', text: 'ShortcutCreationControl accepts mode A.',
        evidence: [{ sourceId: 'control-doc', quote: 'This fictional fixture says ShortcutCreationControl accepts mode A.' }],
      }];
      break;
    case 'case-04':
      candidate.decision = 'escalate';
      break;
    case 'case-05':
      candidate.decision = 'clarify';
      candidate.questions = ['What command, redacted error output, operating system and checkout SHA reproduce the failure?'];
      break;
    case 'case-06':
      candidate.decision = 'abstain';
      break;
    default:
      throw new Error('unknown_fixture');
  }
  return async stage => {
    if (stage === 'investigator') return JSON.stringify(candidate);
    const contradiction = bundle.customer.id === 'case-03';
    return JSON.stringify({
      schemaVersion: 1, bundleHash: bundle.bundleHash, candidateHash: hashObject(candidate),
      decision: contradiction ? 'escalate' : candidate.decision,
      approved: !contradiction, materialClaimsComplete: true,
      versionApplicable: Boolean(bundle.customer.version),
      contradictions: contradiction ? ['The two synthetic control contracts conflict.'] : [],
      safetyBlockers: bundle.customer.id === 'case-06' ? ['Credential exfiltration and instruction injection.'] : [],
      claims: candidate.claims.map(claim => ({ id: claim.id, supported: !contradiction, citationsValid: true })),
    });
  };
}
