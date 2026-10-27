import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
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
import { ConnectionClient } from "../../../clients/ConnectionClient";
import { Connection } from "../../../clients/FabricPlatformTypes";
import { asaInputNameOf, buildMigrationPlan, planSources } from "../migration";
import { asMigratorContext } from "./WizardContext";
import { CreateConnectionDialog } from "./CreateConnectionDialog";

/**
 * Step 3: bind each mapped ASA input to a Fabric connection.
 *
 * ARM never returns Stream Analytics secrets, so credentials cannot be carried
 * over. The user picks an existing Fabric connection or creates one inline, with
 * the endpoint details prefilled from the ASA input so only the secret has to be
 * typed. Selections persist in the item definition, so re-running a migration
 * does not mean redoing this step.
 */
export function ConnectionsStep({ wizardContext, updateContext }: WizardStepProps) {
  const context = asMigratorContext(wizardContext);
  const connectionClient = useMemo(
    () => new ConnectionClient(context.workloadClient),
    [context.workloadClient]
  );

  const [connections, setConnections] = useState<Connection[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>("");
  /** ASA input name whose create-connection dialog is open, if any. */
  const [creatingFor, setCreatingFor] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    setBusy(true);
    connectionClient
      .getAllConnections()
      .then(result => {
        if (!cancelled) {
          setConnections(result);
        }
      })
      .catch(caught => {
        console.error("Failed to list Fabric connections:", caught);
        if (!cancelled) {
          setError(caught?.message || String(caught));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setBusy(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [connectionClient]);

  // Only inputs that actually produced a source node need a connection. A job
  // split into several Eventstreams has its sources spread across them, but each
  // ASA input still appears exactly once.
  const sources = planSources(context.plan);

  function assign(asaInputName: string, connectionId: string, displayName: string): void {
    const nextConnections = { ...(context.connections || {}), [asaInputName]: connectionId };
    const nextNames = { ...(context.connectionNames || {}), [asaInputName]: displayName };

    updateContext("connections", nextConnections);
    updateContext("connectionNames", nextNames);

    // Rebuild so the generated definition on the review step stays in step.
    if (context.job) {
      updateContext(
        "plan",
        buildMigrationPlan(context.job, {
          connections: nextConnections,
          targets: context.targets
        })
      );
    }
  }

  if (!context.plan) {
    return (
      <div className="stream-migrator__step">
        <Text as="p">Select a Stream Analytics job first.</Text>
      </div>
    );
  }

  if (sources.length === 0) {
    return (
      <div className="stream-migrator__step">
        <MessageBar intent="warning">
          <MessageBarBody>
            <MessageBarTitle>No sources to connect</MessageBarTitle>
            None of this job's inputs mapped to an Eventstream source. Review the assessment
            step for the reasons.
          </MessageBarBody>
        </MessageBar>
      </div>
    );
  }

  return (
    <div className="stream-migrator__step">
      <Text as="p">
        Stream Analytics credentials cannot be read from Azure, so each source needs a Fabric
        connection. Pick an existing one, or create a new one here with the endpoint details
        carried over from the job.
      </Text>

      {busy && <Spinner size="tiny" label="Loading connections..." />}

      {sources.map(source => {
        // Source nodes are named "<input>-source", sanitized and possibly
        // suffixed for uniqueness; recover the ASA input name.
        const asaInputName = asaInputNameOf(context.job, source.name);
        const selectedId = context.connections?.[asaInputName];
        const selectedName = context.connectionNames?.[asaInputName];

        const asaInput = (context.job?.properties?.inputs || []).find(
          input => input.name === asaInputName
        );

        return (
          <div key={source.name}>
            <Field
              label={`${asaInputName} (${source.type})`}
              className="stream-migrator__field"
              required
            >
              <div className="stream-migrator__row">
                <Dropdown
                  placeholder={
                    connections.length ? "Select a connection" : "No connections available"
                  }
                  value={selectedName || ""}
                  selectedOptions={selectedId ? [selectedId] : []}
                  onOptionSelect={(_, data) => {
                    const match = connections.find(c => c.id === data.optionValue);
                    assign(asaInputName, data.optionValue, match?.displayName || "");
                  }}
                >
                  {connections.map(connection => (
                    <Option
                      key={connection.id}
                      value={connection.id}
                      text={connection.displayName}
                    >
                      {connection.displayName} ({connection.connectionDetails?.type})
                    </Option>
                  ))}
                </Dropdown>
                <Button appearance="secondary" onClick={() => setCreatingFor(asaInputName)}>
                  New...
                </Button>
              </div>
            </Field>

            {creatingFor === asaInputName && (
              <CreateConnectionDialog
                connectionClient={connectionClient}
                eventstreamSourceType={source.type}
                asaInput={asaInput}
                suggestedDisplayName={`${context.job?.name || "asa"}-${asaInputName}`}
                onCancel={() => setCreatingFor("")}
                onCreated={connection => {
                  // Adopt it immediately so the user does not have to re-pick.
                  setConnections(prev => [connection, ...prev]);
                  assign(asaInputName, connection.id, connection.displayName);
                  setCreatingFor("");
                }}
              />
            )}
          </div>
        );
      })}

      {error && (
        <MessageBar intent="error">
          <MessageBarBody>
            <MessageBarTitle>Could not list connections</MessageBarTitle>
            {error}
          </MessageBarBody>
        </MessageBar>
      )}
    </div>
  );
}
