import React, { useMemo, useState } from "react";
import {
  Button,
  Divider,
  Dropdown,
  Field,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Option,
  Spinner
} from "@fluentui/react-components";
import { WorkloadAuthError } from "@ms-fabric/workload-client";

import { PageProps } from "../../App";
import {
  AsaStreamingJob,
  AzureResourceManagerClient,
  AzureResourceManagerError,
  AzureSubscription
} from "../../clients";

import "../Playground.scss";

/**
 * Smoke test for phase 1a of the Stream Analytics to Eventstream migrator.
 *
 * Proves the Azure Resource Manager path works from inside the Fabric iframe:
 * token acquisition for the management.azure.com audience, subscription
 * discovery, Stream Analytics job listing, and reading one job with its inputs,
 * outputs and transformation query expanded.
 *
 * This is a development harness, not the migrator UI. The real experience lives
 * in the StreamMigratorItem once the mapping engine exists.
 */
export function AsaMigrationSmokeTest({ workloadClient }: PageProps) {
  const armClient = useMemo(() => new AzureResourceManagerClient(workloadClient), [workloadClient]);

  const [busy, setBusy] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [subscriptions, setSubscriptions] = useState<AzureSubscription[]>([]);
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<string>("");
  const [jobs, setJobs] = useState<AsaStreamingJob[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [jobDetail, setJobDetail] = useState<AsaStreamingJob>(null);

  /** Turn whatever went wrong into something a developer can act on. */
  function describeError(caught: any): string {
    if (caught instanceof AzureResourceManagerError) {
      if (caught.statusCode === 401 || caught.statusCode === 403) {
        return (
          `${caught.statusCode} from ARM: ${caught.message}\n\n` +
          `Most likely the Entra app is missing the Azure Service Management ` +
          `user_impersonation permission, or it was added but never consented. ` +
          `Re-run scripts/Setup/CreateDevAADApp.ps1 and grant admin consent.`
        );
      }
      return `${caught.statusCode} from ARM: ${caught.message}` +
        (caught.correlationId ? `\ncorrelation id: ${caught.correlationId}` : "");
    }

    switch (caught?.error) {
      case WorkloadAuthError.WorkloadConfigError:
        return "Workload config error - check the AAD app configuration in your manifest or .env.dev.";
      case WorkloadAuthError.UserInteractionFailedError:
        return "User interaction failed - consent was likely dismissed. Try again and accept the prompt.";
      case WorkloadAuthError.UnsupportedError:
        return "Authentication is not supported in this environment.";
      default:
        return caught?.message || String(caught);
    }
  }

  async function run(label: string, work: () => Promise<void>): Promise<void> {
    setBusy(label);
    setError("");
    try {
      await work();
    } catch (caught) {
      console.error(`ASA smoke test failed during ${label}:`, caught);
      setError(describeError(caught));
    } finally {
      setBusy("");
    }
  }

  const loadSubscriptions = () =>
    run("subscriptions", async () => {
      const result = await armClient.listSubscriptions();
      setSubscriptions(result);
      setJobs([]);
      setJobDetail(null);
      setSelectedSubscriptionId("");
      setSelectedJobId("");
    });

  const loadJobs = (subscriptionId: string) =>
    run("jobs", async () => {
      const result = await armClient.listStreamingJobs(subscriptionId);
      setJobs(result);
      setJobDetail(null);
      setSelectedJobId("");
    });

  const loadJobDetail = (resourceId: string) =>
    run("job detail", async () => {
      setJobDetail(await armClient.getStreamingJobByResourceId(resourceId));
    });

  const selectedSubscription = subscriptions.find(s => s.subscriptionId === selectedSubscriptionId);
  const selectedJob = jobs.find(j => j.id === selectedJobId);

  return (
    <span>
      <Divider alignContent="start">Description</Divider>
      <div className="description">
        Phase 1a smoke test for the Stream Analytics migrator. Verifies that this workload can
        acquire a token for the management.azure.com audience and read Stream Analytics job
        definitions from Azure. Requires the Azure Service Management user_impersonation
        permission on the workload Entra app.
      </div>

      <Divider alignContent="start">1. Subscriptions</Divider>
      <div className="authButton">
        <Button appearance="primary" disabled={!!busy} onClick={loadSubscriptions}>
          List subscriptions
        </Button>
        {busy === "subscriptions" && <Spinner size="tiny" label="Calling ARM..." />}
      </div>

      {subscriptions.length > 0 && (
        <Field label="Subscription:" orientation="horizontal" className="field">
          <Dropdown
            placeholder={`${subscriptions.length} subscription(s) found`}
            value={selectedSubscription ? selectedSubscription.displayName : ""}
            selectedOptions={selectedSubscriptionId ? [selectedSubscriptionId] : []}
            onOptionSelect={(_, data) => {
              setSelectedSubscriptionId(data.optionValue);
              loadJobs(data.optionValue);
            }}
          >
            {subscriptions.map(sub => (
              <Option key={sub.subscriptionId} value={sub.subscriptionId} text={sub.displayName}>
                {sub.displayName} ({sub.state})
              </Option>
            ))}
          </Dropdown>
        </Field>
      )}

      {subscriptions.length === 0 && !busy && !error && (
        <div className="description">No subscriptions loaded yet.</div>
      )}

      <Divider alignContent="start">2. Stream Analytics jobs</Divider>
      {busy === "jobs" && <Spinner size="tiny" label="Listing jobs..." />}

      {selectedSubscriptionId && !busy && jobs.length === 0 && (
        <div className="description">
          No Stream Analytics jobs in this subscription.
        </div>
      )}

      {jobs.length > 0 && (
        <Field label="Job:" orientation="horizontal" className="field">
          <Dropdown
            placeholder={`${jobs.length} job(s) found`}
            value={selectedJob ? selectedJob.name : ""}
            selectedOptions={selectedJobId ? [selectedJobId] : []}
            onOptionSelect={(_, data) => {
              setSelectedJobId(data.optionValue);
              loadJobDetail(data.optionValue);
            }}
          >
            {jobs.map(job => (
              <Option key={job.id} value={job.id} text={job.name}>
                {job.name} ({job.location})
              </Option>
            ))}
          </Dropdown>
        </Field>
      )}

      <Divider alignContent="start">3. Expanded job definition</Divider>
      {busy === "job detail" && <Spinner size="tiny" label="Reading job..." />}

      {jobDetail && (
        <div className="section">
          <div className="description">
            {`inputs: ${(jobDetail.properties?.inputs || [])
              .map(i => `${i.name} [${i.properties?.datasource?.type || "unknown"}]`)
              .join(", ") || "none"}`}
          </div>
          <div className="description">
            {`outputs: ${(jobDetail.properties?.outputs || [])
              .map(o => `${o.name} [${o.properties?.datasource?.type || "unknown"}]`)
              .join(", ") || "none"}`}
          </div>
          <div className="description">
            {`functions: ${(jobDetail.properties?.functions || []).map(f => f.name).join(", ") || "none"}`}
          </div>
          <div className="description">
            {`out-of-order policy: ${jobDetail.properties?.eventsOutOfOrderPolicy || "n/a"} / ` +
              `${jobDetail.properties?.eventsOutOfOrderMaxDelayInSeconds ?? "n/a"}s, ` +
              `late arrival: ${jobDetail.properties?.eventsLateArrivalMaxDelayInSeconds ?? "n/a"}s`}
          </div>
          <div className="description">
            {`query:\n${jobDetail.properties?.transformation?.properties?.query || "(none)"}`}
          </div>
        </div>
      )}

      {error && (
        <MessageBar intent="error">
          <MessageBarBody>
            <MessageBarTitle>ARM call failed</MessageBarTitle>
            <div className="description">{error}</div>
          </MessageBarBody>
        </MessageBar>
      )}
    </span>
  );
}
