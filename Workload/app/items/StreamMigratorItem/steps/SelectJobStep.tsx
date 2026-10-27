import React, { useEffect, useState } from "react";
import {
  Dropdown,
  Field,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Option,
  Spinner,
  Text
} from "@fluentui/react-components";

import { WizardStepProps } from "../../../components/Wizard/Wizard";
import { AzureResourceManagerError } from "../../../clients";
import { buildMigrationPlan } from "../migration";
import { asMigratorContext } from "./WizardContext";

/**
 * Step 1: choose the Stream Analytics job to migrate.
 *
 * Reads live from Azure Resource Manager, so this is also where a missing or
 * unconsented Azure Service Management permission surfaces.
 */
export function SelectJobStep({ wizardContext, updateContext }: WizardStepProps) {
  const context = asMigratorContext(wizardContext);
  const { armClient } = context;

  const [busy, setBusy] = useState<string>("");
  const [error, setError] = useState<string>("");

  function describeError(caught: any): string {
    if (caught instanceof AzureResourceManagerError) {
      if (caught.statusCode === 401 || caught.statusCode === 403) {
        return (
          `Azure denied the request (${caught.statusCode}). The workload's Entra app most ` +
          "likely lacks the Azure Service Management user_impersonation permission, or it " +
          "was added but never consented."
        );
      }
      return `${caught.statusCode} from Azure: ${caught.message}`;
    }
    return caught?.message || String(caught);
  }

  async function run(label: string, work: () => Promise<void>): Promise<void> {
    setBusy(label);
    setError("");
    try {
      await work();
    } catch (caught) {
      console.error(`Job selection failed during ${label}:`, caught);
      setError(describeError(caught));
    } finally {
      setBusy("");
    }
  }

  // Load subscriptions once when the step first appears.
  useEffect(() => {
    if (context.subscriptions) {
      return;
    }
    run("subscriptions", async () => {
      updateContext("subscriptions", await armClient.listSubscriptions());
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectSubscription = (subscriptionId: string, displayName: string) =>
    run("jobs", async () => {
      updateContext("subscriptionId", subscriptionId);
      updateContext("subscriptionDisplayName", displayName);
      updateContext("jobResourceId", undefined);
      updateContext("job", undefined);
      updateContext("plan", undefined);
      updateContext("jobs", await armClient.listStreamingJobs(subscriptionId));
    });

  const selectJob = (resourceId: string) =>
    run("job", async () => {
      const job = await armClient.getStreamingJobByResourceId(resourceId);
      // Selections restored from the saved item belong to that item's job. Keep
      // them when the same job is picked so the plan carries them; otherwise start
      // clean so another job's mappings cannot match by name.
      const sameJob = resourceId === context.jobResourceId;
      const connections = sameJob ? context.connections : {};
      const targets = sameJob ? context.targets : {};
      if (!sameJob) {
        updateContext("connections", connections);
        updateContext("connectionNames", {});
        updateContext("targets", targets);
        updateContext("targetNames", {});
      }
      updateContext("jobResourceId", resourceId);
      updateContext("job", job);
      updateContext("plan", buildMigrationPlan(job, { connections, targets }));
      if (!context.eventstreamName) {
        updateContext("eventstreamName", job.name);
      }
    });

  const subscriptions = context.subscriptions || [];
  const jobs = context.jobs || [];
  const selectedSubscription = subscriptions.find(s => s.subscriptionId === context.subscriptionId);
  const selectedJob = jobs.find(j => j.id === context.jobResourceId);

  return (
    <div className="stream-migrator__step">
      <Text as="p">
        Choose the Stream Analytics job to migrate. Its inputs, outputs and transformation
        query are read directly from Azure.
      </Text>

      <Field label="Subscription" className="stream-migrator__field">
        {busy === "subscriptions" ? (
          <Spinner size="tiny" label="Loading subscriptions..." />
        ) : (
          <Dropdown
            placeholder={
              subscriptions.length ? `${subscriptions.length} subscription(s)` : "No subscriptions"
            }
            value={selectedSubscription?.displayName || ""}
            selectedOptions={context.subscriptionId ? [context.subscriptionId] : []}
            onOptionSelect={(_, data) => {
              const match = subscriptions.find(s => s.subscriptionId === data.optionValue);
              selectSubscription(data.optionValue, match?.displayName || "");
            }}
          >
            {subscriptions.map(sub => (
              <Option key={sub.subscriptionId} value={sub.subscriptionId} text={sub.displayName}>
                {sub.displayName}
              </Option>
            ))}
          </Dropdown>
        )}
      </Field>

      <Field label="Stream Analytics job" className="stream-migrator__field">
        {busy === "jobs" ? (
          <Spinner size="tiny" label="Listing jobs..." />
        ) : (
          <Dropdown
            disabled={!context.subscriptionId}
            placeholder={jobs.length ? `${jobs.length} job(s)` : "No jobs in this subscription"}
            value={selectedJob?.name || ""}
            selectedOptions={context.jobResourceId ? [context.jobResourceId] : []}
            onOptionSelect={(_, data) => selectJob(data.optionValue)}
          >
            {jobs.map(job => (
              <Option key={job.id} value={job.id} text={job.name}>
                {job.name} ({job.location})
              </Option>
            ))}
          </Dropdown>
        )}
      </Field>

      {busy === "job" && <Spinner size="tiny" label="Reading job definition..." />}

      {context.job && (
        <div className="stream-migrator__summary">
          <Text as="p" weight="semibold">
            {context.job.name}
          </Text>
          <Text as="p">
            {`${(context.job.properties?.inputs || []).length} input(s), ` +
              `${(context.job.properties?.outputs || []).length} output(s), ` +
              `${(context.job.properties?.functions || []).length} function(s)`}
          </Text>
        </div>
      )}

      {error && (
        <MessageBar intent="error">
          <MessageBarBody>
            <MessageBarTitle>Could not read from Azure</MessageBarTitle>
            {error}
          </MessageBarBody>
        </MessageBar>
      )}
    </div>
  );
}
