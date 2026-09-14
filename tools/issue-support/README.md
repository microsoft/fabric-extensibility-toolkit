# Issue-support pilot

Manual, report-only analysis of two reviewed evidence routes, plus six offline
policy fixtures. No publisher, issue creation, customer-code execution, Fabric
operations, arbitrary URL intake, or automatic issue triggers.

## Local commands

Node 20+; built-in modules only. Run from the repository root:

```powershell
node --test tools\issue-support\test
node tools\issue-support\run.mjs --adapter fixture --output tools\issue-support\.reports\fixtures
node tools\issue-support\run.mjs --adapter prepare --case issue-64 --output tools\issue-support\.reports\issue-64
node tools\issue-support\run.mjs --adapter prepare --case startup-smoke --output tools\issue-support\.reports\startup
```

`fixture` runs all six synthetic cases without network or inference. Labels in
`fixtures/expectations.json` are provisional and loaded only after both scripted
stages. Passing these scenarios tests plumbing and policy, **not model accuracy**.
The fictional fixture contracts are not verified product evidence.

`prepare` makes public, unauthenticated, read-only requests. No model, token or
Actions host is required. It writes:

- `evidence.json`: complete projected issue/comment bodies and source texts,
  evidence cards, SHA-256 hashes, timestamps and provenance.
- `investigator-prompt.txt`: an **unexecuted** prompt, without evaluation labels.
- `report.json` and `summary.txt`: explicitly **`not_analyzed`**, no decision,
  no answer, no claims and zero model calls.

A zero preparation exit code means evidence was prepared, **not that an answer
was validated**. Retrieval or validation failures return nonzero and never
substitute a fixture answer. Reusing the output directory removes an old prompt;
failed retrieval writes empty evidence. Console output contains counts/status
only, not customer or model prose. Treat all artifact strings as untrusted plain
text; never execute them or render them as unsanitized HTML.

## Reviewed evidence routes

`--case` accepts only `startup-smoke` (default for `copilot` and `prepare`) or
`issue-64`. Fixture mode always runs its whole suite and rejects `--case`.
Routes and budgets can change only through reviewed source configuration.

| Case | Fixed sources |
| --- | --- |
| `startup-smoke` | [Learn quickstart](https://learn.microsoft.com/en-us/fabric/extensibility-toolkit/quickstart) and `scripts/Run/StartDevServer.ps1` |
| `issue-64` | [Issue #64](https://github.com/microsoft/fabric-extensibility-toolkit/issues/64), all its comments, [Learn shortcut guide](https://learn.microsoft.com/en-us/fabric/extensibility-toolkit/how-to-create-shortcut), and `Workload/app/clients/OneLakeShortcutClient.ts` |

Both source files deliberately retain the maintainer-selected main snapshot
`dacab1b391d03010ba61a0446126d05515c487f0`, using immutable
`raw.githubusercontent.com` URLs in `config.mjs`. **This is neither current main
resolution nor a customer release version.** Learn is mutable and unversioned;
its timestamp and content hash record the retrieved revision.

Issue #64 is a genuine documentation/code discrepancy report. Its customer
title/body come from GitHub; missing customer version and environment remain
`null`. Historical comments may conflict or be stale. Author association and
closed issue state are not authority, expected labels or proof of resolution.
The narrow source file can demonstrate its own implementation, not prove a
component or npm package is absent everywhere.

GitHub REST access is restricted to the exact upstream repository's issue 64
endpoint and its comments endpoint with `per_page=100&page=1..3`. Pagination
links are validated, never followed as arbitrary targets. Expected count, page
sizes, next/last links, comment identity and duplicates are checked. Missing,
malformed, oversized or incomplete responses fail closed. Even zero comments
requires reading the comments endpoint. The issue is re-read after pagination
to detect observable changes. REST offers no atomic discussion snapshot;
concurrent comment edits not reflected in issue metadata can still escape this
check.

Only explicitly projected issue/comment fields enter evidence: full bodies,
title, IDs, state/count, creation/update times, canonical URLs and association.
User profiles and unrelated API fields are excluded. Each projection retains
the raw response hash/byte count and describes its projection; raw profile JSON
is not stored. Source text hashes cover the complete retained text. Customer
links, attachments and branches are never dereferenced, even when they match a
trusted-looking domain.

The reader accepts only exact HTTPS routes. **All redirects are rejected**,
including redirects to another allowed URL. No authorization headers are sent.
Markdown/plain-text retrieval preserves tables, headings and code; JSON routes
require JSON media type and schema validation. HTML, HTTP 206, invalid UTF-8,
content-length mismatch, truncation markers, empty responses, timeouts and byte
overruns fail rather than silently clipping evidence.

Evidence cards distinguish resource, operation, interface, authentication,
inputs, results, limits, version and source. Null card fields mean unknown,
not unsupported. Reading a complete response cannot prove that its author
included every relevant fact.

## Analysis and gate

In a manually dispatched upstream Actions run, the equivalent model command is:

```powershell
node tools\issue-support\run.mjs --adapter copilot --case issue-64 --output tools\issue-support\.reports\analysis
```

Local execution, fork repositories and non-manual events are rejected before retrieval or inference. Public upstream execution is allowed.
The adapter runs an investigator and a fresh-session verifier with the same
bundle and a hash-bound candidate. Both have **empty toolsets**; deterministic
retrieval alone supplies evidence. No model-requested crawling is available.

Maintainer-controlled `MODELS` selects investigator `gpt-5.4` and verifier
`claude-sonnet-4.6`. These exact identifiers were verified in installed CLI
`1.0.84-3` via `copilot help config`; `claude-sonnet-4.5` was not listed.
`VERIFIED_MODELS` is a reviewed allowlist, not a user input. The pinned Actions
CLI must advertise both configured models in its own config help before either
is invoked; otherwise it reports `configured_model_unavailable`. Same-family
configurations are rejected. Entitlement/process failures also fail closed,
with no fallback or retry. Independent model families can still share errors.

Strict candidate/verifier JSON schemas enforce exact quotes, source identities,
bundle/candidate hashes, and review of every claim. A suggestion requires:

- Applicable known customer version and matching versions for every citation.
- Verifier agreement and complete supported-claim coverage.
- No contradictions, safety blockers, unanswered questions or risks.
- Non-synthetic evidence on real routes.

Contradictions escalate; safety blockers, rejected verification and malformed
output abstain. Missing version prevents a suggestion. Unversioned Learn and
historical comments cannot independently satisfy exact-version applicability.
This conservative gate is intentional, not broad version-range reasoning.
Quotations and hashes prove provenance/integrity, not entailment or correctness.
Only gated claims/questions are rendered; rejected candidate prose is not an
answer. Prompt injection remains a model risk despite tool/publication denial.

## Manual Actions in the public repository

`.github/workflows/issue-support-pilot.yml` remains `workflow_dispatch` only.
Both jobs run only in `microsoft/fabric-extensibility-toolkit`, not forks.
No separate private repository is needed. Review and merge this workflow into
the default branch before dispatching it from the Actions UI.
**Treat all logs, prompts and report artifacts as public.** Only the fixed public
sources and synthetic fixtures may be supplied; do not add internal notes,
private documents, customer secrets or credentials to prompts or reports.
Reports are unreviewed automated analysis, not official customer guidance.

1. Choose `case` and leave `run_models: false`: tests, offline fixtures and
   no-inference preparation run. Inputs reach the command only via quoted env
   variables, not inline script interpolation.
2. Review artifacts and explicitly authorize spend/data handling.
3. Dispatch `run_models: true` for the selected route; fixtures must pass first.

Actions installs pinned `@github/copilot@1.0.83`. The adapter verifies version,
guardrail flags and model identifiers at runtime. It uses empty available
tools, disabled built-in MCPs/custom instructions, explicit shell/write/URL
denial, no remote export and isolated session/config directories outside the
checkout. These directories are removed after each invocation. Arbitrary
inherited environment, provider settings and PATs do not reach the CLI.

Only the model step receives `GITHUB_TOKEN`, for CLI inference authentication:
`contents: read` and `copilot-requests: write`, no issue/repository write scopes.
Retrieval never uses it. Checkout does not persist credentials; installation
receives no token. Artifacts expire after three days; retention is not an access
control or a guarantee that downloaded copies disappear. The organization
must permit [Copilot CLI billing in Actions](https://docs.github.com/en/copilot/how-tos/copilot-cli/use-copilot-cli-in-actions).
**Actual Actions authentication, entitlement, billing and runtime tool-denial
have not been tested.** Local help/mocks do not establish those properties.

Future generated-issue orchestration needs explicit dispatch: creating an issue
with a workflow's `GITHUB_TOKEN` does not trigger an `issues` workflow. Use an
explicit `workflow_dispatch`/`repository_dispatch` design if separately approved;
see [Triggering a workflow from a workflow](https://docs.github.com/en/actions/how-tos/writing-workflows/choosing-when-your-workflow-runs/triggering-a-workflow#triggering-a-workflow-from-a-workflow).
No generated-issue creation is implemented here.

## Limits and validation

| Resource | Reviewed maximum |
| --- | --- |
| Retrieval | 8 reads, 10 requests; at most 3 comment pages of 100 |
| Source bytes | 96 KiB per response, 384 KiB total |
| Retrieval timeout | 15 seconds per read including body |
| Prompt / process output | 256 KiB / 32 KiB combined stdout and stderr |
| Model calls | Investigator then verifier, at most 2, no retries |
| CLI process timeout | 120 seconds |
| AI credits | 30 per session, 60 combined soft cap, **not a hard billing ceiling** |
| Actions | 5-minute fixtures/preparation, 10-minute model job; one run at a time |

Oversized prompts fail; evidence is never clipped to fit. Credit accounting
happens after responses and can overshoot. Organization spend controls remain
necessary.

Tests exercise fixture gates, provenance, projection/label isolation, complete
pagination, JSON validation, redirected/SSRF targets, transport truncation,
budgets, environment isolation, model configuration and non-analysis reports.
Real unauthenticated preparation of issue #64 and both startup sources was run
locally; no analysts were executed. The remaining execution gate is a maintainer-
authorized manual upstream Actions run. Customer-answer quality still requires independent
adjudication before any rollout or publication design.
