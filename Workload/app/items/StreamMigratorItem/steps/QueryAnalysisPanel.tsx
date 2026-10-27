import React, { useState } from "react";
import {
  Badge,
  Link,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Text
} from "@fluentui/react-components";

import { QueryAnalysis, QueryConstruct, QuerySupport } from "../migration";

const SUPPORT_LABEL: Record<QuerySupport, string> = {
  Supported: "Supported",
  NeedsReview: "Needs review",
  Unsupported: "Unsupported"
};

const SUPPORT_COLOR: Record<QuerySupport, "success" | "warning" | "danger"> = {
  Supported: "success",
  NeedsReview: "warning",
  Unsupported: "danger"
};

function constructKey(construct: QueryConstruct): string {
  return construct.rule.id;
}

/**
 * The SQL half of the assessment: every construct the query uses, whether the
 * Eventstream SQL operator supports it, where it appears, and the Microsoft
 * documentation the verdict rests on.
 */
export function QueryAnalysisPanel({ analysis }: { analysis: QueryAnalysis }) {
  const [issuesOnly, setIssuesOnly] = useState(false);
  const [selected, setSelected] = useState<string | undefined>();

  const { constructs, counts, lineSupport } = analysis;
  const visible = issuesOnly
    ? constructs.filter(construct => construct.rule.support !== "Supported")
    : constructs;
  const selectedLines = new Set(
    constructs.find(construct => constructKey(construct) === selected)?.occurrences.map(o => o.line) || []
  );
  const lines = (analysis.query || "").replace(/\r\n/g, "\n").split("\n");

  return (
    <section className="stream-migrator__query" aria-label="SQL query support">
      <div className="stream-migrator__query-header">
        <Text as="h3" weight="semibold" size={400}>
          SQL query support
        </Text>
        <div className="stream-migrator__query-counts">
          <Badge appearance="tint" color="success">{`${counts.Supported} supported`}</Badge>
          <Badge appearance="tint" color="warning">{`${counts.NeedsReview} needs review`}</Badge>
          <Badge appearance="tint" color="danger">{`${counts.Unsupported} unsupported`}</Badge>
        </div>
      </div>
      <Text as="p" className="stream-migrator__muted">
        {constructs.length > 0
          ? `Checked ${constructs.length} construct(s) against the Fabric Eventstream SQL operator. ` +
            "Each verdict links the Microsoft documentation it is based on. Select a construct to " +
            "see where it appears in the query."
          : "The query uses no windows, joins or functions that need special handling."}
      </Text>

      <pre className="stream-migrator__query-code" aria-label="Transformation query">
        {lines.map((text, index) => {
          const line = index + 1;
          const support = lineSupport[line];
          const classes = [
            "stream-migrator__query-line",
            support ? `stream-migrator__query-line--${support}` : "",
            selectedLines.has(line) ? "stream-migrator__query-line--selected" : ""
          ].join(" ");
          return (
            <div key={line} className={classes}>
              <span className="stream-migrator__query-gutter">{line}</span>
              <span>{text || " "}</span>
            </div>
          );
        })}
      </pre>

      {constructs.length > 0 && (
        <>
          <Switch
            checked={issuesOnly}
            label="Show only constructs that need attention"
            onChange={(_, data) => setIssuesOnly(!!data.checked)}
          />
          <Table size="small" aria-label="Query constructs">
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Construct</TableHeaderCell>
                <TableHeaderCell>Lines</TableHeaderCell>
                <TableHeaderCell>What it means</TableHeaderCell>
                <TableHeaderCell>Source</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map(construct => {
                const key = constructKey(construct);
                const occurrenceLines = Array.from(new Set(construct.occurrences.map(o => o.line)));
                return (
                  <TableRow
                    key={key}
                    className={selected === key ? "stream-migrator__query-row--selected" : undefined}
                    onClick={() => setSelected(selected === key ? undefined : key)}
                  >
                    <TableCell>
                      <Badge appearance="filled" color={SUPPORT_COLOR[construct.rule.support]}>
                        {SUPPORT_LABEL[construct.rule.support]}
                      </Badge>
                      {construct.rule.unverified && (
                        <div className="stream-migrator__muted">Unverified</div>
                      )}
                    </TableCell>
                    <TableCell>
                      {construct.rule.label}
                      <div className="stream-migrator__muted">{construct.rule.category}</div>
                    </TableCell>
                    <TableCell>{occurrenceLines.length > 0 ? occurrenceLines.join(", ") : "Job setting"}</TableCell>
                    <TableCell>{construct.rule.detail}</TableCell>
                    <TableCell>
                      <Link
                        href={construct.rule.docUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(event: React.MouseEvent) => event.stopPropagation()}
                      >
                        Microsoft Learn
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </>
      )}
    </section>
  );
}
