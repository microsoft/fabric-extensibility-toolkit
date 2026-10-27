/**
 * Shared shape of the migration wizard's context object.
 *
 * WizardControl passes context around as Record<string, any>, so this type plus
 * the accessor below keep the steps honest without fighting that API.
 */

import { WorkloadClientAPI } from "@ms-fabric/workload-client";
import {
  AsaStreamingJob,
  AzureResourceManagerClient,
  AzureSubscription
} from "../../../clients";
import { FabricTargetSelection, MigrationPlan } from "../migration";

export interface MigratorWizardContext {
  workloadClient: WorkloadClientAPI;
  armClient: AzureResourceManagerClient;

  /** Step 1: job selection. */
  subscriptions?: AzureSubscription[];
  subscriptionId?: string;
  subscriptionDisplayName?: string;
  jobs?: AsaStreamingJob[];
  jobResourceId?: string;
  job?: AsaStreamingJob;

  /** Step 3: ASA input name -> Fabric connection. */
  connections?: Record<string, string>;
  connectionNames?: Record<string, string>;

  /** Step 4: ASA output name -> Fabric target item. */
  targets?: Record<string, FabricTargetSelection>;
  targetNames?: Record<string, string>;

  /** Step 5. */
  eventstreamName?: string;

  /**
   * Set when this item has already produced an Eventstream. Completing the wizard
   * again creates a second one rather than updating it, so the review step warns.
   */
  alreadyCreatedEventstreamId?: string;

  /** Rebuilt whenever the job, connections or targets change. */
  plan?: MigrationPlan;
}

export function asMigratorContext(context: Record<string, any>): MigratorWizardContext {
  return context as MigratorWizardContext;
}

export const WIZARD_STEP_IDS = {
  SELECT_JOB: "select-job",
  ASSESSMENT: "assessment",
  CONNECTIONS: "connections",
  TARGETS: "targets",
  REVIEW: "review"
};
