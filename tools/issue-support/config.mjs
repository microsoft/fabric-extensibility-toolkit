export const TOOLKIT_SHA = 'dacab1b391d03010ba61a0446126d05515c487f0';
export const CLI_VERSION = '1.0.83';
export const LEARN_URL = 'https://learn.microsoft.com/en-us/fabric/extensibility-toolkit/quickstart';
export const SOURCE_URL = `https://raw.githubusercontent.com/microsoft/fabric-extensibility-toolkit/${TOOLKIT_SHA}/scripts/Run/StartDevServer.ps1`;
export const SHORTCUT_LEARN_URL = 'https://learn.microsoft.com/en-us/fabric/extensibility-toolkit/how-to-create-shortcut';
export const SHORTCUT_SOURCE_URL = `https://raw.githubusercontent.com/microsoft/fabric-extensibility-toolkit/${TOOLKIT_SHA}/Workload/app/clients/OneLakeShortcutClient.ts`;
export const ISSUE_URL = 'https://api.github.com/repos/microsoft/fabric-extensibility-toolkit/issues/64';
export const ISSUE_WEB_URL = 'https://github.com/microsoft/fabric-extensibility-toolkit/issues/64';
export const COMMENT_PAGES = 3;
export const commentsUrl = page => `${ISSUE_URL}/comments?per_page=100&page=${page}`;
// Verified in installed CLI 1.0.84-3 `help config`; the pinned runtime rechecks.
export const VERIFIED_MODELS = Object.freeze(['gpt-5.4', 'claude-sonnet-4.6']);
export const MODELS = Object.freeze({ investigator: 'gpt-5.4', verifier: 'claude-sonnet-4.6' });
export const CASES = Object.freeze(['startup-smoke', 'issue-64']);
export const LIMITS = Object.freeze({
  pages: 8,
  requests: 10,
  bytesPerPage: 96 * 1024,
  totalBytes: 384 * 1024,
  timeoutMs: 15_000,
  modelTimeoutMs: 120_000,
  modelOutputBytes: 32 * 1024,
  promptBytes: 256 * 1024,
  modelCalls: 2,
  creditsPerCall: 30,
});
