import React, { useMemo } from "react";
import { WorkloadClientAPI } from "@ms-fabric/workload-client";

import { WizardControl, WizardStep } from "../../components";
import { AzureResourceManagerClient } from "../../clients";
import { StreamMigratorItemDefinition } from "./StreamMigratorItemDefinition";
import { MigratorWizardContext, WIZARD_STEP_IDS, asMigratorContext } from "./steps/WizardContext";
import { getMigrationReadiness } from "./steps/readiness";
import { SelectJobStep } from "./steps/SelectJobStep";
import { AssessmentStep } from "./steps/AssessmentStep";
import { ConnectionsStep } from "./steps/ConnectionsStep";
import { TargetsStep } from "./steps/TargetsStep";
import { ReviewStep } from "./steps/ReviewStep";
import "./StreamMigratorItem.scss";

export interface StreamMigratorItemDefaultViewProps {
  workloadClient: WorkloadClientAPI;
  definition?: StreamMigratorItemDefinition;
  onWizardComplete: (context: MigratorWizardContext) => void;
  onWizardCancel: () => void;
}

/**
 * Hosts the migration wizard.
 *
 * WizardControl owns step navigation and the shared context object; the clients
 * are seeded into that context so steps can reach them without prop drilling
 * through an API that only passes Record<string, any>.
 */
export function StreamMigratorItemDefaultView({
  workloadClient,
  definition,
  onWizardComplete,
  onWizardCancel
}: StreamMigratorItemDefaultViewProps) {
  const armClient = useMemo(() => new AzureResourceManagerClient(workloadClient), [workloadClient]);

  // Rehydrate previously saved selections so a reopened item does not start over.
  const initialContext = useMemo(() => {
    const connections: Record<string, string> = {};
    const connectionNames: Record<string, string> = {};
    for (const mapping of definition?.connections || []) {
      if (mapping.connectionId) {
        connections[mapping.asaInputName] = mapping.connectionId;
        connectionNames[mapping.asaInputName] = mapping.connectionDisplayName || "";
      }
    }

    const targets: Record<string, any> = {};
    const targetNames: Record<string, string> = {};
    for (const mapping of definition?.targets || []) {
      targets[mapping.asaOutputName] = {
        workspaceId: mapping.workspaceId,
        itemId: mapping.itemId,
        databaseName: mapping.databaseName,
        tableName: mapping.tableName,
        deltaTable: mapping.deltaTable
      };
      targetNames[mapping.asaOutputName] = mapping.itemDisplayName || "";
    }

    return {
      workloadClient,
      armClient,
      subscriptionId: definition?.subscriptionId,
      subscriptionDisplayName: definition?.subscriptionDisplayName,
      jobResourceId: definition?.jobResourceId,
      eventstreamName: definition?.eventstreamName,
      alreadyCreatedEventstreamId:
        definition?.createdEventstreamIds?.[0] || definition?.createdEventstreamId,
      connections,
      connectionNames,
      targets,
      targetNames
    };
  }, [workloadClient, armClient, definition]);

  const steps: WizardStep[] = [
    {
      id: WIZARD_STEP_IDS.SELECT_JOB,
      title: "Select job",
      description: "Pick the Stream Analytics job to migrate",
      component: SelectJobStep,
      validate: context => Boolean(asMigratorContext(context).job)
    },
    {
      id: WIZARD_STEP_IDS.ASSESSMENT,
      title: "Assessment",
      description: "What converts, what is approximated, what is blocked",
      component: AssessmentStep
    },
    {
      id: WIZARD_STEP_IDS.CONNECTIONS,
      title: "Connections",
      description: "Bind each source to a Fabric connection",
      component: ConnectionsStep
    },
    {
      id: WIZARD_STEP_IDS.TARGETS,
      title: "Destinations",
      description: "Choose where each output writes",
      component: TargetsStep
    },
    {
      id: WIZARD_STEP_IDS.REVIEW,
      title: "Review",
      description: "Confirm the generated Eventstream definition",
      component: ReviewStep
    }
  ];

  return (
    <WizardControl
      steps={steps}
      title="Migrate a Stream Analytics job"
      initialContext={initialContext}
      canFinish={(_currentStepId, context) =>
        getMigrationReadiness(asMigratorContext(context)).ready
      }
      onComplete={context => onWizardComplete(asMigratorContext(context))}
      onCancel={onWizardCancel}
      navigationLabels={{ complete: "Create Eventstream" }}
    />
  );
}
