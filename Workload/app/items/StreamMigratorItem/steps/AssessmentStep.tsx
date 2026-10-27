import React from "react";
import {
  Badge,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Text
} from "@fluentui/react-components";

import { WizardStepProps } from "../../../components/Wizard/Wizard";
import { MappingStatus } from "../migration";
import { asMigratorContext } from "./WizardContext";
import { QueryAnalysisPanel } from "./QueryAnalysisPanel";

const STATUS_APPEARANCE: Record<MappingStatus, "success" | "warning" | "danger"> = {
  Mapped: "success",
  Approximated: "warning",
  Blocked: "danger"
};

/**
 * Step 2: the fidelity report.
 *
 * This is the step that makes the tool honest. Eventstream supports only four
 * destination types, so some jobs cannot be migrated faithfully - showing which
 * parts convert, which are approximated and which are blocked is more useful
 * than silently producing a partial topology.
 */
export function AssessmentStep({ wizardContext }: WizardStepProps) {
  const context = asMigratorContext(wizardContext);
  const plan = context.plan;

  if (!plan) {
    return (
      <div className="stream-migrator__step">
        <Text as="p">Select a Stream Analytics job first.</Text>
      </div>
    );
  }

  const { assessment } = plan;

  return (
    <div className="stream-migrator__step">
      <MessageBar intent={assessment.canMigrate ? "success" : "error"}>
        <MessageBarBody>
          <MessageBarTitle>
            {assessment.canMigrate
              ? "This job can be migrated"
              : "This job cannot be migrated as-is"}
          </MessageBarTitle>
          {`${assessment.counts.Mapped} mapped, ${assessment.counts.Approximated} approximated, ` +
            `${assessment.counts.Blocked} blocked.`}
          {!assessment.canMigrate &&
            " Resolve the blocked items in Azure, or migrate the rest of the job by hand."}
        </MessageBarBody>
      </MessageBar>

      <Table size="small" aria-label="Migration assessment findings">
        <TableHeader>
          <TableRow>
            <TableHeaderCell>Status</TableHeaderCell>
            <TableHeaderCell>Part</TableHeaderCell>
            <TableHeaderCell>Name</TableHeaderCell>
            <TableHeaderCell>Becomes</TableHeaderCell>
            <TableHeaderCell>Detail</TableHeaderCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assessment.findings.map((finding, index) => (
            <TableRow key={`${finding.scope}-${finding.asaName}-${index}`}>
              <TableCell>
                <Badge appearance="filled" color={STATUS_APPEARANCE[finding.status]}>
                  {finding.status}
                </Badge>
              </TableCell>
              <TableCell>{finding.scope}</TableCell>
              <TableCell>
                {finding.asaName}
                {finding.asaType ? (
                  <div className="stream-migrator__muted">{finding.asaType}</div>
                ) : null}
              </TableCell>
              <TableCell>{finding.targetType || "-"}</TableCell>
              <TableCell>{finding.reason}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {plan.queryAnalysis && <QueryAnalysisPanel analysis={plan.queryAnalysis} />}
    </div>
  );
}
