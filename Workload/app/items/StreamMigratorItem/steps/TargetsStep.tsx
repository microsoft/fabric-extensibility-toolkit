import React from "react";
import {
  Button,
  Field,
  Input,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Text
} from "@fluentui/react-components";

import { WizardStepProps } from "../../../components/Wizard/Wizard";
import { callDatahubOpen } from "../../../controller/DataHubController";
import {
  FabricTargetSelection,
  asaOutputNameOf,
  buildMigrationPlan,
  planDestinations
} from "../migration";
import { asMigratorContext } from "./WizardContext";

/**
 * Step 4: choose the Fabric item each mapped ASA output writes into.
 *
 * ASA cannot tell us this - the Fabric items do not exist in Azure - so the user
 * picks an Eventhouse or Lakehouse via the Data hub. Table and database names are
 * prefilled from the ASA output where one was available.
 */
export function TargetsStep({ wizardContext, updateContext }: WizardStepProps) {
  const context = asMigratorContext(wizardContext);
  // An output written by several independent pipelines has a destination in each
  // of their Eventstreams; one target selection serves them all, so list it once.
  const destinations = planDestinations(context.plan).filter(
    (destination, index, all) =>
      all.findIndex(
        other => asaOutputNameOf(context.job, other.name) === asaOutputNameOf(context.job, destination.name)
      ) === index
  );

  function updateTarget(asaOutputName: string, patch: Partial<FabricTargetSelection>): void {
    const existing = context.targets?.[asaOutputName] || {};
    const nextTargets = {
      ...(context.targets || {}),
      [asaOutputName]: { ...existing, ...patch }
    };
    updateContext("targets", nextTargets);

    if (context.job) {
      updateContext(
        "plan",
        buildMigrationPlan(context.job, {
          connections: context.connections,
          targets: nextTargets
        })
      );
    }
  }

  async function pickTargetItem(asaOutputName: string, destinationType: string): Promise<void> {
    // An Eventhouse destination's itemId is the KQL database, not the Eventhouse:
    // Fabric resolves the cluster URL from the database item.
    const isEventhouse = destinationType === "Eventhouse";
    const supportedType = isEventhouse ? "KustoDatabase" : "Lakehouse";

    try {
      const result = await callDatahubOpen(
        context.workloadClient,
        [supportedType],
        `Select the ${isEventhouse ? "KQL database" : destinationType} to receive '${asaOutputName}'`,
        false
      );

      if (result) {
        updateTarget(asaOutputName, {
          workspaceId: result.workspaceId,
          itemId: result.id,
          ...(isEventhouse ? { databaseName: result.displayName } : {})
        });
        updateContext("targetNames", {
          ...(context.targetNames || {}),
          [asaOutputName]: result.displayName
        });
      }
    } catch (caught) {
      console.error("Data hub selection failed:", caught);
    }
  }

  if (!context.plan) {
    return (
      <div className="stream-migrator__step">
        <Text as="p">Select a Stream Analytics job first.</Text>
      </div>
    );
  }

  if (destinations.length === 0) {
    return (
      <div className="stream-migrator__step">
        <MessageBar intent="warning">
          <MessageBarBody>
            <MessageBarTitle>No destinations to configure</MessageBarTitle>
            None of this job's outputs mapped to an Eventstream destination. Review the
            assessment step for the reasons.
          </MessageBarBody>
        </MessageBar>
      </div>
    );
  }

  return (
    <div className="stream-migrator__step">
      <Text as="p">
        Choose where each output writes. Eventstream only writes to Eventhouse, Lakehouse,
        Activator or a custom endpoint, so these are the shapes available.
      </Text>

      {destinations.map(destination => {
        const asaOutputName = asaOutputNameOf(context.job, destination.name);
        const target = context.targets?.[asaOutputName] || {};
        const pickedName = context.targetNames?.[asaOutputName];
        const isEventhouse = destination.type === "Eventhouse";

        return (
          <div key={asaOutputName} className="stream-migrator__target">
            <Text as="p" weight="semibold">
              {`${asaOutputName} -> ${destination.type}`}
            </Text>

            <Field label="Target item" className="stream-migrator__field" required>
              <div className="stream-migrator__row">
                <Input readOnly value={pickedName || ""} placeholder="No item selected" />
                <Button
                  appearance="secondary"
                  onClick={() => pickTargetItem(asaOutputName, destination.type)}
                >
                  Browse...
                </Button>
              </div>
            </Field>

            {isEventhouse ? (
              <>
                <Field label="Database" className="stream-migrator__field" required>
                  <Input
                    value={target.databaseName || ""}
                    placeholder="KQL database name"
                    onChange={(_, data) =>
                      updateTarget(asaOutputName, { databaseName: data.value })
                    }
                  />
                </Field>
                <Field label="Table" className="stream-migrator__field" required>
                  <Input
                    value={target.tableName || ""}
                    placeholder="Destination table"
                    onChange={(_, data) => updateTarget(asaOutputName, { tableName: data.value })}
                  />
                </Field>
              </>
            ) : (
              <>
                <Field label="Delta table" className="stream-migrator__field" required>
                  <Input
                    value={target.deltaTable || ""}
                    placeholder="Destination delta table"
                    onChange={(_, data) => updateTarget(asaOutputName, { deltaTable: data.value })}
                  />
                </Field>
                <Field label="Schema (optional)" className="stream-migrator__field">
                  <Input
                    value={target.schema || ""}
                    placeholder="Leave blank for the default schema"
                    onChange={(_, data) => updateTarget(asaOutputName, { schema: data.value })}
                  />
                </Field>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
