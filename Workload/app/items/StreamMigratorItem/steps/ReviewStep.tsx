import React from "react";
import {
  Field,
  Input,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Text
} from "@fluentui/react-components";

import { WizardStepProps } from "../../../components/Wizard/Wizard";
import { asMigratorContext } from "./WizardContext";
import { getMigrationReadiness } from "./readiness";
import { bindPlan } from "../migration";

/**
 * Step 5: name the Eventstream and review the definition that will be created.
 *
 * The generated eventstream.json is shown verbatim. Completing the wizard saves
 * the plan and creates the Eventstream in this item's workspace. A job split
 * into independent pipelines creates one Eventstream per pipeline, each named
 * after the chosen name and its first input, and each is shown here.
 */
export function ReviewStep({ wizardContext, updateContext }: WizardStepProps) {
  const context = asMigratorContext(wizardContext);
  const plan = context.plan;

  if (!plan) {
    return (
      <div className="stream-migrator__step">
        <Text as="p">Select a Stream Analytics job first.</Text>
      </div>
    );
  }

  const readiness = getMigrationReadiness(context);
  const bound = bindPlan(plan, (context.eventstreamName || "").trim());
  const count = (pick: (es: typeof bound[0]) => unknown[]) =>
    bound.reduce((total, es) => total + pick(es).length, 0);

  return (
    <div className="stream-migrator__step">
      <Field
        label={bound.length > 1 ? "Eventstream name prefix" : "Eventstream name"}
        hint={
          bound.length > 1
            ? `This job runs ${bound.length} independent pipelines, so ${bound.length} Eventstreams ` +
              "are created, each named after this prefix and its input."
            : undefined
        }
        className="stream-migrator__field"
        required
      >
        <Input
          value={context.eventstreamName || ""}
          placeholder="Name for the new Eventstream item"
          onChange={(_, data) => updateContext("eventstreamName", data.value)}
        />
      </Field>

      {context.alreadyCreatedEventstreamId && (
        <MessageBar intent="warning">
          <MessageBarBody>
            <MessageBarTitle>This job has already been migrated</MessageBarTitle>
            Completing the wizard again creates an additional Eventstream rather than
            updating the existing one. Delete the previous Eventstream first if you meant
            to replace it.
          </MessageBarBody>
        </MessageBar>
      )}

      {readiness.ready ? (
        <MessageBar intent="success">
          <MessageBarBody>
            <MessageBarTitle>Ready to migrate</MessageBarTitle>
            {`Creating ${bound.length > 1 ? `these ${bound.length} Eventstreams` : "this Eventstream"} ` +
              `will add ${count(es => es.definition.sources)} source(s), ` +
              `${count(es => es.definition.operators)} operator(s) and ` +
              `${count(es => es.definition.destinations)} destination(s) to this workspace.`}
          </MessageBarBody>
        </MessageBar>
      ) : (
        <MessageBar intent="warning">
          <MessageBarBody>
            <MessageBarTitle>Not ready yet</MessageBarTitle>
            <ul className="stream-migrator__problems">
              {readiness.problems.map((problem, index) => (
                <li key={index}>{problem}</li>
              ))}
            </ul>
          </MessageBarBody>
        </MessageBar>
      )}

      {bound.map((es, index) => (
        <React.Fragment key={index}>
          <Text as="p" weight="semibold">
            {bound.length > 1
              ? `Generated eventstream.json for '${es.displayName}' (inputs: ${es.inputs.join(", ")})`
              : "Generated eventstream.json"}
          </Text>
          <pre className="stream-migrator__json">{JSON.stringify(es.definition, null, 2)}</pre>
        </React.Fragment>
      ))}
    </div>
  );
}
