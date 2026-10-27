/**
 * Persisted state for a Stream Migrator item.
 *
 * Stored in Fabric as the item definition, so a migration can be revisited:
 * re-opening the item restores the selected job and, importantly, the connection
 * and target choices, which are the tedious part of the wizard to redo.
 */

/** A Fabric connection chosen for one ASA input. */
export interface MigrationConnectionMapping {
  asaInputName: string;
  connectionId?: string;
  connectionDisplayName?: string;
}

/** The Fabric item chosen to receive one ASA output. */
export interface MigrationTargetMapping {
  asaOutputName: string;
  workspaceId?: string;
  itemId?: string;
  itemDisplayName?: string;
  databaseName?: string;
  tableName?: string;
  deltaTable?: string;
}

export interface StreamMigratorItemDefinition {
  /** Azure coordinates of the source job. */
  subscriptionId?: string;
  subscriptionDisplayName?: string;
  jobResourceId?: string;
  jobName?: string;

  /** User selections gathered by the wizard. */
  connections?: MigrationConnectionMapping[];
  targets?: MigrationTargetMapping[];

  /** Name to give the Eventstream that will be created. */
  eventstreamName?: string;

  /** Summary of the last assessment, kept so the item can show status without a re-read. */
  lastAssessmentSummary?: {
    mapped: number;
    approximated: number;
    blocked: number;
    canMigrate: boolean;
    assessedAt: string;
  };

  /**
   * Set once the Eventstream has actually been created (phase 1d). For a job
   * split into several Eventstreams, the first one created.
   */
  createdEventstreamId?: string;
  /** Every Eventstream created, in plan order, when the job split into several. */
  createdEventstreamIds?: string[];
  migratedAt?: string;
}
