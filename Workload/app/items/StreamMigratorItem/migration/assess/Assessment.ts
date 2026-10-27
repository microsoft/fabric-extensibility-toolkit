/**
 * Migration fidelity reporting.
 *
 * Every decision the mapping layer makes produces a finding, so the UI can
 * explain exactly what will happen to each part of a Stream Analytics job
 * before anything is created in Fabric. This is the honest half of the tool:
 * Eventstream supports only four destination types, so a meaningful share of
 * real jobs cannot be migrated faithfully, and saying so is more useful than
 * silently emitting a partial topology.
 */

/**
 * - `Mapped`: a faithful equivalent exists in Eventstream.
 * - `Approximated`: something is produced, but semantics differ and the user
 *   must confirm the result is acceptable.
 * - `Blocked`: no equivalent exists. The job cannot be migrated as-is.
 */
export type MappingStatus = "Mapped" | "Approximated" | "Blocked";

/** Which part of the ASA job a finding concerns. */
export type MappingScope = "Job" | "Input" | "Output" | "Query";

export interface MappingFinding {
  status: MappingStatus;
  scope: MappingScope;
  /** Name of the ASA input/output, or the job name for job-level findings. */
  asaName: string;
  /** The ASA datasource discriminator, when the finding concerns one. */
  asaType?: string;
  /** The Eventstream node type this became, when it became one. */
  targetType?: string;
  /** Why this status, in terms a user can act on. */
  reason: string;
}

export interface MigrationAssessment {
  jobName: string;
  findings: MappingFinding[];
  /** True when nothing is Blocked. Approximations do not block a migration. */
  canMigrate: boolean;
  counts: Record<MappingStatus, number>;
}

export function buildAssessment(jobName: string, findings: MappingFinding[]): MigrationAssessment {
  const counts: Record<MappingStatus, number> = { Mapped: 0, Approximated: 0, Blocked: 0 };
  for (const finding of findings) {
    counts[finding.status]++;
  }

  return {
    jobName,
    findings,
    canMigrate: counts.Blocked === 0,
    counts
  };
}

export function mapped(
  scope: MappingScope,
  asaName: string,
  asaType: string,
  targetType: string,
  reason: string
): MappingFinding {
  return { status: "Mapped", scope, asaName, asaType, targetType, reason };
}

export function approximated(
  scope: MappingScope,
  asaName: string,
  asaType: string,
  targetType: string,
  reason: string
): MappingFinding {
  return { status: "Approximated", scope, asaName, asaType, targetType, reason };
}

export function blocked(
  scope: MappingScope,
  asaName: string,
  asaType: string,
  reason: string
): MappingFinding {
  return { status: "Blocked", scope, asaName, asaType, reason };
}
